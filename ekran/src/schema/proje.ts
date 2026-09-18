import { z } from "zod";
import { SlugSchema } from "./ortak";

/** Dizi / Bölüm / Karakter. CLAUDE.md §5 — asıl yeri Stüdyo (Faz 4). */

export const DiziSchema = z.strictObject({
  kod: SlugSchema,
  ad: z.string().min(1, { error: "Dizi adı boş olamaz." }),
});

export const BolumSchema = z.strictObject({
  dizi: SlugSchema,
  no: z.number().int().min(1, { error: "Bölüm numarası 1 veya daha büyük olmalı." }),
  ad: z.string().optional(),
});

export const KarakterSchema = z.strictObject({
  id: SlugSchema,
  dizi: SlugSchema,
  ad: z.string().min(1, { error: "Karakter adı boş olamaz." }),
  notlar: z.string().optional(),
});

export type Dizi = z.infer<typeof DiziSchema>;
export type Bolum = z.infer<typeof BolumSchema>;
export type Karakter = z.infer<typeof KarakterSchema>;
