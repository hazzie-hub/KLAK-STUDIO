import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { markalar } from "../brands";
import { Motor } from "../src/engine/motor";
import { sosyalVeriTuret, type KutuphaneGorunumu } from "../src/modules/sosyal/veri";
import { HesapSchema, IcerikSchema, SahneSchema, type Hesap, type Olay, type Sahne } from "../src/schema";
import { SahteSaat } from "./yardimci/sahte-saat";

const KOK = join(import.meta.dirname, "..");
const oku = (yol: string) => JSON.parse(readFileSync(join(KOK, yol), "utf-8")) as unknown;
const klasor = (ad: string) =>
  readdirSync(join(KOK, "content", ad))
    .filter((d) => d.endsWith(".json"))
    .sort()
    .map((d) => oku(`content/${ad}/${d}`));

const hesaplar: Hesap[] = klasor("hesaplar").map((h) => HesapSchema.parse(h));
const icerikler = klasor("icerikler").map((i) => IcerikSchema.parse(i));

const kutuphane: KutuphaneGorunumu = {
  hesap: (id) => hesaplar.find((h) => h.id === id) ?? null,
  post: (id) => {
    const i = icerikler.find((x) => x.id === id);
    return i !== undefined && i.tur === "post" ? { id: i.id, veri: i.veri } : null;
  },
  postlar: icerikler.flatMap((i) => (i.tur === "post" ? [{ id: i.id, veri: i.veri }] : [])),
};

const sahne = (): Sahne => SahneSchema.parse(oku("content/sahneler/eg-b03-s58.json"));

/** Sahneyi sahte saatle oynatıp o ana kadar gerçekleşen olayları döndürür. */
function oynat(adimlar: (m: Motor, s: SahteSaat) => void): Olay[] {
  const s = sahne();
  const saat = new SahteSaat();
  const olanlar: Olay[] = [];
  const motor = new Motor(s, {
    simdi: saat.simdi,
    zamanla: saat.zamanla,
    iptal: saat.iptal,
    onAksiyon: (olay) => olanlar.push(olay),
  });
  motor.baslat();
  adimlar(motor, saat);
  return olanlar;
}

describe("feed — sahnede yüklenecek post önce görünmez", () => {
  it("sahne başında Nergis'in çiçekçi postu feed'de YOK", () => {
    const veri = sosyalVeriTuret(sahne(), [], kutuphane);
    expect(veri.feed.map((p) => p.id)).not.toContain("nergis-post-cicekci");
  });

  it("diğer postlar baştan feed'de var", () => {
    const veri = sosyalVeriTuret(sahne(), [], kutuphane);
    expect(veri.feed.length).toBeGreaterThan(3);
    expect(veri.feed.map((p) => p.id)).toContain("elif-balkon");
  });

  it("postYukle gerçekleşince EN ÜSTTE belirir", () => {
    const olanlar = oynat((m) => m.dokun("yeni-post-akisi-tamam"));
    const veri = sosyalVeriTuret(sahne(), olanlar, kutuphane);
    expect(veri.feed[0]?.id).toBe("nergis-post-cicekci");
    expect(veri.feed[0]?.yeniYuklendi).toBe(true);
  });
});

describe("beğeni ve yorum — olaylardan türer, modül sayaç tutmaz", () => {
  it("post yüklendiğinde beğeni 0", () => {
    const olanlar = oynat((m) => m.dokun("yeni-post-akisi-tamam"));
    expect(sosyalVeriTuret(sahne(), olanlar, kutuphane).feed[0]?.begeni).toBe(0);
  });

  it("Sezai beğenince 1 olur", () => {
    const olanlar = oynat((m, s) => {
      m.dokun("yeni-post-akisi-tamam");
      s.ilerlet(5_000);
    });
    expect(sosyalVeriTuret(sahne(), olanlar, kutuphane).feed[0]?.begeni).toBe(1);
  });

  it("Sezai yorum yapınca yorum listeye düşer ve YENİ işaretlenir", () => {
    const olanlar = oynat((m, s) => {
      m.dokun("yeni-post-akisi-tamam");
      s.ilerlet(6_000);
    });
    const post = sosyalVeriTuret(sahne(), olanlar, kutuphane).feed[0];
    expect(post?.yorumlar).toHaveLength(1);
    expect(post?.yorumlar[0]?.hesap?.kullaniciAdi).toBe("gonul_yolcusu");
    expect(post?.yorumlar[0]?.yeni).toBe(true);
  });

  it("postRef verilmemiş olay, sahnede yüklenen posta yazılır", () => {
    const olanlar = oynat((m, s) => {
      m.dokun("yeni-post-akisi-tamam");
      s.ilerlet(6_000);
    });
    const veri = sosyalVeriTuret(sahne(), olanlar, kutuphane);
    // Diğer postların beğenisi değişmemeli
    const elif = veri.feed.find((p) => p.id === "elif-balkon");
    expect(elif?.begeni).toBe(132);
    expect(elif?.yorumlar.every((y) => !y.yeni)).toBe(true);
  });

  it("kütüphanedeki temel yorumlar korunur", () => {
    const veri = sosyalVeriTuret(sahne(), [], kutuphane);
    const elif = veri.feed.find((p) => p.id === "elif-balkon");
    expect(elif?.yorumlar).toHaveLength(2);
    expect(elif?.yorumlar.every((y) => !y.yeni)).toBe(true);
  });
});

describe("aktivite — en yeni üstte", () => {
  it("beğeni ve yorum aktiviteye düşer, sıralaması ters", () => {
    const olanlar = oynat((m, s) => {
      m.dokun("yeni-post-akisi-tamam");
      s.ilerlet(6_000);
    });
    const a = sosyalVeriTuret(sahne(), olanlar, kutuphane).aktiviteler;
    expect(a.map((x) => x.tur)).toEqual(["yorum", "begeni"]);
    expect(a[0]?.hesap?.kullaniciAdi).toBe("gonul_yolcusu");
  });

  it("hiçbir şey olmadıysa aktivite boş", () => {
    expect(sosyalVeriTuret(sahne(), [], kutuphane).aktiviteler).toEqual([]);
  });
});

describe("determinizm ve başa sar", () => {
  it("aynı olaylar aynı ekranı verir", () => {
    const olanlar = oynat((m, s) => {
      m.dokun("yeni-post-akisi-tamam");
      s.ilerlet(6_000);
    });
    const a = sosyalVeriTuret(sahne(), olanlar, kutuphane);
    const b = sosyalVeriTuret(sahne(), olanlar, kutuphane);
    expect(a.feed.map((p) => `${p.id}:${p.begeni}:${p.yorumlar.length}`)).toEqual(
      b.feed.map((p) => `${p.id}:${p.begeni}:${p.yorumlar.length}`),
    );
  });

  it("olay listesi boşalınca ekran BAŞLANGIÇ haline döner (başa sar)", () => {
    const olanlar = oynat((m, s) => {
      m.dokun("yeni-post-akisi-tamam");
      s.ilerlet(6_000);
    });
    const sonra = sosyalVeriTuret(sahne(), olanlar, kutuphane);
    const basta = sosyalVeriTuret(sahne(), [], kutuphane);

    expect(sonra.feed[0]?.id).toBe("nergis-post-cicekci");
    expect(basta.feed.map((p) => p.id)).not.toContain("nergis-post-cicekci");
    expect(basta.aktiviteler).toEqual([]);
  });
});

describe("marka — CLAUDE.md §2.1", () => {
  it("sosyal uygulamanın adı /brands'ten gelir", () => {
    expect(markalar.akis.ad).toBe("Akış");
  });

  // Bu denetim kasıtlı olarak katı: yorumlarda bile geçmesin ki kopyala-yapıştır
  // sırasında ekrana sızma ihtimali kalmasın (CLAUDE.md §2.1).
  it("gerçek marka adı hiçbir kaynak dosyada geçmiyor", () => {
    const yasakli = ["instagram", "whatsapp", "facebook", "twitter", "tiktok", "snapchat"];
    const tara = (klasorAdi: string): string[] => {
      const yol = join(KOK, klasorAdi);
      return readdirSync(yol, { withFileTypes: true }).flatMap((g) =>
        g.isDirectory()
          ? tara(join(klasorAdi, g.name))
          : [readFileSync(join(yol, g.name), "utf-8").toLowerCase()],
      );
    };
    const metinler = [...tara("src"), ...tara("brands"), ...tara("content")];
    for (const m of metinler) {
      for (const y of yasakli) expect(m).not.toContain(y);
    }
  });
});
