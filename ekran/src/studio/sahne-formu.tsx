"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { AksiyonTuru, Modul, TetikTuru } from "@/schema";
import { AlanGirdisi, type Secenekler } from "./alan-girdisi";
import {
  AKSIYON_ADLARI,
  AKSIYON_ALANLARI,
  EKRANLAR,
  EKRAN_ADLARI,
  MODUL_ADLARI,
  TETIK_ADLARI,
  TETIK_ALANLARI,
  type Alan,
} from "./alanlar";
import { sahneKaydet, type KayitSonucu } from "./eylemler";
import { Alan as AlanKutusu, Dugme, GIRDI_SINIFI, Kart, Yigin } from "./panel";

/**
 * Sahne formu. CLAUDE.md §8 (Faz 4.3)
 *
 * Form serbest bir taslak tutar (alanlar yarım olabilir); KAYDEDERKEN Zod'dan
 * geçer ve hatalar Türkçe olarak şemadan gelir. Doğruluk tek yerde tanımlı.
 *
 * Arayüz sadeleştirildi: başlıklar soru cümlesi, teknik slug'lar yerine
 * okunur adlar, nadiren dokunulan cihaz durumu katlanır bir bölümde.
 */
type Taslak = Record<string, unknown>;

function varsayilanlar(alanlar: readonly Alan[]): Taslak {
  const o: Taslak = {};
  for (const a of alanlar) if (a.varsayilan !== undefined) o[a.ad] = a.varsayilan;
  return o;
}

const BOS_SAHNE: Taslak = {
  kod: "",
  cihaz: "",
  baslangic: { modul: "kilit", ekran: "kilit" },
  durum: { baglanti: "normal", gorsel: "normal" },
  olaylar: [],
  talimat: "",
};

export function SahneFormu({
  baslangicTaslak,
  secenekler,
  yeniMi,
}: {
  /**
   * Formun açılış hali. Geçerli bir sahne olmak ZORUNDA DEĞİL: şablondan
   * gelen taslakların içerik referansları boştur, kullanıcı doldurur.
   */
  baslangicTaslak: Record<string, unknown> | null;
  secenekler: Secenekler;
  yeniMi: boolean;
}) {
  const router = useRouter();
  const [bekliyor, basla] = useTransition();
  const [sonuc, setSonuc] = useState<KayitSonucu | null>(null);
  const [gelismis, setGelismis] = useState(false);

  const [sahne, setSahne] = useState<Taslak>(() =>
    baslangicTaslak === null ? structuredClone(BOS_SAHNE) : structuredClone(baslangicTaslak),
  );

  const yaz = (yol: string[], deger: unknown) => {
    setSahne((onceki) => {
      const kopya = structuredClone(onceki) as Taslak;
      let hedef = kopya as Record<string, unknown>;
      for (const parca of yol.slice(0, -1)) {
        hedef[parca] ??= {};
        hedef = hedef[parca] as Record<string, unknown>;
      }
      const son = yol.at(-1)!;
      if (deger === undefined) delete hedef[son];
      else hedef[son] = deger;
      return kopya;
    });
  };

  const baslangic = (sahne.baslangic as Taslak | undefined) ?? {};
  const durum = (sahne.durum as Taslak | undefined) ?? {};
  const olaylar = (sahne.olaylar as Taslak[] | undefined) ?? [];
  const modul = String(baslangic.modul ?? "kilit") as Modul;

  const olayYaz = (i: number, guncelle: (o: Taslak) => Taslak) =>
    setSahne((onceki) => {
      const kopya = structuredClone(onceki) as Taslak;
      const liste = [...((kopya.olaylar as Taslak[] | undefined) ?? [])];
      liste[i] = guncelle(liste[i] ?? {});
      kopya.olaylar = liste;
      return kopya;
    });

  const olayListesi = (islem: (liste: Taslak[]) => Taslak[]) =>
    setSahne((onceki) => {
      const kopya = structuredClone(onceki) as Taslak;
      kopya.olaylar = islem([...((kopya.olaylar as Taslak[] | undefined) ?? [])]);
      return kopya;
    });

  const kaydet = () => {
    setSonuc(null);
    basla(async () => {
      const cevap = await sahneKaydet(sahne);
      setSonuc(cevap);
      if (cevap.ok) router.push(`/studio/${cevap.kod}`);
      else window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });
  };

  const hataAlani = (yol: string): string | null => {
    if (sonuc === null || sonuc.ok) return null;
    return sonuc.hatalar.find((h) => h.yol === yol)?.mesaj ?? null;
  };

  return (
    <Yigin>
      <Kart baslik="Sahne nerede geçiyor?">
        <div className="grid gap-4 sm:grid-cols-2">
          <AlanKutusu
            etiket="Sahne kodu"
            zorunlu
            hata={hataAlani("kod")}
            ipucu={
              yeniMi ? "Örnek: eg-b03-s58 (dizi-bölüm-sahne)" : "Değiştirilemez; sete giden link buna bağlı."
            }
          >
            <input
              value={String(sahne.kod ?? "")}
              onChange={(e) => yaz(["kod"], e.target.value)}
              disabled={!yeniMi}
              placeholder="eg-b03-s58"
              className={`${GIRDI_SINIFI} font-mono ${yeniMi ? "" : "bg-[#f5f5f7] text-[#8e8e93]"}`}
            />
          </AlanKutusu>

          <AlanKutusu etiket="Hangi cihaz?" zorunlu hata={hataAlani("cihaz")}>
            <select
              value={String(sahne.cihaz ?? "")}
              onChange={(e) => yaz(["cihaz"], e.target.value)}
              className={GIRDI_SINIFI}
            >
              <option value="">Seçin…</option>
              {secenekler.cihaz.map((c) => (
                <option key={c.deger} value={c.deger}>
                  {c.etiket}
                </option>
              ))}
            </select>
          </AlanKutusu>

          <AlanKutusu etiket="Sahne hangi uygulamayla açılsın?" zorunlu>
            <select
              value={modul}
              onChange={(e) => {
                const yeni = e.target.value as Modul;
                yaz(["baslangic", "modul"], yeni);
                yaz(["baslangic", "ekran"], EKRANLAR[yeni][0] ?? "");
              }}
              className={GIRDI_SINIFI}
            >
              {secenekler.modul.map((m) => (
                <option key={m.deger} value={m.deger}>
                  {MODUL_ADLARI[m.deger as Modul] ?? m.etiket}
                </option>
              ))}
            </select>
          </AlanKutusu>

          <AlanKutusu etiket="Hangi ekranda başlasın?" zorunlu hata={hataAlani("baslangic.ekran")}>
            <select
              value={String(baslangic.ekran ?? "")}
              onChange={(e) => yaz(["baslangic", "ekran"], e.target.value)}
              className={GIRDI_SINIFI}
            >
              {(EKRANLAR[modul] ?? []).map((e) => (
                <option key={e} value={e}>
                  {EKRAN_ADLARI[e] ?? e}
                </option>
              ))}
            </select>
          </AlanKutusu>

          <AlanKutusu etiket="Kimin hesabı? (gerekiyorsa)">
            <select
              value={String(baslangic.hesap ?? "")}
              onChange={(e) =>
                yaz(["baslangic", "hesap"], e.target.value === "" ? undefined : e.target.value)
              }
              className={GIRDI_SINIFI}
            >
              <option value="">—</option>
              {secenekler.hesap.map((h) => (
                <option key={h.deger} value={h.deger}>
                  {h.etiket}
                </option>
              ))}
            </select>
          </AlanKutusu>

          <AlanKutusu
            etiket="Hangi içerik açılsın? (gerekiyorsa)"
            ipucu="Sohbet, post, arama sonucu, site, konum ya da fotoğraf."
          >
            <select
              value={String(baslangic.icerikRef ?? "")}
              onChange={(e) =>
                yaz(["baslangic", "icerikRef"], e.target.value === "" ? undefined : e.target.value)
              }
              className={GIRDI_SINIFI}
            >
              <option value="">—</option>
              {secenekler.icerik.map((i) => (
                <option key={i.deger} value={i.deger}>
                  {i.etiket}
                </option>
              ))}
            </select>
          </AlanKutusu>
        </div>

        <div className="mt-4">
          <AlanKutusu
            etiket="Sete gidecek talimat"
            zorunlu
            hata={hataAlani("talimat")}
            ipucu="Teslim paketinde “NE OLACAK” başlığı altında aynen çıkar."
          >
            <textarea
              value={String(sahne.talimat ?? "")}
              rows={3}
              onChange={(e) => yaz(["talimat"], e.target.value)}
              placeholder="Telefon kilitli, masada duruyor. 2,5 sn sonra bildirim düşer…"
              className={GIRDI_SINIFI}
            />
          </AlanKutusu>
        </div>
      </Kart>

      <Kart
        baslik="Sahnede neler oluyor?"
        aciklama={
          olaylar.length === 0
            ? "Henüz olay yok. Olaylar sahnenin akışıdır: bildirim düşer, telefon çalar, mesaj gelir."
            : `${olaylar.length} olay, sırayla`
        }
        sag={
          <Dugme
            tur="birincil"
            kucuk
            onClick={() =>
              olayListesi((liste) => [
                ...liste,
                {
                  id: "",
                  ad: "",
                  tetik: { tur: "baslangic", ...varsayilanlar(TETIK_ALANLARI.baslangic) },
                  aksiyon: { tur: "bildirim" },
                },
              ])
            }
          >
            Olay ekle
          </Dugme>
        }
      >
        {olaylar.length > 0 && (
          <div className="flex flex-col gap-3">
            {olaylar.map((olay, i) => (
              <OlayKarti
                key={i}
                sira={i}
                toplam={olaylar.length}
                olay={olay}
                secenekler={secenekler}
                hata={(yol) => hataAlani(`olaylar.${i}.${yol}`)}
                degistir={(g) => olayYaz(i, g)}
                sil={() => olayListesi((l) => l.filter((_, j) => j !== i))}
                tasi={(yon) =>
                  olayListesi((l) => {
                    const hedef = i + yon;
                    if (hedef < 0 || hedef >= l.length) return l;
                    const kopya = [...l];
                    [kopya[i], kopya[hedef]] = [kopya[hedef]!, kopya[i]!];
                    return kopya;
                  })
                }
              />
            ))}
          </div>
        )}
      </Kart>

      <Kart
        baslik="Cihazın hali"
        aciklama="Saat, pil, bağlantı. Çoğu sahnede dokunmaya gerek yok."
        sag={
          <Dugme tur="sessiz" kucuk onClick={() => setGelismis((x) => !x)}>
            {gelismis ? "Gizle" : "Göster"}
          </Dugme>
        }
      >
        {gelismis && (
          <div className="grid gap-4 sm:grid-cols-3">
            <AlanKutusu etiket="Saat">
              <input
                value={String(durum.saat ?? "")}
                onChange={(e) =>
                  yaz(["durum", "saat"], e.target.value === "" ? undefined : e.target.value)
                }
                placeholder="23:41"
                className={GIRDI_SINIFI}
              />
            </AlanKutusu>
            <AlanKutusu etiket="Tarih (kilit ekranı)">
              <input
                value={String(durum.tarih ?? "")}
                onChange={(e) =>
                  yaz(["durum", "tarih"], e.target.value === "" ? undefined : e.target.value)
                }
                placeholder="18 Eylül Perşembe"
                className={GIRDI_SINIFI}
              />
            </AlanKutusu>
            <AlanKutusu etiket="Pil %">
              <input
                type="number"
                min={0}
                max={100}
                value={String(durum.pil ?? "")}
                onChange={(e) =>
                  yaz(["durum", "pil"], e.target.value === "" ? undefined : Number(e.target.value))
                }
                className={GIRDI_SINIFI}
              />
            </AlanKutusu>
            <AlanKutusu etiket="Bağlantı">
              <select
                value={String(durum.baglanti ?? "normal")}
                onChange={(e) => yaz(["durum", "baglanti"], e.target.value)}
                className={GIRDI_SINIFI}
              >
                <option value="normal">Normal</option>
                <option value="yavas">Yavaş</option>
                <option value="yok">Yok</option>
              </select>
            </AlanKutusu>
            <AlanKutusu etiket="Görseller">
              <select
                value={String(durum.gorsel ?? "normal")}
                onChange={(e) => yaz(["durum", "gorsel"], e.target.value)}
                className={GIRDI_SINIFI}
              >
                <option value="normal">Normal yüklenir</option>
                <option value="gec">Geç yüklenir</option>
                <option value="yuklenmez">Hiç yüklenmez</option>
              </select>
            </AlanKutusu>
            <label className="flex items-end gap-[9px] pb-[10px] text-[13px] text-[#1d1d1f]">
              <input
                type="checkbox"
                checked={durum.sarjda === true}
                onChange={(e) => yaz(["durum", "sarjda"], e.target.checked ? true : undefined)}
                className="h-[15px] w-[15px] accent-[#0071e3]"
              />
              Şarjda
            </label>
          </div>
        )}
      </Kart>

      {sonuc !== null && !sonuc.ok && (
        <Kart vurgu="kirmizi" baslik="Kaydedilemedi" aciklama="Şunları düzeltin:">
          <ul className="flex list-disc flex-col gap-[6px] pl-5">
            {sonuc.hatalar.map((h, i) => (
              <li key={i} className="text-[13px] text-[#8c2820]">
                {h.mesaj}
              </li>
            ))}
          </ul>
        </Kart>
      )}

      <div className="sticky bottom-4 flex items-center gap-3 rounded-full border border-[#e4e4e7] bg-white/95 px-4 py-[10px] shadow-[0_2px_14px_rgba(0,0,0,0.07)] backdrop-blur">
        <Dugme tur="birincil" disabled={bekliyor} onClick={kaydet}>
          {bekliyor ? "Kaydediliyor…" : "Kaydet"}
        </Dugme>
        <span className="text-[12px] text-[#8e8e93]">
          Kaydedince sahne linki kendiliğinden güncellenir.
        </span>
      </div>
    </Yigin>
  );
}

/** Tek olay: “ne zaman” ve “ne olsun” yan yana. */
function OlayKarti({
  sira,
  toplam,
  olay,
  secenekler,
  hata,
  degistir,
  sil,
  tasi,
}: {
  sira: number;
  toplam: number;
  olay: Taslak;
  secenekler: Secenekler;
  hata: (yol: string) => string | null;
  degistir: (g: (o: Taslak) => Taslak) => void;
  sil: () => void;
  tasi: (yon: -1 | 1) => void;
}) {
  const tetik = (olay.tetik as Taslak | undefined) ?? { tur: "elle" };
  const aksiyon = (olay.aksiyon as Taslak | undefined) ?? { tur: "bildirim" };
  const tetikTuru = String(tetik.tur ?? "elle") as TetikTuru;
  const aksiyonTuru = String(aksiyon.tur ?? "bildirim") as AksiyonTuru;

  return (
    <div className="rounded-[14px] border border-[#e8e8ec] bg-[#fbfbfd]">
      <div className="flex items-center gap-2 px-4 pt-3">
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#eeeef0] text-[11px] font-semibold text-[#6e6e73]">
          {sira + 1}
        </span>
        <input
          value={String(olay.ad ?? "")}
          onChange={(e) => degistir((o) => ({ ...o, ad: e.target.value }))}
          placeholder="Olayın adı — kumandada bu görünür"
          className="min-w-0 flex-1 rounded-[8px] border border-transparent bg-transparent px-2 py-1 text-[14px] font-medium text-[#1d1d1f] outline-none placeholder:font-normal placeholder:text-[#b4b4b8] focus:border-[#d8d8dc] focus:bg-white"
        />
        <button
          onClick={() => tasi(-1)}
          disabled={sira === 0}
          aria-label="Yukarı taşı"
          className="px-[6px] text-[14px] text-[#8e8e93] disabled:opacity-25"
        >
          ↑
        </button>
        <button
          onClick={() => tasi(1)}
          disabled={sira === toplam - 1}
          aria-label="Aşağı taşı"
          className="px-[6px] text-[14px] text-[#8e8e93] disabled:opacity-25"
        >
          ↓
        </button>
        <button
          onClick={sil}
          aria-label="Olayı sil"
          className="rounded-full px-[9px] py-[3px] text-[12px] font-medium text-[#c7392e] hover:bg-[#fdf0ef]"
        >
          Sil
        </button>
      </div>

      {(hata("ad") !== null || hata("id") !== null) && (
        <p className="px-4 pt-2 text-[12px] font-medium text-[#c7392e]">
          {hata("ad") ?? hata("id")}
        </p>
      )}

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <Bolme etiket="NE ZAMAN">
          <select
            value={tetikTuru}
            onChange={(e) => {
              const yeni = e.target.value as TetikTuru;
              degistir((o) => ({
                ...o,
                tetik: { tur: yeni, ...varsayilanlar(TETIK_ALANLARI[yeni]) },
              }));
            }}
            className={`${GIRDI_SINIFI} font-medium`}
          >
            {Object.entries(TETIK_ADLARI).map(([deger, etiket]) => (
              <option key={deger} value={deger}>
                {etiket}
              </option>
            ))}
          </select>
          {TETIK_ALANLARI[tetikTuru].map((alan) => (
            <AlanGirdisi
              key={alan.ad}
              alan={alan}
              deger={tetik[alan.ad]}
              secenekler={secenekler}
              degistir={(yeni) =>
                degistir((o) => ({ ...o, tetik: { ...(o.tetik as Taslak), [alan.ad]: yeni } }))
              }
            />
          ))}
        </Bolme>

        <Bolme etiket="NE OLSUN">
          <select
            value={aksiyonTuru}
            onChange={(e) => {
              const yeni = e.target.value as AksiyonTuru;
              degistir((o) => ({
                ...o,
                aksiyon: { tur: yeni, ...varsayilanlar(AKSIYON_ALANLARI[yeni]) },
              }));
            }}
            className={`${GIRDI_SINIFI} font-medium`}
          >
            {Object.entries(AKSIYON_ADLARI).map(([deger, etiket]) => (
              <option key={deger} value={deger}>
                {etiket}
              </option>
            ))}
          </select>
          {AKSIYON_ALANLARI[aksiyonTuru].map((alan) => (
            <AlanGirdisi
              key={alan.ad}
              alan={alan}
              deger={aksiyon[alan.ad]}
              secenekler={secenekler}
              degistir={(yeni) =>
                degistir((o) => ({ ...o, aksiyon: { ...(o.aksiyon as Taslak), [alan.ad]: yeni } }))
              }
            />
          ))}
        </Bolme>
      </div>

      <div className="px-4 pb-4">
        <AlanKutusu etiket="Kimlik" zorunlu ipucu="Kısa ve benzersiz: ilk-mesaj, sezai-arar">
          <input
            value={String(olay.id ?? "")}
            onChange={(e) => degistir((o) => ({ ...o, id: e.target.value }))}
            placeholder="ilk-mesaj"
            className={`${GIRDI_SINIFI} font-mono text-[13px]`}
          />
        </AlanKutusu>
      </div>
    </div>
  );
}

function Bolme({ etiket, children }: { etiket: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-[11px] bg-white p-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8e8e93]">
        {etiket}
      </span>
      {children}
    </div>
  );
}
