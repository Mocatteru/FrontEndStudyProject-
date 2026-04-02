'use client';

import React from 'react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export default function Header() {
    const pathname = usePathname();
    const { isWatchListOpen, userName, userAvatar } = useUiStore();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error("로그아웃 중 오류가 발생했습니다.");
            return;
        }
        // [Rule 16] Proactive Suggestion: 로그아웃 후 모든 상태 초기화를 위해 강제 리로드 리다이렉트
        window.location.href = "/login-page";
    };

    // [Visual Context Sync] StockPage 렌더링 시 우측 서브사이드바 너비만큼 헤더 안전 영역(Safe Area) 확보
    const rightMargin = pathname === '/stock-page'
        ? (isWatchListOpen ? "md:pr-80" : "md:pr-15")
        : "";

    return (
        <header className={cn(
            "flex h-20 items-center justify-between border-b border-black/5 dark:border-white/5 bg-white/70 dark:bg-black/70 px-4 sm:px-10 backdrop-blur-2xl shadow-sm shrink-0",
            rightMargin
        )}>
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                <SidebarTrigger className="size-11 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-2xl hover:bg-blue-500/10 hover:text-blue-500 transition-all active:scale-95 border border-transparent hover:border-blue-500/20 shadow-none" aria-label="사이드바 토글" />
                <div className="hidden sm:block h-6 w-px bg-black/5 dark:bg-white/10" />

                {/* [Senior] 현재 경로 힌트 추가 */}
                <div className="hidden lg:flex flex-col">
                    <span className="text-xs font-black tracking-widest text-muted-foreground/60 leading-none mb-1 uppercase">현재 위치</span>
                    <span className="text-sm font-black tracking-tighter text-foreground/80">
                        {pathname === '/' ? '홈 화면' : pathname.replace('/', '').replace('-', ' ').toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 transition-all">
                    <ThemeToggle />
                </div>
                <div className="hidden sm:block h-6 w-px bg-black/5 dark:bg-white/10" />

                {/* [Rule 2, 23] Visual Hierarchy & Alignment */}
                <div className={cn(
                    "flex items-center gap-4 transition-all duration-500",
                    pathname === "/stock-page" ? "pr-10" : ""
                )}>
                    {/* [Senior UX] 전역 헤더 아바타 추가 (크기 상향: size-12) */}
                    <Avatar className="size-12 border-2 border-white/20 dark:border-white/5 shadow-md shrink-0">
                        <AvatarImage src={userAvatar} className="object-cover" referrerPolicy="no-referrer" />
                        <AvatarFallback className="bg-blue-500 text-white text-[10px] font-bold">
                            {userName?.slice(0, 2).toUpperCase() || "US"}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col items-end justify-center py-1">
                        <span className="text-sm font-bold text-foreground/80 leading-tight">
                            {userName || "사용자"}님
                        </span>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={handleLogout}
                            className="text-[11px] font-bold text-muted-foreground hover:text-destructive transition-colors p-0 h-4 min-h-0"
                        >
                            로그아웃
                        </Button>
                    </div>
                </div>
            </div>

        </header>
    );
}
