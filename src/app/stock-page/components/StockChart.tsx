'use client'

import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { Stock, PERIOD_OPTIONS } from "@/types/stock";
import { cn } from "@/lib/utils";
import {
    createChart, ColorType,
    IChartApi, ISeriesApi,
    Time, CandlestickData,
    CandlestickSeries, LineSeries, HistogramSeries,
    MouseEventParams, LogicalRange, SeriesMarker,
    createSeriesMarkers, ISeriesMarkersPluginApi,
} from "lightweight-charts";
import { RSI, MACD, SMA } from "technicalindicators";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

// ─── 상수 ────────────────────────────────────────────────────────────────────
// 사용자가 TOTAL_HEIGHT를 조정하면 나머지는 비율에 맞춰 자동 분배됩니다.
const TOTAL_HEIGHT = 480;
const DIVIDER_H = 5;        // 드래그 핸들 높이 px
const MIN_PANE_H = 50;      // 각 패널 최소 높이 px
const PANEL_COUNT = 4;      // 가격 / RSI / MACD / 거래량
const TOTAL_DIVIDERS = PANEL_COUNT - 1;

// 기본 비율 (합계 = 1)
const DEFAULT_RATIOS = [0.52, 0.16, 0.16, 0.16];

// MA 설정
const MA_CONFIGS = [
    { period: 5, color: '#facc15', label: 'MA 5' },
    { period: 20, color: '#a78bfa', label: 'MA 20' },
    { period: 60, color: '#fb923c', label: 'MA 60' },
    { period: 120, color: '#34d399', label: 'MA 120' },
];

// ─── 차트 공통 옵션 ───────────────────────────────────────────────────────────
const makeChartOpts = (showTimeAxis: boolean): Parameters<typeof createChart>[1] => ({
    layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b7280',
    },
    grid: {
        vertLines: { color: 'rgba(55,65,81,0.4)', style: 2 },
        horzLines: { color: 'rgba(55,65,81,0.4)', style: 2 },
    },
    crosshair: { mode: 1 },
    rightPriceScale: { borderColor: 'rgba(55,65,81,0.6)', autoScale: true },
    leftPriceScale: { visible: false },
    timeScale: {
        visible: showTimeAxis,
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(55,65,81,0.6)',
        tickMarkFormatter: (time: Time) => {
            const d = new Date((time as number) * 1000);
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            if (hh === '00' && mm === '00') return `${d.getMonth() + 1}/${d.getDate()}`;
            return `${hh}:${mm}`;
        },
    },
    localization: {
        timeFormatter: (time: Time) => {
            const d = new Date((time as number) * 1000);
            return `${String(d.getFullYear()).slice(2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        },
    },
    autoSize: true,
    handleScroll: true,
    handleScale: true,
});

// ─── 유틸 ─────────────────────────────────────────────────────────────────────
const fmtVol = (v: number) => {
    if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toLocaleString();
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface StockChartProps {
    stockData: Stock;
    range: string;
    interval: string;
    onConfigChange: (range: string, interval: string) => void;
}

// ─── Panel 라벨 설정 ──────────────────────────────────────────────────────────
const PANEL_LABELS = ['Price', 'RSI (14)', 'MACD (12,26,9)', 'Volume'];

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
const StockChart = memo(({ stockData, range, interval, onConfigChange }: StockChartProps) => {
    // 패널 높이 비율 배열
    const [ratios, setRatios] = useState<number[]>(DEFAULT_RATIOS);

    // 드래그 상태
    const activeDivider = useRef<number>(-1); // 어떤 핸들이 드래그 중인지 (0~TOTAL_DIVIDERS-1)
    const dragStartY = useRef(0);
    const dragStartRatios = useRef<number[]>([]);

    // 실제 패널 높이 계산 (패널당 최소치 보장)
    const usableH = TOTAL_HEIGHT - DIVIDER_H * TOTAL_DIVIDERS;
    const panelHeights = ratios.map(r => Math.max(MIN_PANE_H, Math.round(usableH * r)));

    // 차트 DOM refs (4개) — 훅 규칙을 지키기 위해 단일 ref 배열 사용
    const containerRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

    const tooltipRef = useRef<HTMLDivElement>(null);

    // 차트 인스턴스 refs (4개)
    const chartRefs = useRef<(IChartApi | null)[]>([null, null, null, null]);

    // 시리즈 refs
    const priceSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const maSeriesRefs = useRef<(ISeriesApi<'Line'> | null)[]>([null, null, null, null]); // MA5/20/60/120
    const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const macdLineRef = useRef<ISeriesApi<'Line'> | null>(null);
    const macdSignalRef = useRef<ISeriesApi<'Line'> | null>(null);
    const macdHistRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

    // 동기화 lock
    const isSyncing = useRef(false);

    const minuteOptions = PERIOD_OPTIONS.MINUTE;
    const majorOptions = PERIOD_OPTIONS.MAJOR;

    // ── 드래그 핸들러 ──────────────────────────────────────────────────────────
    const onDividerMouseDown = useCallback((idx: number) => (e: React.MouseEvent) => {
        e.preventDefault();
        activeDivider.current = idx;
        dragStartY.current = e.clientY;
        dragStartRatios.current = [...ratios];
    }, [ratios]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (activeDivider.current < 0) return;
            const idx = activeDivider.current;
            const dy = e.clientY - dragStartY.current;
            const delta = dy / usableH;

            const next = [...dragStartRatios.current];
            const minR = MIN_PANE_H / usableH;

            next[idx] = Math.max(minR, dragStartRatios.current[idx] + delta);
            next[idx + 1] = Math.max(minR, dragStartRatios.current[idx + 1] - delta);

            // 합계 보정: 나머지 패널 비율은 고정
            const newTotal = next.reduce((a, b) => a + b, 0);
            const normalized = next.map(r => r / newTotal);
            setRatios(normalized);
        };
        const onMouseUp = () => { activeDivider.current = -1; };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [usableH]);

    // ── 차트 초기화 (마운트 1회) ────────────────────────────────────────────────
    useEffect(() => {
        const allReady = containerRefs.current.every(r => r);
        if (!allReady) return;

        // 차트 생성 (가격, RSI, MACD = 타임축 숨김 / 거래량 = 타임축 표시)
        const charts = containerRefs.current.map((el, i) =>
            createChart(el!, makeChartOpts(i === PANEL_COUNT - 1))
        );
        chartRefs.current = charts;

        charts.forEach((src, si) => {
            src.timeScale().subscribeVisibleLogicalRangeChange((lr: LogicalRange | null) => {
                if (isSyncing.current || !lr) return;
                isSyncing.current = true;
                charts.forEach((dst, di) => { if (di !== si) dst.timeScale().setVisibleLogicalRange(lr); });
                isSyncing.current = false;
            });
        });

        return () => {
            charts.forEach(c => c.remove());
            chartRefs.current = [null, null, null, null];
            priceSeriesRef.current = null;
            maSeriesRefs.current = [null, null, null, null];
            rsiSeriesRef.current = null;
            macdLineRef.current = null;
            macdSignalRef.current = null;
            macdHistRef.current = null;
            volumeSeriesRef.current = null;
            markersRef.current = null;
        };
    }, []);

    // ── [Senior Optimization] 보조지표 연산 전용 메모이제이션 (Rule 13) ──────
    const indicatorData = useMemo(() => {
        if (!stockData?.historical?.length) return null;

        const raw = [...stockData.historical].sort((a, b) => a.timestamp - b.timestamp);
        const closes = raw.map(d => d.close);
        const isMs = raw[0].timestamp > 10_000_000_000;
        const times = raw.map(d => Math.floor(d.timestamp / (isMs ? 1000 : 1)) as Time);

        // 1. 이동평균선 (SMA)
        const maResults = MA_CONFIGS.map(cfg => {
            const vals = SMA.calculate({ values: closes, period: cfg.period });
            const offset = closes.length - vals.length;
            return {
                label: cfg.label,
                color: cfg.color,
                data: vals.map((v, i) => ({ time: times[offset + i], value: v }))
            };
        });

        // 2. RSI
        const rsiRaw = RSI.calculate({ values: closes, period: 14 });
        const rsiOffset = closes.length - rsiRaw.length;
        const rsiData = rsiRaw.map((v, i) => ({ time: times[rsiOffset + i], value: v }));

        // 3. MACD
        const macdRaw = MACD.calculate({
            values: closes,
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            SimpleMAOscillator: false,
            SimpleMASignal: false,
        });
        const macdOffset = closes.length - macdRaw.length;

        return {
            raw, times, closes, isMs,
            maResults,
            rsiData,
            macdResults: macdRaw.map((m, i) => ({
                time: times[macdOffset + i],
                macd: m.MACD ?? 0,
                signal: m.signal ?? 0,
                histogram: m.histogram ?? 0,
                color: (m.histogram ?? 0) >= 0 ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.5)',
            })),
            volData: raw.map((d, i) => ({
                time: times[i],
                value: d.volume ?? 0,
                color: d.close >= d.open ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)',
            }))
        };
    }, [stockData]);

    // ── 데이터 / 시리즈 업데이트 ──────────────────────────────────────────────
    useEffect(() => {
        const [pChart, rsiChart, macdChart, volChart] = chartRefs.current;
        if (!pChart || !rsiChart || !macdChart || !volChart || !indicatorData) return;

        const { raw, times, closes, isMs, maResults, rsiData, macdResults, volData } = indicatorData;

        // 기존 시리즈 정리
        const remove = (chart: IChartApi, s: ISeriesApi<never> | null) => {
            if (s) try { chart.removeSeries(s); } catch { }
        };
        remove(pChart, priceSeriesRef.current as ISeriesApi<never>);
        maSeriesRefs.current.forEach(s => remove(pChart, s as ISeriesApi<never>));
        remove(rsiChart, rsiSeriesRef.current as ISeriesApi<never>);
        remove(macdChart, macdLineRef.current as ISeriesApi<never>);
        remove(macdChart, macdSignalRef.current as ISeriesApi<never>);
        remove(macdChart, macdHistRef.current as ISeriesApi<never>);
        remove(volChart, volumeSeriesRef.current as ISeriesApi<never>);

        // ── 가격 시리즈 (Candlestick 고정) ───────────────────────────────────
        const isPennyStock = stockData.currency !== 'KRW' && closes[closes.length - 1] < 1;
        const fractionDigits = isPennyStock ? 3 : 2;
        const minMove = isPennyStock ? 0.001 : 0.01;

        const priceFormatter = (p: number) =>
            stockData.currency === 'KRW'
                ? Math.round(p).toLocaleString('ko-KR') + '원'
                : '$' + p.toLocaleString('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });

        const priceFormatConfig = { type: 'custom' as const, formatter: priceFormatter, minMove };

        const s = pChart.addSeries(CandlestickSeries, {
            upColor: '#ef4444', downColor: '#3b82f6',
            borderVisible: false,
            wickUpColor: '#ef4444', wickDownColor: '#3b82f6',
            priceFormat: priceFormatConfig,
        });
        s.setData(raw.map((d, i) => ({ time: times[i], open: d.open, high: d.high, low: d.low, close: d.close })));
        priceSeriesRef.current = s;

        // ── 이동평균선 ────────────────────────────────────────────────────────
        maResults.forEach((res, idx) => {
            const lineS = pChart.addSeries(LineSeries, {
                color: res.color,
                lineWidth: 1,
                priceScaleId: 'right',
                lastValueVisible: false,
                priceLineVisible: false,
                priceFormat: priceFormatConfig,
            });
            lineS.setData(res.data);
            maSeriesRefs.current[idx] = lineS;
        });

        // ── RSI ───────────────────────────────────────────────────────────────
        const rsiS = rsiChart.addSeries(LineSeries, {
            color: '#c084fc',
            lineWidth: 2,
            priceFormat: { type: 'custom', formatter: (v: number) => v.toFixed(1) },
            lastValueVisible: true,
        });
        rsiS.setData(rsiData);

        // RSI 과매수/과매도 라인 (배경 점선)
        const rsiLines = [70, 30].map(val => rsiChart.addSeries(LineSeries, {
            color: val === 70 ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)',
            lineWidth: 1, lineStyle: 2, priceScaleId: 'right',
            lastValueVisible: false, priceLineVisible: false,
            priceFormat: { type: 'custom', formatter: (v: number) => v.toFixed(0) },
        }));
        if (times.length > 0) {
            rsiLines[0].setData([{ time: times[0], value: 70 }, { time: times[times.length - 1], value: 70 }]);
            rsiLines[1].setData([{ time: times[0], value: 30 }, { time: times[times.length - 1], value: 30 }]);
        }
        rsiSeriesRef.current = rsiS;

        // ── MACD ──────────────────────────────────────────────────────────────
        const macdL = macdChart.addSeries(LineSeries, {
            color: '#60a5fa', lineWidth: 2, lastValueVisible: true,
            priceFormat: { type: 'custom', formatter: (v: number) => v.toFixed(4) },
        });
        const macdSig = macdChart.addSeries(LineSeries, {
            color: '#f87171', lineWidth: 2, lastValueVisible: true, priceScaleId: 'right',
            priceFormat: { type: 'custom', formatter: (v: number) => v.toFixed(4) },
        });
        const macdHist = macdChart.addSeries(HistogramSeries, {
            priceScaleId: 'right',
            priceFormat: { type: 'custom', formatter: (v: number) => v.toFixed(4) },
        });

        macdL.setData(macdResults.map(m => ({ time: m.time, value: m.macd })));
        macdSig.setData(macdResults.map(m => ({ time: m.time, value: m.signal })));
        macdHist.setData(macdResults.map(m => ({ time: m.time, value: m.histogram, color: m.color })));

        macdLineRef.current = macdL;
        macdSignalRef.current = macdSig;
        macdHistRef.current = macdHist;

        // ── 거래량 ────────────────────────────────────────────────────────────
        const volS = volChart.addSeries(HistogramSeries, {
            priceScaleId: 'right',
            priceFormat: { type: 'custom', formatter: fmtVol },
        });
        volS.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0 }, borderVisible: false });
        volS.setData(volData);
        volumeSeriesRef.current = volS;

        // ── 마커 시스템 초기화 (1회) ──────────────────────────────────────────
        if (priceSeriesRef.current) {
            markersRef.current = createSeriesMarkers(priceSeriesRef.current, []);
        }

        // ── 최고가/최저가 마커 업데이트 로직 ──────────────────────────────
        const updateVisibleMarkers = (lr: LogicalRange | null) => {
            if (!lr || !priceSeriesRef.current || !raw.length) return;

            const from = Math.max(0, Math.floor(lr.from));
            const to = Math.min(raw.length - 1, Math.ceil(lr.to));
            const visibleBars = raw.slice(from, to + 1);
            if (!visibleBars.length) return;

            const maxBar = visibleBars.reduce((p, c) => c.high > p.high ? c : p, visibleBars[0]);
            const minBar = visibleBars.reduce((p, c) => c.low < p.low ? c : p, visibleBars[0]);
            const currentPrice = stockData.regularMarketPrice || closes[closes.length - 1];

            const markers: SeriesMarker<Time>[] = [
                {
                    time: Math.floor(maxBar.timestamp / (isMs ? 1000 : 1)) as Time,
                    position: 'aboveBar', color: '#ef4444', shape: 'arrowDown',
                    text: `최고 ${priceFormatter(maxBar.high)} (${((maxBar.high - currentPrice) / currentPrice * 100).toFixed(2)}%)`,
                    size: 1,
                },
                {
                    time: Math.floor(minBar.timestamp / (isMs ? 1000 : 1)) as Time,
                    position: 'belowBar', color: '#3b82f6', shape: 'arrowUp',
                    text: `최저 ${priceFormatter(minBar.low)} (${((minBar.low - currentPrice) / currentPrice * 100).toFixed(2)}%)`,
                    size: 1,
                }
            ];
            if (markersRef.current) {
                markersRef.current.setMarkers(markers);
            }
        };

        // 가시 범위 변경 구독
        const onVisibleRangeChange = (lr: LogicalRange | null) => updateVisibleMarkers(lr);
        pChart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleRangeChange);

        // ── fitContent 및 초기 마커 설정 ───────────────────────────────────
        pChart.timeScale().fitContent();

        // fitContent 이후 실제 가시 범위를 가져와 마커 초기화
        setTimeout(() => {
            const lr = pChart.timeScale().getVisibleLogicalRange();
            updateVisibleMarkers(lr);
        }, 50);

        // ── tooltip ───────────────────────────────────────────────────────────
        const handleCrosshair = (param: MouseEventParams) => {
            if (!tooltipRef.current || !containerRefs.current[0] || !priceSeriesRef.current) return;
            const tip = tooltipRef.current;

            if (!param.point || !param.time ||
                param.point.x < 0 || param.point.x > containerRefs.current[0].clientWidth ||
                param.point.y < 0 || param.point.y > containerRefs.current[0].clientHeight) {
                tip.style.opacity = '0'; return;
            }

            const data = param.seriesData.get(priceSeriesRef.current) as CandlestickData<Time> | undefined;
            if (!data) { tip.style.opacity = '0'; return; }

            const d = new Date((param.time as number) * 1000);
            const dStr = `${String(d.getFullYear()).slice(2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

            const pct = (t: number, b: number) => {
                const ch = ((t - b) / b) * 100;
                const col = ch > 0 ? '#ef4444' : ch < 0 ? '#3b82f6' : '#9ca3af';
                return `<span style="color:${col};font-size:10px;font-weight:700;margin-left:4px">(${ch > 0 ? '+' : ''}${ch.toFixed(2)}%)</span>`;
            };

            const row = (label: string, val: string, subtle = false) =>
                `<div style="display:flex;justify-content:space-between;gap:28px;margin-bottom:4px"><span style="color:rgba(255,255,255,${subtle ? '0.3' : '0.4'});font-weight:700">${label}</span><span style="color:#fff;font-weight:900">${val}</span></div>`;

            const c = data as CandlestickData<Time>;
            tip.innerHTML =
                `<div style="font-size:11px">` +
                `<div style="color:rgba(255,255,255,0.7);margin-bottom:9px;padding-bottom:7px;border-bottom:1px solid rgba(255,255,255,0.1);font-weight:900;font-style:italic">${dStr}</div>` +
                row('시가', priceFormatter(c.open)) +
                row('고가', `${priceFormatter(c.high)}${pct(c.high, c.open)}`) +
                row('저가', `${priceFormatter(c.low)}${pct(c.low, c.open)}`) +
                `<div style="display:flex;justify-content:space-between;gap:28px;padding-top:5px;border-top:1px solid rgba(255,255,255,0.06)"><span style="color:rgba(255,255,255,0.6);font-weight:900;font-style:italic">종가</span><span style="color:#fff;font-weight:900">${priceFormatter(c.close)}${pct(c.close, c.open)}</span></div>` +
                `</div>`;

            const closeVal = (data as CandlestickData<Time>).close;
            const coord = priceSeriesRef.current.priceToCoordinate(closeVal);
            let x = param.point.x + 20;
            if (x > containerRefs.current[0]!.clientWidth - 185) x = param.point.x - 185;
            let y = coord ? coord - 40 : param.point.y;
            if (y < 10) y = 10;
            const maxY = containerRefs.current[0]!.clientHeight - tip.clientHeight - 10;
            if (y > maxY) y = maxY;
            tip.style.left = x + 'px';
            tip.style.top = y + 'px';
            tip.style.opacity = '1';
        };

        pChart.subscribeCrosshairMove(handleCrosshair);
        return () => {
            pChart.unsubscribeCrosshairMove(handleCrosshair);
            pChart.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleRangeChange);
        };

    }, [stockData, indicatorData]);

    // ── 패널 비율 변경 시 차트 resize 트리거 ────────────────────────────────
    const panelHeightsDep = panelHeights.join(',');
    useEffect(() => {
        chartRefs.current.forEach(c => c?.applyOptions({}));
    }, [panelHeightsDep]);

    return (
        <div className="p-4 sm:p-8 border-none rounded-[3.5rem] bg-card/40 backdrop-blur-xl relative transition-all w-full overflow-hidden shadow-2xl">

            {/* ── 헤더 / 컨트롤 ──────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black tracking-tighter text-foreground/80">기술적 차트</h2>
                    {/* MA 범례 */}
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
                    {/* 분봉 드롭다운 */}
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

            {/* ── 차트 패널 영역 ──────────────────────────────────────────── */}
            <div style={{ height: TOTAL_HEIGHT }} className="w-full flex flex-col select-none">
                {PANEL_LABELS.map((label, idx) => (
                    <div key={label} className="flex flex-col shrink-0">
                        {/* 패널 */}
                        <div style={{ height: panelHeights[idx] }} className="w-full relative">
                            {/* 라벨 */}
                            <div className="absolute top-1 left-2 z-10 pointer-events-none">
                                <span className="text-[8.5px] font-black tracking-widest text-muted-foreground/30 uppercase italic">
                                    {label}
                                </span>
                            </div>
                            {/* 차트 마운트 포인트 */}
                            <div ref={el => { containerRefs.current[idx] = el; }} className="w-full h-full" />
                            {/* 가격 차트 tooltip */}
                            {idx === 0 && (
                                <div
                                    ref={tooltipRef}
                                    className="absolute z-50 p-4 bg-black/10 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-sm opacity-0"
                                    style={{ pointerEvents: 'none' }}
                                />
                            )}
                        </div>

                        {/* 드래그 핸들 (마지막 패널 제외) */}
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
