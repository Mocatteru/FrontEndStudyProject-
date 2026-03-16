import { Stock } from "@/types/stock";
import { create } from "zustand";
import { persist } from "zustand/middleware"; //  1. 미들웨어 추가

interface StockState {
    stock: Stock | null,
    currentTicker: string,
    tickerSearchHistory: string[],
    stockWatchList: Stock[],

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
            tickerSearchHistory: [],
            stockWatchList: [],

            // Actions
            setStock: (stock: Stock) => set({ stock }),
            setCurrentTicker: (ticker: string) => set({ currentTicker: ticker.toUpperCase() }),
            addRecentSearch: (ticker: string) => set((state) => ({
                tickerSearchHistory: [ticker.toUpperCase(), ...state.tickerSearchHistory.filter(t => t !== ticker.toUpperCase())].slice(0, 10)
            })),
            toggleWatchList: (stock: Stock) => set((state) => ({
                stockWatchList: state.stockWatchList.map(m => m.symbol).includes(stock.symbol) ?
                    state.stockWatchList.filter(m => m.symbol !== stock.symbol) : state.stockWatchList.concat(stock)

            })),
            removeRecentSearch: (ticker: string) => set((state) => ({
                tickerSearchHistory: state.tickerSearchHistory.filter(t => t !== ticker.toUpperCase())
            })),
            clearRecentSearch: () => set(() => ({
                tickerSearchHistory: []
            }))
        }),
        {
            name: "stock-storage",
        }
    )
);