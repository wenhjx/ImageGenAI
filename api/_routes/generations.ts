import express from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = express.Router();

router.get('/download/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    if (!id || !user) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const { data, error } = await supabase
      .from('generations')
      .select('image_url, prompt')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data || !data.image_url) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    try {
      const imageResponse = await fetch(data.image_url);
      
      if (!imageResponse.ok) {
        return res.status(500).json({ error: 'Failed to fetch image' });
      }

      const blob = await imageResponse.blob();
      const buffer = await blob.arrayBuffer();
      
      res.setHeader('Content-Type', blob.type || 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="generated-${id}.png"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      res.end(Buffer.from(buffer));
    } catch (fetchError) {
      console.error('Image fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to download image' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to download image' });
  }
});

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const { data, error, count } = await supabase
      .from('generations')
      .select('id, prompt, image_url, status, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch generations' });
    }

    res.json({
      data: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch generations' });
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
      .from('generations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: 'Failed to delete generation' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete exception:', error);
    res.status(500).json({ error: 'Failed to delete generation' });
  }
});

export default router;
