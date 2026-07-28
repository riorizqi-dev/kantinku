"use client";

/**
 * Smooth scroll dimatikan dulu — Lenis sering bikin teks/animasi
 * whileInView "nyangkut" opacity 0 (IntersectionObserver rusak).
 * Wrapper tetap ada biar import AppShell tidak pecah.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
