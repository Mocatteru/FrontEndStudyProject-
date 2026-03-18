import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { FormatPriceCurrency } from "@/types/stock";
import { useCallback } from "react";
import { useStockStore } from "@/store/useStockStore";

interface StockWatchListItemProps {
    ticker: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    isPositive: boolean;
    currency: string;
}


export default function StockWatchListItem({ ticker, name, price, change, changePercent, isPositive, currency }: StockWatchListItemProps) {
    const marketChange = Math.abs(change).toFixed(2);
    const formattedPrice = FormatPriceCurrency(currency, price);
    const formattedChange = FormatPriceCurrency(currency, Number(marketChange));

    const { setCurrentTicker } = useStockStore();

    const onClickWatchListItem = useCallback(() => {
        setCurrentTicker(ticker);
    }, [ticker, setCurrentTicker])

    return (
        <SidebarMenuItem className="px-1"> {/* 사이드바 좌우 여백 확보 */}
            <SidebarMenuButton
                onClick={onClickWatchListItem}
                className={cn(
                    "h-auto py-6 px-6 rounded-[2.5rem] transition-all duration-300 group relative",
                    "bg-card/40 dark:bg-white/3 backdrop-blur-sm", // 상시 반투명 배경
                    "border border-black/5 dark:border-white/8", // 명확한 경계선
                    "hover:bg-card/80 dark:hover:bg-white/8 hover:border-blue-500/20", // 호버 시 강조
                    "hover:shadow-xl hover:shadow-black/2 dark:hover:shadow-none", // 입체감
                    "active:scale-[0.98]"
                )}
            >
                {/* [Senior's Tip] 내부 레이아웃의 gap을 5로 늘려 시각적 혼잡도를 낮췄습니다. */}
                <div className="flex justify-between items-start w-full gap-5">

                    {/* [좌측] 이름 및 티커 영역 */}
                    <div className="flex flex-col gap-2 items-start flex-1 min-w-0 overflow-hidden">
                        <span className="font-black text-[14px] text-foreground leading-snug text-left whitespace-normal wrap-break-word line-clamp-3 group-hover:text-blue-500 transition-colors">
                            {name}
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-amber-300 animate-pulse" />
                            <span className="text-[12px] font-black text-amber-300/80 uppercase tracking-[0.2em] shrink-0">
                                {ticker}
                            </span>
                        </div>
                    </div>

                    {/* [우측] 가격 및 등락 지표 */}
                    <div className="flex flex-col items-end gap-2.5 shrink-0 pt-0.5 min-w-max">
                        <div className="flex flex-col items-end gap-0.5">
                            <span className="font-black text-[15px] tracking-tighter text-foreground leading-none">
                                {formattedPrice}
                            </span>
                            <span className={cn(
                                "text-[10px] font-black tracking-tighter",
                                isPositive ? "text-red-500/80" : "text-blue-500/80"
                            )}>
                                {isPositive ? '+' : '-'}{formattedChange}
                            </span>
                        </div>
                        <Badge
                            variant="secondary"
                            className={cn(
                                "text-[10px] px-3 py-0.5 h-6 border-none font-black rounded-full transition-all duration-500",
                                isPositive
                                    ? "bg-red-500/10 text-red-500 dark:bg-red-500/20 group-hover:bg-red-500/30"
                                    : "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 group-hover:bg-blue-500/30"
                            )}
                        >
                            {isPositive ? <TrendingUp className="size-3.5 mr-1" /> : <TrendingDown className="size-3.5 mr-1" />}
                            {changePercent.toFixed(2)}%
                        </Badge>
                    </div>
                </div>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}