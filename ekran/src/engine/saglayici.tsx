"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useDurum } from "@/durum";
import type { Olay, Sahne } from "@/schema";
import { Motor, type BekleyenOlay, type Kaynak, type OlayKaydi } from "./motor";

/**
 * Motoru React'e bağlar. CLAUDE.md §5
 *
 * MİMARİ: modüller "şu an ne görünüyor" diye motora sormaz; GERÇEKLEŞEN
 * OLAYLARIN listesini okur ve ekranı ondan türetir. Beğeni sayısı =
 * gerçekleşen `begeniGeldi` olaylarının sayısı, gibi.
 *
 * Bunun faydası: başa sar tek satır (liste boşalır), sahne deterministik
 * kalır (§2.4) ve hiçbir modül kendi zamanlayıcısını tutmaz.
 */

type SahneBaglami = {
  sahne: Sahne;
  /** Gerçekleşen olaylar, sırayla. Modüller ekranı bundan türetir. */
  olanlar: Olay[];
  log: readonly OlayKaydi[];
  bekleyenler: BekleyenOlay[];
  siradaki: BekleyenOlay | null;
  dokun: (hedef: string) => void;
  elleTetikle: (olayId: string) => void;
  basaSar: () => void;
  /** Gizli panelin gecikme ayarı (CLAUDE.md §6). */
  gecikmeAl: (olayId: string) => number;
  gecikmeAyarla: (olayId: string, gecikme: number) => void;
};

const Baglam = createContext<SahneBaglami | null>(null);

export function SahneSaglayici({ sahne, children }: { sahne: Sahne; children: ReactNode }) {
  const { guncelle, basaSar: durumuBasaSar } = useDurum();
  // Motor her duyuruda bunu artırır; bağlam değerinin kimliği buna bağlı,
  // yoksa gecikme ayarı gibi log'u değiştirmeyen işlemler ekrana yansımıyor.
  const [surum, yenile] = useState(0);
  const olanlarRef = useRef<Olay[]>([]);

  const motor = useMemo(() => {
    olanlarRef.current = [];

    const aksiyonUygula = (olay: Olay, _kaynak: Kaynak) => {
      olanlarRef.current = [...olanlarRef.current, olay];

      // Cihaz durumu katmanına düşen aksiyonlar (CLAUDE.md §3.1).
      // Diğerleri modüllerin kendi okuduğu `olanlar` listesinde kalır.
      const a = olay.aksiyon;
      if (a.tur === "pilDegisti") {
        guncelle(a.sarjda === undefined ? { pil: a.seviye } : { pil: a.seviye, sarjda: a.sarjda });
      } else if (a.tur === "baglantiDegisti") {
        guncelle({
          ...(a.baglanti !== undefined ? { baglanti: a.baglanti } : {}),
          ...(a.gorsel !== undefined ? { gorsel: a.gorsel } : {}),
        });
      }
    };

    return new Motor(sahne, { onAksiyon: aksiyonUygula });
  }, [sahne, guncelle]);

  useEffect(() => {
    const birak = motor.abone(() => yenile((n) => n + 1));
    motor.baslat();
    return () => {
      birak();
      motor.durdur();
    };
  }, [motor]);

  const dokun = useCallback((hedef: string) => motor.dokun(hedef), [motor]);
  const elleTetikle = useCallback((olayId: string) => motor.elleTetikle(olayId), [motor]);
  const gecikmeAl = useCallback((olayId: string) => motor.gecikmeAl(olayId), [motor]);
  const gecikmeAyarla = useCallback(
    (olayId: string, gecikme: number) => motor.gecikmeAyarla(olayId, gecikme),
    [motor],
  );

  // CLAUDE.md §6: başa sar hem olayları hem cihaz durumunu ilk haline döndürür.
  const basaSar = useCallback(() => {
    olanlarRef.current = [];
    durumuBasaSar();
    motor.basaSar();
  }, [motor, durumuBasaSar]);

  const deger = useMemo<SahneBaglami>(
    () => ({
      sahne,
      olanlar: olanlarRef.current,
      log: motor.log,
      bekleyenler: motor.bekleyenler,
      siradaki: motor.siradaki,
      dokun,
      elleTetikle,
      basaSar,
      gecikmeAl,
      gecikmeAyarla,
    }),
    // motor içeride mutasyonla değişiyor; `surum` her duyuruda artar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sahne, motor, dokun, elleTetikle, basaSar, gecikmeAl, gecikmeAyarla, surum],
  );

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useSahne(): SahneBaglami {
  const b = useContext(Baglam);
  if (b === null) throw new Error("useSahne, <SahneSaglayici> içinde çağrılmalı.");
  return b;
}
