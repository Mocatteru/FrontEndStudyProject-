'use client'

import { useState, useCallback, useEffect } from "react";
import useStockSync from "@/hooks/useStockSync";
import StockSearch from "./components/StockSearch";
import StockPriceCard from "./components/StockPriceCard";
import StockChart from "./components/StockChart";
import StockStats from "./components/StockStats";
import { useStockStore } from "@/store/useStockStore";
import StockWatchListSidebar from "./components/StockWatchListSidebar";
import { TrendingUp, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * [StockPage - 메인 페이지 컴포넌트]
 */
export default function StockPage() {
    const [chartConfig, setChartConfig] = useState({
        range: '6mo',
        interval: '1d'
    });
    const { currentTicker, stockWatchList, toggleWatchList } = useStockStore();
    const { stockData, isError, isLoading } = useStockSync(
        currentTicker,
        chartConfig.range,
        chartConfig.interval
    );

    const [isWatchListOpen, setIsWatchListOpen] = useState(true);

    const isWatchList = stockWatchList.map(v => v.symbol).includes(currentTicker);

    const handleConfigChange = useCallback((newRange: string, newInterval: string) => {
        setChartConfig({ range: newRange, interval: newInterval });
    }, []);

    return (
        <div className="flex flex-1 min-w-0 h-full overflow-hidden bg-background relative selection:bg-blue-500/20">
            {/* 메인 섹션 */}
            <div className="flex-1 flex flex-col min-w-0 h-full border-r border-black/5 dark:border-white/5">
                {/* 메인 스크롤 가능 구역 */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth">

                    {/* [1] 헤더 타이틀 섹션 (스크롤하면 위로 사라짐) */}
                    <div className="px-10 pt-12 pb-6 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-blue-500/10 rounded-3xl shadow-sm border border-blue-500/10 group hover:rotate-6 transition-all duration-300">
                                <TrendingUp className="size-8 text-blue-500" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter text-foreground leading-tight">Stock Dashboard</h1>
                                <p className="text-[11px] uppercase font-bold tracking-[0.3em] text-muted-foreground/40">Market Analytics Node</p>
                            </div>
                        </div>
                    </div>

                    {/* [2] 스티키 액션 바: 검색창 + 추가 버튼 (상단 고정) */}
                    <div className="sticky top-0 z-40 justify-between bg-background/95 backdrop-blur-xl px-10 py-5 flex items-center gap-4 border-b border-black/5 dark:border-white/10 transition-all duration-500 group/sticky shadow-sm">
                        <div className="flex-1 max-w-3xl">
                            <StockSearch />
                        </div>

                        <div className="flex  items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => stockData && toggleWatchList(stockData)} // 클릭 시 토글 로직 실행
                                className={cn(
                                    "size-12 rounded-2xl transition-all duration-300 border-2 overflow-hidden",
                                    isWatchList
                                        ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-500 shadow-sm" // 등록 시: 연한 레드 배경 + 밝은 레드 테두리
                                        : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-muted-foreground/40 hover:border-black/20" // 미등록 시: 회색 배경 + 회색 테두리
                                )}
                            >
                                <Heart
                                    className={cn(
                                        "size-5 transition-all duration-500 ease-out",
                                        isWatchList
                                            ? "fill-current scale-110 text-red-500" // 등록 시: 하트 채움 + 확대
                                            : "fill-none scale-100" // 미등록 시: 하트 비움
                                    )}
                                />
                            </Button>
                            {/* <Button
                                className={cn(
                                    "group flex items-center gap-2.5 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border shadow-lg shrink-0",
                                    "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 hover:shadow-blue-600/20 active:scale-95 duration-300"
                                )}
                            >
                                <Star className={"size-4 fill-current group-hover:scale-125 transition-all duration-300"} />
                                <span className="text-[14px]">관심목록 추가</span>
                            </Button> */}
                        </div>
                    </div>

                    {/* [3] 메인 콘텐츠 콘텐츠 영역 */}
                    <div className="p-10 space-y-12 bg-muted/5 dark:bg-background/20 min-h-screen">
                        {/* 로딩 상태 UI */}
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-40 animate-in fade-in duration-700">
                                <div className="relative">
                                    <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-blue-500 shadow-2xl shadow-blue-500/20"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <TrendingUp className="size-6 text-blue-500/60 animate-pulse" />
                                    </div>
                                </div>
                                <p className="mt-8 text-xs font-black text-muted-foreground/40 uppercase tracking-[0.4em] animate-pulse italic">Synchronizing Data Nodes</p>
                            </div>
                        )}

                        {/* 에러 상태 UI */}
                        {isError && (
                            <div className="bg-red-500/5 dark:bg-red-500/10 p-12 rounded-[4rem] border border-red-500/20 shadow-2xl shadow-red-500/5 animate-in fade-in zoom-in-95 duration-500 text-center max-w-4xl mx-auto">
                                <TrendingUp className="size-16 text-red-500/60 rotate-180 mx-auto mb-8 animate-bounce" />
                                <h3 className="font-black text-4xl tracking-tighter text-red-600 dark:text-red-400 mb-4 uppercase italic">Critical Failure: Invalid Ticker</h3>
                                <p className="text-muted-foreground font-semibold max-w-lg mx-auto">티커 코드 정보가 우리 노드시스템에 존재하지 않습니다. 정확한 기호를 입력하셨는지 시스템 점검을 부탁드립니다.</p>
                            </div>
                        )}

                        {/* 결과 출력 섹션 */}
                        {stockData && !isLoading && (
                            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                                <StockPriceCard stockData={stockData} />

                                <div className="bg-card border-2 border-black/5 dark:border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-black/5 dark:shadow-white/5 transition-all hover:shadow-blue-500/10 hover:border-blue-500/20 duration-500">
                                    <StockChart
                                        stockData={stockData}
                                        range={chartConfig.range}
                                        interval={chartConfig.interval}
                                        onConfigChange={handleConfigChange}
                                    />
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 group cursor-pointer w-fit">
                                        <div className="w-2 h-8 bg-blue-500 rounded-full group-hover:h-12 transition-all duration-500 shadow-xl shadow-blue-500/50" />
                                        <h2 className="text-3xl font-black tracking-tighter italic uppercase text-foreground/90">Tactical Market Data</h2>
                                    </div>
                                    <StockStats stockData={stockData} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* [4] 우측 보조 사이드바 */}
            <StockWatchListSidebar
                isOpen={isWatchListOpen}
                onToggle={() => setIsWatchListOpen(!isWatchListOpen)}
            />
        </div>
    );
}