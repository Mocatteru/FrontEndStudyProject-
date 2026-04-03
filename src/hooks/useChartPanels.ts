import { useState, useRef, useEffect, useCallback } from 'react';
import { createChart, IChartApi, LogicalRange, ColorType, Time } from 'lightweight-charts';

// [Refactoring] 상수 및 타입 정의
export const TOTAL_HEIGHT = 480;
export const DIVIDER_H = 5;
export const MIN_PANE_H = 50;
export const PANEL_COUNT = 4;
export const TOTAL_DIVIDERS = PANEL_COUNT - 1;
export const DEFAULT_RATIOS = [0.52, 0.16, 0.16, 0.16];
export const PANEL_LABELS = ['가격', 'RSI (14)', 'MACD (12,26,9)', '거래량'];

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

export const useChartPanels = () => {
    const [ratios, setRatios] = useState<number[]>(DEFAULT_RATIOS);
    const containerRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
    const chartRefs = useRef<(IChartApi | null)[]>([null, null, null, null]);
    const isSyncing = useRef(false);
    const [chartsReady, setChartsReady] = useState(false);

    // 드래그 상태 관리
    const activeDivider = useRef<number>(-1);
    const dragStartY = useRef(0);
    const dragStartRatios = useRef<number[]>([]);
    const dragRafId = useRef<number>(-1);

    const usableH = TOTAL_HEIGHT - DIVIDER_H * TOTAL_DIVIDERS;
    const panelHeights = ratios.map(r => Math.max(MIN_PANE_H, Math.round(usableH * r)));

    const onDividerMouseDown = useCallback((idx: number) => (e: React.MouseEvent) => {
        e.preventDefault();
        activeDivider.current = idx;
        dragStartY.current = e.clientY;
        dragStartRatios.current = [...ratios];
    }, [ratios]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (activeDivider.current < 0) return;
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

    // [Fix] 차트 초기화 안정화: useEffect를 통해 마운트 후 요소들이 접근 가능해질 때 생성
    useEffect(() => {
        // 모든 컨테이너가 준비될 때까지 기다립니다. (특히 dynamic import 시 CSR)
        const checkReady = () => {
            const allReady = containerRefs.current.every(r => r !== null);
            if (allReady && !chartRefs.current[0]) {
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
                
                // 차트가 성공적으로 초기화되었음을 알립니다.
                setChartsReady(true);
            } else if (!allReady) {
                // DOM이 렌더링을 지연하는 경우 (next/dynamic) 짧은 간격으로 재시도
                requestAnimationFrame(checkReady);
            }
        };

        checkReady();

        return () => {
            chartRefs.current.forEach(c => c?.remove());
            chartRefs.current = [null, null, null, null];
            setChartsReady(false);
        };
    }, []);

    // [Fix] 콜백 Ref가 매번 새 함수가 되더라도 useEffect가 차트를 안전하게 관리하므로 단순화
    const setContainerRef = useCallback((idx: number) => (el: HTMLDivElement | null) => {
        containerRefs.current[idx] = el;
    }, []);

    return {
        ratios,
        panelHeights,
        containerRefs,
        chartRefs,
        onDividerMouseDown,
        setContainerRef,
        chartsReady,
    };
};
