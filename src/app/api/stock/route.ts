import { NextRequest, NextResponse } from "next/server"
import yahooFinance from 'yahoo-finance2';

/**
 * [Next.js Route Handler - 주식 데이터 중계소]
 * - 정체: 이 파일은 UI를 그리는 '페이지'가 아니라, 데이터만 주고받는 '서버 API'입니다.
 * - 역할: 브라우저에서 보낸 주식 검색 요청을 받아, 서버 환경에서 Yahoo Finance API를 호출하고 결과를 반환합니다.
 * - 왜 필요한가? (CORS 방지): 브라우저가 직접 외부 API(Yahoo)를 호출하면 차단될 수 있으므로, 우리 서버를 거쳐서 안전하게 데이터를 가져오기 위함입니다.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tickerParam = searchParams.get('ticker');

    if (!tickerParam) {
        return NextResponse.json({ error: '티커가 필요합니다.' }, { status: 400 });
    }

    const range = searchParams.get('range') || '1mo';
    const interval = searchParams.get('interval') || '1d';

    try {
        // [Senior] Yahoo Finance API 인터페이스 정의 (any 제거 및 타입 안전성 확보)
        interface YahooQuote {
            symbol: string;
            shortName?: string;
            longName?: string;
            currency?: string;
            regularMarketPrice?: number;
            regularMarketChange?: number;
            regularMarketChangePercent?: number;
            [key: string]: unknown;
        }

        const YahooFinanceConstructor = (yahooFinance as unknown as { YahooFinance: new (opts: object) => unknown }).YahooFinance || yahooFinance;
        const yahoo = new (YahooFinanceConstructor as new (opts: object) => {
            quote: (ticker: string | string[]) => Promise<YahooQuote | YahooQuote[]>;
            chart: (ticker: string, opts: object) => Promise<{ quotes: { date: Date | string;[key: string]: unknown }[] }>;
        })({ suppressNotices: ['yahooSurvey'] });

        // [Senior] Bulk Tickers 파싱 (쉼표 구분)
        const tickers = tickerParam.includes(',') ? tickerParam.split(',').map(t => t.trim()) : null;

        if (tickers) {
            // [Why] 사이드바 동기화 시 수십 개의 요청을 하나로 묶어 네트워크 오버헤드와 429 에러를 방지합니다.
            const quotes = await yahoo.quote(tickers);
            const results = Array.isArray(quotes) ? quotes : [quotes];
            return NextResponse.json(results);
        }

        // --- 단일 종목 처리 로직 ---
        const ticker = tickerParam;

        let quoteResult: YahooQuote | Record<string, unknown> = {};
        try {
            quoteResult = await yahoo.quote(ticker) as YahooQuote;
        } catch (e: unknown) {
            console.error('[API] Quote Fetch Error:', e);
        }

        const end = new Date();
        const start = new Date();

        // [Senior] 데이터 기간 매핑
        switch (range) {
            case '1d': start.setDate(end.getDate() - 1); break;
            case '2d': start.setDate(end.getDate() - 2); break;
            case '3d': start.setDate(end.getDate() - 3); break;
            case '5d': start.setDate(end.getDate() - 5); break;
            case '7d': start.setDate(end.getDate() - 7); break;
            case '1mo': start.setMonth(end.getMonth() - 1); break;
            case '3mo': start.setMonth(end.getMonth() - 3); break;
            case '6mo': start.setMonth(end.getMonth() - 6); break;
            case '1y': start.setFullYear(end.getFullYear() - 1); break;
            case '2y': start.setFullYear(end.getFullYear() - 2); break;
            case '5y': start.setFullYear(end.getFullYear() - 5); break;
            case 'max': start.setFullYear(end.getFullYear() - 30); break;
            default: start.setMonth(end.getMonth() - 1);
        }

        interface HistoricalItem {
            date: string;
            open: number;
            high: number;
            low: number;
            close: number;
            volume: number;
            timestamp: number;
        }

        let historical: HistoricalItem[] = [];
        try {
            const chartResult = await yahoo.chart(ticker, {
                period1: start,
                period2: end,
                // [Senior] yahoo-finance2 규격에 맞는 리터럴 타입 적용
                interval: interval as "1m" | "2m" | "5m" | "15m" | "30m" | "60m" | "90m" | "1h" | "1d" | "5d" | "1wk" | "1mo" | "3mo",
            });

            historical = (chartResult.quotes || []).map((q) => ({
                date: new Date(q.date).toLocaleString('ko-KR', {
                    month: 'short', day: 'numeric',
                    hour: interval.includes('m') || interval.includes('h') ? '2-digit' : undefined,
                    minute: interval.includes('m') ? '2-digit' : undefined,
                }),
                open: Number(Number(q.open || 0).toFixed(2)),
                high: Number(Number(q.high || 0).toFixed(2)),
                low: Number(Number(q.low || 0).toFixed(2)),
                close: Number(Number(q.close || q.regularMarketPrice || 0).toFixed(2)),
                volume: Number(q.volume || 0),
                timestamp: new Date(q.date).getTime()
            })).filter((q: HistoricalItem) => q.close !== 0);
        } catch (e: unknown) {
            console.error('[API] Chart Fetch Error:', e);
        }

        if (!('symbol' in quoteResult) && historical.length === 0) {
            throw new Error('해당 종목의 데이터를 찾을 수 없습니다.');
        }

        return NextResponse.json({
            ...quoteResult,
            historical
        });
    } catch (error: unknown) {
        const err = error as Error;
        console.error('[API] Final Error:', err.message);

        return NextResponse.json({
            error: '주식 정보를 불러오는 데 실패했습니다.',
            details: err.message,
            type: err.name
        }, { status: 500 });
    }
}