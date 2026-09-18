/**
 * Sanal saat: testler gerçek zamanı beklemez, `ilerlet` ile zaman atlanır.
 * Motorun determinizmini ölçmenin tek dürüst yolu bu.
 */
type Kayit = { kimlik: number; zaman: number; calistir: () => void };

export class SahteSaat {
  private t = 0;
  private sira: Kayit[] = [];
  private sonrakiKimlik = 1;

  simdi = (): number => this.t;

  zamanla = (calistir: () => void, ms: number): unknown => {
    const kimlik = this.sonrakiKimlik++;
    this.sira.push({ kimlik, zaman: this.t + ms, calistir });
    return kimlik;
  };

  iptal = (kimlik: unknown): void => {
    this.sira = this.sira.filter((k) => k.kimlik !== kimlik);
  };

  /** Zamanı ilerletir ve sırası gelen zamanlayıcıları sırayla çalıştırır. */
  ilerlet(ms: number): void {
    const hedef = this.t + ms;
    for (;;) {
      const siradaki = this.sira
        .filter((k) => k.zaman <= hedef)
        .sort((a, b) => a.zaman - b.zaman || a.kimlik - b.kimlik)[0];
      if (siradaki === undefined) break;
      this.sira = this.sira.filter((k) => k.kimlik !== siradaki.kimlik);
      this.t = siradaki.zaman;
      siradaki.calistir();
    }
    this.t = hedef;
  }

  get bekleyenSayisi(): number {
    return this.sira.length;
  }
}
