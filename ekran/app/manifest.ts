import type { MetadataRoute } from "next";

/**
 * PWA manifesti. CLAUDE.md §4
 *
 * `fullscreen`: ana ekrana eklenince tarayıcı çubuğu görünmez VE Android'de
 * telefonun kendi durum çubuğu da gizlenir (§2.6: kamerada teknik hiçbir şey
 * görünmez). Desteklenmeyen yerlerde tarayıcı kendiliğinden `standalone`a
 * düşer, davranış eskisi gibi olur.
 *
 * iOS bu alanı YOK SAYAR; orada tarayıcı çubuğunu `apple-mobile-web-app-capable`
 * kaldırır, telefonun kendi durum çubuğunu ise yalnızca Rehberli Erişim gizler.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ekran",
    short_name: "Ekran",
    description: "Set ekran sistemi",
    start_url: "/",
    display: "fullscreen",
    display_override: ["fullscreen", "standalone"],
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
