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

    // Get total deals
    const totalDeals = await prisma.hubspotDeal.count({
      where: {
        hubspotAccountId: hubspotAccount.id
      }
    });

    // Get active campaigns
    const activeCampaigns = await prisma.campaign.count({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      }
    });

    // Get total revenue (sum of deal amounts)
    const dealsWithAmount = await prisma.hubspotDeal.findMany({
      where: {
        hubspotAccountId: hubspotAccount.id,
        amount: {
          not: null
        }
      },
      select: {
        amount: true
      }
    });

    const totalRevenue = dealsWithAmount.reduce((sum, deal) => sum + (deal.amount || 0), 0);

    // Calculate conversion rate
    const totalContacts = await prisma.hubspotContact.count({
      where: {
        hubspotAccountId: hubspotAccount.id
      }
    });

    const conversionRate = totalContacts > 0 
      ? (totalDeals / totalContacts) * 100 
      : 0;

    return NextResponse.json({
      data: {
        totalDeals,
        activeCampaigns,
        totalRevenue,
        conversionRate: parseFloat(conversionRate.toFixed(1))
      },
      success: true
    });
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch quick stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 