import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface AnalyticsMetrics {
  spend: number;
  conversions: number;
  clicks: number;
  impressions: number;
  revenue: number;
}

const defaultMetrics: AnalyticsMetrics = {
  spend: 0,
  conversions: 0,
  clicks: 0,
  impressions: 0,
  revenue: 0
};

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

    // Get deals from HubSpot
    const deals = await prisma.hubspotDeal.findMany({
      where: {
        hubspotAccountId: hubspotAccount.id,
        createdAt: {
          gte: startDate
        }
      }
    });

    // Get campaigns from Meta
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        analytics: {
          orderBy: {
            date: 'desc'
          },
          take: 1
        }
      }
    });

    // Format deals into performance reports
    const dealReports = deals.map(deal => ({
      id: deal.id,
      type: 'deal' as const,
      name: deal.name,
      date: deal.createdAt.toISOString(),
      metrics: {
        revenue: deal.amount || 0,
        deals: 1,
        roi: deal.stage === 'closedwon' ? 100 : 0
      },
      status: deal.stage,
      source: 'HubSpot' as const
    }));

    // Format campaigns into performance reports
    const campaignReports = campaigns.map(campaign => {
      const metricsData = campaign.analytics[0]?.metrics;
      const analytics: AnalyticsMetrics = {
        ...defaultMetrics,
        ...(typeof metricsData === 'object' && metricsData !== null ? metricsData as Partial<AnalyticsMetrics> : {})
      };
      
      const { spend, conversions, clicks, impressions, revenue } = analytics;

      return {
        id: campaign.id,
        type: 'campaign' as const,
        name: campaign.name,
        date: campaign.createdAt.toISOString(),
        metrics: {
          spend,
          conversions,
          revenue,
          roi: spend > 0 ? ((revenue) - spend) / spend * 100 : 0,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          cpc: clicks > 0 ? spend / clicks : 0
        },
        status: campaign.status,
        source: 'Meta' as const
      };
    });

    // Combine and sort all reports by date
    const allReports = [...dealReports, ...campaignReports]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      data: allReports,
      success: true
    });
  } catch (error) {
    console.error('Error fetching performance reports:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch performance reports',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 