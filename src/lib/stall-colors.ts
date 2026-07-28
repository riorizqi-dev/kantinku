export interface StallColor {
  name: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  ring: string;
  text: string;
  textLight: string;
  bg: string;
  bgDark: string;
  border: string;
  badge: string;
  badgeText: string;
  css: string;
}

export const STALL_COLORS: Record<string, StallColor> = {
  RPL: {
    name: "RPL",
    primary: "#3b82f6",
    primaryHover: "#2563eb",
    primaryLight: "rgba(59, 130, 246, 0.15)",
    primaryDark: "rgba(59, 130, 246, 0.25)",
    ring: "rgba(59, 130, 246, 0.4)",
    text: "#1d4ed8",
    textLight: "#60a5fa",
    bg: "rgba(59, 130, 246, 0.08)",
    bgDark: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.3)",
    badge: "#3b82f6",
    badgeText: "#ffffff",
    css: `
      --stall-primary: #3b82f6;
      --stall-primary-hover: #2563eb;
      --stall-primary-light: rgba(59, 130, 246, 0.15);
      --stall-primary-dark: rgba(59, 130, 246, 0.25);
      --stall-text: #1d4ed8;
      --stall-text-light: #60a5fa;
    `,
  },
  BR: {
    name: "BR",
    primary: "#22c55e",
    primaryHover: "#16a34a",
    primaryLight: "rgba(34, 197, 94, 0.15)",
    primaryDark: "rgba(34, 197, 94, 0.25)",
    ring: "rgba(34, 197, 94, 0.4)",
    text: "#15803d",
    textLight: "#4ade80",
    bg: "rgba(34, 197, 94, 0.08)",
    bgDark: "rgba(34, 197, 94, 0.15)",
    border: "rgba(34, 197, 94, 0.3)",
    badge: "#22c55e",
    badgeText: "#ffffff",
    css: `
      --stall-primary: #22c55e;
      --stall-primary-hover: #16a34a;
      --stall-primary-light: rgba(34, 197, 94, 0.15);
      --stall-primary-dark: rgba(34, 197, 94, 0.25);
      --stall-text: #15803d;
      --stall-text-light: #4ade80;
    `,
  },
  MP: {
    name: "MP",
    primary: "#6b7280",
    primaryHover: "#4b5563",
    primaryLight: "rgba(107, 114, 128, 0.15)",
    primaryDark: "rgba(107, 114, 128, 0.25)",
    ring: "rgba(107, 114, 128, 0.4)",
    text: "#374151",
    textLight: "#9ca3af",
    bg: "rgba(107, 114, 128, 0.08)",
    bgDark: "rgba(107, 114, 128, 0.15)",
    border: "rgba(107, 114, 128, 0.3)",
    badge: "#6b7280",
    badgeText: "#ffffff",
    css: `
      --stall-primary: #6b7280;
      --stall-primary-hover: #4b5563;
      --stall-primary-light: rgba(107, 114, 128, 0.15);
      --stall-primary-dark: rgba(107, 114, 128, 0.25);
      --stall-text: #374151;
      --stall-text-light: #9ca3af;
    `,
  },
  AK: {
    name: "AK",
    primary: "#ef4444",
    primaryHover: "#dc2626",
    primaryLight: "rgba(239, 68, 68, 0.15)",
    primaryDark: "rgba(239, 68, 68, 0.25)",
    ring: "rgba(239, 68, 68, 0.4)",
    text: "#b91c1c",
    textLight: "#f87171",
    bg: "rgba(239, 68, 68, 0.08)",
    bgDark: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.3)",
    badge: "#ef4444",
    badgeText: "#ffffff",
    css: `
      --stall-primary: #ef4444;
      --stall-primary-hover: #dc2626;
      --stall-primary-light: rgba(239, 68, 68, 0.15);
      --stall-primary-dark: rgba(239, 68, 68, 0.25);
      --stall-text: #b91c1c;
      --stall-text-light: #f87171;
    `,
  },
  OSIS: {
    name: "OSIS",
    primary: "#dc2626",
    primaryHover: "#b91c1c",
    primaryLight: "rgba(220, 38, 38, 0.15)",
    primaryDark: "rgba(220, 38, 38, 0.25)",
    ring: "rgba(220, 38, 38, 0.4)",
    text: "#991b1b",
    textLight: "#f87171",
    bg: "rgba(220, 38, 38, 0.08)",
    bgDark: "rgba(220, 38, 38, 0.15)",
    border: "rgba(220, 38, 38, 0.3)",
    badge: "#dc2626",
    badgeText: "#ffffff",
    css: `
      --stall-primary: #dc2626;
      --stall-primary-hover: #b91c1c;
      --stall-primary-light: rgba(220, 38, 38, 0.15);
      --stall-primary-dark: rgba(220, 38, 38, 0.25);
      --stall-text: #991b1b;
      --stall-text-light: #f87171;
    `,
  },
};

export const DEFAULT_STALL_COLOR: StallColor = {
  name: "KantinKu",
  primary: "#f97316",
  primaryHover: "#ea580c",
  primaryLight: "rgba(249, 115, 22, 0.15)",
  primaryDark: "rgba(249, 115, 22, 0.25)",
  ring: "rgba(249, 115, 22, 0.4)",
  text: "#c2410c",
  textLight: "#fb923c",
  bg: "rgba(249, 115, 22, 0.08)",
  bgDark: "rgba(249, 115, 22, 0.15)",
  border: "rgba(249, 115, 22, 0.3)",
  badge: "#f97316",
  badgeText: "#ffffff",
  css: `
    --stall-primary: #f97316;
    --stall-primary-hover: #ea580c;
    --stall-primary-light: rgba(249, 115, 22, 0.15);
    --stall-primary-dark: rgba(249, 115, 22, 0.25);
    --stall-text: #c2410c;
    --stall-text-light: #fb923c;
  `,
};

export function getStallColor(booth?: string | null): StallColor {
  if (!booth) return DEFAULT_STALL_COLOR;
  const upper = booth.toUpperCase().trim();
  return STALL_COLORS[upper] || DEFAULT_STALL_COLOR;
}

export function getStallColorBySellerId(
  sellerId: string,
  sellers: Array<{ id: string; booth?: string }>
): StallColor {
  const seller = sellers.find((s) => s.id === sellerId);
  return getStallColor(seller?.booth);
}
