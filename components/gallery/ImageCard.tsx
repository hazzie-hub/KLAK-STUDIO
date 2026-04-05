'use client';

import { useCallback, useState } from 'react';
import type { CSSProperties } from 'react';
import { GeneratedImage } from '@/types';
import { downloadImageFromUrl } from '@/lib/downloadImage';

const actionBtn: CSSProperties = {
  padding: '6px 10px',
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 600,
  fontFamily: 'DM Sans, sans-serif',
  cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(8,8,8,0.75)',
  color: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(8px)',
  transition: 'border-color 0.15s ease, background 0.15s ease',
};

interface ImageCardProps {
  image: GeneratedImage;
  index: number;
  onClick: (image: GeneratedImage) => void;
  onDelete?: (imageId: string) => void;
}

export default function ImageCard({ image, index, onClick, onDelete }: ImageCardProps) {
  const [hover, setHover] = useState(false);

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const safe = image.id.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 40) || 'gorsel';
      void downloadImageFromUrl(image.url, `klak-${safe}.png`);
    },
    [image.id, image.url],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onDelete?.(image.id);
    },
    [image.id, onDelete],
  );

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-elevated)',
        aspectRatio: '1 / 1',
        width: '100%',
        animation: 'fade-in-up 0.4s ease forwards',
        animationDelay: `${index * 0.1}s`,
        opacity: 0,
        transition: 'transform 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        setHover(true);
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-accent)';
      }}
      onMouseLeave={(e) => {
        setHover(false);
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
      }}
    >
      <button
        type="button"
        onClick={() => onClick(image)}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          padding: 0,
          margin: 0,
          border: 'none',
          cursor: 'pointer',
          background: 'transparent',
        }}
        aria-label="Önizle"
      >
        <img
          src={image.url}
          alt={image.prompt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      </button>

      {/* Üst: indir / sil — yalnızca kart hover */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          left: 8,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 6,
          zIndex: 2,
          opacity: hover ? 1 : 0,
          pointerEvents: hover ? 'auto' : 'none',
          transition: 'opacity 0.2s ease',
        }}
      >
        <button
          type="button"
          onClick={handleDownload}
          style={actionBtn}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-accent)';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,214,10,0.12)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(8,8,8,0.75)';
          }}
        >
          İndir
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            style={{
              ...actionBtn,
              borderColor: 'rgba(255,80,80,0.35)',
              color: 'rgba(255,140,140,0.95)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,60,60,0.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(8,8,8,0.75)';
            }}
          >
            Sil
          </button>
        )}
      </div>

      {/* Alt hover: önizle ipucu */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(8,8,8,0.8) 0%, transparent 50%)',
          opacity: hover ? 1 : 0,
          transition: 'opacity 0.2s ease',
          display: 'flex',
          alignItems: 'flex-end',
          padding: 14,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1H5V5H1V1Z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M9 1H13V5H9V1Z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M1 9H5V13H1V9Z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M9 9H13V13H9V9Z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans, sans-serif' }}>
            Önizle
          </span>
        </div>
      </div>

      {/* Index badge */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          width: 22,
          height: 22,
          borderRadius: 6,
          background: 'rgba(8,8,8,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'Syne, sans-serif',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {index + 1}
      </div>
    </div>
  );
}
