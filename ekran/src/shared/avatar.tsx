"use client";

import type { Hesap } from "@/schema";
import { Medya } from "@/shared/medya";

/**
 * Hesap avatarı ve sayı biçimi — modüllerin ortak parçaları.
 *
 * Avatarı üç modül çiziyor (sosyal, mesaj, web); biri diğerinden import
 * etmesin diye burada duruyor. Görsel yüklenmesi `shared/medya` üzerinden:
 * modüller kendi "yavaş yükleme" mantığını yazmaz.
 */
export function Avatar({
  hesap,
  boyut = 34,
  halka = false,
}: {
  hesap: Hesap | null;
  boyut?: number;
  halka?: boolean;
}) {
  const kaynak = hesap?.avatar;
  const govde =
    kaynak === undefined ? (
      <div
        className="h-full w-full"
        style={{ background: "var(--zemin-ikincil)", borderRadius: "999px" }}
      />
    ) : (
      <Medya
        kaynak={`/avatar/${kaynak}`}
        alt={hesap?.gorunenAd ?? ""}
        className="h-full w-full rounded-full"
      />
    );

  if (!halka) {
    return (
      <div className="shrink-0 overflow-hidden rounded-full" style={{ width: boyut, height: boyut }}>
        {govde}
      </div>
    );
  }

  return (
    <div
      className="shrink-0 rounded-full p-[2px]"
      style={{ width: boyut + 5, height: boyut + 5, background: "linear-gradient(135deg,#d98f4a,#b8456a)" }}
    >
      <div className="h-full w-full overflow-hidden rounded-full" style={{ border: "2px solid var(--zemin)" }}>
        {govde}
      </div>
    </div>
  );
}

export function sayiYaz(n: number): string {
  return n.toLocaleString("tr-TR");
}
