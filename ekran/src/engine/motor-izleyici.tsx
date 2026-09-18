"use client";

import { useEffect, useState } from "react";

import { useSahne } from "./saglayici";

/**
 * GEÇİCİ motor izleyicisi — sadece `?motor=1` ile açılır, asla kendiliğinden değil.
 * CLAUDE.md §2.6: kamerada hiçbir teknik şey görünmez.
 *
 * Gerçek gizli ayar paneli Adım 6'da gelecek (5 dokunuşla açılan, kalıcı yapan).
 * Bu, motorun çalıştığını gözle görmek için.
 */
export function MotorIzleyici() {
  const { sahne, log, bekleyenler, siradaki, elleTetikle, basaSar, dokun } = useSahne();
  const [, tik] = useState(0);

  // Geri sayımın akması için saniyede birkaç kez yenile.
  useEffect(() => {
    const i = setInterval(() => tik((n) => n + 1), 200);
    return () => clearInterval(i);
  }, []);

  const dokunmaHedefleri = [
    ...new Set(
      sahne.olaylar.flatMap((o) => (o.tetik.tur === "dokunma" ? [o.tetik.hedef] : [])),
    ),
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[46vh] overflow-auto border-t border-white/15 bg-[#151517] p-3 font-mono text-[11px] leading-relaxed text-white/85">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <strong className="text-white">motor izleyici</strong>
        <span className="text-white/40">?motor=1 · geçici</span>
        <button
          onClick={basaSar}
          className="ml-auto rounded bg-white/15 px-2 py-1 hover:bg-white/25"
        >
          başa sar
        </button>
      </div>

      {dokunmaHedefleri.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          <span className="py-1 text-white/40">dokunma:</span>
          {dokunmaHedefleri.map((h) => (
            <button
              key={h}
              onClick={() => dokun(h)}
              className="rounded bg-sky-500/25 px-2 py-1 hover:bg-sky-500/40"
            >
              {h}
            </button>
          ))}
        </div>
      )}

      <div className="mb-2 flex flex-wrap gap-1">
        <span className="py-1 text-white/40">elle:</span>
        {sahne.olaylar.map((o) => (
          <button
            key={o.id}
            onClick={() => elleTetikle(o.id)}
            className={`rounded px-2 py-1 ${
              siradaki?.olayId === o.id
                ? "bg-amber-400/35 hover:bg-amber-400/50"
                : "bg-white/10 hover:bg-white/20"
            }`}
            title={o.ad}
          >
            {o.id}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-white/40">gerçekleşen ({log.length})</div>
          {log.length === 0 && <div className="text-white/30">— henüz yok</div>}
          {log.map((k, i) => (
            <div key={`${k.olayId}-${i}`}>
              <span className="text-white/45">{(k.zaman / 1000).toFixed(1)}s</span>{" "}
              <span className="text-emerald-300">{k.olayId}</span>{" "}
              <span className="text-white/35">{k.kaynak}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-white/40">bekleyen ({bekleyenler.length})</div>
          {bekleyenler.length === 0 && <div className="text-white/30">— yok</div>}
          {bekleyenler.map((b) => (
            <div key={b.olayId}>
              <span className="text-amber-300">{b.olayId}</span>{" "}
              <span className="text-white/45">{(b.hedefZaman / 1000).toFixed(1)}s'de</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
