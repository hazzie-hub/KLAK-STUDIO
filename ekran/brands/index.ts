/**
 * Kurgusal markalar. CLAUDE.md §2.1
 *
 * Gerçek marka isimleri, logoları ve renkleri KULLANILMAZ. Buradaki isimler
 * tanıdık hissettirir ama hiçbirinin kopyası değildir. Tüm modüller marka
 * adını ve rengini buradan okur; hiçbir yere elle yazılmaz.
 *
 * Renkler bilinçli olarak gerçek uygulamaların kurumsal renklerinden uzak seçildi.
 */

export type Marka = {
  /** Ekranda görünen ad. */
  ad: string;
  /** Ana renk — butonlar, vurgular, bağlantılar. */
  renk: string;
  /** Koyu zeminde okunaklı kalan hali. */
  renkAcik: string;
  /** Bildirim ikonu ve uygulama karesi için. */
  ikonRengi: string;
};

export const markalar = {
  /**
   * Sosyal medya uygulaması — fotoğraf akışı, keşfet, profil.
   * Gerçek bir uygulamanın kopyası değil; adı ve rengi bize ait.
   */
  akis: {
    ad: "Akış",
    renk: "#0f6f74",
    renkAcik: "#3fa6ab",
    ikonRengi: "#0f6f74",
  },
  /**
   * Arama motoru. Tanıdık bir arama sayfası hissi verir ama hiçbir motorun
   * kopyası değildir: ad, renk ve yerleşim bize ait.
   */
  look: {
    ad: "LOOK",
    renk: "#5f4bb6",
    renkAcik: "#9a89e0",
    ikonRengi: "#5f4bb6",
  },
  /** Mesajlaşma. Türk telefonlarında yerleşik uygulama da "Mesajlar" diye geçer. */
  mesaj: {
    ad: "Mesaj",
    renk: "#3b6ea5",
    renkAcik: "#6f9fd0",
    ikonRengi: "#3b6ea5",
  },
} as const satisfies Record<string, Marka>;

export type MarkaAnahtari = keyof typeof markalar;

/** Modülün hangi markayı kullandığı. */
export const modulMarkasi = {
  sosyal: "akis",
  mesaj: "mesaj",
  arama: "look",
} as const;

export function markaAl(anahtar: string): Marka | null {
  return (markalar as Record<string, Marka>)[anahtar] ?? null;
}
