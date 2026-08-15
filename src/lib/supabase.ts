import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase-types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gtvzvvtnhmjtcgvjnfrr.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_LUJ_76DaAYq13fwtOUlpCA_rDyd9odx'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export const TELEFANS_SUPABASE_PROJECT = 'gtvzvvtnhmjtcgvjnfrr'
