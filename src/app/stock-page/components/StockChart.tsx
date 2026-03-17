'use client'

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Stock, getStockChartOptions, PERIOD_OPTIONS } from "@/types/stock";

// ApexCharts SSR 대응
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface StockChartProps {
    stockData: Stock;
    range: string;
    interval: string;
    onConfigChange: (range: string, interval: string) => void;
}

/**
 * [StockChart 컴포넌트]
 * - 역할: 주가 추세를 캔들/라인 차트로 시각화하며, 기간 및 간격 조절 UI를 포함합니다.
 * - 학습 포인트 (State vs Props Relationship):
 *   차트의 '데이터(stockData)'는 부모로부터 받지만, '차트 타입(Line/Candle)'은 
 *   이 컴포넌트 내부에서만 쓰이므로 내부 state로 관리하여 불필요한 부모 리렌더링을 방지합니다. (로컬 상태 최적화)
 */
export default function StockChart({ stockData, range, interval, onConfigChange }: StockChartProps) {
    const [chartType, setChartType] = useState<'line' | 'candlestick'>('candlestick');
    const [showMinuteMenu, setShowMinuteMenu] = useState(false);

    const minuteOptions = PERIOD_OPTIONS.MINUTE;
    const majorOptions = PERIOD_OPTIONS.MAJOR;

    // 데이터 포맷팅 메모이제이션
    const series = useMemo(() => {
        if (chartType === 'candlestick') {
            return [{
                name: '시세',
                data: stockData?.historical?.map(d => ({
                    x: d.timestamp,
                    y: [d.open, d.high, d.low, d.close]
                })) || []
            }];
        }
        return [{
            name: '종가',
            data: stockData?.historical?.map(d => ({
                x: d.timestamp,
                y: d.close
            })) || []
        }];
    }, [stockData?.historical, chartType]);

    const chartOptions = useMemo(() => getStockChartOptions(chartType), [chartType]);

    return (
        <div className="p-6 border rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-sm relative transition-all">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                {/* 기간 설정 영역 */}
                <div className="flex gap-2 bg-black/20 dark:bg-white/10 p-1 rounded-lg">
                    {/* 분봉 드롭다운 */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMinuteMenu(!showMinuteMenu)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${minuteOptions.some(opt => opt.interval === interval) ? 'bg-blue-500 text-white' : 'hover:bg-white/5 text-gray-400'}`}
                        >
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
                                                onConfigChange(opt.range, opt.interval);
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

                    {/* 주요 기간 버튼 */}
                    {majorOptions.map((opt) => (
                        <button
                            key={opt.label}
                            onClick={() => {
                                onConfigChange(opt.range, opt.interval);
                                setShowMinuteMenu(false);
                            }}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${range === opt.range && interval === opt.interval ? 'bg-blue-500 text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* 차트 타입 스위처 */}
                <div className="flex gap-2 bg-black/20 dark:bg-white/10 p-1 rounded-lg">
                    <button
                        onClick={() => setChartType('candlestick')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${chartType === 'candlestick' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white'}`}
                    >
                        캔들
                    </button>
                    <button
                        onClick={() => setChartType('line')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${chartType === 'line' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'}`}
                    >
                        라인
                    </button>
                </div>
            </div>

            <div className="h-[400px] w-full">
                <Chart
                    options={chartOptions}
                    series={series}
                    type={chartType}
                    height="100%"
                />
            </div>
        </div>
    );
}
