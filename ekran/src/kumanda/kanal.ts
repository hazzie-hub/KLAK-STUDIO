import type { KumandaMesaji } from "./mesaj";
import { mesajCoz } from "./mesaj";

/**
 * Kumanda ile oynatıcı arasındaki taşıyıcı. CLAUDE.md §6
 *
 * İki uygulaması var:
 *  - `SupabaseKanal`: asıl yol. Ayrı cihazlar arasında çalışır (CLAUDE.md §4).
 *  - `YerelKanal`: aynı cihazdaki iki sekme arasında. Supabase anahtarları
 *    yokken geliştirme ve deneme için; sette kullanılmaz.
 *
 * Hangisinin seçildiği `kanalAc` içinde belli olur; çağıran taraf bilmez.
 */
export type Kanal = {
  /** Taşıyıcının adı — arayüzde gösterilir, sette hangi yolda olduğumuz belli olsun. */
  readonly tur: "supabase" | "yerel";
  gonder: (mesaj: KumandaMesaji) => void;
  /** Bağlantı durumu değişince çağrılır. */
  kapat: () => void;
};

export type KanalSecenekleri = {
  sahneKodu: string;
  onMesaj: (mesaj: KumandaMesaji) => void;
  onBaglanti?: (bagli: boolean) => void;
};

/** Aynı cihazdaki sekmeler arası — Supabase yokken. */
class YerelKanal implements Kanal {
  readonly tur = "yerel" as const;
  private readonly bc: BroadcastChannel;

  constructor(private readonly secenekler: KanalSecenekleri) {
    this.bc = new BroadcastChannel(`sahne:${secenekler.sahneKodu}`);
    this.bc.onmessage = (olay) => {
      const mesaj = mesajCoz(olay.data);
      if (mesaj !== null) secenekler.onMesaj(mesaj);
    };
    secenekler.onBaglanti?.(true);
  }

  gonder(mesaj: KumandaMesaji): void {
    this.bc.postMessage(mesaj);
  }

  kapat(): void {
    this.bc.close();
    this.secenekler.onBaglanti?.(false);
  }
}

/** Supabase Realtime broadcast — kanal adı `sahne:{kod}` (CLAUDE.md §6). */
class SupabaseKanal implements Kanal {
  readonly tur = "supabase" as const;
  private kanal: { send: (a: unknown) => unknown; unsubscribe: () => void } | null = null;
  private kapandi = false;

  constructor(
    private readonly secenekler: KanalSecenekleri,
    url: string,
    anahtar: string,
  ) {
    void this.baglan(url, anahtar);
  }

  private async baglan(url: string, anahtar: string): Promise<void> {
    let createClient: typeof import("@supabase/supabase-js").createClient;
    try {
      ({ createClient } = await import("@supabase/supabase-js"));
    } catch {
      // Sette internet kesikken kütüphane yüklenemeyebilir. Sahne buna
      // takılmaz: kumanda susar, oynatıcı süreli tetikleriyle devam eder.
      console.error("[ekran] Kumanda kütüphanesi yüklenemedi; sahne kumandasız devam ediyor.");
      this.secenekler.onBaglanti?.(false);
      return;
    }
    if (this.kapandi) return;

    const istemci = createClient(url, anahtar, {
      realtime: { params: { eventsPerSecond: 20 } },
    });

    const kanal = istemci.channel(`sahne:${this.secenekler.sahneKodu}`, {
      config: { broadcast: { self: false } },
    });

    kanal.on("broadcast", { event: "ekran" }, ({ payload }) => {
      const mesaj = mesajCoz(payload);
      if (mesaj !== null) this.secenekler.onMesaj(mesaj);
    });

    kanal.subscribe((durum) => {
      this.secenekler.onBaglanti?.(durum === "SUBSCRIBED");
    });

    this.kanal = kanal as unknown as { send: (a: unknown) => unknown; unsubscribe: () => void };
  }

  gonder(mesaj: KumandaMesaji): void {
    // Bağlantı yoksa mesaj sessizce düşer; oynatıcı süreli tetiklerle
    // devam eder, hiçbir şey kilitlenmez (CLAUDE.md §6).
    this.kanal?.send({ type: "broadcast", event: "ekran", payload: mesaj });
  }

  kapat(): void {
    this.kapandi = true;
    this.kanal?.unsubscribe();
    this.kanal = null;
    this.secenekler.onBaglanti?.(false);
  }
}

/**
 * Hangi taşıyıcı kullanılacak? Saf fonksiyon — testi kolay olsun diye
 * ortam değişkenlerini kendisi okumaz.
 *
 * Supabase anahtarları TAM olmalı; yarısı girilmişse yerel kanala düşer,
 * yoksa sette "kumanda çalışmıyor" diye saatler harcanır.
 */
export function tasiyiciSec(url: unknown, anahtar: unknown): Kanal["tur"] {
  const gecerli = (d: unknown): d is string => typeof d === "string" && d.trim() !== "";
  return gecerli(url) && gecerli(anahtar) ? "supabase" : "yerel";
}

/** Supabase anahtarları varsa onu, yoksa yerel kanalı açar. */
export function kanalAc(secenekler: KanalSecenekleri): Kanal {
  // Next.js bu değerleri derleme anında gömer; koşul dışına çıkarılamaz.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anahtar = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (tasiyiciSec(url, anahtar) === "supabase") {
    return new SupabaseKanal(secenekler, url as string, anahtar as string);
  }
  return new YerelKanal(secenekler);
}
