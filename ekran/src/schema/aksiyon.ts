import { z } from "zod";
import {
  BaglantiProfiliSchema,
  GorselYuklemeSchema,
  ModulSchema,
  PilSchema,
  SlugSchema,
} from "./ortak";

/**
 * Aksiyonlar: bir olay tetiklendiğinde ne olacağı. CLAUDE.md §5
 * Yeni bir aksiyon eklemek GENEL bir yetenek eklemektir (CLAUDE.md §2.2);
 * sahneye özel aksiyon yazılmaz.
 */

/** Kameraya çıkan her metin Türkçe olabilir; sadece boş olmasın. */
const GorunenMetin = (ne: string) =>
  z.string({ error: `${ne} bir metin olmalı.` }).min(1, { error: `${ne} boş olamaz.` });

export const AksiyonSchema = z.discriminatedUnion(
  "tur",
  [
    /** Sistem katmanı: üstte bildirim bannerı. */
    z.strictObject({
      tur: z.literal("bildirim"),
      uygulama: SlugSchema,
      baslik: GorunenMetin("Bildirim başlığı"),
      metin: GorunenMetin("Bildirim metni"),
      ikon: SlugSchema.optional(),
      ses: z.boolean().optional(),
    }),

    /** Sosyal: bir hesaptan yorum gelir. */
    z.strictObject({
      tur: z.literal("yorumGeldi"),
      hesap: SlugSchema,
      metin: GorunenMetin("Yorum metni"),
      postRef: SlugSchema.optional(),
    }),

    /** Sosyal: bir hesap beğenir. */
    z.strictObject({
      tur: z.literal("begeniGeldi"),
      hesap: SlugSchema,
      postRef: SlugSchema.optional(),
    }),

    /** Sosyal: bir hesap takip eder. */
    z.strictObject({
      tur: z.literal("takipGeldi"),
      hesap: SlugSchema,
    }),

    /** Mesaj: bir sohbete mesaj düşer. */
    z.strictObject({
      tur: z.literal("mesajGeldi"),
      sohbet: SlugSchema,
      metin: GorunenMetin("Mesaj metni").optional(),
      gorselRef: SlugSchema.optional(),
    }),

    /** Mesaj: "yazıyor…" göstergesi. */
    z.strictObject({
      tur: z.literal("yaziyor"),
      sohbet: SlugSchema,
      sure: z.number().int().min(0).max(60000).optional(),
    }),

    /** Mesaj: gönderilen mesajın durumu değişir (iletildi / görüldü). */
    z.strictObject({
      tur: z.literal("mesajDurumu"),
      sohbet: SlugSchema,
      durum: z.enum(["gonderildi", "iletildi", "goruldu"]),
    }),

    /** Sistem katmanı: gelen arama ekranı. */
    z.strictObject({
      tur: z.literal("aramaGeldi"),
      arayan: GorunenMetin("Arayanın adı"),
      numara: z.string().optional(),
      gorselRef: SlugSchema.optional(),
    }),

    /** Cihaz durumu: pil değişir. */
    z.strictObject({
      tur: z.literal("pilDegisti"),
      seviye: PilSchema,
      sarjda: z.boolean().optional(),
    }),

    /** Cihaz durumu: bağlantı ve/veya görsel yükleme profili değişir. */
    z.strictObject({
      tur: z.literal("baglantiDegisti"),
      baglanti: BaglantiProfiliSchema.optional(),
      gorsel: GorselYuklemeSchema.optional(),
    }),

    /** Derin link: başka bir modül/ekran açılır. CLAUDE.md §3.3 */
    z.strictObject({
      tur: z.literal("ekranAc"),
      modul: ModulSchema,
      ekran: SlugSchema,
      icerikRef: SlugSchema.optional(),
      hesap: SlugSchema.optional(),
    }),

    /** Ghost typing başlar. CLAUDE.md §7 */
    z.strictObject({
      tur: z.literal("ghostTypingBaslat"),
      hedef: SlugSchema,
      metin: GorunenMetin("Yazılacak metin"),
      mod: z.enum(["senaryolu", "serbest", "otomatik"]).default("senaryolu"),
      hiz: z.number().int().min(10).max(2000).optional(),
    }),

    /** Sosyal: post yükleme akışı tamamlanır, post feed'e düşer. */
    z.strictObject({
      tur: z.literal("postYukle"),
      icerikRef: SlugSchema,
    }),
  ],
  {
    error:
      'Böyle bir aksiyon yok. Seçenekler: bildirim, yorumGeldi, begeniGeldi, takipGeldi, mesajGeldi, yaziyor, mesajDurumu, aramaGeldi, pilDegisti, baglantiDegisti, ekranAc, ghostTypingBaslat, postYukle.',
  },
);

export type Aksiyon = z.infer<typeof AksiyonSchema>;
export type AksiyonTuru = Aksiyon["tur"];
