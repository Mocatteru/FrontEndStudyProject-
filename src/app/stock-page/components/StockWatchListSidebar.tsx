'use client';

import { SidebarContent, SidebarHeader, SidebarGroup, SidebarMenu } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import StockWatchListItem from "./StockWatchListItem";
import { useStockStore } from "@/store/useStockStore";
interface StockWatchListSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

/**
 * [StockWatchListSidebar]
 * - 리팩토링 포인트: Responsive Design (Desktop vs Mobile)
 *   1. Desktop (md:): 상대적 너비(Relative)를 가지며 아이콘 모드(w-16) 지원
 *   2. Mobile: 고정 위치(Fixed Overlay)를 가지며 닫힘 시 완전 숨김(w-0)
 */
export default function StockWatchListSidebar({ isOpen, onToggle }: StockWatchListSidebarProps) {
    const { stockWatchList } = useStockStore();
    return (
        <>
            {/* [Senior] Mobile Backdrop: 모바일에서 사이드바가 열릴 때 배경을 블러 처리하고 클릭 시 닫히도록 구현 */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] z-40 md:hidden animate-in fade-in duration-300"
                    onClick={onToggle}
                />
            )}

            <aside
                className={cn(
                    "h-full transition-all duration-500 ease-in-out flex flex-col overflow-hidden shrink-0 z-50",
                    "bg-white/95 dark:bg-black/95 backdrop-blur-md border-black/5 dark:border-white/10",

                    // [Desktop Style]
                    "md:relative md:border-l",
                    isOpen ? "md:w-80" : "md:w-16",

                    // [Mobile Style]
                    "fixed inset-y-0 right-0 shadow-2xl md:shadow-none border-l md:border-none",
                    isOpen ? "w-80" : "w-0 border-none",

                    // [Senior's Tip] 모바일에서 열렸을 때 외부 영역 클릭 방지를 위한 z-index 조정
                    !isOpen && "invisible md:visible"
                )}
            >
                {/* [1] 사이드바 헤더: 타이틀 및 토글 버튼 */}
                <SidebarHeader className={cn(
                    "p-6 border-b border-black/5 dark:border-white/10 flex items-center transition-all duration-500",
                    isOpen ? "flex-row justify-between h-24" : "flex-col justify-center h-24"
                )}>
                    {isOpen ? (
                        <>
                            <div className="flex pl-6 items-center gap-3 font-black text-2xl text-yellow-500 animate-in fade-in slide-in-from-left-4">
                                <span className="uppercase tracking-widest ">관심종목</span>
                            </div>
                            <button
                                onClick={onToggle}
                                className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all text-muted-foreground hover:text-foreground active:scale-90 border border-transparent hover:border-black/5"
                            >
                                <Menu className="size-5" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onToggle}
                            className="p-3.5 bg-blue-500/10 text-blue-500 rounded-2xl hover:bg-blue-500/20 transition-all active:scale-90 shadow-sm border border-blue-500/10"
                        >
                            <Menu className="size-5" />
                        </button>
                    )}
                </SidebarHeader>

                {/* [2] 사이드바 콘텐츠: 관심 종목 리스트 */}
                <SidebarContent className={cn(
                    "flex-1 overflow-hidden", // 내부 스크롤을 위해 overflow 제어
                    !isOpen && "md:flex flex-col items-center pt-8"
                )}>
                    <div className="h-full overflow-y-auto custom-scrollbar p-3">
                        <SidebarGroup className={cn("w-full transition-all duration-500", !isOpen && "px-0")}>
                            <SidebarMenu className={cn("gap-3 transition-all duration-500", !isOpen && "items-center")}>
                                {stockWatchList.map((v) => (
                                    <StockWatchListItem
                                        key={v.ticker}
                                        {...v}
                                        isOpen={isOpen}
                                    />
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    </div>
                </SidebarContent>
            </aside>
        </>
    );
}