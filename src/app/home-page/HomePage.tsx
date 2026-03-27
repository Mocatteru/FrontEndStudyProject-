import React from 'react';
import { LayoutDashboard } from "lucide-react";

/**
 * [페이지 로직 분리 (Colocation)]
 * - 메인 루트(/) 경로에 해당하는 실제 대시보드 UI 컴포넌트입니다.
 * - 서버 컴포넌트(Server Component)의 이점을 그대로 가져옵니다.
 */
import { ScrollArea } from "@/components/ui/scroll-area";

export default function HomePage() {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col p-10 space-y-8 animate-in fade-in duration-700">
        <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl">
            <LayoutDashboard className="size-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic drop-shadow-sm text-foreground">Dashboard</h2>
            <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/40 uppercase">Overview & Analytics</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-black/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 border-dashed">
          <LayoutDashboard className="size-16 text-muted-foreground/20 mb-6" />
          <h3 className="text-xl font-black text-foreground/60 mb-2 uppercase italic tracking-widest">Under Construction</h3>
          <p className="text-sm font-bold text-muted-foreground/40 tracking-widest uppercase">현재 주요 지표를 연동하고 있습니다.</p>
        </div>
      </div>
    </ScrollArea>
  );
}
