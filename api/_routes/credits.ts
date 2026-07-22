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
      .from('credits')
      .select('balance, created_at, updated_at')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const { data: newCredit, error: insertError } = await supabase
          .from('credits')
          .insert({ user_id: user.id, balance: 10 })
          .select('balance, created_at, updated_at')
          .single();
        
        if (insertError) {
          return res.status(500).json({ error: 'Failed to create credits' });
        }
        
        return res.json(newCredit);
      }
      return res.status(500).json({ error: 'Failed to fetch credits' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

export default router;
