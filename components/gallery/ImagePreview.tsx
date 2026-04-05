'use client';

import { useCallback, useEffect } from 'react';
import { GeneratedImage } from '@/types';
import { downloadImageFromUrl } from '@/lib/downloadImage';

interface ImagePreviewProps {
  image: GeneratedImage;
  onClose: () => void;
  onDeleteImage?: (imageId: string) => void;
}

export default function ImagePreview({ image, onClose, onDeleteImage }: ImagePreviewProps) {
  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDownload = useCallback(() => {
    const safe = image.id.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 40) || 'gorsel';
    void downloadImageFromUrl(image.url, `klak-${safe}.png`);
  }, [image.id, image.url]);

  const handleDelete = useCallback(() => {
    onDeleteImage?.(image.id);
    onClose();
  }, [image.id, onDeleteImage, onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,8,8,0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        animation: 'fade-in-up 0.2s ease forwards',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 720,
          width: '100%',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Önizleme
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handleDownload}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: 'var(--accent-dim)',
                border: '1px solid var(--border-accent)',
                color: 'var(--accent)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              İndir
            </button>
            {onDeleteImage && (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'rgba(255,60,60,0.12)',
                  border: '1px solid rgba(255,80,80,0.35)',
                  color: 'rgba(255,140,140,0.95)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sil
              </button>
            )}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-accent)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          </div>
        </div>

        {/* Image */}
        <div
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid var(--border-default)',
          }}
        >
          <img
            src={image.url}
            alt={image.prompt}
            style={{ width: '100%', display: 'block', maxHeight: '70vh', objectFit: 'contain' }}
          />
        </div>

        {/* Prompt info */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Prompt
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {image.prompt}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <span style={{
              padding: '4px 10px', borderRadius: 6,
              background: 'var(--accent-dim)', border: '1px solid var(--border-accent)',
              fontSize: 11, color: 'var(--accent)',
            }}>
              {image.model}
            </span>
            <span style={{
              padding: '4px 10px', borderRadius: 6,
              background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
              fontSize: 11, color: 'var(--text-muted)',
            }}>
              {image.aspectRatio}
            </span>
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          ESC veya dışarı tıkla kapatmak için
        </p>
      </div>
    </div>
  );
}
