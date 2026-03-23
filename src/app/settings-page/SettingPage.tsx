'use client'

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Save } from "lucide-react";

/**
 * [학습 포인트] SettingItem 컴포넌트
 * - 각 설정 항목(라벨 + 컨트롤)의 레이아웃을 표준화합니다.
 * - 한 줄에 표시될 내용의 간격과 폰트 스타일을 한 곳에서 관리할 수 있습니다.
 */
function SettingSectionItem({
    label,
    children
}: {
    label: string,
    children: React.ReactNode
}) {
    return (
        <div className="space-y-3 w-full animate-in fade-in duration-500">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                {label}
            </label>
            <div className="relative group">
                {children}
            </div>
        </div>
    );
}

/**
 * [학습 포인트] SettingSection 컴포넌트
 * - 제목/설명이 있는 왼쪽 컬럼과 실제 설정들이 담긴 오른쪽 카드 영역으로 구성됩니다.
 * - 재사용성을 위해 내부 자식 요소들을 그리드 시스템으로 자동 정렬합니다.
 */
function SettingSection({
    title,
    description,
    children
}: {
    title: string,
    description: string,
    children: React.ReactNode
}) {
    return (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* 섹션 안내 문구 */}
                <div className="space-y-4">
                    <h2 className="text-3xl font-black tracking-tighter uppercase text-foreground">{title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {description}
                    </p>
                </div>

                {/* 설정 콘텐츠 영역 (2열 그리드 기본 적용) */}
                <div className="md:col-span-2 bg-card border border-black/5 dark:border-white/5 p-10 rounded-[3rem] shadow-sm shadow-black/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-12">
                        {children}
                    </div>
                </div>
            </div>
            <Separator className="bg-black/5 dark:bg-white/5 mt-20 mb-20" />
        </section>
    )
}

export default function SettingPage() {
    return (
        <div className="flex flex-col h-full min-h-0 bg-background selection:bg-blue-500/20 overflow-hidden">

            {/* [1] 프리미엄 고정 헤더 */}
            <header className="flex-none w-full px-12 py-10 bg-background/95 backdrop-blur-md border-b border-black/5 dark:border-white/10 flex justify-between items-center z-40 transition-all">
                <div className="flex flex-col gap-1">
                    <h1 className="md:text-6xl text-4xl font-black tracking-tighter uppercase text-foreground/90">설정</h1>
                    <p className="text-sm font-black tracking-[0.4em] text-blue-500/60 uppercase">종합 설정 관리</p>
                </div>

                <Button className="rounded-2xl px-12 h-16 font-black tracking-tight shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all bg-blue-600 hover:bg-blue-500 text-white border-none text-xl">
                    <Save className="mr-3 size-6" />
                    저장하기
                </Button>
            </header>

            {/* [2] 메인 스크롤 본문 */}
            <main className="flex-1 overflow-y-auto px-12 py-20 scroll-smooth custom-scrollbar">
                <div className="max-w-[1600px] w-full">

                    <SettingSection
                        title="사용자 정보"
                        description="시스템 프로필과 기본 계정 정보를 관리합니다. 모든 변경 사항은 즉시 동기화 노드에 반영됩니다."
                    >
                        <SettingSectionItem label="회원 이름">
                            <Input placeholder="이름을 입력하세요" className="rounded-2xl h-14 border-2 border-black/5 dark:border-white/5 focus-visible:ring-blue-500/20 bg-muted/5 font-bold" />
                        </SettingSectionItem>
                        <SettingSectionItem label="이메일 주소">
                            <Input placeholder="example@domain.com" className="rounded-2xl h-14 border-2 border-black/5 dark:border-white/5 focus-visible:ring-blue-500/20 bg-muted/5 font-bold" />
                        </SettingSectionItem>
                        <SettingSectionItem label="소속 부서">
                            <Input placeholder="소속 팀명을 입력하세요" className="rounded-2xl h-14 border-2 border-black/5 dark:border-white/5 focus-visible:ring-blue-500/20 bg-muted/5 font-bold" />
                        </SettingSectionItem>
                        <SettingSectionItem label="관리자 권한">
                            <Input placeholder="시니어 개발자" className="rounded-2xl h-14 border-2 border-black/5 dark:border-white/5 focus-visible:ring-blue-500/20 bg-muted/5 font-bold" />
                        </SettingSectionItem>
                    </SettingSection>

                    <SettingSection
                        title="동기화 엔진"
                        description="주식 시장 데이터의 실시간 동기화 인터벌을 설정합니다. 최적의 주기는 1~5초 사이로 권장됩니다."
                    >
                        <SettingSectionItem label="갱신 주기 (초)">
                            <Input placeholder="예: 2" className="rounded-2xl h-14 border-2 border-black/5 dark:border-white/5 focus-visible:ring-blue-500/20 bg-muted/5 font-bold" />
                        </SettingSectionItem>
                        <SettingSectionItem label="캐시 보관 시간">
                            <Input placeholder="분 단위 입력" className="rounded-2xl h-14 border-2 border-black/5 dark:border-white/5 focus-visible:ring-blue-500/20 bg-muted/5 font-bold" />
                        </SettingSectionItem>
                    </SettingSection>

                    <SettingSection
                        title="알림 인프라"
                        description="시스템 변동 알림 및 주요 이벤트에 대한 푸시 서버 설정을 관리합니다."
                    >
                        <div className="col-span-full h-48 bg-muted/5 border-2 border-dashed border-black/5 dark:border-white/5 rounded-[3rem] flex items-center justify-center">
                            <p className="font-black text-muted-foreground/40 uppercase tracking-[0.3em] text-sm">시스템 인프라 업데이트 진행 중</p>
                        </div>
                    </SettingSection>
                </div>
            </main>
        </div>
    )
}