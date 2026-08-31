import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL ="https://qnntmkvdqlpingedabml.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubnRta3ZkcWxwaW5nZWRhYm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMDE0NTIsImV4cCI6MjEwMzc3NzQ1Mn0.pP2zaPFxPt_i9R99RC0HYVMRdwvVhZrqi3SmsOEWv8A";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
