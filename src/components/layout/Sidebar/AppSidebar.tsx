'use client'

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePostStore } from '@/store/postStore';
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
    FileText,
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
    const { postCount } = usePostStore();

    return (
        <Sidebar collapsible="icon">
            <TabKeyToggle />

            {/* ── 상단 로고 및 유저 간략 정보 ── */}
            <SidebarHeader className="px-3 py-3">
                <div className="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:mx-auto">
                    <div className="flex shrink-0 aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm shadow-blue-600/40">
                        FE
                    </div>

                    <div className={cn(
                        "flex w-full flex-col gap-0.5 overflow-hidden group-data-[collapsible=icon]:hidden transition-opacity duration-300",
                        !mounted ? "opacity-0" : "opacity-100"
                    )}>
                        <span className="font-bold text-sm truncate">
                            {userName}
                        </span>
                        <span className="text-blue-500 font-bold text-[11px] uppercase tracking-tight">{userRole}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">
                            {userDepartment}
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarSeparator />

            <SidebarContent>
                {sidebarData.navMain.map((group) => (
                    <SidebarGroup key={group.title} className="px-2 py-2">
                        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                            {group.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            render={<Link href={item.url} />}
                                            isActive={pathname === item.url}
                                            tooltip={item.title}
                                            className="gap-3 rounded-lg group-data-[collapsible=icon]:mx-auto"
                                        >
                                            <item.icon className="size-4 shrink-0" />
                                            <span className="truncate">{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}

                <SidebarGroup className="px-2 group-data-[collapsible=icon]:hidden">
                    <SidebarGroupLabel>통계</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <div className="mx-1 rounded-lg bg-blue-500/8 dark:bg-blue-500/12 p-3 border border-blue-500/20">
                            <div className="flex items-center gap-2 mb-1">
                                <FileText className="size-3 text-blue-500" />
                                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wide">
                                    Active Posts
                                </p>
                            </div>
                            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                                {postCount}
                            </span>
                        </div>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarSeparator />

            <SidebarFooter className="p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            tooltip={userName}
                            className="rounded-lg group-data-[collapsible=icon]:mx-auto"
                        >
                            <div className="flex shrink-0 aspect-square size-8 items-center justify-center rounded-lg bg-linear-to-tr from-blue-500 to-purple-500 shadow-sm">
                                <UserCircle className="size-5 text-white" />
                            </div>
                            <div className={cn(
                                "grid flex-1 text-left text-sm leading-tight overflow-hidden group-data-[collapsible=icon]:hidden transition-opacity duration-300",
                                !mounted ? "opacity-0" : "opacity-100"
                            )}>
                                <span className="truncate font-semibold">{userName}</span>
                                <span className="truncate text-xs text-muted-foreground">{userRole}</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}