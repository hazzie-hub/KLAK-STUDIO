/**
 * Verinin nereden okunacağı. CLAUDE.md §4 (Faz 4.2)
 *
 * İKİ KAYNAK:
 *  - Supabase: ortam değişkenleri tanımlıysa asıl kaynak budur.
 *  - Dosyalar (`content/`): değişkenler yoksa. Faz 1–3'ün yolu; yerel
 *    geliştirmede ve testlerde hâlâ çalışır.
 *
 * SESSİZCE GERİ DÜŞMEZ: Supabase yapılandırılmışsa ve erişilemiyorsa hata
 * fırlatılır, derleme durur. Aksi halde veritabanı bir an erişilemediğinde
 * ESKİ dosya içeriğiyle sessizce yayına çıkardık ve kimse fark etmezdi.
 *
 * SUNUCU TARAFI: service role anahtarı kullanır, tarayıcıya ASLA taşınmaz.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ZodType } from "zod";

import {
  CihazSchema,
  DiziSchema,
  HesapSchema,
  IcerikSchema,
  KarakterSchema,
  SahneSchema,
  type Cihaz,
  type Dizi,
  type Hesap,
  type Icerik,
  type Karakter,
  type Sahne,
} from "@/schema";
import {
  cihazOku,
  diziOku,
  hesapOku,
  icerikOku,
  karakterOku,
  sahneOku,
  tumDiziler,
  tumHesaplar,
  tumIcerikler,
  tumSahneKodlari,
  tumSahneler,
} from "./yukle";

function sunucuMu(): void {
  if (typeof window !== "undefined") {
    throw new Error("[ekran] Veri kaynağı yalnızca sunucuda okunur.");
  }
}

function ayarlar(): { url: string; anahtar: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anahtar = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof url !== "string" || url.trim() === "") return null;
  if (typeof anahtar !== "string" || anahtar.trim() === "") return null;
  return { url, anahtar };
}

/** Stüdyo veritabanı devrede mi? Dosyalardan mı okunuyor? */
export function supabaseKaynakMi(): boolean {
  return ayarlar() !== null;
}

let istemci: SupabaseClient | null = null;

function baglan(): SupabaseClient {
  sunucuMu();
  const a = ayarlar();
  if (a === null) throw new Error("[ekran] Supabase ayarları eksik.");
  istemci ??= createClient(a.url, a.anahtar, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return istemci;
}

/**
 * Bir tablodaki satırların `veri` sütununu şemadan geçirir.
 * Şemadan geçmeyen satır ATLANMAZ, hata fırlatır: Stüdyo'dan bozuk kayıt
 * çıkmışsa sette değil burada görülmeli.
 */
async function tabloOku<T>(tablo: string, sema: ZodType<T>): Promise<T[]> {
  const { data, error } = await baglan().from(tablo).select("veri");
  if (error !== null) {
    throw new Error(`[ekran] "${tablo}" okunamadı: ${error.message}`);
  }
  return (data ?? []).map((satir, i) => {
    const sonuc = sema.safeParse((satir as { veri: unknown }).veri);
    if (!sonuc.success) {
      const sebep = sonuc.error.issues.map((x) => x.message).join(" | ");
      throw new Error(`[ekran] "${tablo}" ${i}. satır şemadan geçmedi: ${sebep}`);
    }
    return sonuc.data;
  });
}

async function satirOku<T>(
  tablo: string,
  sutun: string,
  deger: string,
  sema: ZodType<T>,
): Promise<T | null> {
  const { data, error } = await baglan()
    .from(tablo)
    .select("veri")
    .eq(sutun, deger)
    .maybeSingle();
  if (error !== null) {
    throw new Error(`[ekran] "${tablo}/${deger}" okunamadı: ${error.message}`);
  }
  if (data === null) return null;
  const sonuc = sema.safeParse((data as { veri: unknown }).veri);
  if (!sonuc.success) {
    const sebep = sonuc.error.issues.map((x) => x.message).join(" | ");
    throw new Error(`[ekran] "${tablo}/${deger}" şemadan geçmedi: ${sebep}`);
  }
  return sonuc.data;
}

// ─── Dışarıya açılan okuma yüzeyi ────────────────────────────────────────────
// Çağıran taraf kaynağın hangisi olduğunu bilmez (CLAUDE.md §4).

export async function sahneGetir(kod: string): Promise<Sahne | null> {
  return supabaseKaynakMi() ? satirOku("sahneler", "kod", kod, SahneSchema) : sahneOku(kod);
}

export async function cihazGetir(kod: string): Promise<Cihaz | null> {
  return supabaseKaynakMi() ? satirOku("cihazlar", "kod", kod, CihazSchema) : cihazOku(kod);
}

export async function hesapGetir(id: string): Promise<Hesap | null> {
  return supabaseKaynakMi() ? satirOku("hesaplar", "id", id, HesapSchema) : hesapOku(id);
}

export async function icerikGetir(id: string): Promise<Icerik | null> {
  return supabaseKaynakMi() ? satirOku("icerikler", "id", id, IcerikSchema) : icerikOku(id);
}

export async function diziGetir(kod: string): Promise<Dizi | null> {
  return supabaseKaynakMi() ? satirOku("diziler", "kod", kod, DiziSchema) : diziOku(kod);
}

export async function karakterGetir(id: string): Promise<Karakter | null> {
  return supabaseKaynakMi() ? satirOku("karakterler", "id", id, KarakterSchema) : karakterOku(id);
}

export async function tumHesaplariGetir(): Promise<Hesap[]> {
  return supabaseKaynakMi() ? tabloOku("hesaplar", HesapSchema) : tumHesaplar();
}

export async function tumIcerikleriGetir(): Promise<Icerik[]> {
  return supabaseKaynakMi() ? tabloOku("icerikler", IcerikSchema) : tumIcerikler();
}

export async function tumCihazlariGetir(): Promise<Cihaz[]> {
  if (supabaseKaynakMi()) return tabloOku("cihazlar", CihazSchema);
  return tumSahneler()
    .map((s) => s.cihaz)
    .filter((c): c is Cihaz => c !== null)
    .filter((c, i, hepsi) => hepsi.findIndex((x) => x.kod === c.kod) === i);
}

export async function tumDizileriGetir(): Promise<Dizi[]> {
  return supabaseKaynakMi() ? tabloOku("diziler", DiziSchema) : tumDiziler();
}

export async function tumSahneKodlariniGetir(): Promise<string[]> {
  if (!supabaseKaynakMi()) return tumSahneKodlari();
  const { data, error } = await baglan().from("sahneler").select("kod").order("kod");
  if (error !== null) throw new Error(`[ekran] Sahne kodları okunamadı: ${error.message}`);
  return (data ?? []).map((s) => (s as { kod: string }).kod);
}

/**
 * Sahne listesi — Stüdyo ve ana sayfa için, cihazlarıyla birlikte.
 *
 * `kilitli` ve `versiyon` yalnızca veritabanı kaynağında gelir; dosya
 * kaynağında onay kavramı yok, bu yüzden `null` dönerler.
 */
export type SahneOzeti = {
  sahne: Sahne;
  cihaz: Cihaz | null;
  kilitli: boolean | null;
  versiyon: number | null;
};

export async function tumSahneleriGetir(): Promise<SahneOzeti[]> {
  if (!supabaseKaynakMi()) {
    return tumSahneler().map(({ sahne, cihaz }) => ({
      sahne,
      cihaz,
      kilitli: null,
      versiyon: null,
    }));
  }

  const { data, error } = await baglan().from("sahneler").select("veri, kilitli, versiyon");
  if (error !== null) throw new Error(`[ekran] Sahne listesi okunamadı: ${error.message}`);

  const cihazlar = await tabloOku("cihazlar", CihazSchema);
  const cihazHaritasi = new Map(cihazlar.map((c) => [c.kod, c]));

  const ozetler = (data ?? []).map((ham, i) => {
    const satir = ham as { veri: unknown; kilitli: boolean; versiyon: number };
    const sonuc = SahneSchema.safeParse(satir.veri);
    if (!sonuc.success) {
      const sebep = sonuc.error.issues.map((x) => x.message).join(" | ");
      throw new Error(`[ekran] "sahneler" ${i}. satır şemadan geçmedi: ${sebep}`);
    }
    return {
      sahne: sonuc.data,
      cihaz: cihazHaritasi.get(sonuc.data.cihaz) ?? null,
      kilitli: satir.kilitli,
      versiyon: satir.versiyon,
    };
  });

  return ozetler.sort((a, b) => a.sahne.kod.localeCompare(b.sahne.kod));
}
