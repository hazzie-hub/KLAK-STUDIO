import { describe, expect, it, vi } from "vitest";

import { NonceDefteri, mesajCoz, nonceUret } from "../src/kumanda/mesaj";

const temel = { nonce: "abc123def", zaman: 1_700_000_000_000 };

describe("mesajCoz — ağdan gelen veriye güvenilmez", () => {
  it("geçerli mesajı çözer", () => {
    const m = mesajCoz({ tur: "tetikle", olayId: "ilk-mesaj", ...temel });
    expect(m).toMatchObject({ tur: "tetikle", olayId: "ilk-mesaj" });
  });

  it("bilinmeyen türü reddeder", () => {
    const sessiz = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(mesajCoz({ tur: "sil-her-seyi", ...temel })).toBeNull();
    sessiz.mockRestore();
  });

  it("fazladan alan taşıyan mesajı reddeder", () => {
    const sessiz = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(mesajCoz({ tur: "basaSar", ...temel, ekstra: "kotu" })).toBeNull();
    sessiz.mockRestore();
  });

  it("bozuk olay id'sini reddeder", () => {
    const sessiz = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(mesajCoz({ tur: "tetikle", olayId: "Büyük Harf", ...temel })).toBeNull();
    sessiz.mockRestore();
  });

  it("sınır dışı gecikmeyi reddeder", () => {
    const sessiz = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(mesajCoz({ tur: "gecikme", olayId: "a", gecikme: -1, ...temel })).toBeNull();
    expect(mesajCoz({ tur: "gecikme", olayId: "a", gecikme: 999_999_999, ...temel })).toBeNull();
    sessiz.mockRestore();
  });

  it("sınır dışı pil değerini reddeder", () => {
    const sessiz = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(mesajCoz({ tur: "durum", pil: 500, ...temel })).toBeNull();
    sessiz.mockRestore();
  });

  it("metin yerine çöp gelirse çökmez", () => {
    const sessiz = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const cop of [null, undefined, 42, "merhaba", [], { a: 1 }]) {
      expect(mesajCoz(cop)).toBeNull();
    }
    sessiz.mockRestore();
  });
});

describe("NonceDefteri — aynı mesaj iki kez uygulanmaz (CLAUDE.md §6)", () => {
  it("ilk görüşte kabul, ikincide ret", () => {
    const d = new NonceDefteri();
    expect(d.yeniMi("x")).toBe(true);
    expect(d.yeniMi("x")).toBe(false);
    expect(d.yeniMi("x")).toBe(false);
  });

  it("farklı nonce'lar birbirini etkilemez", () => {
    const d = new NonceDefteri();
    expect(d.yeniMi("a")).toBe(true);
    expect(d.yeniMi("b")).toBe(true);
    expect(d.yeniMi("a")).toBe(false);
  });

  it("sınırsız büyümez — sette saatlerce açık kalır", () => {
    const d = new NonceDefteri(10);
    for (let i = 0; i < 100; i++) d.yeniMi(`n${i}`);
    expect(d.boyut).toBeLessThanOrEqual(10);
    // En eskiler düştüğü için tekrar kabul edilir; bu kabul edilebilir,
    // çünkü aynı mesajın 100 mesaj sonra tekrar gelmesi gerçekçi değil.
    expect(d.yeniMi("n99")).toBe(false);
  });
});

describe("nonceUret", () => {
  it("her seferinde farklı ve şemaya uygun", () => {
    const uretilen = new Set(Array.from({ length: 200 }, () => nonceUret()));
    expect(uretilen.size).toBe(200);
    for (const n of uretilen) {
      expect(n.length).toBeGreaterThanOrEqual(6);
      expect(n.length).toBeLessThanOrEqual(64);
    }
  });
});
