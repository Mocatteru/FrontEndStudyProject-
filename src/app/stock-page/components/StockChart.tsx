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
// [성능] technicalindicators 패키지 제거 → 경량 인라인 함수 사용 (번들 ~200KB 절감)
import { calcSMA, calcRSI, calcMACD } from "@/lib/indicators";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

// ─── 상수 ────────────────────────────────────────────────────────────────────
const TOTAL_HEIGHT = 480;
const DIVIDER_H = 5;
const MIN_PANE_H = 50;
const PANEL_COUNT = 4;
const TOTAL_DIVIDERS = PANEL_COUNT - 1;
const DEFAULT_RATIOS = [0.52, 0.16, 0.16, 0.16];

const MA_CONFIGS = [
    { period: 5, color: '#facc15', label: 'MA 5' },
    { period: 20, color: '#a78bfa', label: 'MA 20' },
    { period: 60, color: '#fb923c', label: 'MA 60' },
    { period: 120, color: '#34d399', label: 'MA 120' },
] as const;

const PANEL_LABELS = ['가격', 'RSI (14)', 'MACD (12,26,9)', '거래량'];

// ─── 차트 공통 옵션 ───────────────────────────────────────────────────────────
// 차트 인스턴스마다 공통 레이아웃/스케일을 동일하게 유지하기 위해 팩토리 함수로 분리
const makeChartOpts = (showTimeAxis: boolean): Parameters<typeof createChart>[1] => ({
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
        borderColor: 'rgba(55,65,81,0.6)',
        autoScale: true,
        borderVisible: true,
        minimumWidth: 80,
    },
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
// 오른쪽 스케일 너비 절약을 위해 거래량을 K/M/B 단위로 압축
const formatVolume = (v: number) => {
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

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
const StockChart = memo(({ stockData, range, interval, onConfigChange }: StockChartProps) => {
    const [ratios, setRatios] = useState<number[]>(DEFAULT_RATIOS);

    // 드래그 상태 - ref로 관리하여 리렌더 없이 추적
    const activeDivider = useRef<number>(-1);
    const dragStartY = useRef(0);
    const dragStartRatios = useRef<number[]>([]);
    // [성능] RAF id를 저장하여 드래그 중 불필요한 중복 업데이트 방지
    const dragRafId = useRef<number>(-1);

    const usableH = TOTAL_HEIGHT - DIVIDER_H * TOTAL_DIVIDERS;
    const panelHeights = ratios.map(r => Math.max(MIN_PANE_H, Math.round(usableH * r)));

    const containerRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const chartRefs = useRef<(IChartApi | null)[]>([null, null, null, null]);

    // 시리즈 refs
    const priceSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const maSeriesRefs = useRef<(ISeriesApi<'Line'> | null)[]>([null, null, null, null]);
    const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    // [성능] RSI 기준선(70/30)은 데이터 교체 없이 setData만 하므로 별도 ref로 유지
    const rsiRefLinesRef = useRef<(ISeriesApi<'Line'> | null)[]>([null, null]);
    const macdLineRef = useRef<ISeriesApi<'Line'> | null>(null);
    const macdSignalRef = useRef<ISeriesApi<'Line'> | null>(null);
    const macdHistRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

    // 타임스케일 동기화 lock
    const isSyncing = useRef(false);

    const minuteOptions = PERIOD_OPTIONS.MINUTE;
    const majorOptions = PERIOD_OPTIONS.MAJOR;

    // ── [성능] 드래그: RAF로 throttle하여 60fps 이상 setRatios 호출 차단 ──────
    const onDividerMouseDown = useCallback((idx: number) => (e: React.MouseEvent) => {
        e.preventDefault();
        activeDivider.current = idx;
        dragStartY.current = e.clientY;
        dragStartRatios.current = [...ratios];
    }, [ratios]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (activeDivider.current < 0) return;
            // [성능] 이전 RAF가 처리되기 전에 새 이벤트가 오면 덮어써 불필요한 계산 제거
            if (dragRafId.current !== -1) cancelAnimationFrame(dragRafId.current);
            dragRafId.current = requestAnimationFrame(() => {
                const idx = activeDivider.current;
                if (idx < 0) return;
                const dy = e.clientY - dragStartY.current;
                const delta = dy / usableH;
                const next = [...dragStartRatios.current];
                const minR = MIN_PANE_H / usableH;
                next[idx] = Math.max(minR, dragStartRatios.current[idx] + delta);
                next[idx + 1] = Math.max(minR, dragStartRatios.current[idx + 1] - delta);
                const newTotal = next.reduce((a, b) => a + b, 0);
                setRatios(next.map(r => r / newTotal));
                dragRafId.current = -1;
            });
        };
        const onMouseUp = () => {
            activeDivider.current = -1;
            if (dragRafId.current !== -1) {
                cancelAnimationFrame(dragRafId.current);
                dragRafId.current = -1;
            }
        };
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

        const charts = containerRefs.current.map((el, i) =>
            createChart(el!, makeChartOpts(i === PANEL_COUNT - 1))
        );
        chartRefs.current = charts;

        // 타임스케일 동기화
        charts.forEach((src, si) => {
            src.timeScale().subscribeVisibleLogicalRangeChange((lr: LogicalRange | null) => {
                if (isSyncing.current || !lr) return;
                isSyncing.current = true;
                charts.forEach((dst, di) => { if (di !== si) dst.timeScale().setVisibleLogicalRange(lr); });
                isSyncing.current = false;
            });
        });

        // [성능] RSI 기준선(70/30)은 마운트 시 1회 생성하고 이후 setData만 갱신
        const rsiChart = charts[1];
        const refLine70 = rsiChart.addSeries(LineSeries, {
            color: 'rgba(239,68,68,0.3)', lineWidth: 1, lineStyle: 2, priceScaleId: 'right',
            lastValueVisible: false, priceLineVisible: false,
            priceFormat: { type: 'custom', formatter: (v: number) => v.toFixed(0) },
        });
        const refLine30 = rsiChart.addSeries(LineSeries, {
            color: 'rgba(59,130,246,0.3)', lineWidth: 1, lineStyle: 2, priceScaleId: 'right',
            lastValueVisible: false, priceLineVisible: false,
            priceFormat: { type: 'custom', formatter: (v: number) => v.toFixed(0) },
        });
        rsiRefLinesRef.current = [refLine70, refLine30];

        return () => {
            charts.forEach(c => c.remove());
            chartRefs.current = [null, null, null, null];
            priceSeriesRef.current = null;
            maSeriesRefs.current = [null, null, null, null];
            rsiSeriesRef.current = null;
            rsiRefLinesRef.current = [null, null];
            macdLineRef.current = null;
            macdSignalRef.current = null;
            macdHistRef.current = null;
            volumeSeriesRef.current = null;
            markersRef.current = null;
        };
    }, []);

    // ── [성능] 보조지표 연산 메모이제이션 (stockData 참조가 바뀔 때만 재계산) ──
    const indicatorData = useMemo(() => {
        if (!stockData?.historical?.length) return null;

        const raw = [...stockData.historical].sort((a, b) => a.timestamp - b.timestamp);
        const closes = raw.map(d => d.close);
        const isMs = raw[0].timestamp > 10_000_000_000;
        const times = raw.map(d => Math.floor(d.timestamp / (isMs ? 1000 : 1)) as Time);

        // SMA — 패키지 없이 직접 계산
        const maResults = MA_CONFIGS.map(cfg => {
            const vals = calcSMA(closes, cfg.period);
            const offset = closes.length - vals.length;
            return {
                label: cfg.label,
                color: cfg.color,
                data: vals.map((v, i) => ({ time: times[offset + i], value: v })),
            };
        });

        // RSI — Wilder smoothing 인라인 구현
        const rsiRaw = calcRSI(closes, 14);
        const rsiOffset = closes.length - rsiRaw.length;
        const rsiData = rsiRaw.map((v, i) => ({ time: times[rsiOffset + i], value: v }));

        // MACD — EMA 기반 인라인 구현
        const macdRaw = calcMACD(closes, 12, 26, 9);
        const macdOffset = closes.length - macdRaw.length;

        return {
            raw, times, closes, isMs,
            maResults,
            rsiData,
            macdResults: macdRaw.map((m, i) => ({
                time: times[macdOffset + i],
                macd: m.MACD,
                signal: m.signal,
                histogram: m.histogram,
                // 양수=적색(한국 상승), 음수=청색(하락) — 재계산 없이 미리 보관
                color: m.histogram >= 0 ? '#ef4444' : '#3b82f6',
            })),
            volData: raw.map((d, i) => ({
                time: times[i],
                value: d.volume ?? 0,
                color: d.close >= d.open ? '#ef4444' : '#3b82f6',
            })),
        };
    }, [stockData]);

    // ── 데이터 / 시리즈 업데이트 ──────────────────────────────────────────────
    useEffect(() => {
        const [pChart, rsiChart, macdChart, volChart] = chartRefs.current;
        if (!pChart || !rsiChart || !macdChart || !volChart || !indicatorData) return;

        const { raw, times, closes, isMs, maResults, rsiData, macdResults, volData } = indicatorData;

        // 기존 시리즈 안전 제거 (RSI 기준선은 마운트 시 생성한 것이므로 제거하지 않음)
        const removeSeries = (chart: IChartApi, s: ISeriesApi<never> | null) => {
            if (s) try { chart.removeSeries(s); } catch { /* 이미 제거된 경우 무시 */ }
        };
        removeSeries(pChart, priceSeriesRef.current as ISeriesApi<never>);
        maSeriesRefs.current.forEach(s => removeSeries(pChart, s as ISeriesApi<never>));
        removeSeries(rsiChart, rsiSeriesRef.current as ISeriesApi<never>);
        removeSeries(macdChart, macdLineRef.current as ISeriesApi<never>);
        removeSeries(macdChart, macdSignalRef.current as ISeriesApi<never>);
        removeSeries(macdChart, macdHistRef.current as ISeriesApi<never>);
        removeSeries(volChart, volumeSeriesRef.current as ISeriesApi<never>);

        // ── 가격 포매터 (통화/자릿수 분기) ──
        const isPennyStock = stockData.currency !== 'KRW' && closes[closes.length - 1] < 1;
        const minMove = isPennyStock ? 0.001 : 0.01;

        const priceFormatter = (p: number): string => {
            if (stockData.currency === 'KRW') return Math.round(p).toLocaleString('ko-KR') + '원';
            const digits = p < 1 ? 3 : 2;
            return '$' + p.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
        };
        const priceFormatConfig = { type: 'custom' as const, formatter: priceFormatter, minMove };

        // ── 캔들스틱 ──
        const priceS = pChart.addSeries(CandlestickSeries, {
            upColor: '#ef4444', downColor: '#3b82f6',
            borderVisible: false,
            wickUpColor: '#ef4444', wickDownColor: '#3b82f6',
            priceFormat: priceFormatConfig,
        });

        priceS.setData(raw.map((d, i) => ({ time: times[i], open: d.open, high: d.high, low: d.low, close: d.close })));
        priceSeriesRef.current = priceS;

        // ── 이동평균선 ──
        maResults.forEach((res, idx) => {
            const lineS = pChart.addSeries(LineSeries, {
                color: res.color, lineWidth: 1, priceScaleId: 'right',
                lastValueVisible: false, priceLineVisible: false,
                priceFormat: priceFormatConfig,
            });
            lineS.setData(res.data);
            maSeriesRefs.current[idx] = lineS;
        });

        // ── RSI ──
        const rsiS = rsiChart.addSeries(LineSeries, {
            color: '#c084fc', lineWidth: 2, priceScaleId: 'right',
            priceFormat: { type: 'custom', formatter: (v: number) => v.toFixed(1) },
            lastValueVisible: true,
        });
        rsiS.setData(rsiData);
        rsiSeriesRef.current = rsiS;

        // [성능] 기준선은 destroy 없이 setData만으로 갱신 (GPU 재할당 없음)
        if (times.length > 0) {
            const [refLine70, refLine30] = rsiRefLinesRef.current;
            refLine70?.setData([{ time: times[0], value: 70 }, { time: times[times.length - 1], value: 70 }]);
            refLine30?.setData([{ time: times[0], value: 30 }, { time: times[times.length - 1], value: 30 }]);
        }

        // ── MACD ──
        const macdL = macdChart.addSeries(LineSeries, {
            color: '#60a5fa', lineWidth: 2, lastValueVisible: true, priceScaleId: 'right',
            priceFormat: { type: 'custom', formatter: (v: number) => v.toFixed(2) },
        });
        const macdSig = macdChart.addSeries(LineSeries, {
            color: '#f87171', lineWidth: 2, lastValueVisible: true, priceScaleId: 'right',
            priceFormat: { type: 'custom', formatter: (v: number) => v.toFixed(2) },
        });
        const macdHist = macdChart.addSeries(HistogramSeries, {
            priceScaleId: 'right',
            priceFormat: { type: 'custom', formatter: (v: number) => v.toFixed(2) },
        });
        macdL.setData(macdResults.map(m => ({ time: m.time, value: m.macd })));
        macdSig.setData(macdResults.map(m => ({ time: m.time, value: m.signal })));
        macdHist.setData(macdResults.map(m => ({ time: m.time, value: m.histogram, color: m.color })));
        macdLineRef.current = macdL;
        macdSignalRef.current = macdSig;
        macdHistRef.current = macdHist;

        // ── 거래량 ──
        const volS = volChart.addSeries(HistogramSeries, {
            priceScaleId: 'right',
            priceFormat: { type: 'custom', formatter: formatVolume },
        });
        volS.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0 }, borderVisible: true });
        volS.setData(volData);
        volumeSeriesRef.current = volS;

        // ── 마커 시스템 ──
        if (priceSeriesRef.current) {
            markersRef.current = createSeriesMarkers(priceSeriesRef.current, []);
        }

        // [성능] 마커 업데이트 - RAF 기반 throttle로 스크롤 시 매 프레임 reduce 방지
        let markerRafId = -1;

        // 텍스트 위치 보정을 위한 동적 패딩 유틸
        const padText = (text: string, barIdx: number, lr: LogicalRange) => {
            const total = lr.to - lr.from;
            if (total <= 0) return text;
            const ratio = (barIdx - lr.from) / total;
            const spaceStr = '\u2002'.repeat(Math.floor(text.length * 1.5)); // EN-Space로 글자 수비례 여백 생성
            if (ratio < 0.15) return spaceStr + text; // 왼쪽 15% 진입 시 오른쪽으로 밀어내기
            if (ratio > 0.85) return text + spaceStr; // 오른쪽 85% 진입 시 왼쪽으로 밀어내기
            return text;
        };

        const updateVisibleMarkers = (lr: LogicalRange | null) => {
            if (markerRafId !== -1) return; // 이미 대기 중이면 스킵
            markerRafId = requestAnimationFrame(() => {
                markerRafId = -1;
                if (!lr || !priceSeriesRef.current || !raw.length) return;

                const from = Math.max(0, Math.floor(lr.from));
                const to = Math.min(raw.length - 1, Math.ceil(lr.to));

                if (from > to || to < 0) return;

                const visibleBars = raw.slice(from, to + 1);
                if (!visibleBars.length) return;

                // O(n) 순회 1회로 최고/최저 탐색
                let maxBar = visibleBars[0];
                let minBar = visibleBars[0];
                for (let i = 1; i < visibleBars.length; i++) {
                    if (visibleBars[i].high > maxBar.high) maxBar = visibleBars[i];
                    if (visibleBars[i].low < minBar.low) minBar = visibleBars[i];
                }

                const currentPrice = stockData.regularMarketPrice || closes[closes.length - 1];
                const maxPct = ((maxBar.high - currentPrice) / currentPrice * 100).toFixed(2);
                const minPct = ((minBar.low - currentPrice) / currentPrice * 100).toFixed(2);

                const maxRawText = `최고 ${priceFormatter(maxBar.high)} (${maxPct}%)`;
                const minRawText = `최저 ${priceFormatter(minBar.low)} (${minPct}%)`;

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

        pChart.timeScale().subscribeVisibleLogicalRangeChange(updateVisibleMarkers);

        pChart.timeScale().fitContent();

        // [성능] 초기 가시범위를 가져와 마커 동기화
        updateVisibleMarkers(pChart.timeScale().getVisibleLogicalRange());

        // ── [성능] Tooltip: innerHTML 빌딩 제거 → 미리 렌더된 DOM 노드를 직접 업데이트 ──
        // innerHTML 파싱은 매 마우스 이동마다 브라우저 layout/paint 비용을 발생시킴
        // → textContent / style 직접 주입으로 교체하여 실측 60fps 유지
        const handleCrosshair = (param: MouseEventParams) => {
            const tip = tooltipRef.current;
            const container = containerRefs.current[0];
            if (!tip || !container || !priceSeriesRef.current) return;

            if (!param.point || !param.time ||
                param.point.x < 0 || param.point.x > container.clientWidth ||
                param.point.y < 0 || param.point.y > container.clientHeight) {
                tip.style.opacity = '0'; return;
            }

            const data = param.seriesData.get(priceSeriesRef.current) as CandlestickData<Time> | undefined;
            if (!data) { tip.style.opacity = '0'; return; }

            const d = new Date((param.time as number) * 1000);
            const dStr = `${String(d.getFullYear()).slice(2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

            // [성능] 미리 정의된 DOM 구조에 값만 주입 (innerHTML 파싱 비용 제거)
            const elDate = tip.querySelector<HTMLElement>('[data-tip="date"]');
            const elOpen = tip.querySelector<HTMLElement>('[data-tip="open-val"]');
            const elHigh = tip.querySelector<HTMLElement>('[data-tip="high-val"]');
            const elHighPct = tip.querySelector<HTMLElement>('[data-tip="high-pct"]');
            const elLow = tip.querySelector<HTMLElement>('[data-tip="low-val"]');
            const elLowPct = tip.querySelector<HTMLElement>('[data-tip="low-pct"]');
            const elClose = tip.querySelector<HTMLElement>('[data-tip="close-val"]');
            const elClosePct = tip.querySelector<HTMLElement>('[data-tip="close-pct"]');

            const pctColor = (change: number) => change > 0 ? '#ef4444' : change < 0 ? '#3b82f6' : '#9ca3af';
            const pctText = (t: number, b: number) => {
                const ch = ((t - b) / b) * 100;
                return { text: `(${ch > 0 ? '+' : ''}${ch.toFixed(2)}%)`, color: pctColor(ch) };
            };

            if (elDate) elDate.textContent = dStr;
            if (elOpen) elOpen.textContent = priceFormatter(data.open);
            const hPct = pctText(data.high, data.open);
            if (elHigh) elHigh.textContent = priceFormatter(data.high);
            if (elHighPct) { elHighPct.textContent = hPct.text; elHighPct.style.color = hPct.color; }
            const lPct = pctText(data.low, data.open);
            if (elLow) elLow.textContent = priceFormatter(data.low);
            if (elLowPct) { elLowPct.textContent = lPct.text; elLowPct.style.color = lPct.color; }
            const cPct = pctText(data.close, data.open);
            if (elClose) elClose.textContent = priceFormatter(data.close);
            if (elClosePct) { elClosePct.textContent = cPct.text; elClosePct.style.color = cPct.color; }

            const closeVal = data.close;
            const coord = priceSeriesRef.current.priceToCoordinate(closeVal);
            let x = param.point.x + 20;
            if (x > container.clientWidth - 185) x = param.point.x - 185;
            let y = coord ? coord - 40 : param.point.y;
            if (y < 10) y = 10;
            const maxY = container.clientHeight - tip.clientHeight - 10;
            if (y > maxY) y = maxY;
            tip.style.transform = `translate(${x}px, ${y}px)`;
            tip.style.opacity = '1';
        };

        pChart.subscribeCrosshairMove(handleCrosshair);
        return () => {
            pChart.unsubscribeCrosshairMove(handleCrosshair);
            pChart.timeScale().unsubscribeVisibleLogicalRangeChange(updateVisibleMarkers);
            if (markerRafId !== -1) cancelAnimationFrame(markerRafId);
        };
    }, [stockData, indicatorData]);

    // ── 패널 비율 변경 → 차트 resize ────────────────────────────────────────
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

            {/* ── 차트 패널 영역 ──────────────────────────────────────────── */}
            <div style={{ height: TOTAL_HEIGHT }} className="w-full flex flex-col select-none">
                {PANEL_LABELS.map((label, idx) => (
                    <div key={label} className="flex flex-col shrink-0">
                        <div style={{ height: panelHeights[idx] }} className="w-full relative">
                            <div className="absolute top-2 left-3 z-10 pointer-events-none">
                                <span className="text-[10px] font-black tracking-widest text-muted-foreground/80 uppercase">
                                    {label}
                                </span>
                            </div>
                            <div ref={el => { containerRefs.current[idx] = el; }} className="w-full h-full" />

                            {/* [성능] 툴팁: innerHTML 방식 → 미리 빌드된 DOM 구조, textContent만 주입 */}
                            {idx === 0 && (
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
                            )}
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
