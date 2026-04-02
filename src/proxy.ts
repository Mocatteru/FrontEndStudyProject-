// src/middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 1. SSR용 Supabase 클라이언트 생성 (Rule 26: 환경 변수 안전 처리)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // 2. 현재 사용자 정보 확인 (getSession 대신 getUser 권장)
    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    const isAuthPage = pathname.startsWith('/login-page') || pathname.startsWith('/signup-page')

    // 3. 리다이렉트 로직
    if (!user && !isAuthPage) {
        return NextResponse.redirect(new URL('/login-page', request.url))
    }

    if (user && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return response
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.webp$).*)'],
}
