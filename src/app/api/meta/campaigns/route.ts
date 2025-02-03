import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const user = await authenticateTokenWithPrisma(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Meta account
    const metaAccount = await prisma.metaAccount.findFirst({
      where: { 
        userId: user.id,
        status: 'active'
      },
    });

    if (!metaAccount) {
      return NextResponse.json(
        { error: 'No active Meta account found. Please connect your Meta account in Settings.' },
        { status: 400 }
      );
    }

    // First get ad accounts
    const adAccountResponse = await fetch(
      'https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status',
      {
        headers: {
          'Authorization': `Bearer ${metaAccount.accessToken}`,
        },
      }
    );

    if (!adAccountResponse.ok) {
      const error = await adAccountResponse.json();
      return NextResponse.json(
        { error: 'Failed to fetch ad accounts', details: error },
        { status: adAccountResponse.status }
      );
    }

    const adAccounts = await adAccountResponse.json();

    // Get campaigns for each ad account
    const campaignsPromises = adAccounts.data.map(async (account: { id: string, name: string }) => {
      console.log(`Fetching campaigns for account ${account.name} (${account.id})`);
      
      const campaignsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${account.id}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,end_time,insights.time_range({"since":"2024-01-01","until":"2024-12-31"}){impressions,clicks,spend,ctr,cpc,reach,frequency,unique_clicks,unique_ctr,cost_per_unique_click,actions,action_values,website_ctr,outbound_clicks,outbound_clicks_ctr,quality_ranking,engagement_rate_ranking,conversion_rate_ranking,cost_per_action_type,cost_per_outbound_click}`,
        {
          headers: {
            'Authorization': `Bearer ${metaAccount.accessToken}`,
          },
        }
      );

      if (!campaignsResponse.ok) {
        const errorData = await campaignsResponse.json();
        console.error(`Failed to fetch campaigns for account ${account.name}:`, errorData);
        return [];
      }

      const campaigns = await campaignsResponse.json();
      console.log(`Received campaigns for account ${account.name}:`, campaigns);

      return campaigns.data.map((campaign: any) => {
        const insights = campaign.insights?.data?.[0] || {};
        
        // Parse numeric values safely
        const parseNumeric = (value: any, defaultValue = 0) => {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? defaultValue : parsed;
        };

        // Get specific action types
        const getActionValue = (actions: any[], actionType: string) => {
          const action = actions?.find(a => a.action_type === actionType);
          return parseNumeric(action?.value);
        };

        // Calculate engagement rate
        const engagementRate = insights.impressions ? 
          ((parseNumeric(insights.outbound_clicks) + getActionValue(insights.actions, 'post_engagement')) / 
           parseNumeric(insights.impressions)) * 100 : 0;

        return {
          ...campaign,
          adAccountId: account.id,
          adAccountName: account.name,
          metrics: {
            impressions: parseNumeric(insights.impressions),
            clicks: parseNumeric(insights.clicks),
            spend: parseNumeric(insights.spend),
            ctr: parseNumeric(insights.ctr),
            cpc: parseNumeric(insights.cpc),
            reach: parseNumeric(insights.reach),
            frequency: parseNumeric(insights.frequency),
            uniqueClicks: parseNumeric(insights.unique_clicks),
            uniqueCtr: parseNumeric(insights.unique_ctr),
            costPerUniqueClick: parseNumeric(insights.cost_per_unique_click),
            outboundClicks: parseNumeric(insights.outbound_clicks),
            outboundClicksCtr: parseNumeric(insights.outbound_clicks_ctr),
            engagementRate: engagementRate,
            qualityRanking: insights.quality_ranking || 'UNKNOWN',
            engagementRateRanking: insights.engagement_rate_ranking || 'UNKNOWN',
            conversionRateRanking: insights.conversion_rate_ranking || 'UNKNOWN',
            // Actions ve değerler
            linkClicks: getActionValue(insights.actions, 'link_click'),
            pageEngagement: getActionValue(insights.actions, 'post_engagement'),
            leads: getActionValue(insights.actions, 'lead'),
            purchases: getActionValue(insights.actions, 'purchase'),
            // Maliyet metrikleri
            costPerLead: parseNumeric(insights.cost_per_action_type?.find((c: any) => c.action_type === 'lead')?.value),
            costPerPurchase: parseNumeric(insights.cost_per_action_type?.find((c: any) => c.action_type === 'purchase')?.value),
          }
        };
      });
    });

    const campaignsResults = await Promise.all(campaignsPromises);
    const allCampaigns = campaignsResults.flat();

    console.log('Fetched campaigns:', allCampaigns);

    // Store campaigns in database
    await prisma.campaign.createMany({
      data: allCampaigns.map((campaign: any) => ({
        userId: user.id,
        metaAccountId: metaAccount.id,
        campaignId: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective || null,
        spendCap: campaign.spend_cap ? parseFloat(campaign.spend_cap) : null,
        dailyBudget: campaign.daily_budget ? parseFloat(campaign.daily_budget) : null,
        startTime: campaign.start_time ? new Date(campaign.start_time) : null,
        endTime: campaign.end_time ? new Date(campaign.end_time) : null,
        lastUpdated: new Date(),
      })),
      skipDuplicates: true,
    });

    // Update last sync time
    await prisma.metaAccount.update({
      where: { id: metaAccount.id },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({
      data: {
        campaigns: allCampaigns,
        adAccounts: adAccounts.data,
      },
      success: true,
      message: 'Campaigns fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch campaigns',
        success: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 