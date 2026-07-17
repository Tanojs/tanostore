import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Logika ini dipanggil dari Middleware, bisa diabaikan jika terjadi error saat set cookies
          }
        },
      },
    }
  )
}

// Client dengan Service Role Key — hanya boleh dipakai di route handler server
// (misalnya webhook pembayaran), TIDAK PERNAH di client/browser. Client ini
// bypass Row Level Security sepenuhnya, jadi setiap query yang dijalankan
// harus sudah divalidasi secara manual di kode server.
export function createServiceRoleClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

// Ambil user yang sedang login beserta rolenya (dari tabel profiles).
// Dipakai untuk proteksi halaman/route yang butuh login dan/atau role admin.
export async function getUserWithRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, role: null as null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return { supabase, user, role: (profile?.role as string | undefined) ?? 'user' }
}
