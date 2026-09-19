import { markalar } from "@brands";
import type { Modul } from "@/schema";

/**
 * Ana ekrandaki uygulamalar. CLAUDE.md §3.2
 *
 * Adlar ve renkler markalardan gelir; marka tanımlı olmayanlar Türk
 * telefonlarındaki yerleşik uygulamaların JENERİK adlarını kullanır
 * (Telefon, Galeri, Harita). Gerçek marka adı hiçbir zaman yazılmaz.
 */
export type Uygulama = {
  modul: Modul;
  /** Modülün açılacağı ekran. */
  ekran: string;
  ad: string;
  renk: string;
  /** Dokunuş noktası adı — sahne buna tetik bağlayabilir. */
  hedef: string;
};

export const UYGULAMALAR: readonly Uygulama[] = [
  { modul: "telefon", ekran: "gecmis", ad: "Telefon", renk: "#2e8b57", hedef: "anaekran-telefon" },
  { modul: "mesaj", ekran: "liste", ad: markalar.mesaj.ad, renk: markalar.mesaj.renk, hedef: "anaekran-mesaj" },
  { modul: "sosyal", ekran: "feed", ad: markalar.akis.ad, renk: markalar.akis.renk, hedef: "anaekran-sosyal" },
  { modul: "arama", ekran: "ana", ad: markalar.look.ad, renk: markalar.look.renk, hedef: "anaekran-arama" },
  { modul: "galeri", ekran: "izgara", ad: "Galeri", renk: "#b8742f", hedef: "anaekran-galeri" },
  { modul: "harita", ekran: "harita", ad: "Harita", renk: "#3f7a8c", hedef: "anaekran-harita" },
];

/** Alt çubuktaki sabit uygulamalar — gerçek telefonlarda da dört tanedir. */
export const RIHTIM: readonly Modul[] = ["telefon", "mesaj", "sosyal", "arama"];
