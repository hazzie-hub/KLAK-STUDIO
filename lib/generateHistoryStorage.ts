import type { AIModel, AspectRatio, GeneratedImage, PromptHistoryItem } from '@/types';

export const GENERATE_SESSION_KEY = 'klak-studio-generate-session-v1';

const ASPECTS: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
const MODELS: AIModel[] = ['flux-pro', 'dall-e-3', 'stable-diffusion-3'];

type StoredImage = {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  model: string;
  createdAt: string;
};

type StoredHistoryItem = {
  id: string;
  rawInput: string;
  transformedPrompt: string;
  images: StoredImage[];
  createdAt: string;
};

type StoredSession = {
  history: StoredHistoryItem[];
  activeHistoryId: string | null;
};

function isAspect(s: string): s is AspectRatio {
  return (ASPECTS as string[]).includes(s);
}

function isModel(s: string): s is AIModel {
  return (MODELS as string[]).includes(s);
}

function reviveImage(raw: StoredImage): GeneratedImage | null {
  if (
    typeof raw?.id !== 'string' ||
    typeof raw?.url !== 'string' ||
    typeof raw?.prompt !== 'string' ||
    !isAspect(raw.aspectRatio) ||
    !isModel(raw.model) ||
    typeof raw?.createdAt !== 'string'
  ) {
    return null;
  }
  const d = new Date(raw.createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return {
    id: raw.id,
    url: raw.url,
    prompt: raw.prompt,
    aspectRatio: raw.aspectRatio,
    model: raw.model,
    createdAt: d,
  };
}

function reviveItem(raw: StoredHistoryItem): PromptHistoryItem | null {
  if (
    typeof raw?.id !== 'string' ||
    typeof raw?.rawInput !== 'string' ||
    typeof raw?.transformedPrompt !== 'string' ||
    !Array.isArray(raw.images) ||
    typeof raw?.createdAt !== 'string'
  ) {
    return null;
  }
  const images = raw.images.map(reviveImage).filter(Boolean) as GeneratedImage[];
  const d = new Date(raw.createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return {
    id: raw.id,
    rawInput: raw.rawInput,
    transformedPrompt: raw.transformedPrompt,
    images,
    createdAt: d,
  };
}

export function loadGenerateSession(): {
  history: PromptHistoryItem[];
  activeHistoryId: string | null;
} {
  if (typeof window === 'undefined') {
    return { history: [], activeHistoryId: null };
  }
  try {
    const raw = localStorage.getItem(GENERATE_SESSION_KEY);
    if (!raw) return { history: [], activeHistoryId: null };
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      return { history: [], activeHistoryId: null };
    }
    const p = parsed as Partial<StoredSession>;
    if (!Array.isArray(p.history)) return { history: [], activeHistoryId: null };
    const history = p.history.map(reviveItem).filter(Boolean) as PromptHistoryItem[];
    const activeHistoryId =
      typeof p.activeHistoryId === 'string' || p.activeHistoryId === null
        ? p.activeHistoryId
        : null;
    return { history, activeHistoryId };
  } catch {
    return { history: [], activeHistoryId: null };
  }
}

export function saveGenerateSession(
  history: PromptHistoryItem[],
  activeHistoryId: string | null,
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: StoredSession = {
      history: history.map((item) => ({
        id: item.id,
        rawInput: item.rawInput,
        transformedPrompt: item.transformedPrompt,
        createdAt: item.createdAt.toISOString(),
        images: item.images.map((img) => ({
          id: img.id,
          url: img.url,
          prompt: img.prompt,
          aspectRatio: img.aspectRatio,
          model: img.model,
          createdAt: img.createdAt.toISOString(),
        })),
      })),
      activeHistoryId,
    };
    localStorage.setItem(GENERATE_SESSION_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('Generate session save failed:', e);
  }
}
