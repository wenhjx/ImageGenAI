import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import replicate from '../lib/replicate';
import { supabase } from '../lib/supabase';

const router = express.Router();

interface GenerateRequest {
  prompt: string;
  width?: number;
  height?: number;
  num_outputs?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
}

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { prompt, width = 512, height = 512, num_outputs = 1, guidance_scale = 7.5, num_inference_steps = 50, seed } = req.body as GenerateRequest;
    
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: creditData, error: creditError } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (creditError || !creditData) {
      await supabase
        .from('credits')
        .insert({ user_id: user.id, balance: 100 });
      
      return res.status(400).json({ error: 'Insufficient credits. Initial credits added. Please try again.' });
    }

    if (creditData.balance <= 0) {
      return res.status(400).json({ error: 'Insufficient credits. Please purchase more credits.' });
    }

    const imageSize = width > height ? 'landscape_16_9' : height > width ? 'portrait_16_9' : 'square';
    
    const apiUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${imageSize}`;
    
    const generationId = uuidv4();
    
    const { error: insertError } = await supabase.from('generations').insert({
      id: generationId,
      user_id: user.id,
      prompt,
      image_url: apiUrl,
      status: 'succeeded',
      parameters: { width, height, num_outputs, guidance_scale, num_inference_steps, seed },
    });

    if (insertError) {
      console.error('Failed to insert generation:', insertError);
      return res.status(500).json({ error: 'Failed to save generation record' });
    }

    const { error: updateError } = await supabase
      .from('credits')
      .update({ balance: creditData.balance - 1 })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update credits:', updateError);
    }

    res.json({
      id: generationId,
      status: 'succeeded' as const,
      output: [apiUrl],
    });
  } catch (error: any) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

router.get('/status', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.query;
    const user = req.user;
    
    if (!id || !user) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const { data, error } = await supabase
      .from('generations')
      .select('id, prompt, image_url, status, created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

export default router;
