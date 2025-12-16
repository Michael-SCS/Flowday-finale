import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uypbqnmyrstqvlawxqzd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5cGJxbm15cnN0cXZsYXd4cXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NjY3MTIsImV4cCI6MjA4MTE0MjcxMn0.rs8vc1Ayw9F7z3emuecYInIUQ-EFwlpUIiwNbg8uDA0';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);