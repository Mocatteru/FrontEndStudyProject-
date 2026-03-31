/**
 * [성능 최적화] technicalindicators 패키지를 대체하는 순수 함수 모음
 * - 이유: technicalindicators는 ~200KB(gzip)로 SMA/RSI/MACD 3개만 쓰기엔 너무 무거움
 * - 의존성 없는 순수 수학 연산으로 번들 크기를 대폭 절감
 */

/** 단순 이동평균 (SMA) */
export function calcSMA(values: number[], period: number): number[] {
    if (values.length < period) return [];
    const result: number[] = [];
    let sum = 0;
    for (let i = 0; i < period; i++) sum += values[i];
    result.push(sum / period);
    for (let i = period; i < values.length; i++) {
        sum += values[i] - values[i - period];
        result.push(sum / period);
    }
    return result;
}

/** 지수 이동평균 (EMA) — MACD 내부 연산용 */
function calcEMA(values: number[], period: number): number[] {
    if (values.length < period) return [];
    const k = 2 / (period + 1);
    const result: number[] = [];
    // 초기값: 첫 period개의 SMA
    let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(ema);
    for (let i = period; i < values.length; i++) {
        ema = values[i] * k + ema * (1 - k);
        result.push(ema);
    }
    return result;
}

/** RSI (relative strength index) — period=14 */
export function calcRSI(values: number[], period = 14): number[] {
    if (values.length <= period) return [];
    const result: number[] = [];
    let avgGain = 0;
    let avgLoss = 0;

    // 초기 평균 gain/loss 계산
    for (let i = 1; i <= period; i++) {
        const diff = values[i] - values[i - 1];
        if (diff >= 0) avgGain += diff;
        else avgLoss -= diff;
    }
    avgGain /= period;
    avgLoss /= period;
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));

    // Wilder smoothing (EMA with α=1/period)
    for (let i = period + 1; i < values.length; i++) {
        const diff = values[i] - values[i - 1];
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
    }
    return result;
}

export interface MACDResult {
    MACD: number;
    signal: number;
    histogram: number;
}

/** MACD (12, 26, 9) */
export function calcMACD(
    values: number[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9,
): MACDResult[] {
    const fastEMA = calcEMA(values, fastPeriod);
    const slowEMA = calcEMA(values, slowPeriod);

    // slow EMA가 시작되는 시점부터 MACD 라인 산출
    const offset = slowPeriod - fastPeriod; // fast EMA 배열 내 offset
    const macdLine: number[] = slowEMA.map((slow, i) => fastEMA[i + offset] - slow);

    const signalLine = calcEMA(macdLine, signalPeriod);
    const sigOffset = signalPeriod - 1; // signal EMA가 시작되는 macdLine 내 offset

    return signalLine.map((sig, i) => {
        const macd = macdLine[i + sigOffset];
        return {
            MACD: macd,
            signal: sig,
            histogram: macd - sig,
        };
    });
}
