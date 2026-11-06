import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Runs only for /admin. It refreshes the Supabase session cookie and bounces signed-out visitors to the login page.
 * This is a first gate only: every admin page and server action ALSO verifies the administrator role on the server.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { data } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  if (!data.user && !pathname.startsWith('/admin/login')) {
    const login = request.nextUrl.clone()
    login.pathname = '/admin/login'
    login.search = ''
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }
  return response
}

export const config = { matcher: ['/admin', '/admin/:path*'] }
