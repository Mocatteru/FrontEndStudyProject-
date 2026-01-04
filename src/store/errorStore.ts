import { create } from "zustand";

interface ErrorState {
    isVisible: boolean;
    message: string;
    showError: (message: string) => void;
    hideError: () => void;
}

export const useErrorStore = create<ErrorState>((set, get) => ({
    isVisible: false,
    message: "",
    showError: (message: string) => {
        set({ isVisible: true, message: message });
        setTimeout(() => get().hideError(), 3000);
    },
    hideError: () => set(() => ({
        isVisible: false,
        message: ""
    }))
}))
