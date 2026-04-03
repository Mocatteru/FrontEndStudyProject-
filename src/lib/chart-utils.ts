import { Time } from "lightweight-charts";
import { Stock } from "@/types/stock";
import { calcSMA, calcRSI, calcMACD } from "./indicators";

export interface IndicatorData {
    raw: NonNullable<Stock['historical']>;
    times: Time[];
    closes: number[];
    isMs: boolean;
    maResults: {
        label: string;
        color: string;
        data: { time: Time; value: number }[];
    }[];
    rsiData: { time: Time; value: number }[];
    macdResults: {
        time: Time;
        macd: number;
        signal: number;
        histogram: number;
        color: string;
    }[];
    volData: {
        time: Time;
        value: number;
        color: string;
    }[];
}

export const MA_CONFIGS = [
    { period: 5, color: '#facc15', label: 'MA 5' },
    { period: 20, color: '#a78bfa', label: 'MA 20' },
    { period: 60, color: '#fb923c', label: 'MA 60' },
    { period: 120, color: '#34d399', label: 'MA 120' },
] as const;

export const formatVolume = (v: number) => {
    if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toLocaleString();
};

export const RSI_PERIOD = 14;
export const MACD_CONFIG = { FAST: 12, SLOW: 26, SIGNAL: 9 };

export const calculateIndicators = (stockData: Stock): IndicatorData | null => {
    if (!stockData?.historical?.length) return null;

    // [Best Practice & BugFix] 타임스탬프 순으로 정렬 후 초단위 기준 중복 데이터 완전히 제거
    const sorted = [...stockData.historical].sort((a, b) => a.timestamp - b.timestamp);
    const isMs = sorted[0].timestamp > 10_000_000_000;

    const raw: NonNullable<Stock['historical']> = [];
    const times: Time[] = [];
    let lastTime = -1;

    for (const d of sorted) {
        const t = Math.floor(d.timestamp / (isMs ? 1000 : 1));
        if (t > lastTime) {
            raw.push(d);
            times.push(t as Time);
            lastTime = t;
        }
    }

    const closes = raw.map(d => d.close);

    const maResults = MA_CONFIGS.map(cfg => {
        const vals = calcSMA(closes, cfg.period);
        const offset = closes.length - vals.length;
        return {
            label: cfg.label,
            color: cfg.color,
            data: vals.map((v, i) => ({ time: times[offset + i], value: v })),
        };
    });

    const rsiRaw = calcRSI(closes, RSI_PERIOD);
    const rsiOffset = closes.length - rsiRaw.length;
    const rsiData = rsiRaw.map((v, i) => ({ time: times[rsiOffset + i], value: v }));

    const macdRaw = calcMACD(closes, MACD_CONFIG.FAST, MACD_CONFIG.SLOW, MACD_CONFIG.SIGNAL);
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
            color: m.histogram >= 0 ? '#ef4444' : '#3b82f6',
        })),
        volData: raw.map((d, i) => ({
            time: times[i],
            value: d.volume ?? 0,
            color: d.close >= d.open ? '#ef4444' : '#3b82f6',
        })),
    };
};
