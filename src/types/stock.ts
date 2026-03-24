
export interface StockWatchListItemProps {
    ticker: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    isPositive: boolean;
    currency: string;
    isOpen?: boolean; // [Senior] 사이드바의 확장/축소 상태를 전달받음
}

export interface Stock {
    // 1. 기본 식별 정보
    symbol: string;               // 종목 코드 (예: AAPL)
    shortName?: string;           // 회사명 (단축)
    longName?: string;            // 회사명 (전체)
    currency: string;             // 통화 (USD, KRW 등)

    // 2. 현재 가격 및 등락 (실시간성)
    regularMarketPrice: number;   // 현재가
    regularMarketChange: number;  // 전일 대비 등락액
    regularMarketChangePercent: number; // 전일 대비 등락률
    regularMarketTime?: Date;     // 마지막 거래 시간

    // 3. 오늘 하루의 움직임 (Intraday)
    regularMarketOpen?: number;   // 시가 (Open)
    regularMarketDayHigh?: number; // 금일 최고가 (High)
    regularMarketDayLow?: number;  // 금일 최저가 (Low)
    regularMarketVolume?: number; // 금일 거래량

    // 4. 통계 및 지표
    marketCap?: number;           // 시가총액
    fiftyTwoWeekHigh?: number;    // 52주 최고가
    fiftyTwoWeekLow?: number;     // 52주 최저가
    averageDailyVolume3Month?: number; // 3개월 평균 거래량
    trailingPE?: number;          // 주가수익비율 (P/E Ratio)
    forwardPE?: number;           // 선행 주가수익비율
    epsTrailingTwelveMonths?: number; // 주당 순이익 (EPS)

    // 5. 시장 상태 및 거래소
    marketState?: string;         // 시장 상태 (REGULAR, CLOSED, PRE, POST 등)
    fullExchangeName?: string;    // 상장 거래소 (전체 이름)
    exchange?: string;            // 상장 거래소 (단축)

    // 6. 추가 통계 지표
    sharesOutstanding?: number;   // 유통 주식수
    dividendYield?: number;       // 배당 수익률
    fiftyDayAverage?: number;     // 50일 평균가
    twoHundredDayAverage?: number; // 200일 평균가

    // 7. 차트 데이터 (OHLC 확장)
    historical?: {
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
        timestamp: number;
    }[];
}

/**
 * [Market State Mapping]
 * - 왜 만들었을까?: Yahoo Finance API는 시장 상태를 'POSTPOST', 'PRE' 같은 내부 코드로 반환합니다.
 *   이 코드들은 컴퓨터는 이해하기 쉽지만, 실제 주식 앱을 사용하는 일반 사용자에겐 외계어처럼 보입니다.
 *   따라서 이 매핑 테이블을 만들어, 사용자에게는 친숙한 "장후 거래", "영업 중" 같은 한글로 번역해서 보여줍니다.
 * - 학습 포인트: 이처럼 외부 API의 데이터를 그대로 화면에 뿌리지 않고, 
 *   프론트엔드에서 한 번 가공(Formatting/Mapping)하여 보여주는 것이 좋은 UX의 기본입니다!
 */
export const MARKET_STATE_MAP: Record<string, string> = {
    'PRE': '장전 거래',
    'PREPRE': '장전 거래',
    'REGULAR': '영업 중',
    'POST': '장후 거래',      // 정규장 마감 후 시작되는 애프터마켓
    'POSTPOST': '장후 거래',
    'CLOSED': '장 마감',
    'PREMARKET': '개장 전',
    'POSTMARKET': '장 마감 후',
};

export const getMarketStateName = (state?: string) => {
    if (!state) return '정보 없음';
    return MARKET_STATE_MAP[state] || state;
};

/**
 * [Chart Period Options 타입 정의 및 상수화]
 * - 왜 만들었을까?: 차트 기간 옵션들은 화면에 그릴 'label'(예: 1분)과 API에 던질 'range'(얼마나 예전부터?), 
 *   'interval'(봉 하나의 시간 단위) 3박자가 맞아야 합니다.
 *   이것들을 페이지(UI) 코드에 하드코딩하면 나중에 옵션을 추가하거나 수정할 때 찾아 헤매게 됩니다.
 *   따라서 이처럼 상수로 빼두면(Centralize), 이곳만 수정해도 전체 앱이 알아서 업데이트됩니다.
 * 
 * - API 제약에 따른 최적화 팁:
 *   1) 1분봉(1m): 데이터를 너무 많이 부르면 렉이 걸립니다! 브라우저 렌더링 한계를 고려해 range를 '1d'(하루치)로 줄였습니다.
 *   2) 년봉(1y): Yahoo API에서 '1y' 단위의 정확한 봉을 미지원하는 경우가 잦아, 가장 큰 단위인 '3mo(분기)'로 
 *      전체('max')를 불러와 '년봉처럼 보이는 가장 긴 추세 차트'를 구현했습니다.
 */
export interface ChartPeriodOption {
    label: string;
    range: string;
    interval: string;
}

export const PERIOD_OPTIONS = {
    /**
     * [MINUTE Options - 분봉]
     * - 수정 근거 (Senior's Perspective):
     *   1. 규격 정규화: Yahoo API에서 지원하지 않는 3m, 10m 단위를 각각 2m, 15m로 수정하였습니다.
     *   2. 성능 최적화: 초기에 과도한 데이터를 불러오는 것을 방지하기 위해 range를 단기(1d~5d)로 제한하였습니다.
     */
    MINUTE: [
        { label: '1분', range: '1d', interval: '1m' },
        { label: '2분', range: '1d', interval: '2m' },   // Yahoo 규격(2m) 반영 및 리소스 절약
        { label: '5분', range: '1d', interval: '5m' },
        { label: '15분', range: '2d', interval: '15m' }, // 중기 분봉으로 확장 및 데이터 부하 분산
        { label: '30분', range: '3d', interval: '30m' },
        { label: '60분', range: '5d', interval: '60m' },
    ] as ChartPeriodOption[],

    /**
     * [MAJOR Options - 주요 기간]
     * - 수정 근거:
     *   1. 일봉: 전반적인 추세 파악을 위해 표준적인 1년(1y) 범위를 권장합니다.
     *   2. 주봉: 장기 이평선과 거대 지지 라인을 보기 위해 5년(5y)으로 확장했습니다.
     */
    MAJOR: [
        { label: '일', range: '1y', interval: '1d' },    // 실무 차트 분석 기본값 (약 252개 캔들)
        { label: '주', range: '5y', interval: '1wk' },   // 역사적 고점/저점 파악용
        { label: '월', range: 'max', interval: '1mo' },  // 전체 히스토리 월봉
        { label: '분기', range: 'max', interval: '3mo' }, // 거시적 흐름 파악 (년봉 대용)
    ] as ChartPeriodOption[]
};

export const KR_TICKER_SUFFIX = ".KS";
export const KR_TICKER_LENGTH = 6;

export function FormatTickerKR(ticker: string) {
    if (ticker.length === KR_TICKER_LENGTH) {
        return ticker.trim().toUpperCase().concat(KR_TICKER_SUFFIX);
    }
    return ticker.trim().toUpperCase();
}

//화폐 단위 결정 및 포맷팅 하는 포맷 함수입니다.
export function FormatPriceCurrency(currency: string | undefined, price: number | undefined) {
    if (price === undefined || price === null || isNaN(price)) {
        return "---";
    }

    const isKRW = currency === "KRW";
    // 원화는 소수점 없이 반올림하여 정수로 표기, 달러는 소수점 2자리 고정
    const formattedPrice = isKRW
        ? Math.round(price).toLocaleString('ko-KR')
        : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return isKRW ? `${formattedPrice}원` : `$${formattedPrice}`;
}

//티커 트림 후 업퍼케이스 포맷 함수입니다.
export function FormatTicker(ticker: string) {
    return ticker.toUpperCase().trim();
}

export function FormatStockWatchListItem(stock: Stock): StockWatchListItemProps {
    return {
        ticker: stock.symbol || '',
        name: stock.longName || stock.shortName || 'N/A',
        price: stock.regularMarketPrice ?? 0,
        change: stock.regularMarketChange ?? 0,
        changePercent: stock.regularMarketChangePercent ?? 0,
        isPositive: (stock.regularMarketChange ?? 0) > 0,
        currency: stock.currency ?? '',
    }
}

