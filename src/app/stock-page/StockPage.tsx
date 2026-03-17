'use client'

import React, { useState, useCallback } from "react";
import useStockSync from "@/hooks/useStockSync";
import StockSearch from "./components/StockSearch";
import StockPriceCard from "./components/StockPriceCard";
import StockChart from "./components/StockChart";
import StockStats from "./components/StockStats";
import { isInt } from 'radash';
import { KR_TICKER_LENGTH, KR_TICKER_SUFFIX } from "@/types/stock";
import { useStockStore } from "@/store/useStockStore";




/**
 * [StockPage - 메인 페이지 컴포넌트]
 * 
 * [Senior's Architecture Tips]
 * 1. 복잡성 분리: 거대했던 파일을 기능별 컴포넌트로 쪼개어 가독성을 높였습니다.
 * 2. 상태 응집도: 개별로 관리하던 range, interval을 하나로 묶어 업데이트 시 일관성을 보장합니다.
 * 3. 관심사 분리(SoC): 페이지는 '데이터의 흐름'만 제어하고, 실제 UI 그리기나 로직은 하위 컴포넌트가 담당합니다.
 */
export default function StockPage() {

    // [학습 포인트: 상태 그룹화 (State Grouping)]
    // 서로 같이 바뀌어야 하는 데이터들은 하나의 객체로 묶어 관리하는 것이 좋습니다.
    // '5분봉' 선택 시 range='5d', interval='5m'이 동시에 바뀌어야 하므로 한 번의 setState로 처리합니다.
    const [chartConfig, setChartConfig] = useState({
        range: '6mo',
        interval: '1d'
    });
    const { currentTicker } = useStockStore();
    const { stockData, isError, isLoading } = useStockSync(
        currentTicker,
        chartConfig.range,
        chartConfig.interval
    );



    // 차트 설정 변경 (하위 컴포넌트에서 호출됨)
    const handleConfigChange = useCallback((newRange: string, newInterval: string) => {
        setChartConfig({ range: newRange, interval: newInterval });
    }, []);

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <header className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight">Stock Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">실시간 주가 정보와 기술적 차트를 분석해보세요.</p>
            </header>

            {/* 검색 섹션 */}
            <StockSearch />

            <hr className="border-white/10" />

            {/* 로딩 상태 UI */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-gray-400 animate-pulse">데이터를 불러오는 중입니다...</p>
                </div>
            )}

            {/* 에러 상태 UI */}
            {isError && (
                <div className="text-red-500 bg-red-500/10 p-6 rounded-2xl border border-red-500/20 animate-in fade-in zoom-in-95">
                    <h3 className="font-bold text-lg mb-1">검색 결과가 없습니다</h3>
                    <p>정확한 티커(예: AAPL, TSLA)를 입력하셨는지 확인해 주세요.</p>
                    <p>코스닥을 찾고 계셨나요? 티커 뒤에 .KQ를 붙여주세요. (예: 000000.KQ)</p>
                </div>
            )}

            {/* 결과 출력 섹션 */}
            {stockData && !isLoading && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* 1. 시세 요약 카드 */}
                    <StockPriceCard stockData={stockData} />

                    {/* 2. 인터랙티브 차트 영역 */}
                    <StockChart
                        stockData={stockData}
                        range={chartConfig.range}
                        interval={chartConfig.interval}
                        onConfigChange={handleConfigChange}
                    />

                    {/* 3. 상세 지표 통계 그리드 */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold px-1">상세 지표 (Statistics)</h2>
                        <StockStats stockData={stockData} />
                    </div>
                </div>
            )}
        </div>
    )
}