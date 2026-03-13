import { getStockQuote } from "@/services/stock.services";
import { Stock } from "@/types/stock";
import { useQuery } from "@tanstack/react-query";

export default function useStockSync(searchTicker: string, range: string = '1mo', interval: string = '1d') {
    const { data: stockData, isLoading, isError } = useQuery<Stock>({
        queryKey: [
            'stock',
            searchTicker,
            range,
            interval
        ],
        queryFn: () => getStockQuote(searchTicker, range, interval),
        enabled: searchTicker.length > 0
    })

    return { stockData, isError, isLoading };
}