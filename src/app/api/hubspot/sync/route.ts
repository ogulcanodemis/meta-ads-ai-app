import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { syncHubspotData } from '@/lib/hubspot-api';

export async function POST(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await syncHubspotData(user.id);

    return NextResponse.json({
      data,
      message: 'Successfully synced HubSpot data',
      success: true
    });
  } catch (error) {
    console.error('Error syncing HubSpot data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync HubSpot data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 