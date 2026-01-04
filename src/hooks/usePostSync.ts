import { getPosts } from "@/services/post.services";
import { usePostStore } from "@/store/postStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export default function usePostSync() {
    const { isError, isLoading, data: posts } = useQuery({
        queryKey: ['posts'],
        queryFn: () => getPosts(),
    });
    const { setPostCount } = usePostStore();

    useEffect(() => {
        setPostCount(posts?.length || 0);
    }, [posts])

    return {
        isError, isLoading, posts
    }
}
