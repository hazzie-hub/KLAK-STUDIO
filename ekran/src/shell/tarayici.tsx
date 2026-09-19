"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Kurgusal tarayıcının adres çubuğu. CLAUDE.md §3.1
 *
 * `web` modülü açtığı sayfanın adresini ve sekme başlığını buraya yazar;
 * desktop kabuğundaki pencere çerçevesi bunu gösterir. Modül kabuğa doğrudan
 * prop geçemez (kabuğun İÇİNDE çizilir), bu yüzden araya bu katman girer.
 */
export type TarayiciDurumu = {
  adres?: string;
  baslik?: string;
};

type Baglam = TarayiciDurumu & {
  ayarla: (durum: TarayiciDurumu) => void;
};

const TarayiciBaglami = createContext<Baglam>({ ayarla: () => {} });

export function TarayiciSaglayici({ children }: { children: ReactNode }) {
  const [durum, setDurum] = useState<TarayiciDurumu>({});

  const deger = useMemo<Baglam>(
    () => ({
      ...durum,
      ayarla: (yeni) =>
        // Aynı değerle tekrar çağrılırsa yeniden çizim yapma — modüller bunu
        // her render'da çağırabilir.
        setDurum((onceki) =>
          onceki.adres === yeni.adres && onceki.baslik === yeni.baslik ? onceki : yeni,
        ),
    }),
    [durum],
  );

  return <TarayiciBaglami.Provider value={deger}>{children}</TarayiciBaglami.Provider>;
}

export function useTarayici(): Baglam {
  return useContext(TarayiciBaglami);
}
