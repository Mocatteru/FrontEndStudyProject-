'use client'

import { useState, useCallback, useEffect, memo } from "react";
import dynamic from "next/dynamic";
import StockSearchInput from "./components/StockSearch";
import StockPriceCard from "./components/StockPriceCard";
// [성능] 차트 컴포넌트 lazy load — lightweight-charts를 초기 번들에서 분리하여 첫 화면 로드 단축
const StockChart = dynamic(
    () => import("./components/StockChart"),
    {
        ssr: false, // 서버에서 DOM/window API를 사용하므로 CSR 전용
        loading: () => (
            <div className="h-[530px] rounded-[3.5rem] bg-card/40 animate-pulse border border-black/5 dark:border-white/5" />
        ),
    }
);
import StockStats from "./components/StockStats";
import { useStockStore } from "@/store/useStockStore";
import { useUiStore } from "@/store/uiStore";
import StockWatchListSidebar from "./components/StockWatchListSidebar";
import { TrendingUp, Heart, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormatStockWatchListItem, Stock } from "@/types/stock";
import { toast } from "sonner";
import { useStockSync } from "@/hooks/useStockSync";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * [Senior Optimization] 
 * 주가 데이터가 자주 바뀌는 메인 콘텐츠 영역을 별도 컴포넌트로 분리합니다.
 * 실시간 주가 데이터(stockData)에 대한 로직만 담당하도록 범위를 좁혔습니다.
 */
interface StockDashboardContentProps {
    currentTicker: string;
    chartConfig: { range: string; interval: string };
    handleConfigChange: (range: string, interval: string) => void;
    stockData?: Stock | null; // [Optimization] 부모에서 내려주어 useStockSync 중복 호출 제거
    isLoading: boolean;
    isError: boolean;
}

const StockDashboardContent = memo((
    { currentTicker, chartConfig, handleConfigChange, stockData, isLoading, isError }: StockDashboardContentProps
) => {
    const updateStockWatchList = useStockStore(s => s.updateStockWatchList);

    // 종목 조회 성공 시 관심목록 데이터 실시간 완치 (데이터 업데이트)
    useEffect(() => {
        if (stockData && currentTicker) {
            updateStockWatchList(FormatStockWatchListItem(stockData));
        }
    }, [stockData, currentTicker, updateStockWatchList]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <div className="relative">
                    <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-blue-500 shadow-2xl shadow-blue-500/20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <TrendingUp className="size-6 text-blue-500/60 animate-pulse" />
                    </div>
                </div>
                <p className="mt-8 text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.4em] animate-pulse">데이터 동기화 중...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-red-500/5 dark:bg-red-500/10 p-12 rounded-[4rem] border border-red-500/20 shadow-2xl shadow-red-500/5 text-center max-w-4xl mx-auto">
                <TrendingUp className="size-16 text-red-500/60 rotate-180 mx-auto mb-8 animate-bounce" />
                <h3 className="font-black text-4xl tracking-tighter text-red-600 dark:text-red-400 mb-4 uppercase">종목 정보 없음</h3>
                <p className="text-muted-foreground font-semibold max-w-lg mx-auto">해당 티커 코드의 정보를 불러올 수 없습니다. 코드를 다시 확인해주세요.</p>
            </div>
        );
    }

    // [Bug Fix] stockData가 없을 때도 검색창은 유지되어야 하므로, 
    // 하단 상세 UI만 조건부로 렌더링하거나 부모에서 처리합니다.
    if (!stockData) {
        return (
            <div className="flex flex-col items-center justify-center py-40 opacity-40">
                <TrendingUp className="size-12 mb-4 text-muted-foreground/20" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/40">검색어를 입력하여 데이터를 조회하세요</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <StockPriceCard stockData={stockData} />

            <div className="bg-card border-2 border-black/5 dark:border-white/5 rounded-[3.5rem] overflow-hidden shadow-xl shadow-black/5 dark:shadow-white/5 transition-all hover:shadow-blue-500/10 hover:border-blue-500/20 duration-500">
                <StockChart
                    stockData={stockData}
                    range={chartConfig.range}
                    interval={chartConfig.interval}
                    onConfigChange={handleConfigChange}
                />
            </div>

            <div className="space-y-8">
                <div className="flex items-center gap-4 group cursor-pointer w-fit">
                    <div className="w-2 h-10 bg-blue-500 rounded-full group-hover:h-14 transition-all duration-500 shadow-xl shadow-blue-500/50" />
                    <h2 className="text-4xl font-black tracking-tighter uppercase text-foreground">세부사항</h2>
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
    // [Optimization] stockWatchList 전체 구독 대신 선택적 조회
    const isWatchListItem = useStockStore(s => s.stockWatchList.some(v => v.ticker === s.currentTicker));
    const isWatchListOpen = useUiStore(s => s.isWatchListOpen);
    const toggleWatchListOpen = useUiStore(s => s.toggleWatchList);
    const { deleteFromWatchList, insertWatchList, isLoading } = useStockStore();
    const user = useAuthStore(s => s.user);


    const handleConfigChange = useCallback((newRange: string, newInterval: string) => {
        setChartConfig({ range: newRange, interval: newInterval });
    }, []);

    // [단일 태스크] useStockSync를 StockPage에서 1회만 호출하여 stockData를 하위 컴포넌트에 prop으로 전달
    const { stockData, isError } = useStockSync(currentTicker, chartConfig.range, chartConfig.interval);

    // [성능] 인라인 핸들러 제거 - 매 렌더마다 새 함수 생성 방지
    const handleToggleWatchList = useCallback(async () => {
        if (!stockData) return;

        /**
         * [Learning Point] 
         * 기존 toggleWatchList(로컬) 대신 insert/delete(서버)를 사용하여
         * SSOT(Single Source of Truth) 원칙을 준수합니다.
         */
        if (!user?.id) {
            toast.error("로그인이 필요한 기능입니다.");
            return;
        }

        if (isWatchListItem) {
            await deleteFromWatchList(user.id, stockData.symbol);
            toast.info("관심목록에서 제거되었습니다.");
        } else {
            await insertWatchList(user.id, FormatStockWatchListItem(stockData));
            toast.success("관심목록에 추가되었습니다!");
        }
    }, [stockData, user, isWatchListItem, deleteFromWatchList, insertWatchList]);

    return (
        <div className="flex flex-1 min-w-0 bg-slate-50/30 dark:bg-background relative selection:bg-blue-500/20">
            <div className="flex-1 flex flex-col min-w-0 border-r border-black/5 dark:border-white/5">
                <div className="flex-1 scroll-smooth">

                    {/* [1] 헤더 섹션 (정적) - 마켓 대시보드 규격 통일 */}
                    <div className="flex items-center gap-3 px-6 h-11 border-b border-black/5 dark:border-white/5 shrink-0 bg-background/95 z-50">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/10">
                            <TrendingUp className="size-4 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-base font-black uppercase tracking-[0.2em] text-foreground/90">주식 검색</h1>
                            <p className="text-[10px] font-black tracking-[0.3em] text-muted-foreground/60 uppercase">Stock Insights</p>
                        </div>
                    </div>

                    {/* [2] 스티키 액션 바 - 주식검색 섹션 무조건 상단 유지 */}
                    <div className="sticky top-0 z-40 h-16 sm:h-20 bg-slate-50/80 dark:bg-background/95 backdrop-blur-xl flex items-center justify-between gap-2 sm:gap-4 border-b border-black/5 dark:border-white/10 transition-all duration-500 group/sticky shadow-sm px-4 sm:px-6">
                        <div className="flex-1 max-w-3xl">
                            <StockSearchInput />
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* stockData가 있을 때만 하트 버튼 노출 */}
                            {stockData && (
                                <Button
                                    disabled={isLoading}
                                    variant="outline"
                                    size="icon"
                                    onClick={handleToggleWatchList}
                                    className={cn(
                                        "size-12 rounded-2xl transition-all duration-300 border-2 overflow-hidden",
                                        isWatchListItem
                                            ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-500 shadow-sm"
                                            : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-muted-foreground/40 hover:border-black/20"
                                    )}
                                >
                                    <Heart className={cn("size-5 transition-all duration-500", isWatchListItem ? "fill-current scale-110 text-red-500" : "fill-none")} />
                                </Button>
                            )}
                            {/* [Senior UX] 관심목록 사이드바 토글 버튼 (모바일/태블릿용) */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={toggleWatchListOpen}
                                className={cn(
                                    "md:hidden size-12 rounded-2xl transition-all duration-300 border-2",
                                    isWatchListOpen
                                        ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                                        : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-muted-foreground/40 hover:border-black/20"
                                )}
                            >
                                <List className={cn("size-5 transition-all duration-500", isWatchListOpen ? "rotate-90" : "rotate-0")} />
                            </Button>
                        </div>
                    </div>

                    {/* [3] 메인 콘텐츠 영역 (동적 페칭 포함) */}
                    <div className="px-4 sm:px-10 pb-24 space-y-8 sm:space-y-12 bg-muted/5 dark:bg-background/20 min-h-screen pt-4 sm:pt-6">
                        <StockDashboardContent
                            currentTicker={currentTicker}
                            chartConfig={chartConfig}
                            handleConfigChange={handleConfigChange}
                            stockData={stockData}
                            isLoading={isLoading}
                            isError={isError}
                        />
                    </div>
                </div>
            </div>

            {/* 우측 사이드바 */}
            <StockWatchListSidebar isOpen={isWatchListOpen} onToggle={toggleWatchListOpen} />
        </div>
    );
}