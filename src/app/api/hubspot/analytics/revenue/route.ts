import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get HubSpot account
    const hubspotAccount = await prisma.hubspotAccount.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      }
    });

    if (!hubspotAccount) {
      throw new Error('No active HubSpot account found');
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'last30';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (dateRange) {
      case 'last7':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last30':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last90':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get all deals
    const deals = await prisma.hubspotDeal.findMany({
      where: {
        hubspotAccountId: hubspotAccount.id,
        createdAt: {
          gte: startDate
        }
      }
    });

    // Calculate revenue metrics
    const totalRevenue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
    const wonDeals = deals.filter(deal => deal.stage === 'closedwon');
    const wonRevenue = wonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
    const averageDealSize = deals.length > 0 ? totalRevenue / deals.length : 0;

    // Group deals by stage
    const dealsByStage = deals.reduce((acc, deal) => {
      const stage = deal.stage || 'unknown';
      if (!acc[stage]) {
        acc[stage] = {
          count: 0,
          value: 0
        };
      }
      acc[stage].count++;
      acc[stage].value += deal.amount || 0;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    // Calculate revenue over time
    const revenueOverTime = await Promise.all(
      Array.from({ length: 7 }).map(async (_, index) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - index));
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        const dailyDeals = await prisma.hubspotDeal.findMany({
          where: {
            hubspotAccountId: hubspotAccount.id,
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        });

        const newRevenue = dailyDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
        const wonDeals = dailyDeals.filter(deal => deal.stage === 'closedwon');
        const closedRevenue = wonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

        return {
          date: date.toISOString(),
          newRevenue,
          closedRevenue,
          deals: dailyDeals.length,
          wonDeals: wonDeals.length
        };
      })
    );

    // Calculate forecasted revenue (simple projection based on current pipeline)
    const pipelineValue = deals
      .filter(deal => deal.stage !== 'closedlost')
      .reduce((sum, deal) => sum + (deal.amount || 0), 0);

    const forecastedRevenue = pipelineValue * 0.7; // 70% of pipeline value as a simple forecast

    // Calculate revenue by source
    const revenueBySource = deals.reduce((acc, deal) => {
      const source = deal.source || 'Direct';
      if (!acc[source]) {
        acc[source] = {
          totalRevenue: 0,
          deals: 0,
          avgDealSize: 0
        };
      }
      acc[source].totalRevenue += deal.amount || 0;
      acc[source].deals++;
      acc[source].avgDealSize = acc[source].totalRevenue / acc[source].deals;
      return acc;
    }, {} as Record<string, { totalRevenue: number; deals: number; avgDealSize: number }>);

    return NextResponse.json({
      data: {
        summary: {
          totalRevenue,
          wonRevenue,
          averageDealSize,
          forecastedRevenue,
          totalDeals: deals.length,
          wonDeals: wonDeals.length,
          pipelineValue
        },
        dealsByStage,
        revenueOverTime,
        revenueBySource
      },
      success: true
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch revenue analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 