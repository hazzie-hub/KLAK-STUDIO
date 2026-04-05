'use client';

import { useState } from 'react';
import { GeneratedImage } from '@/types';
import ImageCard from './ImageCard';
import ImagePreview from './ImagePreview';

interface ImageGalleryProps {
  images: GeneratedImage[];
  prompt: string;
  transformedPrompt?: string;
  onDeleteImage?: (imageId: string) => void;
}

export default function ImageGallery({
  images,
  prompt,
  transformedPrompt,
  onDeleteImage,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div style={{ padding: '32px 32px 120px' }}>
        {/* Prompt display */}
        <div style={{ marginBottom: 24 }}>
          <p style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 8,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            Fikrin
          </p>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: transformedPrompt ? 10 : 0,
          }}>
            {prompt}
          </h2>
          {transformedPrompt && (
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
                {transformedPrompt}
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          background: 'var(--border-subtle)',
          marginBottom: 24,
        }} />

        {/* Grid */}
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

        {/* Footer hint */}
        <p style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginTop: 20,
          fontFamily: 'DM Sans, sans-serif',
        }}>
          Görsele tıkla → büyük önizle · İndir / Sil üstte
        </p>
      </div>

      {/* Preview modal */}
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
