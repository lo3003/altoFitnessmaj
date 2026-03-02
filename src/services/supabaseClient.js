import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- AJOUT TEMPORAIRE POUR DEBUG ---
console.log("DEBUG Supabase URL:", supabaseUrl);
console.log("DEBUG Supabase Key:", supabaseKey ? "Chargée (masquée)" : "NON CHARGÉE");
// -----------------------------------

export const supabase = createClient(supabaseUrl, supabaseKey);