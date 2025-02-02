import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const user = await authenticateTokenWithPrisma(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update last sync time
    await prisma.metaAccount.updateMany({
      where: { 
        userId: user.id,
        status: 'active'
      },
      data: { 
        lastSyncedAt: new Date() 
      }
    });

    return NextResponse.json({ 
      message: 'Sync completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error syncing campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to sync campaigns' },
      { status: 500 }
    );
  }
} 