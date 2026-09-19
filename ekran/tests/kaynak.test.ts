import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  sahneGetir,
  supabaseKaynakMi,
  tumSahneKodlariniGetir,
  tumSahneleriGetir,
} from "../src/icerik/kaynak";
import { sahneOku, tumSahneKodlari } from "../src/icerik/yukle";

const URL_ADI = "NEXT_PUBLIC_SUPABASE_URL";
const ANAHTAR_ADI = "SUPABASE_SERVICE_ROLE_KEY";

describe("veri kaynağı seçimi (Faz 4.2)", () => {
  let oncekiUrl: string | undefined;
  let oncekiAnahtar: string | undefined;

  beforeEach(() => {
    oncekiUrl = process.env[URL_ADI];
    oncekiAnahtar = process.env[ANAHTAR_ADI];
    delete process.env[URL_ADI];
    delete process.env[ANAHTAR_ADI];
  });

  afterEach(() => {
    if (oncekiUrl === undefined) delete process.env[URL_ADI];
    else process.env[URL_ADI] = oncekiUrl;
    if (oncekiAnahtar === undefined) delete process.env[ANAHTAR_ADI];
    else process.env[ANAHTAR_ADI] = oncekiAnahtar;
  });

  it("değişkenler yoksa dosyalardan okur", () => {
    expect(supabaseKaynakMi()).toBe(false);
  });

  it("İKİSİ de gerekir — yarım yapılandırma dosyaya düşer", () => {
    process.env[URL_ADI] = "https://ornek.supabase.co";
    expect(supabaseKaynakMi()).toBe(false);

    delete process.env[URL_ADI];
    process.env[ANAHTAR_ADI] = "gizli";
    expect(supabaseKaynakMi()).toBe(false);
  });

  it("ikisi de varsa Supabase kaynağı seçilir", () => {
    process.env[URL_ADI] = "https://ornek.supabase.co";
    process.env[ANAHTAR_ADI] = "gizli";
    expect(supabaseKaynakMi()).toBe(true);
  });

  it("boş metin yapılandırma sayılmaz", () => {
    process.env[URL_ADI] = "   ";
    process.env[ANAHTAR_ADI] = "gizli";
    expect(supabaseKaynakMi()).toBe(false);
  });

  it("dosya kaynağında sahne, doğrudan okumayla aynı sonucu verir", async () => {
    const kod = tumSahneKodlari()[0]!;
    expect(await sahneGetir(kod)).toEqual(sahneOku(kod));
  });

  it("dosya kaynağında olmayan sahne null döner", async () => {
    expect(await sahneGetir("eg-b99-s99")).toBeNull();
  });

  it("sahne kodları listesi dosya kaynağıyla aynı", async () => {
    expect(await tumSahneKodlariniGetir()).toEqual(tumSahneKodlari());
  });

  it("sahne listesi cihazlarıyla birlikte gelir", async () => {
    const liste = await tumSahneleriGetir();
    expect(liste.length).toBe(tumSahneKodlari().length);
    for (const { sahne, cihaz } of liste) {
      expect(sahne.kod).toBeTruthy();
      // Sahnenin cihazı içerikte tanımlıysa eşleşmeli.
      if (cihaz !== null) expect(cihaz.kod).toBe(sahne.cihaz);
    }
  });
});
