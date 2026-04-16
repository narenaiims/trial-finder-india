/**
 * @file src/lib/supabase.ts
 * @description Supabase client initialization for TrialFinder India.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ? createClient(supabaseUrl, supabaseAnonKey) as any
  : null;
