'use client'

import { useState, useCallback, useEffect, useMemo, memo } from "react";
import useStockSync from "@/hooks/useStockSync";
import StockSearchInput from "./components/StockSearch";
import StockPriceCard from "./components/StockPriceCard";
import StockChart from "./components/StockChart";
import StockStats from "./components/StockStats";
import { useStockStore } from "@/store/useStockStore";
import { useUiStore } from "@/store/uiStore";
import StockWatchListSidebar from "./components/StockWatchListSidebar";
import { TrendingUp, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormatStockWatchListItem } from "@/types/stock";
import { StockWatchListItemProps } from "./components/StockWatchListItem";

/**
 * [Senior Optimization] 
 * 주가 데이터가 자주 바뀌는 메인 콘텐츠 영역을 별도 컴포넌트로 분리합니다.
 * 스티키 액션 바를 이 내부로 이동하여 실시간 주가 데이터(stockData)에 접근할 수 있게 함으로써 
 * 관심종목 등록(Heart Button) 기능을 완벽히 지원합니다.
 */
interface StockDashboardContentProps {
    currentTicker: string;
    chartConfig: { range: string; interval: string };
    handleConfigChange: (range: string, interval: string) => void;
    isWatchList: boolean;
    toggleWatchList: (stock: StockWatchListItemProps) => void;
}

const StockDashboardContent = memo(({
    currentTicker,
    chartConfig,
    handleConfigChange,
    isWatchList,
    toggleWatchList
}: StockDashboardContentProps) => {
    const { stockData, isError, isLoading } = useStockSync(
        currentTicker,
        chartConfig.range,
        chartConfig.interval
    );

    const updateStockWatchList = useStockStore(s => s.updateStockWatchList);

    // 데이터 동기화 시 불필요한 호출 방지
    useEffect(() => {
        if (stockData && currentTicker) {
            updateStockWatchList(FormatStockWatchListItem(stockData));
        }
    }, [stockData, currentTicker, updateStockWatchList]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 animate-in fade-in duration-700">
                <div className="relative">
                    <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-blue-500 shadow-2xl shadow-blue-500/20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <TrendingUp className="size-6 text-blue-500/60 animate-pulse" />
                    </div>
                </div>
                <p className="mt-8 text-xs font-black text-muted-foreground/40 uppercase tracking-[0.4em] animate-pulse italic">Synchronizing Data Nodes</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-red-500/5 dark:bg-red-500/10 p-12 rounded-[4rem] border border-red-500/20 shadow-2xl shadow-red-500/5 animate-in fade-in zoom-in-95 duration-500 text-center max-w-4xl mx-auto">
                <TrendingUp className="size-16 text-red-500/60 rotate-180 mx-auto mb-8 animate-bounce" />
                <h3 className="font-black text-4xl tracking-tighter text-red-600 dark:text-red-400 mb-4 uppercase italic">Critical Failure: Invalid Ticker</h3>
                <p className="text-muted-foreground font-semibold max-w-lg mx-auto">티커 코드 정보가 존재하지 않습니다.</p>
            </div>
        );
    }

    if (!stockData) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {/* [Senior Refactor] 스티키 액션 바: stockData 접근을 위해 Dashboard 내부로 이동 */}
            <div className="sticky top-0 z-40 h-24 bg-background/95 backdrop-blur-xl flex items-center gap-4 border-b border-black/5 dark:border-white/10 transition-all duration-500 group/sticky shadow-sm -mx-10 px-10">
                <div className="flex-1 max-w-3xl">
                    <StockSearchInput />
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleWatchList(FormatStockWatchListItem(stockData))}
                        className={cn(
                            "size-12 rounded-2xl transition-all duration-300 border-2 overflow-hidden",
                            isWatchList ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-500 shadow-sm" : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-muted-foreground/40 hover:border-black/20"
                        )}
                    >
                        <Heart className={cn("size-5 transition-all duration-500", isWatchList ? "fill-current scale-110 text-red-500" : "fill-none")} />
                    </Button>
                </div>
            </div>

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
    );
});

StockDashboardContent.displayName = 'StockDashboardContent';

export default function StockPage() {
    const [chartConfig, setChartConfig] = useState({
        range: '1y',
        interval: '1d'
    });

    const currentTicker = useStockStore(s => s.currentTicker);
    const stockWatchList = useStockStore(s => s.stockWatchList);
    const toggleWatchList = useStockStore(s => s.toggleWatchList);
    const isWatchListOpen = useUiStore(s => s.isWatchListOpen);
    const toggleSidebar = useUiStore(s => s.toggleWatchList);

    const isWatchList = useMemo(() =>
        stockWatchList.some(v => v.ticker === currentTicker),
        [stockWatchList, currentTicker]);

    const handleConfigChange = useCallback((newRange: string, newInterval: string) => {
        setChartConfig({ range: newRange, interval: newInterval });
    }, []);

    return (
        <div className="flex flex-1 min-w-0 h-full overflow-hidden bg-background relative selection:bg-blue-500/20">
            <div className="flex-1 flex flex-col min-w-0 h-full border-r border-black/5 dark:border-white/5">
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth">

                    {/* [1] 헤더 섹션 (정적) */}
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

                    {/* [3] 메인 콘텐츠 영역 (동적 페칭 포함) */}
                    <div className="p-10 space-y-12 bg-muted/5 dark:bg-background/20 min-h-screen">
                        <StockDashboardContent
                            currentTicker={currentTicker}
                            chartConfig={chartConfig}
                            handleConfigChange={handleConfigChange}
                            isWatchList={isWatchList}
                            toggleWatchList={toggleWatchList}
                        />
                    </div>
                </div>
            </div>

            {/* 우측 사이드바 */}
            <StockWatchListSidebar isOpen={isWatchListOpen} onToggle={toggleSidebar} />
        </div>
    );
}