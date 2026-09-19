import { ModulSchema } from "@/schema";
import { tumCihazlariGetir, tumHesaplariGetir, tumIcerikleriGetir } from "@/icerik/kaynak";
import type { Secenekler } from "./alan-girdisi";

/**
 * Formun açılır listeleri. Faz 4.3
 *
 * Hepsi veritabanından gelir; elle slug yazmak yerine seçilir. Böylece
 * "olmayan hesaba yorum yazdırma" gibi hatalar forma hiç girmez.
 */
export async function secenekleriTopla(): Promise<Secenekler> {
  const [hesaplar, icerikler, cihazlar] = await Promise.all([
    tumHesaplariGetir(),
    tumIcerikleriGetir(),
    tumCihazlariGetir(),
  ]);

  const icerikEtiketi = (id: string, tur: string) => `${id} (${tur})`;

  return {
    hesap: hesaplar
      .map((h) => ({ deger: h.id, etiket: `${h.gorunenAd} · ${h.id}` }))
      .sort((a, b) => a.etiket.localeCompare(b.etiket, "tr")),
    icerik: icerikler
      .map((i) => ({ deger: i.id, etiket: icerikEtiketi(i.id, i.tur) }))
      .sort((a, b) => a.etiket.localeCompare(b.etiket, "tr")),
    sohbet: icerikler
      .filter((i) => i.tur === "sohbet")
      .map((i) => ({ deger: i.id, etiket: i.id }))
      .sort((a, b) => a.etiket.localeCompare(b.etiket, "tr")),
    post: icerikler
      .filter((i) => i.tur === "post")
      .map((i) => ({ deger: i.id, etiket: i.id }))
      .sort((a, b) => a.etiket.localeCompare(b.etiket, "tr")),
    modul: ModulSchema.options.map((m) => ({ deger: m, etiket: m })),
    cihaz: cihazlar
      .map((c) => ({ deger: c.kod, etiket: `${c.kod} · ${c.skin}` }))
      .sort((a, b) => a.etiket.localeCompare(b.etiket, "tr")),
  };
}
