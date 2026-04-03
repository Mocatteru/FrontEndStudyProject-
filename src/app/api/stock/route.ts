import { NextRequest, NextResponse } from "next/server"
import yahooFinance from 'yahoo-finance2';

/**
 * [Next.js Route Handler - 주식 데이터 중계소]
 * - 역할: 브라우저에서 보낸 주식 검색 요청을 받아, 서버 환경에서 Yahoo Finance API를 호출하고 결과를 반환합니다.
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

        // [Type Safety & Hotfix] yahoo-finance2 CJS/ESM Import 대응 로직 복구
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const YahooFinanceConstructor = (yahooFinance as any).YahooFinance || yahooFinance;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const yahoo = new YahooFinanceConstructor({ suppressNotices: ['yahooSurvey'] }) as any;

        const tickers = tickerParam.includes(',') ? tickerParam.split(',').map(t => t.trim()) : null;

        if (tickers) {
            // [QA] validateResult: false를 통해 불완전한 데이터(currency null 등)로 인한 500 에러 방지
            const quotes = await yahoo.quote(tickers, {}, { validateResult: false });
            const results = Array.isArray(quotes) ? quotes : [quotes];
            return NextResponse.json(results);
        }

        const ticker = tickerParam;

        let quoteResult: YahooQuote | Record<string, unknown> = {};
        try {
            quoteResult = await yahoo.quote(ticker, {}, { validateResult: false }) as YahooQuote;
        } catch (e: unknown) {
            console.error('[API] Quote Fetch Error:', e);
        }

        const end = new Date();
        const start = new Date();

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
            interface YahooChartResult {
                quotes: YahooChartQuote[];
            }

            const chartResult = await yahoo.chart(ticker, {
                period1: start,
                period2: end,
                interval: interval as "1d" | "1wk" | "1mo" | "1y",
            }, { validateResult: false }) as unknown as YahooChartResult;

            interface YahooChartQuote {
                date: Date | string | number;
                open?: number;
                high?: number;
                low?: number;
                close?: number;
                regularMarketPrice?: number;
                volume?: number;
            }

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
            details: err.message
        }, { status: 500 });
    }
}