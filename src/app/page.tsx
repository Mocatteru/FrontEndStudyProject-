import React from 'react';

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">대시보드 개요</h2>
        <p className="text-gray-400">현재 시스템 상태 및 프로젝트 학습 진행률입니다.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Next.js 숙련도', value: '45%', color: 'from-blue-500 to-cyan-400' },
          { label: 'API 통합 (REST)', value: '대기 중', color: 'from-purple-500 to-pink-500' },
          { label: '상태 관리 (Zustand)', value: '구축 중', color: 'from-orange-500 to-yellow-500' },
          { label: '테스트 커버리지', value: '0%', color: 'from-green-500 to-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-sm font-medium text-gray-400">{stat.label}</p>
            <div className={`mt-2 text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.value}
            </div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full bg-gradient-to-r ${stat.color}`}
                style={{ width: stat.value.includes('%') ? stat.value : '10%' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-8">
        <h3 className="text-xl font-semibold mb-4">시니어 개발자의 조언</h3>
        <div className="space-y-4 text-gray-300">
          <p>
            &quot;프론트엔드 개발은 단순히 화면을 그리는 것이 아닙니다.
            <strong>데이터의 흐름</strong>을 어떻게 제어하고, <strong>복잡한 상태</strong>를 어떻게 관리하며,
            <strong>사용자 경험</strong>을 어떻게 최적화할지 고민하는 과정입니다.&quot;
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-400">
            <li>Next.js의 Server Components는 왜 사용해야 할까요?</li>
            <li>Client Components와의 경계를 어떻게 나누는 것이 좋을까요?</li>
            <li>대규모 앱에서 Props Drilling을 피하기 위한 최선의 전략은 무엇일까요?</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
