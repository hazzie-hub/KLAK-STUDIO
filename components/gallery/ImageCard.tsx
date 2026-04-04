'use client';

import { GeneratedImage } from '@/types';

interface ImageCardProps {
  image: GeneratedImage;
  index: number;
  onClick: (image: GeneratedImage) => void;
}

export default function ImageCard({ image, index, onClick }: ImageCardProps) {
  return (
    <button
      onClick={() => onClick(image)}
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-elevated)',
        cursor: 'pointer',
        padding: 0,
        aspectRatio: '1 / 1',
        width: '100%',
        animation: 'fade-in-up 0.4s ease forwards',
        animationDelay: `${index * 0.1}s`,
        opacity: 0,
        transition: 'transform 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-accent)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
      }}
    >
      {/* Image */}
      <img
        src={image.url}
        alt={image.prompt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* Hover overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(8,8,8,0.8) 0%, transparent 50%)',
          opacity: 0,
          transition: 'opacity 0.2s ease',
          display: 'flex',
          alignItems: 'flex-end',
          padding: 14,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.opacity = '0';
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
        }}
      >
        {index + 1}
      </div>
    </button>
  );
}
