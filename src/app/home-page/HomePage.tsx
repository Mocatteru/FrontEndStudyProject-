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
        <h2 className="text-3xl font-bold tracking-tight">대시보드 개요</h2>
        <p className="text-gray-400">현재 시스템 상태 및 프로젝트 학습 진행률입니다.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Next.js 숙련도', value: '75%', color: 'from-blue-500 to-cyan-400' },
          { label: 'API 통합 (REST)', value: '완료', color: 'from-purple-500 to-pink-500' },
          { label: '상태 관리 (Zustand)', value: '완료', color: 'from-orange-500 to-yellow-500' },
          { label: '테스트 커버리지', value: '30%', color: 'from-green-500 to-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-sm font-medium text-gray-400">{stat.label}</p>
            <div className={`mt-2 text-2xl font-bold bg-linear-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.value}
            </div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className={`h-full bg-linear-to-r ${stat.color}`}
                style={{ width: stat.value.includes('%') ? stat.value : '100%' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-8">
        <h3 className="text-xl font-semibold mb-4">시니어 개발자의 조언 (복습 완료)</h3>
        <div className="space-y-4 text-gray-300">
          <p>
            &quot;3개월 만의 복습이었지만, 우리는 프로젝트의 뼈대를 다시 세웠습니다.
            <strong>Colocation 패턴</strong>으로 가독성을 잡고, <strong>React Query</strong>로 서버 상태를,
            <strong>Zustand</strong>로 클라이언트 상태를 정복했습니다. 이제 당신의 코드는 단순한 작동을 넘어 <strong>설계</strong>가 보이기 시작했습니다.&quot;
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-400">
            <li><strong>Hydration Mismatch</strong>를 해결하며 SSR의 원리를 이해했습니다.</li>
            <li><strong>React.memo</strong>를 적용하며 렌더링 최적화의 기준을 세웠습니다.</li>
            <li><strong>GitHub Actions</strong>를 통해 배포 안정성(CI)을 확보했습니다.</li>
            <li><strong>PascalCase vs kebab-case</strong> 논의를 통해 웹 표준의 가치를 배웠습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
