import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  try {
    // Check if setup is complete by calling the setup check API
    const setupResponse = await fetch(`${request.nextUrl.origin}/api/setup/check`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    })
    
    const setupData = await setupResponse.json()
    const setupComplete = setupData.setupComplete

    // If setup is not complete and not on setup page, redirect to setup
    if (!setupComplete && pathname !== '/setup') {
      return NextResponse.redirect(new URL('/setup', request.url))
    }

    // If setup is complete and on setup page, redirect to login
    if (setupComplete && pathname === '/setup') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Protect admin routes
    if (pathname.startsWith('/admin')) {
      const user = await getSession()
      
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      
      if (user.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    // Protect login page - redirect if already logged in
    if (pathname === '/login') {
      const user = await getSession()
      if (user) {
        if (user.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url))
        } else {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // If there's an error checking setup, assume setup is not complete
    if (pathname !== '/setup') {
      return NextResponse.redirect(new URL('/setup', request.url))
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}