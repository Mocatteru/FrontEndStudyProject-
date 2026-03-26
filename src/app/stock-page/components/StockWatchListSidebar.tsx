'use client';

import { SidebarHeader, SidebarGroup, SidebarMenu } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import StockWatchListItem from "./StockWatchListItem";
import { useStockStore } from "@/store/useStockStore";
import * as _ from "radash";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StockWatchListSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function StockWatchListSidebar({ isOpen, onToggle }: StockWatchListSidebarProps) {
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
                    "fixed top-0 bottom-0 right-0 h-screen flex flex-col shrink-0 z-100 transition-all duration-300 ease-in-out border-l",
                    "bg-sidebar backdrop-blur-xl border-sidebar-border shadow-2xl md:shadow-[0_0_15px_rgba(0,0,0,0.1)]",
                    isOpen ? "w-[85vw] sm:w-80" : "w-0 md:w-15",
                    !isOpen && "invisible md:visible"
                )}
            >
                <SidebarHeader className={cn(
                    "px-8 border-b border-black/5 dark:border-white/5 flex items-center transition-all duration-300 shrink-0",
                    isOpen ? "flex-row justify-between h-20" : "flex-col justify-center h-20"
                )}>
                    {isOpen ? (
                        <>
                            <div className="flex flex-col gap-0.5 items-start animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="flex items-center gap-2">
                                    <div className="size-1 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-[9px] font-black tracking-widest text-muted-foreground/60 uppercase italic">Watchlist</span>
                                </div>
                                <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground drop-shadow-sm text-center">
                                    관심종목
                                </h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggle}
                                className="size-9 p-0 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all text-muted-foreground hover:text-foreground active:scale-95 border border-transparent shadow-sm"
                            >
                                <Menu className="size-4.5" />
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggle}
                            className="size-9 p-0 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all text-muted-foreground/60 hover:text-foreground active:scale-95 border border-transparent shadow-sm"
                        >
                            <Menu className="size-4.5" />
                        </Button>
                    )}
                </SidebarHeader>

                {isOpen && (
                    <div className="flex-1 min-h-0 pt-6 pb-0 animate-in fade-in duration-300 flex flex-col">
                        <Tabs
                            defaultValue="ALL"
                            value={filterMode}
                            onValueChange={(val) => setFilterMode(val as 'ALL' | 'KR' | 'US')}
                            className="flex-1 flex flex-col min-h-0"
                        >
                            <div className="px-8 shrink-0">
                                <TabsList className="w-full h-12 bg-black/5 dark:bg-white/5 rounded-[1.25rem] p-1.5 shrink-0 border border-black/5 dark:border-white/10">
                                    <TabsTrigger value="ALL" className="flex-1 rounded-xl font-black text-[10px] tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-black/60 data-[state=active]:shadow-lg active:scale-95">전체</TabsTrigger>
                                    <TabsTrigger value="KR" className="flex-1 rounded-xl font-black text-[10px] tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-black/60 data-[state=active]:shadow-lg active:scale-95">국내</TabsTrigger>
                                    <TabsTrigger value="US" className="flex-1 rounded-xl font-black text-[10px] tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-black/60 data-[state=active]:shadow-lg active:scale-95">해외</TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1 min-h-0 mt-8">
                                <div className="px-8 pb-10">
                                    <SidebarGroup className="p-0">
                                        <SidebarMenu className="gap-4">
                                            {_.isEmpty(filteredList) ? (
                                                <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                    <div className="size-20 rounded-[2.5rem] bg-black/5 dark:bg-white/5 flex items-center justify-center mb-6 border border-black/5 dark:border-white/5">
                                                        <Menu className="size-8 text-muted-foreground/40" />
                                                    </div>
                                                    <span className="text-[11px] font-black tracking-widest text-muted-foreground/60 leading-relaxed max-w-[180px] uppercase italic">
                                                        {filterMode === 'ALL' ? '등록된 관심종목이 없습니다' : filterMode === 'KR' ? '국내 관심종목이 없습니다' : '해외 관심종목이 없습니다'}
                                                    </span>
                                                </div>
                                            ) : (
                                                filteredList.map((v, index) => (
                                                    <StockWatchListItem
                                                        key={`${v.ticker}-${index}`}
                                                        {...v}
                                                        isOpen={true}
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