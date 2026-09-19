# Devir notu

Yeni oturuma başlarken bu dosya okunur. `CLAUDE.md` projenin anayasasıdır;
bu dosya **nerede kaldığımızı** ve **nasıl çalışıldığını** anlatır.

---

## 0. Bir bakışta

**Faz 1–4 bitti. Sistem kurulu ve yayında çalışıyor.**

| | |
|---|---|
| Modüller | 9/9 — kilit, sosyal, mesaj, arama, web, telefon, galeri, harita, anaekran |
| Stüdyo | Şablon → form → kaydet → onayla → teslim paketi. JSON yazılmıyor |
| Veri | Supabase'te. `content/` dosyaları yalnızca test/geliştirme kaynağı |
| Sahneler | 9 sahne yayında |
| Doğrulama | 319 test · `validate` 40 dosyada temiz (3 uyarı, kasıtlı) |

Geriye CLAUDE.md'de yalnızca **Faz 5 (hızlandırıcılar)** kaldı ve o zorunlu
değil: senaryodan taslak üretme, ghost typing ekstraları, gerekirse Capacitor.

**Sıradaki iş kodda değil, içerikte** — §3'e bak.

---

## 1. Nerede ne var

| | |
|---|---|
| Depo | `hazzie-hub/KLAK-STUDIO`, kod `ekran/` klasöründe |
| Dal | `main` |
| Yayın | https://ekran-rosy.vercel.app — Vercel projesi `ekran` |
| Veritabanı | Supabase, proje `gyrsjoziawhvjwdqhwcz` |

Kullanıcının masaüstündeki `KLAK-STUDIO-main` klasörü **eski, kopuk bir
indirmedir** — git deposu değil. Oradan çalışma. Çalışma kopyası her oturumda
GitHub'dan taze klonlanır, `npm install` çalıştırılır.

Kökteki `app/`, `components/`, `hooks/`, `lib/`, `types/` **başka bir projeye**
aittir. Dokunulmadı, dokunulmayacak. (Depoya bağlı ikinci bir Vercel projesi
olan `klak-studio` o eski projeyi kurmaya çalışıp her commit'te hata veriyor;
bizim işimizi etkilemiyor, kapatılabilir.)

### Adresler

| Adres | Kim kullanır |
|---|---|
| `/giris` | **KLAK Studio girişi** — parola. Stüdyo ve operatör sayfaları bunun arkasında |
| `/` | Dizi listesi: "Evlilik Güzeldir · TRT". Yeni dizi buraya eklenir |
| `/studio/dizi/{kod}` | Dizi paneli — sahne ağacı, yeni sahne, içerik aktarma |
| `/sahneler` | Sahne listesi (operatör): her sahnenin oynatıcı ve kumanda linki |
| `/studio/{kod}` | Teslim paketi: link, QR, sete gönderilecek metin, onay |
| `/studio/{kod}/duzenle` | Sahne formu |
| `/studio/yeni` | Şablon seçimi · `?sablon=` · `?kopya=` |
| `/p/{kod}` | **Oynatıcı** — oyuncunun eline verilen cihaz, kameraya giren ekran |
| `/k/{kod}` | **Kumanda** — operatörün telefonu |

> **Oynatıcı ve kumanda parola SORMAZ** ve asla sormamalı: sette oyuncunun ve
> operatörün eline verilen linkler onlar. `tests/oturum.test.ts` bunu denetler.
>
> Parola şu an `klak-studyo-2026` — koddaki varsayılan, giriş ekranı bunu
> kırmızı kutuyla söylüyor. Kullanıcıya özel parola istendiğinde ya kod
> değiştirilir ya da yayında `STUDIO_PAROLA` ortam değişkeni tanımlanır
> (tanımlıysa o geçerli olur, uyarı da kalkar).

### Sahneler

`eg-b03-s12` kilit+bildirim · `s13` mesajlaşma · `s44` gelen arama ·
`s58` sosyal (CLAUDE.md §5 örneği) · `s59` ghost typing · `s62` LOOK araması +
siteler · `s63` telefon uygulaması · `s64` ana ekran + harita + galeri ·
`s71` pil bitmesi.
>
> `s62`'nin 5. sonucu Akış'ın tarayıcıdaki hâlini açar (`sosyal` web şablonu).

> **`s62`, `s63`, `s64` numaraları UYDURMA** — yeni modülleri sette denemek
> için açıldı. Yapımdan gerçek numaralar gelince dosya adı ve `kod` alanı
> değiştirilecek.

---

## 2. Mimari — bozulmaması gerekenler

- **Ekran gerçekleşen olaylardan türer.** Modüller kendi sayacını/listesini
  tutmaz. Başa sar = olay listesini boşaltmak. Her tekrar birebir aynı.
- **Açık modül de olaylardan türer** (`src/modules/aktif-ekran.ts`). `ekranAc`
  başka bir modüle geçebilir (aramadan siteye). Ana ekrandan uygulamaya giriş
  ise GEÇİCİ yerel gezinmedir, olay listesine yazılmaz ve başa sarınca sıfırlanır.
- **Rastgelelik yok.** Gecikmeler, rota animasyonu, her şey deterministik.
- **Modüller kendi "yavaş yükleme" mantığını yazmaz** — hepsi `shared/medya.tsx`.
- **Otomatik zincir gerçekleşmiş olayı tekrar etmez.**
- Kumanda mesajları **idempotent** (nonce) ve Zod'dan geçer.
- **Oynatıcı sayfaları STATİK.** Sette internetsiz çalışmak şart (CLAUDE.md
  §2.3). Stüdyo sayfaları `force-dynamic`, oynatıcı asla.
- **Şema tek kaynak: Zod.** Veritabanında kayıt `veri` (jsonb) sütununda durur,
  yazmadan önce ve okuduktan sonra Zod'dan geçer.

---

## 3. Sıradaki iş — kullanıcıdan bekleniyor

Kod tarafında zorunlu bir iş kalmadı. Bunlar içerik:

1. **Gerçek sahne numaraları** — `s62`, `s63`, `s64` uydurma.
2. **Gerçek replikler** — hepsi yer tutucu. `eg-b03-s58`'de Sezai'nin yorumu
   hâlâ `"..."` (CLAUDE.md'de de öyle yazıyordu, birebir korundu).
3. **Yapımdan fotoğraflar** — `public/ornek` ve `public/avatar` altındaki soyut
   çizimlerin yerine.
4. **Uydurma alan adlarının yapım/hukuk onayı** — `kiyidasabah.com`,
   `gezginnotu.net`, `kadikoykahvaltici.com`, `rehberdefteri.net`,
   `gunluksehir.net`, `akissosyal.com`. Hepsi DNS'te sorgulandı, çözülmüyorlar;
   `sahilsofrasi.com`, `sehirdefteri.com`, `kentgundem.net`, `akis.com`,
   `akisapp.com`, `akis.app` GERÇEK çıktığı için elendi. Yeni alan adı
   uydururken aynı kontrolü yap (A kaydı yetmez, NS/SOA da bak: `akis.app`
   böyle yakalandı).

---

## 4. Verilmiş kararlar (tekrar sorulmasın)

| Konu | Karar |
|---|---|
| Sosyal uygulama | **Akış**, `#0f6f74` |
| Mesaj uygulaması | **Mesaj** |
| Arama motoru | **LOOK**, `#5f4bb6` |
| "Instagram" istendiğinde | Gerçek marka; yerine **Akış**. Bir test `instagram`, `whatsapp`, `facebook`, `twitter`, `tiktok`, `snapchat` kelimelerinin `src/`, `brands/`, `content/` altında GEÇMEDİĞİNİ denetler — yorum satırında bile |
| Sahte siteler | Şablonlar: `haber`, `blog`, `kurumsal`, `forum`. Gövde BLOK listesi, şablon yalnızca görünümü değiştirir |
| Rehber ve arama geçmişi | İçerik kütüphanesinde değil, **cihaz dosyasında** |
| Gelen / giden arama | Gelen arama SİSTEM katmanında (her modülün üstünde), giden arama `telefon` modülünde |
| Harita | Zemin KODLA ÇİZİLİYOR. Gerçek karo haritası yok: lisans/atıf riski + sette internet olmayabilir |
| Markaların yeri | `brands/index.ts`, tek kaynak |
| Yayınlama | Kaydetmek sahnenin oyuncu/kumanda sayfalarını `revalidatePath` ile tazeler. Sayfa statik kalır. **Vercel deploy hook fikri denendi ve BIRAKILDI** — kullanıcıdan kurulum istiyordu |

---

## 5. Stüdyo nasıl kurulu

- **Form, 13 aksiyon için 13 ayrı form değil**: alanlar `src/studio/alanlar.ts`'te
  VERİ olarak duruyor, form okuyup kendini kuruyor. `tests/alanlar.test.ts` bu
  tablonun Zod şemasından ayrışmasını engelliyor (alan adları birebir aynı
  olmalı, zorunluluklar uyuşmalı).
- **Teknik slug'lar arayüzde görünmez**: `MODUL_ADLARI`, `EKRAN_ADLARI`.
  Açılış ekranı `EKRANLAR` listesinden seçilir (yanlış yazılan ekran adı
  sessizce varsayılana düşüyordu).
- **Kimlikler kullanıcıya bırakılmadı** (`src/studio/kimlik.ts`): olay kimliği
  ADDAN türer, çakışırsa `-2`. Alan gizli, "değiştir" ile açılır. Elle
  değiştirilirse ad değişince dokunulmaz. **Kimlik değişince "sonra"
  tetiklerindeki referanslar da güncellenir** — yoksa zincir sessizce kopardı.
  "Hangi olaydan sonra" artık olay listesinden seçilir.
- **Hatalar alanı söyler** (`src/studio/hatalar.ts`): "2. olay (Sezai ısrar
  eder) · Ne olsun · Metin". Tıklayınca alana kayar ve alan kırmızı
  çerçevelenir; tekrar eden mesaj gösterilmez; boş alanlarda "Doldurulmalı."
- **Kilit ve versiyon**: onaylanan sahne kilitlenir, kaydedilemez. Yeni versiyon
  açmak önce `sahne_versiyonlari`na arşivler, SONRA kilidi açar — arşiv
  yazılamazsa kilit açılmaz. Link hiç değişmez.
- **Arayüz parçaları** `src/studio/panel.tsx`'te (Panel, PanelUst, Kart, Alan,
  Dugme, Rozet). Sayfalar kendi ölçülerini uydurmaz.

### İçerik dosyaları ile veritabanı ilişkisi — ÖNEMLİ

`content/` altındaki dosyalar **yayını beslemiyor.** Depoya yeni sahne/içerik
eklersen, Stüdyo ana sayfasındaki **"Depodaki içeriği aktar"** düğmesine bas
(sunucuda çalışır, kimseden bir şey istemez). Düğme hiçbir şey SİLMEZ ve
KİLİTLİ sahnelere dokunmaz; ama depoda karşılığı olan ve kilitli olmayan bir
sahneyi Stüdyo'dan düzenlediysen üstüne yazar.

---

## 6. Çalışma ortamı

**Kullanıcının Mac'i (tercih edilen):**

- Yayındaki siteye ve Supabase'e erişilebiliyor; tarayıcı panelinden doğrudan
  teşhis yapılabiliyor.
- `gh` kurulu ve girişli (`hazzie-hub`). Kod göndermek doğrudan buradan yapılır.
- Vercel oturumu YOK; kurulum durumu gerekirse GitHub üzerinden görülebilir:
  `gh api repos/hazzie-hub/KLAK-STUDIO/commits/<sha>/status`
- Tarayıcıda PWA servis çalışanı eski yapıyı önbellekte tutuyor; yeni dağıtımı
  görmek için servis çalışanını kaldırıp önbelleği temizle, yoksa eski sayfayı
  görüp yanlış teşhis koyarsın.

**Bulut oturumu:** ağ politikası `vercel.app` ve `supabase.co` adreslerini
engelliyor; yayını oradan test etmek mümkün değil.

Her iki ortamda: `next start` port doluysa sessizce ölür ve eski yapı servis
edilmeye devam eder. Yeniden başlatırken portu boşalt.

---

## 7. Kullanıcıyla çalışma şekli

- **GEREKMEDİKÇE KULLANICIDAN HİÇBİR ŞEY İSTEME.** Bu onun açık talimatı.
  İki yol varsa senin tek başına tamamlayabildiğini seç. Bir adım istemeden
  önce "bunu ben yapabilir miyim?" diye sor — genellikle yapılabiliyor:
  deploy hook yerine `revalidatePath`, elle veri girişi yerine üretilen SQL ya
  da sunucuda çalışan aktarma düğmesi. Gerçekten zorunlu tek iş tipi: yalnızca
  onun hesabında yapılabilen ve gizli bilgi gerektirenler. Onu da tek seferde,
  sebebiyle iste; seçimini bildir ama onay için bekleme.
- **Kullanıcı yazılımcı değil.** Jargon açıklanmalı. İletişim **Türkçe**.
- İstemek zorundaysan **tek adım ver**; "geldim" deyince sonrakini.
- Ekran görüntüsü atarak soruyor; görüntüden okuyup teşhis koymak gerekiyor.
- Kredi tüketimine dikkat: az ve toplu araç çağrısı, gereksiz ekran görüntüsü yok.

### Yararlı olduğu görülen alışkanlıklar

- Her adım sonunda: `npx tsc --noEmit`, `npm test`, `npm run validate`,
  `npm run build`, gerektiğinde `npm run kabul`.
- **Tarayıcıda gerçekten doğrula**, sadece teste güvenme. Bu oturumda böyle
  yakalananlar: banner kalkmıyordu, panel gecikmesi yansımıyordu, offline'da
  parametreli adres açılmıyordu, telefonda 5 dokunuş çalışmıyordu, Supabase
  anahtarı maskeli kopyalanmıştı, sette iki saat ve altta beyaz bant vardı.
- **Toplu metin değişiminde MUTLAKA doğrula.** Betikle yapılan `replace`
  eşleşmezse sessizce hiçbir şey yapmaz ve "tamam" yazar. Bir kez buna
  düşüldü: arayüz metni hiç değişmedi, sonra yayında o metin aranıp "kurulum
  gelmedi" sanıldı, yarım saat gitti. `assert eski in s` yaz ya da tek tek
  düzenleme aracını kullan.
- Bulunan her hatayı commit mesajında açıkça anlat.
- Gizli anahtar isterken: Supabase paneli anahtarı MASKELİ gösteriyor; fareyle
  seçilirse nokta işaretleri kopyalanıyor. Kopyala düğmesi kullanılmalı;
  kaydetmeden önce değerin `eyJ` ile başladığı ve içinde iki nokta olduğu
  doğrulatılmalı. Bu tuzak iki tur kaybettirdi.

---

## 8. Bilinen, çözülmemiş küçük konular

- `npm audit` 4 açık bildiriyor; hepsi Next.js'in içindeki postcss'ten.
  Düzeltmesi Next majör yükseltmesi istiyor, ayrı bir iş.
- Operatör sayfaları açık temaya sabitlendi (`.acik-sayfa`); koyu mod desteği yok.
- **Stüdyo parolası koddaki varsayılan.** Giriş var ve çalışıyor ama parola
  depoyu görebilen herkesçe bilinebilir. Kullanıcıya özel parola konulunca
  kapanır.
- **Dizi ekleme arayüzü yok.** Liste birden çok diziyi gösteriyor ama yeni dizi
  şimdilik içerik dosyasıyla ekleniyor; Stüdyo'dan ekleme formu yapılmadı.
- `npm run validate` 3 uyarı veriyor; üçü de "bu olaya zincir bağlı değil,
  yalnızca kumandadan tetiklenir" — kasıtlı.

---

## 9. Komutlar

```bash
cd ekran
npm install
npm run dev        # geliştirme (service worker kapalı)
npm run validate   # sahne ve içerik denetimi
npm test           # 299 test
npm run build && npm run start
npm run kabul      # kabul testi (önce build+start, ayrı terminalde)
npm run aktar -- --sql   # content/ → supabase/02-veri.sql (anahtar gerekmez)
```
