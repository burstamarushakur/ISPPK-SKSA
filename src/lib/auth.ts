import { isSupabaseConfigured, supabase } from './supabase'

const DEMO_KEY = 'isppk_pic_session'
export async function picIsLoggedIn() {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getSession()
    return Boolean(data.session)
  }
  return sessionStorage.getItem(DEMO_KEY) === '1'
}

export async function picLogin(email: string, password: string) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return
  }
  const pin = import.meta.env.VITE_DEMO_PIC_PIN || '2468'
  if (password !== pin) throw new Error('PIN PIC tidak betul.')
  sessionStorage.setItem(DEMO_KEY, '1')
}

export async function picLogout() {
  if (isSupabaseConfigured && supabase) await supabase.auth.signOut()
  sessionStorage.removeItem(DEMO_KEY)
}
