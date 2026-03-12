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
export default function RestDataPage() {

    const { posts, isLoading, isError } = usePostSync();

    if (isLoading)
        return <div className="text-black dark:text-white">데이터를 불러오는 중입니다.</div>

    if (isError)
        return <div className="text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</div>

    return (
        <div className="space-y-6" >
            <h2 className="text-3xl font-bold">REST API Posts</h2>
            <button onClick={() => useErrorStore.getState().showError('에러 발생')}>에러버튼</button>
            <div className="grid gap-4 md:grid-cols-2">
                {posts?.map((post: Post) => (
                    <PostItem post={post} key={post.id} />
                ))}
            </div>
        </div >
    );
}
