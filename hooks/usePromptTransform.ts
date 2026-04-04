'use client';

import { useState, useCallback } from 'react';

interface UsePromptTransformReturn {
  transform: (prompt: string) => Promise<string>;
  isTransforming: boolean;
  error: string | null;
}

export function usePromptTransform(): UsePromptTransformReturn {
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transform = useCallback(async (prompt: string): Promise<string> => {
    setIsTransforming(true);
    setError(null);

    try {
      const response = await fetch('/api/transform-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Prompt dönüştürme başarısız');
      }

      return data.transformedPrompt;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(message);
      // Hata durumunda orijinal prompt'u döndür
      return prompt;
    } finally {
      setIsTransforming(false);
    }
  }, []);

  return { transform, isTransforming, error };
}
