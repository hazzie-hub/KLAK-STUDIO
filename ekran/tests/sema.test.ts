import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { SahneSchema, SlugSchema, sahneUyarilari } from "../src/schema";

const KOK = join(import.meta.dirname, "..");
const ornekSahne = () =>
  JSON.parse(readFileSync(join(KOK, "content/sahneler/eg-b03-s58.json"), "utf-8")) as Record<
    string,
    unknown
  >;

/** Hataları tek metinde toplayıp okunabilirlik iddialarını sadeleştirir. */
function hatalar(veri: unknown): string[] {
  const r = SahneSchema.safeParse(veri);
  if (r.success) return [];
  return r.error.issues.map((i) => i.message);
}

describe("eg-b03-s58 — CLAUDE.md §5'teki örnek sahne", () => {
  it("şemadan olduğu gibi geçer", () => {
    const r = SahneSchema.safeParse(ornekSahne());
    expect(r.success).toBe(true);
  });

  it("varsayılanlar dolar ve zincir korunur", () => {
    const sahne = SahneSchema.parse(ornekSahne());
    expect(sahne.kod).toBe("eg-b03-s58");
    expect(sahne.durum.baglanti).toBe("normal");
    expect(sahne.olaylar).toHaveLength(3);
    expect(sahne.olaylar[1]?.tetik).toMatchObject({ tur: "sonra", olayId: "post-yuklendi", gecikme: 5000 });
  });

  it("uyarı üretmez", () => {
    expect(sahneUyarilari(SahneSchema.parse(ornekSahne()))).toEqual([]);
  });
});

describe("bozuk sahne — anlaşılır hata verir", () => {
  it("olmayan tetik türü seçenekleri sayar", () => {
    const s = ornekSahne();
    (s.olaylar as Array<Record<string, unknown>>)[0]!.tetik = { tur: "yok" };
    const m = hatalar(s).join(" ");
    expect(m).toContain("baslangic");
    expect(m).toContain("dokunma");
  });

  it("olmayan aksiyon türü seçenekleri sayar", () => {
    const s = ornekSahne();
    (s.olaylar as Array<Record<string, unknown>>)[0]!.aksiyon = { tur: "postYukleee", icerikRef: "x" };
    expect(hatalar(s).join(" ")).toContain("postYukle");
  });

  it("anahtar yazım hatasını yakalar (tetkik → tetik)", () => {
    const s = ornekSahne();
    const olay = (s.olaylar as Array<Record<string, unknown>>)[0]!;
    olay.tetkik = olay.tetik;
    delete olay.tetik;
    expect(hatalar(s).length).toBeGreaterThan(0);
  });

  it("aynı id'li iki olayı yakalar", () => {
    const s = ornekSahne();
    const olaylar = s.olaylar as Array<Record<string, unknown>>;
    olaylar[1]!.id = "post-yuklendi";
    expect(hatalar(s).join(" ")).toContain("benzersiz");
  });

  it("olmayan olaya bağlanan zinciri yakalar ve mevcutları listeler", () => {
    const s = ornekSahne();
    const olaylar = s.olaylar as Array<Record<string, unknown>>;
    olaylar[1]!.tetik = { tur: "sonra", olayId: "olmayan-olay", gecikme: 1000 };
    const m = hatalar(s).join(" ");
    expect(m).toContain('"olmayan-olay" diye bir olay yok');
    expect(m).toContain("post-yuklendi");
  });

  it("kendi kendini bekleyen olayı yakalar", () => {
    const s = ornekSahne();
    const olaylar = s.olaylar as Array<Record<string, unknown>>;
    olaylar[1]!.tetik = { tur: "sonra", olayId: "sezai-begeni", gecikme: 800 };
    expect(hatalar(s).join(" ")).toContain("kendi kendini bekliyor");
  });

  it("döngüyü yakalar (a → b → a)", () => {
    const s = ornekSahne();
    const olaylar = s.olaylar as Array<Record<string, unknown>>;
    olaylar[0]!.tetik = { tur: "sonra", olayId: "sezai-yorum", gecikme: 100 };
    expect(hatalar(s).join(" ")).toContain("döngü");
  });

  it("hatalı sahne kodunu doğru biçimle birlikte açıklar", () => {
    const s = ornekSahne();
    s.kod = "EG_B3_S58";
    expect(hatalar(s).join(" ")).toContain("eg-b03-s58");
  });

  it("negatif gecikmeyi reddeder", () => {
    const s = ornekSahne();
    (s.olaylar as Array<Record<string, unknown>>)[1]!.tetik = {
      tur: "sonra",
      olayId: "post-yuklendi",
      gecikme: -5,
    };
    expect(hatalar(s).join(" ")).toContain("negatif");
  });

  it("boş talimatı reddeder", () => {
    const s = ornekSahne();
    s.talimat = "";
    expect(hatalar(s).join(" ")).toContain("Talimat");
  });
});

describe("slug kuralı — CLAUDE.md §2.8", () => {
  it("Türkçe karakterli referansı reddeder", () => {
    const r = SlugSchema.safeParse("çiçekçi-post");
    expect(r.success).toBe(false);
  });

  it("boşluk ve büyük harfi reddeder", () => {
    expect(SlugSchema.safeParse("Nergis Post").success).toBe(false);
  });

  it("geçerli slug'ı kabul eder", () => {
    expect(SlugSchema.safeParse("nergis-post-cicekci").success).toBe(true);
  });
});

describe("uyarılar — sahneyi geçersiz kılmaz", () => {
  it("kendiliğinden başlamayan sahne için uyarır", () => {
    const s = ornekSahne();
    (s.olaylar as Array<Record<string, unknown>>)[0]!.tetik = { tur: "elle" };
    const sahne = SahneSchema.parse(s);
    expect(sahneUyarilari(sahne).join(" ")).toContain("kendiliğinden");
  });
});
