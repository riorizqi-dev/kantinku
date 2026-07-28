import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase browser/client helper.
 * Pakai di Client Components & shared code:
 *   import { supabase } from "@/lib/supabase"
 *
 * Env (wajib di .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Jangan throw di import time — biar build/dev tetap jalan
    // sebelum key diisi. Call ke API akan gagal jelas.
    if (typeof window !== "undefined") {
      console.warn(
        "[supabase] NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum di-set di .env.local"
      );
    }
  }

  return createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-anon-key"
  );
}

export const supabase = createSupabaseClient();

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return Boolean(
    url &&
      key &&
      !key.includes("isi_anon_key") &&
      key.length > 20
  );
}
