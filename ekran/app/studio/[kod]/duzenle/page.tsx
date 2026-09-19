import { sahneGetir } from "@/icerik/kaynak";
import { sahneDurumu } from "@/icerik/yazma";
import { Kart, Panel, PanelUst, Yigin } from "@/studio/panel";
import { SahneFormu } from "@/studio/sahne-formu";
import { secenekleriTopla } from "@/studio/secenekler";

export const dynamic = "force-dynamic";

export default async function SahneDuzenleSayfasi({
  params,
}: {
  params: Promise<{ kod: string }>;
}) {
  const { kod } = await params;
  const [sahne, secenekler] = await Promise.all([sahneGetir(kod), secenekleriTopla()]);

  let kilitli = false;
  try {
    kilitli = (await sahneDurumu(kod)).kilitli;
  } catch {
    kilitli = false;
  }

  return (
    <Panel>
      <PanelUst
        geri={`/studio/${kod}`}
        geriEtiketi="Teslim paketi"
        baslik="Sahneyi düzenle"
        aciklama={kod}
      />
      {sahne === null ? (
        <Kart>
          <p className="text-[14px] text-[#48484a]">Böyle bir sahne yok.</p>
        </Kart>
      ) : (
        <Yigin>
          {kilitli && (
            <Kart vurgu="yesil" baslik="Bu sahne onaylandı">
              <p className="text-[13px] leading-relaxed text-[#1d6b3f]">
                Kilitli sahne kaydedilemez. Değiştirmek için teslim paketi sayfasından{" "}
                <strong>yeni versiyon</strong> açın; önceki hali arşivde kalır, link değişmez.
              </p>
            </Kart>
          )}
          <SahneFormu
            baslangicTaslak={sahne as unknown as Record<string, unknown>}
            secenekler={secenekler}
            yeniMi={false}
          />
        </Yigin>
      )}
    </Panel>
  );
}
