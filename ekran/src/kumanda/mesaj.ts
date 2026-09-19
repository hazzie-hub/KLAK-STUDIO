import { z } from "zod";

import { BaglantiProfiliSchema, GorselYuklemeSchema, PilSchema, SlugSchema } from "@/schema";

/**
 * Kumanda ↔ Oynatıcı mesajları. CLAUDE.md §6
 *
 * Mesajlar KÜÇÜK ve İDEMPOTENT: her mesajın bir `nonce`'u var, oynatıcı aynı
 * nonce'u iki kez uygularmaz. Zayıf sahada mesaj iki kez gelirse olay iki kez
 * tetiklenmez.
 *
 * Gelen her mesaj şemadan geçirilir — ağdan gelen veriye güvenilmez.
 */

const Temel = {
  nonce: z.string().min(6).max(64),
  zaman: z.number().int().nonnegative(),
};

export const KumandaMesajiSchema = z.discriminatedUnion("tur", [
  /** Kumanda → Oynatıcı: şu olayı şimdi tetikle. */
  z.strictObject({ tur: z.literal("tetikle"), olayId: SlugSchema, ...Temel }),

  /** Kumanda → Oynatıcı: başa sar. */
  z.strictObject({ tur: z.literal("basaSar"), ...Temel }),

  /** Kumanda → Oynatıcı: bir olayın gecikmesini ayarla. */
  z.strictObject({
    tur: z.literal("gecikme"),
    olayId: SlugSchema,
    gecikme: z.number().int().min(0).max(600000),
    ...Temel,
  }),

  /** Kumanda → Oynatıcı: cihaz durumunu değiştir. */
  z.strictObject({
    tur: z.literal("durum"),
    baglanti: BaglantiProfiliSchema.optional(),
    gorsel: GorselYuklemeSchema.optional(),
    pil: PilSchema.optional(),
    sarjda: z.boolean().optional(),
    ...Temel,
  }),

  /** Kumanda → Oynatıcı: oradaysan haber ver. */
  z.strictObject({ tur: z.literal("yoklama"), ...Temel }),

  /** Oynatıcı → Kumanda: buradayım, durumum bu. */
  z.strictObject({
    tur: z.literal("buradayim"),
    sahneKodu: z.string(),
    /** Gerçekleşen olay id'leri, sırayla. */
    olanlar: z.array(z.string()).max(200),
    /** Sıradaki olay ve kaç ms sonra ateşleneceği. */
    siradaki: z.strictObject({ olayId: z.string(), kalan: z.number().int() }).nullable(),
    /** Olayların GEÇERLİ gecikmeleri — panelden/kumandadan ayarlanmış hâli. */
    gecikmeler: z.record(z.string(), z.number().int().min(0)),
    pil: z.number().int().min(0).max(100),
    ...Temel,
  }),
]);

export type KumandaMesaji = z.infer<typeof KumandaMesajiSchema>;

/**
 * `nonce` ve `zaman` olmadan mesaj — gönderen taraf bunları kendisi ekler.
 * Doğrudan `Omit<KumandaMesaji, ...>` birleşimi düzleştirdiği için dağıtan bir
 * biçim gerekiyor.
 */
type DagitanOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type MesajGirdisi = DagitanOmit<KumandaMesaji, "nonce" | "zaman">;

/** Her mesaj için benzersiz, tahmin edilebilirliği önemsiz bir etiket. */
export function nonceUret(): string {
  const g = globalThis.crypto;
  if (g !== undefined && typeof g.randomUUID === "function") return g.randomUUID();
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/** Gelen ham veriyi mesaja çevirir; geçersizse null. */
export function mesajCoz(ham: unknown): KumandaMesaji | null {
  const r = KumandaMesajiSchema.safeParse(ham);
  if (!r.success) {
    console.error("[ekran] Geçersiz kumanda mesajı yok sayıldı:", r.error.issues[0]?.message);
    return null;
  }
  return r.data;
}

/**
 * Aynı mesajın iki kez uygulanmasını önler.
 * Sınırlı boyutta tutulur — sette saatlerce açık kalabilir.
 */
export class NonceDefteri {
  private gorulen = new Set<string>();
  private sira: string[] = [];

  constructor(private readonly enFazla = 400) {}

  /** Daha önce görülmediyse kaydeder ve true döner. */
  yeniMi(nonce: string): boolean {
    if (this.gorulen.has(nonce)) return false;
    this.gorulen.add(nonce);
    this.sira.push(nonce);
    if (this.sira.length > this.enFazla) {
      const eski = this.sira.shift();
      if (eski !== undefined) this.gorulen.delete(eski);
    }
    return true;
  }

  get boyut(): number {
    return this.gorulen.size;
  }
}
