import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { CihazSchema, SahneSchema, type Cihaz, type Sahne } from "../src/schema";
import { gorunenDurum, skinSec, temalar } from "../src/shell";

const KOK = join(import.meta.dirname, "..");
const oku = (yol: string) => JSON.parse(readFileSync(join(KOK, yol), "utf-8")) as unknown;

const sahne = (): Sahne => SahneSchema.parse(oku("content/sahneler/eg-b03-s58.json"));
const cihaz = (): Cihaz => CihazSchema.parse(oku("content/cihazlar/nergis-pc.json"));

describe("skinSec — ?skin= ile kabuk ezme (CLAUDE.md §3.1)", () => {
  it("cihazın kabuğunu kullanır", () => {
    expect(skinSec(undefined, "desktop")).toBe("desktop");
  });

  it("?skin= cihazınkini ezer", () => {
    expect(skinSec("android", "desktop")).toBe("android");
    expect(skinSec("ios", "desktop")).toBe("ios");
  });

  it("geçersiz ?skin= sahneyi bozmaz, cihazınkine düşer", () => {
    const sessiz = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(skinSec("iphone", "android")).toBe("android");
    sessiz.mockRestore();
  });

  it("cihaz da yoksa yedek kabuğa düşer", () => {
    expect(skinSec(undefined, undefined)).toBe("ios");
  });
});

describe("gorunenDurum — açılış durumu", () => {
  it("sahne değerleri cihazın varsayılanını ezer", () => {
    const s = sahne();
    s.durum.pil = 12;
    s.durum.saat = "07:30";
    const d = gorunenDurum(s, cihaz());
    expect(d.pil).toBe(12);
    expect(d.saat).toBe("07:30");
  });

  it("sahnede yoksa cihazın varsayılanına düşer", () => {
    // nergis-pc.json saati "21:04" olarak tutar
    expect(gorunenDurum(sahne(), cihaz()).saat).toBe("21:04");
  });

  it("ikisi de yoksa sabit yedeğe düşer", () => {
    const d = gorunenDurum(sahne(), null);
    expect(d.saat).toBe("21:04");
    expect(typeof d.pil).toBe("number");
  });

  it("bağlantı ve görsel profilini sahneden taşır", () => {
    const s = sahne();
    s.durum.baglanti = "yavas";
    s.durum.gorsel = "yuklenmez";
    const d = gorunenDurum(s, cihaz());
    expect(d.baglanti).toBe("yavas");
    expect(d.gorsel).toBe("yuklenmez");
  });

  it("DETERMİNİSTİK: aynı girdi her çağrıda aynı çıktıyı verir (CLAUDE.md §2.4)", () => {
    const s = sahne();
    const c = cihaz();
    expect(gorunenDurum(s, c)).toEqual(gorunenDurum(s, c));
  });

  it("saat gerçek saatten OKUNMAZ", () => {
    // Sistem saatini değiştirsek bile sahnenin saati sabit kalmalı.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T03:33:00Z"));
    expect(gorunenDurum(sahne(), cihaz()).saat).toBe("21:04");
    vi.useRealTimers();
  });
});

describe("temalar — her kabuğun CSS değişkenleri var", () => {
  it("üç kabuk da tanımlı", () => {
    expect(Object.keys(temalar).sort()).toEqual(["android", "desktop", "ios"]);
  });

  it("her kabukta aynı değişken kümesi var", () => {
    const anahtarlar = Object.keys(temalar.ios).sort();
    expect(Object.keys(temalar.android).sort()).toEqual(anahtarlar);
    expect(Object.keys(temalar.desktop).sort()).toEqual(anahtarlar);
  });

  it("CLAUDE.md §4: iOS Inter, Android Roboto kullanır; SF Pro geçmez", () => {
    expect(temalar.ios["--yazi-tipi"]).toContain("font-inter");
    expect(temalar.android["--yazi-tipi"]).toContain("font-roboto");
    for (const t of Object.values(temalar)) {
      expect(JSON.stringify(t).toLowerCase()).not.toContain("sf pro");
    }
  });
});
