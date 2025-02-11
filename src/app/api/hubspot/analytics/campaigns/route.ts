import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchCampaigns } from '@/lib/meta-api';

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  start_time?: string;
  end_time?: string;
  created_time: string;
  insights?: {
    data?: Array<{
      date_start: string;
      spend: string;
      clicks: string;
      impressions: string;
      actions?: Array<{
        action_type: string;
        value: string;
      }>;
    }>;
  };
}

interface CampaignMetrics {
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
}

interface ProcessedCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
  cpa: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

interface InsightData {
  date_start: string;
  spend: string;
  clicks: string;
  impressions: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
}

export async function GET(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Meta account
    const metaAccount = await prisma.metaAccount.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      }
    });

    if (!metaAccount) {
      throw new Error('No active Meta account found');
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'last30';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sortBy = searchParams.get('sortBy') || 'spend';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search') || '';
    const comparisonPeriod = parseInt(searchParams.get('comparisonPeriod') || '3');

    // Fetch campaigns from Meta API
    const campaignsResponse = await fetchCampaigns(metaAccount.accessToken);
    if (!campaignsResponse?.data) {
      throw new Error('Failed to fetch campaign data from Meta API');
    }

    // Process campaign data
    let campaigns = campaignsResponse.data.map((campaign: MetaCampaign): ProcessedCampaign => {
      const insights = campaign.insights?.data?.[0] as InsightData | undefined || {};
      const spend = parseFloat((insights as InsightData).spend || '0');
      const clicks = parseInt((insights as InsightData).clicks || '0');
      const impressions = parseInt((insights as InsightData).impressions || '0');
      const conversions = parseInt(
        (insights as InsightData).actions?.find(
          (a: { action_type: string; value: string }) => a.action_type === 'lead'
        )?.value || '0'
      );

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        spend,
        clicks,
        impressions,
        conversions,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
        startDate: campaign.start_time,
        endDate: campaign.end_time,
        createdAt: campaign.created_time
      };
    });

    // Apply search filter
    if (search) {
      campaigns = campaigns.filter((campaign: ProcessedCampaign) => 
        campaign.name.toLowerCase().includes(search.toLowerCase()) ||
        campaign.status.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Calculate total metrics
    const totalMetrics = campaigns.reduce((sum: CampaignMetrics, campaign: ProcessedCampaign) => ({
      spend: sum.spend + campaign.spend,
      clicks: sum.clicks + campaign.clicks,
      impressions: sum.impressions + campaign.impressions,
      conversions: sum.conversions + campaign.conversions
    }), { spend: 0, clicks: 0, impressions: 0, conversions: 0 });

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    let daysToInclude = 7;
    
    switch (dateRange) {
      case 'last7':
        startDate.setDate(now.getDate() - 7);
        daysToInclude = 7;
        break;
      case 'last30':
        startDate.setDate(now.getDate() - 30);
        daysToInclude = 30;
        break;
      case 'last90':
        startDate.setDate(now.getDate() - 90);
        daysToInclude = 90;
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        daysToInclude = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        break;
      default:
        startDate.setDate(now.getDate() - 30);
        daysToInclude = 30;
    }

    // Calculate performance over time for the selected date range
    const performanceData = Array.from({ length: daysToInclude }).map((_, index) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (daysToInclude - 1 - index));
      date.setHours(0, 0, 0, 0);

      const dayData = campaignsResponse.data
        .map((campaign: MetaCampaign) => {
          const dayInsights = campaign.insights?.data?.find(
            (d: InsightData) => new Date(d.date_start).toDateString() === date.toDateString()
          ) as InsightData | undefined || {};

          return {
            spend: parseFloat((dayInsights as InsightData).spend || '0'),
            clicks: parseInt((dayInsights as InsightData).clicks || '0'),
            impressions: parseInt((dayInsights as InsightData).impressions || '0'),
            conversions: parseInt(
              (dayInsights as InsightData).actions?.find(
                (a: { action_type: string; value: string }) => a.action_type === 'lead'
              )?.value || '0'
            )
          };
        })
        .reduce((sum: CampaignMetrics, metrics: CampaignMetrics) => ({
          spend: sum.spend + metrics.spend,
          clicks: sum.clicks + metrics.clicks,
          impressions: sum.impressions + metrics.impressions,
          conversions: sum.conversions + metrics.conversions
        }), { spend: 0, clicks: 0, impressions: 0, conversions: 0 });

      return {
        date: date.toISOString(),
        ...dayData
      };
    });

    // Validate comparison period
    const maxComparisonPeriod = Math.floor(daysToInclude / 2);
    const validComparisonPeriod = Math.min(comparisonPeriod, maxComparisonPeriod);

    // Calculate trends using the validated comparison period
    const lastNDays = performanceData.slice(-validComparisonPeriod);
    const previousNDays = performanceData.slice(-validComparisonPeriod * 2, -validComparisonPeriod);

    const calculateTotal = (data: any[], metric: keyof CampaignMetrics) => 
      data.reduce((sum, day) => sum + (day[metric] || 0), 0);

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { percentage: 0, isPositive: true };
      const change = ((current - previous) / previous) * 100;
      return {
        percentage: Math.abs(Number(change.toFixed(1))),
        isPositive: change >= 0
      };
    };

    // Add validation for trend calculations
    const trends = previousNDays.length > 0 ? {
      spend: calculateTrend(
        calculateTotal(lastNDays, 'spend'),
        calculateTotal(previousNDays, 'spend')
      ),
      clicks: calculateTrend(
        calculateTotal(lastNDays, 'clicks'),
        calculateTotal(previousNDays, 'clicks')
      ),
      ctr: calculateTrend(
        calculateTotal(lastNDays, 'clicks') / calculateTotal(lastNDays, 'impressions') * 100,
        calculateTotal(previousNDays, 'clicks') / calculateTotal(previousNDays, 'impressions') * 100
      ),
      cpc: calculateTrend(
        calculateTotal(lastNDays, 'spend') / calculateTotal(lastNDays, 'clicks'),
        calculateTotal(previousNDays, 'spend') / calculateTotal(previousNDays, 'clicks')
      )
    } : {
      spend: { percentage: 0, isPositive: true },
      clicks: { percentage: 0, isPositive: true },
      ctr: { percentage: 0, isPositive: true },
      cpc: { percentage: 0, isPositive: true }
    };

    // Apply pagination
    const totalItems = campaigns.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedCampaigns = campaigns.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({
      data: {
        campaigns: paginatedCampaigns,
        performance: performanceData,
        trends,
        summary: {
          totalCampaigns: campaigns.length,
          activeCampaigns: campaigns.filter((c: ProcessedCampaign) => c.status === 'ACTIVE').length,
          totalSpend: totalMetrics.spend,
          totalClicks: totalMetrics.clicks,
          totalImpressions: totalMetrics.impressions,
          totalConversions: totalMetrics.conversions,
          overallCTR: totalMetrics.impressions > 0 ? (totalMetrics.clicks / totalMetrics.impressions) * 100 : 0,
          overallCPC: totalMetrics.clicks > 0 ? totalMetrics.spend / totalMetrics.clicks : 0,
          overallConversionRate: totalMetrics.clicks > 0 ? (totalMetrics.conversions / totalMetrics.clicks) * 100 : 0,
          overallCPA: totalMetrics.conversions > 0 ? totalMetrics.spend / totalMetrics.conversions : 0
        },
        pagination: {
          page,
          pageSize,
          totalPages,
          totalItems,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      },
      success: true
    });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch campaign analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 