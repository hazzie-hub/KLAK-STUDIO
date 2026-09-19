import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { Motor } from "../src/engine/motor";
import { mesajVeriTuret } from "../src/modules/mesaj/veri";
import { HesapSchema, IcerikSchema, SahneSchema, type Olay, type Sahne } from "../src/schema";
import { SahteSaat } from "./yardimci/sahte-saat";

const KOK = join(import.meta.dirname, "..");
const oku = (yol: string) => JSON.parse(readFileSync(join(KOK, yol), "utf-8")) as unknown;
const klasor = (ad: string) =>
  readdirSync(join(KOK, "content", ad))
    .filter((d) => d.endsWith(".json"))
    .sort()
    .map((d) => oku(`content/${ad}/${d}`));

const hesaplar = klasor("hesaplar").map((h) => HesapSchema.parse(h));
const icerikler = klasor("icerikler").map((i) => IcerikSchema.parse(i));
const sohbetler = icerikler.flatMap((i) => (i.tur === "sohbet" ? [{ id: i.id, veri: i.veri }] : []));
const kutuphane = {
  hesap: (id: string) => hesaplar.find((h) => h.id === id) ?? null,
  sohbetler,
};

const sahne = (): Sahne => SahneSchema.parse(oku("content/sahneler/eg-b03-s13.json"));

function oynat(ms: number): Olay[] {
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
  saat.ilerlet(ms);
  return olanlar;
}

const sohbetAl = (olanlar: Olay[]) =>
  mesajVeriTuret(sahne(), olanlar, kutuphane, "23:43").find((s) => s.id === "nergis-sezai");

describe("eg-b03-s13 — mesaj sahnesi", () => {
  it("sahne başında kütüphanedeki mesajlar var, yenisi yok", () => {
    const s = sohbetAl([]);
    expect(s?.mesajlar).toHaveLength(5);
    expect(s?.mesajlar.every((m) => !m.yeni)).toBe(true);
    expect(s?.yaziyor).toBe(false);
  });

  it("1,5 sn: son 'ben' mesajı görüldü olur", () => {
    const once = sohbetAl([]);
    const benimSon = [...(once?.mesajlar ?? [])].reverse().find((m) => m.benMi);
    expect(benimSon?.durum).toBe("goruldu");

    // Sahne başlangıçta "goruldu" yazıyor; içerikte de öyle. Olay sonrası da öyle kalmalı.
    const sonra = sohbetAl(oynat(1_500));
    const sonrakiBen = [...(sonra?.mesajlar ?? [])].reverse().find((m) => m.benMi);
    expect(sonrakiBen?.durum).toBe("goruldu");
  });

  it("3,5 sn: karşı taraf yazıyor", () => {
    expect(sohbetAl(oynat(3_500))?.yaziyor).toBe(true);
  });

  it("7 sn: mesaj düşer ve 'yazıyor' KALKAR", () => {
    const s = sohbetAl(oynat(7_000));
    expect(s?.yaziyor).toBe(false);
    expect(s?.mesajlar.at(-1)?.metin).toBe("Yarın sabah kahvaltıda anlatırım.");
    expect(s?.mesajlar.at(-1)?.yeni).toBe(true);
  });

  it("gelen mesaja cihazın saati yazılır", () => {
    expect(sohbetAl(oynat(7_000))?.mesajlar.at(-1)?.saat).toBe("23:43");
  });

  it("9,5 sn: ikinci mesaj da düşer, okunmamış sayısı 2", () => {
    const s = sohbetAl(oynat(9_600));
    expect(s?.mesajlar.at(-1)?.metin).toBe("Kimseye söyleme.");
    expect(s?.okunmamis).toBe(2);
  });

  it("BAŞA SAR: olay listesi boşalınca ekran ilk haline döner", () => {
    const sonra = sohbetAl(oynat(20_000));
    const basta = sohbetAl([]);
    expect(sonra?.mesajlar.length).toBe(7);
    expect(basta?.mesajlar.length).toBe(5);
    expect(basta?.okunmamis).toBe(0);
  });

  it("aynı olaylar aynı ekranı verir (determinizm)", () => {
    const olanlar = oynat(20_000);
    const a = sohbetAl(olanlar);
    const b = sohbetAl(olanlar);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe("sohbet içeriği şeması", () => {
  it("fotoğraf eki olan mesaj geçerli", () => {
    const s = sohbetAl([]);
    expect(s?.mesajlar.some((m) => m.gorsel === "sokak.svg")).toBe(true);
  });

  it("sohbetteki her görsel dosyası gerçekten var", () => {
    for (const { veri } of sohbetler) {
      for (const m of veri.mesajlar) {
        if (m.gorsel === undefined) continue;
        expect(readFileSync(join(KOK, "public/ornek", m.gorsel)).length).toBeGreaterThan(0);
      }
    }
  });
});
