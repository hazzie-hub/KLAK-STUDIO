import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import withSerwistInit from "@serwist/next";

/**
 * Sahne sayfalarını önbelleğe açıkça ekler.
 *
 * Serwist'in kendi manifesti JS, CSS, font ve /public görsellerini kapsar ama
 * sayfa gezinmelerini kapsamaz. Sette telefon yeniden yüklenirse sahne
 * açılmak zorunda (CLAUDE.md §2.3), bu yüzden sahne adreslerini elle ekliyoruz.
 */
function sahneSayfalari() {
  const klasor = join(process.cwd(), "content", "sahneler");
  if (!existsSync(klasor)) return [];

  return readdirSync(klasor)
    .filter((d) => d.endsWith(".json"))
    .sort()
    .map((d) => {
      const kod = d.replace(/\.json$/, "");
      // Sahne değişince önbellek yenilensin diye içerikten özet alıyoruz.
      const ozet = createHash("md5")
        .update(readFileSync(join(klasor, d)))
        .digest("hex");
      return { url: `/p/${kod}`, revision: ozet };
    });
}

/**
 * /public altındaki görseller: post fotoğrafları, avatarlar, duvar kâğıtları.
 *
 * Serwist'in kendi manifesti bunları almıyor (globPublicPatterns denendi,
 * girmedi). Elle ekliyoruz — sette bu dosyalar olmadan sahne çıplak kalır.
 */
function genelVarliklar() {
  const kok = join(process.cwd(), "public");
  const uzantilar = /\.(svg|png|jpe?g|webp|avif|woff2?)$/i;
  const bulunan = [];

  const gez = (klasor, onek) => {
    if (!existsSync(klasor)) return;
    for (const girdi of readdirSync(klasor, { withFileTypes: true })) {
      const tamYol = join(klasor, girdi.name);
      const url = `${onek}/${girdi.name}`;
      if (girdi.isDirectory()) {
        gez(tamYol, url);
      } else if (uzantilar.test(girdi.name)) {
        bulunan.push({
          url,
          revision: createHash("md5").update(readFileSync(tamYol)).digest("hex"),
        });
      }
    }
  };

  gez(kok, "");
  return bulunan;
}

/**
 * CLAUDE.md §2.3: sette internet yok. Service worker sahneyi ve varlıklarını
 * önbelleğe alır. Geliştirme sırasında kapalı — yoksa değişiklikler görünmez.
 */
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false,
  // /public altındaki görseller (post fotoğrafları, avatarlar, duvar kâğıtları)
  // varsayılan manifeste girmiyordu; sette bunlar olmadan sahne çıplak kalır.
  additionalPrecacheEntries: [...genelVarliklar(), ...sahneSayfalari()],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Kökteki diğer proje de bir lockfile taşıyor; kökü açıkça bildiriyoruz.
  outputFileTracingRoot: process.cwd(),
};

export default withSerwist(nextConfig);
