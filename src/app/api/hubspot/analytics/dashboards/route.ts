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

    // Get all contacts
    const contacts = await prisma.hubspotContact.findMany({
      where: {
        hubspotAccountId: hubspotAccount.id,
        createdAt: {
          gte: startDate
        }
      }
    });

    // Get all campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        adSets: {
          include: {
            ads: true
          }
        }
      }
    });

    // Calculate deal metrics
    const totalRevenue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
    const wonDeals = deals.filter(deal => deal.stage === 'closedwon');
    const wonRevenue = wonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
    const averageDealSize = deals.length > 0 ? totalRevenue / deals.length : 0;

    // Calculate contact metrics
    const activeContacts = contacts.filter(contact => {
      const lastActivity = contact.lastSyncedAt || contact.updatedAt;
      const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceActivity <= 30;
    }).length;

    // Calculate campaign metrics
    const campaignMetrics = campaigns.map(campaign => {
      const totalSpend = campaign.adSets.reduce((sum, adSet) => 
        sum + adSet.ads.reduce((adSum, ad) => adSum + (ad.spend || 0), 0)
      , 0);

      const totalClicks = campaign.adSets.reduce((sum, adSet) => 
        sum + adSet.ads.reduce((adSum, ad) => adSum + (ad.clicks || 0), 0)
      , 0);

      const totalImpressions = campaign.adSets.reduce((sum, adSet) => 
        sum + adSet.ads.reduce((adSum, ad) => adSum + (ad.impressions || 0), 0)
      , 0);

      const totalConversions = campaign.adSets.reduce((sum, adSet) => 
        sum + adSet.ads.reduce((adSum, ad) => adSum + (ad.conversions || 0), 0)
      , 0);

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        spend: totalSpend,
        clicks: totalClicks,
        impressions: totalImpressions,
        conversions: totalConversions,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        cpa: totalConversions > 0 ? totalSpend / totalConversions : 0
      };
    });

    // Calculate overall campaign metrics
    const totalSpend = campaignMetrics.reduce((sum, campaign) => sum + campaign.spend, 0);
    const totalClicks = campaignMetrics.reduce((sum, campaign) => sum + campaign.clicks, 0);
    const totalImpressions = campaignMetrics.reduce((sum, campaign) => sum + campaign.impressions, 0);
    const totalConversions = campaignMetrics.reduce((sum, campaign) => sum + campaign.conversions, 0);

    // Calculate performance over time
    const performanceData = await Promise.all(
      Array.from({ length: 7 }).map(async (_, index) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - index));
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

        // Get daily contacts
        const dailyContacts = await prisma.hubspotContact.findMany({
          where: {
            hubspotAccountId: hubspotAccount.id,
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        });

        // Get daily campaigns
        const dailyCampaigns = await prisma.campaign.findMany({
          where: {
            userId: user.id,
            createdAt: {
              gte: date,
              lt: nextDate
            }
          },
          include: {
            adSets: {
              include: {
                ads: true
              }
            }
          }
        });

        const dailyRevenue = dailyDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
        const dailyWonDeals = dailyDeals.filter(deal => deal.stage === 'closedwon');
        const dailyWonRevenue = dailyWonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

        const dailySpend = dailyCampaigns.reduce((sum, campaign) => 
          sum + campaign.adSets.reduce((adSetSum, adSet) => 
            adSetSum + adSet.ads.reduce((adSum, ad) => adSum + (ad.spend || 0), 0)
          , 0)
        , 0);

        return {
          date: date.toISOString(),
          revenue: dailyRevenue,
          wonRevenue: dailyWonRevenue,
          deals: dailyDeals.length,
          wonDeals: dailyWonDeals.length,
          contacts: dailyContacts.length,
          spend: dailySpend
        };
      })
    );

    return NextResponse.json({
      data: {
        summary: {
          totalRevenue,
          wonRevenue,
          averageDealSize,
          totalDeals: deals.length,
          wonDeals: wonDeals.length,
          totalContacts: contacts.length,
          activeContacts,
          totalCampaigns: campaigns.length,
          activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
          totalSpend,
          totalClicks,
          totalImpressions,
          totalConversions,
          overallCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
          overallCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
          overallConversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
          overallCPA: totalConversions > 0 ? totalSpend / totalConversions : 0,
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