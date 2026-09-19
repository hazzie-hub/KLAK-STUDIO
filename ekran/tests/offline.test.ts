import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { cihazOku, sahneVarliklari, tumHesaplar, tumIcerikler, tumSahneKodlari } from "../src/icerik/yukle";

const KOK = join(import.meta.dirname, "..");

describe("sahneVarliklari — sette ne indirilecek (CLAUDE.md §2.3)", () => {
  it("tüm post görsellerini, fotoğrafları ve avatarları listeler", () => {
    const varliklar = sahneVarliklari(cihazOku("nergis-telefon"));
    const icerikler = tumIcerikler();

    // Post ve foto görselleri aynı klasörde; aynı dosyayı paylaşabilirler,
    // bu yüzden benzersiz dosya adı üzerinden sayıyoruz.
    const beklenenGorseller = new Set(
      icerikler.flatMap((i) =>
        i.tur === "post" ? [i.veri.gorsel] : i.tur === "foto" ? [i.veri.dosya] : [],
      ),
    );
    const avatarSayisi = new Set(
      tumHesaplar().flatMap((h) => (h.avatar === undefined ? [] : [h.avatar])),
    ).size;

    expect(varliklar.filter((v) => v.startsWith("/ornek/"))).toHaveLength(beklenenGorseller.size);
    expect(varliklar.filter((v) => v.startsWith("/avatar/"))).toHaveLength(avatarSayisi);
  });

  it("cihazın duvar kâğıdını da ekler", () => {
    expect(sahneVarliklari(cihazOku("nergis-telefon"))).toContain("/duvar/gece-sahil.svg");
    expect(sahneVarliklari(cihazOku("sezai-telefon"))).toContain("/duvar/sabah-tepe.svg");
  });

  it("cihaz yoksa çökmez", () => {
    expect(() => sahneVarliklari(null)).not.toThrow();
    expect(sahneVarliklari(null).length).toBeGreaterThan(0);
  });

  it("aynı dosyayı iki kez listelemez", () => {
    const v = sahneVarliklari(cihazOku("nergis-telefon"));
    expect(new Set(v).size).toBe(v.length);
  });

  it("LİSTELENEN HER DOSYA GERÇEKTEN VAR — sette eksik varlık olmasın", () => {
    for (const cihazKodu of ["nergis-telefon", "sezai-telefon", "nergis-pc"]) {
      for (const yol of sahneVarliklari(cihazOku(cihazKodu))) {
        expect(existsSync(join(KOK, "public", yol)), `eksik: ${yol}`).toBe(true);
      }
    }
  });
});

describe("service worker yapılandırması", () => {
  const config = readFileSync(join(KOK, "next.config.mjs"), "utf-8");

  it("geliştirme sırasında kapalı — yoksa değişiklikler görünmez", () => {
    expect(config).toContain('disable: process.env.NODE_ENV === "development"');
  });

  it("sahne sayfaları ve /public varlıkları önbelleğe ekleniyor", () => {
    expect(config).toContain("genelVarliklar()");
    expect(config).toContain("sahneSayfalari()");
  });

  it("sahne dosyası değişince önbellek yenilensin diye içerik özeti alınıyor", () => {
    expect(config).toContain("createHash");
  });
});

describe("PWA manifesti — CLAUDE.md §4", () => {
  it("standalone modda açılır (tarayıcı çubuğu görünmez)", () => {
    const m = readFileSync(join(KOK, "app/manifest.ts"), "utf-8");
    expect(m).toContain('display: "standalone"');
  });

  it("iOS için ana ekran desteği bildirilmiş", () => {
    const layout = readFileSync(join(KOK, "app/layout.tsx"), "utf-8");
    expect(layout).toContain("appleWebApp");
  });
});

describe("sahne sayfaları", () => {
  it("her sahne dosyası için bir sayfa üretiliyor", () => {
    const dosyalar = readdirSync(join(KOK, "content/sahneler")).filter((d) => d.endsWith(".json"));
    expect(tumSahneKodlari()).toHaveLength(dosyalar.length);
  });
});
