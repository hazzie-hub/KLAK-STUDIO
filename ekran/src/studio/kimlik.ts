/**
 * Kimlik (slug) üretimi ve temizliği. CLAUDE.md §2.8
 *
 * Kimlikler yalnızca küçük harf, rakam ve tire içerebilir. Sette telefondan
 * sahne düzenleyen kimse bunu elle yazmakla uğraşmamalı: kimlik olayın
 * adından TÜRETİLİR, kullanıcı isterse değiştirir.
 */

const TURKCE: Record<string, string> = {
  ı: "i", İ: "i", I: "i",
  ş: "s", Ş: "s",
  ğ: "g", Ğ: "g",
  ü: "u", Ü: "u",
  ö: "o", Ö: "o",
  ç: "c", Ç: "c",
  â: "a", Â: "a",
  î: "i", Î: "i",
  û: "u", Û: "u",
};

function harfleriCevir(metin: string): string {
  return [...metin].map((h) => TURKCE[h] ?? h).join("");
}

/**
 * YAZARKEN kullanılır: kullanıcı yazdıkça düzeltir ama sondaki tireyi KORUR.
 *
 * Sondaki tire silinseydi "sezai " yazan biri "sezai" görür ve sonraki kelime
 * "sezaiyorum" diye yapışırdı. Kelime ayırabilmek için bir tane tireye izin
 * verilir; kaydederken `kimlikBitir` temizler.
 */
export function kimlikYaz(metin: string): string {
  const temel = harfleriCevir(metin)
    .toLowerCase()
    .replace(/[\s_.]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "");
  return temel;
}

/** Kaydederken/alandan çıkarken: sondaki tire de silinir. */
export function kimlikBitir(metin: string): string {
  return kimlikYaz(metin).replace(/-+$/, "");
}

/** Bir olay adından kimlik türetir: "Sezai yorum yapar" → "sezai-yorum-yapar" */
export function addanKimlik(ad: string): string {
  return kimlikBitir(ad);
}

/**
 * Kullanılmayan bir kimlik üretir. Çakışma varsa sona -2, -3… eklenir.
 * `kullanilan` listesinde kendi kimliği varsa sorun değil; çağıran onu
 * listeden çıkarmalı.
 */
export function benzersizKimlik(taban: string, kullanilan: readonly string[]): string {
  const temiz = kimlikBitir(taban);
  if (temiz === "") return "";
  const kume = new Set(kullanilan);
  if (!kume.has(temiz)) return temiz;
  for (let n = 2; n < 1000; n++) {
    const aday = `${temiz}-${n}`;
    if (!kume.has(aday)) return aday;
  }
  return `${temiz}-${Date.now()}`;
}
