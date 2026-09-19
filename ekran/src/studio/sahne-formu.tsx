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
import { alanKimligi, hatalariDuzenle, type FormHatasi } from "./hatalar";
import { addanKimlik, benzersizKimlik, kimlikBitir, kimlikYaz } from "./kimlik";
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

/**
 * Kimlik hâlâ addan mı türüyor?
 *
 * Kullanıcı kimliği elle değiştirdiyse ad değişince ona DOKUNULMAZ. Durumu
 * ayrı bir bayrakta tutmak yerine buradan anlıyoruz: kimlik, eski adın
 * türevi (ya da çakışma yüzünden -2'li hali) ise otomatiktir.
 */
function kimlikOtomatikMi(kimlik: string, ad: string): boolean {
  if (kimlik === "") return true;
  const taban = addanKimlik(ad);
  if (taban === "") return false;
  return kimlik === taban || new RegExp(`^${taban}-\\d+$`).test(kimlik);
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

  /**
   * Bir olayın kimliğini değiştirir ve ONA BAĞLI ZİNCİRLERİ günceller.
   *
   * "Şu olaydan sonra" tetikleri kimliğe göre bağlanıyor; kimlik değişince
   * referanslar güncellenmezse sahne sessizce kopardı ve bunu ancak sette
   * fark ederdik.
   */
  const kimlikAta = (i: number, yeniKimlik: string) =>
    setSahne((onceki) => {
      const kopya = structuredClone(onceki) as Taslak;
      const liste = [...((kopya.olaylar as Taslak[] | undefined) ?? [])];
      const eski = String(liste[i]?.id ?? "");
      if (eski === yeniKimlik) return onceki;

      liste[i] = { ...(liste[i] ?? {}), id: yeniKimlik };

      if (eski !== "") {
        for (let j = 0; j < liste.length; j++) {
          const tetik = liste[j]?.tetik as Taslak | undefined;
          if (tetik?.tur === "sonra" && tetik.olayId === eski) {
            liste[j] = { ...(liste[j] ?? {}), tetik: { ...tetik, olayId: yeniKimlik } };
          }
        }
      }

      kopya.olaylar = liste;
      return kopya;
    });

  /**
   * Olayın adı değişince kimliği de takip eder — kullanıcı kimliği elle
   * değiştirmediyse. Sette telefondan sahne kuran kimse kimlik yazmakla
   * uğraşmamalı.
   */
  const adDegistir = (i: number, yeniAd: string) =>
    setSahne((onceki) => {
      const kopya = structuredClone(onceki) as Taslak;
      const liste = [...((kopya.olaylar as Taslak[] | undefined) ?? [])];
      const olay = liste[i] ?? {};
      const eskiAd = String(olay.ad ?? "");
      const eskiKimlik = String(olay.id ?? "");

      liste[i] = { ...olay, ad: yeniAd };

      if (kimlikOtomatikMi(eskiKimlik, eskiAd)) {
        const baskalari = liste.flatMap((o, j) => (j === i ? [] : [String(o?.id ?? "")]));
        const yeniKimlik = benzersizKimlik(addanKimlik(yeniAd), baskalari);
        if (yeniKimlik !== eskiKimlik) {
          liste[i] = { ...liste[i], id: yeniKimlik };
          if (eskiKimlik !== "") {
            for (let j = 0; j < liste.length; j++) {
              const tetik = liste[j]?.tetik as Taslak | undefined;
              if (tetik?.tur === "sonra" && tetik.olayId === eskiKimlik) {
                liste[j] = { ...(liste[j] ?? {}), tetik: { ...tetik, olayId: yeniKimlik } };
              }
            }
          }
        }
      }

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

  const hatalar: FormHatasi[] =
    sonuc === null || sonuc.ok ? [] : hatalariDuzenle(sonuc.hatalar, sahne);

  const hataAlani = (yol: string): string | null =>
    hatalar.find((h) => h.yol === yol)?.mesaj ?? null;

  const hataylaGit = (yol: string) => {
    if (yol === "") return;
    const dugum = document.getElementById(alanKimligi(yol));
    if (dugum === null) return;
    dugum.scrollIntoView({ behavior: "smooth", block: "center" });
    dugum.querySelector<HTMLElement>("input, textarea, select")?.focus({ preventScroll: true });
  };

  return (
    <Yigin>
      <Kart baslik="Sahne nerede geçiyor?">
        <div className="grid gap-4 sm:grid-cols-2">
          <AlanKutusu
            etiket="Sahne kodu"
            alanId={alanKimligi("kod")}
            zorunlu
            hata={hataAlani("kod")}
            ipucu={
              yeniMi ? "Örnek: eg-b03-s58 (dizi-bölüm-sahne)" : "Değiştirilemez; sete giden link buna bağlı."
            }
          >
            <input
              value={String(sahne.kod ?? "")}
              onChange={(e) => yaz(["kod"], kimlikYaz(e.target.value))}
              onBlur={(e) => yaz(["kod"], kimlikBitir(e.target.value))}
              disabled={!yeniMi}
              placeholder="eg-b03-s58"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              className={`${GIRDI_SINIFI} font-mono ${yeniMi ? "" : "bg-[#f5f5f7] text-[#8e8e93]"}`}
            />
          </AlanKutusu>

          <AlanKutusu etiket="Hangi cihaz?" alanId={alanKimligi("cihaz")} zorunlu hata={hataAlani("cihaz")}>
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
            alanId={alanKimligi("talimat")}
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
                olaylar={olaylar}
                adDegistir={(yeni) => adDegistir(i, yeni)}
                kimlikAta={(yeni) => kimlikAta(i, yeni)}
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

      {hatalar.length > 0 && (
        <Kart
          vurgu="kirmizi"
          baslik="Kaydedilemedi"
          aciklama="Üstüne tıklayınca ilgili alana gider."
        >
          <ul className="flex flex-col gap-[2px]">
            {hatalar.map((h, i) => (
              <li key={i}>
                <button
                  onClick={() => hataylaGit(h.yol)}
                  className="w-full rounded-[8px] px-2 py-[6px] text-left text-[13px] text-[#8c2820] transition-colors hover:bg-[#f9e6e3]"
                >
                  <span className="font-semibold">{h.baslik}</span>
                  <span className="mx-[6px] opacity-45">—</span>
                  {h.mesaj}
                </button>
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
  olaylar,
  adDegistir,
  kimlikAta,
  secenekler,
  hata,
  degistir,
  sil,
  tasi,
}: {
  sira: number;
  toplam: number;
  olay: Taslak;
  olaylar: Taslak[];
  adDegistir: (yeniAd: string) => void;
  kimlikAta: (yeniKimlik: string) => void;
  secenekler: Secenekler;
  hata: (yol: string) => string | null;
  degistir: (g: (o: Taslak) => Taslak) => void;
  sil: () => void;
  tasi: (yon: -1 | 1) => void;
}) {
  const [kimlikAcik, setKimlikAcik] = useState(false);
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
          onChange={(e) => adDegistir(e.target.value)}
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
          {TETIK_ALANLARI[tetikTuru].map((alan) =>
            // Hangi olaydan sonra? Kimlik elle yazılmaz, listeden seçilir;
            // yanlış yazılan bir kimlik zinciri sessizce koparıyordu.
            alan.ad === "olayId" ? (
              <AlanKutusu
                key={alan.ad}
                etiket={alan.etiket}
                zorunlu
                alanId={alanKimligi(`olaylar.${sira}.tetik.olayId`)}
                hata={hata("tetik.olayId")}
              >
                <select
                  value={String(tetik.olayId ?? "")}
                  onChange={(e) =>
                    degistir((o) => ({
                      ...o,
                      tetik: {
                        ...(o.tetik as Taslak),
                        olayId: e.target.value === "" ? undefined : e.target.value,
                      },
                    }))
                  }
                  className={GIRDI_SINIFI}
                >
                  <option value="">Seçin…</option>
                  {olaylar.map((o, j) => {
                    const kimlik = String(o?.id ?? "");
                    if (j === sira || kimlik === "") return null;
                    const ad = String(o?.ad ?? "").trim();
                    return (
                      <option key={kimlik} value={kimlik}>
                        {j + 1}. {ad === "" ? kimlik : ad}
                      </option>
                    );
                  })}
                </select>
              </AlanKutusu>
            ) : (
              <AlanGirdisi
                key={alan.ad}
                alan={alan}
                deger={tetik[alan.ad]}
                secenekler={secenekler}
                alanId={alanKimligi(`olaylar.${sira}.tetik.${alan.ad}`)}
                hata={hata(`tetik.${alan.ad}`)}
                degistir={(yeni) =>
                  degistir((o) => ({ ...o, tetik: { ...(o.tetik as Taslak), [alan.ad]: yeni } }))
                }
              />
            ),
          )}
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
              alanId={alanKimligi(`olaylar.${sira}.aksiyon.${alan.ad}`)}
              hata={hata(`aksiyon.${alan.ad}`)}
              degistir={(yeni) =>
                degistir((o) => ({ ...o, aksiyon: { ...(o.aksiyon as Taslak), [alan.ad]: yeni } }))
              }
            />
          ))}
        </Bolme>
      </div>

      {/* Kimlik addan türüyor; normalde gösterilmiyor. Sette telefondan sahne
          düzenleyen kimse bununla uğraşmamalı. */}
      <div className="px-4 pb-4" id={alanKimligi(`olaylar.${sira}.id`)}>
        {kimlikAcik ? (
          <AlanKutusu
            etiket="Kimlik"
            zorunlu
            hata={hata("id")}
            ipucu="Adı değiştirince kimlik de değişir. Elle değiştirirseniz sabit kalır."
          >
            <input
              value={String(olay.id ?? "")}
              onChange={(e) => kimlikAta(kimlikYaz(e.target.value))}
              onBlur={(e) => kimlikAta(kimlikBitir(e.target.value))}
              placeholder="ilk-mesaj"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              className={`${GIRDI_SINIFI} font-mono text-[13px]`}
            />
          </AlanKutusu>
        ) : (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] text-[#8e8e93]">
              Kimlik: <span className="font-mono">{String(olay.id ?? "—")}</span>
            </span>
            <button
              onClick={() => setKimlikAcik(true)}
              className="text-[11px] font-medium text-[#0071e3]"
            >
              değiştir
            </button>
            {hata("id") !== null && (
              <span className="text-[11px] font-medium text-[#c7392e]">{hata("id")}</span>
            )}
          </div>
        )}
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
