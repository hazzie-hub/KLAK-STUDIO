"use server";

import { revalidatePath } from "next/cache";

import { SahneSchema } from "@/schema";
import { StudioHatasi, sahneSil, sahneYaz } from "@/icerik/yazma";

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
  revalidatePath("/");
  return { ok: true, kod: sonuc.data.kod };
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
