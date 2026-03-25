'use client'

import React, { useState, useEffect, useRef, memo } from "react";
import { Stock, PERIOD_OPTIONS } from "@/types/stock";
import { cn } from "@/lib/utils";
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CandlestickData, LineData, CandlestickSeries, LineSeries, MouseEventParams } from "lightweight-charts";

interface StockChartProps {
    stockData: Stock;
    range: string;
    interval: string;
    onConfigChange: (range: string, interval: string) => void;
}

/**
 * [StockChart 컴포넌트]
 * - 역할: 주가 추세를 캔들/라인 차트로 시각화하며, 기간 및 간격 조절 UI를 포함합니다.
 * - [Lightweight Migration] 기존 무거운 ApexCharts 대신 트레이딩뷰의 lightweight-charts로 전면 교체하여 
 *   엄청난 퍼포먼스 향상과 부드러운 핀치 줌을 지원합니다.
 */
const StockChart = memo(({ stockData, range, interval, onConfigChange }: StockChartProps) => {
    const [chartType, setChartType] = useState<'line' | 'candlestick'>('candlestick');
    const [showMinuteMenu, setShowMinuteMenu] = useState(false);

    const minuteOptions = PERIOD_OPTIONS.MINUTE;
    const majorOptions = PERIOD_OPTIONS.MAJOR;

    // 차트 컨테이너와 툴팁을 관리하기 위한 Ref
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Line"> | ISeriesApi<"Candlestick"> | null>(null);

    // 1. 차트 인스턴스 초기화 (Mount)
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: '#374151', style: 2 }, // 2 = Dashed
                horzLines: { color: '#374151', style: 2 },
            },
            localization: {
                // [Senior Fix] 툴팁 및 X축 라벨의 시간 변환 로직을 일관성 있게 통일 (Unix Timestamp 초 단위 기반)
                timeFormatter: (time: Time) => {
                    const d = new Date((time as number) * 1000);
                    return `${d.getFullYear().toString().slice(2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                }
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#374151',
                // [Bug Fix] X축 하단 틱(Tick) 텍스트가 봉 시간과 다르게 나오는 문제를 해결
                tickMarkFormatter: (time: Time) => {
                    const d = new Date((time as number) * 1000);
                    // 분봉일 경우 시간을, 일봉 이상일 경우 날짜를 우선적으로 보여줌
                    const hours = String(d.getHours()).padStart(2, '0');
                    const minutes = String(d.getMinutes()).padStart(2, '0');
                    if (hours === '00' && minutes === '00') {
                        return `${String(d.getMonth() + 1)}/${String(d.getDate())}`;
                    }
                    return `${hours}:${minutes}`;
                },
            },
            rightPriceScale: {
                borderColor: '#374151',
                autoScale: true,
            },
            autoSize: true, // ResizeObserver를 통한 반응형 지원
            crosshair: {
                mode: 1, // Magnet mode
                vertLine: {
                    labelVisible: false // 커스텀 툴팁을 쓸거라 시간 라벨은 가림
                }
            }
        });

        chartRef.current = chart;

        return () => {
            // [Senior Fix] 언마운트 시 참조를 명시적으로 해제하여 메모리 릭과 좀비 참조 에러 원천 차단
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
            if (seriesRef.current) {
                seriesRef.current = null;
            }
        };
    }, []);

    // 2. 데이터 업데이트 및 차트 타입 변경 감지하여 시리즈(Series) 교체
    useEffect(() => {
        if (!chartRef.current || !stockData || !stockData.historical) return;

        const currentChart = chartRef.current;

        // [Bug Fix] Currency 포맷팅이 첫 렌더링 값(Closure)에 갇히는 문제 해결
        currentChart.applyOptions({
            localization: {
                priceFormatter: (price: number) => {
                    if (stockData.currency === 'KRW') return Math.round(price).toLocaleString('ko-KR') + '원';
                    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            }
        });

        // 기존 시리즈 클린업
        if (seriesRef.current) {
            try {
                currentChart.removeSeries(seriesRef.current);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                // Next.js Dev 환경에서 console.error 호출 시 브라우저에 붉은 에러 오버레이가 출력되므로 조용히 무시(Swallow)합니다.
                // 이미 언마운트되어 제거되었거나 시점 차이인 경우이므로 무시해도 안전합니다.
            }
            seriesRef.current = null;
        }

        const isMs = stockData.historical.length > 0 && stockData.historical[0].timestamp > 10000000000;
        const dataMap = new Map<Time, CandlestickData<Time> | LineData<Time>>();

        stockData.historical.forEach(d => {
            const timeVal = Math.floor(d.timestamp / (isMs ? 1000 : 1)) as Time;

            if (chartType === 'candlestick') {
                dataMap.set(timeVal, {
                    time: timeVal,
                    open: d.open,
                    high: d.high,
                    low: d.low,
                    close: d.close,
                });
            } else {
                dataMap.set(timeVal, {
                    time: timeVal,
                    value: d.close,
                });
            }
        });

        const sortedData = Array.from(dataMap.values()).sort((a, b) => (a.time as number) - (b.time as number));
        if (sortedData.length === 0) return;

        if (chartType === 'candlestick') {
            const series = currentChart.addSeries(CandlestickSeries, {
                upColor: '#ef4444',
                downColor: '#3b82f6',
                borderVisible: false,
                wickUpColor: '#ef4444',
                wickDownColor: '#3b82f6',
            });
            series.setData(sortedData as CandlestickData<Time>[]);
            seriesRef.current = series;
        } else {
            const series = currentChart.addSeries(LineSeries, {
                color: '#3b82f6',
                lineWidth: 2,
            });
            series.setData(sortedData as LineData<Time>[]);
            seriesRef.current = series;
        }

        currentChart.timeScale().fitContent();

        // 3. 커스텀 툴팁 (Hover 플로팅 창) 처리 [Senior Refactoring]
        currentChart.subscribeCrosshairMove((param: MouseEventParams) => {
            if (!tooltipRef.current || !chartContainerRef.current || !seriesRef.current) return;

            const toolTip = tooltipRef.current;

            if (param.point === undefined || !param.time || param.point.x < 0 || param.point.x > chartContainerRef.current.clientWidth || param.point.y < 0 || param.point.y > chartContainerRef.current.clientHeight) {
                toolTip.style.opacity = '0';
                toolTip.style.pointerEvents = 'none';
                return;
            }

            const data = param.seriesData.get(seriesRef.current) as CandlestickData<Time> | LineData<Time> | undefined;
            if (!data) {
                toolTip.style.opacity = '0';
                return;
            }

            const d = new Date((param.time as number) * 1000);
            const dateStr = `${d.getFullYear().toString().slice(2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

            const formatPrice = (p: number) => {
                if (stockData.currency === 'KRW') return Math.round(p).toLocaleString('ko-KR') + '원';
                return '$' + p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };

            const getPercentChange = (target: number, base: number) => {
                const change = ((target - base) / base) * 100;
                const color = change > 0 ? 'text-red-500' : change < 0 ? 'text-blue-500' : 'text-gray-400';
                const sign = change > 0 ? '+' : '';
                return `<span class="${color} font-bold ml-1 text-[10px]">(${sign}${change.toFixed(2)}%)</span>`;
            };

            if (chartType === 'candlestick') {
                const candle = data as CandlestickData<Time>;

                toolTip.innerHTML = `
                    <div class="text-[11px] space-y-2">
                        <div class="text-gray-400 mb-3 border-b border-gray-700 pb-2 font-bold tracking-tight">${dateStr}</div>
                        <div class="flex justify-between items-center gap-6">
                            <span class="text-gray-400">시가</span>
                            <span class="text-white">${formatPrice(candle.open)}</span>
                        </div>
                        <div class="flex justify-between items-center gap-6">
                            <span class="text-gray-400">고가</span>
                            <span class="text-white flex items-center justify-end">${formatPrice(candle.high)}${getPercentChange(candle.high, candle.open)}</span>
                        </div>
                        <div class="flex justify-between items-center gap-6">
                            <span class="text-gray-400">저가</span>
                            <span class="text-white flex items-center justify-end">${formatPrice(candle.low)}${getPercentChange(candle.low, candle.open)}</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-t border-gray-700/50 mt-1 gap-6">
                            <span class="text-gray-400 font-bold">종가</span>
                            <span class="text-white font-black flex items-center justify-end">${formatPrice(candle.close)}${getPercentChange(candle.close, candle.open)}</span>
                        </div>
                    </div>
                `;
            } else {
                const line = data as LineData<Time>;
                toolTip.innerHTML = `
                    <div class="text-[11px] space-y-2">
                        <div class="text-gray-400 mb-3 border-b border-gray-700 pb-2 font-bold tracking-tight">${dateStr}</div>
                        <div class="flex justify-between items-center gap-6">
                            <span class="text-gray-400 font-bold">종가</span>
                            <span class="text-white font-black whitespace-nowrap">${formatPrice(line.value)}</span>
                        </div>
                    </div>
                `;
            }

            const coordinate = seriesRef.current.priceToCoordinate(chartType === 'candlestick' ? (data as CandlestickData<Time>).close : (data as LineData<Time>).value);
            let shiftedX = param.point.x + 20;
            // 우측 튀어나감 방지
            if (shiftedX > chartContainerRef.current.clientWidth - 180) {
                shiftedX = param.point.x - 180;
            }

            let shiftedY = coordinate ? coordinate - 40 : param.point.y;

            // 상단 튀어나감 방지
            if (shiftedY < 10) {
                shiftedY = 10;
            }

            // 하단 튀어나감 방지 (툴팁이 잘리지 않도록 동적으로 계산)
            const maxTop = chartContainerRef.current.clientHeight - toolTip.clientHeight - 10;
            if (shiftedY > maxTop) {
                shiftedY = maxTop;
            }

            toolTip.style.left = shiftedX + 'px';
            toolTip.style.top = shiftedY + 'px';
            toolTip.style.opacity = '1';
            toolTip.style.pointerEvents = 'none';
        });

    }, [stockData, chartType]);

    return (
        <div className="p-4 sm:p-8 border-none rounded-[3.5rem] bg-card/40 backdrop-blur-xl relative transition-all w-full overflow-hidden shadow-2xl">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                <div className="flex flex-col gap-2">

                    <h2 className="text-2xl font-black tracking-tighter text-foreground/80">차트</h2>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    {/* 기간 설정 영역 */}
                    <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-black/5 dark:border-white/5 shrink-0 z-50">
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
                                <div className="absolute top-full left-0 mt-3 bg-card/95 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 min-w-[120px] p-2">
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

                    {/* 차트 타입 스위처 */}
                    <div className="flex bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-black/5 dark:border-white/5 shrink-0 ml-auto lg:ml-0 z-40">
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

            <div className="h-[400px] w-full relative" ref={chartContainerRef}>
                {/* 커스텀 툴팁 컨테이너 */}
                <div
                    ref={tooltipRef}
                    className="absolute z-50 p-4 bg-gray-900/95 border border-gray-700/50 rounded-2xl shadow-2xl backdrop-blur-md opacity-0 transition-opacity duration-200"
                    style={{ position: 'absolute', pointerEvents: 'none' }}
                />
            </div>
        </div>
    );
});

StockChart.displayName = 'StockChart';

export default StockChart;
