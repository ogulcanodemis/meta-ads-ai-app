import { prisma } from '@/lib/prisma';

interface MetaApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

export async function fetchCampaigns(accessToken: string) {
  try {
    // First, get the ad account ID
    const accountResponse = await fetch(
      'https://graph.facebook.com/v18.0/me/adaccounts',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!accountResponse.ok) {
      const error = (await accountResponse.json()) as MetaApiError;
      throw new Error(`Meta API Error: ${error.error.message}`);
    }

    const accountData = await accountResponse.json();
    if (!accountData.data?.[0]?.id) {
      throw new Error('No ad account found');
    }

    const adAccountId = accountData.data[0].id;

    // Then get campaigns for this account
    const campaignResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/campaigns?fields=id,name,status,objective,spend_cap,daily_budget,start_time,end_time,insights{impressions,clicks,spend,actions}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!campaignResponse.ok) {
      const error = (await campaignResponse.json()) as MetaApiError;
      throw new Error(`Meta API Error: ${error.error.message}`);
    }

    return await campaignResponse.json();
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

export async function fetchCampaignInsights(accessToken: string, campaignId: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=impressions,clicks,ctr,spend,actions,cost_per_action_type`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = (await response.json()) as MetaApiError;
      throw new Error(`Meta API Error: ${error.error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching campaign insights:', error);
    throw error;
  }
}

export async function validateMetaApiToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://graph.facebook.com/v18.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function syncCampaigns(userId: string) {
  try {
    const metaAccount = await prisma.metaAccount.findFirst({
      where: { 
        userId,
        status: 'active'
      },
    });

    if (!metaAccount?.accessToken) {
      throw new Error('Meta API token not found');
    }

    const campaigns = await fetchCampaigns(metaAccount.accessToken);

    if (!campaigns || !Array.isArray(campaigns.data)) {
      throw new Error('Invalid response from Meta API');
    }

    // Store campaigns in database
    for (const campaign of campaigns.data) {
      const insights = campaign.insights?.data?.[0] || {};
      
      try {
        await prisma.campaign.upsert({
          where: {
            userId_campaignId: {
              userId,
              campaignId: campaign.id,
            },
          },
          create: {
            userId,
            campaignId: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective || null,
            spendCap: campaign.spend_cap ? parseFloat(campaign.spend_cap) : null,
            dailyBudget: campaign.daily_budget ? parseFloat(campaign.daily_budget) : null,
            startTime: campaign.start_time ? new Date(campaign.start_time) : null,
            endTime: campaign.end_time ? new Date(campaign.end_time) : null,
            lastUpdated: new Date(),
            metaAccountId: metaAccount.id,
            analytics: {
              create: {
                date: new Date(),
                data: campaign,
                metrics: {
                  spend: parseFloat(insights.spend || '0'),
                  impressions: parseInt(insights.impressions || '0'),
                  clicks: parseInt(insights.clicks || '0'),
                  leads: insights.actions?.find((a: { action_type: string; value: string }) => 
                    a.action_type === 'lead'
                  )?.value || '0'
                }
              }
            }
          },
          update: {
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective || null,
            spendCap: campaign.spend_cap ? parseFloat(campaign.spend_cap) : null,
            dailyBudget: campaign.daily_budget ? parseFloat(campaign.daily_budget) : null,
            startTime: campaign.start_time ? new Date(campaign.start_time) : null,
            endTime: campaign.end_time ? new Date(campaign.end_time) : null,
            lastUpdated: new Date(),
            analytics: {
              create: {
                date: new Date(),
                data: campaign,
                metrics: {
                  spend: parseFloat(insights.spend || '0'),
                  impressions: parseInt(insights.impressions || '0'),
                  clicks: parseInt(insights.clicks || '0'),
                  leads: insights.actions?.find((a: { action_type: string; value: string }) => 
                    a.action_type === 'lead'
                  )?.value || '0'
                }
              }
            }
          },
        });
      } catch (error) {
        console.error(`Error updating campaign ${campaign.id}:`, error);
        // Continue with next campaign even if one fails
        continue;
      }
    }

    return campaigns;
  } catch (error) {
    console.error('Error syncing campaigns:', error);
    throw error;
  }
} 