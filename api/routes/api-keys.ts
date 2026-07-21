import express from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import crypto from 'crypto';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, created_at, last_used_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch API keys' });
    }

    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { name } = req.body;
    const user = req.user;
    
    if (!name || !user) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const key = crypto.randomBytes(32).toString('hex');
    const keyPrefix = key.substring(0, 8);
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
      })
      .select('id, name, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create API key' });
    }

    res.json({
      ...data,
      key,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    if (!id || !user) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete API key' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

export default router;
