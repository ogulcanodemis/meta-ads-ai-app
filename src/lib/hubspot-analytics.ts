import { prisma } from '@/lib/prisma';

interface PipelineAnalytics {
  stages: {
    name: string;
    count: number;
    value: number;
    color: string;
  }[];
  totalValue: number;
  totalDeals: number;
  conversionRates: {
    fromStage: string;
    toStage: string;
    rate: number;
  }[];
}

// HubSpot deal stage'lerini daha okunabilir hale getiriyoruz
const STAGE_MAPPING = {
  'appointmentscheduled': 'Appointment Scheduled',
  'qualifiedtobuy': 'Qualified to Buy',
  'presentationscheduled': 'Presentation Scheduled',
  'decisionmakerboughtin': 'Decision Maker Bought-In',
  'contractsent': 'Contract Sent',
  'closedwon': 'Closed Won',
  'closedlost': 'Closed Lost'
};

const STAGE_COLORS = {
  'Appointment Scheduled': 'bg-blue-500',
  'Qualified to Buy': 'bg-green-500',
  'Presentation Scheduled': 'bg-yellow-500',
  'Decision Maker Bought-In': 'bg-orange-500',
  'Contract Sent': 'bg-red-500',
  'Closed Won': 'bg-purple-500',
  'Closed Lost': 'bg-gray-500'
};

// Stage sıralaması için
const STAGE_ORDER = [
  'Appointment Scheduled',
  'Qualified to Buy',
  'Presentation Scheduled',
  'Decision Maker Bought-In',
  'Contract Sent',
  'Closed Won',
  'Closed Lost'
];

export async function getPipelineAnalytics(userId: string, dateRange: string): Promise<PipelineAnalytics> {
  try {
    // Get HubSpot account
    const hubspotAccount = await prisma.hubspotAccount.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!hubspotAccount) {
      throw new Error('No active HubSpot account found');
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (dateRange) {
      case 'last7':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last30':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last90':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get deals from database
    const deals = await prisma.hubspotDeal.findMany({
      where: {
        hubspotAccountId: hubspotAccount.id,
        createdAt: {
          gte: startDate
        }
      }
    });

    // Initialize all stages with 0 values
    const initialStages = STAGE_ORDER.reduce((acc, stageName) => {
      acc[stageName] = { count: 0, value: 0 };
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    // Group deals by stage
    const stageGroups = deals.reduce((acc, deal) => {
      // Map HubSpot stage ID to readable name
      const stageName = STAGE_MAPPING[deal.stage.toLowerCase() as keyof typeof STAGE_MAPPING] || deal.stage;
      
      if (!acc[stageName]) {
        acc[stageName] = { count: 0, value: 0 };
      }
      acc[stageName].count++;
      acc[stageName].value += deal.amount || 0;
      return acc;
    }, initialStages);

    // Format stages data in correct order
    const stages = STAGE_ORDER.map(name => ({
      name,
      count: stageGroups[name]?.count || 0,
      value: stageGroups[name]?.value || 0,
      color: STAGE_COLORS[name as keyof typeof STAGE_COLORS] || 'bg-gray-500'
    }));

    // Calculate totals
    const totalValue = stages.reduce((sum, stage) => sum + stage.value, 0);
    const totalDeals = stages.reduce((sum, stage) => sum + stage.count, 0);

    // Calculate conversion rates (excluding Closed Lost)
    const activeStages = stages.filter(stage => stage.name !== 'Closed Lost');
    const conversionRates = activeStages.slice(0, -1).map((stage, index) => {
      const nextStage = activeStages[index + 1];
      const rate = stage.count > 0 ? (nextStage.count / stage.count) * 100 : 0;
      return {
        fromStage: stage.name,
        toStage: nextStage.name,
        rate: Math.min(rate, 100) // Ensure rate doesn't exceed 100%
      };
    });

    return {
      stages: activeStages, // Only return active stages (excluding Closed Lost)
      totalValue,
      totalDeals,
      conversionRates
    };
  } catch (error) {
    console.error('Error getting pipeline analytics:', error);
    throw error;
  }
}

export async function getDealTrends(userId: string, dateRange: string) {
  try {
    // Get HubSpot account
    const hubspotAccount = await prisma.hubspotAccount.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!hubspotAccount) {
      throw new Error('No active HubSpot account found');
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (dateRange) {
      case 'last7':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last30':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last90':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get deals from database
    const deals = await prisma.hubspotDeal.findMany({
      where: {
        hubspotAccountId: hubspotAccount.id,
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group deals by date
    const dealsByDate = deals.reduce((acc, deal) => {
      const date = deal.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          count: 0,
          value: 0
        };
      }
      acc[date].count++;
      acc[date].value += deal.amount || 0;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    return Object.entries(dealsByDate).map(([date, data]) => ({
      date,
      count: data.count,
      value: data.value
    }));
  } catch (error) {
    console.error('Error getting deal trends:', error);
    throw error;
  }
} 