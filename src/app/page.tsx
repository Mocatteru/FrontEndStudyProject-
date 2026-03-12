import { redirect } from 'next/navigation';

/**
 * [Root Redirect Pattern]
 * - 역할: 사용자가 '/' 경로로 접속했을 때, 실제 메인 페이지인 '/home-page'로 강제 이동시킵니다.
 * - 장점: 핵심 페이지들을 기능별 폴더로 깔끔하게 정리하면서도, 진입점을 유지할 수 있습니다.
 */
export default function RootPage() {
    redirect('/home-page');
}
