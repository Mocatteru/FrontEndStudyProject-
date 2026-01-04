'use client';

import React from 'react';
import { useUiStore } from '@/store/uiStore';
import SidebarItem from './SidebarItem';
import { usePostStore } from '@/store/postStore';

// 상수는 파일 맨 위, 컴포넌트 외부로!
const menuItems = [
    { name: '대시보드', href: '/' },
    { name: '데이터 리스트 (REST)', href: '/rest-data' },
    { name: '사용자 목록 (GraphQL)', href: '/graphql-data' },
    { name: '설정', href: '/settings' },
];

export default function Sidebar() {
    const { isSiderOpen, userName } = useUiStore();
    const { postCount } = usePostStore();


    return (
        <aside className={isSiderOpen ? "fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-black text-white transition-transform" : "fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-black text-white transition-transform -translate-x-full"}>
            <div className="flex h-full flex-col px-3 py-4">
                <div className="mb-10 px-2 py-4">
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        DevOps <span className="text-blue-500">Admin</span>
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">Senior Frontend Mentorship</p>
                    <h3 className="text-lg font-semibold pt-5">현재 활성 포스트 개수: {postCount}</h3>
                </div>
                {/* 이제 Sidebar가 리렌더링되어도 MENU_ITEMS는 딱 한 번만 생성됩니다. */}
                <SidebarItem menuItems={menuItems} />
                <div className="mt-auto border-t border-white/10 pt-4">
                    <div className="flex items-center px-4 py-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
                        <div className="ml-3">
                            <p className="text-sm font-medium">{userName}</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
