import { useStockStore } from "@/store/useStockStore";
import { FormatStockWatchListItem, Stock } from "@/types/stock";
import { isEmpty } from "radash";
import { useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export default function useStockSearch() {
    const {
        setCurrentTicker,
        addRecentSearch,
        removeRecentSearch,
        clearRecentSearch,
        stockWatchList,
        insertWatchList,
        deleteFromWatchList,
        setTickerToName
    } = useStockStore();

    const user = useAuthStore(s => s.user);

    /**
     * [Senior UX] 종목명 자동 매칭 시스템
     * - 티커 형식(영문/숫자)이 아닐 경우 검색 API 호출 -> 가장 첫번째 결과의 티커 적용
     * - "삼성전자" -> 005930.KS / "엔비디아" -> NVDA
     */
    const handleRecentSearch = useCallback(async (ticker: string) => {
        if (isEmpty(ticker)) return;

        try {
            // [UX Improvement] 'AAPL' 같은 영문 직입력 시에도 한글 종목명('애플')을 가져오기 위해 무조건 API 경유
            const res = await fetch(`/api/stock/search?q=${encodeURIComponent(ticker.trim())}`);
            const data = await res.json();
            
            if (data && data.length > 0) {
                const bestMatch = data[0].symbol;
                const koName = data[0].shortName;
                
                setCurrentTicker(bestMatch);
                addRecentSearch(bestMatch);
                if (koName) {
                    setTickerToName(bestMatch, koName);
                }
            } else {
                toast.error(`"${ticker}"에 해당하는 종목을 찾을 수 없습니다.`);
            }
        } catch (err) {
            console.error("[Search] Sync Error:", err);
            toast.error("연결 상태를 확인해 주세요.");
        }
    }, [setCurrentTicker, addRecentSearch, setTickerToName]);

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
