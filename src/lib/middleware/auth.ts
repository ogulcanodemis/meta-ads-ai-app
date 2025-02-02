import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
  };
}

export async function authenticateToken(request: AuthenticatedRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string; email: string };
    request.user = decoded;
    return null;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
} 