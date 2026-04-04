import { GeneratedImage, PromptHistoryItem } from '@/types';

export const MOCK_IMAGES: GeneratedImage[] = [
  {
    id: '1',
    url: 'https://picsum.photos/seed/cinematic1/800/800',
    prompt: 'A lone figure standing at the edge of a neon-lit rain-soaked city, cinematic, ultra-detailed',
    aspectRatio: '1:1',
    model: 'flux-pro',
    createdAt: new Date(),
  },
  {
    id: '2',
    url: 'https://picsum.photos/seed/cinematic2/800/800',
    prompt: 'A lone figure standing at the edge of a neon-lit rain-soaked city, cinematic, ultra-detailed',
    aspectRatio: '1:1',
    model: 'flux-pro',
    createdAt: new Date(),
  },
  {
    id: '3',
    url: 'https://picsum.photos/seed/cinematic3/800/800',
    prompt: 'A lone figure standing at the edge of a neon-lit rain-soaked city, cinematic, ultra-detailed',
    aspectRatio: '1:1',
    model: 'flux-pro',
    createdAt: new Date(),
  },
];

export const MOCK_HISTORY: PromptHistoryItem[] = [
  {
    id: 'h1',
    rawInput: 'yağmurlu bir şehirde yalnız biri',
    transformedPrompt: 'A lone figure standing at the edge of a neon-lit rain-soaked city, cinematic, ultra-detailed',
    images: MOCK_IMAGES,
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: 'h2',
    rawInput: 'uzayda kaybolan bir astronot',
    transformedPrompt: 'An astronaut drifting silently through deep space, Earth reflecting in their visor, 8k render',
    images: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: 'h3',
    rawInput: 'antik bir kütüphane, gizemli ışık',
    transformedPrompt: 'Ancient gothic library bathed in amber candlelight, dust motes floating, infinite shelves',
    images: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
];

export const AI_MODELS = [
  { value: 'flux-pro', label: 'Flux Pro' },
  { value: 'dall-e-3', label: 'DALL·E 3' },
  { value: 'stable-diffusion-3', label: 'SD 3.5' },
] as const;

export const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1', icon: '⬜' },
  { value: '16:9', label: '16:9', icon: '▬' },
  { value: '9:16', label: '9:16', icon: '▯' },
  { value: '4:3', label: '4:3', icon: '▭' },
  { value: '3:4', label: '3:4', icon: '▮' },
] as const;
