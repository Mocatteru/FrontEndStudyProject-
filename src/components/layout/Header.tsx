'use client'

import { ThemeToggle } from '@/components/common/ThemeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 flex h-20 w-full items-center justify-between border-b border-black/5 dark:border-white/5 bg-white/70 dark:bg-black/70 px-4 sm:px-10 backdrop-blur-2xl transition-all duration-500 shadow-sm">
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                <SidebarTrigger className="size-11 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-2xl hover:bg-blue-500/10 hover:text-blue-500 transition-all active:scale-95 border border-transparent hover:border-blue-500/20 shadow-none" aria-label="사이드바 토글" />
                <div className="hidden sm:block h-6 w-px bg-black/5 dark:bg-white/10" />

                {/* [Senior] 현재 경로 힌트 추가 */}
                <div className="hidden lg:flex flex-col">
                    <span className="text-[10px] font-black tracking-widest text-muted-foreground/30 leading-none mb-1 uppercase">현재 위치</span>
                    <span className="text-sm font-black tracking-tighter text-foreground/60">
                        {pathname === '/' ? '홈 화면' : pathname.replace('/', '').replace('-', ' ').toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="flex items-center p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 transition-all">
                <ThemeToggle />
            </div>
        </header>
    );
}
