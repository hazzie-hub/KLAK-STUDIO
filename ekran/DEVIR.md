# Devir notu

Bu dosya, yeni bir oturuma başlarken okunacak. `CLAUDE.md` projenin anayasası;
bu dosya ise **nerede kaldığımızı** anlatır.

Son güncelleme: Faz 2 bitti. Faz 3'te `arama` (LOOK) modülü bitti;
sıradaki `web`, sonra `telefon`.

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

Sahneler: `eg-b03-s12` (kilit+bildirim), `eg-b03-s13` (mesajlaşma),
`eg-b03-s44` (gelen arama), `eg-b03-s58` (sosyal, CLAUDE.md §5'teki örnek),
`eg-b03-s59` (ghost typing), `eg-b03-s62` (LOOK araması), `eg-b03-s71` (pil bitmesi).

**`eg-b03-s62` numarası UYDURMA** — `arama` modülünü sette denemek için açıldı.
Yapımdan gerçek sahne numarası gelince dosya adı ve `kod` alanı değiştirilecek.

---

## 2. Faz durumu

| Faz | Durum |
|---|---|
| **Faz 1** | 10 adımın 10'u bitti. Kabul testi geçiyor. Gerçek iPhone'da test edildi, çıkan 3 sorun düzeltildi. |
| **Faz 2** (kumanda) | **BİTTİ.** Supabase kanalı yayında açık, çift yönlü doğrulandı (§3). |
| **Faz 3** (modüller) | `mesaj` ve `arama` (LOOK) bitti. `web`, `telefon` yapılmadı. |
| **Faz 4** (Stüdyo) | Başlanmadı. Supabase veritabanı gerekiyor. |
| **Faz 5** | Başlanmadı. |

Doğrulama: `npm test` (166 test), `npm run validate` (27 dosya),
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

## 4. Verilmiş kararlar (tekrar sorulmasın)

| Konu | Karar |
|---|---|
| Sosyal uygulama | **Akış**, renk `#0f6f74` — kullanıcı seçti |
| Mesaj uygulaması | **Mesaj** (Türk telefonlarında yerleşik ad) — kullanıcı seçti |
| Arama motoru | **LOOK**, renk `#5f4bb6` — kullanıcı seçti |
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

---

## 5. Kullanıcıdan beklenen kararlar

1. ~~Arama motorunun kurgusal adı~~ — **LOOK** seçildi, modül bitti.
2. **Sahte web sitelerinin şablonları** — `web` modülü için. Kullanıcı
   "tarayıcı, instagram ve haritalar" dedi: tarayıcı çerçevesi + Akış'ın web
   hâli + harita. Harita CLAUDE.md'de Faz 4 modülü; öne çekilecek mi, sorulacak.
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
- **Aynı anda tek adım ver.** Uzun listeler boğuyor; "geldim" deyince sonraki
  adımı vermek iyi çalıştı.
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
