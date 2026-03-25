'use client';

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { FormatPriceCurrency, StockWatchListItemProps } from "@/types/stock";
import { useCallback, memo } from "react";
import { useStockStore } from "@/store/useStockStore";
import { useUiStore } from "@/store/uiStore";


const StockWatchListItem = memo(({ ticker, name, price, change, changePercent, isPositive, currency, isOpen = true }: StockWatchListItemProps) => {
    const marketChange = Math.abs(change).toFixed(2);
    const formattedPrice = FormatPriceCurrency(currency, price);
    const formattedChange = FormatPriceCurrency(currency, Number(marketChange));

    // [Senior Optimization] Selector를 사용하여 액션만 구독
    const setCurrentTicker = useStockStore(s => s.setCurrentTicker);
    const { isWatchListOpen, toggleWatchList } = useUiStore();

    const onClickWatchListItem = useCallback(() => {
        setCurrentTicker(ticker);
        // 모바일이나 특정 상황에서 관심목록 클릭 시 자동으로 닫히도록 처리 (UX)
        if (window.innerWidth < 768 && isWatchListOpen) {
            toggleWatchList();
        }
    }, [ticker, setCurrentTicker, isWatchListOpen, toggleWatchList])

    return (
        <SidebarMenuItem className="px-1 w-full flex justify-center"> {/* 사이드바 좌우 여백 확보 및 중앙 정렬 */}
            <SidebarMenuButton
                onClick={onClickWatchListItem}
                className={cn(
                    "transition-all duration-300 group relative flex items-center justify-center",
                    isOpen
                        ? "h-auto py-5 px-5 rounded-[2.25rem] w-full"
                        : "size-11 p-0 rounded-xl", 
                    "bg-card/40 dark:bg-white/3 backdrop-blur-sm",
                    "border border-black/5 dark:border-white/8",
                    "hover:bg-card/80 dark:hover:bg-white/8 hover:border-blue-500/20",
                    "hover:shadow-xl dark:hover:shadow-none",
                    "active:scale-[0.98]"
                )}
            >
                {isOpen ? (
                    /* [확장 모드: 0.82배 스케일링] 상세 정보 표시 */
                    <div className="flex justify-between items-start w-full gap-4.5 animate-in fade-in zoom-in-95 duration-500">
                        {/* [좌측] 이름 및 티커 영역 */}
                        <div className="flex flex-col gap-1.5 items-start flex-1 min-w-0 overflow-hidden">
                            <span className="font-black text-[12px] text-foreground leading-[1.3] text-left whitespace-normal wrap-break-word line-clamp-2 group-hover:text-blue-500 transition-colors">
                                {name}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <div className="size-1 rounded-full bg-amber-300 animate-pulse" />
                                <span className="text-[11px] font-black text-amber-300/80 uppercase tracking-widest shrink-0">
                                    {ticker}
                                </span>
                            </div>
                        </div>

                        {/* [우측] 가격 및 등락 지표 */}
                        <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5 min-w-max">
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="font-black text-[13px] tracking-tighter text-foreground leading-none">
                                    {formattedPrice}
                                </span>
                                <span className={cn(
                                    "text-[10px] font-black tracking-tighter",
                                    isPositive ? "text-red-500" : "text-blue-500"
                                )}>
                                    {isPositive ? '+' : '-'}{formattedChange}
                                </span>
                            </div>
                            <Badge
                                variant="secondary"
                                className={cn(
                                    "text-[9px] px-2.5 py-0.5 h-6 border-none font-black rounded-full transition-all duration-500",
                                    isPositive
                                        ? "bg-red-500/10 text-red-500 dark:bg-red-500/20 group-hover:bg-red-500/30"
                                        : "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 group-hover:bg-blue-500/30"
                                )}
                            >
                                {isPositive ? <TrendingUp className="size-3.5 mr-1" /> : <TrendingDown className="size-3.5 mr-1" />}
                                {(changePercent ?? 0).toFixed(2)}%
                            </Badge>
                        </div>
                    </div>
                ) : (
                    /* [축소 모드] 티커 앞글자 또는 요약 정보만 표시 */
                    <div className="flex items-center justify-center w-full h-full animate-in fade-in zoom-in-75 duration-300">
                        <span className={cn(
                            "text-[10px] font-black tracking-tighter uppercase",
                            isPositive ? "text-red-500" : "text-blue-500 text-pretty"
                        )}>
                            {ticker.substring(0, 3)}
                        </span>
                        {/* 실시간 상태를 보여주는 작은 점 */}
                        <div className={cn(
                            "absolute top-1.5 right-1.5 size-1.5 rounded-full animate-pulse",
                            isPositive ? "bg-red-500" : "bg-blue-500"
                        )} />
                    </div>
                )}
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
});

StockWatchListItem.displayName = "StockWatchListItem";

export default StockWatchListItem;