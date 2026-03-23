import React from 'react';

/**
 * [페이지 로직 분리 (Colocation)]
 * - 메인 루트(/) 경로에 해당하는 실제 대시보드 UI 컴포넌트입니다.
 * - 서버 컴포넌트(Server Component)의 이점을 그대로 가져옵니다.
 */

export default function HomePage() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">홈화면</h2>
        <li>
          <span>여기에다가 다 넣을꺼임</span>
        </li>
      </div>
    </div>
  );
}
