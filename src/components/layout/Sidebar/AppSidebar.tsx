'use client'

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/store/uiStore';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    SidebarSeparator,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    LayoutDashboard,
    Database,
    TrendingUp,
    Settings,
    UserCircle,
} from "lucide-react";
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────
// 메뉴 데이터: 이름, 경로, 아이콘을 함께 정의
// ─────────────────────────────────────────
const sidebarData = {
    navMain: [
        {
            title: "메뉴",
            items: [
                { title: "홈화면", url: "/home-page", icon: LayoutDashboard },
                { title: "데이터 리스트 (REST)", url: "/rest-data-page", icon: Database },
                { title: "주식 검색", url: "/stock-page", icon: TrendingUp },
                { title: "설정", url: "/settings-page", icon: Settings },
            ]
        }
    ]
};

// ─────────────────────────────────────────
// Tab 키 토글을 담당하는 내부 컴포넌트
// ─────────────────────────────────────────
function TabKeyToggle() {
    const { toggleSidebar } = useSidebar();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) return;

            e.preventDefault();
            toggleSidebar();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSidebar]);

    return null;
}

// ─────────────────────────────────────────
// 메인 사이드바 컴포넌트
// ─────────────────────────────────────────
export default function AppSidebar() {
    // [Senior Pattern] 하이드레이션 에러 방지를 위해 useSyncExternalStore 기반 가드 사용
    const mounted = React.useSyncExternalStore(
        () => () => { }, // 구독 대상 없음
        () => true,      // 클라이언트 측 Snapshot
        () => false     // 서버 측 Snapshot
    );

    const pathname = usePathname();
    const { userName, userDepartment, userRole } = useUiStore();
    const { isMobile, setOpenMobile } = useSidebar();

    // ── 경로 변경 시 모바일 사이드바 자동 닫기 UX ──
    useEffect(() => {
        if (isMobile) {
            setOpenMobile(false);
        }
    }, [pathname, isMobile, setOpenMobile]);

    return (
        <Sidebar collapsible="icon" className="border-r border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/80 backdrop-blur-xl transition-all duration-300">
            <TabKeyToggle />

            {/* ── 상단 로고 및 유저 간략 정보 - [Tactical Design Update] ── */}
            <SidebarHeader className="px-5 py-6">
                <div className="flex items-center gap-4 overflow-hidden group-data-[collapsible=icon]:justify-center transition-all duration-300">
                    <div className={cn(
                        "flex w-full flex-col gap-1 overflow-hidden group-data-[collapsible=icon]:hidden transition-all duration-300",
                        !mounted ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
                    )}>
                        <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm tracking-tighter italic uppercase text-foreground">
                                {userName}
                            </span>
                            <div className="size-1 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-black text-blue-500/80 uppercase tracking-[0.2em] italic leading-none">{userRole}</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarSeparator className="mx-4 opacity-30" />

            <SidebarContent className="px-3 py-4 gap-6">
                {sidebarData.navMain.map((group) => (
                    <SidebarGroup key={group.title} className="p-0">
                        <SidebarGroupLabel className="px-4 mb-4 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 group-data-[collapsible=icon]:hidden uppercase italic">
                            {group.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-2">
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            render={<Link href={item.url} />}
                                            isActive={pathname === item.url}
                                            tooltip={item.title}
                                            className={cn(
                                                "group/btn relative h-12 gap-4 rounded-[1.25rem] px-4 transition-all duration-300",
                                                pathname === item.url
                                                    ? "bg-blue-500 text-white shadow-xl shadow-blue-500/20 active:scale-95"
                                                    : "hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground/50 hover:text-foreground active:scale-95"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "size-4 shrink-0 transition-all duration-300",
                                                pathname === item.url ? "rotate-12 scale-110" : "group-hover/btn:rotate-12 group-hover/btn:scale-110"
                                            )} />
                                            <span className="font-black text-[11px] uppercase tracking-[0.15em] truncate group-data-[collapsible=icon]:hidden italic">
                                                {item.title}
                                            </span>
                                            {pathname === item.url && (
                                                <div className="absolute left-1.5 w-1 h-4 bg-white/40 rounded-full group-data-[collapsible=icon]:hidden" />
                                            )}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarSeparator className="mx-4 opacity-50" />

            <SidebarFooter className="p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            tooltip={userName}
                            className="h-16 gap-4 rounded-[1.5rem] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-black/5 dark:hover:border-white/5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
                        >
                            <div className="relative shrink-0 flex aspect-square size-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-purple-600 shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-all duration-300">
                                <UserCircle className="size-6 text-white" />
                                <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-green-500 rounded-full border-2 border-white dark:border-black animate-pulse" />
                            </div>
                            <div className={cn(
                                "flex flex-col text-left overflow-hidden group-data-[collapsible=icon]:hidden transition-all duration-300",
                                !mounted ? "opacity-0 -translate-x-2" : "opacity-100 translate-x-0"
                            )}>
                                <span className="font-black text-[11px] uppercase tracking-widest text-foreground/80 italic">{userName}</span>
                                <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">{userDepartment}</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}