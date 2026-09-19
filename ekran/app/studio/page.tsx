import { redirect } from "next/navigation";

/**
 * Eski Stüdyo adresi. CLAUDE.md §8
 *
 * Sahne ağacı artık dizi panelinde (`/studio/dizi/{kod}`); kök adres dizi
 * listesi. Paylaşılmış eski linkler kırılmasın diye burası oraya götürür.
 */
export default function StudioSayfasi() {
  redirect("/");
}
