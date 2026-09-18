/**
 * Dosya tabanlı içerik okuma (Faz 1–3).
 * Faz 4'te burası Supabase'e taşınacak; çağıran taraf değişmesin diye
 * tüm okuma bu modülden geçer.
 *
 * SUNUCU TARAFI: `node:fs` kullanır, istemciye taşınmaz.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { ZodType } from "zod";

import {
  CihazSchema,
  HesapSchema,
  IcerikSchema,
  SahneSchema,
  type Cihaz,
  type Hesap,
  type Icerik,
  type Sahne,
} from "@/schema";

const ICERIK_KOK = join(process.cwd(), "content");

function jsonOku<T>(klasor: string, dosyaAdi: string, sema: ZodType<T>): T | null {
  const yol = join(ICERIK_KOK, klasor, `${dosyaAdi}.json`);
  if (!existsSync(yol)) return null;

  let ham: unknown;
  try {
    ham = JSON.parse(readFileSync(yol, "utf-8")) as unknown;
  } catch {
    // CLAUDE.md §2.6: kamerada hata görünmez. Sessizce yok say, üst katman karar versin.
    console.error(`[ekran] ${klasor}/${dosyaAdi}.json okunamadı: JSON bozuk.`);
    return null;
  }

  const sonuc = sema.safeParse(ham);
  if (!sonuc.success) {
    console.error(
      `[ekran] ${klasor}/${dosyaAdi}.json şemadan geçmedi:`,
      sonuc.error.issues.map((i) => i.message).join(" | "),
    );
    return null;
  }
  return sonuc.data;
}

export function sahneOku(kod: string): Sahne | null {
  return jsonOku("sahneler", kod, SahneSchema);
}

export function cihazOku(kod: string): Cihaz | null {
  return jsonOku("cihazlar", kod, CihazSchema);
}

export function hesapOku(id: string): Hesap | null {
  return jsonOku("hesaplar", id, HesapSchema);
}

export function icerikOku(id: string): Icerik | null {
  return jsonOku("icerikler", id, IcerikSchema);
}

/** Tüm sahne kodları — önceden üretim (`generateStaticParams`) için. */
export function tumSahneKodlari(): string[] {
  const yol = join(ICERIK_KOK, "sahneler");
  if (!existsSync(yol)) return [];
  return readdirSync(yol)
    .filter((d) => d.endsWith(".json"))
    .map((d) => d.replace(/\.json$/, ""))
    .sort();
}
