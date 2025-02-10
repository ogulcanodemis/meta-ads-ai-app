import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  userId: string;
  email: string;
}

export async function authenticateToken(req: Request) {
  try {
    // First try to get token from Authorization header
    const authHeader = req.headers.get('Authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (tokenFromHeader) {
      try {
        const decoded = jwt.verify(tokenFromHeader, JWT_SECRET) as JwtPayload;
        if (decoded && decoded.userId) {
          return decoded;
        }
      } catch (jwtError) {
        console.error('JWT verification error:', jwtError);
      }
    }

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function authenticateTokenWithPrisma(req: Request) {
  try {
    const decoded = await authenticateToken(req);
    if (!decoded) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Helper to set secure cookie with token
export async function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });
  return response;
}

// Helper to get token from cookie
export async function getAuthCookie() {
  const cookieStore = cookies();
  return cookieStore.get('auth_token')?.value;
}

// Helper to clear auth cookie
export function clearAuthCookie(response: NextResponse) {
  response.cookies.delete('auth_token');
  return response;
} 