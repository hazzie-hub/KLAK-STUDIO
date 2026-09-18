/**
 * `sosyal` modülünün yayımladığı dokunma hedefleri.
 *
 * Sahneler bu adları `{ tur: "dokunma", hedef: ... }` tetiğinde kullanır.
 * Modül hangi sahnede olduğunu bilmez; sadece "şu oldu" diye haber verir.
 */
export const HOTSPOT = {
  /** Post yükleme akışı tamamlandı (CLAUDE.md §5'teki örnek sahne bunu kullanır). */
  postPaylas: "yeni-post-akisi-tamam",
  /** Post yükleme akışı başlatıldı (+ düğmesi). */
  postAkisiBasladi: "yeni-post-akisi-basladi",
  /** Yorum alanına dokunuldu — klavye açılır, ghost typing burada başlar. */
  yorumAlani: "yorum-alani",
  /** Yorum "Paylaş"a basıldı. */
  yorumGonderildi: "yorum-gonderildi",
} as const;

/** Ghost typing hedefi — sahneler `ghostTypingBaslat.hedef` olarak bunu kullanır. */
export const GHOST_HEDEF = {
  yorum: "yorum-yaz",
} as const;
