import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const env = {
  PORT: process.env.PORT || '3001',
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

const supabase: SupabaseClient = createClient(env.SUPABASE_URL || '', env.SUPABASE_SERVICE_ROLE_KEY || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
    },
  },
});

interface User {
  id: string;
  email: string;
}

async function authenticate(req: VercelRequest): Promise<User | null> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email || '',
    };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url, method } = req;

  if (method === 'OPTIONS') {
    return res.status(200).json({});
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'GET' && url === '/api/health') {
    return res.status(200).json({ success: true, message: 'ok' });
  }

  if (method === 'GET' && url === '/api/credits') {
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
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
        return res.status(500).json({ error: 'Failed to fetch credits', details: error.message });
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch credits', details: String(error) });
    }
  }

  if (method === 'GET' && url?.startsWith('/api/generations')) {
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { page = 1, limit = 10 } = req.query;
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
        return res.status(500).json({ error: 'Failed to fetch generations', details: error.message });
      }

      return res.json({
        data: data || [],
        total: count || 0,
        page: pageNum,
        limit: limitNum,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch generations', details: String(error) });
    }
  }

  if (method === 'DELETE' && url?.startsWith('/api/generations/')) {
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const id = url.split('/api/generations/')[1];
      
      if (!id) {
        return res.status(400).json({ error: 'Invalid parameters' });
      }

      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        return res.status(500).json({ error: 'Failed to delete generation', details: error.message });
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete generation', details: String(error) });
    }
  }

  if (method === 'GET' && url?.startsWith('/api/generations/download/')) {
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const id = url.split('/api/generations/download/')[1];
      
      if (!id) {
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

      if (data.image_url.startsWith('data:')) {
        const base64Data = data.image_url.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        const contentType = data.image_url.split(';')[0].split(':')[1] || 'image/png';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="generated-${id}.png"`);
        res.setHeader('Cache-Control', 'no-cache');
        
        res.end(buffer);
      } else {
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
          return res.status(500).json({ error: 'Failed to download image', details: String(fetchError) });
        }
      }
    } catch (error) {
      return res.status(500).json({ error: 'Failed to download image', details: String(error) });
    }
  }

  if (method === 'GET' && url === '/api/api-keys') {
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch API keys', details: error.message });
      }

      return res.json(data || []);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch API keys', details: String(error) });
    }
  }

  if (method === 'POST' && url === '/api/api-keys') {
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Invalid parameters' });
      }

      const key = 'sk-' + Math.random().toString(36).substring(2, 26);
      
      const { data, error } = await supabase
        .from('api_keys')
        .insert({ user_id: user.id, name, key })
        .select('id, name, key, created_at')
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to create API key', details: error.message });
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create API key', details: String(error) });
    }
  }

  if (method === 'DELETE' && url?.startsWith('/api/api-keys/')) {
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const id = url.split('/api/api-keys/')[1];
      
      if (!id) {
        return res.status(400).json({ error: 'Invalid parameters' });
      }

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        return res.status(500).json({ error: 'Failed to delete API key', details: error.message });
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete API key', details: String(error) });
    }
  }

  if (method === 'GET' && url === '/api/user') {
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        return res.json({ id: user.id, email: user.email });
      }

      return res.json({ id: user.id, ...data });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch user', details: String(error) });
    }
  }

  if (method === 'POST' && url === '/api/generate') {
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { prompt, width = 512, height = 512, num_outputs = 1, guidance_scale = 7.5, num_inference_steps = 50, seed } = req.body as {
        prompt: string;
        width?: number;
        height?: number;
        num_outputs?: number;
        guidance_scale?: number;
        num_inference_steps?: number;
        seed?: number;
      };
      
      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({ error: 'Prompt is required' });
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
      
      const imageResponse = await fetch(apiUrl);
      
      if (!imageResponse.ok) {
        throw new Error(`Image generation failed: ${imageResponse.status} ${imageResponse.statusText}`);
      }
      
      const imageBlob = await imageResponse.blob();
      const imageBuffer = await imageBlob.arrayBuffer();
      const imageBase64 = `data:${imageBlob.type || 'image/png'};base64,${Buffer.from(imageBuffer).toString('base64')}`;
      
      const { error: insertError, data: generationData } = await supabase.from('generations').insert({
        user_id: user.id,
        prompt,
        image_url: imageBase64,
        status: 'succeeded',
        parameters: { width, height, num_outputs, guidance_scale, num_inference_steps, seed },
      }).select('id').single();

      if (insertError) {
        return res.status(500).json({ error: 'Failed to save generation record', details: insertError.message });
      }

      const { error: updateError } = await supabase
        .from('credits')
        .update({ balance: creditData.balance - 1 })
        .eq('user_id', user.id);

      return res.json({
        status: 'succeeded',
        output: [imageBase64],
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to generate image', details: String(error) });
    }
  }

  if (method === 'GET' && url?.startsWith('/api/generate/status')) {
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { id } = req.query;
      
      if (!id) {
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

      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch status', details: String(error) });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}
