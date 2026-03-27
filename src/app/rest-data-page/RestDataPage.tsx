'use client'

import React from 'react';
import PostItem from "@/components/layout/PostItem/PostItem";
import usePostSync from "@/hooks/usePostSync";
import { useErrorStore } from "@/store/errorStore";
import { Post } from "@/types/post";

/**
 * [페이지 로직 분리 (Colocation)]
 * - URL 경로(/rest-data)에 해당하는 실제 핵심 비즈니스 로직과 UI를 담당하는 파일입니다.
 * - 파일명을 명시적으로 지정하여 IDE 검색(Cmd+P) 시 직관성을 극대화합니다.
 */
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatabaseZap, ServerCrash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RestDataPage() {
    const { posts, isLoading, isError } = usePostSync();

    if (isLoading) {
        return (
            <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-6 animate-in fade-in duration-700">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48 rounded-2xl bg-black/5 dark:bg-white/5" />
                    <Skeleton className="h-10 w-24 rounded-2xl bg-black/5 dark:bg-white/5" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-3xl bg-black/5 dark:bg-white/5" />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center p-20 animate-in fade-in zoom-in-95 duration-700 h-full">
                <div className="p-6 bg-red-500/10 rounded-full mb-6 relative">
                    <ServerCrash className="size-12 text-red-500 animate-bounce" />
                    <div className="absolute inset-0 border-4 border-red-500/20 rounded-full animate-ping" />
                </div>
                <h3 className="text-2xl font-black text-red-500 tracking-tighter uppercase mb-2">서버 연결 실패</h3>
                <p className="text-sm font-bold text-muted-foreground/60 tracking-tight">데이터를 불러오는 중 지연이 발생했습니다. 다시 시도해 주세요.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-10 space-y-8 animate-in fade-in duration-700">
                {/* Header Area: [Visual Hierarchy] & [K-UX] 적용 */}
                <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <DatabaseZap className="size-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase drop-shadow-sm">데이터 목록</h2>
                            <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/40 uppercase">Rest API Posts</span>
                        </div>
                    </div>
                    <Button 
                        variant="destructive"
                        onClick={() => useErrorStore.getState().showError('테스트 에러가 발생했습니다.')}
                        className="font-black tracking-widest text-xs uppercase rounded-2xl active:scale-95 transition-all shadow-lg shadow-red-500/20"
                    >
                        오류 시뮬레이터
                    </Button>
                </div>

                {/* Content Area: [Empty State] & [Component Atomicity] */}
                {posts?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-black/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
                        <DatabaseZap className="size-10 text-muted-foreground/30 mb-4" />
                        <p className="text-sm font-black text-muted-foreground/50 tracking-widest uppercase">등록된 게시글이 없습니다</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {posts?.map((post: Post) => (
                            <PostItem post={post} key={post.id} />
                        ))}
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}
