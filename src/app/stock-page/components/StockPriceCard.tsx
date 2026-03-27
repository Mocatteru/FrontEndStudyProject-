'use client'

import React, { useState, memo } from "react";
import { Stock, FormatPriceCurrency } from "@/types/stock";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStockStore } from "@/store/useStockStore";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { PencilIcon } from "lucide-react";

interface StockPriceCardProps {
    stockData: Stock;
}

/** 
 * [Senior Optimization] 
 * 메모 업데이트 전용 다이얼로그 컴포넌트.
 * 타이핑 상태(memoInput)를 이곳에 고립시켜, 글자를 입력할 때
 * 메인 주가 정보인 StockPriceCard 전체가 리렌더링되는 것을 원천 차단합니다.
 */
const MemoUpdateDialog = memo(({
    symbol,
    longName,
    currentMemo
}: {
    symbol: string,
    longName: string,
    currentMemo: string
}) => {
    // [변수명 유지] 기존 변수명을 그대로 사용합니다.
    const [open, setOpen] = useState(false);
    const [memoInput, setMemoInput] = useState("");
    const setStockMemo = useStockStore(s => s.setStockMemo);

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setMemoInput(currentMemo);
        }
        setOpen(isOpen);
    };

    const handleSave = () => {
        if (symbol) {
            setStockMemo(symbol, memoInput);
        }
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl h-8 px-2.5 bg-black/5 dark:bg-white/5 hover:bg-blue-500/10 hover:text-blue-500 transition-all active:scale-95 shrink-0"
                    >
                        <div className="flex items-center gap-2">
                            <PencilIcon className="size-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">메모</span>
                        </div>
                    </Button>
                }
            />
            {/* backdrop-blur 성능을 위해 xl -> md로 부드럽게 조정 */}
            <DialogContent className="max-w-md p-8 border-none bg-card/95 backdrop-blur-md shadow-2xl rounded-[2.5rem]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tighter uppercase text-foreground/80">
                        메모 업데이트
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-black tracking-widest text-muted-foreground/30 uppercase">
                        티커: {symbol}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-4">
                    <div className="relative">
                        <Textarea
                            value={memoInput}
                            onChange={(e) => {
                                if (e.target.value.length <= 500) {
                                    setMemoInput(e.target.value);
                                }
                            }}
                            placeholder={`${longName}에 대한 전략적 메모를 입력하세요...`}
                            className="min-h-[250px] w-full bg-black/5 dark:bg-white/5 border-none rounded-3xl p-6 text-base font-medium resize-none focus-visible:ring-blue-500/20 placeholder:text-muted-foreground/30 break-all overflow-y-auto custom-scrollbar"
                        />
                        <div className="absolute bottom-4 right-6 text-[10px] font-black tracking-widest text-muted-foreground/30 uppercase">
                            {memoInput.length} / 500
                        </div>
                    </div>

                    <div className="flex justify-end p-0">
                        <Button
                            onClick={handleSave}
                            className="h-14 px-10 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 bg-blue-500 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            저장하기
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
});

MemoUpdateDialog.displayName = 'MemoUpdateDialog';

function getMarketStateName(state: string | undefined): string {
    if (!state) return '불명';
    const upperState = state.toUpperCase();
    if (upperState.includes('REGULAR')) return '정규장';
    if (upperState.includes('POST')) return '장후';
    if (upperState.includes('PRE')) return '장전';
    if (upperState.includes('CLOSED')) return '장마감';
    return '불명';
}

const StockPriceCard = memo(({ stockData }: StockPriceCardProps) => {
    // 특정 티커의 메모 데이터만 효율적으로 구독
    const currentMemo = useStockStore(s =>
        s.stockMemo.find(m => m.ticker === stockData.symbol)?.memo || ""
    );

    const marketPrice = stockData.regularMarketPrice;
    const marketChange = stockData.regularMarketChange;
    const marketChangePercent = stockData.regularMarketChangePercent;
    const isPositive = (marketChange ?? 0) >= 0;

    return (
        <div className="group relative bg-card border-2 border-black/5 dark:border-white/5 rounded-3xl sm:rounded-[3.5rem] p-5 sm:p-8 shadow-xl shadow-black/5 dark:shadow-white/5 hover:shadow-blue-500/10 hover:border-blue-500/20 transition-all duration-500 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-1000" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all duration-1000" />

            <div className="relative flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6">
                <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex flex-col gap-1">

                            <h3 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none group-hover:text-blue-500 transition-all duration-500">
                                {stockData?.longName || stockData?.shortName || 'Unknown'}
                                <span className="ml-3 text-muted-foreground/20 font-black text-xl uppercase tracking-widest inline-block">{stockData?.symbol}</span>
                            </h3>
                        </div>

                        {/* 메모 기능: 별도 컴포넌트로 분리하여 리렌더링 범위 한정 */}
                        <div className="self-end pb-1">
                            <MemoUpdateDialog
                                symbol={stockData.symbol}
                                longName={stockData.longName || ""}
                                currentMemo={currentMemo}
                            />
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                        <span className="size-2 rounded-full bg-blue-500/50 animate-pulse" />
                        <span className="text-[10px] font-black text-muted-foreground/40 tracking-[0.2em]">
                            장 상태 : <span className="text-foreground/60">{getMarketStateName(stockData?.marketState)}</span>
                        </span>
                    </div>

                    {currentMemo && (
                        <div className="mt-8 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 max-w-full group/memo relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 size-16 bg-blue-500/5 rounded-full blur-xl group-hover/memo:bg-blue-500/10 transition-all duration-1000" />
                            <p className="text-[10px] font-black text-blue-500/40 tracking-[0.2em] mb-3">투자 전략 메모</p>
                            <p className="text-[15px] font-bold text-foreground/80 leading-relaxed whitespace-pre-wrap break-all">{currentMemo}</p>
                        </div>
                    )}
                </div>

                <div className="text-right space-y-2 shrink-0 self-end sm:self-center">
                    <p className="text-3xl pb-4 pr-2 sm:text-4xl font-black tracking-tighter tabular-nums text-foreground drop-shadow-sm">
                        {FormatPriceCurrency(stockData.currency, marketPrice)}
                    </p>
                    <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-base sm:text-lg tabular-nums shadow-sm border",
                        isPositive
                            ? "bg-red-500/10 border-red-500/20 text-red-500"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                    )}>
                        <span className="text-xs">{isPositive ? "▲" : "▼"}</span>
                        {stockData.currency === 'KRW'
                            ? Math.round(marketChange ?? 0).toLocaleString()
                            : marketChange?.toFixed(2)}
                        <span className="text-[11px] opacity-60">({marketChangePercent?.toFixed(2)}%)</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

StockPriceCard.displayName = 'StockPriceCard';

export default StockPriceCard;
