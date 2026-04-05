'use client';

import { useState } from 'react';
import { GeneratedImage } from '@/types';
import ImageCard from './ImageCard';
import ImagePreview from './ImagePreview';

interface ImageGalleryProps {
  images: GeneratedImage[];
  /** Aktif klasör adı */
  folderName: string;
  /** Örn. "3 üretim · 12 görsel" */
  summaryLine?: string;
  /** En yeni üretimin ham promptu (varsa) */
  lastRawPrompt?: string;
  lastTransformedPrompt?: string;
  onDeleteImage?: (imageId: string) => void;
}

export default function ImageGallery({
  images,
  folderName,
  summaryLine,
  lastRawPrompt,
  lastTransformedPrompt,
  onDeleteImage,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div style={{ padding: '32px 32px 120px' }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 8,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            Klasör
          </p>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: summaryLine ? 6 : 0,
          }}>
            {folderName}
          </h2>
          {summaryLine && (
            <p style={{
              margin: 0,
              fontSize: 12,
              color: 'var(--text-muted)',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {summaryLine}
            </p>
          )}
        </div>

        {lastRawPrompt && (
          <>
            <div style={{ marginBottom: 20 }}>
              <p style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 8,
                fontFamily: 'DM Sans, sans-serif',
              }}>
                Son üretim
              </p>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: lastTransformedPrompt ? 10 : 0,
                lineHeight: 1.35,
              }}>
                {lastRawPrompt}
              </h3>
              {lastTransformedPrompt && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--border-accent)',
                  marginTop: 8,
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M7 1L8 4.5H11.5L8.75 6.5L9.75 10L7 8L4.25 10L5.25 6.5L2.5 4.5H6L7 1Z" fill="var(--accent)" opacity="0.8"/>
                  </svg>
                  <p style={{
                    fontSize: 12,
                    color: 'var(--accent)',
                    lineHeight: 1.5,
                    fontFamily: 'DM Sans, sans-serif',
                    opacity: 0.85,
                  }}>
                    {lastTransformedPrompt}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <div style={{
          height: 1,
          background: 'var(--border-subtle)',
          marginBottom: 24,
        }} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}>
          {images.map((image, index) => (
            <ImageCard
              key={image.id}
              image={image}
              index={index}
              onClick={setSelectedImage}
              onDelete={onDeleteImage}
            />
          ))}
        </div>

        <p style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginTop: 20,
          fontFamily: 'DM Sans, sans-serif',
        }}>
          Tüm üretimler bu klasörde · Görsele tıkla · İndir / Sil üstte
        </p>
      </div>

      {selectedImage && (
        <ImagePreview
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDeleteImage={onDeleteImage}
        />
      )}
    </>
  );
}
