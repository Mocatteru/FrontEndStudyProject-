import { getStockQuote } from "@/services/stock.services";
import { Stock } from "@/types/stock";
import { useQuery } from "@tanstack/react-query";

export default function useStockSync(searchTicker: string, range: string = '1mo', interval: string = '1d') {
    const { data: stockData, isLoading, isError } = useQuery<Stock>({
        queryKey: ['stock', searchTicker, range, interval],
        queryFn: () => getStockQuote(searchTicker, range, interval),
        enabled: searchTicker.length > 0,
        // [성능] 5분 이내 동일 요청은 캐시 재사용 (불필요한 네트워크 왕복 방지)
        staleTime: 1000 * 60 * 5,
        // [성능] 마지막 구독 해제 후 30분간 메모리에 캐시 유지
        gcTime: 1000 * 60 * 30,
        // [성능] 백그라운드 탭 재포커스 시 자동 재요청 비활성화
        refetchOnWindowFocus: false,
    })

    return { stockData, isError, isLoading };
}