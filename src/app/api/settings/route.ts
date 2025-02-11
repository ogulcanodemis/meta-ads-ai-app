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

    // Get HubSpot account info if exists
    const hubspotAccount = await prisma.hubspotAccount.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        accountId: true,
        appId: true,
        clientSecret: true,
        privateKey: true,
        authType: true,
        status: true,
        permissions: true,
        lastSyncedAt: true,
      },
    });

    // Return settings
    return NextResponse.json({
      // Meta settings
      metaApiToken: metaAccount?.accessToken || '',
      metaAccountName: metaAccount?.name || '',
      lastSynced: metaAccount?.lastSyncedAt || null,
      
      // HubSpot settings
      hubspotAuthType: hubspotAccount?.authType || 'oauth',
      hubspotAppId: hubspotAccount?.appId || '',
      hubspotClientSecret: hubspotAccount?.clientSecret || '',
      hubspotPrivateKey: hubspotAccount?.privateKey || '',
      hubspotAccountName: hubspotAccount?.name || '',
      hubspotLastSynced: hubspotAccount?.lastSyncedAt || null,
      
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Settings error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: 'Failed to fetch settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
    const { 
      metaApiToken,
      hubspotAuthType,
      hubspotAppId,
      hubspotClientSecret,
      hubspotPrivateKey
    } = data;

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

    // Update HubSpot account if credentials provided
    let hubspotAccount;
    if ((hubspotAuthType === 'oauth' && (hubspotAppId || hubspotClientSecret)) || 
        (hubspotAuthType === 'private' && hubspotPrivateKey)) {
      const existingHubspotAccount = await prisma.hubspotAccount.findFirst({
        where: {
          userId: user.id,
          status: 'active'
        }
      });

      const hubspotData = {
        authType: hubspotAuthType,
        appId: hubspotAuthType === 'oauth' ? hubspotAppId : null,
        clientSecret: hubspotAuthType === 'oauth' ? hubspotClientSecret : null,
        privateKey: hubspotAuthType === 'private' ? hubspotPrivateKey : null,
        lastSyncedAt: new Date(),
      };

      if (existingHubspotAccount) {
        hubspotAccount = await prisma.hubspotAccount.update({
          where: { id: existingHubspotAccount.id },
          data: hubspotData,
        });
      } else {
        hubspotAccount = await prisma.hubspotAccount.create({
          data: {
            ...hubspotData,
            userId: user.id,
            status: 'active',
            accountId: 'pending',
            name: 'Pending Connection',
            permissions: [],
          },
        });
      }
    }

    // Return updated settings
    return NextResponse.json({
      metaApiToken: metaAccount?.accessToken || '',
      metaAccountName: metaAccount?.name || '',
      lastSynced: metaAccount?.lastSyncedAt || null,
      
      hubspotAuthType: hubspotAccount?.authType || 'oauth',
      hubspotAppId: hubspotAccount?.appId || '',
      hubspotClientSecret: hubspotAccount?.clientSecret || '',
      hubspotPrivateKey: hubspotAccount?.privateKey || '',
      hubspotAccountName: hubspotAccount?.name || '',
      hubspotLastSynced: hubspotAccount?.lastSyncedAt || null,
      
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Settings update error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: 'Failed to update settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 