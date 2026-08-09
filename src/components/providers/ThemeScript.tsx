/**
 * Inject theme class sebelum React hydrate (anti FOUC).
 * Dipakai sebagai inline script di body awal.
 */
export function ThemeScript() {
  // Prefer light by default — mode terang sejak awal
  const code = `(function(){try{var t=localStorage.getItem('kantinku_theme');var d=t==='dark';document.documentElement.classList.toggle('dark',!!d);}catch(e){}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      // Suppress hydration warning for this inline script
      suppressHydrationWarning
    />
  );
}
