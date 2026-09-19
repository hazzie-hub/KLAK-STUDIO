import { NextResponse, type NextRequest } from "next/server";

import { OTURUM_CEREZI, jetonEsit, oturumJetonu, serbestAdresMi } from "@/studio/oturum";

/**
 * Giriş bekçisi. CLAUDE.md §8
 *
 * Stüdyo ve operatör sayfaları parolanın arkasında; oynatıcı ve kumanda
 * serbest (sette parola sorulamaz — bkz. `serbestAdresMi`).
 */
export async function middleware(istek: NextRequest) {
  const yol = istek.nextUrl.pathname;
  if (serbestAdresMi(yol)) return NextResponse.next();

  const cerez = istek.cookies.get(OTURUM_CEREZI)?.value;
  if (cerez !== undefined && jetonEsit(cerez, await oturumJetonu())) {
    return NextResponse.next();
  }

  // Girişten sonra istenen sayfaya dönebilmek için adresi taşıyoruz.
  const hedef = new URL("/giris", istek.url);
  if (yol !== "/") hedef.searchParams.set("devam", yol + istek.nextUrl.search);
  return NextResponse.redirect(hedef);
}

export const config = {
  /**
   * Statik dosyalar bekçiye hiç uğramasın: oynatıcı sette internetsiz
   * çalışırken servis çalışanının indirdiği her şey buradan geçiyor.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?)$).*)"],
};
