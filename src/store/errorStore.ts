import { create } from "zustand";
import { toast } from "sonner";

interface ErrorState {
    showError: (message: string) => void;
}

/**
 * [Senior Refactor] Error Store
 * - 이전 버전: 자체 Toast UI를 위해 가시성 상태(isVisible)를 관리했습니다.
 * - 리팩토링 후: 전역 알림 인프라(Sonner)를 활용하여 상태 관리 부담을 줄이고 일관된 UX를 제공합니다.
 */
export const useErrorStore = create<ErrorState>(() => ({
    showError: (message: string) => {
        toast.error("시스템 오류가 발생했습니다.", {
            description: message,
            duration: 5000,
        });
    },
}))
