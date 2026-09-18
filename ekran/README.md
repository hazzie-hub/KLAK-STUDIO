# Ekran

Set ekran sistemi — TV dizileri ve filmler için, setteki telefon ve bilgisayar
ekranlarında oynatılan kurgusal arayüzler.

Projenin anayasası: [`CLAUDE.md`](./CLAUDE.md). Her oturumda önce o okunur.

## Kurulum

```bash
cd ekran
npm install
```

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run validate` | `/content` altındaki tüm sahne ve veri dosyalarını denetler |
| `npm test` | Şema testlerini çalıştırır |
| `npm run typecheck` | TypeScript tip denetimi |
| `npm run dev` | Geliştirme sunucusu (http://localhost:3000) |
| `npm run build` | Üretim derlemesi |

## Klasörler

```
/app          Next.js sayfaları (oynatıcı /p, kumanda /k, stüdyo /studio buraya gelecek)
/src
  /schema     Zod şemaları — SAHNE VERİSİNİN TEK KAYNAĞI
  /engine     zaman çizelgesi, tetikler, durum        (Adım 4)
  /shell      cihaz kabukları: ios, android, desktop  (Adım 2)
  /system     bildirim, arama ekranı, kilit, pil       (Adım 5)
  /modules    kilit, sosyal, …                         (Adım 5, 7)
  /shared     ghost-typing, hotspot, medya, derin-link (Adım 3, 8)
  /platform   tarayıcıya özel API'ler                  (Adım 10)
/brands       kurgusal marka isimleri ve renkleri      (Adım 7)
/content      sahne ve içerik verisi (Faz 1–3 dosya tabanlı)
/scripts      validate.ts
/tests        şema testleri
```

## Yeni sahne nasıl yazılır

1. `content/sahneler/` altına `{diziKodu}-b{bölüm}-s{sahne}.json` adıyla dosya aç.
2. `content/sahneler/eg-b03-s58.json` dosyasını örnek al.
3. `npm run validate` çalıştır. Yeşil tik görene kadar düzelt.

Sahne için **kod yazılmaz** (CLAUDE.md §2.2). Mevcut aksiyonlarla yapılamayan bir
şey varsa çözüm yeni bir *genel* aksiyon eklemektir, sahneye özel hack değil.

## Şemanın kapsadıkları

- **Tetikler:** `baslangic`, `sonra`, `dokunma`, `elle`
- **Aksiyonlar:** `bildirim`, `yorumGeldi`, `begeniGeldi`, `takipGeldi`, `mesajGeldi`,
  `yaziyor`, `aramaGeldi`, `pilDegisti`, `baglantiDegisti`, `ekranAc`,
  `ghostTypingBaslat`, `postYukle`
- **Denetimler:** benzersiz olay id'leri, var olmayan olaya bağlanan zincir,
  kendi kendini bekleyen olay, zincirde döngü, dosyalar arası referanslar
  (sahne → cihaz, olay → hesap, post → içerik)

## Şema notu

CLAUDE.md §5'teki `Sahne` tipi ile aynı bölümdeki örnek JSON birbirini tam tutmuyor.
Faz 1 dosya tabanlı olduğu için **örnekteki slug biçimi** esas alındı
(`cihaz: "nergis-pc"`, `baslangic.hesap`); `id`, `bolumId`, `versiyon`, `kilitli`
alanları opsiyonel bırakıldı. Stüdyo'ya (Faz 4) geçerken bunlar zorunlu olacak.
