import { NextRequest, NextResponse } from "next/server";

// 응답 인터페이스 정의
interface UnifiedStockResult {
    symbol: string;
    shortName: string;
    type: string;
    exchange: string;
    source: 'naver' | 'yahoo';
}

// 네이버 API 응답 객체 구조
interface NaverStockItem {
    name: string;
    code: string;
    typeCode: string;
    [key: string]: unknown;
}

interface YahooQuote {
    symbol: string;
    shortName?: string;
    longName?: string;
    quoteType: string;
    exchange: string;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 1) {
        return NextResponse.json([]);
    }

    try {
        // [Optimization] Naver API는 .KS, .KQ 접미사가 있으면 검색이 잘 안 되므로 순수 티커만 추출
        const cleanQuery = query.split('.')[0];

        // [Step 1] Naver Stock Search API 호출
        // 네이버 API는 한글 종목명 및 국내 주식 코드 검색에 매우 최적화되어 있습니다.
        const naverUrl = `https://ac.stock.naver.com/ac?q=${encodeURIComponent(cleanQuery)}&target=stock&re=1`;
        const naverRes = await fetch(naverUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 3600 }
        });

        if (naverRes.ok) {
            const naverData = await naverRes.json();
            // 네이버 API 응답 구조: { items: [ [ [name, code, ...], ... ] ] } 형태인 경우가 많음
            // 혹은 작성하신 것처럼 { items: [{ name, code, typeCode }] } 형태인지 재확인 필요
            const rawItems = naverData?.items || [];

            if (Array.isArray(rawItems) && rawItems.length > 0) {
                const results: UnifiedStockResult[] = rawItems.map((item: NaverStockItem) => {
                    const name = item.name;
                    const ticker = item.code;
                    const market = item.typeCode; // KOSPI, KOSDAQ, NASDAQ, NYSE 등

                    let yahooTicker = ticker;
                    if (market === 'KOSDAQ') yahooTicker = `${ticker}.KQ`;
                    else if (market === 'KOSPI') yahooTicker = `${ticker}.KS`;

                    return {
                        symbol: yahooTicker,
                        shortName: name,
                        type: 'EQUITY',
                        exchange: market,
                        source: 'naver'
                    };
                });
                return NextResponse.json(results);
            }
        }

        // [Step 2] Naver 결과 없을 시 Yahoo Fallback (미국 주식 등 글로벌 대응)
        const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=5`;
        const yahooRes = await fetch(yahooUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (yahooRes.ok) {
            const data = await yahooRes.json();
            const quotes: UnifiedStockResult[] = (data.quotes || []).map((q: YahooQuote) => ({
                symbol: q.symbol,
                shortName: q.shortName || q.longName || q.symbol,
                type: q.quoteType,
                exchange: q.exchange,
                source: 'yahoo'
            }));
            return NextResponse.json(quotes);
        }

        return NextResponse.json([]);
    } catch (error: unknown) {
        console.error('[API] Hybrid Search Error:', error instanceof Error ? error.message : error);
        return NextResponse.json({ error: '검색 엔진 일시 오류' }, { status: 503 });
    }
}