import { describe, expect, it } from "vitest";

import { DokunusSayaci, koseIcinde } from "../src/platform/dokunus-sayaci";

describe("DokunusSayaci — 2 saniye içinde 5 dokunuş (CLAUDE.md §6)", () => {
  it("hızlı 5 dokunuşta açılır", () => {
    const s = new DokunusSayaci();
    expect([0, 200, 400, 600].map((t) => s.dokun(t))).toEqual([false, false, false, false]);
    expect(s.dokun(800)).toBe(true);
  });

  it("4 dokunuş yetmez", () => {
    const s = new DokunusSayaci();
    for (const t of [0, 200, 400]) s.dokun(t);
    expect(s.dokun(600)).toBe(false);
    expect(s.sayi).toBe(4);
  });

  it("YAVAŞ yapılan 5 dokunuş açmaz — pencere 2 saniye", () => {
    const s = new DokunusSayaci();
    // 600 ms aralıklarla: son dokunuşta ilk dokunuş pencereden çıkmış olur
    expect([0, 600, 1200, 1800].map((t) => s.dokun(t))).toEqual([false, false, false, false]);
    expect(s.dokun(2400)).toBe(false);
  });

  it("araya uzun boşluk girerse baştan sayar", () => {
    const s = new DokunusSayaci();
    s.dokun(0);
    s.dokun(100);
    s.dokun(5_000); // pencere kaydı, önceki ikisi düştü
    expect(s.sayi).toBe(1);
  });

  it("açıldıktan sonra sayaç sıfırlanır — bir sonraki için yine 5 gerekir", () => {
    const s = new DokunusSayaci();
    for (const t of [0, 100, 200, 300]) s.dokun(t);
    expect(s.dokun(400)).toBe(true);
    expect(s.sayi).toBe(0);
    expect(s.dokun(500)).toBe(false);
  });

  it("sifirla sayacı boşaltır (kaydırma algılanınca kullanılır)", () => {
    const s = new DokunusSayaci();
    s.dokun(0);
    s.dokun(100);
    s.sifirla();
    expect(s.sayi).toBe(0);
  });

  it("eşik ve pencere ayarlanabilir", () => {
    const s = new DokunusSayaci(3, 500);
    expect([0, 100].map((t) => s.dokun(t))).toEqual([false, false]);
    expect(s.dokun(200)).toBe(true);
  });
});

describe("koseIcinde — sadece köşedeki dokunuşlar sayılır", () => {
  const alan = { sol: 0, ust: 0, genislik: 390, yukseklik: 844 };

  it("sağ üst köşeyi tanır", () => {
    expect(koseIcinde({ x: 380, y: 10 }, alan, "sagUst")).toBe(true);
    expect(koseIcinde({ x: 330, y: 60 }, alan, "sagUst")).toBe(true);
  });

  it("sol üst köşeyi tanır", () => {
    expect(koseIcinde({ x: 10, y: 10 }, alan, "solUst")).toBe(true);
  });

  it("ekranın ortası köşe SAYILMAZ", () => {
    expect(koseIcinde({ x: 195, y: 400 }, alan, "sagUst")).toBe(false);
    expect(koseIcinde({ x: 195, y: 400 }, alan, "solUst")).toBe(false);
  });

  it("karşı köşeler birbirine karışmaz", () => {
    expect(koseIcinde({ x: 10, y: 10 }, alan, "sagUst")).toBe(false);
    expect(koseIcinde({ x: 380, y: 10 }, alan, "solUst")).toBe(false);
  });

  it("köşenin hemen altı sayılmaz", () => {
    expect(koseIcinde({ x: 380, y: 120 }, alan, "sagUst")).toBe(false);
  });

  it("önizleme çerçevesi gibi kaydırılmış alanda da doğru çalışır", () => {
    const kaydirilmis = { sol: 300, ust: 120, genislik: 390, yukseklik: 844 };
    expect(koseIcinde({ x: 680, y: 130 }, kaydirilmis, "sagUst")).toBe(true);
    expect(koseIcinde({ x: 310, y: 130 }, kaydirilmis, "solUst")).toBe(true);
    expect(koseIcinde({ x: 310, y: 130 }, kaydirilmis, "sagUst")).toBe(false);
  });
});
