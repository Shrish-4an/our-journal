import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ezeewzyktxqoqdhvfdpn.supabase.co";
// Replace this placeholder with your real key starting with "eyJ..." from Supabase API Settings
const supabaseAnonKey = "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);