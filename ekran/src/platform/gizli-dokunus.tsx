"use client";

import { useEffect, useRef } from "react";

import { DokunusSayaci, koseIcinde } from "./dokunus-sayaci";

/** Dokunuşun "dokunuş" sayılması için izin verilen en fazla hareket ve süre. */
const EN_FAZLA_KAYMA = 12;
const EN_FAZLA_SURE = 700;

/**
 * Köşeye 5 dokunuş dinleyicisi. CLAUDE.md §6
 *
 * Ekrana görünmez bir katman KOYMAZ — dokunuşları sadece dinler, böylece
 * altındaki modül normal çalışmaya devam eder. Kaydırma ve uzun basma
 * dokunuş sayılmaz; "başka hiçbir hareket paneli açmamalı" kuralı bu.
 */
export function useKoseDokunusu(
  kose: "sagUst" | "solUst",
  onTetik: () => void,
  etkin = true,
): void {
  const sayacRef = useRef(new DokunusSayaci());
  const basimRef = useRef<{ x: number; y: number; zaman: number } | null>(null);
  const tetikRef = useRef(onTetik);
  tetikRef.current = onTetik;

  useEffect(() => {
    if (!etkin) return;

    const alanOlcusu = () => {
      const el = document.querySelector("[data-oynatici]");
      if (el === null) {
        return { sol: 0, ust: 0, genislik: window.innerWidth, yukseklik: window.innerHeight };
      }
      const r = el.getBoundingClientRect();
      return { sol: r.left, ust: r.top, genislik: r.width, yukseklik: r.height };
    };

    const basildi = (e: PointerEvent) => {
      basimRef.current = { x: e.clientX, y: e.clientY, zaman: e.timeStamp };
    };

    const birakildi = (e: PointerEvent) => {
      const basim = basimRef.current;
      basimRef.current = null;
      if (basim === null) return;

      const kayma = Math.hypot(e.clientX - basim.x, e.clientY - basim.y);
      const sure = e.timeStamp - basim.zaman;
      if (kayma > EN_FAZLA_KAYMA || sure > EN_FAZLA_SURE) {
        sayacRef.current.sifirla();
        return;
      }

      if (!koseIcinde({ x: e.clientX, y: e.clientY }, alanOlcusu(), kose)) {
        sayacRef.current.sifirla();
        return;
      }

      if (sayacRef.current.dokun(e.timeStamp)) tetikRef.current();
    };

    window.addEventListener("pointerdown", basildi, { passive: true });
    window.addEventListener("pointerup", birakildi, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", basildi);
      window.removeEventListener("pointerup", birakildi);
    };
  }, [kose, etkin]);
}

/** `Ctrl+Shift+.` — masaüstünde panel kısayolu (CLAUDE.md §6). */
export function useKisayol(onTetik: () => void): void {
  const tetikRef = useRef(onTetik);
  tetikRef.current = onTetik;

  useEffect(() => {
    const basildi = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "." || e.code === "Period")) {
        e.preventDefault();
        tetikRef.current();
      }
    };
    window.addEventListener("keydown", basildi);
    return () => window.removeEventListener("keydown", basildi);
  }, []);
}
