import { truncateTitle } from "@/lib/format";
import { Post } from "@/types/post";
import React from "react";

/**
 * [컴포넌트 분리] 데이터 리스트의 개별 아이템을 독립된 컴포넌트로 관리합니다.
 * - 장점: 코드 가독성이 좋아지고, 아이템의 스타일이나 로직 변경 시 이 파일만 수정하면 됩니다.
 */
/**
 * [학습 포인트: React.memo]
 * - 역할: 컴포넌트 자체를 메모이제이션합니다.
 * - 동작: 부모 컴포넌트가 리렌더링되더라도, 이 컴포넌트가 받는 Props(post)가 바뀌지 않았다면 
 *   이전에 그려둔 화면을 그대로 재사용합니다. 
 * - 실무 팁: 리스트 아이템처럼 개수가 많고 자주 그려지는 컴포넌트에 필수입니다.
 */
function PostItem({ post }: { post: Post }) {
    return (
        <div className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <h3 className="font-semibold text-blue-500 dark:text-blue-400">Post #{post.id}</h3>
            <p className="mt-2 text-gray-700 dark:text-gray-300">{truncateTitle(post.title, 20)}</p>
        </div>
    )
}

// 컴포넌트를 memo로 감싸서 내보냅니다.
export default React.memo(PostItem); 