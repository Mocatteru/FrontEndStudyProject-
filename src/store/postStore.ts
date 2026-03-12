import { Post } from "@/types/post";
import { create } from "zustand";

interface PostStore {
    posts: Post[];
    postCount: number;
    setPostCount: (count: number) => void;
}

/**
 * [Zustand Store] 포스트 데이터 상태 관리
 * - 역할: 특정 페이지에 종속되지 않는 '범용적 데이터'인 포스트 카운트 등을 관리합니다.
 */
export const usePostStore = create<PostStore>((set) => ({
    posts: [],
    postCount: 0,
    /**
     * [set: 상태 변경 함수]
     * - Zustand에서 상태를 바꾸는 유일한 방법입니다.
     * - (state) => ({ ... }): 현재 상태를 인자로 받아 새로운 상태 객체를 반환합니다.
     * - 불변성: Zustand가 내부적으로 얕은 복사(Shallow Copy)를 통해 상태 변경을 감지하므로 직접 수정하면 안 됩니다.
     */
    setPostCount: (count: number) => set((state) => ({
        ...state, // 기존 상태를 유지하면서 (가독성을 위한 명시적 작성)
        postCount: count, // 특정 값만 덮어씌웁니다.
    })),
}))


