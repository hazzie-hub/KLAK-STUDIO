/**
 * content/ altındaki dosyaları Supabase'e aktarır. Faz 4.2
 *
 * Tek yönlüdür ve TEKRAR ÇALIŞTIRILABİLİR: her kayıt `upsert` edilir, yani
 * varsa güncellenir, yoksa eklenir. Silme yapmaz — veritabanında olup
 * dosyalarda olmayan bir kayda dokunmaz.
 *
 *   npm run aktar          neyin aktarılacağını yazar, aktarır
 *   npm run aktar -- --kuru   hiçbir şey yazmaz, sadece ne olacağını gösterir
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

import {
  tumDiziler,
  tumHesaplar,
  tumIcerikler,
  tumSahneler,
} from "../src/icerik/yukle";
import { cihazOku, karakterOku } from "../src/icerik/yukle";
import { readdirSync } from "node:fs";
import { kodCoz } from "../src/studio/teslim";

const c = {
  yesil: (s: string) => `\x1b[32m${s}\x1b[0m`,
  kirmizi: (s: string) => `\x1b[31m${s}\x1b[0m`,
  soluk: (s: string) => `\x1b[90m${s}\x1b[0m`,
};

/** .env.local'i elle oku — tsx betikleri Next'in yaptığını yapmaz. */
function ortamiYukle(): void {
  const yol = join(process.cwd(), ".env.local");
  if (!existsSync(yol)) return;
  for (const satir of readFileSync(yol, "utf-8").split("\n")) {
    const temiz = satir.trim();
    if (temiz === "" || temiz.startsWith("#")) continue;
    const ayrac = temiz.indexOf("=");
    if (ayrac === -1) continue;
    const ad = temiz.slice(0, ayrac).trim();
    const deger = temiz.slice(ayrac + 1).trim().replace(/^["']|["']$/g, "");
    process.env[ad] ??= deger;
  }
}

function klasordekiKodlar(klasor: string): string[] {
  const yol = join(process.cwd(), "content", klasor);
  if (!existsSync(yol)) return [];
  return readdirSync(yol)
    .filter((d) => d.endsWith(".json"))
    .map((d) => d.replace(/\.json$/, ""))
    .sort();
}

async function main(): Promise<void> {
  ortamiYukle();
  const kuru = process.argv.includes("--kuru");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anahtar = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || anahtar === undefined || url === "" || anahtar === "") {
    console.error(
      c.kirmizi("✗") +
        " NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlı değil.\n" +
        "  .env.local dosyasına ekleyin ya da ortam değişkeni olarak verin.",
    );
    process.exitCode = 1;
    return;
  }

  const db = createClient(url, anahtar, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Sıra ÖNEMLİ: yabancı anahtarlar önce üst kaydı ister.
  const diziler = tumDiziler();
  const karakterler = klasordekiKodlar("karakterler").flatMap((id) => {
    const k = karakterOku(id);
    return k === null ? [] : [k];
  });
  const cihazlar = klasordekiKodlar("cihazlar").flatMap((kod) => {
    const c2 = cihazOku(kod);
    return c2 === null ? [] : [c2];
  });
  const hesaplar = tumHesaplar();
  const icerikler = tumIcerikler();
  const sahneler = tumSahneler().map((s) => s.sahne);

  // Bölüm kaydı dosyalarda yok; sahne kodlarından türetiyoruz.
  const bolumler = new Map<string, { dizi: string; no: number }>();
  for (const sahne of sahneler) {
    const parca = kodCoz(sahne.kod);
    if (parca === null) continue;
    bolumler.set(`${parca.dizi}|${parca.bolum}`, { dizi: parca.dizi, no: parca.bolum });
  }

  const isler: Array<{ tablo: string; satirlar: Record<string, unknown>[]; anahtar: string }> = [
    {
      tablo: "diziler",
      anahtar: "kod",
      satirlar: diziler.map((d) => ({ kod: d.kod, veri: d })),
    },
    {
      tablo: "bolumler",
      anahtar: "dizi,no",
      satirlar: [...bolumler.values()].map((b) => ({ dizi: b.dizi, no: b.no, veri: b })),
    },
    {
      tablo: "karakterler",
      anahtar: "id",
      satirlar: karakterler.map((k) => ({ id: k.id, dizi: k.dizi, veri: k })),
    },
    {
      tablo: "cihazlar",
      anahtar: "kod",
      satirlar: cihazlar.map((x) => ({ kod: x.kod, karakter: x.karakter ?? null, veri: x })),
    },
    {
      tablo: "hesaplar",
      anahtar: "id",
      satirlar: hesaplar.map((h) => ({ id: h.id, dizi: h.dizi ?? null, modul: h.modul, veri: h })),
    },
    {
      tablo: "icerikler",
      anahtar: "id",
      satirlar: icerikler.map((i) => ({ id: i.id, dizi: i.dizi ?? null, tur: i.tur, veri: i })),
    },
    {
      tablo: "sahneler",
      anahtar: "kod",
      satirlar: sahneler.map((s) => {
        const parca = kodCoz(s.kod);
        return {
          kod: s.kod,
          dizi: parca?.dizi ?? null,
          bolum: parca?.bolum ?? null,
          veri: s,
        };
      }),
    },
  ];

  console.log(kuru ? c.soluk("KURU ÇALIŞMA — hiçbir şey yazılmayacak\n") : "");

  let hata = false;
  for (const is of isler) {
    if (is.satirlar.length === 0) {
      console.log(`${c.soluk("–")} ${is.tablo.padEnd(14)} ${c.soluk("kayıt yok")}`);
      continue;
    }
    if (kuru) {
      console.log(`${c.soluk("→")} ${is.tablo.padEnd(14)} ${is.satirlar.length} kayıt`);
      continue;
    }
    const { error } = await db.from(is.tablo).upsert(is.satirlar, { onConflict: is.anahtar });
    if (error !== null) {
      console.error(`${c.kirmizi("✗")} ${is.tablo.padEnd(14)} ${error.message}`);
      hata = true;
    } else {
      console.log(`${c.yesil("✓")} ${is.tablo.padEnd(14)} ${is.satirlar.length} kayıt`);
    }
  }

  if (hata) {
    console.error(c.kirmizi("\nAktarım tamamlanamadı."));
    process.exitCode = 1;
    return;
  }
  console.log(kuru ? "" : c.yesil("\nAktarım tamam."));
}

void main();
