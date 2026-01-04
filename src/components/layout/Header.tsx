'use client';

import React from 'react';

export default function Header() {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/5 bg-black/50 px-8 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-400">시스템 모니터링: </span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-green-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                    Active
                </span>
            </div>

            <div className="flex items-center gap-6">
                <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    Notifications
                </button>
                <div className="h-4 w-px bg-white/10" />
                <button className="rounded-full bg-white/5 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10 transition-colors">
                    Logout
                </button>
            </div>
        </header>
    );
}
