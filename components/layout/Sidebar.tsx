'use client';

import KlakLogo from '@/components/KlakLogo';
import { KLAK_LOGO_HEIGHT } from '@/lib/klakLogoSizes';
import type { GenerateFolder } from '@/types';

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins}dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}sa önce`;
  return `${Math.floor(hrs / 24)}g önce`;
}

function folderImageCount(f: GenerateFolder): number {
  return f.entries.reduce((n, e) => n + e.images.length, 0);
}

interface SidebarProps {
  /** localStorage oturumu yüklendikten sonra true — erken tıklamayı ve yanlış boş UI’ı önler */
  sessionReady: boolean;
  folders: GenerateFolder[];
  activeFolderId: string | null;
  onSelectFolder: (id: string) => void;
  onNewFolder: () => void;
}

export default function Sidebar({
  sessionReady,
  folders,
  activeFolderId,
  onSelectFolder,
  onNewFolder,
}: SidebarProps) {
  const active = folders.find((f) => f.id === activeFolderId);

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <KlakLogo
            style={{
              height: KLAK_LOGO_HEIGHT.sidebar,
              width: 'auto',
              maxWidth: '100%',
              display: 'block',
            }}
          />
        </div>

        <button
          type="button"
          className="neon-solid-btn"
          disabled={!sessionReady}
          onClick={onNewFolder}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 11,
            letterSpacing: '0.02em',
            cursor: sessionReady ? 'pointer' : 'not-allowed',
          }}
        >
          + Yeni klasör
        </button>

        <p
          style={{
            marginTop: 18,
            marginBottom: 0,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Klasörler
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {!sessionReady ? (
          <div
            style={{
              margin: '24px 20px 0',
              padding: '24px 16px',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              background: 'rgba(255,255,255,0.02)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.5,
                color: 'var(--text-muted)',
              }}
            >
              Oturum yükleniyor…
            </p>
          </div>
        ) : folders.length === 0 ? (
          <div
            style={{
              margin: '24px 20px 0',
              padding: '28px 16px',
              borderRadius: 10,
              border: '1px dashed var(--border-subtle)',
              background: 'rgba(255,255,255,0.02)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.5,
                color: 'var(--text-secondary)',
                opacity: 0.8,
              }}
            >
              Henüz klasör yok. Yukarıdan yeni klasör aç.
            </p>
          </div>
        ) : (
          folders.map((folder) => {
            const imgs = folderImageCount(folder);
            const batches = folder.entries.length;
            const isActive = folder.id === activeFolderId;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => onSelectFolder(folder.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  borderLeft: isActive
                    ? '2px solid var(--accent)'
                    : '2px solid transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(255,255,255,0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    color: 'var(--text-primary)',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    maxWidth: '100%',
                  }}
                >
                  {folder.name}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {timeAgo(folder.updatedAt)}
                  {batches > 0 && (
                    <span style={{ marginLeft: 6, color: 'var(--accent)', opacity: 0.75 }}>
                      · {batches} üretim{imgs > 0 ? ` · ${imgs} görsel` : ''}
                    </span>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <p style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {active
            ? `${active.name}: ${folderImageCount(active)} görsel · MVP v0.1`
            : 'MVP v0.1'}
        </p>
      </div>
    </aside>
  );
}
