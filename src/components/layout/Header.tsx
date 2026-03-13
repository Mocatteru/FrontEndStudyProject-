'use client';

import { useUiStore } from '@/store/uiStore';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export default function Header() {
    const { userName } = useUiStore();
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/50 px-8 backdrop-blur-md">
            <div className="flex items-center gap-4">
            </div>

            <div className="flex items-center gap-6">
                <ThemeToggle />
                <span className="text-sm font-medium text-black dark:text-white">{userName}님 로그인 중</span>
            </div>
        </header>
    );
}
