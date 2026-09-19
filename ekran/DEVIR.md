# Devir notu

Bu dosya, yeni bir oturuma başlarken okunacak. `CLAUDE.md` projenin anayasası;
bu dosya ise **nerede kaldığımızı** anlatır.

Son güncelleme: Faz 4 sürüyor. **4.1–4.5 bitti**. Geriye tek adım kaldı:
4.6 (`galeri`, `harita`, `anaekran` modülleri).

---

## 1. Nerede ne var

| | |
|---|---|
| Depo | `hazzie-hub/KLAK-STUDIO`, kod `ekran/` klasöründe |
| Dal | `main` (çalışma dalı `claude/phase-1-planning-setup-u2d7wt`, ikisi aynı noktada) |
| Yayın | https://ekran-rosy.vercel.app — Vercel, kök dizin `ekran` |
| Veritabanı | Supabase, proje `gyrsjoziawhvjwdqhwcz` (yalnızca kumanda için kullanılıyor) |

Kullanıcının masaüstündeki `KLAK-STUDIO-main` klasörü **eski, kopuk bir
indirmedir** — git deposu değil, GitHub'a bağlı değil. Ona dokunma, oradan
çalışma. Çalışma kopyası her oturumda GitHub'dan taze klonlanır.

Kökteki `app/`, `components/`, `hooks/`, `lib/`, `types/` **başka bir projeye**
aittir (creative-assistant / workflow builder). Ona dokunulmadı, dokunulmayacak.

### Adresler

| Adres | Ne |
|---|---|
| `/` | Sahne listesi (operatör buradan seçer) |
| `/p/{kod}` | Oynatıcı — oyuncunun eline verilen cihaz |
| `/k/{kod}` | Kumanda — operatörün telefonu |
| `/studio` | Stüdyo — sahne ağacı (dizi → bölüm → sahne) |
| `/studio/{kod}` | Teslim paketi — link, QR kod, hazır metin, Yayınla |
| `/studio/yeni` | Yeni sahne — şablon seçimi, `?sablon=` ile şablondan, `?kopya=` ile kopyadan |
| `/studio/{kod}/duzenle` | Sahne düzenleme formu |

Sahneler: `eg-b03-s12` (kilit+bildirim), `eg-b03-s13` (mesajlaşma),
`eg-b03-s44` (gelen arama), `eg-b03-s58` (sosyal, CLAUDE.md §5'teki örnek),
`eg-b03-s59` (ghost typing), `eg-b03-s62` (LOOK araması + siteler),
`eg-b03-s63` (telefon uygulaması), `eg-b03-s71` (pil bitmesi).

**`eg-b03-s62` ve `eg-b03-s63` numaraları UYDURMA** — yeni modülleri sette
denemek için açıldı. Yapımdan gerçek sahne numaraları gelince dosya adları ve
`kod` alanları değiştirilecek.

---

## 2. Faz durumu

| Faz | Durum |
|---|---|
| **Faz 1** | 10 adımın 10'u bitti. Kabul testi geçiyor. Gerçek iPhone'da test edildi, çıkan 3 sorun düzeltildi. |
| **Faz 2** (kumanda) | **BİTTİ.** Supabase kanalı yayında açık, çift yönlü doğrulandı (§3). |
| **Faz 3** (modüller) | **BİTTİ** — `mesaj`, `arama` (LOOK), `web`, `telefon`. |
| **Faz 4** (Stüdyo) | 4.1 bitti (aşağıdaki plan). 4.2'de Supabase gerekiyor. |
| **Faz 5** | Başlanmadı. |

Doğrulama: `npm test` (255 test), `npm run validate` (32 dosya),
`npm run kabul` (3 kabuk × 6 sahne × 20 tur, internet kesik).

---

## 3. ÇÖZÜLDÜ — Supabase kanalı (kayıt için duruyor)

**Belirti:** `/k/{kod}` sayfasının üst satırı
`Supabase · kanal kapalı · CHANNEL_ERROR: channel error: transport failure`.

**Asıl sebep:** Vercel'deki `NEXT_PUBLIC_SUPABASE_ANON_KEY` değişkenine anahtar
değil, anahtarın **Supabase panelinde gizli gösterilen hâli** yapıştırılmıştı.
Yani değer `eyJhbGci` ile başlayıp geri kalan 200 karakteri `•` (nokta işareti)
olan bir metindi. JWT'de olması gereken iki `.` ayıracı hiç yoktu.

Kullanıcı anahtarı panelde fareyle seçip kopyalamıştı; Supabase o alanı maskeli
gösterdiği için maskenin kendisi kopyalanmış oldu.

**Çözüm:** Supabase panelinde **kopyala düğmesiyle** (fareyle seçerek değil)
alınan legacy `anon` JWT anahtarı Vercel'e yapıştırıldı, önbelleksiz yeniden
dağıtım yapıldı.

**Doğrulama (yayında, iki sekme, gerçekten Supabase üzerinden):**

- Üst satır: `Supabase · kanal açık`
- Kumandadan **Başa sar** → oynatıcıdaki mesaj anında silindi
- Kumandadan **Şimdi** → oynatıcıda mesaj anında düştü
- Oynatıcıdan kumandaya telemetri geldi: `çevrimiçi`, `pil %42`,
  `Sıradaki: ikinci-mesaj 2.0 sn`, `Son tetiklenen: ilk-mesaj`

**Ders (koda yansıtılabilir):** Bu tuzak kullanıcıyı İKİ kez yakaladı — önce
değişkenin adı yapıştırıldı, sonra maskeli görüntü. Her ikisinde de ekranda
yalnızca anlamsız `transport failure` yazdı. `tasiyiciSec` şu an sadece "boş mu"
diye bakıyor. Anahtarın JWT biçiminde olup olmadığı denetlenip sade bir Türkçe
uyarı gösterilebilir. **Kullanıcıya soruldu, karar vermedi — tekrar sorulabilir.**

---

## 3.5 Faz 4 planı ve verilen mimari karar

| # | Adım | Durum |
|---|---|---|
| 4.1 | Stüdyo iskeleti + teslim paketi (link, QR, hazır metin) | **BİTTİ** |
| 4.2 | Supabase tabloları, verinin dosyadan veritabanına taşınması | **BİTTİ** |
| 4.3 | Sahne oluşturma/düzenleme formları | **BİTTİ** |
| 4.4 | Sahne şablonları + kopyala-düzenle | **BİTTİ** |
| 4.5 | Kilit + versiyon | **BİTTİ** |
| 4.6 | `galeri`, `harita`, `anaekran` modülleri | — |

**Yayınlama modeli (kullanıcıya anlatıldı, itiraz gelmedi):** Stüdyo'da sahne
kaydedilir, "Yayınla" sitenin yeniden kurulmasını tetikler (~2 dk), sahne
sayfası STATİK kalır. Oynatıcının veritabanına canlı bağlanması REDDEDİLDİ:
CLAUDE.md §2.3 sette internetsiz çalışmayı şart koşuyor.

### 4.2 bitti — kurulmuş hali

Veritabanı kuruldu, veri aktarıldı, `SUPABASE_SERVICE_ROLE_KEY` Vercel'e
(yalnızca Production) girildi. Yayındaki site sahneleri veritabanından okuyor.

> ⚠️ **YENİ TUZAK — en önemli madde:** `content/` altındaki dosyalar artık
> YAYINI BESLEMİYOR. Bir sahneyi dosyadan düzenleyip göndermek yayında
> HİÇBİR ŞEYİ DEĞİŞTİRMEZ; site veritabanından okuyor. Değişikliğin yayına
> gitmesi için `npm run aktar -- --sql` çalıştırılıp üretilen
> `supabase/02-veri.sql` panele yapıştırılmalı. Bu zahmet 4.3'te (Stüdyo
> formları) ortadan kalkacak. Dosyalar testlerin ve `npm run validate`'in
> veri kaynağı olarak duruyor, silinmeyecek.

Kod tarafı:
- `supabase/01-tablolar.sql` — tablolar, RLS (politika YOK, yani anon anahtarla
  erişim kapalı; okuma yalnızca service role ile).
- `src/icerik/kaynak.ts` — okuma yüzeyi. `NEXT_PUBLIC_SUPABASE_URL` ve
  `SUPABASE_SERVICE_ROLE_KEY` tanımlıysa Supabase'ten, değilse `content/`
  dosyalarından okur. **Sessizce geri düşmez**: Supabase yapılandırılmış ama
  erişilemiyorsa derleme hata verip durur.
- `npm run aktar` — `content/` altındaki her şeyi Supabase'e upsert eder,
  tekrar çalıştırılabilir, silme yapmaz. `--kuru` ile önizlenir.

Kurulumda yaşananlar (tekrarlanırsa diye):
- Supabase'in SQL düzenleyicisi `01-tablolar.sql` için "destructive operations"
  uyarısı verdi. Sebebi metindeki `drop trigger if exists` satırları; tablo ya
  da veri silen hiçbir komut yok, güvenle çalıştırıldı.
- İlk kurulum `Invalid API key` ile düştü: Vercel'e yanlış/maskeli anahtar
  girilmişti. Doğru anahtar `service_role` (legacy JWT); `anon` ve
  `sb_publishable_` DEĞİL. Kaydetmeden önce Vercel'in göz simgesiyle değeri
  gösterip `eyJ` ile başladığını ve içinde iki nokta olduğunu doğrulamak
  bu turu kısaltıyor.

Şema TEK KAYNAK Zod'da; tablolarda kaydın tamamı `veri` (jsonb) sütununda durur,
yazmadan önce ve okuduktan sonra Zod'dan geçer. Sorgulanan alanlar (kod, dizi,
bölüm, tür) ayrıca sütun.

---

### 4.5 — kilit ve versiyon nasıl çalışıyor

- **Kilitli = onaylandı.** Kilitli sahne kaydedilemez; `sahneYaz` reddeder,
  düzenleme sayfası da uyarı gösterir.
- **Revizyon yeni versiyon açar:** mevcut içerik `sahne_versiyonlari`na
  kopyalanır, sonra `versiyon` bir artar ve kilit açılır. Arşiv yazılamazsa
  kilit AÇILMAZ — onaylı hali kaybolmasın.
- **Link hiç değişmez.** Sete gönderilen QR ve adres sahne koduna bağlı;
  versiyon değişse de geçerli kalır.
- Sahne listesinde onaylı sahneler "onaylı vN" rozetiyle görünür.

### 4.3 nasıl kuruldu

- Form, 13 aksiyon türü için 13 ayrı form DEĞİL: her türün alanları
  `src/studio/alanlar.ts`'te veri olarak duruyor, form onu okuyup kendini
  kuruyor. Yeni aksiyon = tabloya bir satır.
- `tests/alanlar.test.ts` bu tablonun şemadan ayrışmasını engelliyor: alan
  adları Zod şemasıyla BİREBİR aynı olmalı, zorunluluklar uyuşmalı.
- Doğrulama tek yerde: form serbest taslak tutar, kaydederken `SahneSchema`
  çalışır, hatalar alan alan gösterilir.
- Stüdyo sayfaları `force-dynamic`. Oynatıcı sayfaları STATİK kalır.
- **Yayınlama kurulum İSTEMEZ.** Kaydetmek, sahnenin oyuncu ve kumanda
  sayfalarını `revalidatePath` ile tazeler; sayfa bir sonraki açılışta
  veritabanındaki son haliyle yeniden üretilir ve yine statik kalır. Sette
  internetsiz çalışma şartı bozulmuyor. "Yayınla" düğmesi aynı şeyi elle
  yapar, emin olmak isteyenler için.
  Vercel deploy hook fikri DENENDİ VE BIRAKILDI: çalışırdı ama kullanıcıdan
  kurulum istiyordu ve iki dakika sürüyordu (bkz. §7'deki kural).

---

## 4. Verilmiş kararlar (tekrar sorulmasın)

| Konu | Karar |
|---|---|
| Sosyal uygulama | **Akış**, renk `#0f6f74` — kullanıcı seçti |
| Mesaj uygulaması | **Mesaj** (Türk telefonlarında yerleşik ad) — kullanıcı seçti |
| Arama motoru | **LOOK**, renk `#5f4bb6` — kullanıcı seçti |
| Sahte siteler | Şablonlar: `haber`, `blog`, `kurumsal`, `forum`. Sayfa gövdesi BLOK listesi; şablon sadece görünümü değiştirir |
| Rehber ve arama geçmişi | İçerik kütüphanesinde değil, **cihaz dosyasında** durur — bir telefonun geçmişi o telefona aittir |
| Gelen / giden arama | Gelen arama SİSTEM katmanında (her modülün üstünde), giden arama `telefon` modülünde |
| "Instagram" istendiğinde | Gerçek marka; yerine **Akış** kullanılır (test `instagram` kelimesini yasaklıyor) |
| Markaların yeri | `brands/index.ts`, tek kaynak. Bir test gerçek marka adı geçmediğini denetler |
| Şema biçimi | Slug tabanlı (`cihaz: "nergis-pc"`), `id`/`bolumId`/`versiyon`/`kilitli` opsiyonel — Faz 4'te zorunlu olacak |
| Kod nereye | Kökteki eski projeye dokunmadan `ekran/` altına |
| Dal | `main`'e birleştiriliyor (kullanıcı onayladı) |

### Mimari kararlar (bozulmamalı)

- **Ekran, gerçekleşen olaylardan türer.** Modüller kendi sayacını/listesini
  tutmaz. Başa sar = olay listesini boşaltmak. Her tekrar birebir aynı.
- **Rastgelelik yok.** Gecikmeler bile deterministik (görsel adresinden hesaplanır).
- **Modüller kendi "yavaş yükleme" mantığını yazmaz** — hepsi `shared/medya.tsx`'ten geçer.
- **Otomatik zincir gerçekleşmiş olayı tekrar etmez** (operatör sona atlayınca
  çift bildirim olmasın diye). Elle tekrarlamak ayrı.
- Kumanda mesajları **idempotent** (nonce) ve Zod'dan geçer.
- **Açık modül de olaylardan türer** (`src/modules/aktif-ekran.ts`). `ekranAc`
  başka bir modüle geçebilir — arama sonucundan siteye. Başa sarınca olay
  listesi boşalır ve sahne kendiliğinden başlangıç modülüne döner.

---

## 5. Kullanıcıdan beklenen kararlar

1. ~~Arama motorunun kurgusal adı~~ — **LOOK** seçildi, modül bitti.
2. ~~Sahte web sitelerinin şablonları~~ — dört şablon yazıldı, modül bitti.
   Kullanıcının istediklerinden **Akış'ın web hâli** ve **harita** HENÜZ YOK.
   Harita CLAUDE.md'de Faz 4 modülü; öne çekilecek mi, sorulacak.
   Faz 3 bittiğine göre sıradaki soru: Faz 4'e (Stüdyo) mi geçilecek, yoksa
   önce bu ikisi mi yapılacak?
3. **Gerçek replikler** — şu an hepsi yer tutucu. Özellikle `eg-b03-s58`'de
   Sezai'nin yorumu hâlâ `"..."` (CLAUDE.md'de de öyle yazıyordu, birebir korundu)
4. **Yapımdan gelen fotoğraflar** — `public/ornek` ve `public/avatar` altındaki
   soyut çizimlerin yerine
6. **Uydurma alan adları hukuken temiz mi?** — `arama` içeriğindeki adresler
   (`kiyidasabah.com`, `gezginnotu.net`, `kadikoykahvaltici.com`,
   `rehberdefteri.net`) DNS'te çözülmüyor diye seçildi, ama yapım/hukuk
   onayından geçmeli. `sahilsofrasi.com` gerçek çıktığı için elendi.
5. **Anahtar biçim denetimi eklensin mi?** — §3'ün sonundaki ders

---

## 6. Çalışma ortamı

Ortam iki türlü olabiliyor, ikisini karıştırma:

**A) Kullanıcının Mac'i (şu anki durum — tercih edilen)**

- Yayındaki siteye ve Supabase'e **erişilebiliyor.** Tarayıcı panelinden
  `https://ekran-rosy.vercel.app` açılıp doğrudan teşhis yapılabiliyor —
  Supabase anahtarı hatası böyle bulundu. Kullanıcıya ekran görüntüsü
  sorma zahmeti kalktı.
- `gh` (GitHub komutu) **kuruldu ve giriş yapıldı** (hesap `hazzie-hub`,
  keyring'de token, `repo` yetkisi var). Koda değişiklik gönderme artık
  doğrudan buradan yapılabiliyor; kullanıcının elle bir şey yapması gerekmiyor.
- Çalışma kopyası: depo her oturumda scratchpad'e taze klonlanır, `npm install`
  çalıştırılır. Masaüstündeki eski klasör kullanılmaz (§1).
- Tarayıcıda PWA servis çalışanı eski yapıyı önbellekte tutuyor; yeni dağıtımı
  görmek için servis çalışanını kaldırıp önbelleği temizlemek gerekiyor,
  yoksa eski sayfa görünüp yanlış teşhis konur.

**B) Bulut oturumu (eski oturumlar böyleydi)**

- Ağ politikası `vercel.app` ve `supabase.co` adreslerini **engelliyor.**
  Yayındaki siteyi oradan test etmek mümkün değil; doğrulamayı kullanıcı yapmalı.
- Yerel doğrulama tam çalışıyor: `npm run build && npm run start` + Playwright
  (Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`).

Her iki ortamda da: sunucu yeniden başlatılırken portun boşaldığından emin
olunmalı; `next start` port doluysa sessizce ölüyor ve eski yapı servis
edilmeye devam ediyor (bu tuzağa bir kez düşüldü).

---

## 7. Kullanıcıyla çalışma şekli

- **Kullanıcı yazılımcı değil.** Terminal, GitHub, Vercel gibi şeyler yeni.
  Açıklamalar sade olmalı, jargon açıklanmalı.
- **GEREKMEDİKÇE KULLANICIDAN HİÇBİR ŞEY İSTEME.** Bu, kullanıcının açık
  talimatıdır. İki yol varsa senin tek başına tamamlayabildiğini seç; kullanıcı
  yükü farkı genellikle diğer ölçütlerden baskındır. Bir adım istemeden önce
  "bunu ben yapabilir miyim?" diye sor — genellikle yapılabiliyor:
  Vercel deploy hook kurdurmak yerine Next'in `revalidatePath`'i, elle veri
  girişi yerine üretilen SQL, gizli anahtarı yerelde tutmak yerine anahtarsız
  çalışan bir kip. Gerçekten zorunlu tek iş tipi: yalnızca onun hesabında
  yapılabilen ve gizli bilgi gerektirenler. Onu da tek seferde, sebebiyle iste.
  Seçimini bildir ama onay için bekleme.
- **Aynı anda tek adım ver.** Uzun listeler boğuyor; "geldim" deyince sonraki
  adımı vermek iyi çalıştı. Bu, yukarıdaki kuralın istisnası değil: önce
  isteme, istemek zorundaysan tek adım ver.
- İletişim **Türkçe**.
- Kendi bilgisayarında komut çalıştırmayı sevmiyor — mümkün olan her şeyi
  bu taraftan yapıp sonucu göstermek iyi karşılandı. Mac ortamında (§6-A)
  bu artık neredeyse tamamen mümkün.
- Her adım sonunda **GitHub'a ve `main`'e** gidiyor; Vercel kendiliğinden kuruyor.
- Kredi tüketimine dikkat edilmesi istendi: az ve toplu araç çağrısı, gereksiz
  ekran görüntüsü almamak.

### Yararlı olduğu görülen alışkanlıklar

- Her adımın sonunda: `npx tsc --noEmit`, `npm test`, `npm run validate`,
  `npm run build`, gerektiğinde `npm run kabul`.
- Tarayıcıda **gerçekten** doğrulamak (sadece test değil) — birkaç gerçek hata
  böyle yakalandı: banner hiç kalkmıyordu, panel gecikmesi ekrana yansımıyordu,
  offline'da parametreli adres açılmıyordu, telefonda 5 dokunuş çalışmıyordu,
  ve son olarak Supabase anahtarı maskeli kopyalanmıştı.
- Bulunan her hatayı commit mesajında açıkça anlatmak.
- **Toplu metin değişiminde MUTLAKA doğrula.** Betikle yapılan `replace`
  eşleşmezse sessizce hiçbir şey yapmaz ve "tamam" yazar. Bir kez buna
  düşüldü: arayüz metni hiç değişmedi, sonra yayında o metin aranıp
  "kurulum gelmedi" sanıldı ve yarım saat boşa gitti. Ya `assert eski in s`
  yaz, ya da tek tek düzenleme aracını kullan.

### Bilinen, henüz çözülmemiş küçük konular

- `npm audit` 4 açık bildiriyor; hepsi Next.js'in içindeki postcss'ten geliyor,
  bizim eklediğimiz paketlerden değil. Düzeltmesi Next majör sürüm yükseltmesi
  istiyor — ayrı bir iş olarak ele alınmalı.
- Operatör sayfaları (`/`, `/studio`) açık temaya sabitlendi (`.acik-sayfa`).
  Renkler doğrudan yazılı olduğu için koyu mod desteği yok; sette okunabilirlik
  bu şekilde garanti altına alındı.

---

## 8. Komutlar

```bash
cd ekran
npm install
npm run dev        # geliştirme (service worker kapalı)
npm run validate   # sahne ve içerik denetimi
npm test           # 152 test
npm run build && npm run start
npm run kabul      # kabul testi (önce build+start, ayrı terminalde)
```
