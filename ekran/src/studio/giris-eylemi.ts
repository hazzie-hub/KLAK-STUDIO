"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OTURUM_CEREZI, OTURUM_SURESI, oturumJetonu, parolaAl } from "./oturum";

/**
 * Giriş ve çıkış. CLAUDE.md §8
 *
 * Parola karşılaştırması SUNUCUDA yapılır; tarayıcıya parola da imza da
 * gönderilmez, yalnızca çerez kurulur.
 */

export type GirisDurumu = { hata?: string };

export async function girisYap(_onceki: GirisDurumu, form: FormData): Promise<GirisDurumu> {
  const girilen = String(form.get("parola") ?? "");
  const devam = String(form.get("devam") ?? "");

  if (girilen.length === 0) return { hata: "Parolayı yazın." };
  if (girilen !== parolaAl()) return { hata: "Parola yanlış." };

  const kavanoz = await cookies();
  kavanoz.set(OTURUM_CEREZI, await oturumJetonu(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OTURUM_SURESI,
  });

  // Açık yönlendirme olmasın: yalnızca kendi sitemizdeki bir yola dönülür.
  redirect(devam.startsWith("/") && !devam.startsWith("//") ? devam : "/");
}

export async function cikisYap(): Promise<void> {
  const kavanoz = await cookies();
  kavanoz.delete(OTURUM_CEREZI);
  redirect("/giris");
}
