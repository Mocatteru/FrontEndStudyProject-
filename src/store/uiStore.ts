import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * [Zustand Store] 글로벌 UI 상태 관리
 * - 역할: 사이드바 열림/닫힘, 사용자 이름 등 간단하고 전역적인 UI 상태를 관리합니다.
 * - 장점: Redux보다 설정이 매우 간편하며, Provider 없이 어디서든 사용 가능합니다.
 * - 사용법: const { isSiderOpen } = useUiStore();
 */
interface UiState {
    isSiderOpen: boolean;
    isWatchListOpen: boolean; // [Senior] 우측 와치리스트 상태 추가
    userName: string;
    userEmail: string;
    userDepartment: string;
    userRole: "ADMIN USER" | "USER";
    toggleSidebar: () => void;
    toggleWatchList: () => void; // [Senior] 와치리스트 토글 액션 추가
    setUserName: (userName: string) => void;
    setUserEmail: (userEmail: string) => void;
    setUserDepartment: (userDepartment: string) => void;
    setUserRole: (userRole: "ADMIN USER" | "USER") => void;
}

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            isSiderOpen: true,
            isWatchListOpen: false, // 기본값: 닫힘
            userName: "게스트",
            userEmail: "[EMAIL_ADDRESS]",
            userDepartment: "부서 없음",
            userRole: "USER",
            toggleSidebar: () => set((state) => ({
                isSiderOpen: !state.isSiderOpen
            })),
            toggleWatchList: () => set((state) => ({
                isWatchListOpen: !state.isWatchListOpen
            })),
            setUserName: (name: string) => set(() => ({
                userName: name
            })),
            setUserEmail: (email: string) => set(() => ({
                userEmail: email
            })),
            setUserDepartment: (department: string) => set(() => ({
                userDepartment: department
            })),
            setUserRole: (role: "ADMIN USER" | "USER") => set(() => ({
                userRole: role
            })),
        }),
        {
            name: "ui-storage",
            partialize: (state: UiState) => ({
                isSiderOpen: state.isSiderOpen,
                isWatchListOpen: state.isWatchListOpen,
                userName: state.userName,
                userEmail: state.userEmail,
                userDepartment: state.userDepartment,
                userRole: state.userRole,
            })
        }
    ));