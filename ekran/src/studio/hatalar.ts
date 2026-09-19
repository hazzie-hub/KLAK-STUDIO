import type { AksiyonTuru, TetikTuru } from "@/schema";
import { AKSIYON_ALANLARI, TETIK_ALANLARI } from "./alanlar";

/**
 * Doğrulama hatalarını kullanıcının anlayacağı hale getirir. CLAUDE.md §8
 *
 * Zod'un verdiği yol `olaylar.2.aksiyon.metin` gibidir; kullanıcı bunu
 * okuyamaz. Burada "3. olay (Sezai ısrar eder) · Mesaj" olur ve hataya
 * tıklayınca ilgili alana kayılabilsin diye yol da taşınır.
 */
export type HamHata = { yol: string; mesaj: string };
export type FormHatasi = { yol: string; mesaj: string; baslik: string };

type Taslak = Record<string, unknown>;

const SAHNE_ALANLARI: Record<string, string> = {
  kod: "Sahne kodu",
  cihaz: "Cihaz",
  talimat: "Sete gidecek talimat",
  "baslangic.modul": "Açılış uygulaması",
  "baslangic.ekran": "Açılış ekranı",
  "baslangic.hesap": "Açılış hesabı",
  "baslangic.icerikRef": "Açılış içeriği",
  "durum.saat": "Saat",
  "durum.tarih": "Tarih",
  "durum.pil": "Pil",
  id: "Kimlik",
  ad: "Olay adı",
  tetik: "Ne zaman",
  aksiyon: "Ne olsun",
};

/** Bir olayın içindeki alanın okunur adı. */
function olayAlanAdi(olay: Taslak, parcalar: string[]): string {
  const [bolum, alanAdi] = parcalar;
  if (bolum === undefined) return "";
  if (alanAdi === undefined) return SAHNE_ALANLARI[bolum] ?? bolum;

  if (bolum === "tetik") {
    const tur = String((olay.tetik as Taslak | undefined)?.tur ?? "elle") as TetikTuru;
    const alan = TETIK_ALANLARI[tur]?.find((a) => a.ad === alanAdi);
    return `Ne zaman · ${alan?.etiket ?? alanAdi}`;
  }
  if (bolum === "aksiyon") {
    const tur = String((olay.aksiyon as Taslak | undefined)?.tur ?? "bildirim") as AksiyonTuru;
    const alan = AKSIYON_ALANLARI[tur]?.find((a) => a.ad === alanAdi);
    return `Ne olsun · ${alan?.etiket ?? alanAdi}`;
  }
  return alanAdi;
}

function hataBasligi(yol: string, sahne: Taslak): string {
  if (yol === "") return "Sahne";

  const parcalar = yol.split(".");
  if (parcalar[0] !== "olaylar") {
    return SAHNE_ALANLARI[yol] ?? SAHNE_ALANLARI[parcalar[0]!] ?? yol;
  }

  const sira = Number(parcalar[1]);
  const olaylar = (sahne.olaylar as Taslak[] | undefined) ?? [];
  const olay = olaylar[sira] ?? {};
  const ad = String(olay.ad ?? "").trim();
  const olayAdi = ad === "" ? `${sira + 1}. olay` : `${sira + 1}. olay (${ad})`;

  const kalan = parcalar.slice(2);
  if (kalan.length === 0) return olayAdi;
  return `${olayAdi} · ${olayAlanAdi(olay, kalan)}`;
}

/** Yoldaki değer boş mu? ("olaylar.0.aksiyon.metin" gibi) */
function degerBos(sahne: Taslak, yol: string): boolean {
  if (yol === "") return false;
  let su: unknown = sahne;
  for (const parca of yol.split(".")) {
    if (su === null || typeof su !== "object") return true;
    su = (su as Record<string, unknown>)[parca];
  }
  if (su === undefined || su === null) return true;
  return typeof su === "string" && su.trim() === "";
}

/**
 * Boş bırakılmış alanlar için tek ve anlaşılır mesaj.
 *
 * Zod boş değerde alanın BİÇİM kuralını anlatıyor ("Sadece küçük harf, rakam
 * ve tire…", "Metin bekleniyordu.") — kullanıcı boş bıraktığını bilir, ondan
 * biçim dersi istemez. Başlık zaten alanı söylediği için kısa cümle yeter.
 */
function mesajDuzelt(mesaj: string, bos: boolean): string {
  if (!bos) return mesaj;
  return "Doldurulmalı.";
}

/**
 * Hataları başlıklandırır ve TEKRARLARI ATAR.
 *
 * Zod aynı alan için birden çok sorun bildirebiliyor (ör. hem birleşim hem
 * alt şema). Kullanıcıya aynı cümleyi iki kez göstermek güven kaybettiriyor.
 */
export function hatalariDuzenle(hatalar: readonly HamHata[], sahne: Taslak): FormHatasi[] {
  const gorulen = new Set<string>();
  const sonuc: FormHatasi[] = [];

  for (const h of hatalar) {
    // Anahtar DÜZELTİLMİŞ mesaja göre: iki farklı Zod sorunu aynı "Doldurulmalı."
    // cümlesine indiğinde kullanıcı aynı satırı iki kez görmemeli.
    const anahtar = `${h.yol}|${mesajDuzelt(h.mesaj, degerBos(sahne, h.yol))}`;
    if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar);
    sonuc.push({
      yol: h.yol,
      mesaj: mesajDuzelt(h.mesaj, degerBos(sahne, h.yol)),
      baslik: hataBasligi(h.yol, sahne),
    });
  }

  return sonuc;
}

/** Formdaki alanın DOM kimliği — hataya tıklayınca oraya kaymak için. */
export function alanKimligi(yol: string): string {
  return `alan-${yol.replace(/\./g, "-")}`;
}
