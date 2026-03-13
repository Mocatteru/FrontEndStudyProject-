'use client'

import React from "react";
import { FormatPriceCurrency, Stock, getMarketStateName } from "@/types/stock";

interface StockPriceCardProps {
    stockData: Stock;
}

/**
 * [StockPriceCard 컴포넌트]
 * - 역할: 주식의 현재가, 변동폭, 시장 상태 등 핵심 요약 정보를 시각화합니다.
 * - 학습 포인트 (Conditional Styling):
 *   주식 앱의 핵심인 '상승(빨강/초록) vs 하락(파랑/빨강)' 색상 처리를 
 *   삼항 연산자를 통해 동적으로 결정합니다. (한국은 상승 시 빨간색을 선호하지만, 미국 API 기준으로는 초록색을 많이 씁니다.)
 */
export default function StockPriceCard({ stockData }: StockPriceCardProps) {
    const isPositive = (stockData?.regularMarketChange ?? 0) >= 0;

    const marketPrice = stockData.regularMarketPrice?.toLocaleString() ?? '0.00';
    const marketChange = Math.abs(stockData?.regularMarketChange ?? 0).toFixed(2);
    const marketChangePercent = stockData.regularMarketChangePercent?.toFixed(2) ?? '0.00';

    return (
        <div className="p-6 border rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-sm shadow-xl transition-all hover:bg-black/10 dark:hover:bg-white/10 group">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight group-hover:text-blue-400 transition-colors">
                        {stockData?.longName || stockData?.shortName || 'Unknown'}
                        <span className="ml-2 text-gray-400 font-medium text-lg">{stockData?.symbol}</span>
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        시장 상태: <span className="text-blue-400 font-semibold">{getMarketStateName(stockData?.marketState)}</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-4xl font-black tabular-nums">
                        {FormatPriceCurrency(stockData.currency, marketPrice)}
                    </p>
                    <p className={`text-lg font-bold mt-1 flex items-center justify-end gap-1 ${isPositive ? "text-green-500" : "text-red-500"}`}>
                        <span className="text-sm">{isPositive ? "▲" : "▼"}</span>
                        {marketChange}
                        <span className="text-sm">({marketChangePercent}%)</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
