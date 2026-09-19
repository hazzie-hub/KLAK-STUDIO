-- ============================================================================
-- Ekran — Stüdyo veritabanı (Faz 4.2)
--
-- Supabase panelinde SQL Editor'a yapıştırılıp bir kez çalıştırılır.
-- Tekrar çalıştırmak güvenlidir: her şey "if not exists" ile korunmuştur,
-- var olan veriye dokunmaz.
--
-- TASARIM KARARI — neden JSONB?
-- Şema tek kaynak olarak Zod'da duruyor (CLAUDE.md §4: "hem Stüdyo formları
-- hem Oynatıcı bunu kullanır"). Alanları bir de SQL'de tanımlarsak iki ayrı
-- doğruluk kaynağı olur ve kaçınılmaz olarak birbirinden ayrışırlar. Bu yüzden
-- kaydın tamamı `veri` sütununda JSONB olarak durur; YAZMADAN ÖNCE ve
-- OKUDUKTAN SONRA Zod'dan geçer. Sorgulanması gereken alanlar (kod, dizi,
-- bölüm, tür) ayrıca sütun olarak tutulur ki listeleme ve filtreleme hızlı olsun.
--
-- GÜVENLİK: Tüm tablolarda RLS açık ve HİÇBİR politika tanımlı değil. Yani
-- anon anahtarıyla kimse okuyamaz. Erişim yalnızca service role anahtarıyla
-- (sunucu tarafı, derleme anı) mümkündür. Senaryo içeriği gizlidir; yayına
-- çıkan sahne sayfası zaten statik olarak üretilir, tarayıcı veritabanına
-- hiç bağlanmaz.
-- ============================================================================

-- ─── Ortak: güncelleme zamanı ───────────────────────────────────────────────

create or replace function ekran_guncellendi()
returns trigger
language plpgsql
as $$
begin
  new.guncellendi = now();
  return new;
end;
$$;

-- ─── Diziler ────────────────────────────────────────────────────────────────

create table if not exists diziler (
  kod          text primary key,
  veri         jsonb not null,
  olusturuldu  timestamptz not null default now(),
  guncellendi  timestamptz not null default now()
);

-- ─── Bölümler ───────────────────────────────────────────────────────────────

create table if not exists bolumler (
  dizi         text not null references diziler(kod) on delete cascade,
  no           integer not null check (no >= 1),
  veri         jsonb not null,
  olusturuldu  timestamptz not null default now(),
  guncellendi  timestamptz not null default now(),
  primary key (dizi, no)
);

-- ─── Karakterler ────────────────────────────────────────────────────────────

create table if not exists karakterler (
  id           text primary key,
  dizi         text not null references diziler(kod) on delete cascade,
  veri         jsonb not null,
  olusturuldu  timestamptz not null default now(),
  guncellendi  timestamptz not null default now()
);

create index if not exists karakterler_dizi_idx on karakterler (dizi);

-- ─── Cihazlar ───────────────────────────────────────────────────────────────

create table if not exists cihazlar (
  kod          text primary key,
  karakter     text references karakterler(id) on delete set null,
  veri         jsonb not null,
  olusturuldu  timestamptz not null default now(),
  guncellendi  timestamptz not null default now()
);

-- ─── Hesaplar (kurgusal sosyal/mesaj hesapları) ─────────────────────────────

create table if not exists hesaplar (
  id           text primary key,
  dizi         text references diziler(kod) on delete cascade,
  modul        text not null,
  veri         jsonb not null,
  olusturuldu  timestamptz not null default now(),
  guncellendi  timestamptz not null default now()
);

create index if not exists hesaplar_dizi_idx on hesaplar (dizi);

-- ─── İçerik kütüphanesi ─────────────────────────────────────────────────────

create table if not exists icerikler (
  id           text primary key,
  dizi         text references diziler(kod) on delete cascade,
  tur          text not null,
  veri         jsonb not null,
  olusturuldu  timestamptz not null default now(),
  guncellendi  timestamptz not null default now()
);

create index if not exists icerikler_dizi_idx on icerikler (dizi);
create index if not exists icerikler_tur_idx  on icerikler (tur);

-- ─── Sahneler ───────────────────────────────────────────────────────────────
--
-- `kilitli` ve `versiyon` Faz 4.5'in alanları; şimdiden duruyorlar ki
-- veritabanını ikinci kez göçürmek gerekmesin.

create table if not exists sahneler (
  kod          text primary key,
  dizi         text references diziler(kod) on delete cascade,
  bolum        integer,
  versiyon     integer not null default 1 check (versiyon >= 1),
  kilitli      boolean not null default false,
  yayinlandi   timestamptz,
  veri         jsonb not null,
  olusturuldu  timestamptz not null default now(),
  guncellendi  timestamptz not null default now()
);

create index if not exists sahneler_dizi_bolum_idx on sahneler (dizi, bolum);

-- Versiyon geçmişi: onaylanan sahne kilitlenir, revizyon YENİ versiyon açar,
-- link değişmez (CLAUDE.md §8).
create table if not exists sahne_versiyonlari (
  kod          text not null,
  versiyon     integer not null check (versiyon >= 1),
  veri         jsonb not null,
  not_metni    text,
  olusturuldu  timestamptz not null default now(),
  primary key (kod, versiyon)
);

-- ─── Güncelleme zamanı tetikleyicileri ──────────────────────────────────────

do $$
declare
  t text;
begin
  foreach t in array array[
    'diziler', 'bolumler', 'karakterler', 'cihazlar', 'hesaplar', 'icerikler', 'sahneler'
  ]
  loop
    execute format(
      'drop trigger if exists %I_guncellendi on %I', t, t
    );
    execute format(
      'create trigger %I_guncellendi before update on %I
       for each row execute function ekran_guncellendi()', t, t
    );
  end loop;
end;
$$;

-- ─── Satır düzeyi güvenlik ──────────────────────────────────────────────────
--
-- Politika TANIMLANMIYOR: anon anahtarıyla erişim tamamen kapalı.
-- Service role RLS'i zaten atlar; okuma/yazma yalnızca sunucu tarafından.

alter table diziler            enable row level security;
alter table bolumler           enable row level security;
alter table karakterler        enable row level security;
alter table cihazlar           enable row level security;
alter table hesaplar           enable row level security;
alter table icerikler          enable row level security;
alter table sahneler           enable row level security;
alter table sahne_versiyonlari enable row level security;
