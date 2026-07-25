import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
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

interface AuthenticatedRequest extends VercelRequest {
  user?: {
    id: string;
    email: string;
  };
}

const authMiddleware = async (req: AuthenticatedRequest, res: VercelResponse, next: () => void) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    req.user = {
      id: user.id,
      email: user.email || '',
    };
    
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'ok' });
});

app.get('/api/credits', async (req: AuthenticatedRequest, res) => {
  await authMiddleware(req, res, async () => {
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
        return res.status(500).json({ error: 'Failed to fetch credits', details: error.message });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch credits', details: String(error) });
    }
  });
});

app.get('/api/generations', async (req: AuthenticatedRequest, res) => {
  await authMiddleware(req, res, async () => {
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
        return res.status(500).json({ error: 'Failed to fetch generations', details: error.message });
      }

      res.json({
        data: data || [],
        total: count || 0,
        page: pageNum,
        limit: limitNum,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch generations', details: String(error) });
    }
  });
});

app.delete('/api/generations/:id', async (req: AuthenticatedRequest, res) => {
  await authMiddleware(req, res, async () => {
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
        return res.status(500).json({ error: 'Failed to delete generation', details: error.message });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete generation', details: String(error) });
    }
  });
});

app.get('/api/generations/download/:id', async (req: AuthenticatedRequest, res) => {
  await authMiddleware(req, res, async () => {
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
        return res.status(500).json({ error: 'Failed to download image', details: String(fetchError) });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to download image', details: String(error) });
    }
  });
});

app.get('/api/api-keys', async (req: AuthenticatedRequest, res) => {
  await authMiddleware(req, res, async () => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch API keys', details: error.message });
      }

      res.json(data || []);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch API keys', details: String(error) });
    }
  });
});

app.post('/api/api-keys', async (req: AuthenticatedRequest, res) => {
  await authMiddleware(req, res, async () => {
    try {
      const { name } = req.body;
      const user = req.user;
      
      if (!name || !user) {
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

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create API key', details: String(error) });
    }
  });
});

app.delete('/api/api-keys/:id', async (req: AuthenticatedRequest, res) => {
  await authMiddleware(req, res, async () => {
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
        return res.status(500).json({ error: 'Failed to delete API key', details: error.message });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete API key', details: String(error) });
    }
  });
});

app.get('/api/user', async (req: AuthenticatedRequest, res) => {
  await authMiddleware(req, res, async () => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data, error } = await supabase
        .from('users')
        .select('name, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        return res.json({ id: user.id, email: user.email });
      }

      res.json({ id: user.id, ...data });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user', details: String(error) });
    }
  });
});

interface GenerateRequest {
  prompt: string;
  width?: number;
  height?: number;
  num_outputs?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
}

app.post('/api/generate', async (req: AuthenticatedRequest, res) => {
  await authMiddleware(req, res, async () => {
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
      
      const { error: insertError } = await supabase.from('generations').insert({
        user_id: user.id,
        prompt,
        image_url: apiUrl,
        status: 'succeeded',
        parameters: { width, height, num_outputs, guidance_scale, num_inference_steps, seed },
      });

      if (insertError) {
        return res.status(500).json({ error: 'Failed to save generation record', details: insertError.message });
      }

      const { error: updateError } = await supabase
        .from('credits')
        .update({ balance: creditData.balance - 1 })
        .eq('user_id', user.id);

      res.json({
        status: 'succeeded',
        output: [apiUrl],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate image', details: String(error) });
    }
  });
});

app.get('/api/generate/status', async (req: AuthenticatedRequest, res) => {
  await authMiddleware(req, res, async () => {
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
      res.status(500).json({ error: 'Failed to fetch status', details: String(error) });
    }
  });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
