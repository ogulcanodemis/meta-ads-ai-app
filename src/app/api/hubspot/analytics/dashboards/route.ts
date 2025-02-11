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

    // Calculate date range for performance data
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 30); // Last 30 days by default

    // Get deals
    const deals = await prisma.hubspotDeal.findMany({
      where: {
        hubspotAccountId: hubspotAccount.id,
        createdAt: {
          gte: startDate
        }
      }
    });

    // Get contacts
    const contacts = await prisma.hubspotContact.findMany({
      where: {
        hubspotAccountId: hubspotAccount.id,
        createdAt: {
          gte: startDate
        }
      }
    });

    // Get campaigns
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

    // Calculate summary metrics
    const totalRevenue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
    const wonDeals = deals.filter(deal => deal.stage === 'closedwon');
    const wonRevenue = wonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
    const totalSpend = campaigns.reduce((sum, campaign) => 
      sum + (campaign.analytics[0]?.metrics?.spend || 0), 0);

    // Calculate active contacts (with activity in last 30 days)
    const activeContacts = contacts.filter(contact => {
      const lastActivity = contact.lastSyncedAt || contact.updatedAt;
      const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceActivity <= 30;
    }).length;

    // Generate daily performance data
    const performanceData = await Promise.all(
      Array.from({ length: 30 }).map(async (_, index) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (29 - index));
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        // Get daily deals
        const dailyDeals = await prisma.hubspotDeal.findMany({
          where: {
            hubspotAccountId: hubspotAccount.id,
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        });

        const dailyWonDeals = dailyDeals.filter(deal => deal.stage === 'closedwon');
        const dailyRevenue = dailyDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
        const dailyWonRevenue = dailyWonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

        // Get daily contacts
        const dailyContacts = await prisma.hubspotContact.count({
          where: {
            hubspotAccountId: hubspotAccount.id,
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        });

        // Get daily campaign spend
        const dailySpend = campaigns
          .filter(campaign => {
            const campaignDate = campaign.analytics[0]?.date;
            return campaignDate && 
              campaignDate >= date && 
              campaignDate < nextDate;
          })
          .reduce((sum, campaign) => sum + (campaign.analytics[0]?.metrics?.spend || 0), 0);

        return {
          date: date.toISOString(),
          revenue: dailyRevenue,
          wonRevenue: dailyWonRevenue,
          deals: dailyDeals.length,
          wonDeals: dailyWonDeals.length,
          contacts: dailyContacts,
          spend: dailySpend
        };
      })
    );

    return NextResponse.json({
      data: {
        summary: {
          totalRevenue,
          wonRevenue,
          totalDeals: deals.length,
          wonDeals: wonDeals.length,
          totalContacts: contacts.length,
          activeContacts,
          totalCampaigns: campaigns.length,
          activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
          totalSpend,
          roi: totalSpend > 0 ? ((wonRevenue - totalSpend) / totalSpend) * 100 : 0
        },
        performanceData
      },
      success: true
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 