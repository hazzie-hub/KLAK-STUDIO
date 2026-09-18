import { z } from "zod";
import { DurumSchema, SkinSchema, SlugSchema } from "./ortak";

/** Rehber kaydı — `telefon` modülü (Faz 3) kullanır, cihazda durur. */
export const RehberKaydiSchema = z.strictObject({
  ad: z.string().min(1, { error: "Rehberdeki ad boş olamaz." }),
  numara: z.string().optional(),
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
  varsayilanDurum: DurumSchema.optional(),
});

export type Cihaz = z.infer<typeof CihazSchema>;
export type RehberKaydi = z.infer<typeof RehberKaydiSchema>;
