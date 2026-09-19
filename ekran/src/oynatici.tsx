"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { DurumSaglayici, durumEzmeleri, type Aramalar } from "@/durum";
import { SahneSaglayici } from "@/engine";
import { KutuphaneSaglayici } from "@/icerik/kutuphane";
import { ModulSec, modulGorunumu, useAktifEkran } from "@/modules";
import { HazirlikSaglayici } from "@/platform/hazirlik";
import type { Cihaz, Hesap, Icerik, Sahne, Skin } from "@/schema";
import { Kabuk, TarayiciSaglayici, gorunenDurum, skinSec, useTarayici } from "@/shell";
import { KumandaBaglantisi } from "@/kumanda/oynatici-baglantisi";
import { GizliKatman, SistemKatmani } from "@/system";

/**
 * Oynatıcının tamamı — tek bir istemci bileşeni.
 *
 * NEDEN İSTEMCİ TARAFINDA: adres çubuğu ezmeleri (`?skin=`, `?pil=` …) sunucuda
 * okunursa sayfa dinamik olur ve service worker'ın önbelleğindeki adresle
 * eşleşmez; sette parametreli bir adres AÇILMAZ. Burada okununca sayfa tamamen
 * statik kalıyor, offline da parametreli çalışıyor (CLAUDE.md §2.3).
 */
export function Oynatici({
  sahne,
  cihaz,
  hesaplar,
  icerikler,
  varliklar,
}: {
  sahne: Sahne;
  cihaz: Cihaz | null;
  hesaplar: Hesap[];
  icerikler: Icerik[];
  varliklar: string[];
}) {
  const aramaParametreleri = useSearchParams();

  const aramalar = useMemo<Aramalar>(() => {
    const o: Aramalar = {};
    for (const [anahtar, deger] of aramaParametreleri.entries()) {
      if (o[anahtar] === undefined) o[anahtar] = deger;
    }
    return o;
  }, [aramaParametreleri]);

  const skin = skinSec(aramalar.skin as string | undefined, cihaz?.skin);
  const onizleme = aramalar.onizleme === "1";
  const durum = useMemo(
    () => durumEzmeleri(aramalar, gorunenDurum(sahne, cihaz)),
    [aramalar, sahne, cihaz],
  );

  return (
    <HazirlikSaglayici varliklar={varliklar}>
      <DurumSaglayici baslangic={durum}>
        <KutuphaneSaglayici hesaplar={hesaplar} icerikler={icerikler}>
          <SahneSaglayici sahne={sahne}>
            <TarayiciSaglayici>
              <Govde skin={skin} onizleme={onizleme} cihaz={cihaz} />
            </TarayiciSaglayici>
            <KumandaBaglantisi />
          </SahneSaglayici>
        </KutuphaneSaglayici>
      </DurumSaglayici>
    </HazirlikSaglayici>
  );
}

/**
 * Kabuk ve içindekiler.
 *
 * Sahne ve tarayıcı bağlamlarının İÇİNDE durur: hangi modülün açık olduğu
 * (`useAktifEkran`) ve adres çubuğunda ne yazdığı (`useTarayici`) olaylara
 * göre değiştiği için, kabuğun da onlarla birlikte güncellenmesi gerekir.
 */
function Govde({
  skin,
  onizleme,
  cihaz,
}: {
  skin: Skin;
  onizleme: boolean;
  cihaz: Cihaz | null;
}) {
  const aktif = useAktifEkran();
  const tarayici = useTarayici();
  const gorunum = modulGorunumu(aktif.modul);

  return (
    <Kabuk
      skin={skin}
      onizleme={onizleme}
      icerikUste={gorunum.icerikUste}
      ustKatman={gorunum.ustKatman}
      adresMetni={tarayici.adres}
      sekmeBasligi={tarayici.baslik}
    >
      <ModulSec cihaz={cihaz} />
      <SistemKatmani aktifModul={aktif.modul} />
      <GizliKatman />
    </Kabuk>
  );
}
