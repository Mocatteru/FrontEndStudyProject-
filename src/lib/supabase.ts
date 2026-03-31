import { createClient } from "@supabase/supabase-js";

/**
 * [Senior Pattern] Supabase 클라이언트 싱글톤 객체
 * - 서비스 전역에서 단 하나의 클라이언트 인스턴스만 사용하여 효율적으로 통신합니다.
 * - 환경 변수(env.local)에 등록된 정보를 기반으로 수파베이스 서버와 연결됩니다.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Vercel 등 배포 환경에서 Prerender 단계(환경변수 로드 전)에 'supabaseUrl is required' 에러가 나는 것을 방지합니다.
export const supabase = createClient(
    supabaseUrl || "https://dummy.supabase.co",
    supabaseAnonKey || "dummy_key"
);
