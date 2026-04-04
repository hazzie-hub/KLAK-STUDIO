export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export type AIModel = 'flux-pro' | 'dall-e-3' | 'stable-diffusion-3';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: AspectRatio;
  model: AIModel;
  createdAt: Date;
}

export interface PromptHistoryItem {
  id: string;
  rawInput: string;
  transformedPrompt: string;
  images: GeneratedImage[];
  createdAt: Date;
}

export interface AppState {
  rawInput: string;
  transformedPrompt: string | null;
  selectedModel: AIModel;
  selectedAspect: AspectRatio;
  isTransforming: boolean;
  isGenerating: boolean;
  results: GeneratedImage[];
  selectedImage: GeneratedImage | null;
  history: PromptHistoryItem[];
}
