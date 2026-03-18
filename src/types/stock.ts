/**
 * [Stock Interface]
 * - 역할: 주식 데이터의 구조를 정의하여 타입 안정성을 확보합니다.
 * - 장점: 자동 완성 기능과 컴파일 타임의 에러 체크를 통해 런타임 에러를 사전에 방지합니다.
 */
import type { ApexOptions } from 'apexcharts';
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
 * [ApexCharts Options Generator]
 * - 왜 만들었을까?: 원래 차트 옵션 설정 코드가 StockPage(UI 컴포넌트) 안에 100줄 넘게 차지하고 있었습니다.
 *   UI 컴포넌트는 "데이터를 어떻게 그릴까?"에만 집중해야 하는데 설정 코드가 너무 많아 코드를 읽기 힘들었죠.
 *   그래서 이 설정 로직을 분리(Refactoring)하여, 필요한 옵션을 생성해 반환하는 유틸리티 함수(Factory)로 만들었습니다.
 * - 구성 요소 설명:
 *   1. locales: 차트 안의 달력(월, 요일)과 툴바 메뉴들을 전부 완벽하게 한글화했습니다.
 *   2. xaxis.datetimeFormatter: `ko` 로케일 설정만으로는 부족한 'MM/dd' (한국식 월/일) 형식을 강제하기 위한 설정입니다.
 *   3. tooltip.custom: 캔들스틱 차트 특성상 시/고/저/종 4가지 값을 한눈에 깔끔하게 보여주기 위해 
 *      기본 틀 대신 사용자 정의 HTML(Tailwind CSS 포함)을 그려주도록 커스텀했습니다.
 */
export const getStockChartOptions = (chartType: 'line' | 'candlestick'): ApexOptions => {
    // 툴팁 등에서 사용되는 ApexCharts 내부 구조를 정의합니다. (ApexOptions 내장 타입을 쓰되, 필요한 부분만 구체화)
    interface ApexChartContext {
        globals: {
            seriesCandleO: number[][];
            seriesCandleH: number[][];
            seriesCandleL: number[][];
            seriesCandleC: number[][];
            seriesX: number[][];
        }
    }

    interface TooltipParams {
        seriesIndex: number;
        dataPointIndex: number;
        w: ApexChartContext;
    }

    return {
        chart: {
            type: chartType as 'line' | 'candlestick',
            toolbar: { show: false },
            background: 'transparent',
            foreColor: '#9ca3af',
            animations: { enabled: true },
            locales: [{
                name: 'ko',
                options: {
                    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
                    shortMonths: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
                    days: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
                    shortDays: ['일', '월', '화', '수', '목', '금', '토'],
                    toolbar: {
                        download: '이미지 다운로드',
                        selection: '선택',
                        selectionZoom: '선택 확대',
                        zoomIn: '확대',
                        zoomOut: '축소',
                        pan: '이동',
                        reset: '초기화',
                    }
                }
            }],
            defaultLocale: 'ko'
        },
        theme: { mode: 'dark' as const },
        xaxis: {
            type: 'datetime' as const,
            labels: {
                datetimeUTC: false,
                style: { fontSize: '10px' },
                datetimeFormatter: {
                    year: 'yyyy년',
                    month: 'MM월',
                    day: 'MM/dd',
                    hour: 'HH:mm'
                }
            },
            tooltip: { enabled: false }
        },
        yaxis: {
            tooltip: { enabled: true },
            labels: {
                formatter: (val: number) => `$${val.toFixed(2)}`
            }
        },
        grid: {
            borderColor: '#374151',
            strokeDashArray: 4,
        },
        plotOptions: {
            candlestick: {
                colors: {
                    upward: '#ef4444',
                    downward: '#3b82f6'
                }
            }
        },
        stroke: {
            curve: 'smooth' as const,
            width: chartType === 'line' ? 2 : 1
        },
        tooltip: {
            theme: 'dark',
            x: { format: 'yyyy년 MM월 dd일 HH:mm' },
            custom: chartType === 'candlestick' ? function ({ seriesIndex, dataPointIndex, w }: TooltipParams) {
                const o = w.globals.seriesCandleO[seriesIndex][dataPointIndex];
                const h = w.globals.seriesCandleH[seriesIndex][dataPointIndex];
                const l = w.globals.seriesCandleL[seriesIndex][dataPointIndex];
                const c = w.globals.seriesCandleC[seriesIndex][dataPointIndex];

                const date = new Date(w.globals.seriesX[seriesIndex][dataPointIndex]);
                const dateStr = date.toLocaleString('ko-KR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                return `
                    <div class="p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl text-xs space-y-1">
                        <div class="text-gray-400 mb-2 border-b border-gray-700 pb-1">${dateStr}</div>
                        <div class="flex justify-between gap-4"><span class="text-gray-400">시가</span><span class="font-bold text-white">${o.toFixed(2)}</span></div>
                        <div class="flex justify-between gap-4"><span class="text-gray-400">고가</span><span class="font-bold text-white">${h.toFixed(2)}</span></div>
                        <div class="flex justify-between gap-4"><span class="text-gray-400">저가</span><span class="font-bold text-white">${l.toFixed(2)}</span></div>
                        <div class="flex justify-between gap-4"><span class="text-gray-400">종가</span><span class="font-bold text-white">${c.toFixed(2)}</span></div>
                    </div>
                `;
            } : undefined,
            y: {
                formatter: (val: number) => `$${val.toFixed(2)}`
            }
        }
    };
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

//화폐 단위 결정 및 포멧팅 하는 포맷 함수입니다.
export function FormatPriceCurrency(currency: string, marketPrice: number) {
    return currency === "KRW" ? `${marketPrice.toLocaleString()}원` : `$${marketPrice.toFixed(2).toLocaleString()}`;
}

//티커 트림 후 업퍼케이스 포맷 함수입니다.
export function FormatTicker(ticker: string) {
    return ticker.toUpperCase().trim();
}