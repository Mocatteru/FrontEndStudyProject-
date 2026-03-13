'use client'

import React, { useState, useMemo } from "react";
import useStockSync from "@/hooks/useStockSync";
import dynamic from "next/dynamic";
import { getMarketStateName, getStockChartOptions, PERIOD_OPTIONS } from "@/types/stock";

//TODO: 컴포넌트 컨테이너화 하기, 관심주식 목록 구현하기, 최근 검색목록 리스팅하기

// ApexCharts는 window 객체를 사용하므로 SSR(Server Side Rendering)을 비활성화하여 불러옵니다.
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function StockPage() {
    const [ticker, setTicker] = useState<string>('');
    const [searchTicker, setSearchTicker] = useState<string>('');

    // [코드 리뷰 & 배드 패턴 방지]
    // 현재는 Range와 Interval을 개별 useState로 관리하고 있습니다.
    // 하지만 "5분봉을 보다가 년봉 버튼을 눌렀다"면 range와 interval이 동시에 바뀌어야 합니다.
    // 이럴 때 setState가 두 번 발생하면 컴포넌트 렌더링도 두 번 발생할 여지가 있습니다.(React 18의 batching 렌더링 덕분에 지금은 큰 무리가 없긴 합니다).
    // 실무 개선 제안: `const [chartConfig, setChartConfig] = useState({ range: '6mo', interval: '1d' })` 처럼 
    // 관련된 상태들은 하나의 객체로 묶어 관리하는 것이 훨씬 응집도(Cohesion)가 높고 안전한 패턴입니다.
    const [range, setRange] = useState('6mo');
    const [interval, setInterval] = useState('1d');
    const [chartType, setChartType] = useState<'line' | 'candlestick'>('candlestick');

    const { stockData, isError, isLoading } = useStockSync(searchTicker, range, interval);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchTicker(ticker.toUpperCase());
    };

    const [showMinuteMenu, setShowMinuteMenu] = useState(false);

    // 기간 선택 옵션들 (공통 상수 사용)
    const minuteOptions = PERIOD_OPTIONS.MINUTE;
    const majorOptions = PERIOD_OPTIONS.MAJOR;

    // [학습 포인트: API Response 처리와 메모이제이션 실제 적용!!!]
    // 문제 원인: 사용자가 검색창에 "A"만 쳐도 (setTicker 동작) 현재 StockPage 컴포넌트 전체가 리렌더링됩니다.
    // 결과적으로 이 거대한 배열의 map 함수가 키보드를 칠 때마다 다시 실행되고, 새로운 배열 주소값이 Chart에 넘어가며 무거운 차트가 다시 그려집니다.
    // 해결책: `useMemo`를 사용하여 'stockData.historical' 원본 데이터가 바뀌지 않는 한, 배열을 다시 만들지 않도록 캐싱(Memoization)합니다.

    // ApexCharts 캔들차트 데이터 포맷팅
    const candleSeries = useMemo(() => [{
        name: '시세',
        data: stockData?.historical?.map(d => ({
            x: d.timestamp,
            y: [d.open, d.high, d.low, d.close]
        })) || []
    }], [stockData?.historical]);

    // ApexCharts 라인차트 데이터 포맷팅
    const lineSeries = useMemo(() => [{
        name: '종가',
        data: stockData?.historical?.map(d => ({
            x: d.timestamp,
            y: d.close
        })) || []
    }], [stockData?.historical]);

    // 메모이제이션된 차트 옵션
    const chartOptions = useMemo(() => getStockChartOptions(chartType), [chartType]);

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-3xl font-bold">주식 종목 검색</h2>

            {/* 검색창 UI */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder="종목 코드 입력 (예: AAPL, TSLA)"
                    className="p-2 border rounded-lg dark:bg-gray-800 dark:border-white/10 flex-1 lg:flex-none lg:w-64"
                />
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors">검색</button>
            </form>

            <hr className="border-white/10" />

            {/* 결과 출력 UI */}
            {isLoading && (
                <div className="flex justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            )}
            {isError && <p className="text-red-500 bg-red-500/10 p-4 rounded-lg">정보를 찾을 수 없습니다. (정확한 티커를 입력했는지 확인해 주세요)</p>}

            {stockData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* 주요 시세 카드 */}
                    <div className="p-6 border rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-sm shadow-xl transition-all hover:bg-black/10 dark:hover:bg-white/10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight">
                                    {stockData?.longName || stockData?.shortName || 'Unknown'}
                                    <span className="ml-2 text-gray-400 font-medium">{stockData?.symbol}</span>
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">시장 상태: <span className="text-blue-400 font-semibold">{getMarketStateName(stockData?.marketState)}</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-4xl font-black">${stockData?.regularMarketPrice?.toLocaleString() ?? '0.00'}</p>
                                <p className={`text-lg font-bold mt-1 ${(stockData?.regularMarketChange ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                                    {(stockData?.regularMarketChange ?? 0) >= 0 ? "▲" : "▼"}
                                    {Math.abs(stockData?.regularMarketChange ?? 0).toFixed(2)}
                                    ({stockData?.regularMarketChangePercent?.toFixed(2)}%)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 차트 컨트롤러 및 차트 영역 */}
                    <div className="p-6 border rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-sm relative">
                        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                            <div className="flex gap-2 bg-black/20 dark:bg-white/10 p-1 rounded-lg">
                                {/* 
                                   [분봉 드롭다운 메뉴 원리]
                                   - 왜 드롭다운을 썼을까?: 1분부터 60분까지 버튼을 다 나열하면 모바일 화면에서 줄바꿈이 일어나 지저분해집니다.
                                     따라서 '분봉' 하나로 묶고 누를 때만 열리도록(Progressive Disclosure) 개선했습니다.
                                   - UI 팁: 부모 div에 `relative`를 주고 하위 메뉴에 `absolute`를 주면 레이아웃이 깨지지 않고 메뉴폰 팝업처럼 뜹니다.
                                */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMinuteMenu(!showMinuteMenu)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${minuteOptions.some(opt => opt.interval === interval) ? 'bg-blue-500 text-white' : 'hover:bg-white/5 text-gray-400'}`}
                                    >
                                        {/* 선택된 분봉이 있으면 그 라벨('5분' 등)을 보여주고, 아니면 기본값 '분봉' 출력 */}
                                        {minuteOptions.find(opt => opt.interval === interval)?.label || '분봉'}
                                        <span className={`text-[10px] transition-transform ${showMinuteMenu ? 'rotate-180' : ''}`}>▼</span>
                                    </button>

                                    {showMinuteMenu && (
                                        <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <div className="grid grid-cols-2 p-2 gap-1 w-32">
                                                {minuteOptions.map((opt) => (
                                                    <button
                                                        key={opt.interval}
                                                        onClick={() => {
                                                            setRange(opt.range);
                                                            setInterval(opt.interval);
                                                            setShowMinuteMenu(false);
                                                        }}
                                                        className={`px-2 py-1.5 rounded-md text-xs font-medium text-center transition-all ${interval === opt.interval ? 'bg-blue-500 text-white' : 'hover:bg-white/10 text-gray-400'}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 
                                   [주요 기간 버튼들 (일, 주, 월, 년)]
                                   - 분봉과 다르게 이 버튼들은 핵심 지표라서 숨기지 않고 바깥에 그대로 노출합니다. 
                                */}
                                {majorOptions.map((opt) => (
                                    <button
                                        key={opt.range}
                                        onClick={() => {
                                            setRange(opt.range);
                                            setInterval(opt.interval);
                                            setShowMinuteMenu(false);
                                        }}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${range === opt.range && interval === opt.interval ? 'bg-blue-500 text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 bg-black/20 dark:bg-white/10 p-1 rounded-lg">
                                <button
                                    onClick={() => setChartType('candlestick')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${chartType === 'candlestick' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}
                                >
                                    캔들
                                </button>
                                <button
                                    onClick={() => setChartType('line')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${chartType === 'line' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
                                >
                                    라인
                                </button>
                            </div>
                        </div>

                        <div className="h-[400px] w-full">
                            <Chart
                                options={chartOptions}
                                series={chartType === 'candlestick' ? candleSeries : lineSeries}
                                type={chartType}
                                height="100%"
                            />
                        </div>
                    </div>

                    {/* 상세 정보 테이블 그리드 (확장 버전) */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[
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
                        ].map((item, idx) => (
                            <div key={idx} className="flex justify-between p-3 border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                <span className="text-sm text-gray-400 font-medium">{item.label}</span>
                                <span className="text-sm font-bold">{item.value ?? 'N/A'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}