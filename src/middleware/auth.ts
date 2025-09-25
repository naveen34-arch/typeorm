import { Request, Response, NextFunction } from 'express';

import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { verifyToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const decoded = verifyToken(token);

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.userId } });

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    req.user = user;
    next(); // ✅ call next properly
  } catch (error) {
    console.error('Auth error:', error);
    res.status(403).json({ success: false, message: 'Invalid token' });
  }
}
