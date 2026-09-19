"use client";

import { useActionState } from "react";

import { girisYap, type GirisDurumu } from "./giris-eylemi";
import { Dugme, GIRDI_SINIFI } from "./panel";

/**
 * Giriş formu. CLAUDE.md §8
 *
 * Tek alan: parola. Kullanıcı adı yok — ekip tek parolayı paylaşıyor,
 * ikinci bir alan sadece sürtünme olurdu.
 */
export function GirisFormu({ devam }: { devam: string }) {
  const [durum, eylem, bekliyor] = useActionState<GirisDurumu, FormData>(girisYap, {});

  return (
    <form action={eylem} className="flex flex-col gap-3">
      <input type="hidden" name="devam" value={devam} />
      <div>
        <label htmlFor="parola" className="mb-[6px] block text-[13px] font-medium text-[#1d1d1f]">
          Parola
        </label>
        <input
          id="parola"
          name="parola"
          type="password"
          autoFocus
          autoComplete="current-password"
          className={GIRDI_SINIFI}
          aria-invalid={durum.hata !== undefined}
          aria-describedby={durum.hata !== undefined ? "giris-hatasi" : undefined}
        />
      </div>

      {durum.hata !== undefined && (
        <p id="giris-hatasi" role="alert" className="text-[13px] text-[#c0392b]">
          {durum.hata}
        </p>
      )}

      <Dugme type="submit" tur="birincil" disabled={bekliyor}>
        {bekliyor ? "Giriliyor…" : "Gir"}
      </Dugme>
    </form>
  );
}
