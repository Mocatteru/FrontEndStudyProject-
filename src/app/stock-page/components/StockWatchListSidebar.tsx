'use client';

import { SidebarContent, SidebarHeader, SidebarGroup, SidebarMenu } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import StockWatchListItem, { StockWatchListItemProps } from "./StockWatchListItem";
import { useStockStore } from "@/store/useStockStore";
import * as _ from "radash";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    // [Senior Optimization] Selector를 사용하여 필요한 상태만 구독
    const stockWatchList = useStockStore(s => s.stockWatchList);
    const [filterMode, setFilterMode] = useState<'ALL' | 'KR' | 'US'>('ALL');

    const filteredList = useMemo(() => {
        switch (filterMode) {
            case 'KR': return stockWatchList.filter(v => v.currency === 'KRW');
            case 'US': return stockWatchList.filter(v => v.currency === 'USD');
            default: return stockWatchList;
        }
    }, [stockWatchList, filterMode]);


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
                    "p-6 border-b border-black/5 dark:border-white/10 flex items-center transition-all duration-500 shrink-0",
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

                {/* /* ... 사이드바 헤더 아래에 배치 ... */}
                {isOpen && (
                    <div className="flex-1 min-h-0 px-6 py-4 animate-in fade-in duration-500">
                        {/* 룰 15 반영: 기본 태그 대신 Tabs 라이브러리 사용 */}
                        <Tabs
                            defaultValue="ALL"
                            value={filterMode}
                            onValueChange={(val) => setFilterMode(val as 'ALL' | 'KR' | 'US')}
                            className="flex flex-col h-full"
                        >
                            <TabsList className="w-full h-11 bg-black/5 dark:bg-white/5 rounded-2xl p-1 shrink-0">
                                <TabsTrigger value="ALL" className="flex-1 rounded-xl font-black text-xs transition-all">전체</TabsTrigger>
                                <TabsTrigger value="KR" className="flex-1 rounded-xl font-black text-xs transition-all">국내</TabsTrigger>
                                <TabsTrigger value="US" className="flex-1 rounded-xl font-black text-xs transition-all">해외</TabsTrigger>
                            </TabsList>

                            {/* [Senior Optimization] TabsContent 3개를 쓰는 대신, 단일 영역에서 데이터만 필터링하여 렌더링 (코드 중복 제거) */}
                            <div className="flex-1 min-h-0 mt-6 overflow-y-auto custom-scrollbar pr-1">
                                <SidebarGroup className="p-0">
                                    <SidebarMenu className="gap-4">
                                        {_.isEmpty(filteredList) ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 italic">
                                                    {filterMode === 'ALL' ? '전체' : filterMode === 'KR' ? '국내' : '해외'}주식 관심종목이 없습니다.
                                                </span>
                                            </div>
                                        ) : (
                                            filteredList.map((v) => (
                                                <StockWatchListItem
                                                    key={v.ticker}
                                                    {...v}
                                                    isOpen={isOpen}
                                                />
                                            ))
                                        )}
                                    </SidebarMenu>
                                </SidebarGroup>
                            </div>
                        </Tabs>
                    </div>
                )}
            </aside>
        </>
    );
}