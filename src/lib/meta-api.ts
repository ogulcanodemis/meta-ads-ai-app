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
    const response = await fetch(
      'https://graph.facebook.com/v18.0/me/campaigns?fields=id,name,status,objective,spend_cap,daily_budget,start_time,end_time,insights',
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

  // Store campaigns in database
  for (const campaign of campaigns.data) {
    const insights = await fetchCampaignInsights(
      metaAccount.accessToken,
      campaign.id
    );

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
        objective: campaign.objective,
        spendCap: campaign.spend_cap,
        dailyBudget: campaign.daily_budget,
        startTime: campaign.start_time,
        endTime: campaign.end_time,
        lastUpdated: new Date(),
        metaAccountId: metaAccount.id
      },
      update: {
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        spendCap: campaign.spend_cap,
        dailyBudget: campaign.daily_budget,
        startTime: campaign.start_time,
        endTime: campaign.end_time,
        lastUpdated: new Date(),
        metaAccountId: metaAccount.id
      },
    });
  }

  return campaigns;
} 