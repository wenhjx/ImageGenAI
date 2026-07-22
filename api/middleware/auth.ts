import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { env } from '../lib/env';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('[Auth Middleware] getUser error:', error);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    req.user = {
      id: user.id,
      email: user.email || '',
    };
    
    next();
  } catch (error) {
    console.error('[Auth Middleware] Exception:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};
