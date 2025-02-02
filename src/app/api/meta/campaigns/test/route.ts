import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
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
      console.error('Ad Account Error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch ad accounts', 
          details: error,
          message: error.error?.message || 'No error message available'
        },
        { status: adAccountResponse.status }
      );
    }

    const adAccounts = await adAccountResponse.json();
    console.log('Ad Accounts Response:', adAccounts);
    
    if (!adAccounts.data || adAccounts.data.length === 0) {
      return NextResponse.json(
        { 
          error: 'No ad accounts found',
          message: 'Please create an ad account in Meta Business Manager first. Go to Business Settings > Ad Accounts > Add > Create a new ad account.',
          details: adAccounts
        },
        { status: 400 }
      );
    }

    // Create a test campaign in the first ad account
    const adAccount = adAccounts.data.find((account: { name: string }) => account.name === 'As4 digital') || adAccounts.data[0];
    console.log('Creating campaign for ad account:', adAccount.id);
    
    const campaignData = {
      name: 'Test Campaign ' + new Date().toISOString(),
      objective: 'OUTCOME_AWARENESS',
      status: 'PAUSED',
      special_ad_categories: [],
      daily_budget: 100,
      campaign_optimization_type: 'NONE'
    };
    
    console.log('Campaign creation data:', campaignData);
    
    try {
      const campaignResponse = await fetch(
        `https://graph.facebook.com/v18.0/${adAccount.id}/campaigns`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${metaAccount.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(campaignData),
        }
      );

      const responseData = await campaignResponse.json();
      console.log('Campaign API Response:', responseData);

      if (!campaignResponse.ok) {
        return NextResponse.json(
          { 
            error: 'Failed to create test campaign', 
            message: responseData.error?.message || 'Campaign creation failed',
            details: responseData
          },
          { status: campaignResponse.status }
        );
      }

      // Store campaign in database
      await prisma.campaign.create({
        data: {
          userId: user.id,
          metaAccountId: metaAccount.id,
          campaignId: responseData.id,
          name: campaignData.name,
          status: campaignData.status,
          objective: campaignData.objective,
          dailyBudget: campaignData.daily_budget,
          lastUpdated: new Date(),
        },
      });

      return NextResponse.json({
        message: 'Test campaign created successfully',
        campaign: responseData,
        adAccount: adAccount,
      });

    } catch (error) {
      console.error('Campaign creation error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create test campaign', 
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error creating test campaign:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test campaign',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 