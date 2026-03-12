'use client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * [React Query / TanStack Query]
 * - 역할: 서버 상태(Server State) 관리 및 캐싱 라이브러리입니다.
 * - CSR/SSR 환경에서 데이터를 효율적으로 가져오고, 로딩/에러 상태를 선언적으로 관리하게 해줍니다.
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
    // useState를 사용해 QueryClient 인스턴스를 생성하는 이유:
    // 컴포넌트 리렌더링 시 인스턴스가 재생성되는 것을 방지하여 캐시 데이터를 유지하기 위함입니다 (실무 표준).
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                /**
                 * staleTime: 데이터가 'stale(상하지 않은/신선한)'하다고 판단되는 시간입니다.
                 * 이 시간 동안은 동일한 쿼리 호출 시 서버에 요청하지 않고 캐시된 데이터를 즉시 반환합니다.
                 */
                staleTime: 60 * 1000,
            },
        },
    }));
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}