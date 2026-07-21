const API_BASE_URL = '/api';

export interface GenerateRequest {
  prompt: string;
  width?: number;
  height?: number;
  num_outputs?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
}

export interface GenerateResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed';
  output?: string[];
  error?: string;
}

export interface Generation {
  id: string;
  prompt: string;
  image_url: string;
  status: string;
  created_at: string;
}

export interface GenerationsResponse {
  data: Generation[];
  total: number;
  page: number;
  limit: number;
}

export interface APIKey {
  id: string;
  name: string;
  key?: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Credits {
  balance: number;
  created_at: string;
  updated_at: string;
}

let authToken: string | null = localStorage.getItem('token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  };
  
  const token = authToken || localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const generateImage = async (request: GenerateRequest): Promise<GenerateResponse> => {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate image');
  }
  
  return response.json();
};

export const getGenerationStatus = async (id: string): Promise<Generation> => {
  const response = await fetch(`${API_BASE_URL}/generate/status?id=${id}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch status');
  }
  
  return response.json();
};

export const getGenerations = async (page: number = 1, limit: number = 10): Promise<GenerationsResponse> => {
  const response = await fetch(`${API_BASE_URL}/generations?page=${page}&limit=${limit}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch generations');
  }
  
  return response.json();
};

export const deleteGeneration = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/generations/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete generation');
  }
};

export const downloadGeneration = async (id: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/generations/download/${id}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to download image');
  }
  
  return response.blob();
};

export const getAPIKeys = async (): Promise<APIKey[]> => {
  const response = await fetch(`${API_BASE_URL}/api-keys`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch API keys');
  }
  
  return response.json();
};

export const createAPIKey = async (name: string): Promise<APIKey> => {
  const response = await fetch(`${API_BASE_URL}/api-keys`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create API key');
  }
  
  return response.json();
};

export const deleteAPIKey = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api-keys/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete API key');
  }
};

export const getCredits = async (): Promise<Credits> => {
  const response = await fetch(`${API_BASE_URL}/credits`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch credits');
  }
  
  return response.json();
};

export const getUser = async (): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/user`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch user');
  }
  
  return response.json();
};

export const updateUser = async (data: { name?: string; avatar_url?: string }): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/user`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update user');
  }
  
  return response.json();
};
