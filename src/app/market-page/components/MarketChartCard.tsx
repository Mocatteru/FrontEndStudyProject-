'use client'

import { useStockSync } from "@/hooks/useStockSync";
import MiniChart from "./MiniChart";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatMarketPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { memo } from "react";

interface MarketChartCardProps {
    symbol: string;
    name: string;
    range?: string;
    interval?: string;
}

const MarketChartCard = memo(({ symbol, name, range = "1mo", interval = "1d" }: MarketChartCardProps) => {
    const { stockData, isLoading, isError } = useStockSync(symbol, range, interval);

    if (isError) return null;

    const isPositive = (stockData?.regularMarketChange ?? 0) > 0;
    const isNegative = (stockData?.regularMarketChange ?? 0) < 0;
    const color = isPositive ? "#ef4444" : isNegative ? "#3b82f6" : "#6b7280";

    return (
        <div className="group bg-card/60 backdrop-blur-xl border border-black/5 dark:border-white/5 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-black/10 dark:hover:border-white/10 transition-all duration-500 overflow-hidden relative">
            <div className="flex flex-col gap-1 mb-8">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">{symbol}</span>
                <h3 className="text-xl font-black tracking-tighter text-foreground group-hover:text-blue-500 transition-colors">{name}</h3>
            </div>

            <div className="flex justify-between items-end mb-6">
                <div className="flex flex-col gap-1.5">
                    <span className="text-2xl font-black tracking-tight text-foreground/90 tabular-nums">
                        {isLoading ? <Skeleton className="h-8 w-32 bg-black/5 dark:bg-white/5" /> : formatMarketPrice(stockData?.regularMarketPrice, stockData?.currency)}
                    </span>
                    <div className={cn(
                        "flex items-center gap-1 text-[11px] font-bold tracking-tight tabular-nums",
                        isPositive ? "text-red-500" : isNegative ? "text-blue-500" : "text-muted-foreground"
                    )}>
                        {isPositive ? <TrendingUp className="size-3" /> : isNegative ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
                        {isLoading ? <Skeleton className="h-4 w-20 bg-black/5 dark:bg-white/5" /> : `${(stockData?.regularMarketChange ?? 0) >= 0 ? "+" : ""}${(stockData?.regularMarketChange ?? 0).toFixed(2)} (${(stockData?.regularMarketChangePercent ?? 0) >= 0 ? "+" : ""}${(stockData?.regularMarketChangePercent ?? 0).toFixed(2)}%)`}
                    </div>
                </div>
            </div>

            <div className="h-24 -mx-6 -mb-6 opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                {!isLoading && stockData?.historical && (
                    <MiniChart data={stockData.historical} color={color} />
                )}
            </div>

            {isLoading && (
                <div className="absolute inset-x-6 bottom-0 h-24 bg-linear-to-t from-background/20 to-transparent animate-pulse rounded-b-[2.5rem]" />
            )}
        </div>
    );
});

MarketChartCard.displayName = 'MarketChartCard';
export default MarketChartCard;
