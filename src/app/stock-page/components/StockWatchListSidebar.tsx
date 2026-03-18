'use client';

import { SidebarContent, SidebarHeader, SidebarGroup, SidebarMenu } from "@/components/ui/sidebar";
import { Star, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import StockWatchListItem from "./StockWatchListItem";
import { useStockStore } from "@/store/useStockStore";

interface StockWatchListSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

/**
 * [StockWatchListSidebar]
 * 사용자의 관심 종목을 관리하고 보여주는 우측 보조 사이드바입니다.
 * 
 * [Senior's Tip]
 * 1. 정보 노출 전략: 사이드바가 닫혔을 때는 최소한의 인터랙션(Toggle)만 남겨 시각적 노이즈를 줄입니다.
 * 2. 확장성: 데이터가 없을 때의 Empty State와 로딩 상태를 고려하여 구조를 설계했습니다.
 */
export default function StockWatchListSidebar({ isOpen, onToggle }: StockWatchListSidebarProps) {
    const { stockWatchList } = useStockStore();
    return (
        <aside
            className={cn(
                "h-full border-l border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-md transition-all duration-500 ease-in-out flex flex-col overflow-hidden shrink-0 z-20",
                isOpen ? "w-80" : "w-16"
            )}
        >
            {/* [1] 사이드바 헤더: 타이틀 및 토글 버튼 */}
            <SidebarHeader className={cn(
                "p-6 border-b border-black/5 dark:border-white/10 flex items-center transition-all duration-500",
                isOpen ? "flex-row justify-between h-24" : "flex-col justify-center h-24"
            )}>
                {isOpen ? (
                    <>
                        <div className="flex items-center gap-3 font-black text-sm text-blue-500 animate-in fade-in slide-in-from-left-4">
                            <Star className="size-5 fill-current text-blue-500 shadow-sm" />
                            <span className="uppercase tracking-widest italic">Watchlist</span>
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
                !isOpen && "hidden md:flex flex-col items-center pt-8"
            )}>
                <div className="h-full overflow-y-auto custom-scrollbar p-3">
                    <SidebarGroup className={cn("w-full transition-all duration-500", !isOpen && "px-0")}>
                        <SidebarMenu className={cn("gap-3 transition-all duration-500", !isOpen && "items-center")}>
                            {isOpen ? (
                                <>
                                    {stockWatchList.map(v => (
                                        <StockWatchListItem key={v.symbol} ticker={v.symbol} name={v.longName || v.shortName || 'N/A'} price={v.regularMarketPrice ?? NaN} change={v.regularMarketChange ?? NaN} changePercent={v.regularMarketChangePercent ?? NaN} isPositive={v.regularMarketChange > 0} currency={v.currency ?? ''} />
                                    ))}
                                </>
                            ) : (
                                /* 접혔을 때의 미니 아이콘 상태 (선택 사항) */
                                <div className="flex flex-col gap-6 items-center py-4 text-muted-foreground/20 italic">
                                    <Star className="size-5" />
                                    <div className="w-1 h-20 bg-black/5 dark:bg-white/5 rounded-full" />
                                </div>
                            )}
                        </SidebarMenu>
                    </SidebarGroup>
                </div>
            </SidebarContent>
        </aside>
    );
}