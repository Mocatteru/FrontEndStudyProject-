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
        const YahooFinanceConstructor = (yahooFinance as any).YahooFinance || yahooFinance;
        const yahoo = new (YahooFinanceConstructor as any)({ suppressNotices: ['yahooSurvey'] });

        // 1. 현재 시세 정보 조회
        // [학습 포인트: 분리된 에러 핸들링 (Resilient Fetching)]
        // 시세와 차트를 하나의 try-catch로 묶으면 하나만 실패해도 전체가 500 에러를 뿜습니다.
        // 이렇게 각각 try-catch를 나누면 시세가 없어도 차트는 보여주는 유연한 앱이 됩니다.
        let quoteResult: any = {};
        try {
            quoteResult = await yahoo.quote(ticker);
        } catch (e: any) {
            console.error('Quote Fetch Error:', e.message);
            // 시세 정보가 없어도 차트 데이터는 시도해볼 수 있으므로 에러를 던지지 않음 (Graceful Degradation)
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
            case '5d': start.setDate(end.getDate() - 5); break;
            case '1mo': start.setMonth(end.getMonth() - 1); break;
            case '3mo': start.setMonth(end.getMonth() - 3); break;
            case '6mo': start.setMonth(end.getMonth() - 6); break;
            case '1y': start.setFullYear(end.getFullYear() - 1); break;
            case '2y': start.setFullYear(end.getFullYear() - 2); break;
            case '5y': start.setFullYear(end.getFullYear() - 5); break;
            case 'max': start.setFullYear(end.getFullYear() - 30); break;
            default: start.setMonth(end.getMonth() - 1);
        }

        let historical: any[] = [];
        try {
            const chartResult = await yahoo.chart(ticker, {
                period1: start,
                period2: end,
                interval: interval as any,
            });

            historical = (chartResult.quotes || []).map((q: any) => ({
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
            })).filter((q: any) => q.close !== 0);
        } catch (e: any) {
            console.error('Chart Fetch Error:', e.message);
            // 차트 데이터가 없어도 시세 정보는 반환함
        }

        // [학습 포인트: 최종 방어 로직]
        // 두 개 다 실패했을 때만 진짜 에러를 던져 클라이언트에게 알려줍니다.
        if (!quoteResult.symbol && historical.length === 0) {
            throw new Error('해당 종목의 데이터를 찾을 수 없습니다.');
        }

        return NextResponse.json({
            ...quoteResult,
            historical
        });
    } catch (error: any) {
        const errorDetails = {
            message: error.message,
            name: error.name,
            ticker,
            range,
            interval
        };

        console.error('Stock API Error Detail:', errorDetails);

        return NextResponse.json({
            error: '주식 정보를 불러오는 데 실패했습니다.',
            details: error.message,
            type: error.name
        }, { status: 500 });
    }
}