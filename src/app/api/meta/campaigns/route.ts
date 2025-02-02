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
      const campaignsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${account.id}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,end_time,insights{spend}`,
        {
          headers: {
            'Authorization': `Bearer ${metaAccount.accessToken}`,
          },
        }
      );

      if (!campaignsResponse.ok) {
        console.error(`Failed to fetch campaigns for account ${account.name}:`, await campaignsResponse.json());
        return [];
      }

      const campaigns = await campaignsResponse.json();
      return campaigns.data.map((campaign: any) => ({
        ...campaign,
        adAccountId: account.id,
        adAccountName: account.name,
      }));
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