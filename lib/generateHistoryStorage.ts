import type {
  AIModel,
  AspectRatio,
  GenerateFolder,
  GeneratedImage,
  PromptHistoryItem,
} from '@/types';

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

/** v2 */
type StoredFolder = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  entries: StoredHistoryItem[];
};

type StoredSessionV2 = {
  v: 2;
  folders: StoredFolder[];
  activeFolderId: string | null;
};

type StoredSessionLegacy = {
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

function reviveFolder(raw: StoredFolder): GenerateFolder | null {
  if (
    typeof raw?.id !== 'string' ||
    typeof raw?.name !== 'string' ||
    typeof raw?.createdAt !== 'string' ||
    typeof raw?.updatedAt !== 'string' ||
    !Array.isArray(raw.entries)
  ) {
    return null;
  }
  const entries = raw.entries.map(reviveItem).filter(Boolean) as PromptHistoryItem[];
  const c = new Date(raw.createdAt);
  const u = new Date(raw.updatedAt);
  if (Number.isNaN(c.getTime()) || Number.isNaN(u.getTime())) return null;
  return {
    id: raw.id,
    name: raw.name,
    createdAt: c,
    updatedAt: u,
    entries,
  };
}

export function flattenFolderImages(folder: GenerateFolder): GeneratedImage[] {
  return folder.entries.flatMap((e) => e.images);
}

function migrateLegacy(p: StoredSessionLegacy): {
  folders: GenerateFolder[];
  activeFolderId: string | null;
} {
  const entries = p.history.map(reviveItem).filter(Boolean) as PromptHistoryItem[];
  const now = new Date();
  const folder: GenerateFolder = {
    id: `fld-mig-${Date.now()}`,
    name: 'Klasör 1',
    createdAt: now,
    updatedAt: now,
    entries,
  };
  return { folders: [folder], activeFolderId: folder.id };
}

export function loadGenerateSession(): {
  folders: GenerateFolder[];
  activeFolderId: string | null;
} {
  if (typeof window === 'undefined') {
    return { folders: [], activeFolderId: null };
  }
  try {
    const raw = localStorage.getItem(GENERATE_SESSION_KEY);
    if (!raw) return { folders: [], activeFolderId: null };
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      return { folders: [], activeFolderId: null };
    }

    const v2 = parsed as Partial<StoredSessionV2>;
    if (v2.v === 2 && Array.isArray(v2.folders)) {
      const folders = v2.folders.map(reviveFolder).filter(Boolean) as GenerateFolder[];
      const activeFolderId =
        typeof v2.activeFolderId === 'string' || v2.activeFolderId === null
          ? v2.activeFolderId
          : null;
      return { folders, activeFolderId };
    }

    const leg = parsed as Partial<StoredSessionLegacy>;
    if (Array.isArray(leg.history)) {
      return migrateLegacy({
        history: leg.history as StoredHistoryItem[],
        activeHistoryId:
          typeof leg.activeHistoryId === 'string' || leg.activeHistoryId === null
            ? leg.activeHistoryId
            : null,
      });
    }

    return { folders: [], activeFolderId: null };
  } catch {
    return { folders: [], activeFolderId: null };
  }
}

export function saveGenerateSession(
  folders: GenerateFolder[],
  activeFolderId: string | null,
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: StoredSessionV2 = {
      v: 2,
      folders: folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
        entries: folder.entries.map((item) => ({
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
      })),
      activeFolderId,
    };
    localStorage.setItem(GENERATE_SESSION_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('Generate session save failed:', e);
  }
}

export function createEmptyFolder(name: string, id?: string): GenerateFolder {
  const now = new Date();
  return {
    id: id ?? `fld-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    createdAt: now,
    updatedAt: now,
    entries: [],
  };
}
