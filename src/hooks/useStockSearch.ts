import { useStockStore } from "@/store/useStockStore";
import { FormatStockWatchListItem, FormatTicker, FormatTickerKR, KR_TICKER_LENGTH, Stock } from "@/types/stock";
import { isEmpty, isEqual } from "radash";
import { useCallback } from "react";

export default function useStockSearch() {

    const { currentTicker, setCurrentTicker, addRecentSearch, toggleWatchList, removeRecentSearch, clearRecentSearch } = useStockStore();


    /**
     * 
     * @param ticker 티커명(정제전)
     * @returns 티커 포멧팅 후 비어있는지 여부확인과 국내주식 판별후 포멧팅도 수행하는 함수입니다
     */
    const handleRecentSearch = useCallback((ticker: string) => {
        const formattedTicker = FormatTicker(ticker);
        if (isEmpty(formattedTicker) || isEqual(formattedTicker, currentTicker))
            return;
        if (formattedTicker.length === KR_TICKER_LENGTH) {
            const tickerKS = FormatTickerKR(formattedTicker);
            setCurrentTicker(tickerKS);
            addRecentSearch(tickerKS);
            return;
        }
        setCurrentTicker(formattedTicker);
        addRecentSearch(formattedTicker);
    }, [currentTicker, setCurrentTicker, addRecentSearch]);

    const handleWatchList = useCallback((stock: Stock) => {
        toggleWatchList(FormatStockWatchListItem(stock));
    }, [toggleWatchList]);

    const handleRemoveRecentSearch = useCallback((ticker: string) => {
        removeRecentSearch(ticker);
    }, [removeRecentSearch]);

    const handleClearRecentSearch = useCallback(() => {
        clearRecentSearch();
    }, [clearRecentSearch]);

    return {
        handleRecentSearch, handleWatchList, handleRemoveRecentSearch, handleClearRecentSearch
    }
}

