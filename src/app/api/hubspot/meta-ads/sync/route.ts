import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { syncCampaigns } from '@/lib/meta-api';
import { prisma } from '@/lib/prisma';

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
}

export async function POST(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sync Meta Ads campaigns
    const campaignData = await syncCampaigns(user.id);
    
    if (!campaignData || !Array.isArray(campaignData.data)) {
      throw new Error('Invalid campaign data received from Meta API');
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

    // Update deal properties with campaign data
    const deals = await prisma.hubspotDeal.findMany({
      where: {
        hubspotAccountId: hubspotAccount.id
      }
    });

    for (const deal of deals) {
      const properties = deal.properties as Record<string, any>;
      if (properties?.utm_campaign) {
        const campaign = campaignData.data.find(
          (c: MetaCampaign) => c.id === properties.utm_campaign
        );
        
        if (campaign) {
          await prisma.hubspotDeal.update({
            where: { id: deal.id },
            data: {
              properties: {
                ...properties,
                campaign_name: campaign.name,
                campaign_status: campaign.status
              }
            }
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Successfully synced Meta Ads data',
      success: true,
      campaigns: campaignData.data.length
    });
  } catch (error) {
    console.error('Error syncing Meta Ads data:', error);
    
    // Return a more specific error message
    const errorMessage = error instanceof Error 
      ? error.message
      : 'Unknown error occurred while syncing Meta Ads data';

    return NextResponse.json(
      { 
        error: 'Failed to sync Meta Ads data',
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 