import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateToken } from '@/lib/middleware/auth';
import type { AuthenticatedRequest } from '@/lib/middleware/auth';

interface Campaign {
  id: string;
  status: string;
  budget: number;
}

// Get user profile
export async function GET(request: AuthenticatedRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (authResult) {
      return authResult;
    }

    const userId = request.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
        activities: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        campaigns: {
          select: {
            id: true,
            status: true,
            budget: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const stats = {
      activeCampaigns: user.campaigns.filter((c: Campaign) => c.status === 'active').length,
      totalBudget: user.campaigns.reduce((sum: number, c: Campaign) => sum + (c.budget || 0), 0),
      performanceScore: 92, // This would be calculated based on campaign performance
    };

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      user: userWithoutPassword,
      stats,
    });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request: AuthenticatedRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (authResult) {
      return authResult;
    }

    const userId = request.user?.userId;
    const data = await request.json();

    // Validate input
    const { name, company, position, bio, expertise, socialLinks, phoneNumber, address } = data;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        company,
        position,
        bio,
        expertise,
        socialLinks,
        phoneNumber,
        address,
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        position: true,
        bio: true,
        expertise: true,
        socialLinks: true,
        phoneNumber: true,
        address: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'profile_update',
        description: 'Updated profile information',
        userId,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 