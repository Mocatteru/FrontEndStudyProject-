'use client'

import React from 'react';
import { useUiStore } from '@/store/uiStore';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export default function Header() {
    // [Senior Pattern] 하이드레이션 에러 방지를 위해 useSyncExternalStore 기반 가드 사용
    const mounted = React.useSyncExternalStore(
        () => () => { }, // 구독 대상 없음
        () => true,      // 클라이언트 측 Snapshot
        () => false     // 서버 측 Snapshot
    );

    const { userName, isWatchListOpen, toggleWatchList, userEmail } = useUiStore();
    const pathname = usePathname();
    const isStockPage = pathname.includes('/stock-page');

    return (
        <header className="sticky top-0 z-50 flex h-20 w-full items-center justify-between border-b border-black/5 dark:border-white/5 bg-white/70 dark:bg-black/70 px-6 sm:px-10 backdrop-blur-2xl transition-all duration-500 shadow-sm">
            <div className="flex items-center gap-6 min-w-0">
                <div className="p-2.5 bg-black/5 dark:bg-white/5 rounded-2xl hover:bg-blue-500/10 hover:text-blue-500 transition-all active:scale-95 cursor-pointer border border-transparent hover:border-blue-500/20">
                    <SidebarTrigger />
                </div>
                <div className="hidden sm:block h-6 w-px bg-black/5 dark:bg-white/10" />

                {/* [Senior] 현재 경로 힌트 추가 */}
                <div className="hidden lg:flex flex-col">
                    <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/30 leading-none mb-1">현재 위치</span>
                    <span className="text-sm font-black tracking-tighter text-foreground/60">
                        {pathname === '/' ? '홈 화면' : pathname.replace('/', '').replace('-', ' ')}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-6 shrink-0 ml-4">
                <div className="flex items-center gap-3">
                    <div className="p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 hover:border-blue-500/20 transition-all">
                        <ThemeToggle />
                    </div>

                    {isStockPage && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleWatchList}
                                className={cn(
                                    "md:hidden group size-11 rounded-2xl transition-all duration-500 border border-transparent",
                                    isWatchListOpen
                                        ? "text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-lg shadow-blue-500/10"
                                        : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"
                                )}
                            >
                                <List className={cn(
                                    "size-5 transition-all duration-700",
                                    isWatchListOpen && "rotate-180"
                                )} />
                            </Button>
                            <div className="h-4 w-px bg-border mx-1 md:hidden" />
                        </>
                    )}

                    {/* [User Profile Card - Premium Update] */}
                    <div className={cn(
                        "flex items-center gap-4 pl-4 border-l border-black/5 dark:border-white/10 transition-all duration-700",
                        !mounted ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
                    )}>
                        <div className="hidden sm:flex flex-col items-end text-right">
                            <span className="text-[13px] font-black tracking-tight text-foreground leading-none mb-1 group-hover:text-blue-500 transition-colors uppercase italic">{userName}님 로그인 중</span>
                            <span className="text-[10px] font-black tracking-widest text-muted-foreground/30 uppercase">{userEmail}</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
