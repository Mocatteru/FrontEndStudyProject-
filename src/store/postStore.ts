import { Post } from "@/types/post";
import { create } from "zustand";

interface PostStore {
    posts: Post[];
    postCount: number;
    setPostCount: (count: number) => void;
}

export const usePostStore = create<PostStore>((set) => ({
    posts: [],
    postCount: 0,
    setPostCount: (count: number) => set(() => ({
        postCount: count,
    })),
}))


