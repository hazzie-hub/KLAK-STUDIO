"use client";

import { useEffect, useRef } from "react";

import { useDurum } from "@/durum";
import { useSahne } from "@/engine";
import { kanalAc, type Kanal } from "./kanal";
import { NonceDefteri, nonceUret, type KumandaMesaji } from "./mesaj";

/** Oynatıcı kaç saniyede bir "buradayım" der. */
const YOKLAMA_ARALIGI = 2000;

/**
 * Oynatıcının kumanda bağlantısı. CLAUDE.md §6
 *
 * Gelen komutları uygular ve durumunu yayınlar. BAĞLANTI KOPARSA HİÇBİR ŞEY
 * KİLİTLENMEZ: sahne süreli tetikleriyle oynamaya devam eder, bu bileşen
 * sadece susar.
 */
export function KumandaBaglantisi() {
  const { sahne, elleTetikle, basaSar, gecikmeAyarla, gecikmeAl, olanlar, siradaki, gecen } =
    useSahne();
  const { durum, guncelle } = useDurum();

  // Etkiler yeniden kurulmasın diye güncel değerleri ref'te tutuyoruz.
  const islemlerRef = useRef({ elleTetikle, basaSar, gecikmeAyarla, guncelle });
  islemlerRef.current = { elleTetikle, basaSar, gecikmeAyarla, guncelle };

  const durumRef = useRef({ olanlar, siradaki, gecen, gecikmeAl, pil: durum.pil });
  durumRef.current = { olanlar, siradaki, gecen, gecikmeAl, pil: durum.pil };

  const kanalRef = useRef<Kanal | null>(null);

  useEffect(() => {
    const defter = new NonceDefteri();

    const kanal = kanalAc({
      sahneKodu: sahne.kod,
      onMesaj: (mesaj) => {
        // İdempotans: aynı mesaj iki kez gelirse ikincisi yok sayılır.
        if (!defter.yeniMi(mesaj.nonce)) return;
        const { elleTetikle: tetikle, basaSar: sar, gecikmeAyarla: ayarla, guncelle: g } =
          islemlerRef.current;

        switch (mesaj.tur) {
          case "tetikle":
            tetikle(mesaj.olayId);
            break;
          case "basaSar":
            sar();
            break;
          case "gecikme":
            ayarla(mesaj.olayId, mesaj.gecikme);
            break;
          case "durum":
            g({
              ...(mesaj.baglanti !== undefined ? { baglanti: mesaj.baglanti } : {}),
              ...(mesaj.gorsel !== undefined ? { gorsel: mesaj.gorsel } : {}),
              ...(mesaj.pil !== undefined ? { pil: mesaj.pil } : {}),
              ...(mesaj.sarjda !== undefined ? { sarjda: mesaj.sarjda } : {}),
            });
            break;
          case "yoklama":
            yayinla();
            break;
          default:
            break;
        }
      },
    });
    kanalRef.current = kanal;

    function yayinla(): void {
      const d = durumRef.current;
      const sira = d.siradaki;
      kanal.gonder({
        tur: "buradayim",
        sahneKodu: sahne.kod,
        olanlar: d.olanlar.map((o) => o.id),
        siradaki:
          sira === null
            ? null
            : { olayId: sira.olayId, kalan: Math.max(0, Math.round(sira.hedefZaman - d.gecen())) },
        gecikmeler: Object.fromEntries(sahne.olaylar.map((o) => [o.id, d.gecikmeAl(o.id)])),
        pil: d.pil,
        nonce: nonceUret(),
        zaman: Date.now(),
      } satisfies KumandaMesaji);
    }

    yayinla();
    const zamanlayici = setInterval(yayinla, YOKLAMA_ARALIGI);

    return () => {
      clearInterval(zamanlayici);
      kanal.kapat();
      kanalRef.current = null;
    };
  }, [sahne.kod]);

  return null;
}
