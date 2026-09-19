import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Stüdyo'nun ortak arayüz parçaları. CLAUDE.md §8
 *
 * Amaç: her sayfanın kendi ölçülerini uydurmasını bitirmek. Renkler, boşluklar
 * ve yazı ölçüleri tek yerde; sayfalar yalnızca içeriği söyler.
 *
 * Kullanıcı yazılımcı değil: başlıklar soru cümlesi gibi, açıklamalar kısa,
 * teknik terim yok. Yoğunluk yerine boşluk tercih edildi.
 */

export function Panel({ children }: { children: ReactNode }) {
  return (
    <main className="acik-sayfa min-h-dvh pb-20" style={{ background: "#f5f5f7" }}>
      <div className="mx-auto max-w-[840px] px-5">{children}</div>
    </main>
  );
}

/** Sayfa başlığı: geri bağlantısı, başlık, kısa açıklama ve sağdaki eylemler. */
export function PanelUst({
  geri,
  geriEtiketi,
  baslik,
  aciklama,
  eylemler,
}: {
  geri?: string;
  geriEtiketi?: string;
  baslik: string;
  aciklama?: string;
  eylemler?: ReactNode;
}) {
  return (
    <header className="pb-6 pt-7">
      {geri !== undefined && (
        <Link
          href={geri}
          className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-[#0071e3]"
        >
          <span aria-hidden="true">‹</span>
          {geriEtiketi ?? "Geri"}
        </Link>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[#1d1d1f]">
            {baslik}
          </h1>
          {aciklama !== undefined && (
            <p className="mt-[5px] text-[14px] leading-snug text-[#6e6e73]">{aciklama}</p>
          )}
        </div>
        {eylemler !== undefined && <div className="flex shrink-0 items-center gap-2">{eylemler}</div>}
      </div>
    </header>
  );
}

/**
 * Beyaz kart. Stüdyo'daki her bölüm bir kart.
 * `baslik` verilirse üstte başlık şeridi çizilir.
 */
export function Kart({
  baslik,
  aciklama,
  sag,
  children,
  vurgu,
}: {
  baslik?: string;
  aciklama?: string;
  sag?: ReactNode;
  children?: ReactNode;
  /** Onay kutusu gibi durum bildiren kartlar için. */
  vurgu?: "yesil" | "mavi" | "kirmizi";
}) {
  const cerceve =
    vurgu === "yesil"
      ? "border-[#c9e4d2] bg-[#f4faf6]"
      : vurgu === "mavi"
        ? "border-[#d3e3f7] bg-[#f4f8fd]"
        : vurgu === "kirmizi"
          ? "border-[#f0cdc8] bg-[#fdf5f4]"
          : "border-[#e4e4e7] bg-white";

  return (
    <section className={`rounded-[18px] border ${cerceve}`}>
      {(baslik !== undefined || sag !== undefined) && (
        <div className="flex flex-wrap items-start gap-x-4 gap-y-2 px-5 pb-1 pt-4">
          <div className="min-w-0 flex-1">
            {baslik !== undefined && (
              <h2 className="text-[15px] font-semibold text-[#1d1d1f]">{baslik}</h2>
            )}
            {aciklama !== undefined && (
              <p className="mt-[3px] text-[13px] leading-snug text-[#6e6e73]">{aciklama}</p>
            )}
          </div>
          {sag !== undefined && <div className="shrink-0">{sag}</div>}
        </div>
      )}
      {children !== undefined && <div className="px-5 pb-5 pt-3">{children}</div>}
    </section>
  );
}

/** Kartları alt alta dizmek için tutarlı boşluk. */
export function Yigin({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

export const GIRDI_SINIFI =
  "w-full rounded-[10px] border border-[#d8d8dc] bg-white px-3 py-[9px] text-[14px] text-[#1d1d1f] outline-none transition-colors placeholder:text-[#b4b4b8] focus:border-[#0071e3]";

/** Etiketli alan. Zorunluluk ve ipucu tek yerde biçimlenir. */
export function Alan({
  etiket,
  zorunlu,
  ipucu,
  hata,
  children,
}: {
  etiket: string;
  zorunlu?: boolean;
  ipucu?: string;
  hata?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-[5px] block text-[12px] font-medium text-[#48484a]">
        {etiket}
        {zorunlu === true && <span className="ml-[3px] text-[#c7392e]">*</span>}
      </span>
      {children}
      {ipucu !== undefined && hata == null && (
        <span className="mt-[4px] block text-[11px] leading-snug text-[#8e8e93]">{ipucu}</span>
      )}
      {hata != null && (
        <span className="mt-[4px] block text-[11px] font-medium leading-snug text-[#c7392e]">
          {hata}
        </span>
      )}
    </label>
  );
}

type DugmeTuru = "birincil" | "ikincil" | "sessiz" | "onay" | "tehlike";

const DUGME_SINIFI: Record<DugmeTuru, string> = {
  birincil: "bg-[#0071e3] text-white hover:bg-[#0062c4]",
  ikincil: "border border-[#d8d8dc] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]",
  sessiz: "text-[#0071e3] hover:bg-[#ecf3fd]",
  onay: "bg-[#1d6b3f] text-white hover:bg-[#185a35]",
  tehlike: "text-[#c7392e] hover:bg-[#fdf0ef]",
};

export function Dugme({
  tur = "ikincil",
  kucuk,
  ...props
}: {
  tur?: DugmeTuru;
  kucuk?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const olcu = kucuk === true ? "px-[13px] py-[6px] text-[13px]" : "px-[18px] py-[9px] text-[14px]";
  return (
    <button
      {...props}
      className={`rounded-full font-medium transition-colors disabled:opacity-45 ${olcu} ${DUGME_SINIFI[tur]} ${props.className ?? ""}`}
    />
  );
}

/** Düğme görünümlü bağlantı — <Dugme> ile aynı ölçüler. */
export function DugmeBaglanti({
  tur = "ikincil",
  kucuk,
  href,
  children,
}: {
  tur?: DugmeTuru;
  kucuk?: boolean;
  href: string;
  children: ReactNode;
}) {
  const olcu = kucuk === true ? "px-[13px] py-[6px] text-[13px]" : "px-[18px] py-[9px] text-[14px]";
  return (
    <Link
      href={href}
      className={`inline-block rounded-full text-center font-medium transition-colors ${olcu} ${DUGME_SINIFI[tur]}`}
    >
      {children}
    </Link>
  );
}

/** Küçük durum rozeti. */
export function Rozet({
  children,
  renk = "gri",
}: {
  children: ReactNode;
  renk?: "gri" | "yesil" | "mavi";
}) {
  const stil =
    renk === "yesil"
      ? "bg-[#e6f4ea] text-[#1d6b3f]"
      : renk === "mavi"
        ? "bg-[#e8f1fd] text-[#0058b0]"
        : "bg-[#eeeef0] text-[#6e6e73]";
  return (
    <span className={`rounded-full px-[9px] py-[3px] text-[11px] font-medium ${stil}`}>
      {children}
    </span>
  );
}
