import { StockWatchListItemProps, Stock } from "@/types/stock";
import { create } from "zustand";
import { persist } from "zustand/middleware"; //  1. 미들웨어 추가



interface StockState {
    stock: Stock | null,
    currentTicker: string,
    recentSearchList: string[],
    stockWatchList: StockWatchListItemProps[],
    stockPopularList: StockWatchListItemProps[],
    stockMemo: { ticker: string, memo: string }[],
    setStock: (stock: Stock) => void,
    setCurrentTicker: (ticker: string) => void,
    addRecentSearch: (ticker: string) => void,
    toggleWatchList: (stock: StockWatchListItemProps) => void,
    removeRecentSearch: (ticker: string) => void,
    updateStockWatchList: (stock: StockWatchListItemProps) => void,
    updateWatchListBulk: (list: StockWatchListItemProps[]) => void, // [Senior] 백그라운드 일괄 데이터 새로고침 액션
    clearRecentSearch: () => void,
    clearStockWatchList: () => void,
    clearStockMemo: () => void,
    setStockMemo: (ticker: string, memo: string) => void,
    setStockPopularList: (list: StockWatchListItemProps[]) => void,
}

/**
 * persist 미들웨어의 역할:
 * 1. 상태가 변경될 때마다 지정된 storage(기본값 LocalStorage)에 JSON 형태로 자동 저장
 * 2. 앱이 새로고침될 때 저장된 데이터를 자동으로 로드(Rehydrate)
 * 3. name: 저장소를 식 별하는 키. 다른 서비스와 겹치지 않게 고유하게 지정
 */
export const useStockStore = create<StockState>()( // 추가된 () 주의!
    persist(
        (set) => ({
            stock: null,
            currentTicker: "",
            recentSearchList: [],
            stockWatchList: [],
            stockPopularList: [],
            stockMemo: [],

            // Actions
            setStock: (stock: Stock) => set({ stock }),
            setCurrentTicker: (ticker: string) => set({
                currentTicker: ticker.toUpperCase().trim()
            }),
            addRecentSearch: (ticker: string) => set((state) => ({
                recentSearchList: [ticker.toUpperCase(), ...state.recentSearchList.filter(t => t !== ticker.toUpperCase())].slice(0, 10)
            })),
            setStockPopularList: (list: StockWatchListItemProps[]) => set({ stockPopularList: list }),
            /**
             * [완료: 성능 최적화 - 데이터 정규화 및 선택적 저장]
             * 1. StockWatchListItemProps를 도입하여 관심종목 저장 시 대용량 historical 데이터를 제외함.
             * 2. persist 미들웨어의 partialize 옵션을 사용하여 불필요한 원본 stock 데이터가 로컬스토리지에 저장되는 것을 방지함.
             */
            // [Refactoring: Performance & Defensive Programming]
            // map() + includes() 대신 some()을 사용하여 단축 평가(Short-circuit evaluation)로 O(N) 순회 성능 최적화
            // ticker 정보가 유효한지 엣지 케이스 방어 로직 추가
            toggleWatchList: (stock: StockWatchListItemProps) => set((state) => {
                if (!stock?.ticker) return state;

                const isExist = state.stockWatchList.some(m => m.ticker === stock.ticker);
                return {
                    stockWatchList: isExist
                        ? state.stockWatchList.filter(m => m.ticker !== stock.ticker)
                        : [...state.stockWatchList, stock]
                };
            }),
            removeRecentSearch: (ticker: string) => set((state) => ({
                recentSearchList: state.recentSearchList.filter(t => t !== ticker.toUpperCase())
            })),
            clearRecentSearch: () => set(() => ({
                recentSearchList: []
            })),
            clearStockWatchList: () => set(() => ({
                stockWatchList: []
            })),
            clearStockMemo: () => set(() => ({
                stockMemo: []
            })),
            updateStockWatchList: (stock: StockWatchListItemProps) => set((state) => {
                const existingIndex = state.stockWatchList.findIndex(m => m.ticker === stock.ticker);
                if (existingIndex === -1) return state; // 존재하지 않으면 무시

                const existingStock = state.stockWatchList[existingIndex];

                // [Senior Optimization] 실제 데이터(가격, 등락)가 바뀌었을 때만 업데이트
                const isPriceChanged = existingStock.price !== stock.price;
                const isChangeChanged = existingStock.changePercent !== stock.changePercent;

                if (!isPriceChanged && !isChangeChanged) {
                    return state; // 데이터가 같으면 기존 상태 그대로 유지 (리렌더링 방지)
                }

                const newList = [...state.stockWatchList];
                newList[existingIndex] = stock;
                return { stockWatchList: newList };
            }),
            // [Senior] 티커 기반 벌크 업데이트 - 동기화 중 항목 삭제 등에도 안전하게 티커가 일치하는 것만 업데이트
            updateWatchListBulk: (newItems: StockWatchListItemProps[]) => set((state) => {
                const updatedList = state.stockWatchList.map(existing => {
                    const found = newItems.find(n => n.ticker === existing.ticker);
                    if (!found) return existing;

                    // 데이터가 실제로 변경되었을 때만 새로운 객체 반환 (Zustand 얕은 비교 최적화)
                    if (existing.price === found.price && existing.changePercent === found.changePercent) {
                        return existing;
                    }
                    return { ...existing, ...found };
                });
                return { stockWatchList: updatedList };
            }),
            setStockMemo: (ticker: string, memo: string) => set((state) => {
                const isExist = state.stockMemo.some(m => m.ticker === ticker);
                return {
                    stockMemo: isExist
                        ? state.stockMemo.map(m => m.ticker === ticker ? { ticker, memo } : m)
                        : [...state.stockMemo, { ticker, memo }]
                };
            }),
        }),
        {
            name: "stock-storage",
            partialize: (state) => ({
                recentSearchList: state.recentSearchList,
                stockWatchList: state.stockWatchList,
                currentTicker: state.currentTicker,
                stockMemo: state.stockMemo
            })
        }
    )
);