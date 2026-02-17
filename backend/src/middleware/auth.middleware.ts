import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    tier: string;
  };
}

export async function verifyAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        data: null,
        error: { message: 'No token provided' },
        message: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      data: null,
      error: { message: 'Invalid or expired token' },
      message: 'Invalid or expired token'
    });
  }
}
