import { Medya } from "@/shared/medya";

/**
 * GEÇİCİ yer tutucu. Gerçek modüller Adım 5 (`kilit`) ve Adım 7 (`sosyal`) ile gelecek.
 *
 * Şimdilik medya bileşenini gözle sınayabilmek için birkaç görsel diziyor:
 * `?gorsel=gec` ve `?gorsel=yuklenmez` ile davranışı burada görülebilir.
 */
const ORNEKLER = [
  { kaynak: "/ornek/cicekci.svg", alt: "Çiçekçi tezgâhı" },
  { kaynak: "/ornek/sokak.svg", alt: "Sokak" },
  { kaynak: "/ornek/masa.svg", alt: "Masa" },
  { kaynak: "/ornek/deniz.svg", alt: "Deniz" },
];

export function YerTutucu({ modul, ekran }: { modul: string; ekran: string }) {
  return (
    <div className="h-full w-full overflow-auto" style={{ background: "var(--zemin)" }}>
      <div
        className="px-4 py-3 text-[12px]"
        style={{ color: "var(--metin-soluk)", borderBottom: "1px solid var(--ayrac)" }}
      >
        {modul} · {ekran} — modül burada açılacak
      </div>

      <div className="grid grid-cols-2 gap-[2px] p-[2px]">
        {ORNEKLER.map((o) => (
          <Medya
            key={o.kaynak}
            kaynak={o.kaynak}
            alt={o.alt}
            className="w-full"
            style={{ aspectRatio: "1 / 1", color: "var(--metin)" }}
          />
        ))}
      </div>
    </div>
  );
}
