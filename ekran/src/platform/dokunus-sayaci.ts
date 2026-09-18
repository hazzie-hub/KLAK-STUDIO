/**
 * "2 saniye içinde 5 dokunuş" sayacı. CLAUDE.md §6
 *
 * Kayan pencere: en son dokunuştan geriye doğru `pencere` ms içindeki
 * dokunuşlar sayılır. Yavaş yapılan 5 dokunuş paneli AÇMAZ — sette
 * oyuncunun normal kullanımı yanlışlıkla tetiklemesin diye.
 */
export class DokunusSayaci {
  private zamanlar: number[] = [];

  constructor(
    private readonly gerekli = 5,
    private readonly pencere = 2000,
  ) {}

  /** Bir dokunuş ekler. Eşiğe ulaşıldıysa `true` döner ve sayaç sıfırlanır. */
  dokun(zaman: number): boolean {
    this.zamanlar = this.zamanlar.filter((z) => zaman - z < this.pencere);
    this.zamanlar.push(zaman);

    if (this.zamanlar.length >= this.gerekli) {
      this.zamanlar = [];
      return true;
    }
    return false;
  }

  sifirla(): void {
    this.zamanlar = [];
  }

  get sayi(): number {
    return this.zamanlar.length;
  }
}

/** Nokta, dikdörtgenin verilen köşesindeki kare alanın içinde mi? */
export function koseIcinde(
  nokta: { x: number; y: number },
  alan: { sol: number; ust: number; genislik: number; yukseklik: number },
  kose: "sagUst" | "solUst",
  boyut = 70,
): boolean {
  const ustSinir = alan.ust + boyut;
  if (nokta.y < alan.ust || nokta.y > ustSinir) return false;

  if (kose === "solUst") {
    return nokta.x >= alan.sol && nokta.x <= alan.sol + boyut;
  }
  const sag = alan.sol + alan.genislik;
  return nokta.x <= sag && nokta.x >= sag - boyut;
}
