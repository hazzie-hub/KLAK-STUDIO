import { z } from "zod";
import { SlugSchema } from "./ortak";

/**
 * İçerik kütüphanesi. CLAUDE.md §5
 * Sahneler arasında yeniden kullanılabilir parçalar: post, sohbet, arama sonucu, web sayfası, konum, foto.
 *
 * Faz 1 sadece `post` ve `foto` kullanır; diğerlerinin ayrıntılı şeması
 * ilgili modül geldiğinde (Faz 3–4) doldurulur, şimdilik serbest bırakılır.
 */

const IleridekiFazVerisi = z.record(z.string(), z.unknown());

/** Sosyal medya postu — `sosyal` modülü (Faz 1). */
export const PostVerisiSchema = z.strictObject({
  hesap: SlugSchema,
  gorsel: z.string().min(1, { error: "Postun görseli belirtilmeli." }),
  aciklama: z.string().default(""),
  konum: z.string().optional(),
  tarih: z.string().optional(),
  begeniSayisi: z.number().int().min(0).optional(),
  yorumlar: z
    .array(
      z.strictObject({
        hesap: SlugSchema,
        metin: z.string().min(1, { error: "Yorum metni boş olamaz." }),
      }),
    )
    .default([]),
});

/** Tek fotoğraf — `galeri` (Faz 4) ve mesaj ekleri. */
export const FotoVerisiSchema = z.strictObject({
  dosya: z.string().min(1, { error: "Fotoğrafın dosyası belirtilmeli." }),
  aciklama: z.string().optional(),
  tarih: z.string().optional(),
});

export const IcerikSchema = z.discriminatedUnion(
  "tur",
  [
    z.strictObject({ tur: z.literal("post"), id: SlugSchema, dizi: SlugSchema.optional(), veri: PostVerisiSchema }),
    z.strictObject({ tur: z.literal("foto"), id: SlugSchema, dizi: SlugSchema.optional(), veri: FotoVerisiSchema }),
    z.strictObject({ tur: z.literal("sohbet"), id: SlugSchema, dizi: SlugSchema.optional(), veri: IleridekiFazVerisi }),
    z.strictObject({ tur: z.literal("aramaSonucu"), id: SlugSchema, dizi: SlugSchema.optional(), veri: IleridekiFazVerisi }),
    z.strictObject({ tur: z.literal("webSayfasi"), id: SlugSchema, dizi: SlugSchema.optional(), veri: IleridekiFazVerisi }),
    z.strictObject({ tur: z.literal("konum"), id: SlugSchema, dizi: SlugSchema.optional(), veri: IleridekiFazVerisi }),
  ],
  {
    error:
      'İçerik türü şunlardan biri olmalı: post, sohbet, aramaSonucu, webSayfasi, konum, foto.',
  },
);

export type Icerik = z.infer<typeof IcerikSchema>;
export type PostVerisi = z.infer<typeof PostVerisiSchema>;
export type FotoVerisi = z.infer<typeof FotoVerisiSchema>;
