import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateTokenWithPrisma } from '@/lib/auth';

// Get user settings
export async function GET(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Meta account info if exists
    const metaAccount = await prisma.metaAccount.findFirst({
      where: { 
        userId: user.id,
        status: 'active'
      },
      select: {
        accessToken: true,
        name: true,
        lastSyncedAt: true,
      },
    });

    // Return settings
    return NextResponse.json({
      // Meta settings
      metaApiToken: metaAccount?.accessToken || '',
      metaAccountName: metaAccount?.name || '',
      lastSynced: metaAccount?.lastSyncedAt || null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// Update user settings
export async function PUT(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { metaApiToken } = data;

    // Update Meta account if token provided
    let metaAccount;
    if (metaApiToken) {
      const existingMetaAccount = await prisma.metaAccount.findFirst({
        where: {
          userId: user.id,
          status: 'active'
        }
      });

      if (existingMetaAccount) {
        metaAccount = await prisma.metaAccount.update({
          where: { id: existingMetaAccount.id },
          data: {
            accessToken: metaApiToken,
            lastSyncedAt: new Date(),
          },
        });
      } else {
        metaAccount = await prisma.metaAccount.create({
          data: {
            userId: user.id,
            accessToken: metaApiToken,
            status: 'active',
            accountId: 'pending',
            name: 'Pending Connection',
          },
        });
      }
    }

    // Return updated settings
    return NextResponse.json({
      metaApiToken: metaAccount?.accessToken || '',
      metaAccountName: metaAccount?.name || '',
      lastSynced: metaAccount?.lastSyncedAt || null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
} 