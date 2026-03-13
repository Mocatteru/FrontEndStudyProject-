'use client'

import React, { useMemo } from "react";
import { Stock } from "@/types/stock";

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
        { label: '시가 (Open)', value: stockData?.regularMarketOpen?.toLocaleString() },
        { label: '고가 (High)', value: stockData?.regularMarketDayHigh?.toLocaleString() },
        { label: '저가 (Low)', value: stockData?.regularMarketDayLow?.toLocaleString() },
        { label: '전일 종가 (Prev Close)', value: (stockData?.regularMarketPrice && stockData?.regularMarketChange) ? (stockData.regularMarketPrice - stockData.regularMarketChange).toLocaleString() : null },

        // 2. 통계 및 볼륨
        { label: '거래량 (Volume)', value: stockData?.regularMarketVolume?.toLocaleString() },
        { label: '평균 거래량 (3M)', value: stockData?.averageDailyVolume3Month?.toLocaleString() },
        { label: '시가총액 (Market Cap)', value: stockData?.marketCap ? `$${(stockData.marketCap / 1e9).toFixed(2)}B` : null },
        { label: '유통 주식수', value: (stockData as any).sharesOutstanding?.toLocaleString() },

        // 3. 투자 지표 (PE, EPS 등)
        { label: 'P/E Ratio (Trailing)', value: stockData?.trailingPE?.toFixed(2) },
        { label: 'P/E Ratio (Forward)', value: stockData?.forwardPE?.toFixed(2) },
        { label: 'EPS (TTM)', value: stockData?.epsTrailingTwelveMonths?.toFixed(2) },
        { label: '배당 수익률 (Div Yield)', value: (stockData as any).dividendYield ? `${(stockData as any).dividendYield.toFixed(2)}%` : null },

        // 4. 주가 범위 정보
        { label: '52주 최고가', value: stockData?.fiftyTwoWeekHigh?.toLocaleString() },
        { label: '52주 최저가', value: stockData?.fiftyTwoWeekLow?.toLocaleString() },
        { label: '50일 평균가', value: (stockData as any).fiftyDayAverage?.toLocaleString() },
        { label: '200일 평균가', value: (stockData as any).twoHundredDayAverage?.toLocaleString() },

        // 5. 기타 정보
        { label: '거래 통화', value: stockData?.currency },
        { label: '상장 거래소', value: (stockData as any).fullExchangeName || (stockData as any).exchange },
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

export default StockStats;
