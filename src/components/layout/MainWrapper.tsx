'use client'

import { useUiStore } from '@/store/uiStore';
import React from 'react';

export default function MainWrapper({ children }: { children: React.ReactNode }) {
    const { isSidebarOpen } = useUiStore();

    return (
        <div className={`flex min-h-screen flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
            {children}
        </div>
    );
}