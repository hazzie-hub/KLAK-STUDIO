/**
 * Sahne şablonları. CLAUDE.md §8
 *
 * Sık kurulan sahneleri sıfırdan kurmak yerine hazır iskeletten başlatır.
 * Şablon GEÇERLİ BİR SAHNE ÜRETMEK ZORUNDA DEĞİL: içerik referansları
 * (hangi sohbet, hangi post, hangi hesap) yapıma göre değiştiği için boş
 * bırakılır; form bunları açılır listeden doldurtur ve Zod eksikleri söyler.
 *
 * Şablonun sorumluluğu YAPI: doğru modül, doğru olay sırası, doğru tetikler
 * ve sete gidecek talimatın taslağı.
 */
export type SablonTaslagi = Record<string, unknown>;

export type Sablon = {
  id: string;
  ad: string;
  aciklama: string;
  /** Formda doldurulması gereken alanlar — kullanıcıya önceden söylenir. */
  doldurulacak: string[];
  uret: (kod: string, cihaz: string) => SablonTaslagi;
};

const durum = { baglanti: "normal", gorsel: "normal" } as const;

function iskelet(
  kod: string,
  cihaz: string,
  modul: string,
  ekran: string,
  talimat: string,
  olaylar: SablonTaslagi[],
  ek: SablonTaslagi = {},
): SablonTaslagi {
  return {
    kod,
    cihaz,
    baslangic: { modul, ekran, ...ek },
    durum: { ...durum },
    olaylar,
    talimat,
  };
}

export const SABLONLAR: readonly Sablon[] = [
  {
    id: "kilit-bildirim",
    ad: "Kilit ekranına bildirim",
    aciklama: "Telefon kilitli, masada duruyor. Arka arkaya iki bildirim düşer.",
    doldurulacak: ["Bildirimlerin başlıkları (kimden)", "Bildirim metinleri"],
    uret: (kod, cihaz) =>
      iskelet(
        kod,
        cihaz,
        "kilit",
        "kilit",
        "Telefon kilitli, masada duruyor. Sahne açıldıktan 2,5 sn sonra ilk bildirim düşer, 4 sn sonra ikincisi gelir. Kumandadan elle de tetiklenebilir.",
        [
          {
            id: "ilk-bildirim",
            ad: "İlk bildirim düşer",
            tetik: { tur: "baslangic", gecikme: 2500 },
            aksiyon: { tur: "bildirim", uygulama: "mesaj", baslik: "", metin: "" },
          },
          {
            id: "ikinci-bildirim",
            ad: "İkinci bildirim düşer",
            tetik: { tur: "sonra", olayId: "ilk-bildirim", gecikme: 4000 },
            aksiyon: { tur: "bildirim", uygulama: "mesaj", baslik: "", metin: "" },
          },
        ],
      ),
  },

  {
    id: "dm-sohbet",
    ad: "Mesajlaşma",
    aciklama: "Sohbet ekranı açık. Karşı taraf yazmaya başlar, mesaj düşer, görüldü olur.",
    doldurulacak: ["Açılış içeriği (sohbet)", "Olaylardaki sohbet ve mesaj metinleri"],
    uret: (kod, cihaz) =>
      iskelet(
        kod,
        cihaz,
        "mesaj",
        "sohbet",
        "Sohbet ekranı açık. 1,5 sn sonra gönderilen mesaj görüldü olur, 2 sn sonra karşı taraf yazmaya başlar, 3,5 sn sonra mesaj düşer. Replikler senaryodan alınmalı.",
        [
          {
            id: "goruldu",
            ad: "Mesaj görüldü olur",
            tetik: { tur: "baslangic", gecikme: 1500 },
            aksiyon: { tur: "mesajDurumu", sohbet: "", durum: "goruldu" },
          },
          {
            id: "yaziyor",
            ad: "Karşı taraf yazmaya başlar",
            tetik: { tur: "sonra", olayId: "goruldu", gecikme: 2000 },
            aksiyon: { tur: "yaziyor", sohbet: "" },
          },
          {
            id: "cevap",
            ad: "Cevap düşer",
            tetik: { tur: "sonra", olayId: "yaziyor", gecikme: 3500 },
            aksiyon: { tur: "mesajGeldi", sohbet: "", metin: "" },
          },
        ],
      ),
  },

  {
    id: "post-yukle-tepki",
    ad: "Post yükle, tepki gelsin",
    aciklama: "Oyuncu post yükler; ardından beğeni ve yorum gelir.",
    doldurulacak: ["Açılış hesabı", "Yüklenecek post", "Tepki veren hesaplar"],
    uret: (kod, cihaz) =>
      iskelet(
        kod,
        cihaz,
        "sosyal",
        "yukle",
        "Post yükleme akışı açık. Oyuncu postu paylaşır; 5 sn sonra beğeni, 3 sn sonra yorum gelir. Yorum metni senaryodan alınmalı.",
        [
          {
            id: "post-dustu",
            ad: "Post akışa düşer",
            tetik: { tur: "dokunma", hedef: "post-paylasildi" },
            aksiyon: { tur: "postYukle", icerikRef: "" },
          },
          {
            id: "begeni",
            ad: "Beğeni gelir",
            tetik: { tur: "sonra", olayId: "post-dustu", gecikme: 5000 },
            aksiyon: { tur: "begeniGeldi", hesap: "" },
          },
          {
            id: "yorum",
            ad: "Yorum gelir",
            tetik: { tur: "sonra", olayId: "begeni", gecikme: 3000 },
            aksiyon: { tur: "yorumGeldi", hesap: "", metin: "" },
          },
        ],
      ),
  },

  {
    id: "gelen-arama",
    ad: "Gelen arama",
    aciklama: "Telefon kilitli; biri arar, gelen arama ekranı her şeyin üstünü kaplar.",
    doldurulacak: ["Arayanın adı", "Arayanın fotoğrafı (isteğe bağlı)"],
    uret: (kod, cihaz) =>
      iskelet(
        kod,
        cihaz,
        "kilit",
        "kilit",
        "Telefon kilitli. 3 sn sonra telefon çalar; gelen arama ekranı her şeyin üstünü kaplar. Oyuncu Kabul et ya da Reddet'e basar. Kabul edince sayaç işlemeye başlar.",
        [
          {
            id: "arama-geliyor",
            ad: "Telefon çalar",
            tetik: { tur: "baslangic", gecikme: 3000 },
            aksiyon: { tur: "aramaGeldi", arayan: "" },
          },
        ],
      ),
  },

  {
    id: "kesfet-yorum",
    ad: "Keşfette gezinme + yorum",
    aciklama: "Oyuncu keşfette gezer, bir posta yorum yazar (ghost typing).",
    doldurulacak: ["Açılış hesabı", "Yorum yazılacak post", "Yorum metni"],
    uret: (kod, cihaz) =>
      iskelet(
        kod,
        cihaz,
        "sosyal",
        "kesfet",
        "Keşfet ekranı açık. Oyuncu bir posta girer, yorum alanına dokunur ve KLAVYEDE İSTEDİĞİ TUŞLARA BASAR — senaryodaki metin kendiliğinden yazılır. Metin bitince Paylaş aktifleşir.",
        [
          {
            id: "yazmaya-basla",
            ad: "Yorum alanına dokunulur, klavye açılır",
            tetik: { tur: "dokunma", hedef: "yorum-alani" },
            aksiyon: {
              tur: "ghostTypingBaslat",
              hedef: "yorum-yaz",
              metin: "",
              mod: "senaryolu",
            },
          },
          {
            id: "yorum-paylasilir",
            ad: "Yorum paylaşılır",
            tetik: { tur: "dokunma", hedef: "yorum-gonderildi" },
            aksiyon: { tur: "yorumGeldi", hesap: "", metin: "" },
          },
        ],
      ),
  },

  {
    id: "pil-bitiyor",
    ad: "Pil bitiyor",
    aciklama: "Pil düşer, uyarı çıkar, telefon kapanır.",
    doldurulacak: [],
    uret: (kod, cihaz) =>
      iskelet(
        kod,
        cihaz,
        "kilit",
        "kilit",
        "Telefon açık. 2,5 sn sonra pil %5'e düşer ve uyarı çıkar, 7 sn sonra %1, 5 sn sonra telefon kapanır. Kapanma kumandadan elle tetiklenerek replikle eşlenebilir.",
        [
          {
            id: "pil-dustu",
            ad: "Pil %5'e düşer, uyarı çıkar",
            tetik: { tur: "baslangic", gecikme: 2500 },
            aksiyon: { tur: "pilDegisti", seviye: 5 },
          },
          {
            id: "pil-kritik",
            ad: "Pil %1'e düşer",
            tetik: { tur: "sonra", olayId: "pil-dustu", gecikme: 7000 },
            aksiyon: { tur: "pilDegisti", seviye: 1 },
          },
          {
            id: "telefon-kapandi",
            ad: "Telefon kapanır",
            tetik: { tur: "sonra", olayId: "pil-kritik", gecikme: 5000 },
            aksiyon: { tur: "pilDegisti", seviye: 0 },
          },
        ],
        {},
      ),
  },

  {
    id: "arama-site",
    ad: "Arama motoru + sonuç sitesi",
    aciklama: "Oyuncu arama yapar, sonuçlar gelir, bir sonuca girer ve site açılır.",
    doldurulacak: ["Açılış içeriği (arama sonucu)", "Aranacak metin", "Açılacak site"],
    uret: (kod, cihaz) =>
      iskelet(
        kod,
        cihaz,
        "arama",
        "ana",
        "Arama sayfası açık. Oyuncu arama çubuğuna dokunur, klavye açılır; KLAVYEDE İSTEDİĞİ TUŞLARA BASAR — senaryodaki metin kendiliğinden yazılır. Metin bitince ara düğmesi aktifleşir; basınca sonuçlar gelir. Bir sonuca dokununca o site açılır.",
        [
          {
            id: "yazmaya-basla",
            ad: "Arama çubuğuna dokunulur",
            tetik: { tur: "dokunma", hedef: "arama-alani" },
            aksiyon: {
              tur: "ghostTypingBaslat",
              hedef: "arama-cubugu",
              metin: "",
              mod: "senaryolu",
            },
          },
          {
            id: "sonuclar-gelir",
            ad: "Sonuç sayfası açılır",
            tetik: { tur: "dokunma", hedef: "arama-yapildi" },
            aksiyon: { tur: "ekranAc", modul: "arama", ekran: "sonuclar", icerikRef: "" },
          },
          {
            id: "siteye-gir",
            ad: "İlk sonuca dokunulur, site açılır",
            tetik: { tur: "dokunma", hedef: "arama-sonuc-1" },
            aksiyon: { tur: "ekranAc", modul: "web", ekran: "sayfa", icerikRef: "" },
          },
        ],
      ),
  },
];

export function sablonAl(id: string): Sablon | null {
  return SABLONLAR.find((s) => s.id === id) ?? null;
}
