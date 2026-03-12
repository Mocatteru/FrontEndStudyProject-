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
    setPostCount: (count: number) => set(() => ({
        postCount: count,
    })),
}))


