import { z } from "zod";
import { DurumSchema, SkinSchema, SlugSchema } from "./ortak";

/** Rehber kaydı — `telefon` modülü (Faz 3) kullanır, cihazda durur. */
export const RehberKaydiSchema = z.strictObject({
  ad: z.string().min(1, { error: "Rehberdeki ad boş olamaz." }),
  numara: z.string().optional(),
  karakter: SlugSchema.optional(),
});

/**
 * Arama geçmişi kaydı — `telefon` modülü (Faz 3).
 *
 * Rehber gibi CİHAZDA durur, içerik kütüphanesinde değil: bir telefonun
 * arama geçmişi o telefona aittir, sahneler arasında paylaşılmaz.
 *
 * Sahne SIRASINDA gelen aramalar buraya yazılmaz; onlar olaylardan türetilir
 * (bkz. `src/modules/telefon/veri.ts`), böylece başa sarınca geçmiş de
 * sahnenin başındaki haline döner.
 */
export const AramaKaydiSchema = z.strictObject({
  ad: z.string().min(1, { error: "Arama kaydındaki ad boş olamaz." }),
  numara: z.string().optional(),
  yon: z.enum(["gelen", "giden", "cevapsiz"], {
    error: 'Arama yönü "gelen", "giden" veya "cevapsiz" olabilir.',
  }),
  /** Serbest metin: "dün 21:14", "Pazartesi", "13:05". */
  zaman: z.string().min(1, { error: "Arama zamanı boş olamaz." }),
  /** Konuşma süresi: "4:12". Cevapsızda olmaz. */
  sure: z.string().optional(),
  karakter: SlugSchema.optional(),
});

/** Cihaz. CLAUDE.md §5 */
export const CihazSchema = z.strictObject({
  kod: SlugSchema,
  karakter: SlugSchema.optional(),
  skin: SkinSchema,
  model: z.string().optional(),
  duvarKagidi: z.string().optional(),
  kilitEkrani: z.string().optional(),
  rehber: z.array(RehberKaydiSchema).default([]),
  aramaGecmisi: z.array(AramaKaydiSchema).default([]),
  varsayilanDurum: DurumSchema.optional(),
});

export type Cihaz = z.infer<typeof CihazSchema>;
export type RehberKaydi = z.infer<typeof RehberKaydiSchema>;
export type AramaKaydi = z.infer<typeof AramaKaydiSchema>;
