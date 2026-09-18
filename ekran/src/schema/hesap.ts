import { z } from "zod";
import { ModulSchema, SlugSchema } from "./ortak";

/**
 * Kurgusal hesap (sosyal / mesaj). CLAUDE.md §5
 * CLAUDE.md §2.1: gerçek marka ya da gerçek kişi hesabı taklit edilmez.
 */
export const HesapSchema = z.strictObject({
  id: SlugSchema,
  dizi: SlugSchema.optional(),
  modul: ModulSchema,
  kullaniciAdi: z
    .string({ error: "Kullanıcı adı bir metin olmalı." })
    .min(1, { error: "Kullanıcı adı boş olamaz." })
    .regex(/^[a-z0-9._]+$/, {
      error:
        "Kullanıcı adı sadece küçük harf, rakam, nokta ve alt çizgi içerebilir (örn. gonul_yolcusu). Türkçe karakter kullanılmaz.",
    }),
  gorunenAd: z.string().min(1, { error: "Görünen ad boş olamaz — ekranda bu yazar." }),
  avatar: z.string().optional(),
  karakter: SlugSchema.optional(),
  dogrulanmis: z.boolean().optional(),
});

export type Hesap = z.infer<typeof HesapSchema>;
