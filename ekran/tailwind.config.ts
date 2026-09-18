import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Skin'ler CSS değişkenleriyle temalanır (CLAUDE.md §4).
      // Değişkenler Adım 2'de (cihaz kabuğu) tanımlanacak.
    },
  },
  plugins: [],
};

export default config;
