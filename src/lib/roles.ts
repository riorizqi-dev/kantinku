import type { SessionUser, UserRole } from "./types";

/** Hanya Penjual yang boleh kelola produk & stok */
export function canManageProducts(session: SessionUser | null): boolean {
  return session?.role === "seller" && !!session.sellerId;
}

/** Lihat semua pesanan platform */
export function canViewAllOrders(session: SessionUser | null): boolean {
  return session?.role === "admin" || session?.role === "superadmin";
}

/** Atur komisi + kelola akun admin/penjual */
export function canManagePlatform(session: SessionUser | null): boolean {
  return session?.role === "superadmin";
}

/** Laporan penjualan (admin + superadmin) */
export function canViewReports(session: SessionUser | null): boolean {
  return session?.role === "admin" || session?.role === "superadmin";
}

export function dashboardPath(role: UserRole | undefined): string | null {
  switch (role) {
    case "seller":
      return "/dashboard/seller";
    case "admin":
      return "/dashboard/admin";
    case "superadmin":
      return "/dashboard/super";
    case "buyer":
      return "/dashboard/customer";
    default:
      return null;
  }
}

export function roleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    superadmin: "Super Admin",
    admin: "Admin",
    seller: "Penjual",
    buyer: "Customer",
  };
  return map[role];
}

/** Penjual tidak belanja di menu utama — diarahkan ke dashboard lapak */
export function isSellerRole(role: UserRole | undefined): boolean {
  return role === "seller";
}
