import { useState, useEffect } from "react";
import { useStockStore } from "@/store/useStockStore";
import { getStockQuote, getStocksQuotesBulk } from "@/services/stock.services";
import { FormatStockWatchListItem, Stock, POPULAR_TICKERS } from "@/types/stock";

/**
 * [Senior] 사이드바 데이터 동기화 통합 훅
 * - 관심목록(Watchlist)과 인기목록(Popular)의 최신 시세를 벌크 API를 통해 효율적으로 가져옵니다.
 */
export function useSidebarSync() {
    const stockWatchList = useStockStore(s => s.stockWatchList);
    const updateWatchListBulk = useStockStore(s => s.updateWatchListBulk);
    const setStockPopularList = useStockStore(s => s.setStockPopularList);
    const [isSyncing, setIsSyncing] = useState(false);

    const currentTicker = useStockStore(s => s.currentTicker);

    useEffect(() => {
        let isMounted = true;

        /**
         * [Why] 개별 API 호출 대신 벌크 API를 사용하여 네트워크 부하를 줄이고 렌더링 횟수를 최소화합니다.
         */
        const syncSidebarData = async () => {
            setIsSyncing(true);
            try {
                // 1. 관심 목록 동기화
                if (stockWatchList.length > 0) {
                    const tickers = stockWatchList.map(item => item.ticker);
                    const bulkData = await getStocksQuotesBulk(tickers);
                    
                    if (isMounted && bulkData?.length > 0) {
                        const results = stockWatchList.map(item => {
                            const stock = bulkData.find(s => s.symbol === item.ticker);
                            return stock ? { ...item, ...FormatStockWatchListItem(stock) } : item;
                        });
                        updateWatchListBulk(results);
                    }
                }

                // 2. 인기 목록 동기화
                const popularData = await getStocksQuotesBulk(POPULAR_TICKERS);
                if (isMounted && popularData?.length > 0) {
                    const results = popularData.map(stock => FormatStockWatchListItem(stock));
                    setStockPopularList(results);
                }

            } catch (err) {
                console.error("[Sidebar Sync Error]", err);
            } finally {
                if (isMounted) setIsSyncing(false);
            }
        };

        syncSidebarData();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stockWatchList.length, currentTicker]);

    return { isSyncing };
}

/**
 * [Senior] 특정 종목 상세 데이터 조회 훅
 * - 메인 차트 및 대시보드 렌더링용
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
                if (isMounted) setStockData(data);
            } catch (error) {
                console.error("[Stock Data Fetch Error]", error);
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