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
      metaApiToken: metaAccount?.accessToken || '',
      metaAccountName: metaAccount?.name || '',
      lastSynced: metaAccount?.lastSyncedAt || null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
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

    if (!metaApiToken) {
      return NextResponse.json(
        { error: 'Meta API token is required' },
        { status: 400 }
      );
    }

    // Find existing Meta account
    const existingAccount = await prisma.metaAccount.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      }
    });

    let updatedAccount;
    if (existingAccount) {
      // Update existing account
      updatedAccount = await prisma.metaAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: metaApiToken,
          lastSyncedAt: new Date(),
        },
      });
    } else {
      // Create new account
      updatedAccount = await prisma.metaAccount.create({
        data: {
          userId: user.id,
          accessToken: metaApiToken,
          status: 'active',
          accountId: 'pending', // Will be updated when testing connection
          name: 'Pending Connection', // Will be updated when testing connection
        },
      });
    }

    // Return updated settings
    return NextResponse.json({
      metaApiToken: updatedAccount.accessToken,
      metaAccountName: updatedAccount.name,
      lastSynced: updatedAccount.lastSyncedAt,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 