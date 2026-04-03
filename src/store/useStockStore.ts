import { supabase } from "@/lib/supabase";
import { StockWatchListItemProps, Stock } from "@/types/stock";
import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware"; //  1. 미들웨어 추가



interface StockState {
    isLoading: boolean,
    stock: Stock | null,
    currentTicker: string,
    recentSearchList: string[],
    stockWatchList: StockWatchListItemProps[],
    stockPopularList: StockWatchListItemProps[],
    stockMemo: { ticker: string, memo: string }[],
    tickerToName: Record<string, string>, // [New] 티커 -> 한글 종목명 매핑 사전
    setStock: (stock: Stock) => void,
    setCurrentTicker: (ticker: string) => void,
    addRecentSearch: (ticker: string) => void,
    removeRecentSearch: (ticker: string) => void,
    updateStockWatchList: (stock: StockWatchListItemProps) => void,
    updateWatchListBulk: (list: StockWatchListItemProps[]) => void, // [Senior] 백그라운드 일괄 데이터 새로고침 액션
    clearRecentSearch: () => void,
    clearStockWatchList: () => void,
    clearStockMemo: () => void,
    setStockMemo: (ticker: string, memo: string) => void,
    setTickerToName: (ticker: string, name: string) => void,
    setStockPopularList: (list: StockWatchListItemProps[]) => void,
    fetchWatchList: (userId: string) => Promise<void>;
    insertWatchList: (userId: string, stock: StockWatchListItemProps) => Promise<void>;
    deleteFromWatchList: (userId: string, ticker: string) => Promise<void>;
}

/**
 * persist 미들웨어의 역할:
 * 1. 상태가 변경될 때마다 지정된 storage(기본값 LocalStorage)에 JSON 형태로 자동 저장
 * 2. 앱이 새로고침될 때 저장된 데이터를 자동으로 로드(Rehydrate)
 * 3. name: 저장소를 식 별하는 키. 다른 서비스와 겹치지 않게 고유하게 지정
 */
export const useStockStore = create<StockState>()( // 추가된 () 주의!
    persist(
        (set, get) => ({
            stock: null,
            currentTicker: "",
            recentSearchList: [],
            stockWatchList: [],
            stockPopularList: [],
            stockMemo: [],
            tickerToName: {},
            isLoading: false,

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
            setTickerToName: (ticker: string, name: string) => set((state) => ({
                tickerToName: { ...state.tickerToName, [ticker]: name }
            })),
            // [New] 서버 관심 목록 데이터 조회 (Global Sync)
            fetchWatchList: async (userId: string) => {
                if (!userId) return;

                set({ isLoading: true });
                try {
                    const { data: watchlist, error } = await supabase
                        .from('watchlist')
                        .select('*')
                        .eq('user_id', userId);

                    if (error) throw error;

                    if (watchlist) {
                        /** 
                         * [Rule 18: Strict Typing] DB 행(WatchList)을 UI용 DTO(StockWatchListItemProps)로 변환
                         * 시세 데이터는 초기값 0으로 설정 후 useSidebarSync에서 실시간으로 채워집니다.
                         */
                        const formattedList: StockWatchListItemProps[] = watchlist.map(item => ({
                            ticker: item.ticker,
                            name: item.name,
                            price: 0,
                            change: 0,
                            changePercent: 0,
                            currency: item.currency || 'USD',
                            isPositive: true,
                        }));

                        set({ stockWatchList: formattedList });
                    }
                } catch (error) {
                    console.error("[Fetch WatchList Error]", error);
                    toast.error("관심 목록을 불러오는데 실패했습니다.");
                } finally {
                    set({ isLoading: false });
                }
            },

            // [New] 서버에 관심 종목 추가 (Server-State Synchronization)
            insertWatchList: async (userId: string, stock: StockWatchListItemProps) => {
                if (!userId || !stock?.ticker) return;

                set({ isLoading: true });
                try {
                    const { error } = await supabase
                        .from('watchlist')
                        .insert([{
                            user_id: userId,
                            ticker: stock.ticker,
                            name: stock.name,
                            currency: stock.currency
                        }]);

                    if (error) throw error;

                    // [Rule 20] 로컬 상태 업데이트 (클라이언트-서버 동기화)
                    const { stockWatchList } = get();
                    if (!stockWatchList.some(item => item.ticker === stock.ticker)) {
                        set({ stockWatchList: [...stockWatchList, stock] });
                    }
                } catch (error) {
                    console.error("[Add WatchList Error]", error);
                    toast.error("종목 추가 중 오류가 발생했습니다.");
                } finally {
                    set({ isLoading: false });
                }
            },

            // [New] 서버에서 관심 종목 삭제
            deleteFromWatchList: async (userId: string, ticker: string) => {
                if (!userId || !ticker) return;

                set({ isLoading: true });
                try {
                    const { error } = await supabase
                        .from('watchlist')
                        .delete()
                        .eq('user_id', userId)
                        .eq('ticker', ticker);

                    if (error) throw error;

                    // 로컬 상태 업데이트
                    const { stockWatchList } = get();
                    set({ stockWatchList: stockWatchList.filter(item => item.ticker !== ticker) });
                } catch (error) {
                    console.error("[Remove WatchList Error]", error);
                    toast.error("종목 삭제 중 오류가 발생했습니다.");
                } finally {
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: "stock-storage",
            partialize: (state) => ({
                recentSearchList: state.recentSearchList,
                stockWatchList: state.stockWatchList,
                currentTicker: state.currentTicker,
                stockMemo: state.stockMemo,
                tickerToName: state.tickerToName
            })
        }
    )
);