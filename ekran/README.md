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
| `npm run kabul` | Kabul testi — aşağıya bak |
| `npm run dev` | Geliştirme sunucusu (http://localhost:3000) |
| `npm run build` | Üretim derlemesi |

## Kabul testi

Faz 1'in bitiş şartı (CLAUDE.md §9): sahneler üç cihazda, **internetsiz**,
**20 tekrar üst üste** hatasız oynamalı. `npm run kabul` bunu otomatik yapar.

```bash
npx playwright install chromium   # bir kereye mahsus
npm run build && npm run start    # ayrı bir terminalde
npm run kabul
```

İki aşamalı:

1. **Panelden sürülen turlar** — 3 kabuk × 4 sahne × 20 tur = 240 tur.
   Her turda olaylar gizli panelden tetiklenir (sette operatörün yaptığı),
   ekranın beklenen hale geldiği doğrulanır, sol üst köşeye 5 dokunuşla başa
   sarılır ve ilk hale döndüğü doğrulanır.
2. **Gerçek dokunuşlu turlar** — oyuncunun yaptığı: `+` → fotoğraf → Paylaş,
   sonra zincirin kendi süresini beklemek.

Her turda denetlenen: beklenen son durum, ekranda teknik metin olmaması,
tüm görsellerin yüklenmiş olması, başa sarmanın tam olması, konsolun temiz olması.

Son çalıştırma: **240 + 9 tur, internet kesik, sıfır hata.**

> Bu otomatik test gerçek cihaz testinin YERİNE GEÇMEZ. Faz 1 ancak sahneler
> gerçek bir iPhone'da, gerçek bir Android'de ve set bilgisayarında uçak
> modunda oynatıldıktan sonra biter.

## Klasörler

```
/app          Next.js sayfaları
  /p/[kod]    oynatıcı
/public       statik dosyalar (ikon)
/src
  /schema     Zod şemaları — SAHNE VERİSİNİN TEK KAYNAĞI
  /engine     zaman çizelgesi motoru, tetikler
  /shell      cihaz kabukları: ios, android, desktop
  /system     bildirim bannerı, pil uyarısı, kapanma ekranı
  /modules    kilit, sosyal; diğerleri Faz 3-4'te
  /durum      cihaz durumu katmanı: pil, sinyal, bağlantı, görsel yükleme
  /shared     medya bileşeni, ghost-typing
  /platform   tarayıcıya özel API'ler, gizli dokunuş, hazırlık
  /icerik     dosyadan sahne/cihaz/hesap okuma
/brands       kurgusal marka isimleri ve renkleri
/content      sahne ve içerik verisi (Faz 1–3 dosya tabanlı)
/scripts      validate.ts
/tests        şema testleri
```

## Oynatıcıyı açma

```bash
npm run dev
```

| Adres | Ne gösterir |
|---|---|
| `/p/eg-b03-s58` | Sahnenin kendi cihaz kabuğu, tam ekran (sette böyle çalışır) |
| `/p/eg-b03-s12` | Kilit ekranına bildirim düşen sahne |
| `/p/eg-b03-s71` | Pil bitip telefonun kapandığı sahne (Android) |
| `/p/eg-b03-s59` | Nergis ghost typing ile yorum yazar |
| `/p/eg-b03-s58?onizleme=1` | Bilgisayarda bakmak için cihaz çerçevesi içinde |
| `/p/eg-b03-s58?skin=ios` | Kabuğu ezer — `ios`, `android`, `desktop` |

Cihaz durumunu **test için** adres çubuğundan ezebilirsin (gizli panel bunu
Adım 6'da sette yapacak). Geçersiz değer sessizce yok sayılır:

| Ezme | Ne olur |
|---|---|
| `?baglanti=yavas` | Sinyal 2 çubuğa düşer, görseller gecikir |
| `?baglanti=yok` | Sinyal 0, wifi söner, görseller hiç gelmez |
| `?gorsel=gec` | Görseller gecikerek gelir |
| `?gorsel=yuklenmez` | Görseller kırık kalır |
| `?pil=5` | Pil %5 (≤20 kırmızı) |
| `?sarjda=1` | Şarjda (yeşil + şimşek) |
| `?saat=07:30` | Saati değiştirir |
| `?tarih=3 Mart Pazartesi` | Kilit ekranındaki tarihi değiştirir |


**Önizleme modu neden var:** sette oynatıcı ekranı tamamen doldurur ve çentik
çizilmez — gerçek cihazın çentiği zaten fiziksel olarak oradadır. Bilgisayarda
bakarken cihaz şeklini görmek için `?onizleme=1` çerçeveyi ve çentiği çizer.

Olmayan bir sahne kodu açılırsa ekran **sessizce siyah** kalır; sebep yalnızca
konsola yazılır (CLAUDE.md §2.6: kamerada hata görünmez).

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
## Offline çalışma

CLAUDE.md §2.3: oynatıcı bir kez yüklendikten sonra internetsiz çalışır.

Service worker (Serwist) derleme anında **55 dosyayı** önbelleğe alır: sahne
sayfaları, JS, CSS, gömülü fontlar ve `/public` altındaki tüm görseller.
Sahne dosyası değişirse içerik özeti değişir ve önbellek kendiliğinden yenilenir.

Tarayıcıda ölçüldü — internet kesildikten sonra:

| Ne | Sonuç |
|---|---|
| Sayfa yeniden yüklendi | açıldı, 11/11 görsel geldi |
| Başka bir sahneye geçildi | açıldı, duvar kâğıdı geldi |
| Sahne baştan sona oynatıldı | post yüklendi, +5 sn beğeni, yorum düştü |
| Hata metni | yok |

> Geliştirme sırasında (`npm run dev`) service worker **kapalıdır**, yoksa
> yaptığın değişiklikler görünmez.

## Set telefonu hazırlığı (iOS)

Gerçek iPhone'da denendi; sırası önemli:

1. Sahneyi **Safari'de** aç
2. **Paylaş → Ana Ekrana Ekle** → ana ekrandaki ikondan aç
   *(Safari'den açarsan kamerada iki saat görünür: iPhone'unki + bizimki, ayrıca
   altta tarayıcı çubuğu kalır. Gizli panel bunu uyarı olarak gösterir.)*
3. Gizli panelden **"Hazır — internet kesilebilir"** yazdığını gör
4. **Uçak moduna** al
5. **Rehberli Erişim**'i aç (Ayarlar → Erişilebilirlik → Rehberli Erişim).
   Telefonun kendi durum çubuğunu gizleyen tek yol budur; web sayfası onu
   koddan kaldıramaz.

Ayrıca CLAUDE.md §6: Odak/Rahatsız Etme açık, otomatik kilit kapalı,
parlaklık sabit.

## Hazır göstergesi

CLAUDE.md §6: tüm varlıklar inince operatöre sadece onun anlayacağı bir işaret
verilir — **saatin iki noktası bir kez yanıp söner**. Desktop kabuğunda durum
çubuğu olmadığı için işaret adres çubuğundaki kilit ikonunda görünür.

Kameraya fark edilir hiçbir şey çıkmaz: yükleniyor çarkı, yüzde, metin yok.

## Ghost typing

CLAUDE.md §7. Tüm yazma alanları `src/shared/ghost-typing` üzerinden geçer.

| Mod | Davranış |
|---|---|
| `senaryolu` (varsayılan) | Sahte klavye çizilir. **Hangi tuşa basılırsa basılsın** senaryodaki metnin sıradaki harfi yazılır. Metin bitince tuşlar etkisizleşir, "Paylaş" aktifleşir. |
| `otomatik` | Kimse dokunmadan, verilen hızda kendi kendine yazar (insert çekimler). Klavye çizilmez. |
| `serbest` | Gerçek klavye/input. Sahnede açıkça seçilirse. |

**Masaüstünde** sahte klavye çizilmez; fiziksel klavye dinlenir — yine hangi
tuşa basıldığı önemsizdir. Backspace son harfi siler.

**Türkçe ve emoji:** metin `Intl.Segmenter` ile ekranda görünen harflere bölünür,
bu yüzden emoji tek adımda gelir, hiçbir adımda yarım karakter görünmez.
Klavye düzeni Türkçe Q.

Doğrulandı: 31 anlamsız tuşa basıldığında ekranda tam olarak
`Teşekkürler, çok naziksiniz 🌿` çıkıyor; fazladan basılan tuşlar bir şey
yapmıyor.

## Kurgusal markalar

CLAUDE.md §2.1: gerçek marka yok. Uygulama adları ve renkleri **tek yerden**
(`/brands`) yönetilir, hiçbir modüle elle yazılmaz.

| Slug | Ad | Nerede |
|---|---|---|
| `akis` | **Akış** | `sosyal` modülü |
| `mesaj` | **Mesaj** | bildirimler; `mesaj` modülü Faz 3'te |

Bir test, `src/`, `brands/` ve `content/` altındaki **hiçbir dosyada** gerçek
uygulama adının geçmediğini denetliyor — yorum satırlarında bile.

## sosyal modülü (Akış)

Ekranlar: feed, keşfet, gönderi detayı, yorumlar, profil, aktivite, post yükleme.

**Modül kendi sayacını tutmaz.** Beğeni sayısı = temel sayı + gerçekleşen
`begeniGeldi` olayları; yorumlar = kütüphanedeki yorumlar + gerçekleşen
`yorumGeldi` olayları. Bu yüzden başa sar tek satır ve her tekrar birebir aynı.
Türetme `src/modules/sosyal/veri.ts` içinde saf bir fonksiyon — React'siz test edilir.

**Sahnede yüklenecek post feed'de görünmez** (`postYukle` gerçekleşene kadar),
sonra en üstte belirir.

**Dokunma hedefleri** (sahneler bunları `{ tur: "dokunma", hedef: ... }` ile kullanır):

| Hedef | Ne zaman |
|---|---|
| `yeni-post-akisi-basladi` | + düğmesine basıldı |
| `yeni-post-akisi-tamam` | "Paylaş"a basıldı |

## Gizli ayar paneli

Sette operatörün kullandığı yer. CLAUDE.md §6.

| Nasıl açılır | |
|---|---|
| Sağ üst köşeye **2 sn içinde 5 dokunuş** | Panel açılır |
| `Ctrl+Shift+.` | Panel açılır/kapanır (masaüstü) |
| Sol üst köşeye **2 sn içinde 5 dokunuş** | Panelsiz **başa sar** |

İçinde: olay listesi + her olay için "Şimdi", süreli olaylarda gecikme ±250 ms,
dokunma hedefleri, cihaz durumu (bağlantı/görsel/pil/şarj), kabuk değiştirme,
başa sar.

**Başka hiçbir hareket paneli açmaz.** Kaydırma, uzun basma ve yavaş yapılan
5 dokunuş sayılmaz; ekrana görünmez katman konmaz, dokunuşlar yalnızca dinlenir
(altındaki modül normal çalışmaya devam eder). Tarayıcıda ölçüldü: ortaya 5
dokunuş, köşeye yavaş 5 dokunuş ve köşede 5 kaydırma paneli **açmıyor**.

**Gecikme ayarları başa sardıktan sonra da geçerli kalır** — operatör ayarlar,
sonra tekrar çeker. Sahne dosyasına dokunulmaz, ayar o oturumda yaşar.

CLAUDE.md §6'daki "bu ayarları kalıcı yap" burada **yok**: Stüdyo'ya geri
yazması gerekiyor, Stüdyo Faz 4'te geliyor. Çalışmayan buton sette yanıltır.

## Sistem katmanı

CLAUDE.md §3.1'in 4. katmanı: hangi modül açık olursa olsun üstte görünen şeyler.

- **Bildirim bannerı** — açık uygulamanın üstüne düşer, 4,6 sn sonra kendiliğinden
  kalkar. Kilit ekranı açıkken banner düşmez; bildirimler kilit ekranının kendi
  listesinde birikir (gerçek telefonlarda olduğu gibi).
- **Pil uyarısı** — %20, %10, %5 eşiklerinin altına YENİ düşüldüğünde çıkar.
  Sahneye özel değil, genel bir yetenek (CLAUDE.md §2.2): sahne sadece pili
  düşürür, uyarıyı sistem katmanı kendisi çıkarır.
- **Kapanma ekranı** — pil %0 olunca ekran kararır, kısa süre boş pil işareti
  görünür, sonra tamamen siyah kalır.

## Modüller kabuğa ne söyler

Bazı modüller ekranın tamamını ister. Kilit ekranında duvar kâğıdı en üste kadar
uzanmalı ve saat/pil yazısı beyaz olmalı, yoksa üstte beyaz bir şerit kalır ve
sahte durur. Bunu `src/modules/gorunum.ts` belirler.

## Zaman çizelgesi motoru

Sahnenin kalbi `src/engine/motor.ts`. Görselden tamamen bağımsızdır: sahte saat
enjekte edilip test edilebilir, bu yüzden determinizmi gerçekten ölçülebiliyor.

- **Elle tetik süreyi ezer** (CLAUDE.md §2.5, §5): kumandadan/panelden tetiklenen
  olay bekleyen zamanlayıcısını iptal eder ve zincir oradan devam eder.
- **Aynı hotspot'a ikinci dokunuş olayı tekrar etmez** — sette çift post olmaz.
- **Otomatik zincir gerçekleşmiş olayı tekrar etmez**: operatör zincirin sonuna
  atladığında arkadan gelen zincir aynı bildirimi ikinci kez düşürmez. Operatörün
  kendi isteğiyle tekrarlaması ayrı.
- **Başa sar** olayları ve cihaz durumunu birebir ilk haline döndürür.
- **Rastgelelik yok**; test bunu kaynak kodda da denetliyor.

**Mimari kararı:** modüller "şu an ne görünüyor" diye motora sormaz;
gerçekleşen olayların listesini okuyup ekranı ondan türetir (beğeni sayısı =
gerçekleşen `begeniGeldi` olaylarının sayısı, gibi). Böylece başa sar tek satır,
sahne deterministik ve hiçbir modül kendi zamanlayıcısını tutmuyor.

## Görsel yükleme kuralı

Hiçbir modül kendi "yavaş yükleme" mantığını yazmaz (CLAUDE.md §3.1). Tüm
görseller `src/shared/medya.tsx` üzerinden geçer, o da cihaz durumu katmanını okur:

- Bağlantı **yok** → görseller hiç gelmez, sahne ne derse desin
- Bağlantı **yavaş** ve sahne görsel için bir şey demediyse → görseller gecikir
- Sahne görsel için açıkça bir şey dediyse → o kazanır

Gecikme **deterministiktir**: görselin kendi adresinden hesaplanır, yani aynı
görsel her tekrarda aynı süre sonra gelir (CLAUDE.md §2.4). Hepsi aynı anda
düşmez, ama rastgele de değildir.

Beklerken **dönen çark yoktur** (CLAUDE.md §2.6) — gerçek telefonlarda olduğu
gibi sade bir gri alan durur.

- **Denetimler:** benzersiz olay id'leri, var olmayan olaya bağlanan zincir,
  kendi kendini bekleyen olay, zincirde döngü, dosyalar arası referanslar
  (sahne → cihaz, olay → hesap, post → içerik) ve **görsel dosyalarının
  gerçekten var olması** — sette kırık görsel çıkmasın diye

## Şema notu

CLAUDE.md §5'teki `Sahne` tipi ile aynı bölümdeki örnek JSON birbirini tam tutmuyor.
Faz 1 dosya tabanlı olduğu için **örnekteki slug biçimi** esas alındı
(`cihaz: "nergis-pc"`, `baslangic.hesap`); `id`, `bolumId`, `versiyon`, `kilitli`
alanları opsiyonel bırakıldı. Stüdyo'ya (Faz 4) geçerken bunlar zorunlu olacak.
