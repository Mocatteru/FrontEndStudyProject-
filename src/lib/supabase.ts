// src/lib/supabase.ts

import { createBrowserClient } from '@supabase/ssr'

/**
 * [Best Practice] Next.js App Router용 브라우저 클라이언트
 * - createBrowserClient는 로그인 시 토큰을 브라우저 쿠키에 자동으로 저장합니다.
 * - 이 덕분에 서버의 middleware.ts와 로그인 세션을 완벽하게 공유할 수 있습니다.
 */
// [Rule 26, 30] 환경 변수 안전 접근 및 빌드 타임 에러 방지
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// [Best Practice] 빌드 시점에 환경 변수가 없어도 프로세스가 죽지 않도록 방어 로직 추가
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase 환경 변수가 설정되지 않았습니다. 빌드 타임이거나 설정 누락일 수 있습니다.");
}

export const supabase = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
);
