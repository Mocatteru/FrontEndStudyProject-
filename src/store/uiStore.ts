import { create } from "zustand";

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