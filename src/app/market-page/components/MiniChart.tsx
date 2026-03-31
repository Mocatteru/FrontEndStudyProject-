'use client'

import { useEffect, useRef, memo } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, Time, AreaSeries } from "lightweight-charts";
import { Stock } from "@/types/stock";

interface MiniChartProps {
    data: Stock['historical'];
    color?: string;
}

const MiniChart = memo(({ data, color = "#3b82f6" }: MiniChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
    useEffect(() => {
        if (!containerRef.current || !data?.length) return;

        const chart = createChart(containerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: 'transparent',
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
            },
            rightPriceScale: { visible: false },
            leftPriceScale: { visible: false },
            timeScale: { visible: false },
            handleScroll: false,
            handleScale: false,
            crosshair: {
                vertLine: { visible: false },
                horzLine: { visible: false },
            },
        });

        const areaSeries = chart.addSeries(AreaSeries, {
            lineColor: color,
            topColor: `${color}33`,
            bottomColor: `${color}00`,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        const chartData = data
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(d => ({
                time: (d.timestamp > 10000000000 ? Math.floor(d.timestamp / 1000) : d.timestamp) as Time,
                value: d.close,
            }));

        areaSeries.setData(chartData);
        chart.timeScale().fitContent();

        chartRef.current = chart;
        seriesRef.current = areaSeries;

        const handleResize = () => {
            if (containerRef.current) {
                chart.applyOptions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, color]);

    return <div ref={containerRef} className="w-full h-full" />;
});

MiniChart.displayName = 'MiniChart';
export default MiniChart;
