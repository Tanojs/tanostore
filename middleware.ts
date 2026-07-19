import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Mengambil data pengguna yang sedang aktif
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAdminRoute = path.startsWith('/admin')
  const isCheckoutRoute = path.startsWith('/checkout') || path.startsWith('/api/checkout')
  const isOrderHistoryRoute = path.startsWith('/cek-order')
  const isProfileRoute = path.startsWith('/profile')

  // Belum login tapi mencoba akses halaman yang wajib login (beli, riwayat pesanan, admin, profil)
  if (!user && (isAdminRoute || isCheckoutRoute || isOrderHistoryRoute || isProfileRoute)) {
    // Untuk API route, balas 401 JSON, bukan redirect (redirect tidak berguna untuk fetch())
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Anda harus login terlebih dahulu untuk melakukan pembelian.' },
        { status: 401 }
      )
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  // Sudah login tapi bukan admin, mencoba akses /admin -> tolak akses
  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return response
}

// Menentukan rute mana saja yang akan diproses oleh middleware ini
export const config = {
  matcher: ['/checkout/:path*', '/admin/:path*', '/api/checkout/:path*', '/cek-order/:path*', '/profile/:path*'],
}
