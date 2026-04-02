'use client'

import {
    useEffect, useRef, memo, useMemo
} from "react";
import {
    createChart, ColorType,
    IChartApi, ISeriesApi,
    Time, CandlestickData,
    CandlestickSeries,
    MouseEventParams, LogicalRange, SeriesMarker,
    createSeriesMarkers, ISeriesMarkersPluginApi,
} from "lightweight-charts";
import { Stock } from "@/types/stock";

// ── 차트 공통 옵션 (상수 추출: 매 렌더마다 객체 재생성 방지) ──
const CHART_OPTIONS: Parameters<typeof createChart>[1] = {
    layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b7280',
    },
    grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
    },
    crosshair: { mode: 1 },
    rightPriceScale: {
        borderColor: 'rgba(55,65,81,0.4)',
        autoScale: true,
        borderVisible: true,
        minimumWidth: 90,
    },
    leftPriceScale: { visible: false },
    timeScale: {
        visible: true,
        secondsVisible: false,
        borderColor: 'rgba(55,65,81,0.4)',
    },
    autoSize: true,
    handleScroll: true,
    handleScale: true,
};

// ── 가격 포매터 ────────────────────────────────────
function buildPriceFormatter(symbol: string, currency: string, closes: number[]) {
    // 한국 주식 종목 식별 (지수 '^' 와 환율 '=X' 이 아닌 KRW)
    const isKrStock = currency === 'KRW' && !symbol.startsWith('^') && !symbol.includes('=X');
    
    const lastClose = closes[closes.length - 1] ?? 0;
    const isPenny = !isKrStock && lastClose < 1;
    const minMove = isKrStock ? 1 : isPenny ? 0.001 : 0.01;

    const formatter = (p: number): string => {
        if (isKrStock) return Math.round(p).toLocaleString('ko-KR') + '원';
        const digits = isPenny ? 3 : 2;
        return p.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    };

    return { formatter, minMove };
}

// ── Props ──────────────────────────────────────────
interface MarketMainChartProps {
    stockData: Stock;
    symbol?: string; // 식별자 전달
}

// ── 메인 차트 컴포넌트: 캔들 + 고점/저점 마커만 ──
const MarketMainChart = memo(({ stockData, symbol = "" }: MarketMainChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const priceSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

    // ── 1) 차트 초기화 (마운트 1회) ──────────────
    useEffect(() => {
        if (!containerRef.current) return;

        const chart = createChart(containerRef.current, CHART_OPTIONS);
        chartRef.current = chart;

        return () => {
            chart.remove();
            chartRef.current = null;
            priceSeriesRef.current = null;
            markersRef.current = null;
        };
    }, []);

    // ── 2) 데이터 로드 시 시리즈 갱신 ──────────────
    const processedData = useMemo(() => {
        if (!stockData?.historical?.length) return null;

        const raw = [...stockData.historical].sort((a, b) => a.timestamp - b.timestamp);
        const closes = raw.map(d => d.close);
        const isMs = raw[0].timestamp > 10_000_000_000;
        const times = raw.map(d => Math.floor(d.timestamp / (isMs ? 1000 : 1)) as Time);

        return { raw, closes, times, isMs };
    }, [stockData]);

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || !processedData) return;

        const { raw, closes, times, isMs } = processedData;
        const { formatter, minMove } = buildPriceFormatter(symbol, stockData.currency, closes);
        const priceFormat = { type: 'custom' as const, formatter, minMove };

        // 일봉 vs 분봉 판별 (데이터 평균 간격이 20시간 이상이면 일봉)
        const avgDiff = times.length > 1 ? (times[times.length - 1] as number - (times[0] as number)) / (times.length - 1) : 86400;
        const isDaily = avgDiff > 72000;

        // 크로스헤어 툴팁 및 시간축 설정 업데이트
        chart.applyOptions({
            localization: {
                timeFormatter: (time: Time) => {
                    const d = new Date((time as number) * 1000);
                    const yy = String(d.getFullYear()).slice(2);
                    const mo = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const hh = String(d.getHours()).padStart(2, '0');
                    const mm = String(d.getMinutes()).padStart(2, '0');
                    return isDaily ? `${yy}/${mo}/${dd}` : `${yy}/${mo}/${dd} ${hh}:${mm}`;
                }
            },
            timeScale: {
                timeVisible: !isDaily,
            }
        });

        // 기존 시리즈 제거
        if (priceSeriesRef.current) {
            try { chart.removeSeries(priceSeriesRef.current); } catch { /* 무시 */ }
        }

        // 캔들스틱 시리즈 추가
        const priceS = chart.addSeries(CandlestickSeries, {
            upColor: '#ef4444', downColor: '#3b82f6',
            borderVisible: false,
            wickUpColor: '#ef4444', wickDownColor: '#3b82f6',
            priceFormat,
        });

        priceS.setData(raw.map((d, i) => ({
            time: times[i],
            open: d.open, high: d.high, low: d.low, close: d.close,
        })));
        priceSeriesRef.current = priceS;
        
        // 마커 초기화
        markersRef.current = createSeriesMarkers(priceS, []);
        chart.timeScale().fitContent();

        // ── 고점/저점 마커 업데이트 (가시 범위 기반) ──
        let markerRafId = -1;
        const currentPrice = stockData.regularMarketPrice || closes[closes.length - 1];

        const padText = (text: string, barIdx: number, lr: LogicalRange) => {
            const total = lr.to - lr.from;
            if (total <= 0) return text;
            const ratio = (barIdx - lr.from) / total;
            const spaceStr = '\u2002'.repeat(Math.floor(text.length * 1.5));
            if (ratio < 0.15) return spaceStr + text;
            if (ratio > 0.85) return text + spaceStr;
            return text;
        };

        const updateMarkers = (lr: LogicalRange | null) => {
            if (markerRafId !== -1) return;
            markerRafId = requestAnimationFrame(() => {
                markerRafId = -1;
                if (!lr || !raw.length) return;

                const from = Math.max(0, Math.floor(lr.from));
                const to = Math.min(raw.length - 1, Math.ceil(lr.to));
                if (from > to || to < 0) return;
                
                const visible = raw.slice(from, to + 1);
                if (!visible.length) return;

                let maxBar = visible[0];
                let minBar = visible[0];
                for (let i = 1; i < visible.length; i++) {
                    if (visible[i].high > maxBar.high) maxBar = visible[i];
                    if (visible[i].low < minBar.low) minBar = visible[i];
                }

                const maxPct = ((maxBar.high - currentPrice) / currentPrice * 100).toFixed(2);
                const minPct = ((minBar.low - currentPrice) / currentPrice * 100).toFixed(2);
                
                const maxRawText = `최고 ${formatter(maxBar.high)} (${maxPct}%)`;
                const minRawText = `최저 ${formatter(minBar.low)} (${minPct}%)`;

                const markers: SeriesMarker<Time>[] = [
                    {
                        time: Math.floor(maxBar.timestamp / (isMs ? 1000 : 1)) as Time,
                        position: 'aboveBar', color: '#ef4444', shape: 'arrowDown',
                        text: padText(maxRawText, raw.indexOf(maxBar), lr),
                        size: 1,
                    },
                    {
                        time: Math.floor(minBar.timestamp / (isMs ? 1000 : 1)) as Time,
                        position: 'belowBar', color: '#3b82f6', shape: 'arrowUp',
                        text: padText(minRawText, raw.indexOf(minBar), lr),
                        size: 1,
                    },
                ];
                markersRef.current?.setMarkers(markers);
            });
        };

        chart.timeScale().subscribeVisibleLogicalRangeChange(updateMarkers);
        updateMarkers(chart.timeScale().getVisibleLogicalRange());

        // ── 툴팁 ──────────────────────────────────
        const handleCrosshair = (param: MouseEventParams) => {
            const tip = tooltipRef.current;
            const container = containerRef.current;
            if (!tip || !container || !priceSeriesRef.current) return;

            if (!param.point || !param.time ||
                param.point.x < 0 || param.point.x > container.clientWidth ||
                param.point.y < 0 || param.point.y > container.clientHeight) {
                tip.style.opacity = '0'; return;
            }

            const data = param.seriesData.get(priceSeriesRef.current) as CandlestickData<Time> | undefined;
            if (!data) { tip.style.opacity = '0'; return; }

            const d = new Date((param.time as number) * 1000);
            const dateStr = `${String(d.getFullYear()).slice(2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

            const elDate = tip.querySelector<HTMLElement>('[data-tip="date"]');
            const elOpen = tip.querySelector<HTMLElement>('[data-tip="open-val"]');
            const elHigh = tip.querySelector<HTMLElement>('[data-tip="high-val"]');
            const elHighPct = tip.querySelector<HTMLElement>('[data-tip="high-pct"]');
            const elLow = tip.querySelector<HTMLElement>('[data-tip="low-val"]');
            const elLowPct = tip.querySelector<HTMLElement>('[data-tip="low-pct"]');
            const elClose = tip.querySelector<HTMLElement>('[data-tip="close-val"]');
            const elClosePct = tip.querySelector<HTMLElement>('[data-tip="close-pct"]');

            const pctColor = (change: number) => change > 0 ? '#ef4444' : change < 0 ? '#3b82f6' : 'rgba(255,255,255,0.4)';
            const pctText = (t: number, b: number) => {
                const ch = ((t - b) / b) * 100;
                return { text: `(${ch > 0 ? '+' : ''}${ch.toFixed(2)}%)`, color: pctColor(ch) };
            };

            if (elDate) elDate.textContent = dateStr;
            if (elOpen) elOpen.textContent = formatter(data.open);
            
            const hPct = pctText(data.high, data.open);
            if (elHigh) elHigh.textContent = formatter(data.high);
            if (elHighPct) { elHighPct.textContent = hPct.text; elHighPct.style.color = hPct.color; }
            
            const lPct = pctText(data.low, data.open);
            if (elLow) elLow.textContent = formatter(data.low);
            if (elLowPct) { elLowPct.textContent = lPct.text; elLowPct.style.color = lPct.color; }
            
            const cPct = pctText(data.close, data.open);
            if (elClose) elClose.textContent = formatter(data.close);
            if (elClosePct) { elClosePct.textContent = cPct.text; elClosePct.style.color = cPct.color; }

            const coord = priceSeriesRef.current.priceToCoordinate(data.close);
            let x = param.point.x + 16;
            if (x > container.clientWidth - 190) x = param.point.x - 194;
            let y = coord ? coord - 30 : param.point.y;
            if (y < 10) y = 10;
            const maxY = container.clientHeight - tip.clientHeight - 10;
            if (y > maxY) y = maxY;
            tip.style.transform = `translate(${x}px, ${y}px)`;
            tip.style.opacity = '1';
        };

        chart.subscribeCrosshairMove(handleCrosshair);
        return () => {
            chart.unsubscribeCrosshairMove(handleCrosshair);
            chart.timeScale().unsubscribeVisibleLogicalRangeChange(updateMarkers);
            if (markerRafId !== -1) cancelAnimationFrame(markerRafId);
        };
    }, [processedData, stockData, symbol]);

    return (
        <div className="w-full h-[400px] relative">
            <div ref={containerRef} className="w-full h-full" />

            {/* 경량 툴팁: DOM 구조 미리 선언, textContent만 주입 */}
            <div
                ref={tooltipRef}
                className="absolute z-50 p-3 bg-slate-900/90 dark:bg-black/70 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-sm opacity-0 will-change-transform text-[11px]"
                style={{ pointerEvents: 'none', top: 0, left: 0 }}
            >
                <div data-tip="date" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 7, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 900 }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', gap: '4px 12px', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>시가</span>
                    <span data-tip="open-val" style={{ color: '#fff', fontWeight: 900, textAlign: 'right' }} />
                    <span />

                    <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>고가</span>
                    <span data-tip="high-val" style={{ color: '#ef4444', fontWeight: 900, textAlign: 'right' }} />
                    <span data-tip="high-pct" style={{ fontSize: '9px', fontWeight: 900 }} />

                    <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>저가</span>
                    <span data-tip="low-val" style={{ color: '#3b82f6', fontWeight: 900, textAlign: 'right' }} />
                    <span data-tip="low-pct" style={{ fontSize: '9px', fontWeight: 900 }} />

                    <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 900 }}>종가</span>
                    <span data-tip="close-val" style={{ color: '#fff', fontWeight: 900, textAlign: 'right' }} />
                    <span data-tip="close-pct" style={{ fontSize: '9px', fontWeight: 900 }} />
                </div>
            </div>
        </div>
    );
});

MarketMainChart.displayName = 'MarketMainChart';
export default MarketMainChart;
