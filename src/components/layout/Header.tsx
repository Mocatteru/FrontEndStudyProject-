'use client';

import { useUiStore } from '@/store/uiStore';
import React from 'react';

export default function Header() {
    const { userName, toggleSidebar } = useUiStore();
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/5 bg-black/50 px-8 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => toggleSidebar()}
                    className="rounded-full bg-white/5 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                >
                    TAB
                </button>
            </div>

            <div className="flex items-center gap-6">
                <span className="text-sm font-medium text-white">{userName}님 로그인 중</span>
            </div>
        </header>
    );
}
