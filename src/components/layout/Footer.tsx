import { LogoMark } from "@/components/brand/Logo";
import { ContactAdmin } from "@/components/layout/ContactAdmin";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200/80 bg-white dark:border-white/[0.06] dark:bg-[#0a0a0b]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#059669] text-[#1c1917]"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)" }}
          >
            <LogoMark className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-[-0.02em] text-stone-900 dark:text-white">
              KantinKu
            </p>
            <p className="text-xs text-stone-500 dark:text-white/40">
              Pemesanan kantin sekolah digital
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <ContactAdmin />
          <p className="text-center text-xs text-stone-400 dark:text-white/30 sm:text-right">
            &copy; {new Date().getFullYear()} KantinKu · SMK Negeri 17 Jakarta
          </p>
        </div>
      </div>
    </footer>
  );
}
