'use client'

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import MarketListPanel from "./components/MarketListPanel";
import { useStockSync } from "@/hooks/useStockSync";
import { PERIOD_OPTIONS } from "@/types/stock";
import { cn, formatMarketPrice } from "@/lib/utils";
import { Globe, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

// [성능] 마켓 전용 경량 차트 lazy load (기술적 지표 없음)
const MarketMainChart = dynamic(
    () => import("./components/MarketMainChart"),
    {
        ssr: false,
        loading: () => (
            <div className="h-[400px] rounded-[1.5rem] bg-card/40 border border-black/5 dark:border-white/5 animate-pulse" />
        ),
    }
);

const DEFAULT_SYMBOL = "^IXIC";
const DEFAULT_NAME = "나스닥 종합";

// ── 종목 헤더 Props 인터페이스 ────────────────────
interface MainChartHeaderProps {
    symbol: string;
    name: string;
    range: string;
    interval: string;
    onConfigChange: (range: string, interval: string) => void;
}

// ── 종목 헤더 (현재가 + 기간 컨트롤) ───────────────
function MainChartHeader({ symbol, name, range, interval, onConfigChange }: MainChartHeaderProps) {
    const [isMinuteOpen, setIsMinuteOpen] = useState(false);
    const { stockData, isLoading } = useStockSync(symbol, range, interval);
    const change = stockData?.regularMarketChange ?? 0;
    const changePercent = stockData?.regularMarketChangePercent ?? 0;
    const isPositive = change > 0;
    const isNegative = change < 0;
    const textColor = isPositive ? "text-red-500" : isNegative ? "text-blue-500" : "text-muted-foreground";
    const minuteOptions = PERIOD_OPTIONS.MINUTE;
    const majorOptions = PERIOD_OPTIONS.MAJOR;

    return (
        <div className="flex flex-col gap-2 px-6 pt-3 pb-2 shrink-0">
            {/* 종목 정보 */}
            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">{symbol}</span>
                <h2 className="text-xl font-black tracking-tight text-foreground">{name}</h2>

                {isLoading ? (
                    <div className="flex items-center gap-3 mt-1">
                        <Skeleton className="h-7 w-32 rounded-lg bg-black/5 dark:bg-white/5" />
                        <Skeleton className="h-5 w-24 rounded-lg bg-black/5 dark:bg-white/5" />
                    </div>
                ) : (
                    <div className="flex items-end gap-2.5 mt-1">
                        <span className="text-2xl font-black tracking-tighter text-foreground/90 tabular-nums">
                            {formatMarketPrice(stockData?.regularMarketPrice, stockData?.currency)}
                        </span>
                        <div className={cn("flex items-center gap-1 text-sm font-bold pb-0.5", textColor)}>
                            {isPositive ? <TrendingUp className="size-3.5" /> : isNegative ? <TrendingDown className="size-3.5" /> : <Minus className="size-3.5" />}
                            <span className="tabular-nums">
                                {change >= 0 ? "+" : ""}{change.toFixed(2)} ({changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                )}

                {/* 보조 지표 */}
                {!isLoading && stockData && (
                    <div className="flex items-center gap-4 mt-1.5 text-[11px] font-semibold text-muted-foreground/40 flex-wrap">
                        {stockData.regularMarketOpen != null && (
                            <span>시가 <span className="text-foreground/60 font-bold">{formatMarketPrice(stockData.regularMarketOpen, stockData.currency)}</span></span>
                        )}
                        {stockData.regularMarketDayHigh != null && (
                            <span>최고 <span className="text-red-500/70 font-bold">{formatMarketPrice(stockData.regularMarketDayHigh, stockData.currency)}</span></span>
                        )}
                        {stockData.regularMarketDayLow != null && (
                            <span>최저 <span className="text-blue-500/70 font-bold">{formatMarketPrice(stockData.regularMarketDayLow, stockData.currency)}</span></span>
                        )}
                        {stockData.fiftyTwoWeekHigh != null && (
                            <span className="hidden md:inline">52주 최고 <span className="text-foreground/60 font-bold">{formatMarketPrice(stockData.fiftyTwoWeekHigh, stockData.currency)}</span></span>
                        )}
                        {stockData.fiftyTwoWeekLow != null && (
                            <span className="hidden md:inline">52주 최저 <span className="text-foreground/60 font-bold">{formatMarketPrice(stockData.fiftyTwoWeekLow, stockData.currency)}</span></span>
                        )}
                    </div>
                )}
            </div>

            {/* 기간 컨트롤 */}
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/5 w-fit">
                <Popover open={isMinuteOpen} onOpenChange={setIsMinuteOpen}>
                    <PopoverTrigger className={cn(
                        "inline-flex items-center justify-center rounded-lg text-[10px] font-black uppercase tracking-widest transition-all outline-none select-none h-7 px-3 gap-1",
                        minuteOptions.some(o => o.interval === interval)
                            ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                            : "hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground/40 hover:text-foreground"
                    )}>
                        {minuteOptions.find(o => o.interval === interval)?.label || '분봉'}
                        <ChevronDown className="size-3" />
                    </PopoverTrigger>
                    <PopoverContent className="w-28 p-1.5 bg-card/95 backdrop-blur-2xl border-black/10 dark:border-white/10 rounded-xl shadow-2xl" align="start">
                        <div className="flex flex-col gap-1">
                            {minuteOptions.map(opt => (
                                <Button key={opt.interval} variant="ghost" size="sm"
                                    onClick={() => {
                                        onConfigChange(opt.range, opt.interval);
                                        setIsMinuteOpen(false);
                                    }}
                                    className={cn(
                                        "w-full justify-start h-8 rounded-lg text-[10px] font-black uppercase",
                                        interval === opt.interval
                                            ? "bg-blue-500 text-white hover:bg-blue-600"
                                            : "hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground/60"
                                    )}>
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {majorOptions.map(opt => (
                    <Button key={opt.label} variant="ghost" size="sm"
                        onClick={() => onConfigChange(opt.range, opt.interval)}
                        className={cn(
                            "h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest",
                            range === opt.range && interval === opt.interval
                                ? "bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/20"
                                : "hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground/40 hover:text-foreground"
                        )}>
                        {opt.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}

// ── 메인 대시보드 ──────────────────────────────────
export default function MarketDashboard() {
    const [selected, setSelected] = useState({ symbol: DEFAULT_SYMBOL, name: DEFAULT_NAME });
    const [chartConfig, setChartConfig] = useState({ range: "1y", interval: "1d" });

    const handleSelect = useCallback((symbol: string, name: string) => {
        setSelected({ symbol, name });
        setChartConfig({ range: "1y", interval: "1d" });
    }, []);

    const handleConfigChange = useCallback((range: string, interval: string) => {
        setChartConfig({ range, interval });
    }, []);

    const { stockData } = useStockSync(selected.symbol, chartConfig.range, chartConfig.interval);

    return (
        <div className="flex flex-col lg:flex-row h-full bg-background overflow-y-auto lg:overflow-hidden custom-scrollbar">

            {/* ── 좌측: 메인 차트 영역 ──────────────────── */}
            <div className="flex-none lg:flex-1 flex flex-col min-w-0">

                {/* 페이지 타이틀 */}
                <div className="flex items-center gap-2 lg:gap-3 px-4 lg:px-6 h-11 border-b border-black/5 dark:border-white/5 shrink-0">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/10">
                        <Globe className="size-4 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">글로벌 마켓</h1>
                        <p className="text-[9px] font-black tracking-[0.3em] text-muted-foreground/40 uppercase">Market Intelligence</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg">
                        <Info className="size-3 text-muted-foreground/40 shrink-0" />
                        <span className="text-[10px] font-semibold text-muted-foreground/40">15~20분 지연 데이터</span>
                    </div>
                </div>

                {/* 종목 헤더 */}
                <MainChartHeader
                    symbol={selected.symbol}
                    name={selected.name}
                    range={chartConfig.range}
                    interval={chartConfig.interval}
                    onConfigChange={handleConfigChange}
                />

                {/* 메인 차트 */}
                <div className="flex-none h-[400px] lg:h-auto lg:flex-1 overflow-hidden px-3 pb-3 min-h-0">
                    {stockData ? (
                        <MarketMainChart stockData={stockData} symbol={selected.symbol} />
                    ) : (
                        <div className="h-full w-full rounded-[1.5rem] bg-card/40 border border-black/5 dark:border-white/5 animate-pulse flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 opacity-30">
                                <TrendingUp className="size-8" />
                                <span className="text-[11px] font-black uppercase tracking-widest">데이터 로딩 중...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── 우측: 탭 리스트 패널 ─────────────────── */}
            <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-black/5 dark:border-white/5 bg-background/50 lg:overflow-hidden p-0 pb-10 lg:pb-0">
                <div className="h-[500px] lg:h-full w-full">
                    <MarketListPanel
                        selectedSymbol={selected.symbol}
                        onSelect={handleSelect}
                    />
                </div>
            </div>
        </div>
    );
}
