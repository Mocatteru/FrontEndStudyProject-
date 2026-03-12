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

import { ThemeProvider } from "@/components/ThemeProvider";

import Sidebar from "@/components/layout/Sidebar/Sidebar";
import Header from "@/components/layout/Header";
import QueryProvider from "@/lib/QueryProvider";
import MainWrapper from "@/components/layout/MainWrapper";
import Toast from "@/components/common/Toast";

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <Sidebar />
            <MainWrapper>
              <Header />
              <main className="flex-1 p-8">
                {children}
              </main>
              <Toast />
            </MainWrapper>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
