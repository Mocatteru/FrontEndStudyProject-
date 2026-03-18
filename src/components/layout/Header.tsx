'use client';

import { useUiStore } from '@/store/uiStore';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function Header() {
    const { userName } = useUiStore();
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/50 px-8 backdrop-blur-md">
            <div className="flex items-center gap-4 min-w-0">
                <SidebarTrigger />
                <div className="h-4 w-px bg-border group-data-[collapsible=icon]:hidden" />
                <span className="text-sm font-semibold truncate group-data-[collapsible=icon]:block overflow-hidden">
                    Stock Dashboard
                </span>
            </div>

            <div className="flex items-center gap-4 shrink-0 ml-4">
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <span className="hidden sm:inline-block text-sm font-medium text-muted-foreground whitespace-nowrap">
                        <span className="text-foreground">{userName}</span>님 로그인 중
                    </span>
                </div>
            </div>
        </header>
    );
}
