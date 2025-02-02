import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // Authenticate user
    const user = await authenticateTokenWithPrisma(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the token from request body
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Meta API token is required' },
        { status: 400 }
      );
    }

    // Test Meta API connection - first try to get the user info
    try {
      const meResponse = await fetch('https://graph.facebook.com/v18.0/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const meData = await meResponse.json();

      if (!meResponse.ok) {
        return NextResponse.json(
          { 
            error: meData.error?.message || 'Invalid Meta API token',
            details: meData.error 
          },
          { status: 400 }
        );
      }

      // Now try to verify ad account access
      const adAccountResponse = await fetch(
        'https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name', 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const adAccountData = await adAccountResponse.json();

      if (!adAccountResponse.ok) {
        return NextResponse.json(
          { 
            error: 'Could not access ad accounts. Please check permissions.',
            details: adAccountData.error 
          },
          { status: 400 }
        );
      }

      // If successful, create or update Meta account
      const metaAccount = await prisma.metaAccount.upsert({
        where: {
          userId_accountId: {
            userId: user.id,
            accountId: meData.id,
          }
        },
        create: {
          accountId: meData.id,
          name: meData.name,
          accessToken: token,
          userId: user.id,
          permissions: ['ads_management', 'ads_read', 'read_insights'],
          lastSyncedAt: new Date(),
          status: 'active',
        },
        update: {
          name: meData.name,
          accessToken: token,
          permissions: ['ads_management', 'ads_read', 'read_insights'],
          lastSyncedAt: new Date(),
          status: 'active',
        },
      });

      return NextResponse.json({
        message: 'Successfully connected to Meta Business API',
        account: {
          id: metaAccount.accountId,
          name: metaAccount.name,
          adAccounts: adAccountData.data,
        },
      });
    } catch (apiError) {
      console.error('Meta API error:', apiError);
      return NextResponse.json(
        { 
          error: 'Failed to connect to Meta API',
          details: apiError instanceof Error ? apiError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error testing Meta API connection:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 