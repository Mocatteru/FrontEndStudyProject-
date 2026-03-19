'use client'

import React, { useState, useEffect } from "react";
import { FormatPriceCurrency, Stock, getMarketStateName } from "@/types/stock";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useStockStore } from "@/store/useStockStore";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface StockPriceCardProps {
    stockData: Stock;
}

/**
 * [StockPriceCard 컴포넌트]
 * - 역할: 주식의 현재가, 변동폭, 시장 상태 등 핵심 요약 정보를 시각화합니다.
 * - 기능 추가: 메모 기능을 모달로 구현하여 주식별 개인 메모를 저장할 수 있습니다.
 */
export default function StockPriceCard({ stockData }: StockPriceCardProps) {
    const { stockMemo, setStockMemo } = useStockStore();
    const [open, setOpen] = useState(false);

    // 현재 종목의 기존 메모 찾기
    const currentMemo = stockMemo.find(m => m.ticker === stockData.symbol)?.memo || "";
    const [memoInput, setMemoInput] = useState(currentMemo);

    // 종목이 바뀔 때마다 입력창 초기화
    useEffect(() => {
        setMemoInput(currentMemo);
    }, [stockData.symbol, currentMemo]);

    const isPositive = (stockData?.regularMarketChange ?? 0) >= 0;
    const marketPrice = stockData.regularMarketPrice ?? 0;
    const marketChange = Math.abs(stockData?.regularMarketChange ?? 0).toFixed(2);
    const marketChangePercent = stockData.regularMarketChangePercent?.toFixed(2) ?? '0.00';

    const handleSave = () => {
        setStockMemo(stockData.symbol, memoInput);
        setOpen(false);
    };

    return (
        <div className="p-8 border-2 rounded-[3rem] bg-card/40 backdrop-blur-xl shadow-2xl transition-all hover:bg-card/60 group border-black/5 dark:border-white/5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                {/* 좌측 정보 영역: flex-1과 min-w-0으로 유연하게 조절 */}
                <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex flex-col items-start gap-4">
                        <div className="w-full">
                            <h3 className="text-2xl sm:text-3xl font-black tracking-tighter leading-tight group-hover:text-blue-500 transition-all duration-300 whitespace-normal break-words">
                                {stockData?.longName || stockData?.shortName || 'Unknown'}
                                <span className="ml-2 text-muted-foreground/30 font-medium text-lg uppercase tracking-widest inline-block">{stockData?.symbol}</span>
                            </h3>
                        </div>

                        {/* 메모 모달 트리거 */}
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger
                                render={
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-xl h-8 px-2.5 bg-black/5 dark:bg-white/5 hover:bg-blue-500/10 hover:text-blue-500 transition-all active:scale-95"
                                    />
                                }
                            >
                                <Pencil className="size-3.5 mr-1.5" />
                                <span className="font-bold text-[11px]">메모</span>
                            </DialogTrigger>
                            <DialogContent className="max-w-md p-8 border-none bg-card/95 backdrop-blur-2xl shadow-2xl rounded-[2.5rem]">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black tracking-tighter italic uppercase text-foreground/80">
                                        메모
                                    </DialogTitle>
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
                                            placeholder={`${stockData.longName}에 대한 생각을 자유롭게 적어보세요...`}
                                            className="min-h-[250px] w-full bg-black/5 dark:bg-white/5 border-none rounded-3xl p-6 text-base font-medium resize-none focus-visible:ring-blue-500/20 placeholder:text-muted-foreground/30 break-all overflow-y-auto"
                                        />
                                        {/* 글자수 제한 표시 */}
                                        <div className="absolute bottom-4 right-6 text-[10px] font-black tracking-widest text-muted-foreground/30 uppercase italic">
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
                    </div>

                    <p className="text-[14px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em] flex items-center gap-2">
                        <span className="size-2 rounded-full bg-blue-500/50 animate-pulse" />
                        장 상태: <span className="text-foreground/60">{getMarketStateName(stockData?.marketState)}</span>
                    </p>

                    {/* 저장된 메모 섹션: break-all로 텍스트 넘침 방지 */}
                    {currentMemo && (
                        <div className="mt-4 py-2 animate-in fade-in slide-in-from-left-4 duration-500 max-w-full">
                            <p className="text-[16px] font-black text-blue-500/40 uppercase tracking-widest mb-1">메모</p>
                            <p className="text-[14px] font-medium text-foreground/80 leading-relaxed whitespace-pre-wrap break-all">{currentMemo}</p>
                        </div>
                    )}
                </div>

                {/* 우측 가격 영역: shrink-0으로 고정 너비 확보 */}
                <div className="pb-18 text-right space-y-2 shrink-0 self-start sm:self-center">
                    <p className="text-3xl pr-2 sm:text-4xl font-black tracking-tighter tabular-nums text-foreground drop-shadow-sm">
                        {FormatPriceCurrency(stockData.currency, marketPrice)}
                    </p>
                    <div className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl font-black text-base sm:text-lg tabular-nums shadow-sm border",
                        isPositive
                            ? "bg-green-500/10 border-green-500/20 text-green-500"
                            : "bg-red-500/10 border-red-500/20 text-red-500"
                    )}>
                        <span className="text-xs">{isPositive ? "▲" : "▼"}</span>
                        {marketChange}
                        <span className="text-[11px] opacity-60">({marketChangePercent}%)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
