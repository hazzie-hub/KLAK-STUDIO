import { SkinSchema, type Skin } from "@/schema";

/** Sahne/cihaz kabuğu yoksa kullanılacak kabuk. */
export const YEDEK_SKIN: Skin = "ios";

/**
 * Hangi kabuk kullanılacak?
 * Öncelik: `?skin=` (test için ezme, CLAUDE.md §3.1) > cihazınki > yedek.
 * Geçersiz bir `?skin=` sahneyi bozmaz, sessizce yok sayılır.
 */
export function skinSec(istenen: string | undefined, cihazinki: Skin | undefined): Skin {
  if (istenen !== undefined) {
    const r = SkinSchema.safeParse(istenen);
    if (r.success) return r.data;
    console.error(`[ekran] Bilinmeyen skin: "${istenen}". Cihazınki kullanılıyor.`);
  }
  return cihazinki ?? YEDEK_SKIN;
}
