'use client'

import { memo } from "react";
import { useStockSync } from "@/hooks/useStockSync";
import MiniChart from "./MiniChart";
import { cn, formatMarketPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface MarketListRowProps {
    symbol: string;
    name: string;
    isSelected: boolean;
    onClick: (symbol: string, name: string) => void;
}

const MarketListRow = memo(({ symbol, name, isSelected, onClick }: MarketListRowProps) => {
    const { stockData, isLoading } = useStockSync(symbol, "1y", "1d");

    const change = stockData?.regularMarketChange ?? 0;
    const changePercent = stockData?.regularMarketChangePercent ?? 0;
    const isPositive = change > 0;
    const isNegative = change < 0;
    const chartColor = isPositive ? "#ef4444" : isNegative ? "#3b82f6" : "#6b7280";
    const pctColor = isPositive ? "text-red-500" : isNegative ? "text-blue-500" : "text-muted-foreground/50";

    return (
        // [Shadcn-First] button 태그 → Button 컴포넌트로 교체 (접근성, 포커스 링 일관성)
        <Button
            type="button"
            variant="ghost"
            onClick={() => onClick(symbol, name)}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-1.5 h-auto rounded-xl text-left justify-start",
                isSelected
                    ? "bg-blue-500/10 hover:bg-blue-500/15"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
            )}
        >
            {/* 스파클라인: 고정 크기 */}
            <div className="w-12 h-7 shrink-0">
                {!isLoading && stockData?.historical ? (
                    <MiniChart data={stockData.historical} color={chartColor} />
                ) : (
                    <Skeleton className="w-full h-full rounded bg-black/5 dark:bg-white/5" />
                )}
            </div>

            {/* 종목명: flex-1로 남은 공간 모두 차지 */}
            <span className={cn(
                "flex-1 text-[13px] font-semibold truncate leading-none",
                isSelected ? "text-blue-500" : "text-foreground/80"
            )}>
                {name}
            </span>

            {/* 현재가: w-24 고정으로 열 정렬 맞춤 */}
            <span className="w-24 text-right text-[13px] font-bold text-foreground/90 tabular-nums leading-none shrink-0">
                {isLoading
                    ? <Skeleton className="h-4 w-20 ml-auto rounded bg-black/5 dark:bg-white/5" />
                    : formatMarketPrice(stockData?.regularMarketPrice, stockData?.currency)
                }
            </span>

            {/* 등락률: w-16 고정으로 열 정렬 맞춤 */}
            <span className={cn(
                "w-16 text-right text-[13px] font-bold tabular-nums leading-none shrink-0",
                pctColor
            )}>
                {isLoading
                    ? <Skeleton className="h-4 w-12 ml-auto rounded bg-black/5 dark:bg-white/5" />
                    : `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`
                }
            </span>
        </Button>
    );
});

MarketListRow.displayName = 'MarketListRow';
export default MarketListRow;
