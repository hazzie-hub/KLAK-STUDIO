import { z } from "zod";
import { AksiyonSchema } from "./aksiyon";
import { SlugSchema } from "./ortak";
import { TetikSchema } from "./tetik";

/** Olay: tetik + aksiyon. CLAUDE.md §5 */
export const OlaySchema = z.strictObject({
  id: SlugSchema,
  ad: z
    .string({ error: "Olay adı bir metin olmalı." })
    .min(1, { error: "Olay adı boş olamaz — gizli panelde ve kumandada bu ad görünür." }),
  tetik: TetikSchema,
  aksiyon: AksiyonSchema,
});

export type Olay = z.infer<typeof OlaySchema>;
