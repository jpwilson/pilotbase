import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseServerClient(operatorId?: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase server environment variables");
  }

  const client = createClient(url, key, {
    db: {
      schema: "public",
    },
    global: {
      headers: operatorId ? { "x-operator-id": operatorId } : {},
    },
  });

  return client;
}
