'use client';

import { useState, useCallback } from 'react';
import { AspectRatio, AIModel } from '@/types';

interface GenerateOptions {
  prompt: string;
  aspectRatio: AspectRatio;
  model: AIModel;
}

interface GeneratedResult {
  url: string;
  revisedPrompt?: string;
}

interface UseImageGenerationReturn {
  generate: (options: GenerateOptions) => Promise<GeneratedResult[]>;
  isGenerating: boolean;
  error: string | null;
}

export function useImageGeneration(): UseImageGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async ({ prompt, aspectRatio }: GenerateOptions): Promise<GeneratedResult[]> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Görsel üretilemedi');
      }

      return data.images ?? [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(message);
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generate, isGenerating, error };
}
