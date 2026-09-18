import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

/**
 * Service worker. CLAUDE.md §2.3 — oynatıcı bir kez yüklendikten sonra
 * internetsiz çalışmalı.
 *
 * `self.__SW_MANIFEST` derleme anında üretilir: sayfalar, JS, CSS ve
 * gömülü fontlar buraya girer. Sahne görselleri ilk açılışta çalışma
 * anında önbelleğe alınır (bkz. src/platform/hazirlik.ts).
 */
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [],
  },
});

serwist.addEventListeners();
