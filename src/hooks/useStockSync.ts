import { useState, useEffect } from "react";
import * as _ from "radash";
import { useStockStore } from "@/store/useStockStore";
import { getStockQuote } from "@/services/stock.services";
import { FormatStockWatchListItem, StockWatchListItemProps, Stock, POPULAR_TICKERS } from "@/types/stock";

/**
 * [Senior] 사이드바(관심목록 + 인기목록) 동기화 통합 훅
 */
export function useSidebarSync() {
    const stockWatchList = useStockStore(s => s.stockWatchList);
    const updateWatchListBulk = useStockStore(s => s.updateWatchListBulk);
    const setStockPopularList = useStockStore(s => s.setStockPopularList);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const syncAllLists = async () => {
            setIsSyncing(true);
            try {
                // [1] 관심 목록 동기화
                if (stockWatchList.length > 0) {
                    const watchListResults: StockWatchListItemProps[] = [];
                    await _.parallel(3, stockWatchList, async (item) => {
                        try {
                            const data = await getStockQuote(item.ticker, '1d', '1d');
                            if (isMounted && data) watchListResults.push({ ...item, ...FormatStockWatchListItem(data) });
                        } catch (err) { console.debug("[WatchSync Failed]", item.ticker, err); }
                    });
                    if (isMounted && watchListResults.length > 0) updateWatchListBulk(watchListResults);
                }

                // [2] 인기 목록 동기화 (하드코딩된 티커 기준)
                const popularResults: StockWatchListItemProps[] = [];
                await _.parallel(5, POPULAR_TICKERS, async (ticker) => {
                    try {
                        const data = await getStockQuote(ticker, '1d', '1d');
                        if (isMounted && data) popularResults.push(FormatStockWatchListItem(data));
                    } catch (err) { console.debug("[PopularSync Failed]", ticker, err); }
                });
                if (isMounted) setStockPopularList(popularResults);

            } finally {
                if (isMounted) setIsSyncing(false);
            }
        };

        syncAllLists();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stockWatchList.length]); // [Optimization] 관심목록 개수 변경 시 재동기화

    return { isSyncing };
}

/**
 * [Senior] 특정 종목의 상세 데이터를 가져오는 메인 동기화 훅
 * - StockPage 메인 대시보드에서 사용
 */
export function useStockSync(ticker: string, range: string, interval: string) {
    const [stockData, setStockData] = useState<Stock | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!ticker) return;

        let isMounted = true;
        const fetchData = async () => {
            setIsLoading(true);
            setIsError(false);
            try {
                const data = await getStockQuote(ticker, range, interval);
                if (isMounted) {
                    setStockData(data);
                }
            } catch (error) {
                console.error("[Fetch Error]", error);
                if (isMounted) setIsError(true);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [ticker, range, interval]);

    return { stockData, isLoading, isError };
}