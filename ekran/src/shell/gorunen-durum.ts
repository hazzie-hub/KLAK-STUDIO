import type { Cihaz, Durum, Sahne } from "@/schema";

/**
 * Sahnenin açılış anındaki cihaz durumu.
 *
 * Öncelik: sahne > cihazın varsayılanı > sabit yedek.
 * CLAUDE.md §2.4: sahne deterministiktir — saat GERÇEK SAATTEN OKUNMAZ,
 * yoksa her tekrarda farklı görünür. Sabit bir saat kullanılır.
 *
 * Adım 3'te bu değerler canlı bir durum katmanına taşınacak; imza aynı kalacak.
 */

const YEDEK_SAAT = "21:04";
const YEDEK_PIL = 68;

export type GorunenDurum = Required<Pick<Durum, "baglanti" | "gorsel">> & {
  saat: string;
  pil: number;
  sarjda: boolean;
};

export function gorunenDurum(sahne: Sahne, cihaz: Cihaz | null): GorunenDurum {
  const varsayilan = cihaz?.varsayilanDurum;

  return {
    baglanti: sahne.durum.baglanti,
    gorsel: sahne.durum.gorsel,
    saat: sahne.durum.saat ?? varsayilan?.saat ?? YEDEK_SAAT,
    pil: sahne.durum.pil ?? varsayilan?.pil ?? YEDEK_PIL,
    sarjda: sahne.durum.sarjda ?? varsayilan?.sarjda ?? false,
  };
}
