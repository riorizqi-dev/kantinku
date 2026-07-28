/**
 * Helper client-side untuk memuat Snap.js dan membuka popup pembayaran.
 * Script URL otomatis menyesuaikan production/sandbox dari env.
 */

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: MidtransResult) => void;
          onPending?: (result: MidtransResult) => void;
          onError?: (result: MidtransResult) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export interface MidtransResult {
  order_id?: string;
  status_code?: string;
  transaction_status?: string;
  fraud_status?: string;
  [key: string]: unknown;
}

const SNAP_SANDBOX = "https://app.sandbox.midtrans.com/snap/snap.js";
const SNAP_PROD = "https://app.midtrans.com/snap/snap.js";

export function getSnapScriptUrl(): string {
  // Bisa di-override lewat env jika pakai endpoint custom
  if (process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL) {
    return process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL;
  }
  const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
  return isProd ? SNAP_PROD : SNAP_SANDBOX;
}

export function loadSnapScript(clientKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window not available"));
      return;
    }
    if (window.snap) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-midtrans-snap="1"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Gagal memuat script pembayaran"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = getSnapScriptUrl();
    script.setAttribute("data-client-key", clientKey);
    script.setAttribute("data-midtrans-snap", "1");
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat script pembayaran"));
    document.body.appendChild(script);
  });
}

export async function openSnapPayment(
  token: string,
  clientKey: string,
  handlers: {
    onSuccess?: (result: MidtransResult) => void;
    onPending?: (result: MidtransResult) => void;
    onError?: (result: MidtransResult) => void;
    onClose?: () => void;
  }
) {
  await loadSnapScript(clientKey);
  if (!window.snap) {
    throw new Error("Snap tidak tersedia");
  }
  window.snap.pay(token, handlers);
}
