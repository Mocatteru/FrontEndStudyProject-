import { StockWatchListItemProps } from "@/app/stock-page/components/StockWatchListItem";
import { Stock } from "@/types/stock";
import { create } from "zustand";
import { persist } from "zustand/middleware"; //  1. 미들웨어 추가



interface StockState {
    stock: Stock | null,
    currentTicker: string,
    recentSearchList: string[],
    stockWatchList: StockWatchListItemProps[],
    setCurrentTicker: (ticker: string) => void,
    addRecentSearch: (ticker: string) => void,
    toggleWatchList: (stock: StockWatchListItemProps) => void,
    removeRecentSearch: (ticker: string) => void,
    updateStockWatchList: (stock: StockWatchListItemProps) => void,
    clearRecentSearch: () => void,

}

/**
 * persist 미들웨어의 역할:
 * 1. 상태가 변경될 때마다 지정된 storage(기본값 LocalStorage)에 JSON 형태로 자동 저장
 * 2. 앱이 새로고침될 때 저장된 데이터를 자동으로 로드(Rehydrate)
 * 3. name: 저장소를 식별하는 키. 다른 서비스와 겹치지 않게 고유하게 지정
 */
export const useStockStore = create<StockState>()( // 추가된 () 주의!
    persist(
        (set) => ({
            stock: null,
            currentTicker: "",
            recentSearchList: [],
            stockWatchList: [],

            // Actions
            setStock: (stock: Stock) => set({ stock }),
            setCurrentTicker: (ticker: string) => set({
                currentTicker: ticker.toUpperCase().trim()
            }),
            addRecentSearch: (ticker: string) => set((state) => ({
                recentSearchList: [ticker.toUpperCase(), ...state.recentSearchList.filter(t => t !== ticker.toUpperCase())].slice(0, 10)
            })),
            /**
             * [완료: 성능 최적화 - 데이터 정규화 및 선택적 저장]
             * 1. StockWatchListItemProps를 도입하여 관심종목 저장 시 대용량 historical 데이터를 제외함.
             * 2. persist 미들웨어의 partialize 옵션을 사용하여 불필요한 원본 stock 데이터가 로컬스토리지에 저장되는 것을 방지함.
             */
            toggleWatchList: (stock: StockWatchListItemProps) => set((state) => ({
                stockWatchList: state.stockWatchList.map(m => m.ticker).includes(stock.ticker) ?
                    state.stockWatchList.filter(m => m.ticker !== stock.ticker) : state.stockWatchList.concat(stock)

            })),
            removeRecentSearch: (ticker: string) => set((state) => ({
                recentSearchList: state.recentSearchList.filter(t => t !== ticker.toUpperCase())
            })),
            clearRecentSearch: () => set(() => ({
                recentSearchList: []
            })),
            clearStockWatchList: () => set(() => ({
                stockWatchList: []
            })),
            updateStockWatchList: (stock: StockWatchListItemProps) => set((state) => ({
                stockWatchList: state.stockWatchList.map(m => m.ticker === stock.ticker ? stock : m)
            }))
        }),
        {
            name: "stock-storage",
            partialize: (state) => ({
                recentSearchList: state.recentSearchList,
                stockWatchList: state.stockWatchList,
                currentTicker: state.currentTicker
            })
        }
    )
);