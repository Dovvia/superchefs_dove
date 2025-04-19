import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "⚠️ Missing Supabase credentials! Make sure VITE_SUPABASE_URL and VITE_SUPABASE_KEY are set in your environment variables."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
