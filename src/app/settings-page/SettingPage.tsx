'use client'

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Save, Upload } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useStockStore } from "@/store/useStockStore";
import { AlertDialogButton } from "@/components/common/AlertDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    const { userName, userEmail, userDepartment, userRole, setUserName, setUserEmail, setUserDepartment, setUserRole } = useUiStore();

    const [isEditing, setIsEditing] = useState(false);
    const [userNameInput, setUserNameInput] = useState(userName);
    const [userEmailInput, setUserEmailInput] = useState(userEmail);
    const [userDepartmentInput, setUserDepartmentInput] = useState(userDepartment);
    const [userRoleInput, setUserRoleInput] = useState(userRole);

    const { clearStockWatchList, clearStockMemo } = useStockStore();


    const pressSaveSettingButton = useCallback(() => {
        setIsEditing(false)
        setUserName(userNameInput);
        setUserEmail(userEmailInput);
        setUserDepartment(userDepartmentInput);
        setUserRole(userRoleInput);
        toast.success("설정이 성공적으로 저장되었습니다.", {
            description: "변경사항이 모든 노드에 반영되었습니다."
        });
    }, [userNameInput, userEmailInput, userDepartmentInput, userRoleInput, setUserName, setUserEmail, setUserDepartment, setUserRole]);

    return (
        <div className="flex flex-col h-full min-h-0 bg-background selection:bg-blue-500/20 overflow-hidden">

            {/* [1] 프리미엄 고정 헤더 */}
            <header className="flex-none w-full px-12 py-10 bg-background/95 backdrop-blur-md border-b border-black/5 dark:border-white/10 flex justify-between items-center z-40 transition-all">
                <div className="flex flex-col gap-1">
                    <h1 className="md:text-6xl text-4xl font-black tracking-tighter uppercase text-foreground/90">설정</h1>
                    <p className="text-sm font-black tracking-[0.4em] text-blue-500/60 uppercase">종합 설정 관리</p>
                </div>

                <Button disabled={!isEditing} onClick={pressSaveSettingButton} className="rounded-xl px-6 h-11 font-bold tracking-tight shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all bg-blue-600 hover:bg-blue-500 text-white border-none text-sm">
                    <Save className="mr-2 size-4" />
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
                        <SettingSectionItem label="사용자 프로필 사진">
                            <div className="flex justify-between items-center px-4 py-2">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSf4lZX2ZWovlNMo9gsrjDnlFs1GocmrsriYw&s" />
                                    <AvatarFallback>CN</AvatarFallback>
                                </Avatar>
                                <Button variant="outline" className="rounded-xl px-6 h-11 font-bold tracking-tight shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all bg-blue-600 hover:bg-blue-500 text-white border-none text-sm">
                                    <Upload className="mr-2 size-4" />
                                    사진 업로드
                                </Button>
                            </div>

                        </SettingSectionItem>
                        <SettingSectionItem label=""><></></SettingSectionItem>

                        <SettingSectionItem label="회원 이름">
                            <Input value={userNameInput} onChange={(e) => { setUserNameInput(e.target.value); setIsEditing(true) }} placeholder="이름을 입력하세요" className="rounded-2xl h-14 border-2 border-black/5 dark:border-white/5 focus-visible:ring-blue-500/20 bg-muted/5 font-bold" />
                        </SettingSectionItem>
                        <SettingSectionItem label="이메일 주소">
                            <Input value={userEmailInput} onChange={(e) => { setUserEmailInput(e.target.value); setIsEditing(true) }} placeholder="example@domain.com" className="rounded-2xl h-14 border-2 border-black/5 dark:border-white/5 focus-visible:ring-blue-500/20 bg-muted/5 font-bold" />
                        </SettingSectionItem>
                        <SettingSectionItem label="소속 부서">
                            <Input value={userDepartmentInput} onChange={(e) => { setUserDepartmentInput(e.target.value); setIsEditing(true) }} placeholder="소속 팀명을 입력하세요" className="rounded-2xl h-14 border-2 border-black/5 dark:border-white/5 focus-visible:ring-blue-500/20 bg-muted/5 font-bold" />
                        </SettingSectionItem>
                        <SettingSectionItem label="권한">
                            <Select
                                value={userRoleInput}
                                onValueChange={(e) => { setUserRoleInput(e as "ADMIN USER" | "USER"); setIsEditing(true) }}
                            >
                                <SelectTrigger className="rounded-2xl h-14 border-2 border-black/5 dark:border-white/5 focus:ring-blue-500/20 bg-muted/5 font-bold uppercase tracking-tight">
                                    <SelectValue placeholder="직책 선택" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-2 border-black/5 dark:border-white/5 shadow-xl backdrop-blur-xl bg-card/95">
                                    <SelectItem value="ADMIN USER" className="rounded-xl focus:bg-blue-500/10 focus:text-blue-600 font-bold py-3 transition-colors">관리자 (ADMIN)</SelectItem>
                                    <SelectItem value="USER" className="rounded-xl focus:bg-blue-500/10 focus:text-blue-600 font-bold py-3 transition-colors">일반 사용자 (USER)</SelectItem>
                                </SelectContent>
                            </Select>
                        </SettingSectionItem>
                    </SettingSection>

                    <SettingSection title="주식 페이지 설정" description="주식 페이지의 기본 설정을 관리합니다.">
                        <SettingSectionItem label="관심종목 초기화">
                            <AlertDialogButton onConfirm={clearStockWatchList} title="관심종목 초기화" description="관심종목을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다." variant="destructive" size='lg' className="rounded-2xl h-14 border-2 border-black/5 dark:border-white/5 focus-visible:ring-blue-500/20 bg-muted/5 font-bold w-64">
                                초기화
                            </AlertDialogButton>
                        </SettingSectionItem>
                        <SettingSectionItem label="메모 초기화">
                            <AlertDialogButton onConfirm={clearStockMemo} title="메모 초기화" description="메모를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다." variant="destructive" size='lg' className="rounded-2xl h-14 border-2 border-black/5 dark:border-white/5 focus-visible:ring-blue-500/20 bg-muted/5 font-bold w-64">
                                초기화
                            </AlertDialogButton>
                        </SettingSectionItem>
                    </SettingSection>
                </div>
            </main>
        </div>
    )
}