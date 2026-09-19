import { GirisFormu } from "@/studio/giris-formu";
import { parolaVarsayilanMi } from "@/studio/oturum";

/** Giriş her zaman taze: parola ortam değişkeninden okunuyor. */
export const dynamic = "force-dynamic";

export const metadata = { title: "KLAK Studio" };

/**
 * Giriş ekranı. CLAUDE.md §8
 *
 * Kameraya girmez; bizim ve operatörün sayfası. Sade tutuldu: sette acele
 * ederken tek alan, tek düğme.
 */
export default async function GirisSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ devam?: string }>;
}) {
  const { devam } = await searchParams;
  const varsayilan = parolaVarsayilanMi();

  return (
    <main
      className="acik-sayfa flex min-h-dvh items-center justify-center px-5 py-10"
      style={{ background: "#f5f5f7" }}
    >
      <div className="w-full max-w-[360px]">
        <div className="mb-7 text-center">
          <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-[#1d1d1f]">
            KLAK Studio
          </h1>
          <p className="mt-[6px] text-[14px] text-[#6e6e73]">Set ekran sistemi</p>
        </div>

        <div className="rounded-[18px] border border-[#e4e4e7] bg-white p-5">
          <GirisFormu devam={devam ?? ""} />
        </div>

        {varsayilan && (
          <p className="mt-4 rounded-[14px] border border-[#f0cdc8] bg-[#fdf5f4] px-4 py-3 text-[12px] leading-snug text-[#8a3b30]">
            Parola henüz kuruluma özel değil: koddaki varsayılan geçerli. Kendi
            parolanızı istediğinizde söyleyin, yalnızca size özel olanla
            değiştirelim.
          </p>
        )}
      </div>
    </main>
  );
}
