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

/** Sohbet — `mesaj` modülü (Faz 3). */
export const SohbetVerisiSchema = z.strictObject({
  /** Karşı taraf. Kendi hesabımız sahneden gelir. */
  hesap: SlugSchema,
  mesajlar: z
    .array(
      z.strictObject({
        /** Kim yazdı: "ben" (cihazın sahibi) ya da karşı tarafın hesabı. */
        kim: z.union([z.literal("ben"), SlugSchema]),
        metin: z.string().optional(),
        /** Fotoğraf eki — /ornek altındaki dosya. */
        gorsel: z.string().optional(),
        saat: z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'Saat "SS:DD" biçiminde olmalı.' })
          .optional(),
        /** Sadece "ben" mesajlarında: gönderildi / iletildi / görüldü. */
        durum: z.enum(["gonderildi", "iletildi", "goruldu"]).optional(),
      }),
    )
    .default([]),
});

/**
 * Arama motoru sonuç sayfası — `arama` modülü (Faz 3).
 *
 * `adres` kameraya çıkar: gerçek bir alan adı YAZILMAZ, kurgusal olmalı.
 * `siteRef` ileride `web` modülündeki sahte siteye derin link olacak.
 */
export const AramaSonucuVerisiSchema = z.strictObject({
  sorgu: z.string().min(1, { error: "Aranan metin boş olamaz." }),
  /** Sonuç sayısı satırı: "Yaklaşık 214.000 sonuç (0,38 saniye)". */
  bilgi: z.string().optional(),
  sonuclar: z
    .array(
      z.strictObject({
        baslik: z.string().min(1, { error: "Sonuç başlığı boş olamaz." }),
        adres: z.string().min(1, { error: "Sonucun görünen adresi boş olamaz." }),
        ozet: z.string().default(""),
        siteRef: SlugSchema.optional(),
        /** Sonucun yanındaki küçük görsel — /ornek altındaki dosya. */
        gorsel: z.string().optional(),
      }),
    )
    .default([]),
  /** "Görseller" sekmesi — /ornek altındaki dosyalar. */
  gorseller: z.array(z.string()).default([]),
  /** Sayfanın altındaki ilgili aramalar. */
  oneriler: z.array(z.string()).default([]),
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
    z.strictObject({ tur: z.literal("sohbet"), id: SlugSchema, dizi: SlugSchema.optional(), veri: SohbetVerisiSchema }),
    z.strictObject({ tur: z.literal("aramaSonucu"), id: SlugSchema, dizi: SlugSchema.optional(), veri: AramaSonucuVerisiSchema }),
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
export type SohbetVerisi = z.infer<typeof SohbetVerisiSchema>;
export type AramaSonucuVerisi = z.infer<typeof AramaSonucuVerisiSchema>;
export type AramaSonucu = AramaSonucuVerisi["sonuclar"][number];
