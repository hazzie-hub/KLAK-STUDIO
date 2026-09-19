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

/** Bir sahneyi siler. Geri alınamaz; çağıran onay almalı. */
export async function sahneSil(kod: string): Promise<void> {
  const durum = await sahneDurumu(kod);
  if (durum.kilitli) {
    throw new StudioHatasi(`"${kod}" kilitli, silinemez.`);
  }
  const { error } = await baglan().from("sahneler").delete().eq("kod", kod);
  if (error !== null) throw new StudioHatasi(`Sahne silinemedi: ${error.message}`);
}
