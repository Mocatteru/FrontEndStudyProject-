"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useAuthSync } from "@/hooks/useAuthSync";
import Header from "@/components/layout/Header";
import AppSidebar from "@/components/layout/Sidebar/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    // 1. 인증 상태 동기화 훅 호출
    useAuthSync();

    const { user, isLoading } = useAuthStore();
    const pathname = usePathname();

    // 2. 인증이 필요 없는 페이지 정의 (로그인, 회원가입 등)
    const isAuthPage = pathname.startsWith('/login-page') || pathname.startsWith('/signup-page');

    // 3. 레이아웃 노출 여부 결정
    // - 인증 페이지가 아니고, 사용자가 로그인되어 있으며, 로딩이 끝났을 때만 노출
    const showSidebarAndHeader = !isAuthPage && user && !isLoading;

    if (isAuthPage) {
        return <div className="min-h-screen bg-background">{children}</div>;
    }

    return (
        <SidebarProvider>
            {showSidebarAndHeader && <AppSidebar />}
            <SidebarInset className="flex flex-col flex-1 min-h-screen bg-background items-stretch">
                {showSidebarAndHeader && <Header />}
                <main className="flex-1 min-w-0 relative flex flex-col">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
