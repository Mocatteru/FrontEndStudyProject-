import { create } from "zustand";

/**
 * [Zustand Store] 글로벌 UI 상태 관리
 * - 역할: 사이드바 열림/닫힘, 사용자 이름 등 간단하고 전역적인 UI 상태를 관리합니다.
 * - 장점: Redux보다 설정이 매우 간편하며, Provider 없이 어디서든 사용 가능합니다.
 * - 사용법: const { isSiderOpen } = useUiStore();
 */
interface UiState {
    isSiderOpen: boolean;
    userName: string;
    toggleSidebar: () => void;
    setUserName: (userName: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
    isSiderOpen: true,
    userName: "이종현의 프론트엔드",
    toggleSidebar: () => set((state) => ({
        isSiderOpen: !state.isSiderOpen
    })),
    setUserName: (name: string) => set(() => ({
        userName: name
    })),
}))