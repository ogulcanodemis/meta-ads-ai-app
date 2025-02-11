import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { executeMatchingRules, executeTriggerRules } from '@/lib/automation-service';

export async function POST(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { type } = data;

    if (!type) {
      return NextResponse.json(
        { error: 'Rule type is required' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'matching':
        await executeMatchingRules(user.id);
        break;
      case 'trigger':
        await executeTriggerRules(user.id);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid rule type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully executed ${type} rules`
    });
  } catch (error) {
    console.error('Error executing automation rules:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute automation rules',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 