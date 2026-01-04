'use client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({ // 왜썼냐?: 단순변수로 쓰면 요청할때마다 캐시된거 안쓰고
        // 매번 새로 만들어서 보내주는데 useState 써야지 페이지 불러올떄마다 캐시한다음에 캐시된거 보내줌
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 이 데이터는 1분동안 '신선'한 데이터로 취급함, 
                // 한번 가져온 데이터는 1분동안은 유효하니 더 가져오지 말란 뜻 약간 토큰같은거지
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