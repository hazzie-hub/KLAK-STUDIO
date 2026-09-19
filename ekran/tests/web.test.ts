import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { markalar, modulMarkasi } from "../brands";
import { aktifEkranTuret } from "../src/modules/aktif-ekran";
import { SABLON_RENKLERI } from "../src/modules/web/sablonlar";
import {
  HesapSchema,
  IcerikSchema,
  SahneSchema,
  WebSayfasiVerisiSchema,
  type Olay,
  type Sahne,
} from "../src/schema";

const KOK = join(import.meta.dirname, "..");
const oku = (yol: string) => JSON.parse(readFileSync(join(KOK, yol), "utf-8")) as unknown;
const klasor = (ad: string) =>
  readdirSync(join(KOK, "content", ad))
    .filter((d) => d.endsWith(".json"))
    .sort()
    .map((d) => oku(`content/${ad}/${d}`));

const icerikler = klasor("icerikler").map((i) => IcerikSchema.parse(i));
const sayfalar = icerikler.flatMap((i) => (i.tur === "webSayfasi" ? [i] : []));
const aramalar = icerikler.flatMap((i) => (i.tur === "aramaSonucu" ? [i] : []));
const sahneler = klasor("sahneler").map((s) => SahneSchema.parse(s) as Sahne);

const olay = (id: string, aksiyon: Olay["aksiyon"]): Olay =>
  ({ id, tetik: { tur: "elle" }, aksiyon }) as Olay;

describe("aktif ekran — modüller arası derin link (CLAUDE.md §3.3)", () => {
  const sahne = sahneler.find((s) => s.kod === "eg-b03-s62")!;

  it("hiç olay yokken sahnenin başlangıcı açıktır", () => {
    const aktif = aktifEkranTuret(sahne, []);
    expect(aktif.modul).toBe("arama");
    expect(aktif.ekran).toBe("ana");
  });

  it("ekranAc BAŞKA bir modüle geçebilir", () => {
    const aktif = aktifEkranTuret(sahne, [
      olay("git", { tur: "ekranAc", modul: "web", ekran: "sayfa", icerikRef: "site-kiyida-sabah" }),
    ]);
    expect(aktif.modul).toBe("web");
    expect(aktif.icerikRef).toBe("site-kiyida-sabah");
  });

  it("birden çok geçişte sonuncusu geçerlidir", () => {
    const aktif = aktifEkranTuret(sahne, [
      olay("bir", { tur: "ekranAc", modul: "web", ekran: "sayfa", icerikRef: "site-kiyida-sabah" }),
      olay("iki", { tur: "ekranAc", modul: "arama", ekran: "gorseller" }),
    ]);
    expect(aktif.modul).toBe("arama");
    expect(aktif.ekran).toBe("gorseller");
  });

  it("ekranAc dışındaki olaylar açık ekranı değiştirmez", () => {
    const aktif = aktifEkranTuret(sahne, [
      olay("pil", { tur: "pilDegisti", seviye: 12 }),
      olay("yaz", { tur: "ghostTypingBaslat", hedef: "arama-cubugu", metin: "deneme", mod: "senaryolu" }),
    ]);
    expect(aktif.modul).toBe("arama");
    expect(aktif.ekran).toBe("ana");
  });

  it("BAŞA SAR: olaylar boşalınca başlangıca döner — durum saklanmıyor", () => {
    const gezinilmis = aktifEkranTuret(sahne, [
      olay("git", { tur: "ekranAc", modul: "web", ekran: "sayfa", icerikRef: "site-gezgin-notu" }),
    ]);
    expect(gezinilmis.modul).toBe("web");
    expect(aktifEkranTuret(sahne, [])).toEqual(aktifEkranTuret(sahne, []));
    expect(aktifEkranTuret(sahne, []).modul).toBe("arama");
  });
});

describe("web sayfası şeması", () => {
  const gecerli = { sablon: "blog", siteAdi: "Site", adres: "ornekadres.com/yazi", baslik: "Başlık" };

  it("en az gerekli alanlarla geçerli", () => {
    const v = WebSayfasiVerisiSchema.parse(gecerli);
    expect(v.govde).toEqual([]);
    expect(v.menu).toEqual([]);
  });

  it("adreste http yazılmaz — adres çubuğu sahte durur", () => {
    expect(WebSayfasiVerisiSchema.safeParse({ ...gecerli, adres: "https://ornekadres.com" }).success).toBe(false);
  });

  it("adreste büyük harf ve boşluk kabul edilmez", () => {
    expect(WebSayfasiVerisiSchema.safeParse({ ...gecerli, adres: "OrnekAdres.com" }).success).toBe(false);
    expect(WebSayfasiVerisiSchema.safeParse({ ...gecerli, adres: "ornek adres.com" }).success).toBe(false);
  });

  it("uzantısız adres kabul edilmez", () => {
    expect(WebSayfasiVerisiSchema.safeParse({ ...gecerli, adres: "ornekadres" }).success).toBe(false);
  });

  it("tanınmayan şablon kabul edilmez", () => {
    expect(WebSayfasiVerisiSchema.safeParse({ ...gecerli, sablon: "dergi" }).success).toBe(false);
  });

  it("sosyal şablon tanınır — uygulamanın tarayıcıdaki hâli", () => {
    expect(WebSayfasiVerisiSchema.safeParse({ ...gecerli, sablon: "sosyal" }).success).toBe(true);
  });

  it("profil bloğu hesabı kimlikle verir — kullanıcı adı sayfaya elle yazılmaz", () => {
    const v = WebSayfasiVerisiSchema.parse({
      ...gecerli,
      govde: [{ tur: "profil", hesap: "kadikoy-kahve", takipci: 4820 }],
    });
    expect(v.govde[0]).toEqual({ tur: "profil", hesap: "kadikoy-kahve", takipci: 4820 });
  });

  it("profil bloğunda hesap zorunlu", () => {
    expect(WebSayfasiVerisiSchema.safeParse({ ...gecerli, govde: [{ tur: "profil" }] }).success).toBe(false);
  });

  it("profil sayıları negatif ya da kesirli olamaz", () => {
    const dene = (takipci: number) =>
      WebSayfasiVerisiSchema.safeParse({
        ...gecerli,
        govde: [{ tur: "profil", hesap: "kadikoy-kahve", takipci }],
      }).success;
    expect(dene(-1)).toBe(false);
    expect(dene(4.5)).toBe(false);
    expect(dene(0)).toBe(true);
  });

  it("boş ızgara kabul edilmez — kamerada boş kare görünmesin", () => {
    expect(
      WebSayfasiVerisiSchema.safeParse({ ...gecerli, govde: [{ tur: "izgara", dosyalar: [] }] }).success,
    ).toBe(false);
  });

  it("boş paragraf kabul edilmez — kamerada boş satır görünmesin", () => {
    const sonuc = WebSayfasiVerisiSchema.safeParse({
      ...gecerli,
      govde: [{ tur: "paragraf", metin: "" }],
    });
    expect(sonuc.success).toBe(false);
  });

  it("boş liste kabul edilmez", () => {
    const sonuc = WebSayfasiVerisiSchema.safeParse({
      ...gecerli,
      govde: [{ tur: "liste", maddeler: [] }],
    });
    expect(sonuc.success).toBe(false);
  });

  it("renk küçük harf altı haneli olmalı", () => {
    expect(WebSayfasiVerisiSchema.safeParse({ ...gecerli, renk: "#ABCDEF" }).success).toBe(false);
    expect(WebSayfasiVerisiSchema.safeParse({ ...gecerli, renk: "#2a6b7c" }).success).toBe(true);
  });
});

describe("site içerikleri", () => {
  it("en az iki şablon gerçekten kullanılıyor (CLAUDE.md Faz 3)", () => {
    const kullanilan = new Set(sayfalar.map((s) => s.veri.sablon));
    expect(kullanilan.size).toBeGreaterThanOrEqual(2);
  });

  it("her şablonun bir rengi tanımlı", () => {
    for (const s of sayfalar) {
      expect(SABLON_RENKLERI[s.veri.sablon]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("sosyal şablonun rengi markadan geliyor — elle yazılmıyor (CLAUDE.md §2.1)", () => {
    expect(SABLON_RENKLERI.sosyal).toBe(markalar[modulMarkasi.sosyal].renk);
  });

  it("profil bloğundaki her hesap gerçekten kütüphanede var", () => {
    const hesapIdleri = new Set(
      readdirSync(join(KOK, "content", "hesaplar"))
        .filter((d) => d.endsWith(".json"))
        .map((d) => HesapSchema.parse(oku(`content/hesaplar/${d}`)).id),
    );
    for (const s of sayfalar) {
      for (const blok of s.veri.govde) {
        if (blok.tur !== "profil") continue;
        expect(hesapIdleri.has(blok.hesap)).toBe(true);
      }
    }
  });

  it("iki site aynı adresi kullanmıyor", () => {
    const adresler = sayfalar.map((s) => s.veri.adres);
    expect(new Set(adresler).size).toBe(adresler.length);
  });

  it("arama sonucundaki her siteRef gerçek bir web sayfası", () => {
    const sayfaIdleri = new Set(sayfalar.map((s) => s.id));
    for (const a of aramalar) {
      for (const sonuc of a.veri.sonuclar) {
        if (sonuc.siteRef === undefined) continue;
        expect(sayfaIdleri.has(sonuc.siteRef)).toBe(true);
      }
    }
  });

  it("sonucun görünen adresi, açtığı sitenin adresiyle aynı alan adında", () => {
    const sayfaIdleri = new Map(sayfalar.map((s) => [s.id, s.veri.adres]));
    for (const a of aramalar) {
      for (const sonuc of a.veri.sonuclar) {
        if (sonuc.siteRef === undefined) continue;
        const alanAdi = (d: string) => d.split("/")[0]?.split("›")[0]?.trim();
        expect(alanAdi(sonuc.adres)).toBe(alanAdi(sayfaIdleri.get(sonuc.siteRef) ?? ""));
      }
    }
  });
});

describe("arama sahnesinden siteye geçiş", () => {
  const sahne = sahneler.find((s) => s.kod === "eg-b03-s62")!;

  it("dokunulan sonuç numarası gerçekten o kadar sonuç olan bir sayfaya ait", () => {
    const sayfa = aramalar.find((a) => a.id === sahne.baslangic.icerikRef);
    expect(sayfa).toBeDefined();
    const sayi = sayfa?.veri.sonuclar.length ?? 0;
    for (const o of sahne.olaylar) {
      if (o.tetik.tur !== "dokunma") continue;
      const eslesme = /^arama-sonuc-(\d+)$/.exec(o.tetik.hedef);
      if (eslesme === null) continue;
      expect(Number(eslesme[1])).toBeLessThanOrEqual(sayi);
    }
  });

  it("siteye götüren her dokunuş, o sonucun siteRef'iyle aynı sayfayı açıyor", () => {
    const sayfa = aramalar.find((a) => a.id === sahne.baslangic.icerikRef);
    for (const o of sahne.olaylar) {
      if (o.tetik.tur !== "dokunma" || o.aksiyon.tur !== "ekranAc") continue;
      const eslesme = /^arama-sonuc-(\d+)$/.exec(o.tetik.hedef);
      if (eslesme === null) continue;
      const sira = Number(eslesme[1]) - 1;
      expect(o.aksiyon.icerikRef).toBe(sayfa?.veri.sonuclar[sira]?.siteRef);
    }
  });
});
