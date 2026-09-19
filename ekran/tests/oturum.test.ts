import { describe, expect, it } from "vitest";

import {
  OTURUM_CEREZI,
  VARSAYILAN_PAROLA,
  jetonEsit,
  oturumJetonu,
  parolaAl,
  parolaVarsayilanMi,
  serbestAdresMi,
} from "../src/studio/oturum";

/**
 * Stüdyo girişi. CLAUDE.md §8
 *
 * En kritik kural en üstte: sette parola sorulmaz. Oynatıcı ve kumanda
 * korumanın DIŞINDA kalmalı, yoksa çekim durur.
 */
describe("giriş hangi adresleri korur", () => {
  it("oynatıcı ve kumanda ASLA korunmaz — sette parola sorulamaz", () => {
    expect(serbestAdresMi("/p/eg-b03-s58")).toBe(true);
    expect(serbestAdresMi("/k/eg-b03-s58")).toBe(true);
    expect(serbestAdresMi("/p/eg-b03-s62?skin=android")).toBe(true);
  });

  it("oynatıcının internetsiz çalışması için gereken dosyalar serbest", () => {
    for (const yol of [
      "/sw.js",
      "/manifest.webmanifest",
      "/_next/static/chunks/main.js",
      "/ornek/kahve.svg",
      "/avatar/nergis.svg",
      "/duvar/gece.svg",
      "/icon.svg",
    ]) {
      expect(serbestAdresMi(yol), yol).toBe(true);
    }
  });

  it("giriş sayfasının kendisi serbest — yoksa sonsuz yönlendirme olur", () => {
    expect(serbestAdresMi("/giris")).toBe(true);
  });

  it("stüdyo ve operatör sayfaları korunur — senaryo içeriği gizli", () => {
    for (const yol of [
      "/",
      "/sahneler",
      "/studio",
      "/studio/dizi/eg",
      "/studio/eg-b03-s58",
      "/studio/eg-b03-s58/duzenle",
      "/studio/yeni",
    ]) {
      expect(serbestAdresMi(yol), yol).toBe(false);
    }
  });

  it("benzer görünen adresler korumayı deleMEZ", () => {
    expect(serbestAdresMi("/studio/p/gizli")).toBe(false);
    expect(serbestAdresMi("/pano")).toBe(false);
    expect(serbestAdresMi("/kumanda")).toBe(false);
  });
});

describe("oturum jetonu", () => {
  it("çerezde parola değil, imzası durur", async () => {
    const jeton = await oturumJetonu("gizli-parola");
    expect(jeton).not.toContain("gizli-parola");
    expect(jeton).toMatch(/^[0-9a-f]{64}$/);
  });

  it("aynı parola her zaman aynı jetonu verir — sunucu ve middleware aynı sonucu bulmalı", async () => {
    expect(await oturumJetonu("aynı")).toBe(await oturumJetonu("aynı"));
  });

  it("parola değişince eski jeton geçersizleşir", async () => {
    expect(await oturumJetonu("eski")).not.toBe(await oturumJetonu("yeni"));
  });

  it("jeton karşılaştırması uzunluk ve içerik farkını yakalar", () => {
    expect(jetonEsit("abc", "abc")).toBe(true);
    expect(jetonEsit("abc", "abd")).toBe(false);
    expect(jetonEsit("abc", "abcd")).toBe(false);
    expect(jetonEsit("", "")).toBe(true);
  });
});

describe("parola kaynağı", () => {
  it("ortam değişkeni varsa o geçerli", () => {
    const onceki = process.env.STUDIO_PAROLA;
    process.env.STUDIO_PAROLA = "kuruluma-ozel";
    try {
      expect(parolaAl()).toBe("kuruluma-ozel");
      expect(parolaVarsayilanMi()).toBe(false);
    } finally {
      if (onceki === undefined) delete process.env.STUDIO_PAROLA;
      else process.env.STUDIO_PAROLA = onceki;
    }
  });

  it("ortam değişkeni yoksa varsayılan geçerli ve bu görünür biçimde bildirilir", () => {
    const onceki = process.env.STUDIO_PAROLA;
    delete process.env.STUDIO_PAROLA;
    try {
      expect(parolaAl()).toBe(VARSAYILAN_PAROLA);
      expect(parolaVarsayilanMi()).toBe(true);
    } finally {
      if (onceki !== undefined) process.env.STUDIO_PAROLA = onceki;
    }
  });

  it("boş ortam değişkeni parolayı boşaltmaz", () => {
    const onceki = process.env.STUDIO_PAROLA;
    process.env.STUDIO_PAROLA = "";
    try {
      expect(parolaAl()).toBe(VARSAYILAN_PAROLA);
    } finally {
      if (onceki === undefined) delete process.env.STUDIO_PAROLA;
      else process.env.STUDIO_PAROLA = onceki;
    }
  });

  it("çerez adı sabit — değişirse herkesin oturumu düşer", () => {
    expect(OTURUM_CEREZI).toBe("klak_oturum");
  });
});
