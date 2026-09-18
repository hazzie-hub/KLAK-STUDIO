import type { MetadataRoute } from "next";

/**
 * PWA manifesti. CLAUDE.md §4
 * `standalone`: ana ekrana eklenince tarayıcı çubuğu görünmez (§2.6).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ekran",
    short_name: "Ekran",
    description: "Set ekran sistemi",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
