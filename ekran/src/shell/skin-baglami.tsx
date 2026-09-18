"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Skin } from "@/schema";

/** Aktif kabuk — sistem katmanı ve modüller görünümlerini buna göre ayarlar. */
const Baglam = createContext<Skin>("ios");

export function SkinSaglayici({ skin, children }: { skin: Skin; children: ReactNode }) {
  return <Baglam.Provider value={skin}>{children}</Baglam.Provider>;
}

export function useSkin(): Skin {
  return useContext(Baglam);
}
