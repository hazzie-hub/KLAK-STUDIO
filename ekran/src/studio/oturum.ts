/**
 * Stüdyo girişi. CLAUDE.md §8
 *
 * Senaryo içeriği gizlidir: adresi bilen herkes sahne düzenleyemesin diye
 * Stüdyo ve operatör sayfaları tek bir parolanın arkasında durur. Oynatıcı
 * (`/p/...`) ve kumanda (`/k/...`) ASLA korunmaz — sette oyuncunun ve
 * operatörün eline verilen linkler onlar, parola sorulursa çekim durur.
 *
 * Parola `STUDIO_PAROLA` ortam değişkeninden gelir. Ayarlanmamışsa aşağıdaki
 * varsayılan geçerlidir ve Stüdyo bunu görünür biçimde uyarır: varsayılan
 * kodun içinde yazılı olduğu için depoyu görebilen herkes bilir.
 *
 * Çerezde parola DEĞİL, parolanın imzası durur. Çerez ele geçse bile
 * parolanın kendisi okunamaz; parola değişince eski çerezler kendiliğinden
 * geçersizleşir.
 */

export const OTURUM_CEREZI = "klak_oturum";

/** Ortam değişkeni yoksa geçerli olan parola. Kullanıcının seçtiği parola. */
export const VARSAYILAN_PAROLA = "1234";

/** Çerez ömrü: 90 gün. Sette her açılışta yeniden giriş istenmesin. */
export const OTURUM_SURESI = 60 * 60 * 24 * 90;

/** İmzanın neyin üstüne atıldığı. Değişirse tüm oturumlar düşer. */
const IMZA_METNI = "klak-studio-oturum-v1";

export function parolaAl(): string {
  const p = process.env.STUDIO_PAROLA;
  return p !== undefined && p.length > 0 ? p : VARSAYILAN_PAROLA;
}

/** Parola ortamdan mı geliyor, yoksa koddaki varsayılan mı? */
export function parolaVarsayilanMi(): boolean {
  return parolaAl() === VARSAYILAN_PAROLA;
}

/**
 * Çerezde duracak değer: parolanın HMAC imzası.
 *
 * Web Crypto kullanılıyor; middleware (Edge) ile sunucu tarafı aynı sonucu
 * üretsin diye. Node'a özel bir şey yok.
 */
export async function oturumJetonu(parola: string = parolaAl()): Promise<string> {
  const kodlayici = new TextEncoder();
  const anahtar = await crypto.subtle.importKey(
    "raw",
    kodlayici.encode(parola),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const imza = await crypto.subtle.sign("HMAC", anahtar, kodlayici.encode(IMZA_METNI));
  return [...new Uint8Array(imza)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Sabit süreli karşılaştırma.
 *
 * Doğrudan `===` ilk farklı karakterde durur ve cevap süresinden jeton
 * tahmin edilebilir. Burada uzunluk aynıysa her zaman baştan sona bakılır.
 */
export function jetonEsit(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let fark = 0;
  for (let i = 0; i < a.length; i++) fark |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return fark === 0;
}

/** Bu adres giriş olmadan açılabilir mi? */
export function serbestAdresMi(yol: string): boolean {
  return (
    yol === "/giris" ||
    yol.startsWith("/p/") ||
    yol.startsWith("/k/") ||
    yol.startsWith("/_next/") ||
    yol.startsWith("/icon") ||
    yol.startsWith("/avatar/") ||
    yol.startsWith("/ornek/") ||
    yol.startsWith("/duvar/") ||
    yol === "/sw.js" ||
    yol === "/manifest.webmanifest" ||
    yol === "/favicon.ico"
  );
}
