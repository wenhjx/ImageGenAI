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

    console.log('[Credits API] Fetching credits for user:', user.id);
    
    const { data, error } = await supabase
      .from('credits')
      .select('balance, created_at, updated_at')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[Credits API] Fetch error:', error);
      
      if (error.code === 'PGRST116') {
        console.log('[Credits API] Creating new credits for user:', user.id);
        
        const { data: newCredit, error: insertError } = await supabase
          .from('credits')
          .insert({ user_id: user.id, balance: 10 })
          .select('balance, created_at, updated_at')
          .single();
        
        if (insertError) {
          console.error('[Credits API] Insert error:', insertError);
          return res.status(500).json({ error: 'Failed to create credits' });
        }
        
        return res.json(newCredit);
      }
      
      return res.status(500).json({ error: 'Failed to fetch credits', details: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('[Credits API] Exception:', error);
    res.status(500).json({ error: 'Failed to fetch credits', details: String(error) });
  }
});

export default router;
