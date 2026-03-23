import { NextRequest, NextResponse } from "next/server"
import yahooFinance from 'yahoo-finance2';


/**
 * [Next.js Route Handler - 주식 데이터 중계소]
 * - 정체: 이 파일은 UI를 그리는 '페이지'가 아니라, 데이터만 주고받는 '서버 API'입니다.
 * - 역할: 브라우저에서 보낸 주식 검색 요청을 받아, 서버 환경에서 Yahoo Finance API를 호출하고 결과를 반환합니다.
 * - 왜 필요한가? (CORS 방지): 브라우저가 직접 외부 API(Yahoo)를 호출하면 차단될 수 있으므로, 우리 서버를 거쳐서 안전하게 데이터를 가져오기 위함입니다.
 * - 비유: 손님(브라우저)의 주문을 받아 멀리 있는 농장(Yahoo)에서 재료를 가져다주는 '카운터 직원' 역할을 수행합니다.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
        return NextResponse.json({
            error: '티커가 필요합니다.',
        }, {
            status: 400,
        })
    }

    const range = searchParams.get('range') || '1mo'; // 1d, 5d, 1mo, 1y, max 등
    const interval = searchParams.get('interval') || '1d'; // 1m, 5m, 1h, 1d, 1wk, 1mo 등

    try {
        // Yahoo Finance 초기화 (모듈 시스템 대응)
        const YahooFinanceConstructor = (yahooFinance as unknown as { YahooFinance: new (opts: object) => unknown }).YahooFinance || yahooFinance;
        const yahoo = new (YahooFinanceConstructor as new (opts: object) => {
            quote: (ticker: string) => Promise<Record<string, unknown>>;
            chart: (ticker: string, opts: object) => Promise<{ quotes: unknown[] }>;
        })({ suppressNotices: ['yahooSurvey'] });

        // 1. 현재 시세 정보 조회
        let quoteResult: Record<string, unknown> = {};
        try {
            quoteResult = await yahoo.quote(ticker);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            console.error('Quote Fetch Error:', message);
        }

        // 2. 차트 데이터 조회
        // [학습 포인트: API 파라미터 컨버팅]
        // yahoo.chart 메서드의 최신 버전은 'range(1mo)' 옵션을 직접 받지 못하고 
        // 반드시 'period1(시작 날짜)', 'period2(끝 날짜)'를 명시해야 합니다.
        // 따라서 클라이언트가 보낸 range 문자열을 백엔드에서 Date 객체로 직접 계산해주는 과정이 필요합니다.
        const end = new Date();
        const start = new Date();

        switch (range) {
            case '1d': start.setDate(end.getDate() - 1); break;
            case '2d': start.setDate(end.getDate() - 2); break; // [Senior] 촘촘한 분봉 조회를 위한 2일 범위 추가
            case '3d': start.setDate(end.getDate() - 3); break; // [Senior] 촘촘한 분봉 조회를 위한 3일 범위 추가
            case '5d': start.setDate(end.getDate() - 5); break;
            case '7d': start.setDate(end.getDate() - 7); break; // [Senior] 일주일치 분봉 조회를 위한 범위 추가
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
                // [Senior] any 대신 string 캐스팅을 사용하여 린트 에러를 방지합니다.
                interval: interval as "1m" | "2m" | "5m" | "15m" | "30m" | "60m" | "90m" | "1h" | "1d" | "5d" | "1wk" | "1mo" | "3mo",
            });

            historical = ((chartResult.quotes || []) as {
                date: string | Date;
                open?: number | null;
                high?: number | null;
                low?: number | null;
                close?: number | null;
                regularMarketPrice?: number | null;
                volume?: number | null;
            }[]).map((q) => ({
                date: new Date(q.date).toLocaleString('ko-KR', {
                    month: 'short', day: 'numeric',
                    hour: interval.includes('m') || interval.includes('h') ? '2-digit' : undefined,
                    minute: interval.includes('m') ? '2-digit' : undefined,
                }),
                open: Number(q.open?.toFixed(2) || 0),
                high: Number(q.high?.toFixed(2) || 0),
                low: Number(q.low?.toFixed(2) || 0),
                close: Number(q.close?.toFixed(2) || q.regularMarketPrice?.toFixed(2) || 0),
                volume: q.volume || 0,
                timestamp: new Date(q.date).getTime()
            })).filter((q: HistoricalItem) => q.close !== 0);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            console.error('Chart Fetch Error:', message);
            // 차트 데이터가 없어도 시세 정보는 반환함
        }

        // [학습 포인트: 최종 방어 로직]
        // 두 개 다 실패했을 때만 진짜 에러를 던져 클라이언트에게 알려줍니다.
        if (!quoteResult['symbol'] && historical.length === 0) {
            throw new Error('해당 종목의 데이터를 찾을 수 없습니다.');
        }

        return NextResponse.json({
            ...quoteResult,
            historical
        });
    } catch (error: unknown) {
        const err = error as Error;
        const errorDetails = {
            message: err.message,
            name: err.name,
            ticker,
            range,
            interval
        };

        console.error('Stock API Error Detail:', errorDetails);

        return NextResponse.json({
            error: '주식 정보를 불러오는 데 실패했습니다.',
            details: err.message,
            type: err.name
        }, { status: 500 });
    }
}