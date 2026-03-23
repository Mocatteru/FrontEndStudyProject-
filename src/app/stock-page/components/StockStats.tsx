'use client'

import React, { useMemo } from "react";
import { Stock, FormatPriceCurrency } from "@/types/stock";

interface StockStatsProps {
    stockData: Stock;
}

/**
 * [StockStats 컴포넌트]
 * - 역할: 주식의 상세 지표(거래량, 시가총액, PE 등)를 그리드 형태로 출력합니다.
 * - 학습 포인트 (Data Mapping):
 *   비슷한 패턴의 UI가 반복될 때는 배열을 선언하고 `.map()`을 사용하는 것이 생산성과 유지보수에 좋습니다.
 *   나중에 지표를 추가하거나 순서를 바꿀 때 이 배열만 수정하면 되기 때문이죠!
 */
const StockStats = React.memo(({ stockData }: StockStatsProps) => {
    const stats = useMemo(() => [
        // 1. 가격 관련 지표
        { label: '시가 (Open)', value: FormatPriceCurrency(stockData.currency, stockData?.regularMarketOpen) },
        { label: '고가 (High)', value: FormatPriceCurrency(stockData.currency, stockData?.regularMarketDayHigh) },
        { label: '저가 (Low)', value: FormatPriceCurrency(stockData.currency, stockData?.regularMarketDayLow) },
        { label: '전일 종가 (Prev Close)', value: (stockData?.regularMarketPrice && stockData?.regularMarketChange) 
            ? FormatPriceCurrency(stockData.currency, stockData.regularMarketPrice - stockData.regularMarketChange) 
            : '---' },

        // 2. 통계 및 볼륨
        { label: '거래량 (Volume)', value: stockData?.regularMarketVolume?.toLocaleString() },
        { label: '평균 거래량 (3M)', value: stockData?.averageDailyVolume3Month?.toLocaleString() },
        { label: '시가총액 (Market Cap)', value: stockData?.marketCap ? (
            stockData.currency === 'KRW' 
                ? `${(stockData.marketCap / 1e12).toFixed(1)}조 원` 
                : `$${(stockData.marketCap / 1e9).toFixed(2)}B`
        ) : '---' },
        { label: '유통 주식수', value: stockData?.sharesOutstanding?.toLocaleString() },

        // 3. 투자 지표 (PE, EPS 등)
        { label: 'P/E Ratio (Trailing)', value: stockData?.trailingPE?.toFixed(2) ?? '---' },
        { label: 'P/E Ratio (Forward)', value: stockData?.forwardPE?.toFixed(2) ?? '---' },
        { label: 'EPS (TTM)', value: stockData?.epsTrailingTwelveMonths?.toFixed(2) ?? '---' },
        { label: '배당 수익률 (Div Yield)', value: stockData?.dividendYield ? `${stockData.dividendYield.toFixed(2)}%` : '---' },

        // 4. 주가 범위 정보
        { label: '52주 최고가', value: FormatPriceCurrency(stockData.currency, stockData?.fiftyTwoWeekHigh) },
        { label: '52주 최저가', value: FormatPriceCurrency(stockData.currency, stockData?.fiftyTwoWeekLow) },
        { label: '50일 평균가', value: FormatPriceCurrency(stockData.currency, stockData?.fiftyDayAverage) },
        { label: '200일 평균가', value: FormatPriceCurrency(stockData.currency, stockData?.twoHundredDayAverage) },

        // 5. 기타 정보
        { label: '거래 통화', value: stockData?.currency },
        { label: '상장 거래소', value: stockData?.fullExchangeName || stockData?.exchange },
    ], [stockData]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((item, idx) => (
                <div
                    key={idx}
                    className="flex justify-between p-4 border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all"
                >
                    <span className="text-sm text-gray-400 font-medium">{item.label}</span>
                    <span className="text-sm font-bold tabular-nums">{item.value ?? 'N/A'}</span>
                </div>
            ))}
        </div>
    );
});

StockStats.displayName = 'StockStats';

export default StockStats;
