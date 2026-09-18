import type { Skin } from "@/schema";

/**
 * Skin temaları. CLAUDE.md §4: skin'ler CSS değişkenleriyle temalanır.
 * Modüller doğrudan renk yazmaz; bu değişkenleri okur.
 */
export type TemaDegiskenleri = Record<`--${string}`, string>;

export const temalar: Record<Skin, TemaDegiskenleri> = {
  ios: {
    "--yazi-tipi": "var(--font-inter), system-ui, sans-serif",
    "--zemin": "#ffffff",
    "--zemin-ikincil": "#f2f2f7",
    "--metin": "#000000",
    "--metin-soluk": "#8e8e93",
    "--ayrac": "#c6c6c8",
    "--vurgu": "#007aff",
    "--durum-cubugu-yazi": "#000000",
    "--durum-cubugu-yukseklik": "54px",
    "--alt-cubuk-yukseklik": "34px",
    "--kose-yaricap": "12px",
  },
  android: {
    "--yazi-tipi": "var(--font-roboto), system-ui, sans-serif",
    "--zemin": "#ffffff",
    "--zemin-ikincil": "#f1f3f4",
    "--metin": "#1f1f1f",
    "--metin-soluk": "#5f6368",
    "--ayrac": "#dadce0",
    "--vurgu": "#1a73e8",
    "--durum-cubugu-yazi": "#1f1f1f",
    "--durum-cubugu-yukseklik": "28px",
    "--alt-cubuk-yukseklik": "24px",
    "--kose-yaricap": "8px",
  },
  desktop: {
    "--yazi-tipi": "var(--font-inter), system-ui, sans-serif",
    "--zemin": "#ffffff",
    "--zemin-ikincil": "#f5f5f7",
    "--metin": "#1d1d1f",
    "--metin-soluk": "#6e6e73",
    "--ayrac": "#d2d2d7",
    "--vurgu": "#0071e3",
    "--durum-cubugu-yazi": "#1d1d1f",
    "--durum-cubugu-yukseklik": "0px",
    "--alt-cubuk-yukseklik": "0px",
    "--kose-yaricap": "8px",
  },
};

/** React `style` nesnesine dönüştürür. */
export function temaStili(skin: Skin): React.CSSProperties {
  return temalar[skin] as React.CSSProperties;
}
