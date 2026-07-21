import express from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, created_at')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({ id: user.id, email: user.email })
          .select('id, email, name, avatar_url, created_at')
          .single();
        
        if (insertError) {
          return res.status(500).json({ error: 'Failed to create user' });
        }
        
        return res.json(newUser);
      }
      return res.status(500).json({ error: 'Failed to fetch user' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, avatar_url } = req.body;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ name, avatar_url, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('id, email, name, avatar_url, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update user' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
