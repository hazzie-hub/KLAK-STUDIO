/**
 * Veritabanına yazma. Faz 4.3
 *
 * Yalnızca Stüdyo kullanır; Oynatıcı hiçbir zaman yazmaz. Okuma gibi bu da
 * sunucu tarafıdır ve service role anahtarıyla çalışır.
 *
 * Dosya kaynağına yazma YOK: Stüdyo veritabanı olmadan çalışmaz. Dosyalar
 * Faz 1–3'ün kaynağıydı, artık yalnızca test ve yerel geliştirme için duruyor.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Sahne } from "@/schema";
import { kodCoz } from "@/studio/teslim";

export class StudioHatasi extends Error {}

function baglan(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new StudioHatasi("Veritabanına yalnızca sunucudan yazılır.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anahtar = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (
    typeof url !== "string" ||
    url.trim() === "" ||
    typeof anahtar !== "string" ||
    anahtar.trim() === ""
  ) {
    throw new StudioHatasi(
      "Stüdyo veritabanına bağlı değil. NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlı olmalı.",
    );
  }
  return createClient(url, anahtar, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Sahne veritabanında var mı, kilitli mi? */
export async function sahneDurumu(
  kod: string,
): Promise<{ var: boolean; kilitli: boolean; versiyon: number }> {
  const { data, error } = await baglan()
    .from("sahneler")
    .select("kilitli, versiyon")
    .eq("kod", kod)
    .maybeSingle();
  if (error !== null) throw new StudioHatasi(`Sahne okunamadı: ${error.message}`);
  if (data === null) return { var: false, kilitli: false, versiyon: 0 };
  const satir = data as { kilitli: boolean; versiyon: number };
  return { var: true, kilitli: satir.kilitli, versiyon: satir.versiyon };
}

/**
 * Sahneyi kaydeder. Şemadan geçmiş bir `Sahne` bekler — doğrulama ÇAĞIRANIN
 * işidir, burada ikinci kez yapılmaz ki hata mesajları tek yerde üretilsin.
 *
 * Kilitli sahne değiştirilemez (CLAUDE.md §8); kilidi açmak ayrı bir iştir.
 */
export async function sahneYaz(sahne: Sahne): Promise<void> {
  const durum = await sahneDurumu(sahne.kod);
  if (durum.kilitli) {
    throw new StudioHatasi(
      `"${sahne.kod}" kilitli. Onaylanmış sahne doğrudan değiştirilemez; önce kilidi açılmalı.`,
    );
  }

  const parca = kodCoz(sahne.kod);
  const { error } = await baglan()
    .from("sahneler")
    .upsert(
      {
        kod: sahne.kod,
        dizi: parca?.dizi ?? null,
        bolum: parca?.bolum ?? null,
        veri: sahne,
      },
      { onConflict: "kod" },
    );
  if (error !== null) throw new StudioHatasi(`Sahne kaydedilemedi: ${error.message}`);
}

/**
 * Sahneyi kilitler — "onaylandı" demek. CLAUDE.md §8
 *
 * Kilitli sahne değiştirilemez. Sete giden link kilitlendikten sonra da aynı
 * kalır; değişmesi gereken şey sahnenin İÇERİĞİ değil, versiyonudur.
 */
export async function sahneKilitle(kod: string): Promise<void> {
  const durum = await sahneDurumu(kod);
  if (!durum.var) throw new StudioHatasi(`"${kod}" diye bir sahne yok.`);
  if (durum.kilitli) return; // Zaten kilitli; ikinci kez kilitlemek hata değil.

  const { error } = await baglan()
    .from("sahneler")
    .update({ kilitli: true, yayinlandi: new Date().toISOString() })
    .eq("kod", kod);
  if (error !== null) throw new StudioHatasi(`Sahne kilitlenemedi: ${error.message}`);
}

/**
 * Kilidi açar ve YENİ VERSİYON başlatır. CLAUDE.md §8
 *
 * Onaylanmış hali silinmez: mevcut içerik `sahne_versiyonlari`na kopyalanır,
 * sonra sahnenin versiyonu bir artar ve kilit açılır. Link değişmez.
 *
 * Böylece "sette hangi versiyon oynadı" sorusu sonradan cevaplanabilir.
 */
export async function yeniVersiyonAc(kod: string, not?: string): Promise<number> {
  const db = baglan();

  const { data, error } = await db
    .from("sahneler")
    .select("versiyon, veri, kilitli")
    .eq("kod", kod)
    .maybeSingle();
  if (error !== null) throw new StudioHatasi(`Sahne okunamadı: ${error.message}`);
  if (data === null) throw new StudioHatasi(`"${kod}" diye bir sahne yok.`);

  const satir = data as { versiyon: number; veri: unknown; kilitli: boolean };
  if (!satir.kilitli) {
    throw new StudioHatasi(
      `"${kod}" zaten açık; yeni versiyon yalnızca kilitli sahne için açılır.`,
    );
  }

  // Önce arşivle. Arşiv yazılamazsa kilidi AÇMA — onaylı hali kaybolmasın.
  const { error: arsivHatasi } = await db.from("sahne_versiyonlari").upsert(
    { kod, versiyon: satir.versiyon, veri: satir.veri, not_metni: not ?? null },
    { onConflict: "kod,versiyon" },
  );
  if (arsivHatasi !== null) {
    throw new StudioHatasi(`Önceki versiyon arşivlenemedi: ${arsivHatasi.message}`);
  }

  const yeniVersiyon = satir.versiyon + 1;
  const { error: guncelleHatasi } = await db
    .from("sahneler")
    .update({ versiyon: yeniVersiyon, kilitli: false })
    .eq("kod", kod);
  if (guncelleHatasi !== null) {
    throw new StudioHatasi(`Kilit açılamadı: ${guncelleHatasi.message}`);
  }

  return yeniVersiyon;
}

/** Arşivlenmiş versiyonlar — en yeniden eskiye. */
export async function sahneGecmisi(
  kod: string,
): Promise<Array<{ versiyon: number; olusturuldu: string; not: string | null }>> {
  const { data, error } = await baglan()
    .from("sahne_versiyonlari")
    .select("versiyon, olusturuldu, not_metni")
    .eq("kod", kod)
    .order("versiyon", { ascending: false });
  if (error !== null) throw new StudioHatasi(`Versiyon geçmişi okunamadı: ${error.message}`);
  return (data ?? []).map((x) => {
    const satir = x as { versiyon: number; olusturuldu: string; not_metni: string | null };
    return { versiyon: satir.versiyon, olusturuldu: satir.olusturuldu, not: satir.not_metni };
  });
}

/**
 * `content/` dosyalarını veritabanına aktarır. Faz 4.6
 *
 * NEDEN VAR: veritabanına geçtikten sonra dosyalar yayını beslemiyor. Depoya
 * yeni bir sahne ya da içerik eklendiğinde (geliştirme sırasında olur) bunun
 * veritabanına da girmesi gerekiyor. Alternatifi, üretilen SQL'i panele elle
 * yapıştırmaktı; bu düğme aynı işi sunucuda yapıyor ve kimseden bir şey
 * istemiyor.
 *
 * Yalnızca EKLER VE GÜNCELLER — veritabanında olup dosyalarda olmayan hiçbir
 * kaydı silmez. Stüdyo'dan girilen sahneler bu yüzden güvende.
 */
export async function dosyalardanAktar(): Promise<Record<string, number>> {
  const { cihazOku, karakterOku, tumDiziler, tumHesaplar, tumIcerikler, tumSahneler } =
    await import("./yukle");
  const { readdirSync, existsSync } = await import("node:fs");
  const { join } = await import("node:path");

  const kodlar = (klasor: string): string[] => {
    const yol = join(process.cwd(), "content", klasor);
    if (!existsSync(yol)) return [];
    return readdirSync(yol)
      .filter((d) => d.endsWith(".json"))
      .map((d) => d.replace(/\.json$/, ""));
  };

  const db = baglan();
  const sayim: Record<string, number> = {};

  const yaz = async (tablo: string, anahtar: string, satirlar: Record<string, unknown>[]) => {
    if (satirlar.length === 0) return;
    const { error } = await db.from(tablo).upsert(satirlar, { onConflict: anahtar });
    if (error !== null) throw new StudioHatasi(`"${tablo}" aktarılamadı: ${error.message}`);
    sayim[tablo] = satirlar.length;
  };

  // Sıra ÖNEMLİ: yabancı anahtarlar önce üst kaydı ister.
  const diziler = tumDiziler();
  await yaz("diziler", "kod", diziler.map((d) => ({ kod: d.kod, veri: d })));

  const karakterler = kodlar("karakterler").flatMap((id) => {
    const k = karakterOku(id);
    return k === null ? [] : [k];
  });
  await yaz("karakterler", "id", karakterler.map((k) => ({ id: k.id, dizi: k.dizi, veri: k })));

  const cihazlar = kodlar("cihazlar").flatMap((kod) => {
    const c = cihazOku(kod);
    return c === null ? [] : [c];
  });
  await yaz(
    "cihazlar",
    "kod",
    cihazlar.map((c) => ({ kod: c.kod, karakter: c.karakter ?? null, veri: c })),
  );

  await yaz(
    "hesaplar",
    "id",
    tumHesaplar().map((h) => ({ id: h.id, dizi: h.dizi ?? null, modul: h.modul, veri: h })),
  );

  await yaz(
    "icerikler",
    "id",
    tumIcerikler().map((i) => ({ id: i.id, dizi: i.dizi ?? null, tur: i.tur, veri: i })),
  );

  // Sahneler: KİLİTLİ olanlara dokunulmaz. Onaylanmış bir sahnenin dosyadaki
  // eski hali, sette oynayan onaylı halin üstüne yazmamalı.
  const { data: kilitliler } = await db.from("sahneler").select("kod").eq("kilitli", true);
  const kilitliKodlar = new Set(
    ((kilitliler ?? []) as Array<{ kod: string }>).map((x) => x.kod),
  );

  const sahneler = tumSahneler()
    .map((x) => x.sahne)
    .filter((x) => !kilitliKodlar.has(x.kod));

  await yaz(
    "sahneler",
    "kod",
    sahneler.map((x) => {
      const parca = kodCoz(x.kod);
      return { kod: x.kod, dizi: parca?.dizi ?? null, bolum: parca?.bolum ?? null, veri: x };
    }),
  );

  // Bölümler sahne kodlarından türer.
  const bolumler = new Map<string, { dizi: string; no: number }>();
  for (const x of tumSahneler().map((y) => y.sahne)) {
    const parca = kodCoz(x.kod);
    if (parca === null) continue;
    bolumler.set(`${parca.dizi}|${parca.bolum}`, { dizi: parca.dizi, no: parca.bolum });
  }
  await yaz(
    "bolumler",
    "dizi,no",
    [...bolumler.values()].map((b) => ({ dizi: b.dizi, no: b.no, veri: b })),
  );

  if (kilitliKodlar.size > 0) sayim["atlanan_kilitli_sahne"] = kilitliKodlar.size;
  return sayim;
}

/** Bir sahneyi siler. Geri alınamaz; çağıran onay almalı. */
export async function sahneSil(kod: string): Promise<void> {
  const durum = await sahneDurumu(kod);
  if (durum.kilitli) {
    throw new StudioHatasi(`"${kod}" kilitli, silinemez.`);
  }
  const { error } = await baglan().from("sahneler").delete().eq("kod", kod);
  if (error !== null) throw new StudioHatasi(`Sahne silinemedi: ${error.message}`);
}
