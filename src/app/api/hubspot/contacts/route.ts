import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get contacts from database
    const contacts = await prisma.hubspotContact.findMany({
      where: {
        hubspotAccount: {
          userId: user.id,
          status: 'active'
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({
      data: contacts.map(contact => ({
        id: contact.id,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        company: contact.company,
        phone: contact.phone,
        lifecycleStage: contact.lifecycle_stage,
        lastActivity: contact.lastSyncedAt?.toISOString(),
      })),
      success: true
    });
  } catch (error) {
    console.error('Error fetching HubSpot contacts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch contacts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 