import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get campaigns with metrics
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: user.id
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

    // Get HubSpot deals associated with campaigns
    const hubspotAccount = await prisma.hubspotAccount.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      }
    });

    let deals: any[] = [];
    if (hubspotAccount) {
      deals = await prisma.hubspotDeal.findMany({
        where: {
          hubspotAccountId: hubspotAccount.id
        }
      });
    }

    // Transform and combine data
    const campaignData = campaigns.map(campaign => {
      const latestAnalytics = campaign.analytics[0]?.metrics || {};
      const campaignDeals = deals.filter(deal => {
        const dealProperties = deal.properties as any;
        return dealProperties?.utm_campaign === campaign.campaignId;
      });

      const totalRevenue = campaignDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        metrics: {
          spend: latestAnalytics.spend || 0,
          leads: latestAnalytics.leads || 0,
          deals: campaignDeals.length,
          revenue: totalRevenue
        }
      };
    });

    return NextResponse.json({
      data: campaignData,
      success: true
    });
  } catch (error) {
    console.error('Error fetching Meta Ads campaigns:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch campaign data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 