import type { Cihaz, Dizi, Karakter, Sahne, Skin } from "@/schema";

/**
 * Teslim paketi. CLAUDE.md §8
 *
 * Onaylanan sahne için sete gönderilecek hazır metin: link, ne olacağı ve
 * cihaz hazırlığı. Operatör bunu mesaj uygulamasına yapıştırıp gönderir.
 *
 * NOT: Buradaki metinlerde gerçek uygulama adı GEÇMEZ. Stüdyo kameraya
 * girmez ama marka denetimi (tests/sosyal.test.ts) tüm `src` ağacını tarar ve
 * bilinçli olarak katıdır — istisna açmak yerine adı anmıyoruz.
 *
 * Saf fonksiyonlar — sayfa değil, metin üretirler; testi buradan yapılır.
 */

export type SahneKodParcalari = {
  dizi: string;
  bolum: number;
  sahne: number;
  /** Aynı sahnenin ikinci cihazı: `eg-b03-s41-nergis` → "nergis". */
  ek?: string;
};

/** `eg-b03-s58` → { dizi: "eg", bolum: 3, sahne: 58 } */
export function kodCoz(kod: string): SahneKodParcalari | null {
  const eslesme = /^([a-z0-9]+)-b(\d{1,3})-s(\d{1,3})(?:-(.+))?$/.exec(kod);
  if (eslesme === null) return null;
  return {
    dizi: eslesme[1]!,
    bolum: Number(eslesme[2]),
    sahne: Number(eslesme[3]),
    ek: eslesme[4],
  };
}

/** Sondaki eğik çizgi teslim metnine çift çizgi olarak sızmasın. */
function tabanTemizle(taban: string): string {
  return taban.replace(/\/+$/, "");
}

export function oynaticiLinki(taban: string, kod: string): string {
  return `${tabanTemizle(taban)}/p/${kod}`;
}

export function kumandaLinki(taban: string, kod: string): string {
  return `${tabanTemizle(taban)}/k/${kod}`;
}

export const KABUK_ADI: Record<Skin, string> = {
  ios: "iPhone",
  android: "Android telefon",
  desktop: "Bilgisayar",
};

/**
 * Set cihazı hazırlığı. CLAUDE.md §6
 * Kabuğa göre değişir: iOS'ta Rehberli Erişim, Android'de Ekran Sabitleme.
 */
export function cihazHazirligi(skin: Skin, kumandaVar: boolean): string[] {
  if (skin === "desktop") {
    return [
      "Tarayıcıyı tam ekran yapın (F11) — adres çubuğu görünmesin",
      "Ekran koruyucu ve uyku kapalı",
      "Bildirimler kapalı (Rahatsız Etmeyin)",
      ...(kumandaVar ? ["Wi-Fi açık kalsın — kumanda bağlanacak"] : []),
    ];
  }

  return [
    // EN ÖNEMLİ MADDE, EN BAŞTA: tarayıcı çubuğu kameraya girmemeli
    // (CLAUDE.md §2.6). Linki doğrudan açmak yetmez; adres çubuğu ancak
    // sahne ANA EKRANDAKİ İKONDAN açılınca kaybolur.
    skin === "ios"
      ? 'Linki Safari\'de açın → Paylaş (kutu ve yukarı ok) → "Ana Ekrana Ekle" → sonra sahneyi ANA EKRANDAKİ İKONDAN açın. Tarayıcı çubuğu ancak böyle kaybolur.'
      : 'Linki Chrome\'da açın → sağ üstteki ⋮ → "Ana ekrana ekle" → sonra sahneyi ANA EKRANDAKİ İKONDAN açın. Tarayıcı çubuğu ancak böyle kaybolur.',
    "Rahatsız Etmeyin / Odak modu AÇIK",
    "Otomatik kilit KAPALI",
    "Parlaklık sabit (otomatik parlaklık kapalı)",
    skin === "ios"
      ? "Sahne açıkken yan tuşa ÜÇ KEZ basıp Rehberli Erişim'i BAŞLATIN. Telefonun kendi saati ve pil göstergesi ancak böyle kaybolur; sadece ayarlardan açmak yetmez. (Ayarlar → Erişilebilirlik → Rehberli Erişim'den bir kez etkinleştirilmiş olmalı.)"
      : "Ekran Sabitleme açık (Ayarlar → Güvenlik)",
    kumandaVar
      ? "Wi-Fi ya da operatörün hotspot'u açık — kumanda bağlanacak"
      : "Uçak modu açılabilir; sahne internetsiz çalışır",
  ];
}

export type TeslimBilgisi = {
  sahne: Sahne;
  cihaz: Cihaz | null;
  dizi: Dizi | null;
  karakter: Karakter | null;
  taban: string;
  /** Operatör kumanda kullanacak mı? Metin buna göre değişir. */
  kumandaVar: boolean;
};

/** Sahnenin insan okunur başlığı: "Evlilik Güzeldir · Bölüm 3, Sahne 58". */
export function sahneBasligi(sahne: Sahne, dizi: Dizi | null): string {
  const parca = kodCoz(sahne.kod);
  if (parca === null) return sahne.kod;
  const diziAdi = dizi?.ad ?? parca.dizi;
  const ek = parca.ek === undefined ? "" : ` (${parca.ek})`;
  return `${diziAdi} · Bölüm ${parca.bolum}, Sahne ${parca.sahne}${ek}`;
}

/**
 * Sete gönderilecek hazır metin.
 *
 * Sade tutuldu: sette telefonla okunacak. Teknik terim yok, her madde
 * doğrudan yapılacak bir iş.
 */
export function teslimMetni(bilgi: TeslimBilgisi): string {
  const { sahne, cihaz, dizi, karakter, taban, kumandaVar } = bilgi;
  const skin = cihaz?.skin ?? "ios";

  const cihazSatiri = [
    karakter?.ad ?? cihaz?.karakter ?? sahne.cihaz,
    cihaz === null ? null : KABUK_ADI[cihaz.skin],
  ]
    .filter((p) => p !== null && p !== undefined)
    .join(" · ");

  const satirlar = [
    sahneBasligi(sahne, dizi),
    `Cihaz: ${cihazSatiri}`,
    "",
    oynaticiLinki(taban, sahne.kod),
    "",
    "NE OLACAK",
    sahne.talimat,
    "",
    "CİHAZ HAZIRLIĞI",
    ...cihazHazirligi(skin, kumandaVar).map((m) => `• ${m}`),
    "",
    "ÇEKİMDEN ÖNCE",
    skin === "desktop"
      ? "• Tarayıcıyı tam ekran yapın (F11); adres çubuğu görünmesin."
      : "• Sahneyi ana ekrandaki ikondan açın — tarayıcı içinden açarsanız adres çubuğu kameraya girer.",
    "• Bir kez yenileyin, birkaç saniye bekleyin.",
    "• Saatin iki noktası bir kez yanıp sönünce her şey indi demektir.",
    "• Ondan sonra internet kesilse de sahne çalışır.",
  ];

  if (kumandaVar) {
    satirlar.push(
      "",
      "OPERATÖR (kumanda)",
      kumandaLinki(taban, sahne.kod),
      "• Olayları buradan tetikleyin; oyuncunun cihazına dokunmayın.",
    );
  }

  return satirlar.join("\n");
}
