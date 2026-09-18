import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { Motor } from "../src/engine/motor";
import { modulGorunumu } from "../src/modules/gorunum";
import { SahneSchema, type Sahne } from "../src/schema";
import { uygulamaAdi, uygulamaRengi } from "../src/system/bildirimler";
import { SahteSaat } from "./yardimci/sahte-saat";

const KOK = join(import.meta.dirname, "..");
const sahneOku = (kod: string): Sahne =>
  SahneSchema.parse(JSON.parse(readFileSync(join(KOK, `content/sahneler/${kod}.json`), "utf-8")));

function kur(s: Sahne) {
  const saat = new SahteSaat();
  const aksiyonlar: string[] = [];
  const motor = new Motor(s, {
    simdi: saat.simdi,
    zamanla: saat.zamanla,
    iptal: saat.iptal,
    onAksiyon: (olay) => aksiyonlar.push(olay.aksiyon.tur),
  });
  return { saat, motor, aksiyonlar };
}

describe("eg-b03-s12 — kilit ekranına bildirim", () => {
  it("2,5 sn sonra ilk bildirim, 4 sn sonra ikincisi", () => {
    const { saat, motor } = kur(sahneOku("eg-b03-s12"));
    motor.baslat();

    saat.ilerlet(2_499);
    expect(motor.log).toEqual([]);

    saat.ilerlet(1);
    expect(motor.log.map((k) => k.olayId)).toEqual(["ilk-mesaj"]);

    saat.ilerlet(4_000);
    expect(motor.log.map((k) => `${k.zaman}:${k.olayId}`)).toEqual([
      "2500:ilk-mesaj",
      "6500:ikinci-mesaj",
    ]);
  });

  it("oyuncu dokunmadan kendiliğinden akar (kilit ekranı sahnesi)", () => {
    const s = sahneOku("eg-b03-s12");
    expect(s.olaylar.some((o) => o.tetik.tur === "baslangic")).toBe(true);
  });

  it("iki olay da bildirim üretir", () => {
    const { saat, motor, aksiyonlar } = kur(sahneOku("eg-b03-s12"));
    motor.baslat();
    saat.ilerlet(20_000);
    expect(aksiyonlar).toEqual(["bildirim", "bildirim"]);
  });
});

describe("eg-b03-s71 — pil bitme", () => {
  it("%5 → %1 → kapanma sırasıyla ve doğru zamanlarda", () => {
    const s = sahneOku("eg-b03-s71");
    const { saat, motor } = kur(s);
    const seviyeler: number[] = [];
    const motor2 = new Motor(s, {
      simdi: saat.simdi,
      zamanla: saat.zamanla,
      iptal: saat.iptal,
      onAksiyon: (olay) => {
        if (olay.aksiyon.tur === "pilDegisti") seviyeler.push(olay.aksiyon.seviye);
      },
    });
    motor2.baslat();
    saat.ilerlet(30_000);

    expect(seviyeler).toEqual([5, 1, 0]);
    expect(motor.log).toEqual([]); // ilk motor hiç başlatılmadı
  });

  it("kapanma 14,5 sn'de gerçekleşir (2,5 + 7 + 5)", () => {
    const { saat, motor } = kur(sahneOku("eg-b03-s71"));
    motor.baslat();
    saat.ilerlet(14_499);
    expect(motor.tetiklendiMi("telefon-kapandi")).toBe(false);
    saat.ilerlet(1);
    expect(motor.tetiklendiMi("telefon-kapandi")).toBe(true);
  });

  it("kapanma elle tetiklenerek replikaya denk getirilebilir", () => {
    const { saat, motor } = kur(sahneOku("eg-b03-s71"));
    motor.baslat();
    saat.ilerlet(3_000);
    motor.elleTetikle("telefon-kapandi");
    expect(motor.log.at(-1)).toMatchObject({ olayId: "telefon-kapandi", kaynak: "elle" });

    // Bekleyen zincir geri gelip pili tekrar değiştirmemeli
    saat.ilerlet(30_000);
    expect(motor.log.filter((k) => k.olayId === "telefon-kapandi")).toHaveLength(1);
  });
});

describe("uygulama yer tutucuları — /brands gelene kadar", () => {
  it("slug'ı okunabilir ada çevirir", () => {
    expect(uygulamaAdi("mesaj")).toBe("Mesaj");
    expect(uygulamaAdi("gonul-yolcusu")).toBe("Gonul Yolcusu");
  });

  it("ikon rengi DETERMİNİSTİK (CLAUDE.md §2.4)", () => {
    expect(uygulamaRengi("mesaj")).toBe(uygulamaRengi("mesaj"));
    expect(uygulamaRengi("mesaj")).not.toBe(uygulamaRengi("sosyal"));
  });
});

describe("modül görünümü — kabuğa ne söylüyor", () => {
  it("kilit ekranı tam ekran ve açık renkli çubuk ister", () => {
    expect(modulGorunumu("kilit")).toEqual({ icerikUste: true, ustKatman: "acik" });
  });

  it("diğer modüller varsayılana düşer", () => {
    expect(modulGorunumu("sosyal")).toEqual({ icerikUste: false, ustKatman: "koyu" });
    expect(modulGorunumu("web")).toEqual({ icerikUste: false, ustKatman: "koyu" });
  });
});
