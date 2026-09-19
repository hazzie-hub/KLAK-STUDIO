"use client";

import { useEffect } from "react";

import { useSkin } from "@/shell";
import type { GhostDurumu } from "./kullan";

/**
 * Masaüstünde fiziksel klavye. CLAUDE.md §7
 *
 * Hangi tuşa basıldığı ÖNEMSİZ — sıradaki harf yazılır. Backspace siler,
 * Enter metin bittiyse gönderir.
 *
 * Yorum alanı (`GhostYaziAlani`) ve arama çubuğu (`arama` modülü) aynı
 * davranışı göstermeli; bu yüzden mantık tek yerde durur.
 */
export function useFizikselKlavye(
  ghost: GhostDurumu,
  onGonder?: (metin: string) => void,
): void {
  const skin = useSkin();

  useEffect(() => {
    const dinlensinMi =
      ghost.aktif && ghost.mod !== "serbest" && ghost.mod !== "otomatik" && skin === "desktop";
    if (!dinlensinMi) return;

    const basildi = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        ghost.geriAl();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (ghost.tamamlandi) onGonder?.(ghost.yazilan);
        return;
      }
      if (e.key.length === 1) {
        e.preventDefault();
        ghost.tusaBas();
      }
    };

    window.addEventListener("keydown", basildi);
    return () => window.removeEventListener("keydown", basildi);
  }, [ghost, skin, onGonder]);
}
