'use client';

import { useUiStore } from '@/store/uiStore';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';
import { cn } from '@/lib/utils';
export default function Header() {
    const { userName, isWatchListOpen, toggleWatchList } = useUiStore();
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/50 px-8 backdrop-blur-md">
            <div className="flex items-center gap-4 min-w-0">
                <SidebarTrigger />
                <div className="h-4 w-px bg-border group-data-[collapsible=icon]:hidden" />
            </div>

            <div className="flex items-center gap-4 shrink-0 ml-4">
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    {/* [Senior] 하단 버튼 리팩토링: 모바일 전용(md:hidden) 및 아이콘(List) 변경 */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleWatchList}
                        className={cn(
                            "md:hidden group size-10 rounded-xl transition-all duration-300",
                            isWatchListOpen
                                ? "text-blue-500 bg-blue-50 dark:bg-blue-500/10"
                                : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                    >
                        <List className={cn(
                            "size-5 transition-all duration-500",
                            isWatchListOpen && "text-blue-500"
                        )} />
                    </Button>
                    <div className="h-4 w-px bg-border mx-1 md:hidden" />
                    <span className="hidden sm:inline-block text-sm font-medium text-muted-foreground whitespace-nowrap">
                        <span className="text-foreground">{userName}</span>님 로그인 중
                    </span>
                </div>
            </div>
        </header>
    );
}
