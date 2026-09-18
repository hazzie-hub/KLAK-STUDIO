import { z } from "zod";
import { GecikmeSchema, SlugSchema } from "./ortak";

/**
 * Tetik türleri. CLAUDE.md §5
 *
 * Not: Her olay, tetiğinden bağımsız olarak her zaman elle de tetiklenebilir.
 * "elle" türü, SADECE elle tetiklenen (zamanlayıcısı olmayan) olaylar içindir.
 */
export const TetikSchema = z.discriminatedUnion(
  "tur",
  [
    /** Sahne açılınca, verilen gecikmeden sonra. */
    z.strictObject({
      tur: z.literal("baslangic"),
      gecikme: GecikmeSchema.default(0),
    }),

    /** Başka bir olaydan sonra. Zincirin halkası. */
    z.strictObject({
      tur: z.literal("sonra"),
      olayId: SlugSchema,
      gecikme: GecikmeSchema,
    }),

    /** Oyuncu bir şeye dokununca. `hedef` bir hotspot adıdır. */
    z.strictObject({
      tur: z.literal("dokunma"),
      hedef: SlugSchema,
    }),

    /** Sadece kumandadan ya da gizli panelden. */
    z.strictObject({
      tur: z.literal("elle"),
    }),
  ],
  {
    error:
      'Tetik türü ("tur") şunlardan biri olmalı: "baslangic", "sonra", "dokunma", "elle".',
  },
);

export type Tetik = z.infer<typeof TetikSchema>;
export type TetikTuru = Tetik["tur"];
