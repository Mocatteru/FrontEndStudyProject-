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
    /**
     * [useQuery 핵심 반환값]
     * - isLoading: 데이터가 처음 로드될 때 true입니다.
     * - isError: 쿼리 실행 중 에러가 발생한 경우 true입니다.
     * - data: queryFn이 반환한 데이터가 담깁니다. (여기서는 posts로 이름을 바꿨습니다)
     */
    const { isError, isLoading, data: posts } = useQuery({
        queryKey: ['posts'], // 고유 키: 이 키를 기반으로 캐싱과 무효화(Invalidation)가 수행됩니다.
        queryFn: () => getPosts(), // 실제 API 호출 함수
    });

    const { setPostCount } = usePostStore();

    /**
     * [useEffect: Side Effect 처리]
     * - 역할: 렌더링 결과가 화면에 반영된 후 실행되어야 하는 로직을 처리합니다.
     * - 의존성 배열 [posts]: posts의 값이 변경될 때만 내부 로직을 다시 실행합니다.
     * - 실무 패턴: 서버 데이터를 가져온 후, 전역 상태(Zustand 등)를 동기화할 때 자주 사용됩니다.
     */
    useEffect(() => {
        setPostCount(posts?.length || 0);
    }, [posts])

    return {
        isError, isLoading, posts
    }
}
