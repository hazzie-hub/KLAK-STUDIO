import type { Olay, Sahne } from "@/schema";

/**
 * Zaman çizelgesi motoru. CLAUDE.md §5
 *
 * Sahnenin kalbi: olayları tetikler, zinciri yürütür, başa sarar.
 * Görsel hiçbir şey bilmez — bu yüzden saat sahteyken de test edilebilir.
 *
 * KURALLAR:
 *  - Her olay, tetiğinden bağımsız olarak HER ZAMAN elle de tetiklenebilir (§5).
 *  - Elle tetiklenen olay, bekleyen zamanlayıcısını iptal eder ve zinciri
 *    buradan devam ettirir (§5) — "elle tetik süreyi ezer" (§2.5).
 *  - OTOMATİK zincir, daha önce gerçekleşmiş bir olayı TEKRAR ETMEZ. Operatör
 *    zincirin sonuna atladığında arkadan gelen zincir aynı bildirimi ikinci kez
 *    düşürmesin diye. Operatörün kendi isteğiyle tekrarlaması ayrı (elleTetikle).
 *  - Rastgelelik yok; aynı girdi her tekrarda aynı sonucu verir (§2.4).
 */

export type Kaynak = "otomatik" | "elle" | "dokunma";

export type OlayKaydi = {
  olayId: string;
  /** Sahne başlangıcından beri geçen milisaniye. */
  zaman: number;
  kaynak: Kaynak;
};

export type BekleyenOlay = {
  olayId: string;
  /** Sahne başlangıcına göre ne zaman ateşlenecek. */
  hedefZaman: number;
};

/** Zamanlayıcı kimliği — testte sahte saat sayı döndürebilsin diye açık bırakıldı. */
export type ZamanlayiciKimligi = unknown;

export type MotorSecenekleri = {
  /** Aksiyon çalıştırılacağı zaman çağrılır. Motor aksiyonun ne yaptığını bilmez. */
  onAksiyon?: (olay: Olay, kaynak: Kaynak) => void;
  /** Test için sahte saat/zamanlayıcı enjekte edilebilir. */
  simdi?: () => number;
  zamanla?: (fn: () => void, ms: number) => ZamanlayiciKimligi;
  iptal?: (kimlik: ZamanlayiciKimligi) => void;
};

export class Motor {
  private readonly olaylar: Map<string, Olay>;
  /** Hangi olaydan sonra hangi olaylar geliyor. */
  private readonly zincir: Map<string, Olay[]>;
  private readonly bekleyen = new Map<
    string,
    { kimlik: ZamanlayiciKimligi; hedefZaman: number; kurulmaZamani: number }
  >();
  /** Gizli panelden ayarlanan gecikmeler. Sahne dosyasını değiştirmez. */
  private readonly gecikmeEzmeleri = new Map<string, number>();
  private readonly aboneler = new Set<() => void>();

  private kayitlar: OlayKaydi[] = [];
  private baslangicZamani = 0;
  private calisiyor = false;

  private readonly simdi: () => number;
  private readonly zamanla: (fn: () => void, ms: number) => ZamanlayiciKimligi;
  private readonly iptal: (kimlik: ZamanlayiciKimligi) => void;
  private readonly onAksiyon: (olay: Olay, kaynak: Kaynak) => void;

  constructor(
    private readonly sahne: Sahne,
    secenekler: MotorSecenekleri = {},
  ) {
    this.olaylar = new Map(sahne.olaylar.map((o) => [o.id, o]));

    this.zincir = new Map();
    for (const olay of sahne.olaylar) {
      if (olay.tetik.tur !== "sonra") continue;
      const liste = this.zincir.get(olay.tetik.olayId) ?? [];
      liste.push(olay);
      this.zincir.set(olay.tetik.olayId, liste);
    }

    this.simdi = secenekler.simdi ?? (() => Date.now());
    this.zamanla = secenekler.zamanla ?? ((fn, ms) => setTimeout(fn, ms));
    this.iptal = secenekler.iptal ?? ((k) => clearTimeout(k as ReturnType<typeof setTimeout>));
    this.onAksiyon = secenekler.onAksiyon ?? (() => {});
  }

  // ─── Dışarıya açık ───────────────────────────────────────────────────────

  baslat(): void {
    if (this.calisiyor) return;
    this.calisiyor = true;
    this.baslangicZamani = this.simdi();

    for (const olay of this.sahne.olaylar) {
      if (olay.tetik.tur === "baslangic") {
        this.kur(olay, olay.tetik.gecikme);
      }
    }
    this.duyur();
  }

  /** Oyuncu bir hotspot'a dokundu. Aynı hedefi ikinci kez tetiklemez. */
  dokun(hedef: string): void {
    for (const olay of this.sahne.olaylar) {
      if (olay.tetik.tur !== "dokunma" || olay.tetik.hedef !== hedef) continue;
      if (this.tetiklendiMi(olay.id)) continue;
      this.ates(olay, "dokunma");
    }
  }

  /**
   * Kumanda ya da gizli panelden elle tetikleme.
   * Bekleyen zamanlayıcısını iptal eder; daha önce tetiklenmiş olsa bile çalışır
   * (operatör sette tekrar etmek isteyebilir).
   */
  elleTetikle(olayId: string): void {
    const olay = this.olaylar.get(olayId);
    if (olay === undefined) {
      console.error(`[ekran] Elle tetiklenmek istenen olay yok: ${olayId}`);
      return;
    }
    this.ates(olay, "elle");
  }

  /**
   * CLAUDE.md §6: sahne birebir baştan başlar.
   * Panelden ayarlanan gecikmeler KORUNUR — operatör ayarlayıp tekrar çeker.
   */
  basaSar(): void {
    for (const { kimlik } of this.bekleyen.values()) this.iptal(kimlik);
    this.bekleyen.clear();
    this.kayitlar = [];
    this.calisiyor = false;
    this.baslat();
  }

  /** Sayfa kapanırken bekleyen zamanlayıcıları bırakmamak için. */
  durdur(): void {
    for (const { kimlik } of this.bekleyen.values()) this.iptal(kimlik);
    this.bekleyen.clear();
    this.calisiyor = false;
  }

  abone(dinleyici: () => void): () => void {
    this.aboneler.add(dinleyici);
    return () => this.aboneler.delete(dinleyici);
  }

  // ─── Okuma ───────────────────────────────────────────────────────────────

  get log(): readonly OlayKaydi[] {
    return this.kayitlar;
  }

  tetiklendiMi(olayId: string): boolean {
    return this.kayitlar.some((k) => k.olayId === olayId);
  }

  /** Bekleyen olaylar, ateşlenme sırasına göre. Kumanda ve gizli panel bunu gösterir. */
  get bekleyenler(): BekleyenOlay[] {
    return [...this.bekleyen.entries()]
      .map(([olayId, { hedefZaman }]) => ({ olayId, hedefZaman }))
      .sort((a, b) => a.hedefZaman - b.hedefZaman);
  }

  /** Sahne başlangıcından beri geçen süre — kumandaya "kaç sn kaldı" demek için. */
  get gecen(): number {
    return this.gecenSure();
  }

  /** Sıradaki olay — kumandada vurgulanacak olan. */
  get siradaki(): BekleyenOlay | null {
    return this.bekleyenler[0] ?? null;
  }

  // ─── İçeride ─────────────────────────────────────────────────────────────

  private gecenSure(): number {
    return this.simdi() - this.baslangicZamani;
  }

  /** Olayın geçerli gecikmesi: panelden ayarlandıysa o, yoksa sahnedeki. */
  gecikmeAl(olayId: string): number {
    const ezme = this.gecikmeEzmeleri.get(olayId);
    if (ezme !== undefined) return ezme;
    const olay = this.olaylar.get(olayId);
    if (olay === undefined) return 0;
    if (olay.tetik.tur === "baslangic" || olay.tetik.tur === "sonra") return olay.tetik.gecikme;
    return 0;
  }

  /**
   * Gizli panelden gecikme ayarı (CLAUDE.md §6, 250 ms adım).
   * Olay o an bekliyorsa hedefi hemen kaydırılır; süresi geçmişse hemen ateşlenir.
   * Sahne dosyasına dokunmaz — ayar bu oturumda geçerlidir.
   */
  gecikmeAyarla(olayId: string, gecikme: number): void {
    const olay = this.olaylar.get(olayId);
    if (olay === undefined) return;
    if (olay.tetik.tur !== "baslangic" && olay.tetik.tur !== "sonra") return;

    const yeni = Math.max(0, Math.round(gecikme));
    this.gecikmeEzmeleri.set(olayId, yeni);

    const bekleyen = this.bekleyen.get(olayId);
    if (bekleyen === undefined) {
      this.duyur();
      return;
    }

    // Bekliyorsa yeniden kur: hedef, kurulduğu andan itibaren yeni gecikme kadar sonra.
    this.iptal(bekleyen.kimlik);
    this.bekleyen.delete(olayId);
    const hedefZaman = bekleyen.kurulmaZamani + yeni;
    const kalan = Math.max(0, hedefZaman - this.gecenSure());
    this.kurHam(olay, kalan, bekleyen.kurulmaZamani);
    this.duyur();
  }

  /** Olayı zamanlayıcıya bağlar. Aynı olayın bekleyen zamanlayıcısı varsa iptal eder. */
  private kur(olay: Olay, _gecikme: number): void {
    this.kurHam(olay, this.gecikmeAl(olay.id), this.gecenSure());
  }

  private kurHam(olay: Olay, kalan: number, kurulmaZamani: number): void {
    const eski = this.bekleyen.get(olay.id);
    if (eski !== undefined) this.iptal(eski.kimlik);

    const hedefZaman = this.gecenSure() + kalan;
    const kimlik = this.zamanla(() => {
      this.bekleyen.delete(olay.id);
      this.ates(olay, "otomatik");
    }, kalan);

    this.bekleyen.set(olay.id, { kimlik, hedefZaman, kurulmaZamani });
  }

  private ates(olay: Olay, kaynak: Kaynak): void {
    // Elle tetik bekleyen zamanlayıcıyı ezer (CLAUDE.md §2.5).
    const bekleyen = this.bekleyen.get(olay.id);
    if (bekleyen !== undefined) {
      this.iptal(bekleyen.kimlik);
      this.bekleyen.delete(olay.id);
    }

    this.kayitlar.push({ olayId: olay.id, zaman: this.gecenSure(), kaynak });
    this.onAksiyon(olay, kaynak);

    // Zincir buradan devam eder. Zaten gerçekleşmiş olay otomatik olarak
    // tekrar kurulmaz — sette çift bildirim/çift post olmaz.
    for (const sonraki of this.zincir.get(olay.id) ?? []) {
      if (sonraki.tetik.tur !== "sonra") continue;
      if (this.tetiklendiMi(sonraki.id)) continue;
      this.kur(sonraki, sonraki.tetik.gecikme);
    }

    this.duyur();
  }

  private duyur(): void {
    for (const dinleyici of this.aboneler) dinleyici();
  }
}
