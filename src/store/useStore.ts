import { create } from 'zustand';
import { User, Credits, Generation } from '../lib/api';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  token: null,
  setUser: (user) => set({ user, isLoggedIn: user !== null }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, isLoggedIn: false, token: null }),
}));

interface GenerationState {
  isGenerating: boolean;
  generatedImages: string[];
  error: string | null;
  generations: Generation[];
  refreshTrigger: number;
  setIsGenerating: (isGenerating: boolean) => void;
  setGeneratedImages: (images: string[]) => void;
  setError: (error: string | null) => void;
  setGenerations: (generations: Generation[]) => void;
  addGeneration: (generation: Generation) => void;
  clearGeneratedImages: () => void;
  triggerRefresh: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  isGenerating: false,
  generatedImages: [],
  error: null,
  generations: [],
  refreshTrigger: 0,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setGeneratedImages: (images) => set({ generatedImages: images, error: null }),
  setError: (error) => set({ error }),
  setGenerations: (generations) => set({ generations }),
  addGeneration: (generation) => set((state) => ({
    generations: [generation, ...state.generations],
  })),
  clearGeneratedImages: () => set({ generatedImages: [], error: null }),
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));

interface CreditsState {
  balance: number;
  setBalance: (balance: number) => void;
  decrementBalance: () => void;
}

export const useCreditsStore = create<CreditsState>((set) => ({
  balance: 0,
  setBalance: (balance) => set({ balance }),
  decrementBalance: () => set((state) => ({ balance: state.balance - 1 })),
}));

interface PromptState {
  currentPrompt: string;
  promptHistory: string[];
  setCurrentPrompt: (prompt: string) => void;
  addToHistory: (prompt: string) => void;
  clearHistory: () => void;
}

export const usePromptStore = create<PromptState>((set) => ({
  currentPrompt: '',
  promptHistory: [],
  setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
  addToHistory: (prompt) => set((state) => ({
    promptHistory: [prompt, ...state.promptHistory.slice(0, 9)],
  })),
  clearHistory: () => set({ promptHistory: [] }),
}));

interface GenerationParamsState {
  width: number;
  height: number;
  numOutputs: number;
  guidanceScale: number;
  numInferenceSteps: number;
  seed: number | null;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setNumOutputs: (numOutputs: number) => void;
  setGuidanceScale: (scale: number) => void;
  setNumInferenceSteps: (steps: number) => void;
  setSeed: (seed: number | null) => void;
  reset: () => void;
}

export const useGenerationParamsStore = create<GenerationParamsState>((set) => ({
  width: 512,
  height: 512,
  numOutputs: 1,
  guidanceScale: 7.5,
  numInferenceSteps: 50,
  seed: null,
  setWidth: (width) => set({ width }),
  setHeight: (height) => set({ height }),
  setNumOutputs: (numOutputs) => set({ numOutputs }),
  setGuidanceScale: (scale) => set({ guidanceScale: scale }),
  setNumInferenceSteps: (steps) => set({ numInferenceSteps: steps }),
  setSeed: (seed) => set({ seed }),
  reset: () => set({
    width: 512,
    height: 512,
    numOutputs: 1,
    guidanceScale: 7.5,
    numInferenceSteps: 50,
    seed: null,
  }),
}));
