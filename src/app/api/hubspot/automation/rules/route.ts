import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get all automation rules
export async function GET(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = await prisma.automationRule.findMany({
      where: {
        userId: user.id
      },
      include: {
        logs: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({
      data: rules,
      success: true
    });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch automation rules',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Create new automation rule
export async function POST(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, type, conditions, actions } = data;

    if (!name || !type || !conditions || !actions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const rule = await prisma.automationRule.create({
      data: {
        name,
        type,
        conditions,
        actions,
        userId: user.id
      }
    });

    return NextResponse.json({
      data: rule,
      success: true
    });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create automation rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Update automation rule
export async function PUT(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, name, type, status, conditions, actions } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    const rule = await prisma.automationRule.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    const updatedRule = await prisma.automationRule.update({
      where: { id },
      data: {
        name,
        type,
        status,
        conditions,
        actions,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      data: updatedRule,
      success: true
    });
  } catch (error) {
    console.error('Error updating automation rule:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update automation rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Delete automation rule
export async function DELETE(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    const rule = await prisma.automationRule.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    await prisma.automationRule.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting automation rule:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete automation rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 