import { z } from "zod";

/**
 * Zod'un yerleşik hata mesajlarını Türkçeye çevirir.
 * CLAUDE.md §2.8 — kendi yazdığımız mesajlar zaten Türkçe; bu satır
 * "Unrecognized key" gibi Zod'dan gelenleri de Türkçeleştirir.
 *
 * Yan etkili modül: `src/schema/index.ts` en başta bunu içeri alır.
 */
z.config(z.locales.tr());
