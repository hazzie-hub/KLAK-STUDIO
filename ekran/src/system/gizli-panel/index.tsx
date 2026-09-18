"use client";

import { useState } from "react";

import { useSahne } from "@/engine";
import { useKisayol, useKoseDokunusu } from "@/platform/gizli-dokunus";
import { GizliPanel } from "./panel";

/**
 * Gizli ayar panelinin açılma yolları. CLAUDE.md §6
 *
 *  - Sağ üst köşeye 2 sn içinde 5 dokunuş → panel açılır
 *  - `Ctrl+Shift+.` → panel açılır/kapanır (masaüstü)
 *  - Sol üst köşeye 2 sn içinde 5 dokunuş → panelsiz BAŞA SAR
 *
 * Başka hiçbir hareket paneli açmaz: kaydırma, uzun basma ve yavaş yapılan
 * 5 dokunuş sayılmaz. Ekrana görünmez katman konmaz, dokunuşlar sadece dinlenir.
 */
export function GizliKatman() {
  const [acik, setAcik] = useState(false);
  const { basaSar } = useSahne();

  useKoseDokunusu("sagUst", () => setAcik(true), !acik);
  useKoseDokunusu("solUst", basaSar, !acik);
  useKisayol(() => setAcik((a) => !a));

  if (!acik) return null;
  return <GizliPanel kapat={() => setAcik(false)} />;
}

export { GizliPanel } from "./panel";
