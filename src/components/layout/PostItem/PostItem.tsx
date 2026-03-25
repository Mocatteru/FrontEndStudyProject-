import { TruncateTitle } from "@/lib/format";
import { Post } from "@/types/post";
import React from "react";
import { FileText } from "lucide-react";

/**
 * [컴포넌트 분리] 데이터 리스트의 개별 아이템을 독립된 컴포넌트로 관리합니다.
 * - 장점: 코드 가독성이 좋아지고, 아이템의 스타일이나 로직 변경 시 이 파일만 수정하면 됩니다.
 */
function PostItem({ post }: { post: Post }) {
    return (
        <div className="group flex flex-col justify-between rounded-3xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-6 hover:bg-black/10 dark:hover:bg-white/10 active:scale-[0.98] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-xl group-hover:rotate-6 transition-all duration-300">
                    <FileText className="size-4 text-blue-500" />
                </div>
                <h3 className="font-black tracking-tight text-blue-500 uppercase italic">Post #{post.id}</h3>
            </div>
            <p className="text-sm font-semibold text-foreground/80 leading-relaxed tracking-tight group-hover:text-foreground transition-colors">{TruncateTitle(post.title, 35)}</p>
        </div>
    )
}

// 컴포넌트를 memo로 감싸서 리렌더링 최적화를 수행합니다.
export default React.memo(PostItem);