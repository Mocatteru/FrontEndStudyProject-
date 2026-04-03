'use client'

import { useEffect, useRef, memo, useMemo } from "react";
import { Stock, PERIOD_OPTIONS } from "@/types/stock";
import { cn } from "@/lib/utils";
import {
    ISeriesApi,
    Time, CandlestickData,
    CandlestickSeries, LineSeries, HistogramSeries,
    MouseEventParams, LogicalRange,
    createSeriesMarkers, ISeriesMarkersPluginApi, IChartApi
} from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

// [Refactoring] 분리된 유틸리티 및 훅 임포트
import { calculateIndicators, formatVolume, MA_CONFIGS } from "@/lib/chart-utils";
import { useChartPanels, PANEL_LABELS, PANEL_COUNT, DIVIDER_H, TOTAL_HEIGHT } from "@/hooks/useChartPanels";

// ─── 하위 컴포넌트: 헤더 ──────────────────────────────────────────────────────
const StockChartHeader = memo(({ range, interval, onConfigChange }: { range: string, interval: string, onConfigChange: (r: string, i: string) => void }) => {
    const minuteOptions = PERIOD_OPTIONS.MINUTE;
    const majorOptions = PERIOD_OPTIONS.MAJOR;

    return (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black tracking-tighter text-foreground/80">기술적 차트</h2>
                <div className="flex items-center gap-3">
                    {MA_CONFIGS.map(cfg => (
                        <span key={cfg.label} className="flex items-center gap-1">
                            <span className="inline-block w-4 h-0.5 rounded" style={{ background: cfg.color }} />
                            <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: cfg.color }}>{cfg.label}</span>
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-black/5 dark:border-white/5 shrink-0 z-50">
                    <Popover>
                        <PopoverTrigger className={cn(
                            "inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent text-[10px] font-black uppercase tracking-widest transition-all outline-none select-none h-9 px-4 gap-2",
                            minuteOptions.some(o => o.interval === interval)
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                : "hover:bg-white/10 text-muted-foreground/40 hover:text-foreground"
                        )}>
                            {minuteOptions.find(o => o.interval === interval)?.label || '분봉'}
                            <ChevronDown className="size-3" />
                        </PopoverTrigger>
                        <PopoverContent className="w-32 p-1.5 bg-card/95 backdrop-blur-2xl border-black/10 dark:border-white/10 rounded-2xl shadow-2xl" align="start">
                            <div className="flex flex-col gap-1">
                                {minuteOptions.map(opt => (
                                    <Button key={opt.interval} variant="ghost" size="sm"
                                        onClick={() => onConfigChange(opt.range, opt.interval)}
                                        className={cn(
                                            "w-full justify-start h-9 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all",
                                            interval === opt.interval
                                                ? "bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/10"
                                                : "hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground/60"
                                        )}>
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {majorOptions.map(opt => (
                        <Button key={opt.label} variant="ghost" size="sm"
                            onClick={() => onConfigChange(opt.range, opt.interval)}
                            className={cn(
                                "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                range === opt.range && interval === opt.interval
                                    ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                                    : "hover:bg-white/10 text-muted-foreground/40 hover:text-foreground"
                            )}>
                            {opt.label}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
});
StockChartHeader.displayName = 'StockChartHeader';

// ─── 하위 컴포넌트: 툴팁 ──────────────────────────────────────────────────────
const StockChartTooltip = memo(({ tooltipRef }: { tooltipRef: React.RefObject<HTMLDivElement | null> }) => (
    <div
        ref={tooltipRef}
        className="absolute z-50 p-4 bg-slate-900/90 dark:bg-black/60 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-sm opacity-0 will-change-transform"
        style={{ pointerEvents: 'none', top: 0, left: 0 }}
    >
        <div style={{ fontSize: 11 }}>
            <div data-tip="date" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 9, paddingBottom: 7, borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 900 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 28, marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>시가</span>
                <span data-tip="open-val" style={{ color: '#fff', fontWeight: 900 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 28, marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>고가</span>
                <span style={{ display: 'flex', gap: 4 }}>
                    <span data-tip="high-val" style={{ color: '#fff', fontWeight: 900 }} />
                    <span data-tip="high-pct" style={{ fontSize: 10, fontWeight: 700 }} />
                </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 28, marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>저가</span>
                <span style={{ display: 'flex', gap: 4 }}>
                    <span data-tip="low-val" style={{ color: '#fff', fontWeight: 900 }} />
                    <span data-tip="low-pct" style={{ fontSize: 10, fontWeight: 700 }} />
                </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 28, paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 900 }}>종가</span>
                <span style={{ display: 'flex', gap: 4 }}>
                    <span data-tip="close-val" style={{ color: '#fff', fontWeight: 900 }} />
                    <span data-tip="close-pct" style={{ fontSize: 10, fontWeight: 700 }} />
                </span>
            </div>
        </div>
    </div>
));
StockChartTooltip.displayName = 'StockChartTooltip';

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
interface StockChartProps {
    stockData: Stock;
    range: string;
    interval: string;
    onConfigChange: (range: string, interval: string) => void;
}

const StockChart = memo(({ stockData, range, interval, onConfigChange }: StockChartProps) => {
    // [Refactoring] 커스텀 훅 사용
    const { panelHeights, containerRefs, chartRefs, onDividerMouseDown, setContainerRef, chartsReady } = useChartPanels();
    const tooltipRef = useRef<HTMLDivElement>(null);

    // [성능] 보조지표 연산 메모이제이션
    const indicatorData = useMemo(() => calculateIndicators(stockData), [stockData]);

    const seriesRefs = useRef({
        price: null as ISeriesApi<'Candlestick'> | null,
        ma: [] as (ISeriesApi<'Line'> | null)[],
        rsi: null as ISeriesApi<'Line'> | null,
        rsiRef: [] as (ISeriesApi<'Line'> | null)[],
        macdLine: null as ISeriesApi<'Line'> | null,
        macdSignal: null as ISeriesApi<'Line'> | null,
        macdHist: null as ISeriesApi<'Histogram'> | null,
        volume: null as ISeriesApi<'Histogram'> | null,
        markers: null as ISeriesMarkersPluginApi<Time> | null,
    });
    
    // [Fix] React 18 Strict Mode 등에서 차트 인스턴스가 재생성되면 고아(Orphaned) 레퍼런스를 참조하지 않도록 모든 시리즈 초기화
    const lastKnownPChart = useRef<IChartApi | null>(null);

    useEffect(() => {
        const [pChart, rsiChart, macdChart, volChart] = chartRefs.current;
        if (!pChart || !rsiChart || !macdChart || !volChart || !indicatorData) return;

        if (lastKnownPChart.current !== pChart) {
            seriesRefs.current = {
                price: null,
                ma: [],
                rsi: null,
                rsiRef: [],
                macdLine: null,
                macdSignal: null,
                macdHist: null,
                volume: null,
                markers: null,
            };
            lastKnownPChart.current = pChart;
        }

        const { raw, times, closes, maResults, rsiData, macdResults, volData, isMs } = indicatorData;

        const isPennyStock = stockData.currency !== 'KRW' && closes[closes.length - 1] < 1;
        const priceFormatter = (p: number): string => {
            if (stockData.currency === 'KRW') return Math.round(p).toLocaleString('ko-KR') + '원';
            const digits = p < 1 ? 3 : 2;
            return '$' + p.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
        };
        const priceFormatConfig = { type: 'custom' as const, formatter: priceFormatter, minMove: isPennyStock ? 0.001 : 0.01 };

        // ── 캔들스틱 ──
        let priceS = seriesRefs.current.price;
        if (!priceS) {
            priceS = pChart.addSeries(CandlestickSeries, { upColor: '#ef4444', downColor: '#3b82f6', borderVisible: false, wickUpColor: '#ef4444', wickDownColor: '#3b82f6', priceFormat: priceFormatConfig });
            seriesRefs.current.price = priceS;
        } else {
            priceS.applyOptions({ priceFormat: priceFormatConfig });
        }
        priceS.setData(raw.map((d, i) => ({ time: times[i], open: d.open, high: d.high, low: d.low, close: d.close })));

        // ── 이동평균선 ──
        maResults.forEach((res, idx) => {
            let s = seriesRefs.current.ma[idx];
            if (!s) {
                s = pChart.addSeries(LineSeries, { color: res.color, lineWidth: 1, lastValueVisible: false, priceLineVisible: false, priceFormat: priceFormatConfig });
                seriesRefs.current.ma[idx] = s;
            } else {
                s.applyOptions({ color: res.color, priceFormat: priceFormatConfig });
            }
            s.setData(res.data);
        });

        // ── RSI ──
        let rsiS = seriesRefs.current.rsi;
        if (!rsiS) {
            rsiS = rsiChart.addSeries(LineSeries, { color: '#c084fc', lineWidth: 2, lastValueVisible: true, priceFormat: { type: 'custom', formatter: (v: number) => v.toFixed(1) } });
            seriesRefs.current.rsi = rsiS;
        }
        rsiS.setData(rsiData);

        // RSI 기준선
        if (seriesRefs.current.rsiRef.length === 0) {
            seriesRefs.current.rsiRef = [
                rsiChart.addSeries(LineSeries, { color: 'rgba(239,68,68,0.3)', lineWidth: 1, lineStyle: 2, lastValueVisible: false, priceLineVisible: false }),
                rsiChart.addSeries(LineSeries, { color: 'rgba(59,130,246,0.3)', lineWidth: 1, lineStyle: 2, lastValueVisible: false, priceLineVisible: false })
            ];
        }
        // RSI 기준선: 최소 2개 이상의 포인트가 있어야 선을 그릴 때 중복 에러가 나지 않음
        if (times.length > 0) {
            const first = times[0];
            const last = times[times.length - 1];
            const refLineData = (v: number) => first === last ? [{ time: first, value: v }] : [{ time: first, value: v }, { time: last, value: v }];
            seriesRefs.current.rsiRef[0]?.setData(refLineData(70));
            seriesRefs.current.rsiRef[1]?.setData(refLineData(30));
        }

        // ── MACD ──
        if (!seriesRefs.current.macdLine) seriesRefs.current.macdLine = macdChart.addSeries(LineSeries, { color: '#60a5fa', lineWidth: 2, lastValueVisible: true });
        seriesRefs.current.macdLine.setData(macdResults.map(m => ({ time: m.time, value: m.macd })));

        if (!seriesRefs.current.macdSignal) seriesRefs.current.macdSignal = macdChart.addSeries(LineSeries, { color: '#f87171', lineWidth: 2, lastValueVisible: true });
        seriesRefs.current.macdSignal.setData(macdResults.map(m => ({ time: m.time, value: m.signal })));

        if (!seriesRefs.current.macdHist) seriesRefs.current.macdHist = macdChart.addSeries(HistogramSeries, { priceScaleId: 'right' });
        seriesRefs.current.macdHist.setData(macdResults.map(m => ({ time: m.time, value: m.histogram, color: m.color })));

        // ── 거래량 ──
        let volS = seriesRefs.current.volume;
        if (!volS) {
            volS = volChart.addSeries(HistogramSeries, { priceFormat: { type: 'custom', formatter: formatVolume } });
            volS.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0 } });
            seriesRefs.current.volume = volS;
        }
        volS.setData(volData);

        if (!seriesRefs.current.markers) {
            seriesRefs.current.markers = createSeriesMarkers(priceS, []);
        }

        // [성능] 마커 업데이트 (RAF)
        let markerRafId = -1;
        const updateMarkers = (lr: LogicalRange | null) => {
            if (markerRafId !== -1) return;
            markerRafId = requestAnimationFrame(() => {
                markerRafId = -1;
                if (!lr || !seriesRefs.current.price || !raw || !raw.length) return;
                const from = Math.max(0, Math.floor(lr.from));
                const to = Math.min(raw.length - 1, Math.ceil(lr.to));
                const visible = raw.slice(from, to + 1);
                if (!visible.length) return;

                let max = visible[0], min = visible[0];
                visible.forEach(v => { if (v.high > max.high) max = v; if (v.low < min.low) min = v; });

                const cp = stockData.regularMarketPrice || closes[closes.length - 1];
                const pad = (t: string, idx: number) => {
                    const r = (idx - lr.from) / (lr.to - lr.from);
                    const s = '\u2002'.repeat(Math.floor(t.length * 1.5));
                    return r < 0.15 ? s + t : r > 0.85 ? t + s : t;
                };

                seriesRefs.current.markers?.setMarkers([
                    { time: Math.floor(max.timestamp / (isMs ? 1000 : 1)) as Time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: pad(`최고 ${priceFormatter(max.high)} (${((max.high - cp) / cp * 100).toFixed(2)}%)`, raw.indexOf(max)) },
                    { time: Math.floor(min.timestamp / (isMs ? 1000 : 1)) as Time, position: 'belowBar', color: '#3b82f6', shape: 'arrowUp', text: pad(`최저 ${priceFormatter(min.low)} (${((min.low - cp) / cp * 100).toFixed(2)}%)`, raw.indexOf(min)) },
                ]);
            });
        };

        pChart.timeScale().subscribeVisibleLogicalRangeChange(updateMarkers);
        updateMarkers(pChart.timeScale().getVisibleLogicalRange());
        pChart.timeScale().fitContent();

        // [성능] 툴팁 업데이트 (DOM)
        const handleCrosshair = (param: MouseEventParams) => {
            const tip = tooltipRef.current;
            const container = containerRefs.current[0];
            if (!tip || !container || !seriesRefs.current.price || !param.point || !param.time) { if (tip) tip.style.opacity = '0'; return; }

            const data = param.seriesData.get(seriesRefs.current.price) as CandlestickData<Time> | undefined;
            if (!data) { tip.style.opacity = '0'; return; }

            const d = new Date((param.time as number) * 1000);
            const dStr = `${String(d.getFullYear()).slice(2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

            const updateText = (tag: string, text: string, color?: string) => {
                const el = tip.querySelector<HTMLElement>(`[data-tip="${tag}"]`);
                if (el) { el.textContent = text; if (color) el.style.color = color; }
            };

            const getPct = (v: number, b: number) => {
                const ch = ((v - b) / b) * 100;
                return { t: `(${ch > 0 ? '+' : ''}${ch.toFixed(2)}%)`, c: ch > 0 ? '#ef4444' : ch < 0 ? '#3b82f6' : '#9ca3af' };
            };

            updateText('date', dStr);
            updateText('open-val', priceFormatter(data.open));
            const hp = getPct(data.high, data.open); updateText('high-val', priceFormatter(data.high)); updateText('high-pct', hp.t, hp.c);
            const lp = getPct(data.low, data.open); updateText('low-val', priceFormatter(data.low)); updateText('low-pct', lp.t, lp.c);
            const cp = getPct(data.close, data.open); updateText('close-val', priceFormatter(data.close)); updateText('close-pct', cp.t, cp.c);

            const coord = seriesRefs.current.price.priceToCoordinate(data.close);
            let x = param.point.x + 20; if (x > container.clientWidth - 185) x = param.point.x - 185;
            let y = coord ? coord - 40 : param.point.y; if (y < 10) y = 10;
            const maxY = container.clientHeight - tip.clientHeight - 10; if (y > maxY) y = maxY;
            tip.style.transform = `translate(${x}px, ${y}px)`;
            tip.style.opacity = '1';
        };

        pChart.subscribeCrosshairMove(handleCrosshair);

        return () => {
            pChart.unsubscribeCrosshairMove(handleCrosshair);
            pChart.timeScale().unsubscribeVisibleLogicalRangeChange(updateMarkers);
            if (markerRafId !== -1) cancelAnimationFrame(markerRafId);

            // [Fix] 종목 변경 시 chart instances가 여전히 살아있는 상태에서 시리즈만 null이 되면 중복으로 addSeries가 발생.
            // 데이터 업데이트 시에는 인스턴스를 유지하고 데이터를 갈아끼우도록 clear 생략.
        };
    }, [stockData, indicatorData, chartRefs, containerRefs, chartsReady]);


    return (
        <div className="p-4 sm:p-8 border-none rounded-[3.5rem] bg-card/40 backdrop-blur-xl relative transition-all w-full overflow-hidden shadow-2xl">
            <StockChartHeader range={range} interval={interval} onConfigChange={onConfigChange} />

            <div style={{ height: TOTAL_HEIGHT }} className="w-full flex flex-col select-none">
                {PANEL_LABELS.map((label, idx) => (
                    <div key={label} className="flex flex-col shrink-0">
                        <div style={{ height: panelHeights[idx] }} className="w-full relative">
                            <div className="absolute top-2 left-3 z-10 pointer-events-none">
                                <span className="text-[10px] font-black tracking-widest text-muted-foreground/80 uppercase">{label}</span>
                            </div>
                            <div ref={setContainerRef(idx)} className="w-full h-full" />
                            {idx === 0 && <StockChartTooltip tooltipRef={tooltipRef} />}
                        </div>

                        {idx < PANEL_COUNT - 1 && (
                            <div
                                style={{ height: DIVIDER_H, cursor: 'row-resize' }}
                                className="w-full flex items-center justify-center group shrink-0 relative"
                                onMouseDown={onDividerMouseDown(idx)}
                            >
                                <div className="absolute inset-0 border-t border-b border-white/5" />
                                <div className="w-12 h-0.5 rounded-full bg-white/10 group-hover:bg-blue-400/60 transition-colors duration-150 z-10" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
});

StockChart.displayName = 'StockChart';
export default StockChart;
