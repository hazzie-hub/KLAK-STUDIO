'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function navLinkStyle(active: boolean): CSSProperties {
  return {
    fontSize: 11,
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    textDecoration: 'none',
    letterSpacing: active ? '0.08em' : '0.04em',
    textTransform: 'uppercase',
    fontWeight: active ? 600 : 500,
    transition: 'color 0.15s ease',
  };
}

export default function StudioTopNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // İlk paint'te sunucu/istemci aynı kalsın (usePathname SSR'da farklı olabiliyor → hydration hatası)
  const isGenerate = mounted && (pathname === '/' || pathname === '');
  const isWorkflow = mounted && (pathname?.startsWith('/workflow') ?? false);

  return <StudioTopNavInner isGenerate={isGenerate} isWorkflow={isWorkflow} />;
}

/** usePathname Suspense fallback — linkler çalışır, vurgu mount sonrası gelir */
export function StudioTopNavFallback() {
  return <StudioTopNavInner isGenerate={false} isWorkflow={false} />;
}

function StudioTopNavInner({
  isGenerate,
  isWorkflow,
}: {
  isGenerate: boolean;
  isWorkflow: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Link href="/" style={navLinkStyle(isGenerate)}>
        Generate
      </Link>
      <span style={{ color: 'var(--border-default)', fontSize: 10 }}>·</span>
      <Link href="/workflow" style={navLinkStyle(isWorkflow)}>
        Workflow
      </Link>
    </div>
  );
}
