import { describe, expect, it } from "vitest";

import { alanKimligi, hatalariDuzenle } from "../src/studio/hatalar";

const sahne = {
  kod: "eg-b03-s90",
  olaylar: [
    { id: "ilk", ad: "Sezai'den ilk mesaj düşer", tetik: { tur: "baslangic" }, aksiyon: { tur: "bildirim" } },
    { id: "", ad: "", tetik: { tur: "sonra" }, aksiyon: { tur: "mesajGeldi" } },
  ],
};

describe("hata başlıkları", () => {
  it("sahne alanlarını okunur adla söyler", () => {
    const [h] = hatalariDuzenle([{ yol: "talimat", mesaj: "Boş olamaz." }], sahne);
    expect(h?.baslik).toBe("Sete gidecek talimat");
  });

  it("olay numarasını ve adını söyler", () => {
    const [h] = hatalariDuzenle([{ yol: "olaylar.0.id", mesaj: "Hatalı." }], sahne);
    expect(h?.baslik).toBe("1. olay (Sezai'den ilk mesaj düşer) · Kimlik");
  });

  it("adsız olayda yalnızca numara yazar", () => {
    const [h] = hatalariDuzenle([{ yol: "olaylar.1.ad", mesaj: "Boş olamaz." }], sahne);
    expect(h?.baslik).toBe("2. olay · Olay adı");
  });

  it("aksiyon alanının etiketini alan tablosundan alır", () => {
    const [h] = hatalariDuzenle([{ yol: "olaylar.1.aksiyon.sohbet", mesaj: "Gerekli." }], sahne);
    expect(h?.baslik).toBe("2. olay · Ne olsun · Sohbet");
  });

  it("tetik alanının etiketini de bulur", () => {
    const [h] = hatalariDuzenle([{ yol: "olaylar.1.tetik.olayId", mesaj: "Yok." }], sahne);
    expect(h?.baslik).toBe("2. olay · Ne zaman · Hangi olaydan sonra");
  });

  it("yolu olmayan hata genel başlık alır", () => {
    const [h] = hatalariDuzenle([{ yol: "", mesaj: "Bağlantı yok." }], sahne);
    expect(h?.baslik).toBe("Sahne");
  });

  it("AYNI hata iki kez gösterilmez", () => {
    const liste = hatalariDuzenle(
      [
        { yol: "olaylar.0.id", mesaj: "Hatalı." },
        { yol: "olaylar.0.id", mesaj: "Hatalı." },
        { yol: "olaylar.0.id", mesaj: "Başka bir sorun." },
      ],
      sahne,
    );
    expect(liste).toHaveLength(2);
  });

  it("hatanın yolu korunur — tıklayınca alana kaymak için", () => {
    const [h] = hatalariDuzenle([{ yol: "olaylar.0.aksiyon.metin", mesaj: "x" }], sahne);
    expect(h?.yol).toBe("olaylar.0.aksiyon.metin");
  });
});

describe("boş alan mesajları", () => {
  const bosSahne = {
    kod: "",
    cihaz: "",
    olaylar: [{ id: "bir", ad: "Bir olay", tetik: { tur: "elle" }, aksiyon: { tur: "bildirim", baslik: "" } }],
  };

  it("boş alanda biçim dersi yerine kısa cümle yazar", () => {
    const [h] = hatalariDuzenle(
      [{ yol: "cihaz", mesaj: "Sadece küçük harf, rakam ve tire kullanılabilir." }],
      bosSahne,
    );
    expect(h?.mesaj).toBe("Doldurulmalı.");
  });

  it("tanımsız alan da boş sayılır", () => {
    const [h] = hatalariDuzenle(
      [{ yol: "olaylar.0.aksiyon.metin", mesaj: "Metin bekleniyordu." }],
      bosSahne,
    );
    expect(h?.mesaj).toBe("Doldurulmalı.");
  });

  it("DOLU alanın kendi mesajı korunur", () => {
    const [h] = hatalariDuzenle(
      [{ yol: "kod", mesaj: "Sahne kodu biçimi yanlış." }],
      { ...bosSahne, kod: "RASTGELE" },
    );
    expect(h?.mesaj).toBe("Sahne kodu biçimi yanlış.");
  });

  it("aynı alana düşen iki farklı sorun tek satıra iner", () => {
    const liste = hatalariDuzenle(
      [
        { yol: "cihaz", mesaj: "Metin bekleniyordu." },
        { yol: "cihaz", mesaj: "Sadece küçük harf, rakam ve tire kullanılabilir." },
      ],
      bosSahne,
    );
    expect(liste).toHaveLength(1);
    expect(liste[0]?.mesaj).toBe("Doldurulmalı.");
  });
});

describe("alan kimliği", () => {
  it("noktaları tireye çevirir — geçerli bir DOM kimliği olmalı", () => {
    expect(alanKimligi("olaylar.0.aksiyon.metin")).toBe("alan-olaylar-0-aksiyon-metin");
    expect(alanKimligi("talimat")).toBe("alan-talimat");
  });
});
