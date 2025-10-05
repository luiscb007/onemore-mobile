import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

// Middleware to authenticate JWT tokens
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);
      const user = await storage.getUser(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Attach user to request (compatible with Replit Auth format)
      req.user = {
        claims: {
          sub: user.id,
          email: user.email || '',
          first_name: user.firstName || '',
          last_name: user.lastName || '',
          profile_image_url: user.profileImageUrl || '',
        }
      };

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  }

  // No JWT token, continue (might have Replit Auth session)
  next();
};
