'use client'

import React from "react";

interface StockSearchProps {
    ticker: string;
    setTicker: (value: string) => void;
    onSearch: (e: React.FormEvent) => void;
}

/**
 * [StockSearch 컴포넌트]
 * - 역할: 사용자의 입력을 받고 검색 이벤트를 부모에게 전달합니다.
 * - 학습 포인트 (Controlled Component): 
 *   React에서는 input의 value를 state와 동기화하는 '제어 컴포넌트' 패턴을 주로 사용합니다.
 *   이를 통해 입력값 검증(Validation)이나 포맷팅(대문자 변환 등)을 실시간으로 처리하기 용이합니다.
 */
export default function StockSearch({ ticker, setTicker, onSearch }: StockSearchProps) {
    return (
        <form onSubmit={onSearch} className="flex gap-2">
            <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="종목 코드 입력 (예: NVDA, 005930)"
                className="p-2 border rounded-lg dark:bg-gray-800 dark:border-white/10 flex-1 lg:flex-none lg:w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
            >
                검색
            </button>
        </form>
    );
}
