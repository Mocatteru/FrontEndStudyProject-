'use client';

import React, { useEffect } from 'react';
import { useUiStore } from '@/store/uiStore';
import SidebarItem from './SidebarItem';
import { usePostStore } from '@/store/postStore';

// 상수는 파일 맨 위, 컴포넌트 외부로!
const menuItems = [
    { name: '대시보드', href: '/home-page' },
    { name: '데이터 리스트 (REST)', href: '/rest-data-page' },
    { name: '주식 검색', href: '/stock-page' },
    { name: '설정', href: '/settings-page' },
];

/**
 * [Sidebar 컴포넌트]
 * - 역할: 앱의 메인 내비게이션을 담당합니다.
 * - 기능: 
 *   1. Zustand(useUiStore)를 통해 열림/닫힘 상태를 관리합니다.
 *   2. 키보드 'Tab' 키를 통해 토글이 가능합니다. (A11y 고려: 입력창 제외)
 *   3. 닫혀있을 때 왼쪽 중앙에 'Peeking' 버튼을 제공하여 쉽게 열 수 있게 합니다.
 */
export default function Sidebar() {
    const { isSiderOpen, toggleSidebar, userName } = useUiStore();
    const { postCount } = usePostStore();

    // [학습 포인트: 전역 키보드 이벤트 리스너]
    // 사용자의 편의를 위해 'Tab' 키로 사이드바를 열고 닫는 단축키를 구현합니다.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Tab 키 확인
            if (e.key === 'Tab') {
                // 입력창이나 텍스트 에어리어에서는 원래 기능을 유지하기 위해 예외 처리합니다.
                const target = e.target as HTMLElement;
                if (
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable
                ) {
                    return;
                }

                e.preventDefault(); // 브라우저 기본 포커스 이동 방지
                toggleSidebar();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        // 클린업 함수: 컴포넌트가 사라질 때 리스너를 제거하여 메모리 누수를 방지합니다.
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSidebar]);


    return (
        <>
            <aside className={isSiderOpen ? "fixed left-0 top-0 z-40 h-screen w-64 border-r border-black/10 dark:border-white/10 bg-white dark:bg-black text-black dark:text-white transition-transform" : "fixed left-0 top-0 z-40 h-screen w-64 border-r border-black/10 dark:border-white/10 bg-white dark:bg-black text-black dark:text-white transition-transform -translate-x-full"}>
                {/* 
                    [학습 포인트: 일관된 토글 UI (Persistent Handle)]
                    - 개선 포인트: 버튼이 생겼다 사라졌다 하는 대신, 사이드바 오른쪽 끝에 항상 붙어있는 '핸들' 형태로 변경합니다.
                    - 장점: 열기/닫기 동작이 시각적으로 연결되어 훨씬 자연스럽고(Continuous UI), 마우스 이동 동선이 최소화됩니다.
                */}
                <button
                    onClick={() => toggleSidebar()}
                    className="absolute -right-9 top-1/2 z-50 flex h-36 w-9 -translate-y-1/2 items-center justify-center rounded-r-2xl bg-white/80 dark:bg-black/80 backdrop-blur-md border border-l-0 border-black/10 dark:border-white/10 text-gray-400 hover:text-blue-500 transition-all group shadow-xl"
                    title={isSiderOpen ? "사이드바 닫기 (Tab)" : "사이드바 열기 (Tab)"}
                >
                    <span className={`transition-transform duration-300 ${isSiderOpen ? 'rotate-180' : ''}`}>
                        <span className="block rotate-90 text-[12px] font-black tracking-[0.2em]">
                            {isSiderOpen ? 'CLOSE' : 'OPEN'}
                        </span>
                    </span>
                </button>

                <div className="flex h-full flex-col px-3 py-4">
                    <div className="mb-10 px-2 py-4">
                        <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
                            DevOps <span className="text-blue-500">Admin</span>
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Senior Frontend Mentorship</p>
                        <h3 className="text-lg font-semibold pt-5">현재 활성 포스트 개수: {postCount}</h3>
                    </div>
                    <SidebarItem menuItems={menuItems} />
                    <div className="mt-auto border-t border-black/10 dark:border-white/10 pt-4">
                        <div className="flex items-center px-4 py-2">
                            <div className="h-8 w-8 rounded-full bg-linear-to-tr from-blue-500 to-purple-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium">{userName}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
