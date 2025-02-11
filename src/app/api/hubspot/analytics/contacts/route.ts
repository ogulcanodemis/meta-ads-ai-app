import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get HubSpot account
    const hubspotAccount = await prisma.hubspotAccount.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      }
    });

    if (!hubspotAccount) {
      throw new Error('No active HubSpot account found');
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'last30';

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

    // Get all contacts
    const contacts = await prisma.hubspotContact.findMany({
      where: {
        hubspotAccountId: hubspotAccount.id,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        deals: true
      }
    });

    // Calculate total contacts
    const totalContacts = contacts.length;

    // Calculate active contacts (contacts with recent activity)
    const activeContacts = contacts.filter(contact => {
      const lastActivity = contact.lastSyncedAt || contact.updatedAt;
      const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceActivity <= 30;
    }).length;

    // Group contacts by source
    const sourceGroups = contacts.reduce((acc, contact) => {
      const properties = contact.properties as any;
      const source = properties?.source || 'Direct';
      
      if (!acc[source]) {
        acc[source] = {
          count: 0,
          deals: 0
        };
      }
      
      acc[source].count++;
      acc[source].deals += contact.deals.length;
      
      return acc;
    }, {} as Record<string, { count: number; deals: number }>);

    // Calculate source metrics
    const sources = Object.entries(sourceGroups).map(([source, data]) => ({
      source,
      count: data.count,
      percentage: (data.count / totalContacts) * 100,
      conversionRate: data.count > 0 ? (data.deals / data.count) * 100 : 0,
      engagementScore: Math.random() * 10 // This should be calculated based on actual engagement metrics
    })).sort((a, b) => b.count - a.count);

    // Calculate contact growth
    const growth = await Promise.all(
      Array.from({ length: 7 }).map(async (_, index) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - index));
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        const newContacts = await prisma.hubspotContact.count({
          where: {
            hubspotAccountId: hubspotAccount.id,
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        });

        const totalContacts = await prisma.hubspotContact.count({
          where: {
            hubspotAccountId: hubspotAccount.id,
            createdAt: {
              lt: nextDate
            }
          }
        });

        return {
          date: date.toISOString(),
          newContacts,
          totalContacts
        };
      })
    );

    // Calculate average engagement (this should be based on actual engagement metrics)
    const averageEngagement = 7.5;

    // Calculate overall conversion rate
    const totalDeals = contacts.reduce((sum, contact) => sum + contact.deals.length, 0);
    const conversionRate = totalContacts > 0 ? (totalDeals / totalContacts) * 100 : 0;

    return NextResponse.json({
      data: {
        sources,
        growth,
        totalContacts,
        activeContacts,
        averageEngagement,
        conversionRate
      },
      success: true
    });
  } catch (error) {
    console.error('Error fetching contact analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch contact analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 