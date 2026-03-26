'use client';

import { SidebarHeader, SidebarGroup, SidebarMenu } from "@/components/ui/sidebar";
import { Menu, RefreshCw, Heart, TrendingUp, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import StockWatchListItem from "./StockWatchListItem";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebarSync } from "@/hooks/useStockSync";

import { useStockStore } from "@/store/useStockStore";
import * as _ from "radash";

interface StockWatchListSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function StockWatchListSidebar({ isOpen, onToggle }: StockWatchListSidebarProps) {
    const stockWatchList = useStockStore(s => s.stockWatchList);
    const stockPopularList = useStockStore(s => s.stockPopularList);
    const [filterMode, setFilterMode] = useState<'ALL' | 'KR' | 'US'>('ALL');
    const [activeTab, setActiveTab] = useState<'WATCH' | 'POPULAR'>('WATCH');

    // [Single Responsibility] 동기화 로직은 커스텀 훅으로 위임
    const { isSyncing } = useSidebarSync();

    const filteredList = useMemo(() => {
        const targetList = activeTab === 'WATCH' ? stockWatchList : stockPopularList;
        switch (filterMode) {
            case 'KR': return targetList.filter(v => v.currency === 'KRW');
            case 'US': return targetList.filter(v => v.currency === 'USD');
            default: return targetList;
        }
    }, [stockWatchList, stockPopularList, filterMode, activeTab]);


    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] z-90 md:hidden animate-in fade-in duration-300"
                    onClick={onToggle}
                />
            )}

            {/* [UX] 본문 레이아웃 점유용 Spacer (md 이상에서만 존재하여 차트가 사이드바에 가려지지 않도록 함) */}
            <div className={cn(
                "hidden md:block shrink-0 transition-all duration-300",
                isOpen ? "w-80" : "w-15"
            )} />

            {/* 실제 우측 사이드바 (메인 사이드바처럼 화면 전체 높이를 차지하도록 fixed top-0으로 덮음) */}
            <aside
                className={cn(
                    "fixed top-0 bottom-0 right-0 h-screen flex flex-col shrink-0 z-100 transition-all duration-300 ease-in-out border-l overflow-hidden",
                    "bg-sidebar backdrop-blur-xl border-sidebar-border shadow-2xl md:shadow-[0_0_15px_rgba(0,0,0,0.1)]",
                    isOpen ? "w-[85vw] sm:w-80" : "w-0 md:w-15",
                    !isOpen && "invisible md:visible"
                )}
            >
                <SidebarHeader className={cn(
                    "p-0 border-b border-black/5 dark:border-white/5 transition-all duration-300 shrink-0",
                    isOpen ? "h-24" : "h-20"
                )}>
                    {isOpen ? (
                        <div className="flex w-full h-full items-stretch animate-in fade-in duration-500">
                            {/* [1] 관심목록 버튼 */}
                            <button
                                onClick={() => setActiveTab('WATCH')}
                                className={cn(
                                    "flex-1 flex flex-col items-center justify-center gap-1 transition-all relative border-r border-black/5 dark:border-white/5",
                                    activeTab === 'WATCH' ? "bg-black/5 dark:bg-white/5" : "hover:bg-black/2 dark:hover:bg-white/2"
                                )}
                            >
                                <Heart className={cn(
                                    "size-4.5 transition-all duration-300",
                                    activeTab === 'WATCH' ? "text-blue-500 fill-blue-500/10 scale-110" : "text-muted-foreground/40"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-black tracking-tighter transition-all uppercase italic",
                                    activeTab === 'WATCH' ? "text-foreground" : "text-muted-foreground/40"
                                )}>관심목록</span>

                                {isSyncing && activeTab === 'WATCH' && (
                                    <RefreshCw className="absolute top-2 right-2 size-2.5 text-orange-500/60 animate-spin" />
                                )}
                                {activeTab === 'WATCH' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.5)]" />
                                )}
                            </button>

                            {/* [2] 인기목록 버튼 */}
                            <button
                                onClick={() => setActiveTab('POPULAR')}
                                className={cn(
                                    "flex-1 flex flex-col items-center justify-center gap-1 transition-all relative border-r border-black/5 dark:border-white/5",
                                    activeTab === 'POPULAR' ? "bg-black/5 dark:bg-white/5" : "hover:bg-black/2 dark:hover:bg-white/2"
                                )}
                            >
                                <TrendingUp className={cn(
                                    "size-4.5 transition-all duration-300",
                                    activeTab === 'POPULAR' ? "text-blue-500 scale-110" : "text-muted-foreground/40"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-black tracking-tighter transition-all uppercase italic",
                                    activeTab === 'POPULAR' ? "text-foreground" : "text-muted-foreground/40"
                                )}>인기목록</span>
                                {activeTab === 'POPULAR' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.5)]" />
                                )}
                            </button>

                            {/* [3] 탭 닫기 버튼 */}
                            <button
                                onClick={onToggle}
                                className="flex-1 flex flex-col items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-all group"
                            >
                                <ChevronRight className="size-5 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-300" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex w-full h-full flex-col items-center justify-center animate-in fade-in duration-300">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggle}
                                className="size-9 p-0 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all text-muted-foreground/60 hover:text-foreground"
                            >
                                <Menu className="size-4.5" />
                            </Button>
                        </div>
                    )}
                </SidebarHeader>

                {isOpen && (
                    <div className="flex-1 min-h-0 pt-6 pb-0 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col">
                        <Tabs
                            defaultValue="ALL"
                            value={filterMode}
                            onValueChange={(val) => setFilterMode(val as 'ALL' | 'KR' | 'US')}
                            className="flex-1 flex flex-col min-h-0"
                        >
                            <div className="px-8 mb-6">
                                <TabsList className="w-full flex h-10 p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                                    <TabsTrigger value="ALL" className="flex-1 rounded-xl font-black text-[10px] tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-black/60 data-[state=active]:shadow-lg active:scale-95">전체</TabsTrigger>
                                    <TabsTrigger value="KR" className="flex-1 rounded-xl font-black text-[10px] tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-black/60 data-[state=active]:shadow-lg active:scale-95">국내</TabsTrigger>
                                    <TabsTrigger value="US" className="flex-1 rounded-xl font-black text-[10px] tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-black/60 data-[state=active]:shadow-lg active:scale-95">해외</TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1 min-h-0">
                                <div className="px-8 pb-10">
                                    <SidebarGroup className="p-0">
                                        <SidebarMenu className="gap-4">
                                            {_.isEmpty(filteredList) ? (
                                                <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                                                    <div className="size-20 rounded-[2.5rem] bg-linear-to-br from-black/3 to-transparent dark:from-white/3 border-2 border-dashed border-black/5 dark:border-white/5 flex items-center justify-center mb-8 group">
                                                        {activeTab === 'WATCH' ? (
                                                            <Heart className="size-8 text-muted-foreground/10 group-hover:scale-110 group-hover:text-blue-500/20 transition-all duration-500" />
                                                        ) : (
                                                            <TrendingUp className="size-8 text-muted-foreground/10 group-hover:scale-110 group-hover:text-blue-500/20 transition-all duration-500" />
                                                        )}
                                                    </div>
                                                    <h4 className="text-[13px] font-black uppercase tracking-tighter text-muted-foreground/60 mb-1">
                                                        {activeTab === 'WATCH' ? '관심 목록이 비어있습니다' : '인기 종목이 없습니다'}
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest italic">
                                                        {activeTab === 'WATCH' ? '종목을 추가하여 실시간으로 확인하세요' : '잠시 후 다시 시도해 주세요'}
                                                    </p>
                                                </div>
                                            ) : (
                                                filteredList.map((stock) => (
                                                    <StockWatchListItem
                                                        key={stock.ticker}
                                                        {...stock}
                                                        isOpen={isOpen}
                                                    />
                                                ))
                                            )}
                                        </SidebarMenu>
                                    </SidebarGroup>
                                </div>
                            </ScrollArea>
                        </Tabs>
                    </div>
                )}
            </aside>
        </>
    );
}
