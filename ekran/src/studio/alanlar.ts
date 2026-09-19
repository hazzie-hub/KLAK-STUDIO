import type { AksiyonTuru, TetikTuru } from "@/schema";

/**
 * Form alanlarının tanımı. CLAUDE.md §8 (Faz 4.3)
 *
 * NEDEN BÖYLE: 13 aksiyon türü için 13 ayrı form yazmak yerine, her türün
 * hangi alanları istediğini burada VERİ olarak tutuyoruz; form bunu okuyup
 * kendini kuruyor. Yeni bir aksiyon eklendiğinde tek yapılacak buraya bir
 * satır yazmak.
 *
 * Bu tablo şemanın yerini TUTMAZ, onu tamamlar: kaydetmeden önce her şey
 * yine Zod'dan (SahneSchema) geçer. Tablonun şemadan ayrışmaması için bir
 * test her aksiyon türünün burada karşılığı olduğunu denetler.
 */

export type AlanTuru = "metin" | "uzunMetin" | "slug" | "sayi" | "secim" | "onay";

export type Alan = {
  ad: string;
  etiket: string;
  tur: AlanTuru;
  zorunlu?: boolean;
  /** `secim` için. */
  secenekler?: readonly string[];
  /** Kullanıcıya yardım: alanın altında küçük yazı. */
  ipucu?: string;
  /**
   * Şemada varsayılanı olan alanlar. Böyle bir alan ZORUNLU DEĞİLDİR
   * (kullanıcı boş bırakabilir, Zod varsayılanı koyar) ama form onu baştan
   * dolu gösterir.
   */
  varsayilan?: string | number | boolean;
  /** Sayı alanları için. */
  en_az?: number;
  en_cok?: number;
  /**
   * Seçenekleri içerik kütüphanesinden gelen alanlar. Form bunları
   * veritabanındaki kayıtlarla doldurur.
   */
  kaynak?: "hesap" | "icerik" | "sohbet" | "post" | "modul" | "cihaz";
};

const SLUG_IPUCU = "küçük harf, rakam ve tire (örn. nergis-post-cicekci)";

/** Tetiklerin alanları. */
export const TETIK_ALANLARI: Record<TetikTuru, readonly Alan[]> = {
  baslangic: [
    {
      ad: "gecikme",
      etiket: "Gecikme (ms)",
      tur: "sayi",
      varsayilan: 0,
      en_az: 0,
      en_cok: 600000,
      ipucu: "Sahne açıldıktan kaç ms sonra? 2500 = 2,5 saniye",
    },
  ],
  sonra: [
    { ad: "olayId", etiket: "Hangi olaydan sonra", tur: "slug", zorunlu: true },
    {
      ad: "gecikme",
      etiket: "Gecikme (ms)",
      tur: "sayi",
      zorunlu: true,
      en_az: 0,
      en_cok: 600000,
    },
  ],
  dokunma: [
    {
      ad: "hedef",
      etiket: "Dokunulan yer",
      tur: "slug",
      zorunlu: true,
      ipucu: "Modülün tanıdığı ad, örn. yorum-alani, arama-sonuc-1, telefon-tus",
    },
  ],
  elle: [],
};

/** Aksiyonların alanları. */
export const AKSIYON_ALANLARI: Record<AksiyonTuru, readonly Alan[]> = {
  bildirim: [
    { ad: "uygulama", etiket: "Uygulama", tur: "slug", zorunlu: true },
    { ad: "baslik", etiket: "Başlık", tur: "metin", zorunlu: true },
    { ad: "metin", etiket: "Metin", tur: "uzunMetin", zorunlu: true },
    { ad: "ikon", etiket: "İkon", tur: "slug", ipucu: SLUG_IPUCU },
    { ad: "ses", etiket: "Sesli", tur: "onay" },
  ],
  yorumGeldi: [
    { ad: "hesap", etiket: "Hesap", tur: "secim", zorunlu: true, kaynak: "hesap" },
    { ad: "metin", etiket: "Yorum", tur: "uzunMetin", zorunlu: true },
    { ad: "postRef", etiket: "Hangi post", tur: "secim", kaynak: "post" },
  ],
  begeniGeldi: [
    { ad: "hesap", etiket: "Hesap", tur: "secim", zorunlu: true, kaynak: "hesap" },
    { ad: "postRef", etiket: "Hangi post", tur: "secim", kaynak: "post" },
  ],
  takipGeldi: [{ ad: "hesap", etiket: "Hesap", tur: "secim", zorunlu: true, kaynak: "hesap" }],
  mesajGeldi: [
    { ad: "sohbet", etiket: "Sohbet", tur: "secim", zorunlu: true, kaynak: "sohbet" },
    { ad: "metin", etiket: "Mesaj", tur: "uzunMetin" },
    { ad: "gorselRef", etiket: "Fotoğraf", tur: "secim", kaynak: "icerik" },
  ],
  yaziyor: [
    { ad: "sohbet", etiket: "Sohbet", tur: "secim", zorunlu: true, kaynak: "sohbet" },
    { ad: "sure", etiket: "Süre (ms)", tur: "sayi", en_az: 0, en_cok: 60000 },
  ],
  mesajDurumu: [
    { ad: "sohbet", etiket: "Sohbet", tur: "secim", zorunlu: true, kaynak: "sohbet" },
    {
      ad: "durum",
      etiket: "Durum",
      tur: "secim",
      zorunlu: true,
      secenekler: ["gonderildi", "iletildi", "goruldu"],
    },
  ],
  aramaGeldi: [
    { ad: "arayan", etiket: "Arayanın adı", tur: "metin", zorunlu: true },
    { ad: "numara", etiket: "Numara", tur: "metin", ipucu: 'Boş bırakılırsa "iPhone" / "Cep" yazar' },
    { ad: "gorselRef", etiket: "Arayanın fotoğrafı", tur: "secim", kaynak: "icerik" },
  ],
  pilDegisti: [
    { ad: "seviye", etiket: "Pil yüzdesi", tur: "sayi", zorunlu: true, en_az: 0, en_cok: 100 },
    { ad: "sarjda", etiket: "Şarjda", tur: "onay" },
  ],
  baglantiDegisti: [
    {
      ad: "baglanti",
      etiket: "Bağlantı",
      tur: "secim",
      secenekler: ["normal", "yavas", "yok"],
    },
    {
      ad: "gorsel",
      etiket: "Görsel yükleme",
      tur: "secim",
      secenekler: ["normal", "gec", "yuklenmez"],
    },
  ],
  ekranAc: [
    { ad: "modul", etiket: "Modül", tur: "secim", zorunlu: true, kaynak: "modul" },
    { ad: "ekran", etiket: "Ekran", tur: "slug", zorunlu: true },
    { ad: "icerikRef", etiket: "İçerik", tur: "secim", kaynak: "icerik" },
    { ad: "hesap", etiket: "Hesap", tur: "secim", kaynak: "hesap" },
  ],
  ghostTypingBaslat: [
    {
      ad: "hedef",
      etiket: "Nereye yazılacak",
      tur: "slug",
      zorunlu: true,
      ipucu: "örn. yorum-yaz, arama-cubugu, telefon-numara",
    },
    { ad: "metin", etiket: "Yazılacak metin", tur: "uzunMetin", zorunlu: true },
    {
      ad: "mod",
      etiket: "Mod",
      tur: "secim",
      varsayilan: "senaryolu",
      secenekler: ["senaryolu", "serbest", "otomatik"],
      ipucu: "senaryolu: oyuncu hangi tuşa basarsa bassın metin yazılır",
    },
    { ad: "hiz", etiket: "Harf hızı (ms)", tur: "sayi", en_az: 10, en_cok: 2000 },
  ],
  postYukle: [{ ad: "icerikRef", etiket: "Post", tur: "secim", zorunlu: true, kaynak: "post" }],
};

/** Aksiyon türlerinin insan okunur adları — açılır listede bunlar görünür. */
export const AKSIYON_ADLARI: Record<AksiyonTuru, string> = {
  bildirim: "Bildirim düşsün",
  yorumGeldi: "Yorum gelsin",
  begeniGeldi: "Beğeni gelsin",
  takipGeldi: "Takip gelsin",
  mesajGeldi: "Mesaj gelsin",
  yaziyor: "Karşı taraf yazıyor",
  mesajDurumu: "Mesaj durumu değişsin",
  aramaGeldi: "Telefon çalsın",
  pilDegisti: "Pil değişsin",
  baglantiDegisti: "Bağlantı değişsin",
  ekranAc: "Başka ekran açılsın",
  ghostTypingBaslat: "Yazmaya başlasın",
  postYukle: "Post yüklensin",
};

export const TETIK_ADLARI: Record<TetikTuru, string> = {
  baslangic: "Sahne açılınca",
  sonra: "Başka bir olaydan sonra",
  dokunma: "Oyuncu bir yere dokununca",
  elle: "Sadece kumandadan",
};
