import { createClient } from "@supabase/supabase-js";

const DATA_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const DATA_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "public-anon-key";

export const dataClient = createClient(DATA_SUPABASE_URL, DATA_SUPABASE_ANON_KEY, {
  db: { schema: "mart" },
});
