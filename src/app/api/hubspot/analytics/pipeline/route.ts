import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { getPipelineAnalytics, getDealTrends } from '@/lib/hubspot-analytics';

export async function GET(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'last30';

    // Get analytics data
    const [pipelineData, trendsData] = await Promise.all([
      getPipelineAnalytics(user.id, dateRange),
      getDealTrends(user.id, dateRange)
    ]);

    return NextResponse.json({
      data: {
        pipeline: pipelineData,
        trends: trendsData
      },
      success: true
    });
  } catch (error) {
    console.error('Error fetching pipeline analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch pipeline analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 