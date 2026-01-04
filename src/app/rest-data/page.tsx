'use client'

import { truncateTitle } from "@/lib/format";
import { postService } from "@/services/api.service"
import { Post } from "@/types/post";
import { useQuery } from "@tanstack/react-query"

export default function RestDataPage() {
    const { isError, isLoading, data: posts } = useQuery({
        queryKey: ['posts'],
        queryFn: () => postService.getPosts(),
    });

    if (isLoading)
        return <div className="text-white">데이터를 불러오는 중입니다.</div>

    if (isError)
        return <div className="text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</div>

    return (
        <div className="space-y-6" >
            <h2 className="text-3xl font-bold">REST API Posts</h2>
            <div className="grid gap-4 md:grid-cols-2">
                {posts?.map((post: Post) => (
                    <div key={post.id} className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
                        <h3 className="font-semibold text-blue-400">Post #{post.id}</h3>
                        <p className="mt-2 text-black">{truncateTitle(post.title, 20)}</p>
                    </div>
                ))}
            </div>
        </div >
    );
}