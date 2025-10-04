import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export function verifyToken(request: NextRequest): DecodedToken | null {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function requireAuth(request: NextRequest): DecodedToken {
  const decoded = verifyToken(request);
  
  if (!decoded) {
    throw new Error('Unauthorized');
  }
  
  return decoded;
}

export function requireAdmin(request: NextRequest): DecodedToken {
  const decoded = requireAuth(request);
  
  if (decoded.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  
  return decoded;
}