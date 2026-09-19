# Devir notu

Bu dosya, yeni bir oturuma başlarken okunacak. `CLAUDE.md` projenin anayasası;
bu dosya ise **nerede kaldığımızı** anlatır.

Son güncelleme: Faz 2 bitti, Faz 3 başladı, Supabase bağlantısında açık sorun var.

---

## 1. Nerede ne var

| | |
|---|---|
| Depo | `hazzie-hub/KLAK-STUDIO`, kod `ekran/` klasöründe |
| Dal | `main` (çalışma dalı `claude/phase-1-planning-setup-u2d7wt`, ikisi aynı noktada) |
| Yayın | https://ekran-rosy.vercel.app — Vercel, kök dizin `ekran` |
| Veritabanı | Supabase, proje `gyrsjoziawhvjwdqhwcz` (yalnızca kumanda için kullanılıyor) |

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
`eg-b03-s59` (ghost typing), `eg-b03-s71` (pil bitmesi).

---

## 2. Faz durumu

| Faz | Durum |
|---|---|
| **Faz 1** | 10 adımın 10'u bitti. Kabul testi geçiyor. Gerçek iPhone'da test edildi, çıkan 3 sorun düzeltildi. |
| **Faz 2** (kumanda) | Kod bitti. **Supabase bağlantısı henüz kurulamadı — aşağıya bak.** |
| **Faz 3** (modüller) | `mesaj` bitti. `arama`, `web`, `telefon` yapılmadı. |
| **Faz 4** (Stüdyo) | Başlanmadı. Supabase veritabanı gerekiyor. |
| **Faz 5** | Başlanmadı. |

Doğrulama: `npm test` (152 test), `npm run validate` (25 dosya),
`npm run kabul` (3 kabuk × 6 sahne × 20 tur, internet kesik).

---

## 3. AÇIK SORUN — buradan devam edilecek

**Kumanda, Supabase üzerinden bağlanamıyor.**

`/k/eg-b03-s12` sayfasının üst satırı şunu gösteriyordu:

```
Supabase   kanal kapalı   CHANNEL_ERROR: channel error: transport failure
```

### Şimdiye kadar yapılanlar

1. Ortam değişkenleri Vercel'e girildi (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Kumandanın "Supabase" yazması, ikisinin de
   tarayıcıya ULAŞTIĞINI kanıtlıyor.
2. İlk denemede `sb_publishable_...` (yeni biçim) anahtar kullanıldı → transport failure.
3. **Sonra fark edildi:** Vercel'deki `ANON_KEY` değişkeninin DEĞER kutusuna
   anahtar yerine **değişkenin adı** yapıştırılmıştı. Yani anahtar hiç
   gitmiyordu. Bu, transport failure'ın muhtemel asıl sebebi.
4. Değer, Supabase'in **legacy `anon` (JWT, `eyJ...`)** anahtarıyla değiştirildi
   ve önbelleksiz yeniden dağıtım yapıldı.
5. **Sonuç öğrenilemedi — oturum burada bitti.**

### Yeni oturumda ilk iş

Kullanıcıdan `/k/eg-b03-s12` sayfasının üst gri satırını sormak:

- `Supabase · kanal açık` → **Faz 2 bitti.** İki cihazlı test yapılır
  (bilgisayarda `/p/eg-b03-s12`, telefonda `/k/eg-b03-s12`).
- Hâlâ `kanal kapalı` → sarı teşhis metni istenir. Sıradaki şüpheliler:
  - Supabase projesi yeni açıldıysa Realtime servisi henüz ayakta olmayabilir
  - Supabase panelinde Realtime'ın kapalı olması
  - `sb_publishable_` anahtarın Realtime tarafından kabul edilmemesi (legacy
    JWT anahtara geçildi, bu ihtimal büyük olasılıkla elendi)

---

## 4. Verilmiş kararlar (tekrar sorulmasın)

| Konu | Karar |
|---|---|
| Sosyal uygulama | **Akış**, renk `#0f6f74` — kullanıcı seçti |
| Mesaj uygulaması | **Mesaj** (Türk telefonlarında yerleşik ad) — kullanıcı seçti |
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

1. **Arama motorunun kurgusal adı** — `arama` modülü buna bağlı (Google yerine ne?)
2. **Sahte web sitelerinin şablonları** — `web` modülü için
3. **Gerçek replikler** — şu an hepsi yer tutucu. Özellikle `eg-b03-s58`'de
   Sezai'nin yorumu hâlâ `"..."` (CLAUDE.md'de de öyle yazıyordu, birebir korundu)
4. **Yapımdan gelen fotoğraflar** — `public/ornek` ve `public/avatar` altındaki
   soyut çizimlerin yerine

---

## 6. Ortam kısıtları (önemli)

- Bu çalışma ortamının ağ politikası **`vercel.app` ve `supabase.co`
  adreslerini engelliyor.** Yayındaki siteyi veya Supabase'i buradan test etmek
  MÜMKÜN DEĞİL. Doğrulamayı kullanıcı yapmalı.
- Yerel doğrulama tam çalışıyor: `npm run build && npm run start` + Playwright
  (Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`).
- Sunucu yeniden başlatılırken portun boşaldığından emin olunmalı; `next start`
  port doluysa sessizce ölüyor ve eski yapı servis edilmeye devam ediyor
  (bu tuzağa bir kez düşüldü).

---

## 7. Kullanıcıyla çalışma şekli

- **Kullanıcı yazılımcı değil.** Terminal, GitHub, Vercel gibi şeyler yeni.
  Açıklamalar sade olmalı, jargon açıklanmalı.
- **Aynı anda tek adım ver.** Uzun listeler boğuyor; "geldim" deyince sonraki
  adımı vermek iyi çalıştı.
- İletişim **Türkçe**. Ekran görüntüsü atarak soruyor; görüntüden okuyup teşhis
  koymak gerekiyor.
- Kendi bilgisayarında komut çalıştırmayı sevmiyor — mümkün olan her şeyi
  bu taraftan yapıp sonucu ekran görüntüsüyle göstermek iyi karşılandı.
- Her adım sonunda **GitHub'a ve `main`'e** gidiyor; Vercel kendiliğinden kuruyor.
- Kredi tüketimine dikkat edilmesi istendi: az ve toplu araç çağrısı, gereksiz
  ekran görüntüsü almamak.

### Yararlı olduğu görülen alışkanlıklar

- Her adımın sonunda: `npx tsc --noEmit`, `npm test`, `npm run validate`,
  `npm run build`, gerektiğinde `npm run kabul`.
- Tarayıcıda **gerçekten** doğrulamak (sadece test değil) — birkaç gerçek hata
  böyle yakalandı: banner hiç kalkmıyordu, panel gecikmesi ekrana yansımıyordu,
  offline'da parametreli adres açılmıyordu, telefonda 5 dokunuş çalışmıyordu.
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
