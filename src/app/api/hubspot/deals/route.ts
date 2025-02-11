import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get deals from database
    const deals = await prisma.hubspotDeal.findMany({
      where: {
        hubspotAccount: {
          userId: user.id,
          status: 'active'
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({
      data: deals.map(deal => ({
        id: deal.id,
        name: deal.name,
        stage: deal.stage,
        amount: deal.amount,
        closeDate: deal.closeDate?.toISOString(),
        pipeline: deal.pipeline,
        lastActivity: deal.lastSyncedAt?.toISOString(),
      })),
      success: true
    });
  } catch (error) {
    console.error('Error fetching HubSpot deals:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch deals',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 