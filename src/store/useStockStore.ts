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
             * [TODO: 성능 최적화 - 데이터 정규화]
             * 관심 종목(Watchlist) 저장 시 historical(차트 데이터) 배열이 함께 저장되어 LocalStorage가 무거워질 수 있습니다.
             * 추후 historical을 제외하고 필요한 메타데이터만 저장하도록 필터링 로직을 추가하는 것을 권장합니다.
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
            updateStockWatchList: (stock: StockWatchListItemProps) => set((state) => ({
                stockWatchList: state.stockWatchList.map(m => m.ticker === stock.ticker ? stock : m)
            }))
        }),
        {
            name: "stock-storage",
        }
    )
);