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
    const dealMetrics = {
      totalDeals: deals.length,
      totalRevenue: deals.reduce((sum, deal) => sum + (deal.amount || 0), 0),
      wonDeals: deals.filter(deal => deal.stage === 'closedwon').length,
      wonRevenue: deals
        .filter(deal => deal.stage === 'closedwon')
        .reduce((sum, deal) => sum + (deal.amount || 0), 0),
      averageDealSize: deals.length > 0 
        ? deals.reduce((sum, deal) => sum + (deal.amount || 0), 0) / deals.length 
        : 0,
      dealsByStage: deals.reduce((acc, deal) => {
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
      }, {} as Record<string, { count: number; value: number }>)
    };

    // Calculate contact metrics
    const contactMetrics = {
      totalContacts: contacts.length,
      activeContacts: contacts.filter(contact => {
        const lastActivity = contact.lastSyncedAt || contact.updatedAt;
        const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceActivity <= 30;
      }).length,
      contactsBySource: contacts.reduce((acc, contact) => {
        const properties = contact.properties as any;
        const source = properties?.source || 'Direct';
        if (!acc[source]) {
          acc[source] = 0;
        }
        acc[source]++;
        return acc;
      }, {} as Record<string, number>)
    };

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
    const overallCampaignMetrics = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
      totalSpend: campaignMetrics.reduce((sum, campaign) => sum + campaign.spend, 0),
      totalClicks: campaignMetrics.reduce((sum, campaign) => sum + campaign.clicks, 0),
      totalImpressions: campaignMetrics.reduce((sum, campaign) => sum + campaign.impressions, 0),
      totalConversions: campaignMetrics.reduce((sum, campaign) => sum + campaign.conversions, 0),
      overallCTR: campaignMetrics.reduce((sum, campaign) => sum + campaign.ctr, 0) / campaigns.length,
      overallCPC: campaignMetrics.reduce((sum, campaign) => sum + campaign.cpc, 0) / campaigns.length,
      overallConversionRate: campaignMetrics.reduce((sum, campaign) => sum + campaign.conversionRate, 0) / campaigns.length,
      overallCPA: campaignMetrics.reduce((sum, campaign) => sum + campaign.cpa, 0) / campaigns.length
    };

    // Calculate ROI
    const roi = overallCampaignMetrics.totalSpend > 0 
      ? ((dealMetrics.wonRevenue - overallCampaignMetrics.totalSpend) / overallCampaignMetrics.totalSpend) * 100 
      : 0;

    return NextResponse.json({
      data: {
        dealMetrics,
        contactMetrics,
        campaignMetrics,
        overallCampaignMetrics,
        roi,
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString()
        }
      },
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