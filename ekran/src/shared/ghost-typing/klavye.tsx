"use client";

import { useSkin } from "@/shell";

/**
 * Sahte klavye. CLAUDE.md §7
 *
 * Türkçe Q düzeni. Hangi tuşa basılırsa basılsın senaryodaki sıradaki harf
 * yazılır — bu yüzden tuşların hangi harf olduğu yalnızca GÖRÜNTÜ içindir.
 * Metin bitince tuşlar etkisizleşir.
 */

const SATIR_1 = ["q", "w", "e", "r", "t", "y", "u", "ı", "o", "p", "ğ", "ü"];
const SATIR_2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ş", "i"];
const SATIR_3 = ["z", "x", "c", "v", "b", "n", "m", "ö", "ç"];

export function Klavye({
  onTus,
  onGeriAl,
  etkin,
}: {
  onTus: () => void;
  onGeriAl: () => void;
  /** Metin bittiğinde false olur; tuşlar görünür ama çalışmaz. */
  etkin: boolean;
}) {
  const skin = useSkin();
  const android = skin === "android";

  const zemin = android ? "#eceff3" : "#d1d4db";
  const tusZemin = android ? "#ffffff" : "#ffffff";
  const ozelZemin = android ? "#dfe3e9" : "#aeb3bd";

  const Tus = ({
    children,
    genis,
    ozel,
    onBas,
    etiket,
  }: {
    children: React.ReactNode;
    genis?: number;
    ozel?: boolean;
    onBas: () => void;
    etiket?: string;
  }) => (
    <button
      aria-label={etiket}
      onPointerDown={(e) => {
        e.preventDefault();
        if (etkin) onBas();
      }}
      className="flex h-[42px] select-none items-center justify-center rounded-[5px] text-[17px] active:opacity-70"
      style={{
        flex: genis ?? 1,
        background: ozel === true ? ozelZemin : tusZemin,
        color: "#111",
        boxShadow: android ? "none" : "0 1px 0 rgba(0,0,0,0.28)",
        opacity: etkin ? 1 : 0.55,
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      className="shrink-0 select-none px-[3px] pb-[6px] pt-[7px]"
      style={{ background: zemin }}
      aria-label="Klavye"
    >
      <div className="mb-[7px] flex gap-[4px]">
        {SATIR_1.map((h) => (
          <Tus key={h} onBas={onTus} etiket={h}>
            {h}
          </Tus>
        ))}
      </div>
      <div className="mb-[7px] flex gap-[4px] px-[13px]">
        {SATIR_2.map((h) => (
          <Tus key={h} onBas={onTus} etiket={h}>
            {h}
          </Tus>
        ))}
      </div>
      <div className="mb-[7px] flex gap-[4px]">
        <Tus genis={1.4} ozel onBas={onTus} etiket="Büyük harf">
          <Ok />
        </Tus>
        {SATIR_3.map((h) => (
          <Tus key={h} onBas={onTus} etiket={h}>
            {h}
          </Tus>
        ))}
        <Tus genis={1.4} ozel onBas={onGeriAl} etiket="Sil">
          <Sil />
        </Tus>
      </div>
      <div className="flex gap-[4px]">
        <Tus genis={1.3} ozel onBas={onTus} etiket="Sayılar">
          <span className="text-[13px]">123</span>
        </Tus>
        <Tus ozel onBas={onTus} etiket="Emoji">
          <span className="text-[15px]">☺</span>
        </Tus>
        <Tus genis={5} onBas={onTus} etiket="Boşluk">
          <span />
        </Tus>
        <Tus genis={1.3} ozel onBas={onTus} etiket="Nokta">
          .
        </Tus>
      </div>
    </div>
  );
}

function Ok() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4 4 13h4.6v6h6.8v-6H20L12 4Z" fill="currentColor" />
    </svg>
  );
}

function Sil() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8.4 5h11.2a1.6 1.6 0 0 1 1.6 1.6v10.8a1.6 1.6 0 0 1-1.6 1.6H8.4L2.6 12 8.4 5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m11.6 9.4 5 5.2M16.6 9.4l-5 5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
