import {
  BaglantiProfiliSchema,
  GorselYuklemeSchema,
  PilSchema,
} from "@/schema";
import type { GorunenDurum } from "@/shell/gorunen-durum";

/**
 * Adres çubuğundan durum ezme — SADECE test/önizleme içindir.
 * `?skin=` ile aynı mantık: sahneyi değiştirmeden davranışı denemek.
 * Gizli panel (Adım 6) aynı işi sette yapacak.
 *
 * Geçersiz değerler sessizce yok sayılır; sahne asla bozulmaz (CLAUDE.md §2.6).
 */
export type Aramalar = Record<string, string | string[] | undefined>;

export function tekDeger(a: Aramalar, ad: string): string | undefined {
  const d = a[ad];
  return Array.isArray(d) ? d[0] : d;
}

export function durumEzmeleri(aramalar: Aramalar, temel: GorunenDurum): GorunenDurum {
  const sonuc: GorunenDurum = { ...temel };

  const baglanti = BaglantiProfiliSchema.safeParse(tekDeger(aramalar, "baglanti"));
  if (baglanti.success) sonuc.baglanti = baglanti.data;

  const gorsel = GorselYuklemeSchema.safeParse(tekDeger(aramalar, "gorsel"));
  if (gorsel.success) sonuc.gorsel = gorsel.data;

  const pilMetni = tekDeger(aramalar, "pil");
  if (pilMetni !== undefined) {
    const pil = PilSchema.safeParse(Number(pilMetni));
    if (pil.success) sonuc.pil = pil.data;
  }

  const sarjda = tekDeger(aramalar, "sarjda");
  if (sarjda === "1") sonuc.sarjda = true;
  if (sarjda === "0") sonuc.sarjda = false;

  const saat = tekDeger(aramalar, "saat");
  if (saat !== undefined && /^([01]\d|2[0-3]):[0-5]\d$/.test(saat)) sonuc.saat = saat;

  const tarih = tekDeger(aramalar, "tarih");
  if (tarih !== undefined && tarih.trim() !== "") sonuc.tarih = tarih;

  return sonuc;
}
