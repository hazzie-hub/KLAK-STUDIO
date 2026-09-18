/**
 * Geçici karşılama sayfası.
 * Oynatıcı (`/p/[kod]`) Adım 2'de gelir; burası o zaman sadeleşecek.
 */
export default function AnaSayfa() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", lineHeight: 1.6 }}>
      <h1 style={{ fontSize: "1.25rem", margin: 0 }}>Ekran</h1>
      <p style={{ color: "#666", marginTop: "0.5rem" }}>
        Faz 1 · Adım 1 tamam — sahne şeması kuruldu.
      </p>
      <p style={{ color: "#666" }}>
        Sahneleri denetlemek için: <code>npm run validate</code>
      </p>
    </main>
  );
}
