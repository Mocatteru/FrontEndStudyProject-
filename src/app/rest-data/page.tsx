'use client'

import PostItem from "@/components/layout/PostItem/PostItem";
import usePostSync from "@/hooks/usePostSync";
import { useErrorStore } from "@/store/errorStore";
import { Post } from "@/types/post";

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