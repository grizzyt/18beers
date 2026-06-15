import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ucevlqbxegqnjmdpswqk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZXZscWJ4ZWdxbmptZHBzd3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTU0MzMsImV4cCI6MjA5NzEzMTQzM30.YCyBc6Ih2GJIRGviV0TEHpXN1YZK6P5o2SkScfvKzqE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
