import { z } from "zod";
import type { Olay } from "./olay";
import { OlaySchema } from "./olay";
import { DurumSchema, ModulSchema, SahneKoduSchema, SlugSchema } from "./ortak";

/** Sahnenin açılış hali. */
export const BaslangicSchema = z.strictObject({
  modul: ModulSchema,
  ekran: SlugSchema,
  hesap: SlugSchema.optional(),
  icerikRef: SlugSchema.optional(),
});

/**
 * Sahne. CLAUDE.md §5
 *
 * Faz 1'de sahneler dosyada durur, bu yüzden referanslar slug'dır (`cihaz: "nergis-pc"`).
 * `id`, `bolumId`, `versiyon`, `kilitli` alanları Stüdyo'nun (Faz 4) alanlarıdır;
 * şimdilik opsiyoneldir, Supabase'e geçişte zorunlu olacaktır.
 */
const TemelSahneSchema = z.strictObject({
  kod: SahneKoduSchema,
  cihaz: SlugSchema,
  baslangic: BaslangicSchema,
  durum: DurumSchema.default({ baglanti: "normal", gorsel: "normal" }),
  olaylar: z.array(OlaySchema).default([]),
  talimat: z
    .string({ error: "Talimat bir metin olmalı." })
    .min(1, { error: "Talimat boş olamaz — sete gönderilen mesajda bu metin kullanılır." }),

  // Faz 4 (Stüdyo) alanları:
  id: SlugSchema.optional(),
  bolumId: SlugSchema.optional(),
  versiyon: z.number().int().min(1).optional(),
  kilitli: z.boolean().optional(),
});

/**
 * Sahne içi tutarlılık denetimleri.
 * Şema tek tek alanları doğrular; burada alanlar ARASI ilişkiye bakılır.
 */
export const SahneSchema = TemelSahneSchema.superRefine((sahne, ctx) => {
  const olaylar: Olay[] = sahne.olaylar;

  // 1) Olay id'leri benzersiz olmalı.
  const gorulen = new Map<string, number>();
  olaylar.forEach((olay, i) => {
    const ilk = gorulen.get(olay.id);
    if (ilk !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["olaylar", i, "id"],
        message: `"${olay.id}" id'si zaten ${ilk}. olayda kullanılmış. Her olayın id'si benzersiz olmalı.`,
      });
    } else {
      gorulen.set(olay.id, i);
    }
  });

  // 2) "sonra" tetiği var olan bir olaya işaret etmeli, kendine değil.
  olaylar.forEach((olay, i) => {
    if (olay.tetik.tur !== "sonra") return;
    const hedef = olay.tetik.olayId;
    if (hedef === olay.id) {
      ctx.addIssue({
        code: "custom",
        path: ["olaylar", i, "tetik", "olayId"],
        message: `"${olay.id}" kendi kendini bekliyor. Bir olay kendinden sonra tetiklenemez.`,
      });
      return;
    }
    if (!gorulen.has(hedef)) {
      const adaylar = [...gorulen.keys()].join(", ");
      ctx.addIssue({
        code: "custom",
        path: ["olaylar", i, "tetik", "olayId"],
        message: `"${hedef}" diye bir olay yok. Mevcut olaylar: ${adaylar || "(hiç yok)"}.`,
      });
    }
  });

  // 3) Zincirde döngü olmamalı (a → b → a sahneyi sonsuz döndürür).
  const sonraki = new Map<string, string>();
  for (const olay of olaylar) {
    if (olay.tetik.tur === "sonra") sonraki.set(olay.id, olay.tetik.olayId);
  }
  for (const [baslangic] of sonraki) {
    const yol: string[] = [];
    let mevcut: string | undefined = baslangic;
    while (mevcut !== undefined && sonraki.has(mevcut)) {
      if (yol.includes(mevcut)) {
        const i = gorulen.get(baslangic);
        ctx.addIssue({
          code: "custom",
          path: ["olaylar", i ?? 0, "tetik", "olayId"],
          message: `Olay zincirinde döngü var: ${[...yol, mevcut].join(" → ")}. Zincir bir yerde bitmeli.`,
        });
        break;
      }
      yol.push(mevcut);
      mevcut = sonraki.get(mevcut);
    }
  }

  // 4) Boş kalan aksiyonlar: hiçbir şey yapmayan olay, sette sessiz hataya döner.
  olaylar.forEach((olay, i) => {
    const a = olay.aksiyon;
    if (a.tur === "baglantiDegisti" && a.baglanti === undefined && a.gorsel === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["olaylar", i, "aksiyon"],
        message: 'baglantiDegisti aksiyonunda en az "baglanti" veya "gorsel" verilmeli.',
      });
    }
    if (a.tur === "mesajGeldi" && a.metin === undefined && a.gorselRef === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["olaylar", i, "aksiyon"],
        message: 'mesajGeldi aksiyonunda en az "metin" veya "gorselRef" verilmeli.',
      });
    }
  });

});

/**
 * Uyarılar: sahneyi GEÇERSİZ kılmaz, ama sette sorun çıkarabilecek durumlar.
 * `npm run validate` bunları sarı satır olarak gösterir.
 */
export function sahneUyarilari(sahne: Sahne): string[] {
  const uyarilar: string[] = [];

  const kendiliginden = sahne.olaylar.some(
    (o) => o.tetik.tur === "baslangic" || o.tetik.tur === "dokunma",
  );
  if (sahne.olaylar.length > 0 && !kendiliginden) {
    uyarilar.push(
      'Hiçbir olay kendiliğinden başlamıyor ("baslangic" veya "dokunma" tetiği yok). Sahne yalnızca kumandayla/gizli panelle oynar. Kasıtlıysa sorun yok.',
    );
  }

  // Zincire hiç bağlanmayan, tetiği de olmayan olay: unutulmuş olabilir.
  const hedefAlinan = new Set(
    sahne.olaylar.flatMap((o) => (o.tetik.tur === "sonra" ? [o.tetik.olayId] : [])),
  );
  for (const olay of sahne.olaylar) {
    if (olay.tetik.tur === "elle" && !hedefAlinan.has(olay.id)) {
      uyarilar.push(
        `"${olay.id}" olayına hiçbir zincir bağlanmıyor ve tetiği "elle". Sadece kumandadan tetiklenebilir.`,
      );
    }
  }

  return uyarilar;
}

export type Sahne = z.infer<typeof SahneSchema>;
export type Baslangic = z.infer<typeof BaslangicSchema>;
