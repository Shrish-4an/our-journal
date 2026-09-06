import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ezeewzyktxqoqdhvfdpn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6ZWV3enlrdHhnb3FkaHZmZHBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2ODY5NDAsImV4cCI6MjEwNDI2Mjk0MH0.XCVnJPzJPvhHUsncvpDFr80SRwdvkOYVwr5etPQ17E0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);