import React from 'react';
import RestDataPage from './RestDataPage';

/**
 * [Next.js App Router (Page Component)]
 * - 파일 이름이 무조건 'page.tsx'여야 Next.js가 화면을 그려줍니다.
 * - 하지만 복잡성을 덜기 위해, 실제 렌더링은 같은 폴더의 'RestDataPage'에게 위임(Delegate)합니다.
 */
export default function Page() {
    return <RestDataPage />;
}