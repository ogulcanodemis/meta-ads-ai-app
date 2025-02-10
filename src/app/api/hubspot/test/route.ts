import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateTokenWithPrisma } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { authType, privateKey, accessToken } = data;

    if (!privateKey && !accessToken) {
      return NextResponse.json(
        { error: 'Either private key or access token is required' },
        { status: 400 }
      );
    }

    // Test HubSpot connection based on auth type
    const testEndpoint = authType === 'private'
      ? 'https://api.hubapi.com/crm/v3/objects/contacts'
      : 'https://api.hubapi.com/oauth/v1/access-tokens/';

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authType === 'private') {
      headers['Authorization'] = `Bearer ${privateKey}`;
    } else {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to connect to HubSpot');
    }

    const accountInfo = await response.json();

    // Find existing HubSpot account
    const existingAccount = await prisma.hubspotAccount.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      }
    });

    let updatedAccount;
    if (existingAccount) {
      // Update existing account
      updatedAccount = await prisma.hubspotAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: authType === 'oauth' ? accessToken : null,
          privateKey: authType === 'private' ? privateKey : null,
          authType,
          lastSyncedAt: new Date(),
        },
      });
    } else {
      // Create new account
      updatedAccount = await prisma.hubspotAccount.create({
        data: {
          userId: user.id,
          accessToken: authType === 'oauth' ? accessToken : null,
          privateKey: authType === 'private' ? privateKey : null,
          authType,
          status: 'active',
          accountId: accountInfo.portalId?.toString() || 'pending',
          name: accountInfo.portalName || 'HubSpot Account',
        },
      });
    }

    return NextResponse.json({
      success: true,
      account: {
        name: updatedAccount.name,
        lastSynced: updatedAccount.lastSyncedAt,
      },
    });
  } catch (error) {
    console.error('HubSpot test error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to HubSpot' },
      { status: 500 }
    );
  }
} 