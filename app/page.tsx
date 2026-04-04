'use client';

import { useState, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MainCanvas from '@/components/layout/MainCanvas';
import InputBar from '@/components/input/InputBar';
import ImageGallery from '@/components/gallery/ImageGallery';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { usePromptTransform } from '@/hooks/usePromptTransform';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { AIModel, AspectRatio, GeneratedImage, PromptHistoryItem } from '@/types';

export default function Home() {
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [submittedPrompt, setSubmittedPrompt] = useState('');
  const [transformedPrompt, setTransformedPrompt] = useState('');
  const [model, setModel] = useState<AIModel>('dall-e-3');
  const [aspect, setAspect] = useState<AspectRatio>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const { transform } = usePromptTransform();
  const { generate } = useImageGeneration();

  const handleTranscript = useCallback((text: string) => {
    setPrompt((prev) => prev ? `${prev} ${text}` : text);
    setVoiceError(null);
  }, []);

  const handleVoiceError = useCallback((error: string) => {
    setVoiceError(error);
    setTimeout(() => setVoiceError(null), 3000);
  }, []);

  const { isListening, toggle: toggleMic } = useVoiceInput({
    onTranscript: handleTranscript,
    onError: handleVoiceError,
  });

  const handleHistorySelect = (item: PromptHistoryItem) => {
    setActiveHistoryId(item.id);
    setSubmittedPrompt(item.rawInput);
    setTransformedPrompt(item.transformedPrompt);
    setResults(item.images);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const rawInput = prompt;
    setIsLoading(true);
    setResults([]);
    setSubmittedPrompt(rawInput);
    setPrompt('');

    // Adım 1: Prompt iyileştir
    setStatusMessage('Fikrin işleniyor...');
    const improved = await transform(rawInput);
    setTransformedPrompt(improved);

    // Adım 2: Görsel üret
    setStatusMessage('Görseller üretiliyor... (30-60sn sürebilir)');
    const generated = await generate({ prompt: improved, aspectRatio: aspect, model });

    const seed = Date.now();
    const newResults: GeneratedImage[] = generated.length > 0
      ? generated.map((img, i) => ({
          id: `result-${seed}-${i}`,
          url: img.url,
          prompt: img.revisedPrompt ?? improved,
          aspectRatio: aspect,
          model,
          createdAt: new Date(),
        }))
      : // Hata durumunda mock görseller
        [0, 1, 2].map((i) => ({
          id: `result-${seed}-${i}`,
          url: `https://picsum.photos/seed/${seed + i}/800/800`,
          prompt: improved,
          aspectRatio: aspect,
          model,
          createdAt: new Date(),
        }));

    setResults(newResults);

    const newItem: PromptHistoryItem = {
      id: `h-${seed}`,
      rawInput,
      transformedPrompt: improved,
      images: newResults,
      createdAt: new Date(),
    };

    setHistory((prev) => [newItem, ...prev]);
    setActiveHistoryId(newItem.id);
    setStatusMessage(null);
    setIsLoading(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-void)' }}>
      <Sidebar
        history={history}
        activeId={activeHistoryId}
        onSelect={handleHistorySelect}
      />

      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <MainCanvas>
          {results.length > 0 && (
            <ImageGallery
              images={results}
              prompt={submittedPrompt}
              transformedPrompt={transformedPrompt}
            />
          )}
        </MainCanvas>

        {/* Durum bildirimi */}
        {statusMessage && (
          <div style={{
            position: 'absolute',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--accent-dim)',
            border: '1px solid var(--border-accent)',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: 13,
            color: 'var(--accent)',
            fontFamily: 'DM Sans, sans-serif',
            animation: 'fade-in-up 0.2s ease forwards',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
          }}>
            <div style={{
              width: 12, height: 12,
              border: '1.5px solid var(--accent)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
            {statusMessage}
          </div>
        )}

        {/* Ses hatası */}
        {voiceError && (
          <div style={{
            position: 'absolute',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-overlay)',
            border: '1px solid rgba(255,80,80,0.3)',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: 13,
            color: 'rgba(255,100,100,0.9)',
            fontFamily: 'DM Sans, sans-serif',
            zIndex: 50,
            whiteSpace: 'nowrap',
          }}>
            {voiceError}
          </div>
        )}

        {/* Dinleniyor */}
        {isListening && !voiceError && !statusMessage && (
          <div style={{
            position: 'absolute',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--accent-dim)',
            border: '1px solid var(--border-accent)',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: 13,
            color: 'var(--accent)',
            fontFamily: 'DM Sans, sans-serif',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
          }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 3, height: 12, borderRadius: 2,
                  background: 'var(--accent)',
                  animation: 'glow-pulse 0.8s ease infinite',
                  animationDelay: `${i * 0.15}s`,
                }} />
              ))}
            </div>
            Dinleniyor... Konuş
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <InputBar
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleGenerate}
          isListening={isListening}
          onMicClick={toggleMic}
          model={model}
          onModelChange={setModel}
          aspect={aspect}
          onAspectChange={setAspect}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
