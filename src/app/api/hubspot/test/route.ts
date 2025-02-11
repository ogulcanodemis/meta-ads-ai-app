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
    const { token, authType = 'oauth' } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'HubSpot token is required' },
        { status: 400 }
      );
    }

    // Test HubSpot API connection and get account info
    try {
      let accountData: any = {};
      
      // Get account info based on auth type
      if (authType === 'oauth') {
        const accountResponse = await fetch(
          'https://api.hubapi.com/oauth/v1/access-tokens/'+token,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        accountData = await accountResponse.json();
        console.log('HubSpot OAuth account data:', accountData);

        if (!accountResponse.ok) {
          return NextResponse.json(
            { 
              error: accountData.message || 'Invalid HubSpot token',
              details: accountData
            },
            { status: 400 }
          );
        }
      } else {
        // For private app, get account info from /account-info/v3/details
        const accountResponse = await fetch(
          'https://api.hubapi.com/account-info/v3/details',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        accountData = await accountResponse.json();
        console.log('HubSpot Private App account data:', accountData);

        if (!accountResponse.ok) {
          return NextResponse.json(
            { 
              error: accountData.message || 'Invalid HubSpot token',
              details: accountData
            },
            { status: 400 }
          );
        }

        // Map private app response to match OAuth response structure
        accountData = {
          hub_id: accountData.portalId,
          hub_domain: accountData.uiDomain || 'app.hubspot.com',
          account_type: accountData.accountType,
          timezone: accountData.timeZone
        };
      }

      // Then verify CRM access
      const response = await fetch(
        'https://api.hubapi.com/crm/v3/objects/contacts?limit=1',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { 
            error: data.message || 'Could not access CRM data',
            details: data
          },
          { status: 400 }
        );
      }

      // Generate a meaningful account name
      const accountName = accountData.account_type ? 
        `HubSpot ${accountData.account_type.charAt(0) + accountData.account_type.slice(1).toLowerCase()} Account` : 
        'HubSpot Account';

      // If successful, create or update HubSpot account
      const hubspotAccount = await prisma.hubspotAccount.upsert({
        where: {
          userId_accountId: {
            userId: user.id,
            accountId: accountData.hub_id?.toString() || 'pending',
          }
        },
        create: {
          accountId: accountData.hub_id?.toString() || 'pending',
          name: accountName,
          appId: authType === 'oauth' ? token : null,
          clientSecret: authType === 'oauth' ? token : null,
          privateKey: authType === 'private' ? token : null,
          authType,
          userId: user.id,
          permissions: ['contacts', 'deals'],
          lastSyncedAt: new Date(),
          status: 'active',
        },
        update: {
          name: accountName,
          appId: authType === 'oauth' ? token : null,
          clientSecret: authType === 'oauth' ? token : null,
          privateKey: authType === 'private' ? token : null,
          authType,
          permissions: ['contacts', 'deals'],
          lastSyncedAt: new Date(),
          status: 'active',
        },
      });

      return NextResponse.json({
        message: 'Successfully connected to HubSpot API',
        account: {
          id: hubspotAccount.id,
          name: hubspotAccount.name,
          portalId: accountData.hub_id,
        },
      });
    } catch (apiError) {
      console.error('HubSpot API error:', apiError);
      return NextResponse.json(
        { 
          error: 'Failed to connect to HubSpot API',
          details: apiError instanceof Error ? apiError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error testing HubSpot API connection:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 