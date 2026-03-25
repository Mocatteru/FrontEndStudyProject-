'use client'

import React, { useState, useEffect, useRef, memo } from "react";
import { Stock, PERIOD_OPTIONS } from "@/types/stock";
import { cn } from "@/lib/utils";
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CandlestickData, LineData, CandlestickSeries, LineSeries, MouseEventParams } from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

interface StockChartProps {
    stockData: Stock;
    range: string;
    interval: string;
    onConfigChange: (range: string, interval: string) => void;
}

const StockChart = memo(({ stockData, range, interval, onConfigChange }: StockChartProps) => {
    const [chartType, setChartType] = useState<'line' | 'candlestick'>('candlestick');

    const minuteOptions = PERIOD_OPTIONS.MINUTE;
    const majorOptions = PERIOD_OPTIONS.MAJOR;

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Line"> | ISeriesApi<"Candlestick"> | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: '#374151', style: 2 },
                horzLines: { color: '#374151', style: 2 },
            },
            localization: {
                timeFormatter: (time: Time) => {
                    const d = new Date((time as number) * 1000);
                    return `${d.getFullYear().toString().slice(2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                }
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#374151',
                tickMarkFormatter: (time: Time) => {
                    const d = new Date((time as number) * 1000);
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
            autoSize: true,
            crosshair: {
                mode: 1,
                vertLine: {
                    labelVisible: false
                }
            }
        });

        chartRef.current = chart;

        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
            if (seriesRef.current) {
                seriesRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!chartRef.current || !stockData || !stockData.historical) return;

        const currentChart = chartRef.current;

        currentChart.applyOptions({
            localization: {
                priceFormatter: (price: number) => {
                    if (stockData.currency === 'KRW') return Math.round(price).toLocaleString('ko-KR') + '원';
                    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            }
        });

        if (seriesRef.current) {
            try {
                currentChart.removeSeries(seriesRef.current);
            } catch (e) {
                // Ignore
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
                        <div class="text-white/70 mb-3 border-b border-white/10 pb-2 font-black tracking-tight uppercase italic">${dateStr}</div>
                        <div class="flex justify-between items-center gap-8">
                            <span class="text-white/40 font-bold">시가</span>
                            <span class="text-white font-black">${formatPrice(candle.open)}</span>
                        </div>
                        <div class="flex justify-between items-center gap-8">
                            <span class="text-white/40 font-bold">고가</span>
                            <span class="text-white font-black flex items-center justify-end">${formatPrice(candle.high)}${getPercentChange(candle.high, candle.open)}</span>
                        </div>
                        <div class="flex justify-between items-center gap-8">
                            <span class="text-white/40 font-bold">저가</span>
                            <span class="text-white font-black flex items-center justify-end">${formatPrice(candle.low)}${getPercentChange(candle.low, candle.open)}</span>
                        </div>
                        <div class="flex justify-between items-center py-1.5 border-t border-white/5 mt-1.5 gap-8">
                            <span class="text-white/60 font-black italic">종가</span>
                            <span class="text-white font-black flex items-center justify-end">${formatPrice(candle.close)}${getPercentChange(candle.close, candle.open)}</span>
                        </div>
                    </div>
                `;
            } else {
                const line = data as LineData<Time>;
                toolTip.innerHTML = `
                    <div class="text-[11px] space-y-2">
                        <div class="text-white/70 mb-3 border-b border-white/10 pb-2 font-black tracking-tight uppercase italic">${dateStr}</div>
                        <div class="flex justify-between items-center gap-8">
                            <span class="text-white/60 font-black italic">종가</span>
                            <span class="text-white font-black whitespace-nowrap">${formatPrice(line.value)}</span>
                        </div>
                    </div>
                `;
            }

            const coordinate = seriesRef.current.priceToCoordinate(chartType === 'candlestick' ? (data as CandlestickData<Time>).close : (data as LineData<Time>).value);
            let shiftedX = param.point.x + 20;
            if (shiftedX > chartContainerRef.current.clientWidth - 180) {
                shiftedX = param.point.x - 180;
            }

            let shiftedY = coordinate ? coordinate - 40 : param.point.y;
            if (shiftedY < 10) {
                shiftedY = 10;
            }

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
                    <h2 className="text-2xl font-black tracking-tighter text-foreground/80 lowercase italic">Chart</h2>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-black/5 dark:border-white/5 shrink-0 z-50">
                        <Popover>
                            <PopoverTrigger
                                className={cn(
                                    "inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-[10px] font-black uppercase tracking-widest transition-all outline-none select-none h-9 px-4 gap-2",
                                    minuteOptions.some(opt => opt.interval === interval)
                                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                        : "hover:bg-white/10 text-muted-foreground/40 hover:text-foreground"
                                )}
                            >
                                {minuteOptions.find(opt => opt.interval === interval)?.label || '분봉'}
                                <ChevronDown className="size-3" />
                            </PopoverTrigger>
                            <PopoverContent className="w-32 p-1.5 bg-card/95 backdrop-blur-2xl border-black/10 dark:border-white/10 rounded-2xl shadow-2xl" align="start">
                                <div className="flex flex-col gap-1">
                                    {minuteOptions.map((opt) => (
                                        <Button
                                            key={opt.interval}
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onConfigChange(opt.range, opt.interval)}
                                            className={cn(
                                                "w-full justify-start h-9 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all",
                                                interval === opt.interval
                                                    ? "bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/10"
                                                    : "hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground/60"
                                            )}
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {majorOptions.map((opt) => (
                            <Button
                                key={opt.label}
                                variant="ghost"
                                size="sm"
                                onClick={() => onConfigChange(opt.range, opt.interval)}
                                className={cn(
                                    "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    range === opt.range && interval === opt.interval
                                        ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                                        : "hover:bg-white/10 text-muted-foreground/40 hover:text-foreground"
                                )}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>

                    <div className="flex bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-black/5 dark:border-white/5 shrink-0 ml-auto lg:ml-0 z-40">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setChartType('candlestick')}
                            className={cn(
                                "h-9 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                                chartType === 'candlestick'
                                    ? "bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-500/30 border border-red-500/20 scale-105"
                                    : "text-muted-foreground/30 hover:text-muted-foreground"
                            )}
                        >
                            캔들
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setChartType('line')}
                            className={cn(
                                "h-9 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                                chartType === 'line'
                                    ? "bg-blue-500 text-white hover:bg-blue-600 shadow-xl shadow-blue-500/30 border border-blue-500/20 scale-105"
                                    : "text-muted-foreground/30 hover:text-muted-foreground"
                            )}
                        >
                            라인
                        </Button>
                    </div>
                </div>
            </div>

            <div className="h-[400px] w-full relative" ref={chartContainerRef}>
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
