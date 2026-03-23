import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/providers/ThemeProvider";

import Header from "@/components/layout/Header";
import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/Sidebar/AppSidebar";


export const metadata: Metadata = {
  title: "Frontend Mentorship Admin",
  description: "Next.js, TypeScript, React Query, Zustand 실무 프로젝트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      {/* 
        suppressHydrationWarning: 'next-themes' 사용 시 발생하는 서버/클라이언트 속성 불일치 경고를 방지합니다.
        서버는 사용자의 테마 설정을 모르기 때문에 발생하는 Next.js의 표준 해결 방식입니다.
      */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 
          ThemeProvider: 'next-themes' 라이브러리를 사용하여 테마 상태를 전역적으로 관리합니다.
          - attribute="class": 테마 상태가 바뀔 때 <html> 태그에 'class="dark"' 혹은 'class="light"'를 자동으로 주입합니다.
          - defaultTheme="system": 운영체제의 테마 설정을 기본값으로 사용합니다.
          - disableTransitionOnChange: 테마 전환 시 레이아웃 흔들림(FOUC)을 방지하기 위해 전환 중 transition을 일시 중지합니다.
        */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="flex flex-col flex-1 h-screen overflow-hidden items-stretch">
                <Header />
                <div className="flex-1 min-w-0 overflow-hidden relative">
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
            <Toaster position="bottom-right" richColors />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
