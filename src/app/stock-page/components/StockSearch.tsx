'use client'

import useStockSearch from "@/hooks/useStockSearch";
import { useStockStore } from "@/store/useStockStore";
import React, { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, History, X } from "lucide-react";

export default function StockSearchInput() {
    const [ticker, setTicker] = useState<string>('');
    const [isFocused, setIsFocused] = useState<boolean>(false);

    const { handleRecentSearch, handleRemoveRecentSearch, handleClearRecentSearch } = useStockSearch();
    const { recentSearchList } = useStockStore();

    const pressSearchButton = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        handleRecentSearch(ticker);
        setIsFocused(false);
    }, [ticker, handleRecentSearch])

    const handleSelectHistory = (value: string) => {
        setTicker(value);
        handleRecentSearch(value);
        setIsFocused(false);
    }

    return (
        <div className="relative w-full max-w-sm">
            <form onSubmit={pressSearchButton} className="flex gap-2 w-full">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mr-1" />
                    <Input
                        type="text"
                        autoComplete="off"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        placeholder="종목 입력 (예: NVDA, 005930)"
                        className="pl-9 pr-4 h-10 w-full bg-background"
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    />
                </div>
                <Button
                    type="submit"
                    className="h-10 px-6 font-bold"
                >
                    검색
                </Button>
            </form>

            {/* 최근 검색기록 드롭다운 */}
            {isFocused && recentSearchList.length > 0 && (
                <Card className="absolute top-full left-0 w-full z-50 mt-2 p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between px-2 py-1 mb-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">최근 검색</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] hover:text-destructive"
                            onClick={handleClearRecentSearch}
                        >
                            전체 삭제
                        </Button>
                    </div>
                    <div className="space-y-1">
                        {recentSearchList.map((v) => (
                            <div
                                key={v}
                                className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer transition-colors"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelectHistory(v)}
                            >
                                <div className="flex items-center gap-2">
                                    <History className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm font-medium">{v}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveRecentSearch(v);
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
