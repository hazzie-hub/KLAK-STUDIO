import { z } from "zod";

/**
 * Ortak yapı taşları. Diğer tüm şemalar buradan beslenir.
 * CLAUDE.md §2.8: URL'lerde ve kimliklerde Türkçe karakter kullanılmaz.
 */

/** Kimlik/referans metni: küçük harf, rakam, tire. Örn: `nergis-post-cicekci`. */
export const SlugSchema = z
  .string({ error: "Metin bekleniyordu." })
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    error:
      "Sadece küçük harf, rakam ve tire kullanılabilir (örn. nergis-post-cicekci). Türkçe karakter, boşluk ve büyük harf olmaz.",
  });

/** Sahne kodu: `{diziKodu}-b{bölüm}-s{sahne}`, isteğe bağlı cihaz eki. */
export const SahneKoduSchema = z
  .string({ error: "Sahne kodu bir metin olmalı." })
  .regex(/^[a-z0-9]+-b\d{1,3}-s\d{1,3}(-[a-z0-9]+(-[a-z0-9]+)*)?$/, {
    error:
      'Sahne kodu "{diziKodu}-b{bölüm}-s{sahne}" biçiminde olmalı (örn. eg-b03-s58). Aynı sahnenin ikinci cihazı varsa sona cihaz eki gelir: eg-b03-s41-nergis.',
  });

/** Cihaz kabuğu. CLAUDE.md §3.1 */
export const SkinSchema = z.enum(["ios", "android", "desktop"], {
  error: 'Cihaz kabuğu "ios", "android" veya "desktop" olabilir.',
});

/** Modüller. CLAUDE.md §3.2 */
export const ModulSchema = z.enum(
  ["kilit", "sosyal", "mesaj", "arama", "web", "telefon", "galeri", "harita", "anaekran"],
  {
    error:
      'Böyle bir modül yok. Seçenekler: kilit, sosyal, mesaj, arama, web, telefon, galeri, harita, anaekran.',
  },
);

/** Bağlantı profili. Modüller kendi "yavaş yükleme" mantığını yazmaz (CLAUDE.md §3.1). */
export const BaglantiProfiliSchema = z.enum(["normal", "yavas", "yok"], {
  error: 'Bağlantı profili "normal", "yavas" veya "yok" olabilir.',
});

/** Görsel yükleme davranışı. */
export const GorselYuklemeSchema = z.enum(["normal", "gec", "yuklenmez"], {
  error: 'Görsel yükleme "normal", "gec" veya "yuklenmez" olabilir.',
});

/** Pil yüzdesi. */
export const PilSchema = z
  .number({ error: "Pil seviyesi bir sayı olmalı." })
  .int({ error: "Pil seviyesi tam sayı olmalı (örn. 5, 100)." })
  .min(0, { error: "Pil seviyesi 0'dan küçük olamaz." })
  .max(100, { error: "Pil seviyesi 100'den büyük olamaz." });

/** Gecikme, milisaniye. */
export const GecikmeSchema = z
  .number({ error: "Gecikme milisaniye cinsinden bir sayı olmalı (örn. 5000 = 5 saniye)." })
  .int({ error: "Gecikme tam sayı olmalı." })
  .min(0, { error: "Gecikme negatif olamaz." })
  .max(600000, { error: "Gecikme 600000 ms'yi (10 dakika) aşamaz. Sahne bu kadar beklemez." });

/** Cihaz durumu katmanı. CLAUDE.md §3.1 (2. katman) */
export const DurumSchema = z.strictObject({
  baglanti: BaglantiProfiliSchema.default("normal"),
  gorsel: GorselYuklemeSchema.default("normal"),
  pil: PilSchema.optional(),
  sarjda: z.boolean({ error: "sarjda true ya da false olmalı." }).optional(),
  saat: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'Saat "SS:DD" biçiminde olmalı (örn. 21:04).' })
    .optional(),
  /** Kilit ekranında görünen tarih. Serbest metin: "18 Eylül Perşembe". */
  tarih: z.string().min(1, { error: "Tarih boş olamaz." }).optional(),
});

export type Slug = z.infer<typeof SlugSchema>;
export type SahneKodu = z.infer<typeof SahneKoduSchema>;
export type Skin = z.infer<typeof SkinSchema>;
export type Modul = z.infer<typeof ModulSchema>;
export type BaglantiProfili = z.infer<typeof BaglantiProfiliSchema>;
export type GorselYukleme = z.infer<typeof GorselYuklemeSchema>;
export type Durum = z.infer<typeof DurumSchema>;
