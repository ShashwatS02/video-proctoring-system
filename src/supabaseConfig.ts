import { createClient } from "@supabase/supabase-js";

// 1. Replace with your Project URL from Supabase API settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// 2. Replace with your anon public key from Supabase API settings
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Add a check to ensure the variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are not set in the .env file.");
}

// 3. This creates the Supabase client that your app will use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
