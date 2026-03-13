import { Stock } from "@/types/stock";
import { fetchData } from "./api.utils";

/**
 * [Stock Service]
 * - 역할: 주식 검색을 위해 우리가 만든 로컬 API(/api/stock)를 호출합니다.
 */
const baseURL = 'http://localhost:3000';

export const getStockQuote = async (ticker: string, range: string = '1mo', interval: string = '1d'): Promise<Stock> => {

    // 우리가 만든 '중계소' 주소로 요청을 보냅니다.
    // range와 interval 파라미터를 추가하여 차트 데이터를 조절합니다.
    return fetchData(baseURL, `/api/stock?ticker=${ticker}&range=${range}&interval=${interval}`);
}