'use client'

import useStockSearch from "@/hooks/useStockSearch";
import { useStockStore } from "@/store/useStockStore";
import React, { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, History, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StockSearchInput() {
    const [ticker, setTicker] = useState<string>('');
    const [isFocused, setIsFocused] = useState<boolean>(false);

    const { handleRecentSearch, handleRemoveRecentSearch, handleClearRecentSearch } = useStockSearch();
    const { recentSearchList } = useStockStore();

    const pressSearchButton = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (ticker.trim()) {
            handleRecentSearch(ticker);
            setIsFocused(false);
        }
    }, [ticker, handleRecentSearch])

    const handleSelectHistory = (value: string) => {
        setTicker(value);
        handleRecentSearch(value);
        setIsFocused(false);
    }

    return (
        <div className="relative w-full max-w-sm group/search">
            <form onSubmit={pressSearchButton} className="flex gap-3 w-full">
                <div className={cn(
                    "relative flex-1 transition-all duration-500",
                    isFocused ? "scale-105 -translate-y-1" : ""
                )}>
                    <Search className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 size-4 transition-colors duration-300",
                        isFocused ? "text-blue-500" : "text-muted-foreground/30"
                    )} />
                    <Input
                        type="text"
                        autoComplete="off"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        placeholder="종목 입력 (NVDA, 005930...)"
                        className={cn(
                            "pl-11 pr-4 h-12 w-full transition-all duration-500",
                            "bg-black/5 dark:bg-white/5 border-2 border-black/5 dark:border-white/5 rounded-2xl",
                            "focus-visible:ring-0 focus-visible:border-blue-500/30 focus-visible:bg-white dark:focus-visible:bg-black/20",
                            "placeholder:text-muted-foreground/20 placeholder:font-black placeholder:uppercase placeholder:tracking-widest placeholder:text-[10px]"
                        )}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    />
                </div>
                <Button
                    type="submit"
                    className={cn(
                        "h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-500 active:scale-95 shadow-xl shadow-blue-500/10",
                        isFocused ? "bg-blue-600 shadow-blue-600/20" : "bg-blue-500"
                    )}
                >
                    검색
                </Button>
            </form>

            {/* 최근 검색기록 드롭다운 - [Premium Refactoring] */}
            {isFocused && recentSearchList.length > 0 && (
                <div className="absolute top-full left-0 w-full z-50 mt-4 p-4 bg-card/95 backdrop-blur-2xl border border-black/5 dark:border-white/5 shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between px-3 py-2 mb-3">
                        <div className="flex items-center gap-2">
                            <div className="size-1 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">최근 검색 기록</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 text-[10px] font-black border-none bg-red-500/5 hover:bg-red-500/10 text-red-500/60 hover:text-red-500 transition-all rounded-full uppercase tracking-tighter"
                            onClick={handleClearRecentSearch}
                        >
                            전체 삭제
                        </Button>
                    </div>
                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                        {recentSearchList.map((v) => (
                            <div
                                key={v}
                                className="group/item flex items-center justify-between px-4 py-3 rounded-[1.25rem] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-all duration-300 active:scale-[0.98]"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelectHistory(v)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-black/5 dark:bg-white/5 rounded-xl group-hover/item:rotate-12 transition-all duration-300">
                                        <History className="size-3.5 text-muted-foreground/40 group-hover/item:text-blue-500" />
                                    </div>
                                    <span className="text-sm font-black tracking-tight text-foreground/70 group-hover/item:text-blue-500 transition-colors uppercase">{v}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 opacity-0 group-hover/item:opacity-100 transition-all duration-300 hover:bg-red-500/10 hover:text-red-500 rounded-xl"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveRecentSearch(v);
                                    }}
                                >
                                    <X className="size-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
