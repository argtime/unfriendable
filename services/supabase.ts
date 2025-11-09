
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jfafjztiublwaaujgmhh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmYWZqenRpdWJsd2FhdWpnbWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzgxMzUsImV4cCI6MjA3ODIxNDEzNX0.liKUy9jwCxbg2RoZJOQcA7y-9RZ0R5wSM3LcmKQIHnM';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);