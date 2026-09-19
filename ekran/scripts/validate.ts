/**
 * `npm run validate`
 *
 * /content altındaki her veri dosyasını şemadan geçirir ve dosyalar arası
 * referansları (sahne → cihaz, olay → hesap, post → içerik) denetler.
 *
 * CLAUDE.md §2.2: sahne veridir. Bu betik o verinin sette değil, burada
 * patlamasını sağlar.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { ZodType } from "zod";

import {
  CihazSchema,
  DiziSchema,
  HesapSchema,
  IcerikSchema,
  KarakterSchema,
  SahneSchema,
  sahneUyarilari,
  type Cihaz,
  type Hesap,
  type Icerik,
  type Sahne,
} from "../src/schema";

const KOK = join(import.meta.dirname, "..");
const ICERIK = join(KOK, "content");

const renkli = process.stdout.isTTY && process.env.NO_COLOR === undefined;
const c = {
  kirmizi: (s: string) => (renkli ? `\x1b[31m${s}\x1b[0m` : s),
  yesil: (s: string) => (renkli ? `\x1b[32m${s}\x1b[0m` : s),
  sari: (s: string) => (renkli ? `\x1b[33m${s}\x1b[0m` : s),
  gri: (s: string) => (renkli ? `\x1b[90m${s}\x1b[0m` : s),
  kalin: (s: string) => (renkli ? `\x1b[1m${s}\x1b[0m` : s),
};

type Kayit = { dosya: string; veri: unknown };

/** JSON'ı bozuk dosyalar; şemaya hiç giremezler, ayrı raporlanır. */
const bozukJson: Array<{ dosya: string; mesaj: string }> = [];

function klasoruOku(klasor: string): Kayit[] {
  const yol = join(ICERIK, klasor);
  if (!existsSync(yol)) return [];
  return readdirSync(yol)
    .filter((d) => d.endsWith(".json"))
    .sort()
    .map((d): Kayit | null => {
      const tamYol = join(yol, d);
      const ham = readFileSync(tamYol, "utf-8");
      try {
        return { dosya: `content/${klasor}/${d}`, veri: JSON.parse(ham) as unknown };
      } catch (e) {
        const mesaj = e instanceof Error ? e.message : String(e);
        bozukJson.push({ dosya: `content/${klasor}/${d}`, mesaj });
        return null;
      }
    })
    .filter((k): k is Kayit => k !== null);
}

/** `olaylar[1].tetik.olayId` biçiminde okunabilir yol. */
function yolYaz(parcalar: PropertyKey[]): string {
  let s = "";
  for (const p of parcalar) {
    if (typeof p === "number") s += `[${p}]`;
    else s += s === "" ? String(p) : `.${String(p)}`;
  }
  return s || "(kök)";
}

let hataSayisi = 0;
let uyariSayisi = 0;
let dosyaSayisi = 0;

function hata(dosya: string, yol: string, mesaj: string): void {
  hataSayisi++;
  console.log(`  ${c.kirmizi("✗")} ${dosya}`);
  console.log(`    ${c.kalin(yol)}`);
  console.log(`    ${mesaj}`);
}

function uyari(dosya: string, mesaj: string): void {
  uyariSayisi++;
  console.log(`  ${c.sari("!")} ${dosya}`);
  console.log(`    ${mesaj}`);
}

/** Doğrulanan dosyanın kimliğini (kod/id) tek satırda göstermek için. */
function kimlik(deger: unknown): string {
  if (typeof deger === "object" && deger !== null) {
    const o = deger as Record<string, unknown>;
    if (typeof o.kod === "string") return o.kod;
    if (typeof o.id === "string") return o.id;
  }
  return "";
}

function dogrula<T>(
  kayitlar: Kayit[],
  sema: ZodType<T>,
  opts: { sonraYaz?: boolean } = {},
): Array<{ dosya: string; deger: T }> {
  const sonuc: Array<{ dosya: string; deger: T }> = [];
  if (kayitlar.length === 0) console.log(`  ${c.gri("(dosya yok)")}`);
  for (const { dosya, veri } of kayitlar) {
    dosyaSayisi++;
    const r = sema.safeParse(veri);
    if (r.success) {
      sonuc.push({ dosya, deger: r.data });
      if (opts.sonraYaz !== true) {
        console.log(`  ${c.yesil("✓")} ${kimlik(r.data).padEnd(22)} ${c.gri(dosya)}`);
      }
    } else {
      for (const issue of r.error.issues) hata(dosya, yolYaz(issue.path), issue.message);
    }
  }
  return sonuc;
}

function baslik(metin: string): void {
  console.log(`\n${c.kalin(metin)}`);
}

// ─── 1. Her dosya kendi şemasından geçiyor mu? ────────────────────────────────

baslik("Diziler");
const diziler = dogrula(klasoruOku("diziler"), DiziSchema);
const diziKodlari = new Set(diziler.map((d) => d.deger.kod));

baslik("Karakterler");
const karakterler = dogrula(klasoruOku("karakterler"), KarakterSchema);
const karakterIdleri = new Set(karakterler.map((k) => k.deger.id));

baslik("Cihazlar");
const cihazlar = dogrula(klasoruOku("cihazlar"), CihazSchema);
const cihazKodlari = new Map<string, Cihaz>(cihazlar.map((x) => [x.deger.kod, x.deger]));

baslik("Hesaplar");
const hesaplar = dogrula(klasoruOku("hesaplar"), HesapSchema);
const hesapIdleri = new Map<string, Hesap>(hesaplar.map((x) => [x.deger.id, x.deger]));

baslik("İçerikler");
const icerikler = dogrula(klasoruOku("icerikler"), IcerikSchema);
const icerikIdleri = new Map<string, Icerik>(icerikler.map((x) => [x.deger.id, x.deger]));

baslik("Sahneler");
const sahneler = dogrula(klasoruOku("sahneler"), SahneSchema, { sonraYaz: true });

// ─── 2. Dosyalar arası referanslar ────────────────────────────────────────────

function refKontrol(
  dosya: string,
  yol: string,
  deger: string | undefined,
  havuz: Set<string> | Map<string, unknown>,
  ne: string,
): void {
  if (deger === undefined) return;
  const varMi = havuz instanceof Set ? havuz.has(deger) : havuz.has(deger);
  if (varMi) return;
  const mevcut = [...(havuz instanceof Set ? havuz : havuz.keys())].sort().join(", ");
  hata(dosya, yol, `"${deger}" diye bir ${ne} yok. Mevcut ${ne}lar: ${mevcut || "(hiç yok)"}.`);
}

for (const { dosya, deger } of karakterler) {
  refKontrol(dosya, "dizi", deger.dizi, diziKodlari, "dizi");
}
for (const { dosya, deger } of cihazlar) {
  refKontrol(dosya, "karakter", deger.karakter, karakterIdleri, "karakter");
}
for (const { dosya, deger } of hesaplar) {
  refKontrol(dosya, "dizi", deger.dizi, diziKodlari, "dizi");
  refKontrol(dosya, "karakter", deger.karakter, karakterIdleri, "karakter");
}
for (const { dosya, deger } of icerikler) {
  refKontrol(dosya, "dizi", deger.dizi, diziKodlari, "dizi");
  if (deger.tur === "post") {
    refKontrol(dosya, "veri.hesap", deger.veri.hesap, hesapIdleri, "hesap");
    deger.veri.yorumlar.forEach((y, i) => {
      refKontrol(dosya, `veri.yorumlar[${i}].hesap`, y.hesap, hesapIdleri, "hesap");
    });
  }
}

function sahneReferanslari(dosya: string, sahne: Sahne): void {
  refKontrol(dosya, "cihaz", sahne.cihaz, cihazKodlari, "cihaz");
  refKontrol(dosya, "baslangic.hesap", sahne.baslangic.hesap, hesapIdleri, "hesap");
  refKontrol(dosya, "baslangic.icerikRef", sahne.baslangic.icerikRef, icerikIdleri, "içerik");

  sahne.olaylar.forEach((olay, i) => {
    const a = olay.aksiyon;
    const yol = (alan: string) => `olaylar[${i}].aksiyon.${alan}`;
    switch (a.tur) {
      case "yorumGeldi":
        refKontrol(dosya, yol("hesap"), a.hesap, hesapIdleri, "hesap");
        refKontrol(dosya, yol("postRef"), a.postRef, icerikIdleri, "içerik");
        break;
      case "begeniGeldi":
        refKontrol(dosya, yol("hesap"), a.hesap, hesapIdleri, "hesap");
        refKontrol(dosya, yol("postRef"), a.postRef, icerikIdleri, "içerik");
        break;
      case "takipGeldi":
        refKontrol(dosya, yol("hesap"), a.hesap, hesapIdleri, "hesap");
        break;
      case "postYukle":
        refKontrol(dosya, yol("icerikRef"), a.icerikRef, icerikIdleri, "içerik");
        break;
      case "ekranAc":
        refKontrol(dosya, yol("icerikRef"), a.icerikRef, icerikIdleri, "içerik");
        refKontrol(dosya, yol("hesap"), a.hesap, hesapIdleri, "hesap");
        break;
      case "mesajGeldi":
        refKontrol(dosya, yol("gorselRef"), a.gorselRef, icerikIdleri, "içerik");
        break;
      case "aramaGeldi":
        refKontrol(dosya, yol("gorselRef"), a.gorselRef, icerikIdleri, "içerik");
        break;
      default:
        break;
    }
  });
}

for (const { dosya, deger } of sahneler) {
  const onceki = hataSayisi;
  sahneReferanslari(dosya, deger);
  for (const m of sahneUyarilari(deger)) uyari(dosya, m);
  if (hataSayisi === onceki) {
    console.log(`  ${c.yesil("✓")} ${deger.kod.padEnd(22)} ${c.gri(dosya)}`);
  }
}

// ─── 3. Varlık dosyaları gerçekten var mı? ────────────────────────────────────
//
// Sahne olmayan bir fotoğrafa atıfta bulunursa sette KIRIK GÖRSEL çıkar.
// Burada yakalanırsa orada çıkmaz.

const GENEL = join(KOK, "public");

function varlikKontrol(dosya: string, yol: string, gosterim: string, ne: string): void {
  if (existsSync(join(GENEL, gosterim))) return;
  hata(dosya, yol, `${ne} dosyası yok: public${gosterim}`);
}

baslik("Varlık dosyaları");
const oncekiHata = hataSayisi;

for (const { dosya, deger } of icerikler) {
  if (deger.tur === "post") {
    varlikKontrol(dosya, "veri.gorsel", `/ornek/${deger.veri.gorsel}`, "Post görseli");
  } else if (deger.tur === "foto") {
    varlikKontrol(dosya, "veri.dosya", `/ornek/${deger.veri.dosya}`, "Fotoğraf");
  } else if (deger.tur === "aramaSonucu") {
    deger.veri.sonuclar.forEach((s, i) => {
      if (s.gorsel !== undefined) {
        varlikKontrol(dosya, `veri.sonuclar[${i}].gorsel`, `/ornek/${s.gorsel}`, "Sonuç görseli");
      }
    });
    deger.veri.gorseller.forEach((g, i) => {
      varlikKontrol(dosya, `veri.gorseller[${i}]`, `/ornek/${g}`, "Görsel sonuç");
    });
  }
}
for (const { dosya, deger } of hesaplar) {
  if (deger.avatar !== undefined) {
    varlikKontrol(dosya, "avatar", `/avatar/${deger.avatar}`, "Avatar");
  }
}
for (const { dosya, deger } of cihazlar) {
  if (deger.duvarKagidi !== undefined) {
    varlikKontrol(dosya, "duvarKagidi", `/duvar/${deger.duvarKagidi}.svg`, "Duvar kâğıdı");
  }
  if (deger.kilitEkrani !== undefined) {
    varlikKontrol(dosya, "kilitEkrani", `/duvar/${deger.kilitEkrani}.svg`, "Kilit ekranı");
  }
}

if (hataSayisi === oncekiHata) {
  console.log(`  ${c.yesil("✓")} tüm görseller yerinde`);
}

// ─── 4. Hiç okunamayan dosyalar ───────────────────────────────────────────────

if (bozukJson.length > 0) {
  baslik("Okunamayan dosyalar");
  for (const { dosya, mesaj } of bozukJson) {
    hataSayisi++;
    console.log(`  ${c.kirmizi("✗")} ${dosya}`);
    console.log(`    ${c.kalin("JSON bozuk")} — dosya hiç okunamadı, şemaya bakılamadı.`);
    console.log(`    ${c.gri(mesaj)}`);
    console.log(`    ${c.gri("İpucu: genelde eksik/fazla virgül ya da kapanmayan tırnak olur.")}`);
  }
}

// ─── 5. Özet ──────────────────────────────────────────────────────────────────

console.log("");
if (hataSayisi === 0) {
  const uyariNotu = uyariSayisi > 0 ? c.sari(`, ${uyariSayisi} uyarı`) : "";
  console.log(c.yesil(`✓ ${dosyaSayisi} dosya doğrulandı, hata yok`) + uyariNotu);
  process.exit(0);
} else {
  console.log(c.kirmizi(`✗ ${dosyaSayisi} dosyada ${hataSayisi} hata bulundu.`));
  process.exit(1);
}
