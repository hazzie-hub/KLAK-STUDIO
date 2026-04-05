'use client';

import { useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MainCanvas from '@/components/layout/MainCanvas';
import InputBar from '@/components/input/InputBar';
import ImageGallery from '@/components/gallery/ImageGallery';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { usePromptTransform } from '@/hooks/usePromptTransform';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import {
  createEmptyFolder,
  flattenFolderImages,
  loadGenerateSession,
  saveGenerateSession,
} from '@/lib/generateHistoryStorage';
import { AIModel, AspectRatio, GenerateFolder, GeneratedImage, PromptHistoryItem } from '@/types';

export default function Home() {
  const [folders, setFolders] = useState<GenerateFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<AIModel>('flux-pro');
  const [aspect, setAspect] = useState<AspectRatio>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeFolderIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeFolderIdRef.current = activeFolderId;
  }, [activeFolderId]);

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === activeFolderId) ?? null,
    [folders, activeFolderId],
  );

  const results = useMemo(
    () => (activeFolder ? flattenFolderImages(activeFolder) : []),
    [activeFolder],
  );

  const { transform } = usePromptTransform();
  const { generate } = useImageGeneration();

  useLayoutEffect(() => {
    const { folders: loaded, activeFolderId: aid } = loadGenerateSession();
    let list = loaded;
    if (list.length === 0) {
      list = [createEmptyFolder('Klasör 1')];
    }
    const act = aid && list.some((f) => f.id === aid) ? aid : list[0].id;
    setFolders(list);
    setActiveFolderId(act);
    setSessionReady(true);
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    saveGenerateSession(folders, activeFolderId);
  }, [sessionReady, folders, activeFolderId]);

  const handleTranscript = useCallback((text: string) => {
    setPrompt((prev) => (prev ? `${prev} ${text}` : text));
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

  const handleSelectFolder = useCallback((id: string) => {
    setActiveFolderId(id);
  }, []);

  const handleNewFolder = useCallback(() => {
    if (!sessionReady) return;
    let newFolderId: string | null = null;
    setFolders((prev) => {
      const f = createEmptyFolder(`Klasör ${prev.length + 1}`);
      newFolderId = f.id;
      return [f, ...prev];
    });
    if (newFolderId) setActiveFolderId(newFolderId);
  }, [sessionReady]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !sessionReady) return;

    const rawInput = prompt;
    const targetFolderId = activeFolderIdRef.current;
    if (!targetFolderId) return;

    setIsLoading(true);
    setPrompt('');

    setStatusMessage('Fikrin işleniyor...');
    const improved = await transform(rawInput);

    setStatusMessage('Görseller üretiliyor... (30-60sn sürebilir)');
    const generated = await generate({ prompt: improved, aspectRatio: aspect, model });

    const seed = Date.now();
    const newResults: GeneratedImage[] =
      generated.length > 0
        ? generated.map((img, i) => ({
            id: `result-${seed}-${i}`,
            url: img.url,
            prompt: img.revisedPrompt ?? improved,
            aspectRatio: aspect,
            model,
            createdAt: new Date(),
          }))
        : [0, 1, 2].map((i) => ({
            id: `result-${seed}-${i}`,
            url: `https://picsum.photos/seed/${seed + i}/800/800`,
            prompt: improved,
            aspectRatio: aspect,
            model,
            createdAt: new Date(),
          }));

    const newItem: PromptHistoryItem = {
      id: `h-${seed}`,
      rawInput,
      transformedPrompt: improved,
      images: newResults,
      createdAt: new Date(),
    };

    setFolders((prev) =>
      prev.map((f) =>
        f.id === targetFolderId
          ? { ...f, entries: [newItem, ...f.entries], updatedAt: new Date() }
          : f,
      ),
    );

    setStatusMessage(null);
    setIsLoading(false);
  };

  const handleDeleteImage = useCallback((imageId: string) => {
    const fid = activeFolderIdRef.current;
    setFolders((prev) =>
      prev.map((folder) => {
        if (folder.id !== fid) return folder;
        const entries = folder.entries
          .map((entry) => ({
            ...entry,
            images: entry.images.filter((i) => i.id !== imageId),
          }))
          .filter((entry) => entry.images.length > 0);
        return { ...folder, entries, updatedAt: new Date() };
      }),
    );
  }, []);

  const lastEntry = activeFolder?.entries[0];
  const batchCount = activeFolder?.entries.length ?? 0;
  const summaryLine =
    batchCount > 0 ? `${batchCount} üretim · ${results.length} görsel` : undefined;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-void)' }}>
      <Sidebar
        sessionReady={sessionReady}
        folders={folders}
        activeFolderId={activeFolderId}
        onSelectFolder={handleSelectFolder}
        onNewFolder={handleNewFolder}
      />

      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <MainCanvas>
          {results.length > 0 && activeFolder && (
            <ImageGallery
              images={results}
              folderName={activeFolder.name}
              summaryLine={summaryLine}
              lastRawPrompt={lastEntry?.rawInput}
              lastTransformedPrompt={lastEntry?.transformedPrompt}
              onDeleteImage={handleDeleteImage}
            />
          )}
        </MainCanvas>

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
          disabled={!sessionReady}
        />
      </div>
    </div>
  );
}
