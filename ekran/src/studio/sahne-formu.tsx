"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { AksiyonTuru, TetikTuru } from "@/schema";
import { AlanGirdisi, type Secenekler } from "./alan-girdisi";
import {
  AKSIYON_ADLARI,
  AKSIYON_ALANLARI,
  TETIK_ADLARI,
  TETIK_ALANLARI,
  type Alan,
} from "./alanlar";
import { sahneKaydet, type KayitSonucu } from "./eylemler";

/**
 * Sahne formu. CLAUDE.md §8 (Faz 4.3)
 *
 * Amaç: sahneyi JSON yazmadan kurmak. Form serbest bir taslak tutar (alanlar
 * yarım olabilir); KAYDEDERKEN Zod'dan geçer ve hatalar Türkçe olarak
 * şemadan gelir. Böylece doğruluk tek yerde tanımlı kalır.
 */
type Taslak = Record<string, unknown>;

function bosOlaylar(): Taslak[] {
  return [];
}

function varsayilanlar(alanlar: readonly Alan[]): Taslak {
  const o: Taslak = {};
  for (const a of alanlar) if (a.varsayilan !== undefined) o[a.ad] = a.varsayilan;
  return o;
}

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

  const [sahne, setSahne] = useState<Taslak>(() =>
    baslangicTaslak === null
      ? {
          kod: "",
          cihaz: "",
          baslangic: { modul: "kilit", ekran: "kilit" },
          durum: { baglanti: "normal", gorsel: "normal" },
          olaylar: bosOlaylar(),
          talimat: "",
        }
      : structuredClone(baslangicTaslak),
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

  const olaylar = (sahne.olaylar as Taslak[] | undefined) ?? [];

  const olayYaz = (i: number, guncelle: (o: Taslak) => Taslak) => {
    setSahne((onceki) => {
      const kopya = structuredClone(onceki) as Taslak;
      const liste = [...((kopya.olaylar as Taslak[] | undefined) ?? [])];
      liste[i] = guncelle(liste[i] ?? {});
      kopya.olaylar = liste;
      return kopya;
    });
  };

  const olayEkle = () => {
    setSahne((onceki) => {
      const kopya = structuredClone(onceki) as Taslak;
      const liste = [...((kopya.olaylar as Taslak[] | undefined) ?? [])];
      liste.push({
        id: "",
        ad: "",
        tetik: { tur: "baslangic", ...varsayilanlar(TETIK_ALANLARI.baslangic) },
        aksiyon: { tur: "bildirim" },
      });
      kopya.olaylar = liste;
      return kopya;
    });
  };

  const olaySil = (i: number) => {
    setSahne((onceki) => {
      const kopya = structuredClone(onceki) as Taslak;
      const liste = [...((kopya.olaylar as Taslak[] | undefined) ?? [])];
      liste.splice(i, 1);
      kopya.olaylar = liste;
      return kopya;
    });
  };

  const olayTasi = (i: number, yon: -1 | 1) => {
    setSahne((onceki) => {
      const kopya = structuredClone(onceki) as Taslak;
      const liste = [...((kopya.olaylar as Taslak[] | undefined) ?? [])];
      const hedef = i + yon;
      if (hedef < 0 || hedef >= liste.length) return onceki;
      [liste[i], liste[hedef]] = [liste[hedef]!, liste[i]!];
      kopya.olaylar = liste;
      return kopya;
    });
  };

  const kaydet = () => {
    setSonuc(null);
    basla(async () => {
      const cevap = await sahneKaydet(sahne);
      setSonuc(cevap);
      if (cevap.ok) router.push(`/studio/${cevap.kod}`);
    });
  };

  const hataAlani = (yol: string): string | null => {
    if (sonuc === null || sonuc.ok) return null;
    return sonuc.hatalar.find((h) => h.yol === yol)?.mesaj ?? null;
  };

  const kutu = "rounded-2xl border border-[#d2d2d7] p-4";
  const girdi =
    "w-full rounded-lg border border-[#d2d2d7] px-3 py-[7px] text-[14px] outline-none focus:border-[#0071e3]";

  return (
    <div className="mt-6 flex flex-col gap-5">
      <section className={kutu}>
        <h2 className="mb-3 text-[15px] font-semibold">Sahne</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-[3px] block text-[12px] font-medium text-[#3a3a3c]">
              Sahne kodu <span className="text-[#c7392e]">*</span>
            </span>
            <input
              value={String(sahne.kod ?? "")}
              onChange={(e) => yaz(["kod"], e.target.value)}
              disabled={!yeniMi}
              placeholder="eg-b03-s58"
              className={`${girdi} font-mono ${yeniMi ? "" : "bg-[#f5f5f7] text-[#6e6e73]"}`}
            />
            <span className="mt-[3px] block text-[11px] text-[#86868b]">
              {yeniMi
                ? "{dizi}-b{bölüm}-s{sahne} — örn. eg-b03-s58"
                : "Kod sonradan değiştirilemez; link buna bağlı."}
            </span>
          </label>

          <label className="block">
            <span className="mb-[3px] block text-[12px] font-medium text-[#3a3a3c]">
              Cihaz <span className="text-[#c7392e]">*</span>
            </span>
            <select
              value={String(sahne.cihaz ?? "")}
              onChange={(e) => yaz(["cihaz"], e.target.value)}
              className={girdi}
            >
              <option value="">—</option>
              {secenekler.cihaz.map((c) => (
                <option key={c.deger} value={c.deger}>
                  {c.etiket}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-[3px] block text-[12px] font-medium text-[#3a3a3c]">
              Açılış modülü <span className="text-[#c7392e]">*</span>
            </span>
            <select
              value={String((sahne.baslangic as Taslak)?.modul ?? "")}
              onChange={(e) => yaz(["baslangic", "modul"], e.target.value)}
              className={girdi}
            >
              {secenekler.modul.map((m) => (
                <option key={m.deger} value={m.deger}>
                  {m.etiket}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-[3px] block text-[12px] font-medium text-[#3a3a3c]">
              Açılış ekranı <span className="text-[#c7392e]">*</span>
            </span>
            <input
              value={String((sahne.baslangic as Taslak)?.ekran ?? "")}
              onChange={(e) => yaz(["baslangic", "ekran"], e.target.value)}
              placeholder="kilit"
              className={`${girdi} font-mono text-[13px]`}
            />
          </label>

          <label className="block">
            <span className="mb-[3px] block text-[12px] font-medium text-[#3a3a3c]">
              Açılış hesabı
            </span>
            <select
              value={String((sahne.baslangic as Taslak)?.hesap ?? "")}
              onChange={(e) =>
                yaz(["baslangic", "hesap"], e.target.value === "" ? undefined : e.target.value)
              }
              className={girdi}
            >
              <option value="">—</option>
              {secenekler.hesap.map((h) => (
                <option key={h.deger} value={h.deger}>
                  {h.etiket}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-[3px] block text-[12px] font-medium text-[#3a3a3c]">
              Açılış içeriği
            </span>
            <select
              value={String((sahne.baslangic as Taslak)?.icerikRef ?? "")}
              onChange={(e) =>
                yaz(["baslangic", "icerikRef"], e.target.value === "" ? undefined : e.target.value)
              }
              className={girdi}
            >
              <option value="">—</option>
              {secenekler.icerik.map((i) => (
                <option key={i.deger} value={i.deger}>
                  {i.etiket}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-3 block">
          <span className="mb-[3px] block text-[12px] font-medium text-[#3a3a3c]">
            Sete gidecek talimat <span className="text-[#c7392e]">*</span>
          </span>
          <textarea
            value={String(sahne.talimat ?? "")}
            rows={3}
            onChange={(e) => yaz(["talimat"], e.target.value)}
            className={girdi}
          />
          <span className="mt-[3px] block text-[11px] text-[#86868b]">
            Teslim paketinde &quot;NE OLACAK&quot; başlığı altında aynen çıkar.
          </span>
        </label>
        {hataAlani("talimat") !== null && (
          <p className="mt-2 text-[12px] text-[#c7392e]">{hataAlani("talimat")}</p>
        )}
      </section>

      <section className={kutu}>
        <h2 className="mb-3 text-[15px] font-semibold">Cihaz durumu</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-[3px] block text-[12px] font-medium text-[#3a3a3c]">Bağlantı</span>
            <select
              value={String((sahne.durum as Taslak)?.baglanti ?? "normal")}
              onChange={(e) => yaz(["durum", "baglanti"], e.target.value)}
              className={girdi}
            >
              {["normal", "yavas", "yok"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-[3px] block text-[12px] font-medium text-[#3a3a3c]">
              Görsel yükleme
            </span>
            <select
              value={String((sahne.durum as Taslak)?.gorsel ?? "normal")}
              onChange={(e) => yaz(["durum", "gorsel"], e.target.value)}
              className={girdi}
            >
              {["normal", "gec", "yuklenmez"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-[3px] block text-[12px] font-medium text-[#3a3a3c]">Saat</span>
            <input
              value={String((sahne.durum as Taslak)?.saat ?? "")}
              onChange={(e) =>
                yaz(["durum", "saat"], e.target.value === "" ? undefined : e.target.value)
              }
              placeholder="23:41"
              className={girdi}
            />
          </label>
          <label className="block">
            <span className="mb-[3px] block text-[12px] font-medium text-[#3a3a3c]">Tarih</span>
            <input
              value={String((sahne.durum as Taslak)?.tarih ?? "")}
              onChange={(e) =>
                yaz(["durum", "tarih"], e.target.value === "" ? undefined : e.target.value)
              }
              placeholder="18 Eylül Perşembe"
              className={girdi}
            />
          </label>
          <label className="block">
            <span className="mb-[3px] block text-[12px] font-medium text-[#3a3a3c]">Pil</span>
            <input
              type="number"
              min={0}
              max={100}
              value={String((sahne.durum as Taslak)?.pil ?? "")}
              onChange={(e) =>
                yaz(["durum", "pil"], e.target.value === "" ? undefined : Number(e.target.value))
              }
              className={girdi}
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-[13px]">
            <input
              type="checkbox"
              checked={(sahne.durum as Taslak)?.sarjda === true}
              onChange={(e) =>
                yaz(["durum", "sarjda"], e.target.checked ? true : undefined)
              }
              className="h-4 w-4"
            />
            Şarjda
          </label>
        </div>
      </section>

      <section className={kutu}>
        <div className="mb-3 flex items-center">
          <h2 className="text-[15px] font-semibold">Olaylar</h2>
          <span className="ml-2 text-[12px] text-[#86868b]">{olaylar.length} olay</span>
          <button
            onClick={olayEkle}
            className="ml-auto rounded-full bg-[#0071e3] px-4 py-[6px] text-[13px] font-medium text-white active:opacity-80"
          >
            + Olay ekle
          </button>
        </div>

        {olaylar.length === 0 && (
          <p className="text-[13px] text-[#6e6e73]">
            Henüz olay yok. Sahne açılınca hiçbir şey olmaz; kumandadan da tetiklenecek bir şey
            bulunmaz.
          </p>
        )}

        <div className="flex flex-col gap-4">
          {olaylar.map((olay, i) => (
            <OlayKarti
              key={i}
              sira={i}
              toplam={olaylar.length}
              olay={olay}
              secenekler={secenekler}
              hata={(yol) => hataAlani(`olaylar.${i}.${yol}`)}
              degistir={(g) => olayYaz(i, g)}
              sil={() => olaySil(i)}
              tasi={(yon) => olayTasi(i, yon)}
            />
          ))}
        </div>
      </section>

      {sonuc !== null && !sonuc.ok && (
        <section className="rounded-2xl border border-[#f3c9c5] bg-[#fdf2f1] p-4">
          <h3 className="text-[13px] font-semibold text-[#8c2820]">Kaydedilemedi</h3>
          <ul className="mt-2 flex flex-col gap-1">
            {sonuc.hatalar.map((h, i) => (
              <li key={i} className="text-[13px] text-[#8c2820]">
                {h.yol !== "" && <span className="font-mono text-[11px] opacity-70">{h.yol} · </span>}
                {h.mesaj}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={kaydet}
          disabled={bekliyor}
          className="rounded-full bg-[#0071e3] px-5 py-[9px] text-[14px] font-medium text-white active:opacity-80 disabled:opacity-50"
        >
          {bekliyor ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <span className="text-[12px] text-[#86868b]">
          Kaydetmek yayına çıkarmaz; yayın için sahne sayfasındaki Yayınla kullanılır.
        </span>
      </div>
    </div>
  );
}

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

  const girdi =
    "w-full rounded-lg border border-[#d2d2d7] px-3 py-[7px] text-[14px] outline-none focus:border-[#0071e3]";

  return (
    <div className="rounded-xl border border-[#e8e8ed] bg-[#fbfbfd] p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[12px] font-semibold text-[#6e6e73]">{sira + 1}.</span>
        <input
          value={String(olay.ad ?? "")}
          onChange={(e) => degistir((o) => ({ ...o, ad: e.target.value }))}
          placeholder="Olayın adı * — kumandada bu görünür"
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-[14px] font-medium outline-none focus:border-[#d2d2d7] focus:bg-white"
        />
        <button
          onClick={() => tasi(-1)}
          disabled={sira === 0}
          aria-label="Yukarı taşı"
          className="px-2 text-[15px] text-[#6e6e73] disabled:opacity-25"
        >
          ↑
        </button>
        <button
          onClick={() => tasi(1)}
          disabled={sira === toplam - 1}
          aria-label="Aşağı taşı"
          className="px-2 text-[15px] text-[#6e6e73] disabled:opacity-25"
        >
          ↓
        </button>
        <button onClick={sil} aria-label="Olayı sil" className="px-2 text-[13px] text-[#c7392e]">
          Sil
        </button>
      </div>

      <label className="mb-3 block">
        <span className="mb-[3px] block text-[12px] font-medium text-[#3a3a3c]">
          Kimlik <span className="text-[#c7392e]">*</span>
        </span>
        <input
          value={String(olay.id ?? "")}
          onChange={(e) => degistir((o) => ({ ...o, id: e.target.value }))}
          placeholder="ilk-mesaj"
          className={`${girdi} font-mono text-[13px]`}
        />
        {hata("id") !== null && (
          <span className="mt-1 block text-[12px] text-[#c7392e]">{hata("id")}</span>
        )}
      </label>

      {hata("ad") !== null && (
        <p className="mb-3 text-[12px] text-[#c7392e]">{hata("ad")}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-3">
          <select
            value={tetikTuru}
            onChange={(e) => {
              const yeni = e.target.value as TetikTuru;
              degistir((o) => ({
                ...o,
                tetik: { tur: yeni, ...varsayilanlar(TETIK_ALANLARI[yeni]) },
              }));
            }}
            className={`${girdi} mb-3 font-medium`}
          >
            {Object.entries(TETIK_ADLARI).map(([deger, etiket]) => (
              <option key={deger} value={deger}>
                {etiket}
              </option>
            ))}
          </select>
          <div className="flex flex-col gap-3">
            {TETIK_ALANLARI[tetikTuru].map((alan) => (
              <AlanGirdisi
                key={alan.ad}
                alan={alan}
                deger={tetik[alan.ad]}
                secenekler={secenekler}
                degistir={(yeni) =>
                  degistir((o) => ({
                    ...o,
                    tetik: { ...(o.tetik as Taslak), [alan.ad]: yeni },
                  }))
                }
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-white p-3">
          <select
            value={aksiyonTuru}
            onChange={(e) => {
              const yeni = e.target.value as AksiyonTuru;
              degistir((o) => ({
                ...o,
                aksiyon: { tur: yeni, ...varsayilanlar(AKSIYON_ALANLARI[yeni]) },
              }));
            }}
            className={`${girdi} mb-3 font-medium`}
          >
            {Object.entries(AKSIYON_ADLARI).map(([deger, etiket]) => (
              <option key={deger} value={deger}>
                {etiket}
              </option>
            ))}
          </select>
          <div className="flex flex-col gap-3">
            {AKSIYON_ALANLARI[aksiyonTuru].map((alan) => (
              <AlanGirdisi
                key={alan.ad}
                alan={alan}
                deger={aksiyon[alan.ad]}
                secenekler={secenekler}
                degistir={(yeni) =>
                  degistir((o) => ({
                    ...o,
                    aksiyon: { ...(o.aksiyon as Taslak), [alan.ad]: yeni },
                  }))
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
