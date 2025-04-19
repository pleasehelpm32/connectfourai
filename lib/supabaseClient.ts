// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // For anonymous access
  },
  global: {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  },
});

// We're keeping these methods but they're simplified since we're not using real-time
// functionality for the computer player version
export function subscribeToGame() {
  return {
    unsubscribe: () => {
      // No-op
    },
  };
}

export function subscribeToPlayerCounts() {
  return {
    unsubscribe: () => {
      // No-op
    },
  };
}

export async function checkAuth() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  console.log("Session:", session);
  console.log("Auth error:", error);

  return { session, error };
}

export async function testConnection() {
  try {
    // Try a simple health check
    const { data, error } = await supabase.from("User").select("count(*)");

    console.log("Connection test data:", data);
    console.log("Connection test error:", error);

    return { success: !error, data, error };
  } catch (e) {
    console.error("Connection test exception:", e);
    return { success: false, error: e };
  }
}
