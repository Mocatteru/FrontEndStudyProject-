import { getPosts } from "@/services/post.services";
import { usePostStore } from "@/store/postStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";


/**
 * [Custom Hook] React Query 기반 데이터 동기화
 * - 역할: Service 로직을 호출하고, 로딩(isLoading), 에러(isError), 데이터(data) 상태를 반환합니다.
 * - 핵심 기능:
 *   1. Caching: 한 번 불러온 데이터는 일정 시간 동안 다시 호출하지 않습니다.
 *   2. Revalidation: 탭을 다시 누르거나 네트워크가 끊겼다 복구될 때 데이터를 자동 갱신합니다.
 *   3. Synchronization: Zustand Store(postCount)에 데이터 개수를 업데이트합니다.
 */
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
