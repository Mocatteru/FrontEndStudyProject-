// src/lib/supabase.ts

import { createBrowserClient } from '@supabase/ssr'

/**
 * [Best Practice] Next.js App Router용 브라우저 클라이언트
 * - createBrowserClient는 로그인 시 토큰을 브라우저 쿠키에 자동으로 저장합니다.
 * - 이 덕분에 서버의 middleware.ts와 로그인 세션을 완벽하게 공유할 수 있습니다.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
)
