'use client';

import { SidebarHeader, SidebarGroup, SidebarMenu } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import StockWatchListItem from "./StockWatchListItem";
import { useStockStore } from "@/store/useStockStore";
import * as _ from "radash";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@base-ui/react";

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
                    "h-full transition-all duration-300 ease-in-out flex flex-col overflow-hidden shrink-0 z-50",
                    "bg-white/80 dark:bg-black/90 backdrop-blur-2xl border-black/5 dark:border-white/5",

                    // [Desktop Style]
                    "md:relative md:border-l",
                    isOpen ? "md:w-80" : "md:w-15",

                    // [Mobile Style]
                    "fixed inset-y-0 right-0 shadow-2xl md:shadow-none border-l md:border-none",
                    isOpen ? "w-[85vw] sm:w-80" : "w-0 border-none",

                    !isOpen && "invisible md:visible"
                )}
            >
                {/* [1] 사이드바 헤더: 타이틀 및 토글 버튼 - [Tactical Alignment Update] */}
                <SidebarHeader className={cn(
                    "px-8 border-b border-black/5 dark:border-white/5 flex items-center transition-all duration-300 shrink-0",
                    isOpen ? "flex-row justify-between h-20" : "flex-col justify-center h-20"
                )}>
                    {isOpen ? (
                        <>
                            <div className="flex flex-col gap-0.5 items-start animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="flex items-center gap-2">
                                    <div className="size-1 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-[9px] font-black tracking-[0.2em] text-muted-foreground/30 uppercase italic">Watchlist</span>
                                </div>
                                <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground/80 drop-shadow-sm">
                                    관심종목
                                </h2>
                            </div>
                            <Button
                                onClick={onToggle}
                                className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all text-muted-foreground hover:text-foreground active:scale-95 border border-transparent shadow-sm"
                            >
                                <Menu className="size-4.5" />
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={onToggle}
                            className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all text-muted-foreground hover:text-foreground active:scale-95 border border-transparent shadow-sm"
                        >
                            <Menu className="size-4.5" />
                        </Button>
                    )}
                </SidebarHeader>

                {/* [2] 탭 및 목록 영역 - [UI consistency] */}
                {isOpen && (
                    <div className="flex-1 min-h-0 px-8 pt-6 pb-0 animate-in fade-in duration-700">
                        <Tabs
                            defaultValue="ALL"
                            value={filterMode}
                            onValueChange={(val) => setFilterMode(val as 'ALL' | 'KR' | 'US')}
                            className="flex flex-col h-full"
                        >
                            <TabsList className="w-full h-12 bg-black/5 dark:bg-white/5 rounded-[1.25rem] p-1.5 shrink-0 border border-black/5 dark:border-white/5">
                                <TabsTrigger value="ALL" className="flex-1 rounded-xl font-black text-[10px] tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-black/40 data-[state=active]:shadow-lg">전체</TabsTrigger>
                                <TabsTrigger value="KR" className="flex-1 rounded-xl font-black text-[10px] tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-black/40 data-[state=active]:shadow-lg">국내</TabsTrigger>
                                <TabsTrigger value="US" className="flex-1 rounded-xl font-black text-[10px] tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-black/40 data-[state=active]:shadow-lg">해외</TabsTrigger>
                            </TabsList>

                            <div className="flex-1 min-h-0 mt-8 overflow-y-auto custom-scrollbar no-scrollbar pr-1">
                                <SidebarGroup className="p-0">
                                    <SidebarMenu className="gap-5 pb-10">
                                        {_.isEmpty(filteredList) ? (
                                            <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                                                <div className="size-16 rounded-[2.5rem] bg-black/5 dark:bg-white/5 flex items-center justify-center mb-6">
                                                    <Menu className="size-6 text-muted-foreground/20" />
                                                </div>
                                                <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/30 leading-relaxed max-w-[180px]">
                                                    {filterMode === 'ALL' ? '등록된 관심종목이 없습니다' : filterMode === 'KR' ? '국내 관심종목이 없습니다' : '해외 관심종목이 없습니다'}
                                                </span>
                                            </div>
                                        ) : (
                                            filteredList.map((v, index) => (
                                                <StockWatchListItem
                                                    key={`${v.ticker}-${index}`}
                                                    {...v}
                                                    isOpen={true} // 사이드바가 열려있을 때의 ListItem 디자인 유지
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