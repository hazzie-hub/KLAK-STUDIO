"use server";

import { revalidatePath } from "next/cache";

import { SahneSchema } from "@/schema";
import {
  StudioHatasi,
  sahneKilitle,
  sahneSil,
  sahneYaz,
  yeniVersiyonAc,
} from "@/icerik/yazma";

/**
 * Stüdyo'nun sunucu eylemleri. Faz 4.3
 *
 * Form doğrudan veritabanına yazmaz; buradan geçer. Her kayıt Zod'dan geçer
 * ve hata mesajları Türkçe olarak şemadan gelir (CLAUDE.md §4: şema tek
 * kaynak — mesajlar da orada yazılı).
 */
export type KayitSonucu =
  | { ok: true; kod: string }
  | { ok: false; hatalar: Array<{ yol: string; mesaj: string }> };

export async function sahneKaydet(ham: unknown): Promise<KayitSonucu> {
  const sonuc = SahneSchema.safeParse(ham);
  if (!sonuc.success) {
    return {
      ok: false,
      hatalar: sonuc.error.issues.map((i) => ({
        yol: i.path.join("."),
        mesaj: i.message,
      })),
    };
  }

  try {
    await sahneYaz(sonuc.data);
  } catch (hata) {
    const mesaj =
      hata instanceof StudioHatasi
        ? hata.message
        : "Sahne kaydedilemedi. Veritabanı bağlantısını kontrol edin.";
    if (!(hata instanceof StudioHatasi)) console.error("[ekran] sahneKaydet:", hata);
    return { ok: false, hatalar: [{ yol: "", mesaj }] };
  }

  revalidatePath("/studio");
  revalidatePath(`/studio/${sonuc.data.kod}`);
  revalidatePath(`/p/${sonuc.data.kod}`);
  revalidatePath(`/k/${sonuc.data.kod}`);
  revalidatePath("/");
  return { ok: true, kod: sonuc.data.kod };
}

/**
 * Yayınla: sahnenin sayfalarını tazeler. CLAUDE.md §2.3 / §8
 *
 * Sahne sayfaları statik üretilir. Next bunları yeniden KURULUM yapmadan tek
 * tek tazeleyebiliyor (`revalidatePath`): bir sonraki açılışta sayfa
 * veritabanındaki son haliyle yeniden üretilir ve yine statik olarak
 * önbelleğe girer. Sette internetsiz çalışma şartı bozulmuyor.
 *
 * ÖNCEKİ TASARIM BIRAKILDI: Vercel deploy hook'una istek atıp tüm siteyi
 * yeniden kurduruyordu. Çalışırdı ama kullanıcıdan kurulum istiyordu ve iki
 * dakika sürüyordu. Bu yol hem anında hem kurulumsuz.
 */
export type YayinSonucu = { ok: true } | { ok: false; mesaj: string };

export async function yayinla(kod: string): Promise<YayinSonucu> {
  if (typeof kod !== "string" || kod.trim() === "") {
    return { ok: false, mesaj: "Hangi sahnenin yayınlanacağı belli değil." };
  }

  try {
    revalidatePath(`/p/${kod}`);
    revalidatePath(`/k/${kod}`);
    revalidatePath(`/studio/${kod}`);
    revalidatePath("/studio");
    revalidatePath("/");
  } catch (hata) {
    console.error("[ekran] yayinla:", hata);
    return { ok: false, mesaj: "Yayınlanamadı. Sayfayı yenileyip tekrar deneyin." };
  }

  return { ok: true };
}

/**
 * Sahneyi onayla (kilitle). CLAUDE.md §8
 * Kilitli sahne değiştirilemez; revizyon için yeni versiyon açılır.
 */
export async function sahneyiKilitle(kod: string): Promise<KayitSonucu> {
  try {
    await sahneKilitle(kod);
  } catch (hata) {
    const mesaj = hata instanceof StudioHatasi ? hata.message : "Sahne kilitlenemedi.";
    if (!(hata instanceof StudioHatasi)) console.error("[ekran] sahneyiKilitle:", hata);
    return { ok: false, hatalar: [{ yol: "", mesaj }] };
  }
  revalidatePath(`/studio/${kod}`);
  revalidatePath("/studio");
  return { ok: true, kod };
}

/** Kilidi aç ve yeni versiyon başlat. Önceki hali arşivlenir. */
export async function yeniVersiyon(kod: string): Promise<KayitSonucu> {
  try {
    await yeniVersiyonAc(kod);
  } catch (hata) {
    const mesaj = hata instanceof StudioHatasi ? hata.message : "Yeni versiyon açılamadı.";
    if (!(hata instanceof StudioHatasi)) console.error("[ekran] yeniVersiyon:", hata);
    return { ok: false, hatalar: [{ yol: "", mesaj }] };
  }
  revalidatePath(`/studio/${kod}`);
  revalidatePath("/studio");
  return { ok: true, kod };
}

export async function sahneyiSil(kod: string): Promise<KayitSonucu> {
  try {
    await sahneSil(kod);
  } catch (hata) {
    const mesaj = hata instanceof StudioHatasi ? hata.message : "Sahne silinemedi.";
    if (!(hata instanceof StudioHatasi)) console.error("[ekran] sahneyiSil:", hata);
    return { ok: false, hatalar: [{ yol: "", mesaj }] };
  }
  revalidatePath("/studio");
  revalidatePath("/");
  return { ok: true, kod };
}
