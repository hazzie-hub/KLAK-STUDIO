import type { Modul } from "@/schema";

/**
 * Her modülün kabuktan ne istediği.
 *
 * `icerikUste`: içerik durum çubuğunun altından geçer mi? Kilit ekranında
 * duvar kâğıdı ekranın en üstüne kadar uzanmalı, yoksa üstte beyaz bir şerit
 * kalır ve sahte durur.
 * `ustKatman`: koyu zemin üstünde saat/pil yazısı beyaz olmalı.
 */
export type ModulGorunumu = {
  icerikUste: boolean;
  ustKatman: "koyu" | "acik";
};

const VARSAYILAN: ModulGorunumu = { icerikUste: false, ustKatman: "koyu" };

const GORUNUMLER: Partial<Record<Modul, ModulGorunumu>> = {
  kilit: { icerikUste: true, ustKatman: "acik" },
};

export function modulGorunumu(modul: Modul): ModulGorunumu {
  return GORUNUMLER[modul] ?? VARSAYILAN;
}
