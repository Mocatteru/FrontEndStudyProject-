import { Stock } from "@/types/stock";
import { fetchData } from "./api.utils";

/**
 * [Stock Service]
 * - 역할: 주식 검색을 위해 우리가 만든 로컬 API(/api/stock)를 호출합니다.
 * 
 * [학습 포인트: API BaseURL 설정의 중요성]
 * - 기존에 'http://localhost:3000'으로 하드코딩 되어있던 경우, 스마트폰에서 접속하면 
 *   스마트폰 자기 자신(localhost)에게 데이터를 달라고 요청하게 되어 네트워크 에러가 발생합니다.
 * - 실무 해결책: 
 *   1) 상대 경로('')를 사용하면 브라우저가 소스(PC의 IP 정체)를 알아서 찾아가므로 유연하게 대처 가능합니다.
 *   2) 실제 배포 환경에서는 .env 파일에 환경 변수(NEXT_PUBLIC_API_URL)를 만들어 관리합니다.
 */
const baseURL = '';

export const getStockQuote = async (ticker: string, range: string = '1mo', interval: string = '1d'): Promise<Stock> => {
    // 우리가 만든 '중계소' 주소로 요청을 보냅니다.
    // range와 interval 파라미터를 추가하여 차트 데이터를 조절합니다.
    return fetchData(baseURL, `/api/stock?ticker=${ticker}&range=${range}&interval=${interval}`);
}