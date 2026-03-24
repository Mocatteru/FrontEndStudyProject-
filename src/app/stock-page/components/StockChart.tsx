'use client'

import React, { useState, useMemo, memo } from "react";
import dynamic from "next/dynamic";
import { Stock, getStockChartOptions, PERIOD_OPTIONS } from "@/types/stock";
import { cn } from "@/lib/utils";
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
 * - [Senior Optimization] React.memo를 적용하여 부모의 상태 변화(예: 사이드바 토글) 시 차트가 다시 그려지는 것을 방지합니다.
 */
const StockChart = memo(({ stockData, range, interval, onConfigChange }: StockChartProps) => {
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
    }, [stockData.historical, chartType]);

    const chartOptions = useMemo(() => getStockChartOptions(chartType, stockData.currency), [chartType, stockData.currency]);

    return (
        <div className="p-4 sm:p-8 border-none rounded-[3.5rem] bg-card/40 backdrop-blur-xl relative transition-all w-full overflow-hidden shadow-2xl">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/40">시장 흐름 분석</span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tighter text-foreground/80">차트 분석</h2>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    {/* 기간 설정 영역 - [Tactical Design Update] */}
                    <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-black/5 dark:border-white/5 shrink-0">
                        {/* 분봉 드롭다운 */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMinuteMenu(!showMinuteMenu)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-transparent shadow-sm",
                                    minuteOptions.some(opt => opt.interval === interval) 
                                        ? "bg-blue-500 text-white shadow-blue-500/20" 
                                        : "hover:bg-white/5 text-muted-foreground/40 hover:text-foreground"
                                )}
                            >
                                {minuteOptions.find(opt => opt.interval === interval)?.label || '분봉'}
                                <span className={cn("text-[8px] transition-transform duration-500", showMinuteMenu ? "rotate-180" : "")}>▼</span>
                            </button>

                            {showMinuteMenu && (
                                <div className="absolute top-full left-0 mt-3 bg-card/95 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 min-w-[120px] p-2">
                                    <div className="flex flex-col gap-1.5">
                                        {minuteOptions.map((opt) => (
                                            <button
                                                key={opt.interval}
                                                onClick={() => {
                                                    onConfigChange(opt.range, opt.interval);
                                                    setShowMinuteMenu(false);
                                                }}
                                                className={cn(
                                                    "w-full px-3 py-2.5 rounded-xl text-[10px] font-black text-left transition-all duration-300 uppercase tracking-tighter",
                                                    interval === opt.interval 
                                                        ? "bg-blue-500 text-white shadow-xl shadow-blue-500/20" 
                                                        : "hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground/40"
                                                )}
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
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent",
                                    range === opt.range && interval === opt.interval 
                                        ? "bg-blue-500 text-white shadow-xl shadow-blue-500/20" 
                                        : "hover:bg-white/5 text-muted-foreground/40 hover:text-foreground"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* 차트 타입 스위처 - [High-End UI Update] */}
                    <div className="flex bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-black/5 dark:border-white/5 shrink-0 ml-auto lg:ml-0">
                        <button
                            onClick={() => setChartType('candlestick')}
                            className={cn(
                                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 active:scale-90",
                                chartType === 'candlestick' 
                                    ? "bg-red-500 text-white shadow-xl shadow-red-500/30 border border-red-500/20 scale-105" 
                                    : "text-muted-foreground/30 hover:text-muted-foreground"
                            )}
                        >
                            캔들
                        </button>
                        <button
                            onClick={() => setChartType('line')}
                            className={cn(
                                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 active:scale-90",
                                chartType === 'line' 
                                    ? "bg-blue-500 text-white shadow-xl shadow-blue-500/30 border border-blue-500/20 scale-105" 
                                    : "text-muted-foreground/30 hover:text-muted-foreground"
                            )}
                        >
                            라인
                        </button>
                    </div>
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
});

StockChart.displayName = 'StockChart';

export default StockChart;
