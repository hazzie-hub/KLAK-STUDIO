import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { markalar, modulMarkasi } from "../brands";
import { GHOST_HEDEF } from "../src/modules/arama/veri";
import { AramaSonucuVerisiSchema, IcerikSchema, SahneSchema, type Sahne } from "../src/schema";

const KOK = join(import.meta.dirname, "..");
const oku = (yol: string) => JSON.parse(readFileSync(join(KOK, yol), "utf-8")) as unknown;
const klasor = (ad: string) =>
  readdirSync(join(KOK, "content", ad))
    .filter((d) => d.endsWith(".json"))
    .sort()
    .map((d) => oku(`content/${ad}/${d}`));

const icerikler = klasor("icerikler").map((i) => IcerikSchema.parse(i));
const aramalar = icerikler.flatMap((i) => (i.tur === "aramaSonucu" ? [i] : []));
const sahneler = klasor("sahneler").map((s) => SahneSchema.parse(s) as Sahne);

describe("LOOK markası", () => {
  it("markalar listesinde tanımlı", () => {
    expect(markalar.look.ad).toBe("LOOK");
  });

  it("arama modülü LOOK'u kullanır — ad hiçbir modüle elle yazılmaz", () => {
    expect(modulMarkasi.arama).toBe("look");
  });

  it("rengi diğer markaların rengiyle çakışmıyor", () => {
    const renkler = Object.values(markalar).map((m) => m.renk);
    expect(new Set(renkler).size).toBe(renkler.length);
  });
});

describe("arama sonucu şeması", () => {
  const gecerli = {
    sorgu: "kadıköy sahilde kahvaltı",
    sonuclar: [{ baslik: "Bir başlık", adres: "ornekadres.com › sayfa" }],
  };

  it("eksik alanları varsayılanla doldurur", () => {
    const v = AramaSonucuVerisiSchema.parse(gecerli);
    expect(v.sonuclar[0]?.ozet).toBe("");
    expect(v.gorseller).toEqual([]);
    expect(v.oneriler).toEqual([]);
  });

  it("boş sorgu kabul edilmez", () => {
    expect(AramaSonucuVerisiSchema.safeParse({ ...gecerli, sorgu: "" }).success).toBe(false);
  });

  it("tanınmayan alan sessizce yutulmaz", () => {
    const sonuc = AramaSonucuVerisiSchema.safeParse({ ...gecerli, uydurmaAlan: 1 });
    expect(sonuc.success).toBe(false);
  });

  it("başlıksız sonuç kabul edilmez — kamerada boş satır görünmesin", () => {
    const sonuc = AramaSonucuVerisiSchema.safeParse({
      ...gecerli,
      sonuclar: [{ baslik: "", adres: "a.com" }],
    });
    expect(sonuc.success).toBe(false);
  });
});

describe("arama içerikleri", () => {
  it("en az bir arama sonucu sayfası var", () => {
    expect(aramalar.length).toBeGreaterThan(0);
  });

  it("her sonucun görünen adresi var — kameraya boş adres çıkmaz", () => {
    for (const a of aramalar) {
      for (const s of a.veri.sonuclar) expect(s.adres.trim()).not.toBe("");
    }
  });

  it("adreslerde büyük harf ya da boşluk yok — gerçek adres çubuğu gibi dursun", () => {
    for (const a of aramalar) {
      for (const s of a.veri.sonuclar) {
        const alanAdi = s.adres.split("›")[0]?.trim() ?? "";
        expect(alanAdi).toBe(alanAdi.toLowerCase());
        expect(alanAdi).not.toContain(" ");
      }
    }
  });
});

describe("arama sahnesi", () => {
  const sahne = sahneler.find((s) => s.baslangic.modul === "arama") ?? null;

  it("arama modülünü kullanan bir sahne var", () => {
    expect(sahne).not.toBeNull();
  });

  it("ghost typing hedefi modülün beklediği adla aynı", () => {
    const hedefler = (sahne?.olaylar ?? []).flatMap((o) =>
      o.aksiyon.tur === "ghostTypingBaslat" ? [o.aksiyon.hedef] : [],
    );
    expect(hedefler).toContain(GHOST_HEDEF);
  });

  it("yazılan metin, açılan sonuç sayfasının sorgusuyla aynı", () => {
    const yazilan = (sahne?.olaylar ?? []).flatMap((o) =>
      o.aksiyon.tur === "ghostTypingBaslat" ? [o.aksiyon.metin] : [],
    );
    const acilan = (sahne?.olaylar ?? []).flatMap((o) =>
      o.aksiyon.tur === "ekranAc" && o.aksiyon.icerikRef !== undefined
        ? [o.aksiyon.icerikRef]
        : [],
    );
    const sayfa = aramalar.find((a) => acilan.includes(a.id));
    expect(sayfa).toBeDefined();
    expect(yazilan).toContain(sayfa?.veri.sorgu);
  });

  it("açılan her sonuç sayfası gerçekten var — sette boş ekran çıkmasın", () => {
    const kimlikler = new Set(aramalar.map((a) => a.id));
    for (const s of sahneler) {
      for (const o of s.olaylar) {
        if (o.aksiyon.tur === "ekranAc" && o.aksiyon.modul === "arama") {
          expect(o.aksiyon.icerikRef === undefined || kimlikler.has(o.aksiyon.icerikRef)).toBe(true);
        }
      }
    }
  });
});
