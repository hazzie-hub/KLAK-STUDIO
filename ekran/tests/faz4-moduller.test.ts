import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { RIHTIM, UYGULAMALAR } from "../src/modules/anaekran/uygulamalar";
import { IcerikSchema, KonumVerisiSchema, ModulSchema, SahneSchema } from "../src/schema";

const KOK = join(import.meta.dirname, "..");
const oku = (yol: string) => JSON.parse(readFileSync(join(KOK, yol), "utf-8")) as unknown;
const klasor = (ad: string) =>
  readdirSync(join(KOK, "content", ad))
    .filter((d) => d.endsWith(".json"))
    .sort()
    .map((d) => oku(`content/${ad}/${d}`));

const icerikler = klasor("icerikler").map((i) => IcerikSchema.parse(i));
const sahneler = klasor("sahneler").map((s) => SahneSchema.parse(s));
const konumlar = icerikler.filter((i) => i.tur === "konum");
const fotograflar = icerikler.filter((i) => i.tur === "foto");

describe("konum şeması (harita)", () => {
  const gecerli = { ad: "Bir yer", pin: { x: 0.5, y: 0.5 } };

  it("en az ad ve pin ile geçerli, desen varsayılanı şehir", () => {
    const v = KonumVerisiSchema.parse(gecerli);
    expect(v.desen).toBe("sehir");
    expect(v.rota).toEqual([]);
  });

  it("pin harita dışına çıkamaz", () => {
    expect(KonumVerisiSchema.safeParse({ ...gecerli, pin: { x: 1.4, y: 0.5 } }).success).toBe(false);
    expect(KonumVerisiSchema.safeParse({ ...gecerli, pin: { x: -0.1, y: 0.5 } }).success).toBe(false);
  });

  it("tanınmayan desen kabul edilmez", () => {
    expect(KonumVerisiSchema.safeParse({ ...gecerli, desen: "uzay" }).success).toBe(false);
  });

  it("adsız konum kabul edilmez — kartta boş başlık görünmesin", () => {
    expect(KonumVerisiSchema.safeParse({ ...gecerli, ad: "" }).success).toBe(false);
  });

  it("içerikteki konumların rotası ya yok ya da en az iki nokta", () => {
    for (const konum of konumlar) {
      const uzunluk = konum.veri.rota.length;
      expect(uzunluk === 0 || uzunluk >= 2).toBe(true);
    }
  });

  it("rotanın son noktası pine yakın — rota başka yere gitmesin", () => {
    for (const konum of konumlar) {
      if (konum.veri.rota.length === 0) continue;
      const son = konum.veri.rota.at(-1)!;
      const uzaklik = Math.hypot(son.x - konum.veri.pin.x, son.y - konum.veri.pin.y);
      expect({ konum: konum.id, yakin: uzaklik < 0.12 }).toEqual({ konum: konum.id, yakin: true });
    }
  });
});

describe("ana ekran uygulamaları", () => {
  it("her uygulama gerçek bir modüle işaret ediyor", () => {
    const moduller = new Set(ModulSchema.options);
    for (const u of UYGULAMALAR) expect(moduller.has(u.modul)).toBe(true);
  });

  it("dokunuş noktaları benzersiz", () => {
    const hedefler = UYGULAMALAR.map((u) => u.hedef);
    expect(new Set(hedefler).size).toBe(hedefler.length);
  });

  it("aynı modül iki kez listelenmiyor", () => {
    const moduller = UYGULAMALAR.map((u) => u.modul);
    expect(new Set(moduller).size).toBe(moduller.length);
  });

  it("rıhtımdaki her modülün bir uygulaması var", () => {
    for (const m of RIHTIM) {
      expect(UYGULAMALAR.some((u) => u.modul === m)).toBe(true);
    }
  });

  it("renkler geçerli", () => {
    for (const u of UYGULAMALAR) expect(u.renk).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("Faz 4 modüllerinin içeriği", () => {
  it("galeri gösterecek kadar fotoğraf var", () => {
    expect(fotograflar.length).toBeGreaterThanOrEqual(3);
  });

  it("en az bir konum tanımlı", () => {
    expect(konumlar.length).toBeGreaterThan(0);
  });

  it("ana ekranla açılan bir sahne var", () => {
    expect(sahneler.some((s) => s.baslangic.modul === "anaekran")).toBe(true);
  });

  it("haritaya derin link veren olayın hedefi gerçekten bir konum", () => {
    const konumIdleri = new Set(konumlar.map((k) => k.id));
    for (const s of sahneler) {
      for (const o of s.olaylar) {
        if (o.aksiyon.tur !== "ekranAc" || o.aksiyon.modul !== "harita") continue;
        if (o.aksiyon.icerikRef === undefined) continue;
        expect(konumIdleri.has(o.aksiyon.icerikRef)).toBe(true);
      }
    }
  });

  it("galeriye derin link veren olayın hedefi gerçekten bir fotoğraf", () => {
    const fotoIdleri = new Set(fotograflar.map((f) => f.id));
    for (const s of sahneler) {
      for (const o of s.olaylar) {
        if (o.aksiyon.tur !== "ekranAc" || o.aksiyon.modul !== "galeri") continue;
        if (o.aksiyon.icerikRef === undefined) continue;
        expect(fotoIdleri.has(o.aksiyon.icerikRef)).toBe(true);
      }
    }
  });
});
