# CLAUDE.md — Set Ekran Sistemi (çalışma adı: "Ekran")

Bu dosya projenin anayasasıdır. Her oturumda önce bunu oku. Burada yazan bir kuralla çelişen bir istek gelirse, kodu yazmadan önce çelişkiyi söyle.

## 1. Proje ne yapıyor

TV dizileri ve filmler için **setteki telefon ve bilgisayar ekranlarında oynatılan sahte arayüzler** üretiyoruz (on-set screen playback). Oyuncu gerçek bir cihazı eline alır, bir link açılır ve cihaz gerçek bir telefon/bilgisayar gibi davranır: bildirim düşer, sosyal medyada gezinir, yorum yazar, arama motorunda arama yapar, haritada yol tarifi alır.

İlk müşteri: **Evlilik Güzeldir** dizisi. Sistem diziye özel değil, çoklu dizi/proje destekler.

Başarı ölçütü: sistem oturduktan sonra yeni bir telefon sahnesi **15–30 dakikada** hazırlanıp teslim edilebilmeli ve sette **hiçbir tekrarda** hata vermemeli.

## 2. Değişmez kurallar

1. **Gerçek marka yok.** Instagram, WhatsApp, Google, Google Maps, Apple, Samsung vb. hiçbir gerçek logo, isim, ikon veya birebir arayüz kopyası kullanılmaz. Kurgusal uygulamalar tanıdık hissettirir ama kopya değildir. Marka isimleri ve renkleri tek bir yerden (`/brands`) yönetilir.
2. **Sahne = veri, kod değil.** Yeni bir sahne için asla yeni kod yazılmaz. Sahne, şemaya uyan bir yapılandırmadır (JSON). Bir sahne mevcut modüllerle yapılamıyorsa, çözüm yeni bir *genel* yetenek eklemektir, sahneye özel hack değil.
3. **Offline çalışır.** Oynatıcı bir kez yüklendikten sonra internetsiz çalışmalı (tüm görseller, fontlar, sahne verisi önbellekte). Tek istisna kumanda bağlantısıdır.
4. **Her tekrarda aynı.** Sahne deterministiktir. Rastgelelik yok (rastgele sayaç, rastgele sıra yok). Reset sonrası sahne birebir baştan başlar.
5. **Elle tetik süreyi ezer.** Kumandadan ya da gizli panelden gelen tetik, zamanlayıcıyı her zaman geçersiz kılar.
6. **Kamerada hiçbir teknik şey görünmez.** Debug yazısı, hata mesajı, yükleniyor ikonu (sahne istemediği sürece), tarayıcı çubuğu, gizli panel izi yok. Hata olursa sessizce son geçerli duruma dön ve logla.
7. **Akıcılık.** Tüm animasyonlar 60fps hedefli; ağır kütüphane yok. Dokunma tepkisi anında.
8. **Türkçe içerik, Türkçe karakter.** Arayüz metinleri Türkçe; tüm İ/ı/ş/ğ/ü/ö/ç doğru render edilir. URL'lerde Türkçe karakter kullanılmaz.

## 3. Mimari

Üç uygulama, tek kod tabanı:

| Parça | Kim kullanır | Nerede | URL |
|---|---|---|---|
| **Stüdyo** | Biz (ajans) | Bilgisayar | `/` (diziler) → `/studio/dizi/{diziKodu}` |
| **Oynatıcı** | Oyuncu, kamera önünde | Set telefonu / set bilgisayarı | `/p/{sahneKodu}` |
| **Kumanda** | Set operatörü | Operatörün telefonu | `/k/{sahneKodu}` |

Sahne kodu formatı: `{diziKodu}-b{bölüm}-s{sahne}` → örn. `eg-b03-s58`. Aynı sahnenin birden fazla cihazı varsa sonuna cihaz eki: `eg-b03-s41-nergis`.

### 3.1 Oynatıcı katmanları (alttan üste)

1. **Cihaz kabuğu (skin):** `ios`, `android`, `desktop`. Durum çubuğu, çentik/kamera deliği, alt gezinme çubuğu, fontlar, bildirim görünümü, klavye görünümü, pencere/tarayıcı çerçevesi (desktop). Skin sahnenin cihazından gelir; test için `?skin=android` ile ezilebilir.
2. **Cihaz durumu katmanı:** saat, pil seviyesi ve şarj durumu, sinyal/wifi ikonu, **bağlantı profili** (`normal` / `yavas` / `yok`), **görsel yükleme** (`normal` / `gec` / `yuklenmez`). Tüm modüller bu katmanı okur; hiçbir modül kendi "yavaş yükleme" mantığını yazmaz. Durum, zaman çizelgesiyle sahne içinde değişebilir (örn. pil %5 → %1 → kapanma ekranı).
3. **Modül (kurgusal uygulama):** Aşağıdaki listeden biri. Modüller birbirini açabilir (derin link).
4. **Sistem katmanı:** bildirim bannerları, gelen arama ekranı, pil uyarısı, kilit ekranı. Hangi modül açık olursa olsun üstte görünür.
5. **Gizli ayar paneli:** Bkz. §6.

### 3.2 Modüller

| Modül | Karşılığı | Faz |
|---|---|---|
| `kilit` | Kilit ekranı + bildirimler | 1 |
| `sosyal` | Instagram benzeri: feed, keşfet, post detay, yorumlar, profil, post yükleme, aktivite | 1 |
| `mesaj` | WhatsApp benzeri: sohbet listesi, sohbet, yazıyor…, görüldü, fotoğraf | 3 |
| `arama` | Google benzeri arama motoru: arama çubuğu, sonuç listesi, görsel sonuçlar | 3 |
| `web` | Sahte web siteleri: şablonlar (tarihçe/blog, haber, kurumsal, forum, sosyal) | 3 |
| `telefon` | Gelen/giden arama, arama geçmişi, rehber | 3 |
| `galeri` | Fotoğraf albümü, fotoğraf detay | 4 |
| `harita` | Harita, konum pini, yol tarifi, navigasyon animasyonu | 4 |
| `anaekran` | Ana ekran ikon ızgarası (modüller arası geçiş için) | 4 |

**`sosyal` şablon notu:** Sosyal uygulamanın (Akış) tarayıcıdan görünen hâli. Uygulamanın kendisi `sosyal` modülüdür; bu, aynı markanın web yüzü — bilgisayar sahnelerinde ve arama sonucundan profile geçişte kullanılır. Gövde yine sıradan blok listesidir; profil başlığı ve fotoğraf ızgarası `profil` ve `izgara` bloklarıyla kurulur. Profil bloğu hesabı kimlikle alır: kullanıcı adı, görünen ad ve avatar `content/hesaplar` altındaki tek kaynaktan gelir, sayfaya elle yazılmaz.

**Harita notu:** Varsayılan yaklaşım, tasarlanmış/stilize harita görselleri üzerinde animasyonlu rota ve pindir (lisans riski yok). Gerçek karo haritası (MapLibre + OSM) sadece açıkça istenirse ve atıf şartı çözüldükten sonra eklenir.

### 3.3 Ortak parçalar (her modül bunları kullanır)

- **Zaman çizelgesi motoru** (§5)
- **Ghost typing** (§7): yorum, mesaj, arama çubuğu, adres çubuğu — hepsi aynı bileşen.
- **Dokunma hedefi (hotspot):** "şuna dokununca şu olay" tanımı.
- **Derin link:** `{ modul: "harita", icerik: "kamp-alani" }` gibi; post'taki konum → harita, arama sonucu → web sitesi, mesajdaki fotoğraf → galeri.
- **Medya bileşeni:** cihaz durumu katmanındaki görsel yükleme ayarına uyan tek görsel/video bileşeni.

## 4. Teknik yığın

- **Next.js (App Router) + TypeScript**, strict mod.
- **Tailwind CSS**; skin'ler CSS değişkenleriyle temalanır.
- **Zod**: sahne şeması tek kaynak; hem Stüdyo formları hem Oynatıcı bunu kullanır.
- **Supabase**: Postgres (veri), Storage (medya), Realtime broadcast (kumanda ↔ oynatıcı).
- **Vercel**: yayın.
- **Service worker (Serwist)**: sahne bazlı önbellek; sahne açılırken tüm varlıkları önceden indirir, hazır olunca gizli bir işaret verir (bkz. §6 "hazır" göstergesi).
- **PWA manifest**: `display: standalone`, iOS için `apple-mobile-web-app-capable`.
- **Fontlar**: Inter (iOS görünümü), Roboto (Android görünümü). SF Pro kullanılmaz.
- Daha sonra, gerekirse: **Capacitor** ile iOS kabuğu (gerçek durum çubuğunu gizlemek için). Kod buna engel olacak şekilde yazılmaz: tarayıcıya özel API'ler tek bir `platform` katmanında toplanır.

## 5. Veri modeli ve zaman çizelgesi

```ts
Dizi        { id, kod, ad }
Bolum       { id, diziId, no }
Karakter    { id, diziId, ad, notlar }
Cihaz       { id, karakterId, skin: "ios"|"android"|"desktop", model, duvarKagidi, kilitEkrani, rehber[], varsayilanDurum }
Hesap       { id, diziId, modul, kullaniciAdi, gorunenAd, avatar, karakterId? }   // kurgusal sosyal/mesaj hesapları
Icerik      { id, diziId, tur: "post"|"sohbet"|"aramaSonucu"|"webSayfasi"|"konum"|"foto", veri }  // yeniden kullanılabilir kütüphane
Sahne       { id, kod, bolumId, cihazId, baslangic: { modul, ekran, icerikRef }, durum, olaylar[], talimat, versiyon, kilitli }
Olay        { id, ad, tetik, aksiyon }
```

**Tetik türleri:**
```ts
{ tur: "baslangic", gecikme: 2000 }                 // sahne açılınca 2 sn sonra
{ tur: "sonra", olayId: "post-yuklendi", gecikme: 5000 }  // başka bir olaydan 5 sn sonra
{ tur: "dokunma", hedef: "arti-butonu" }             // oyuncu bir şeye dokununca
{ tur: "elle" }                                      // sadece kumanda/gizli panel
```
Her olay, tetiğinden bağımsız olarak **her zaman elle de tetiklenebilir**. Elle tetiklenen olay, bekleyen zamanlayıcısını iptal eder ve zinciri buradan devam ettirir.

**Aksiyon örnekleri:** `bildirim`, `yorumGeldi`, `begeniGeldi`, `takipGeldi`, `mesajGeldi`, `yaziyor`, `aramaGeldi`, `pilDegisti`, `baglantiDegisti`, `ekranAc`, `ghostTypingBaslat`, `postYukle`.

### Örnek sahne (s58 — Nergis PC sosyal medya)

```json
{
  "kod": "eg-b03-s58",
  "cihaz": "nergis-pc",
  "baslangic": { "modul": "sosyal", "ekran": "feed", "hesap": "nergis" },
  "durum": { "baglanti": "normal", "gorsel": "normal" },
  "olaylar": [
    { "id": "post-yuklendi", "ad": "Nergis post yükler",
      "tetik": { "tur": "dokunma", "hedef": "yeni-post-akisi-tamam" },
      "aksiyon": { "tur": "postYukle", "icerikRef": "nergis-post-cicekci" } },
    { "id": "sezai-begeni", "ad": "Sezai (sahte hesap) beğenir",
      "tetik": { "tur": "sonra", "olayId": "post-yuklendi", "gecikme": 5000 },
      "aksiyon": { "tur": "begeniGeldi", "hesap": "gonul-yolcusu" } },
    { "id": "sezai-yorum", "ad": "Sezai yorum yapar",
      "tetik": { "tur": "sonra", "olayId": "sezai-begeni", "gecikme": 800 },
      "aksiyon": { "tur": "yorumGeldi", "hesap": "gonul-yolcusu", "metin": "..." } }
  ],
  "talimat": "F11 ile tam ekran. + ile post yükleme akışı. Post yüklendikten 5 sn sonra Sezai'nin sahte hesabından beğeni ve yorum gelir."
}
```

## 6. Set operasyonu

**Gizli ayar paneli (oynatıcıda):**
- Açma: sağ üst köşeye 2 saniye içinde 5 dokunuş (mobil); `Ctrl+Shift+.` (desktop). Başka hiçbir hareket paneli açmamalı.
- İçerik: olay listesi, her olay için "şimdi tetikle", süreli olaylarda gecikme +/− (250 ms adım), skin/durum geçişi (test için), **Başa sar**, "bu ayarları kalıcı yap" (bağlantı varsa Stüdyo'ya geri yazar).
- Ayrıca panelsiz **başa sar**: sol üst köşeye 2 sn içinde 5 dokunuş.
- **Hazır göstergesi:** tüm varlıklar önbelleğe alınınca sadece operatörün bildiği bir işaret (örn. durum çubuğundaki saatin iki noktası bir kez yanıp söner). Kameraya fark edilir bir şey çıkmaz.

**Kumanda:**
- Sahnenin olaylarını büyük butonlar olarak listeler; sıradaki olay vurgulu.
- Başa sar, bağlantı durumu (oynatıcı çevrimiçi mi), son tetiklenen olay.
- Supabase Realtime broadcast kanalı: `sahne:{kod}`. Mesajlar küçük ve idempotent (`{ olayId, zaman, nonce }`).
- Bağlantı koparsa oynatıcı süreli tetiklerle devam eder; hiçbir şey kilitlenmez.

**Set telefonu hazırlığı (Stüdyo'daki talimat metnine otomatik eklenir):** Odak/Rahatsız Etme modu açık, otomatik kilit kapalı, parlaklık sabit, iOS'ta Rehberli Erişim / Android'de Ekran Sabitleme, kumanda kullanılacaksa Wi-Fi veya operatörün hotspot'u açık (uçak modu + sadece Wi-Fi).

## 7. Ghost typing

- **Senaryolu mod (varsayılan):** sahte klavye çizilir (skin'e göre iOS/Android görünümü; desktop'ta fiziksel klavye). Oyuncu hangi tuşa basarsa bassın senaryodaki metnin sıradaki karakteri yazılır. Metin bitince tuşlar etkisizleşir; "gönder" butonu aktifleşir.
- **Serbest mod:** sahnede açıkça seçilirse gerçek klavye/`input` kullanılır.
- **Otomatik mod:** oyuncu dokunmadan, verilen hızda kendi kendine yazar (insert çekimler için).
- Türkçe karakterler ve emoji desteklenir. Yazım hızı ve "hata yapıp silme" isteğe bağlı eklenebilir (Faz 5).

## 8. Stüdyo (Faz 4'ten itibaren)

- Dizi → bölüm → sahne listesi; karakterler ve cihazlar; hesaplar; içerik kütüphanesi; varlık kutusu (yapımdan gelen fotoğraflar).
- **Sahne şablonları:** kilit ekranına bildirim, DM konuşması, post yükle + tepki, gelen arama, keşfette gezinme + yorum, pil bitiyor, arama motoru + sonuç sitesi, konum → navigasyon.
- **Kopyala-düzenle:** herhangi bir sahneyi başka bölüme kopyalama.
- **Canlı önizleme:** cihaz çerçevesinde, skin geçişli, zaman çizelgesi oynatılabilir.
- **Senaryodan taslak (Faz 5):** senaryonun sahne metni yapıştırılır, Claude API sahne JSON'u taslağı üretir, Zod ile doğrulanır, kullanıcı düzeltir.
- **Teslim paketi:** onaylanan sahne için sabit link + QR kod + WhatsApp'a yapıştırılacak hazır metin (`Sahne 58 – Nergis PC sosyal medya: {link}` + talimat + cihaz hazırlığı).
- **Kilit ve versiyon:** onaylanan sahne kilitlenir; revizyon yeni versiyon açar, link değişmez, oynatıcı her zaman son onaylı versiyonu açar.
- **Giriş:** Stüdyo ve operatör sayfaları tek parolanın arkasında (`/giris`, "KLAK Studio"); senaryo içeriği gizlidir. Parola `STUDIO_PAROLA` ortam değişkeninden gelir, yoksa koddaki varsayılan geçerlidir ve giriş ekranı bunu uyarır. **Oynatıcı ve kumanda asla korunmaz** — sette parola sorulamaz.

## 9. Fazlar

Her faz bitmeden sonrakine geçilmez. Her fazın sonunda gerçek cihazlarda test edilir.

**Faz 1 — Temel + tek sahne (Stüdyo yok, sahne JSON'ı dosyada)**
- Proje kurulumu, şema (Zod), cihaz kabuğu (ios/android/desktop), cihaz durumu katmanı, zaman çizelgesi motoru, gizli panel, başa sar, offline önbellek.
- Modüller: `kilit`, `sosyal` (feed, post detay, yorumlar, beğeni animasyonu, post yükleme akışı, aktivite).
- Ghost typing senaryolu mod (yorum için).
- Örnek sahneler: `eg-b03-s58` (yukarıdaki), bir kilit ekranı bildirim sahnesi, bir pil bitme sahnesi.
- **Bitti tanımı:** üç sahne iPhone, Android ve bilgisayarda internetsiz, 20 tekrar üst üste hatasız oynuyor.

**Faz 2 — Kumanda**
- Realtime kanal, kumanda sayfası, bağlantı kopması senaryoları, "kalıcı yap".

**Faz 3 — Modüller**
- `mesaj`, `arama`, `web` (en az 2 şablon), `telefon`; derin linkler; bağlantı profili `yavas` ve görsel `yuklenmez` davranışları tüm modüllerde.

**Faz 4 — Stüdyo**
- Supabase'e taşınan veri modeli, CRUD ekranları, şablonlar, önizleme, teslim paketi, versiyonlama. `galeri`, `harita`, `anaekran`.

**Faz 5 — Hızlandırıcılar**
- Senaryodan taslak üretme, ghost typing ekstraları, gerekiyorsa Capacitor iOS kabuğu.

## 10. Klasör yapısı (öneri)

```
/app
  /p/[kod]        oynatıcı
  /k/[kod]        kumanda
  /studio         stüdyo
/src
  /schema         zod şemaları (tek kaynak)
  /engine         zaman çizelgesi, tetikler, durum
  /shell          skin'ler: ios, android, desktop
  /system         bildirim, arama ekranı, kilit, pil uyarısı
  /modules        kilit, sosyal, mesaj, arama, web, telefon, galeri, harita, anaekran
  /shared         ghost-typing, hotspot, medya, derin-link
  /platform       tarayıcıya özel API'ler (tam ekran, wake lock, sw)
/brands           kurgusal marka isimleri, renkler, ikonlar
/content          Faz 1–3 için dosya tabanlı sahne ve içerik verisi
```

## 11. Çalışma şekli

- Bir faz içinde bile işleri küçük adımlara böl; her adımdan sonra çalışır durumda bırak.
- Yeni bir şey eklemeden önce: "Bu genel bir yetenek mi, sahneye özel mi?" Sahneye özelse, bunu nasıl veriyle ifade edeceğini öner.
- Şemayı değiştirirsen mevcut örnek sahneleri de güncelle ve doğrula.
- Gerçek marka görseline benzeyen bir şey üretmen istenirse uyar.
