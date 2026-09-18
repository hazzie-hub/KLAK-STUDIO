import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { Motor, type Kaynak } from "../src/engine/motor";
import { SahneSchema, type Olay, type Sahne } from "../src/schema";
import { SahteSaat } from "./yardimci/sahte-saat";

const KOK = join(import.meta.dirname, "..");
const sahne = (): Sahne =>
  SahneSchema.parse(JSON.parse(readFileSync(join(KOK, "content/sahneler/eg-b03-s58.json"), "utf-8")));

/** Motoru sahte saatle kurar ve çalışan aksiyonları kaydeder. */
function kur(s: Sahne = sahne()) {
  const saat = new SahteSaat();
  const aksiyonlar: Array<{ olayId: string; aksiyon: string; kaynak: Kaynak }> = [];
  const motor = new Motor(s, {
    simdi: saat.simdi,
    zamanla: saat.zamanla,
    iptal: saat.iptal,
    onAksiyon: (olay: Olay, kaynak) =>
      aksiyonlar.push({ olayId: olay.id, aksiyon: olay.aksiyon.tur, kaynak }),
  });
  return { saat, motor, aksiyonlar };
}

const özet = (motor: Motor) => motor.log.map((k) => `${k.zaman}:${k.olayId}:${k.kaynak}`);

describe("eg-b03-s58 zinciri — CLAUDE.md §5'teki senaryo", () => {
  it("oyuncu dokunmadan HİÇBİR ŞEY olmaz", () => {
    const { saat, motor } = kur();
    motor.baslat();
    saat.ilerlet(60_000);
    expect(motor.log).toEqual([]);
  });

  it("dokunma → post yüklenir, 5 sn sonra beğeni, 800 ms sonra yorum", () => {
    const { saat, motor, aksiyonlar } = kur();
    motor.baslat();

    saat.ilerlet(3_000);
    motor.dokun("yeni-post-akisi-tamam");
    expect(özet(motor)).toEqual(["3000:post-yuklendi:dokunma"]);

    saat.ilerlet(4_999);
    expect(motor.tetiklendiMi("sezai-begeni")).toBe(false);

    saat.ilerlet(1);
    expect(motor.tetiklendiMi("sezai-begeni")).toBe(true);

    saat.ilerlet(799);
    expect(motor.tetiklendiMi("sezai-yorum")).toBe(false);
    saat.ilerlet(1);

    expect(özet(motor)).toEqual([
      "3000:post-yuklendi:dokunma",
      "8000:sezai-begeni:otomatik",
      "8800:sezai-yorum:otomatik",
    ]);
    expect(aksiyonlar.map((a) => a.aksiyon)).toEqual(["postYukle", "begeniGeldi", "yorumGeldi"]);
  });

  it("aynı hedefe ikinci dokunuş olayı TEKRAR ETMEZ (çift post olmaz)", () => {
    const { saat, motor } = kur();
    motor.baslat();
    motor.dokun("yeni-post-akisi-tamam");
    saat.ilerlet(100);
    motor.dokun("yeni-post-akisi-tamam");
    motor.dokun("yeni-post-akisi-tamam");
    expect(motor.log.filter((k) => k.olayId === "post-yuklendi")).toHaveLength(1);
  });

  it("tanımsız hedefe dokunmak hiçbir şey yapmaz", () => {
    const { motor } = kur();
    motor.baslat();
    motor.dokun("olmayan-hedef");
    expect(motor.log).toEqual([]);
  });
});

describe("elle tetik süreyi ezer — CLAUDE.md §2.5 ve §5", () => {
  it("bekleyen zamanlayıcıyı iptal eder ve zinciri buradan sürdürür", () => {
    const { saat, motor } = kur();
    motor.baslat();
    motor.dokun("yeni-post-akisi-tamam");

    saat.ilerlet(1_000);
    // sezai-begeni normalde 5000'de gelecekti; operatör 1000'de tetikliyor
    motor.elleTetikle("sezai-begeni");
    expect(özet(motor)).toEqual([
      "0:post-yuklendi:dokunma",
      "1000:sezai-begeni:elle",
    ]);

    // Zincir buradan devam eder: yorum 800 ms SONRA, 5800'de değil
    saat.ilerlet(800);
    expect(motor.log.at(-1)).toMatchObject({ olayId: "sezai-yorum", zaman: 1800 });

    // İptal edilen zamanlayıcı geri gelmez
    saat.ilerlet(30_000);
    expect(motor.log.filter((k) => k.olayId === "sezai-begeni")).toHaveLength(1);
  });

  it("zinciri beklemeden herhangi bir olay elle tetiklenebilir", () => {
    const { saat, motor } = kur();
    motor.baslat();
    motor.elleTetikle("sezai-yorum");
    saat.ilerlet(10);
    expect(motor.tetiklendiMi("sezai-yorum")).toBe(true);
  });

  it("olmayan olay elle tetiklenirse çökmez", () => {
    const sessiz = vi.spyOn(console, "error").mockImplementation(() => {});
    const { motor } = kur();
    motor.baslat();
    expect(() => motor.elleTetikle("boyle-bir-olay-yok")).not.toThrow();
    expect(motor.log).toEqual([]);
    sessiz.mockRestore();
  });
});

describe("başa sar — CLAUDE.md §6", () => {
  it("sahneyi birebir ilk haline döndürür", () => {
    const { saat, motor } = kur();
    motor.baslat();
    motor.dokun("yeni-post-akisi-tamam");
    saat.ilerlet(6_000);
    expect(motor.log.length).toBeGreaterThan(1);

    motor.basaSar();
    expect(motor.log).toEqual([]);
    expect(motor.bekleyenler).toEqual([]);

    // Eski zamanlayıcılar geri gelmez
    saat.ilerlet(60_000);
    expect(motor.log).toEqual([]);
  });

  it("başa sardıktan sonra sahne BİREBİR aynı akar (CLAUDE.md §2.4)", () => {
    const { saat, motor } = kur();

    const tur = () => {
      motor.dokun("yeni-post-akisi-tamam");
      saat.ilerlet(10_000);
      const sonuc = özet(motor);
      motor.basaSar();
      return sonuc;
    };

    motor.baslat();
    const ilk = tur();
    const ikinci = tur();
    const ucuncu = tur();

    expect(ikinci).toEqual(ilk);
    expect(ucuncu).toEqual(ilk);
  });
});

describe("sıradaki olay — kumanda ve gizli panel bunu gösterecek", () => {
  it("bekleyenleri ateşlenme sırasına göre verir", () => {
    const { saat, motor } = kur();
    motor.baslat();
    expect(motor.siradaki).toBeNull();

    motor.dokun("yeni-post-akisi-tamam");
    expect(motor.siradaki).toMatchObject({ olayId: "sezai-begeni", hedefZaman: 5_000 });

    saat.ilerlet(5_000);
    expect(motor.siradaki).toMatchObject({ olayId: "sezai-yorum", hedefZaman: 5_800 });

    saat.ilerlet(800);
    expect(motor.siradaki).toBeNull();
  });

  it("durdur() bekleyen zamanlayıcı bırakmaz", () => {
    const { saat, motor } = kur();
    motor.baslat();
    motor.dokun("yeni-post-akisi-tamam");
    expect(saat.bekleyenSayisi).toBe(1);
    motor.durdur();
    expect(saat.bekleyenSayisi).toBe(0);
  });
});

describe("baslangic tetiği", () => {
  it("sahne açılınca verilen gecikmeden sonra ateşlenir", () => {
    const s = sahne();
    s.olaylar[0]!.tetik = { tur: "baslangic", gecikme: 2_000 };
    const { saat, motor } = kur(s);
    motor.baslat();

    saat.ilerlet(1_999);
    expect(motor.log).toEqual([]);
    saat.ilerlet(1);
    expect(özet(motor)).toEqual(["2000:post-yuklendi:otomatik"]);
  });
});

describe("determinizm — CLAUDE.md §2.4", () => {
  it("iki ayrı motor aynı girdiyle aynı logu üretir", () => {
    const calistir = () => {
      const { saat, motor } = kur();
      motor.baslat();
      saat.ilerlet(1_500);
      motor.dokun("yeni-post-akisi-tamam");
      saat.ilerlet(20_000);
      return özet(motor);
    };
    expect(calistir()).toEqual(calistir());
  });

  it("motorda rastgelelik yok", () => {
    const kaynak = readFileSync(join(KOK, "src/engine/motor.ts"), "utf-8");
    expect(kaynak).not.toContain("Math.random");
  });
});
