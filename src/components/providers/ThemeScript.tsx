/**
 * Inject theme class sebelum React hydrate (anti FOUC).
 * Dipakai sebagai inline script di body awal.
 */
export function ThemeScript() {
  // Prefer dark by default (premium dark product surface)
  const code = `(function(){try{var t=localStorage.getItem('kantinku_theme');var d=t!=='light';document.documentElement.classList.toggle('dark',!!d);}catch(e){document.documentElement.classList.add('dark');}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      // Suppress hydration warning for this inline script
      suppressHydrationWarning
    />
  );
}
