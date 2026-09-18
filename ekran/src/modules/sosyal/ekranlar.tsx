"use client";

import { markalar } from "@brands";
import { useSahne } from "@/engine";
import { Medya } from "@/shared/medya";
import { GhostYaziAlani, useGhostTyping } from "@/shared/ghost-typing";
import { useKutuphane } from "@/icerik/kutuphane";
import { GHOST_HEDEF, HOTSPOT } from "./hotspotlar";
import { Avatar, Balon, Geri, Kalp, sayiYaz } from "./parcalar";
import { PostKarti } from "./post-karti";
import type { Aktivite, GorunenPost, SosyalVeri } from "./veri";

const MARKA = markalar.akis;

export function UstCubuk({ baslik, geri }: { baslik: string; geri?: () => void }) {
  return (
    <header
      className="flex h-[46px] shrink-0 items-center gap-2 px-[13px]"
      style={{ borderBottom: "1px solid var(--ayrac)" }}
    >
      {geri !== undefined && (
        <button onClick={geri} aria-label="Geri" style={{ color: "var(--metin)" }}>
          <Geri />
        </button>
      )}
      <span className="truncate text-[15px] font-semibold">{baslik}</span>
    </header>
  );
}

export function Feed({
  veri,
  git,
}: {
  veri: SosyalVeri;
  git: (ekran: string, param?: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <header
        className="flex h-[48px] shrink-0 items-center px-[14px]"
        style={{ borderBottom: "1px solid var(--ayrac)" }}
      >
        <span
          className="text-[21px] font-semibold tracking-tight"
          style={{ color: MARKA.renk }}
        >
          {MARKA.ad}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        {veri.feed.map((post) => (
          <div key={post.id} className={post.yeniYuklendi ? "animate-[postGir_520ms_ease-out]" : undefined}>
            <PostKarti
              post={post}
              onYorumlar={(id) => git("yorumlar", id)}
              onPost={(id) => git("post", id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PostDetay({
  post,
  git,
  geri,
}: {
  post: GorunenPost | null;
  git: (ekran: string, param?: string) => void;
  geri: () => void;
}) {
  if (post === null) return <UstCubuk baslik="Gönderi" geri={geri} />;
  return (
    <div className="flex h-full flex-col">
      <UstCubuk baslik="Gönderi" geri={geri} />
      <div className="min-h-0 flex-1 overflow-auto">
        <PostKarti post={post} onYorumlar={(id) => git("yorumlar", id)} />
      </div>
    </div>
  );
}

export function Yorumlar({
  post,
  geri,
  benimHesabim,
  gonderildi = false,
}: {
  post: GorunenPost | null;
  geri: () => void;
  benimHesabim?: string;
  /** Yazılan yorum listeye düştü mü? Yerel bayrak tutulmaz; olaylardan türer,
      böylece başa sarınca kendiliğinden sıfırlanır. */
  gonderildi?: boolean;
}) {
  const { dokun } = useSahne();
  const kutuphane = useKutuphane();
  const ghost = useGhostTyping(GHOST_HEDEF.yorum);

  return (
    <div className="flex h-full flex-col">
      <UstCubuk baslik="Yorumlar" geri={geri} />
      <div
        className="min-h-0 flex-1 overflow-auto px-[13px] py-[11px]"
        onPointerDown={() => dokun(HOTSPOT.yorumAlani)}
      >
        {post !== null && post.aciklama !== "" && (
          <Satir hesapAdi={post.hesap?.kullaniciAdi} avatar={post.hesap} metin={post.aciklama} />
        )}
        {post?.yorumlar.map((y, i) => (
          <div key={i} className={y.yeni ? "animate-[yorumGir_420ms_ease-out]" : undefined}>
            <Satir hesapAdi={y.hesap?.kullaniciAdi} avatar={y.hesap} metin={y.metin} />
          </div>
        ))}
        {post?.yorumlar.length === 0 && (
          <p className="mt-6 text-center text-[13px]" style={{ color: "var(--metin-soluk)" }}>
            Henüz yorum yok.
          </p>
        )}
      </div>

      {ghost.aktif && !gonderildi && (
        <GhostYaziAlani
          hedef={GHOST_HEDEF.yorum}
          yerTutucu="Yorum ekle…"
          gonderEtiketi="Paylaş"
          onGonder={() => dokun(HOTSPOT.yorumGonderildi)}
          sol={<Avatar hesap={kutuphane.hesap(benimHesabim ?? "")} boyut={29} />}
          vurguRengi={MARKA.renk}
        />
      )}
    </div>
  );
}

function Satir({
  hesapAdi,
  avatar,
  metin,
}: {
  hesapAdi?: string;
  avatar: Parameters<typeof Avatar>[0]["hesap"];
  metin: string;
}) {
  return (
    <div className="mb-[13px] flex items-start gap-[10px]">
      <Avatar hesap={avatar} boyut={31} />
      <div className="min-w-0 flex-1 text-[13px] leading-snug">
        <span className="font-semibold">{hesapAdi ?? "—"} </span>
        {metin}
      </div>
      <span className="mt-[2px] shrink-0" style={{ color: "var(--metin-soluk)" }}>
        <Kalp boyut={13} />
      </span>
    </div>
  );
}

export function Kesfet({
  veri,
  git,
}: {
  veri: SosyalVeri;
  git: (ekran: string, param?: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-[13px] py-[9px]" style={{ borderBottom: "1px solid var(--ayrac)" }}>
        <div
          className="flex h-[35px] items-center rounded-[10px] px-3 text-[13px]"
          style={{ background: "var(--zemin-ikincil)", color: "var(--metin-soluk)" }}
        >
          Ara
        </div>
      </div>
      <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-3 gap-[2px] overflow-auto">
        {veri.feed.map((post) => (
          <button key={post.id} onClick={() => git("post", post.id)} className="block">
            <Medya
              kaynak={`/ornek/${post.gorsel}`}
              alt={post.aciklama}
              className="w-full"
              style={{ aspectRatio: "1 / 1", color: "var(--metin)" }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function AktiviteEkrani({ veri }: { veri: SosyalVeri }) {
  return (
    <div className="flex h-full flex-col">
      <UstCubuk baslik="Aktivite" />
      <div className="min-h-0 flex-1 overflow-auto px-[13px] py-[11px]">
        {veri.aktiviteler.length === 0 && (
          <p className="mt-6 text-center text-[13px]" style={{ color: "var(--metin-soluk)" }}>
            Henüz bir hareket yok.
          </p>
        )}
        {veri.aktiviteler.map((a, i) => (
          <div key={i} className="mb-[14px] flex items-center gap-[10px] animate-[yorumGir_420ms_ease-out]">
            <Avatar hesap={a.hesap} boyut={38} />
            <div className="min-w-0 flex-1 text-[13px] leading-snug">
              <span className="font-semibold">{a.hesap?.kullaniciAdi ?? "—"} </span>
              {aktiviteMetni(a)}
            </div>
            {a.tur === "takip" ? (
              <button
                className="shrink-0 rounded-lg px-3 py-[6px] text-[12px] font-semibold text-white"
                style={{ background: MARKA.renk }}
              >
                Takip et
              </button>
            ) : (
              <span style={{ color: "var(--metin-soluk)" }}>
                {a.tur === "begeni" ? <Kalp boyut={17} /> : <Balon boyut={17} />}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function aktiviteMetni(a: Aktivite): string {
  if (a.tur === "begeni") return "gönderini beğendi.";
  if (a.tur === "takip") return "seni takip etmeye başladı.";
  return `yorum yaptı: ${a.metin}`;
}

export function Profil({
  hesapId,
  veri,
  git,
}: {
  hesapId: string;
  veri: SosyalVeri;
  git: (ekran: string, param?: string) => void;
}) {
  const kutuphane = useKutuphane();
  const hesap = kutuphane.hesap(hesapId);
  const postlar = veri.feed.filter((p) => p.hesap?.id === hesapId);

  return (
    <div className="flex h-full flex-col">
      <UstCubuk baslik={hesap?.kullaniciAdi ?? "Profil"} />
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex items-center gap-[18px] px-[15px] py-[14px]">
          <Avatar hesap={hesap} boyut={76} />
          <div className="flex flex-1 justify-around text-center text-[13px]">
            <Sayac sayi={postlar.length} etiket="gönderi" />
            <Sayac sayi={342 + veri.takipEdenler.length} etiket="takipçi" />
            <Sayac sayi={218} etiket="takip" />
          </div>
        </div>
        <div className="px-[15px] pb-[12px] text-[13px] leading-snug">
          <div className="font-semibold">{hesap?.gorunenAd}</div>
        </div>
        <div className="grid auto-rows-min grid-cols-3 gap-[2px]">
          {postlar.map((p) => (
            <button key={p.id} onClick={() => git("post", p.id)} className="block">
              <Medya
                kaynak={`/ornek/${p.gorsel}`}
                alt={p.aciklama}
                className="w-full"
                style={{ aspectRatio: "1 / 1", color: "var(--metin)" }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Sayac({ sayi, etiket }: { sayi: number; etiket: string }) {
  return (
    <div>
      <div className="font-semibold">{sayiYaz(sayi)}</div>
      <div style={{ color: "var(--metin-soluk)" }}>{etiket}</div>
    </div>
  );
}
