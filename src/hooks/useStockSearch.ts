import { useStockStore } from "@/store/useStockStore";
import { FormatStockWatchListItem, FormatTicker, FormatTickerKR, KR_TICKER_LENGTH, Stock } from "@/types/stock";
import { isEmpty, isEqual } from "radash";
import { useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export default function useStockSearch() {
    const {
        currentTicker,
        setCurrentTicker,
        addRecentSearch,
        removeRecentSearch,
        clearRecentSearch,
        stockWatchList,
        insertWatchList,
        deleteFromWatchList
    } = useStockStore();

    const user = useAuthStore(s => s.user);

    /**
     * @param ticker 티커명(정제전)
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

    const handleWatchList = useCallback(async (stock: Stock) => {
        if (!user) {
            toast.error("로그인이 필요한 기능입니다.");
            return;
        }

        const isExist = stockWatchList.some(m => m.ticker === stock.symbol);
        const formattedStock = FormatStockWatchListItem(stock);

        if (isExist) {
            await deleteFromWatchList(user.id, stock.symbol);
            toast.info("관심목록에서 제거되었습니다.");
        } else {
            await insertWatchList(user.id, formattedStock);
            toast.success("관심목록에 추가되었습니다!");
        }
    }, [stockWatchList, user, insertWatchList, deleteFromWatchList]);

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
