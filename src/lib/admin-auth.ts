import { supabase } from './supabase'

export async function getCurrentAdmin() {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return null

  const { data, error } = await supabase.rpc('is_admin')
  if (error || !data) return null
  return userData.user
}

export async function signInAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  const isAdmin = await getCurrentAdmin()
  if (!isAdmin) {
    await supabase.auth.signOut()
    throw new Error('Esta conta ainda não tem permissão de administrador.')
  }
  return data.user
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
