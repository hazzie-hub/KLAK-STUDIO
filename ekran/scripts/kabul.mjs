/**
 * Kabul testi — Faz 1'in bitiş şartı. CLAUDE.md §9
 *
 *   "Üç sahne iPhone, Android ve bilgisayarda internetsiz,
 *    20 tekrar üst üste hatasız oynuyor."
 *
 * Her sahneyi her kabukta, İNTERNET KESİKKEN, 20 kez üst üste oynatır.
 * Her turda: olayları gizli panelden tetikler, ekranın beklenen hale geldiğini
 * doğrular, başa sarar, ilk hale döndüğünü doğrular.
 *
 * Çalıştırmak için:
 *   npm run build && npm run start   (ayrı bir terminalde)
 *   npm run kabul
 */
import { chromium } from "playwright";

const ADRES = process.env.EKRAN_ADRES ?? "http://localhost:3000";
const TEKRAR = Number(process.env.EKRAN_TEKRAR ?? 20);
const KROM = process.env.PLAYWRIGHT_CHROMIUM;

const KABUKLAR = [
  { ad: "ios", olcu: { width: 390, height: 844 } },
  { ad: "android", olcu: { width: 412, height: 915 } },
  { ad: "desktop", olcu: { width: 1280, height: 800 } },
];

/** Her sahnenin "oldu" ve "başa sardı" hali nasıl anlaşılır. */
const SAHNELER = [
  {
    kod: "eg-b03-s12",
    ad: "kilit ekranına bildirim",
    bitti: (m) => m.includes("Bu akşam konuşmamız lazım.") && m.includes("Uyuyor musun?"),
    basta: (m) => !m.includes("Bu akşam konuşmamız lazım."),
  },
  {
    kod: "eg-b03-s58",
    ad: "post yükleme + tepkiler",
    // Yüklenen postun görselinden bakıyoruz: metinde "201 beğeni" gibi sayılar
    // "1 beğeni" içerdiği için metin eşleşmesi yanıltıcı olur.
    bitti: (m, d) =>
      d.gorseller.includes("/ornek/cicekci.svg") &&
      d.ilkPostBegeni === "1" &&
      m.includes("gonul_yolcusu"),
    basta: (_m, d) => !d.gorseller.includes("/ornek/cicekci.svg"),
  },
  {
    kod: "eg-b03-s59",
    ad: "ghost typing ile yorum",
    bitti: (m) => (m.match(/Teşekkürler, çok naziksiniz/g) ?? []).length >= 1,
    basta: (m) => !m.includes("Teşekkürler, çok naziksiniz"),
  },
  {
    kod: "eg-b03-s13",
    ad: "mesajlaşma",
    bitti: (m) => m.includes("Kimseye söyleme.") && !m.includes("yazıyor…"),
    basta: (m) => !m.includes("Kimseye söyleme."),
  },
  {
    kod: "eg-b03-s44",
    ad: "gelen arama",
    bitti: (m) => m.includes("Sezai") && m.includes("gelen arama"),
    basta: (m) => !m.includes("gelen arama"),
  },
  {
    kod: "eg-b03-s71",
    ad: "pil bitmesi",
    bitti: (_m, d) => d.kapanmaEkrani,
    basta: (_m, d) => !d.kapanmaEkrani,
  },
];

const YASAK_METIN = /hata oluştu|error|exception|undefined|NaN|\[object |Application error/i;

function yaz(satir) {
  process.stdout.write(satir + "\n");
}

async function oku(sayfa) {
  return sayfa.evaluate(() => ({
    metin: document.body.innerText,
    kapanmaEkrani: !!document.querySelector(".z-50.bg-black"),
    gorsel: (() => {
      const g = [...document.querySelectorAll("img")];
      return { toplam: g.length, yuklenen: g.filter((i) => i.naturalWidth > 0).length };
    })(),
    gorseller: [...document.querySelectorAll("img")].map((i) =>
      i.getAttribute("src") ?? "",
    ),
    ilkPostBegeni: (() => {
      const ilk = document.querySelector("article");
      return (ilk?.textContent?.match(/(\d+) beğeni/) ?? [])[1] ?? null;
    })(),
  }));
}

/** Gizli paneli aç, tüm olayları sırayla tetikle, kapat. */
async function olaylariTetikle(sayfa) {
  await sayfa.keyboard.press("Control+Shift+Period");
  await sayfa.waitForSelector('button:has-text("Başa sar")', { timeout: 5000 });

  const butonlar = await sayfa.$$('button:has-text("Şimdi")');
  for (const b of butonlar) {
    await b.click();
    await sayfa.waitForTimeout(30);
  }
  await sayfa.click('button:has-text("Kapat")');
  await sayfa.waitForTimeout(160);
}

/** Sol üst köşeye 5 dokunuş — panelsiz başa sar (CLAUDE.md §6). */
async function basaSar(sayfa) {
  const k = await sayfa.evaluate(() => {
    const r = document.querySelector("[data-oynatici]").getBoundingClientRect();
    return { sol: r.left, ust: r.top };
  });
  for (let i = 0; i < 5; i++) {
    await sayfa.mouse.click(k.sol + 18, k.ust + 18);
    await sayfa.waitForTimeout(35);
  }
  await sayfa.waitForTimeout(200);
}

const tarayici = await chromium.launch(KROM ? { executablePath: KROM } : {});
const baglam = await tarayici.newContext({ serviceWorkers: "allow" });

// ── Önbelleği doldur (sette de böyle olur: bir kez internetle açılır)
yaz("\nÖnbellek dolduruluyor…");
{
  const s = await baglam.newPage();
  for (const sahne of SAHNELER) {
    await s.goto(`${ADRES}/p/${sahne.kod}`, { waitUntil: "domcontentloaded" });
    await s.waitForTimeout(2500);
  }
  const sayi = await s.evaluate(async () => {
    let n = 0;
    for (const ad of await caches.keys()) {
      n += (await (await caches.open(ad)).keys()).length;
    }
    return n;
  });
  yaz(`  önbellekte ${sayi} dosya`);
  await s.close();
}

// ── İNTERNETİ KES
await baglam.setOffline(true);
yaz("İnternet kesildi. Kabul testi başlıyor.\n");

const basarisizliklar = [];
let toplamTur = 0;
const baslangic = Date.now();

for (const kabuk of KABUKLAR) {
  for (const sahne of SAHNELER) {
    const sayfa = await baglam.newPage();
    await sayfa.setViewportSize(kabuk.olcu);

    const konsolHatalari = [];
    sayfa.on("console", (m) => {
      if (m.type() === "error") konsolHatalari.push(m.text());
    });
    sayfa.on("pageerror", (e) => konsolHatalari.push(`PAGEERROR ${e.message}`));

    await sayfa.goto(`${ADRES}/p/${sahne.kod}?skin=${kabuk.ad}`, { waitUntil: "domcontentloaded" });
    await sayfa.waitForTimeout(900);

    const etiket = `${kabuk.ad.padEnd(8)} ${sahne.kod.padEnd(12)} ${sahne.ad}`;
    let turHatasi = null;

    for (let tur = 1; tur <= TEKRAR; tur++) {
      toplamTur++;
      try {
        await olaylariTetikle(sayfa);
        const sonra = await oku(sayfa);

        if (!sahne.bitti(sonra.metin, sonra)) {
          throw new Error(`tur ${tur}: sahne beklenen hale gelmedi`);
        }
        if (YASAK_METIN.test(sonra.metin)) {
          throw new Error(`tur ${tur}: ekranda teknik metin var`);
        }
        if (sonra.gorsel.toplam > 0 && sonra.gorsel.yuklenen < sonra.gorsel.toplam) {
          throw new Error(
            `tur ${tur}: görsel eksik (${sonra.gorsel.yuklenen}/${sonra.gorsel.toplam})`,
          );
        }

        await basaSar(sayfa);
        const bas = await oku(sayfa);
        if (!sahne.basta(bas.metin, bas)) {
          throw new Error(`tur ${tur}: başa sarma eksik kaldı`);
        }
      } catch (e) {
        turHatasi = e instanceof Error ? e.message : String(e);
        break;
      }
    }

    if (konsolHatalari.length > 0 && turHatasi === null) {
      turHatasi = `konsol hatası: ${konsolHatalari[0].slice(0, 90)}`;
    }

    if (turHatasi === null) {
      yaz(`  ✓ ${etiket}  ${TEKRAR}/${TEKRAR} tur`);
    } else {
      yaz(`  ✗ ${etiket}  ${turHatasi}`);
      basarisizliklar.push(`${kabuk.ad} · ${sahne.kod}: ${turHatasi}`);
    }

    await sayfa.close();
  }
}

// ── 2. AŞAMA: gerçek dokunuşlar, gerçek zamanlayıcılar ───────────────────────
//
// Yukarıdaki turlar olayları gizli panelden tetikledi — sette operatörün
// yaptığı şey bu. Burada oyuncunun yaptığını yapıyoruz: gerçek dokunuşlar ve
// zincirin kendi süresini beklemek.

const GERCEK_TUR = Number(process.env.EKRAN_GERCEK_TUR ?? 3);
yaz("");
yaz(`Gerçek dokunuş + gerçek zamanlayıcı turları (${GERCEK_TUR}×):`);

for (const kabuk of KABUKLAR) {
  const sayfa = await baglam.newPage();
  await sayfa.setViewportSize(kabuk.olcu);
  const konsolHatalari = [];
  sayfa.on("console", (m) => {
    if (m.type() === "error") konsolHatalari.push(m.text());
  });
  sayfa.on("pageerror", (e) => konsolHatalari.push(`PAGEERROR ${e.message}`));

  await sayfa.goto(`${ADRES}/p/eg-b03-s58?skin=${kabuk.ad}`, { waitUntil: "domcontentloaded" });
  await sayfa.waitForTimeout(900);

  let hata = null;
  const olculenler = [];

  for (let tur = 1; tur <= GERCEK_TUR; tur++) {
    try {
      const t0 = Date.now();
      await sayfa.click('button[aria-label="yukle"]');
      await sayfa.waitForTimeout(220);
      await sayfa.click('button:has-text("İleri")');
      await sayfa.waitForTimeout(180);
      await sayfa.click('button:has-text("Paylaş")');
      await sayfa.waitForTimeout(400);

      let d = await oku(sayfa);
      if (d.ilkPostBegeni !== "0") throw new Error(`tur ${tur}: post yüklenmedi`);

      // Beğeni 5 sn sonra gelmeli
      await sayfa.waitForTimeout(5000);
      d = await oku(sayfa);
      if (d.ilkPostBegeni !== "1") throw new Error(`tur ${tur}: beğeni gelmedi`);
      const begeniAni = Date.now() - t0;

      // Yorum 0,8 sn sonra
      await sayfa.waitForTimeout(1100);
      d = await oku(sayfa);
      if (!d.metin.includes("gonul_yolcusu")) throw new Error(`tur ${tur}: yorum gelmedi`);
      if (d.gorsel.yuklenen < d.gorsel.toplam) {
        throw new Error(`tur ${tur}: görsel eksik (${d.gorsel.yuklenen}/${d.gorsel.toplam})`);
      }
      olculenler.push(begeniAni);

      await basaSar(sayfa);
      const bas = await oku(sayfa);
      if (bas.gorseller.includes("/ornek/cicekci.svg")) {
        throw new Error(`tur ${tur}: başa sarma eksik kaldı`);
      }
    } catch (e) {
      hata = e instanceof Error ? e.message : String(e);
      break;
    }
  }

  if (hata === null && konsolHatalari.length > 0) {
    hata = `konsol hatası: ${konsolHatalari[0].slice(0, 90)}`;
  }

  if (hata === null) {
    const ortalama = Math.round(olculenler.reduce((a, b) => a + b, 0) / olculenler.length);
    yaz(`  ✓ ${kabuk.ad.padEnd(8)} eg-b03-s58   ${GERCEK_TUR}/${GERCEK_TUR} tur · beğeni ~${(ortalama / 1000).toFixed(1)} sn'de`);
  } else {
    yaz(`  ✗ ${kabuk.ad.padEnd(8)} eg-b03-s58   ${hata}`);
    basarisizliklar.push(`${kabuk.ad} · gerçek tur: ${hata}`);
  }
  await sayfa.close();
}

const sure = ((Date.now() - baslangic) / 1000).toFixed(0);
yaz("");
if (basarisizliklar.length === 0) {
  yaz(`✓ KABUL TESTİ GEÇTİ`);
  yaz(`  panelden sürülen : ${KABUKLAR.length} kabuk × ${SAHNELER.length} sahne × ${TEKRAR} tur = ${toplamTur} tur`);
  yaz(`  gerçek dokunuşlu : ${KABUKLAR.length} kabuk × eg-b03-s58 × ${GERCEK_TUR} tur`);
  yaz(`  internet kesik, ${sure} saniye`);
} else {
  yaz(`✗ KABUL TESTİ GEÇMEDİ — ${basarisizliklar.length} başarısızlık:`);
  for (const b of basarisizliklar) yaz(`  · ${b}`);
}

await tarayici.close();
process.exit(basarisizliklar.length === 0 ? 0 : 1);
