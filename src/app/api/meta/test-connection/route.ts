import { NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware/auth';
import type { AuthenticatedRequest } from '@/lib/middleware/auth';

export async function POST(request: AuthenticatedRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (authResult) {
      return authResult;
    }

    const { apiKey } = await request.json();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Test Meta API connection
    const response = await fetch('https://graph.facebook.com/v18.0/me/accounts', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to connect to Meta API');
    }

    return NextResponse.json({
      message: 'Successfully connected to Meta API',
      accounts: data.data,
    });
  } catch (error) {
    console.error('Meta API test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to test Meta API connection' },
      { status: 500 }
    );
  }
} 