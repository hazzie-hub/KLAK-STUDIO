import { z } from "zod";
import { SlugSchema } from "./ortak";

/**
 * İçerik kütüphanesi. CLAUDE.md §5
 * Sahneler arasında yeniden kullanılabilir parçalar: post, sohbet, arama sonucu, web sayfası, konum, foto.
 *
 * Faz 4 sonunda türlerin HEPSİNİN ayrıntılı şeması var; serbest kayıt kalmadı.
 * Yeni bir tür eklemek, şemasını da yazmayı gerektirir.
 */

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

/**
 * Sahte web sayfası — `web` modülü (Faz 3).
 *
 * Sayfanın gövdesi BLOK listesidir; şablon yalnızca görünümü değiştirir.
 * Böylece aynı içerik haber sitesinde de forumda da gösterilebilir ve yeni
 * şablon eklemek içerik biçimini bozmaz (CLAUDE.md §2.2).
 */
export const WebBlokSchema = z.discriminatedUnion(
  "tur",
  [
    z.strictObject({ tur: z.literal("baslik"), metin: z.string().min(1, { error: "Ara başlık boş olamaz." }) }),
    z.strictObject({ tur: z.literal("paragraf"), metin: z.string().min(1, { error: "Paragraf boş olamaz." }) }),
    z.strictObject({
      tur: z.literal("gorsel"),
      dosya: z.string().min(1, { error: "Görselin dosyası belirtilmeli." }),
      altYazi: z.string().optional(),
    }),
    z.strictObject({
      tur: z.literal("alinti"),
      metin: z.string().min(1, { error: "Alıntı boş olamaz." }),
      kaynak: z.string().optional(),
    }),
    z.strictObject({
      tur: z.literal("liste"),
      maddeler: z.array(z.string().min(1, { error: "Liste maddesi boş olamaz." })).min(1, {
        error: "Liste en az bir madde içermeli.",
      }),
    }),
    z.strictObject({
      tur: z.literal("yorum"),
      yazar: z.string().min(1, { error: "Yorumun yazarı belirtilmeli." }),
      metin: z.string().min(1, { error: "Yorum boş olamaz." }),
      tarih: z.string().optional(),
    }),
    /**
     * Sosyal medya profil başlığı — Akış'ın web hâli (`sosyal` şablonu).
     *
     * Hesap, içerik kütüphanesinden gelir: kullanıcı adı, görünen ad ve avatar
     * tek kaynakta durur (`content/hesaplar`), sayfaya elle yazılmaz. Sayılar
     * yalnızca görünüş içindir; sahne sırasında değişmezler.
     */
    z.strictObject({
      tur: z.literal("profil"),
      hesap: SlugSchema,
      biyografi: z.string().optional(),
      gonderi: z.number().int().min(0).optional(),
      takipci: z.number().int().min(0).optional(),
      takip: z.number().int().min(0).optional(),
    }),
    /** Fotoğraf ızgarası — /ornek altındaki dosyalar. */
    z.strictObject({
      tur: z.literal("izgara"),
      dosyalar: z
        .array(z.string().min(1, { error: "Izgaradaki fotoğrafın dosyası belirtilmeli." }))
        .min(1, { error: "Izgara en az bir fotoğraf içermeli." }),
    }),
  ],
  {
    error:
      'Blok türü şunlardan biri olmalı: baslik, paragraf, gorsel, alinti, liste, yorum, profil, izgara.',
  },
);

export const WebSayfasiVerisiSchema = z.strictObject({
  /** Sayfanın görünümü. CLAUDE.md §3.2 */
  sablon: z.enum(["haber", "blog", "kurumsal", "forum", "sosyal"], {
    error: 'Şablon "haber", "blog", "kurumsal", "forum" veya "sosyal" olabilir.',
  }),
  siteAdi: z.string().min(1, { error: "Sitenin adı boş olamaz." }),
  /** Adres çubuğunda görünen kurgusal adres. Gerçek bir alan adı YAZILMAZ. */
  adres: z
    .string()
    .min(1, { error: "Adres boş olamaz." })
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}(\/[^\s]*)?$/, {
      error: 'Adres "ornekadres.com/sayfa" biçiminde olmalı: küçük harf, boşluksuz, başında http yok.',
    }),
  baslik: z.string().min(1, { error: "Sayfa başlığı boş olamaz." }),
  /** Haber şablonunda üstteki etiket: "GÜNDEM", "YAŞAM"… */
  ustBaslik: z.string().optional(),
  yazar: z.string().optional(),
  tarih: z.string().optional(),
  /** Sitenin üst menüsü. */
  menu: z.array(z.string().min(1, { error: "Menü başlığı boş olamaz." })).default([]),
  /** Sitenin vurgu rengi. Verilmezse şablonun kendi rengi kullanılır. */
  renk: z
    .string()
    .regex(/^#[0-9a-f]{6}$/, { error: 'Renk "#0f6f74" biçiminde olmalı (küçük harf).' })
    .optional(),
  govde: z.array(WebBlokSchema).default([]),
});

/**
 * Harita konumu — `harita` modülü (Faz 4).
 *
 * CLAUDE.md §3.2 harita notu: gerçek karo haritası KULLANILMAZ (lisans ve
 * atıf riski). Zemin bizim çizdiğimiz stilize haritadır; burada tutulan şey
 * pinin ve rotanın o zemin üzerindeki YÜZDELİK konumudur (0–1).
 */
const NoktaSchema = z.strictObject({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const KonumVerisiSchema = z.strictObject({
  ad: z.string().min(1, { error: "Konumun adı boş olamaz." }),
  adres: z.string().optional(),
  /** Haritanın görünümü. */
  desen: z.enum(["sehir", "sahil", "kirsal"], {
    error: 'Harita deseni "sehir", "sahil" veya "kirsal" olabilir.',
  }).default("sehir"),
  pin: NoktaSchema,
  /** Rota noktaları. En az iki nokta verilirse animasyonlu çizilir. */
  rota: z.array(NoktaSchema).default([]),
  /** "12 dk" gibi serbest metin. */
  sure: z.string().optional(),
  /** "3,4 km" gibi serbest metin. */
  mesafe: z.string().optional(),
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
    z.strictObject({ tur: z.literal("webSayfasi"), id: SlugSchema, dizi: SlugSchema.optional(), veri: WebSayfasiVerisiSchema }),
    z.strictObject({ tur: z.literal("konum"), id: SlugSchema, dizi: SlugSchema.optional(), veri: KonumVerisiSchema }),
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
export type WebSayfasiVerisi = z.infer<typeof WebSayfasiVerisiSchema>;
export type WebBlok = z.infer<typeof WebBlokSchema>;
export type KonumVerisi = z.infer<typeof KonumVerisiSchema>;
