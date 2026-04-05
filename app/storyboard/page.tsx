'use client';

import { useState, useCallback } from 'react';
import StudioTopNav from '@/components/layout/StudioTopNav';

type SceneResult = {
  index: number;
  description: string;
  imagePrompt: string;
  imageUrl: string;
};

const SCENE_OPTIONS = [3, 5, 8] as const;

export default function StoryboardPage() {
  const [brief, setBrief] = useState('');
  const [sceneCount, setSceneCount] = useState<(typeof SCENE_OPTIONS)[number]>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenes, setScenes] = useState<SceneResult[] | null>(null);
  const [mockNote, setMockNote] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    const t = brief.trim();
    if (t.length < 10) {
      setError('Senaryoyu biraz daha uzun yaz (en az birkaç cümle).');
      return;
    }
    setError(null);
    setMockNote(null);
    setScenes(null);
    setLoading(true);
    try {
      const res = await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: t, sceneCount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'İstek başarısız');
        return;
      }
      const list = Array.isArray(data.scenes) ? data.scenes : [];
      setScenes(
        list.map((s: SceneResult) => ({
          index: s.index,
          description: s.description,
          imagePrompt: s.imagePrompt,
          imageUrl: s.imageUrl,
        })),
      );
      if (data.mock) {
        setMockNote(
          typeof data.note === 'string'
            ? data.note
            : 'Önizleme modu: API anahtarları veya üretim kısıtı nedeniyle yedek görseller kullanıldı.',
        );
      }
    } catch {
      setError('Bağlantı hatası, tekrar dene.');
    } finally {
      setLoading(false);
    }
  }, [brief, sceneCount]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--bg-void)',
      }}
    >
      <header
        style={{
          height: 52,
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          flexShrink: 0,
        }}
      >
        <StudioTopNav active="storyboard" />
      </header>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 24px 48px',
          maxWidth: 1100,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            Storyboard
          </p>
          <h1
            className="font-display"
            style={{
              fontSize: 26,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              marginBottom: 8,
            }}
          >
            Senaryodan kare kare
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: 520 }}>
            Brief’ini yaz; OpenAI sahnelere böler, her sahne için Flux Pro ile 16:9 görsel üretilir.
          </p>
        </div>

        <label
          style={{
            display: 'block',
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 10,
          }}
        >
          Senaryo / brief
        </label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Örn: Gece yağmurunda yalnız bir dedektif neon tabelaların altında bekliyor. Bir kadın yaklaşır ve zarfta fotoğraf uzatır..."
          disabled={loading}
          rows={8}
          style={{
            width: '100%',
            minHeight: 160,
            padding: '16px 18px',
            borderRadius: 14,
            border: '1px solid var(--border-default)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            fontSize: 14,
            lineHeight: 1.55,
            resize: 'vertical',
            outline: 'none',
            marginBottom: 20,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--border-accent)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-default)';
          }}
        />

        <div style={{ marginBottom: 20 }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              display: 'block',
              marginBottom: 10,
            }}
          >
            Sahne sayısı
          </span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {SCENE_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                disabled={loading}
                onClick={() => setSceneCount(n)}
                style={{
                  minWidth: 52,
                  padding: '10px 18px',
                  borderRadius: 10,
                  border:
                    sceneCount === n
                      ? '1px solid var(--border-accent)'
                      : '1px solid var(--border-default)',
                  background: sceneCount === n ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  color: sceneCount === n ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="neon-solid-btn"
          disabled={loading || brief.trim().length < 10}
          onClick={() => void handleSubmit()}
          style={{
            padding: '14px 28px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading || brief.trim().length < 10 ? 'not-allowed' : 'pointer',
            opacity: loading || brief.trim().length < 10 ? 0.45 : 1,
            marginBottom: 24,
          }}
        >
          {loading ? 'Oluşturuluyor…' : 'Storyboard Oluştur'}
        </button>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(255,60,60,0.1)',
              border: '1px solid rgba(255,80,80,0.35)',
              color: 'rgba(255,160,160,0.95)',
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {loading && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              background: 'var(--accent-dim)',
              border: '1px solid var(--border-accent)',
              color: 'var(--accent)',
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            Sahne planı ve görseller hazırlanıyor; bu işlem birkaç dakika sürebilir…
          </div>
        )}

        {mockNote && scenes && scenes.length > 0 && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              marginBottom: 20,
            }}
          >
            {mockNote}
          </div>
        )}

        {scenes && scenes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {scenes.map((s) => (
              <article
                key={`${s.index}-${s.imageUrl.slice(-20)}`}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 20,
                  alignItems: 'stretch',
                  padding: '22px 22px 22px 20px',
                  borderRadius: 16,
                  border: '1px solid var(--border-subtle)',
                  background: 'linear-gradient(145deg, var(--bg-elevated) 0%, rgba(12,12,12,0.95) 100%)',
                  boxShadow: '0 20px 48px rgba(0,0,0,0.35)',
                }}
              >
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    lineHeight: 1,
                    color: 'var(--accent)',
                    letterSpacing: '-0.04em',
                    minWidth: 56,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {String(s.index).padStart(2, '0')}
                </div>
                <div style={{ flex: '1 1 240px', minWidth: 0, maxWidth: 420 }}>
                  <h2
                    style={{
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: 10,
                    }}
                  >
                    Sahne
                  </h2>
                  <p
                    style={{
                      fontSize: 15,
                      color: 'var(--text-primary)',
                      lineHeight: 1.6,
                      marginBottom: 12,
                    }}
                  >
                    {s.description}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                    }}
                  >
                    {s.imagePrompt}
                  </p>
                </div>
                <div
                  style={{
                    flex: '1 1 320px',
                    minWidth: 260,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-void)',
                    aspectRatio: '16 / 9',
                  }}
                >
                  <img
                    src={s.imageUrl}
                    alt={`Sahne ${s.index}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
