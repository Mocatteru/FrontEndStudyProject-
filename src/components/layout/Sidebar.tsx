'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: '대시보드', href: '/' },
  { name: '데이터 리스트 (REST)', href: '/rest-data' },
  { name: '사용자 목록 (GraphQL)', href: '/graphql-data' },
  { name: '설정', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-black text-white transition-transform">
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-10 px-2 py-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            DevOps <span className="text-blue-500">Admin</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Senior Frontend Mentorship</p>
        </div>
        
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="flex items-center px-4 py-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium">관리자 님</p>
              <p className="text-xs text-gray-500">Frontend Scholar</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
