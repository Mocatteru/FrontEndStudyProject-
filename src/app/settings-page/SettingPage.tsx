'use client'

import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Upload, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStockStore } from "@/store/useStockStore";
import { AlertDialogButton } from "@/components/common/AlertDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfileForm } from "@/hooks/useProfileForm";

// ─── 하위 컴포넌트 (Rule 4: Atomic Design) ───────────────────────────────────

function SettingSectionItem({ label, children, fullWidth }: { label: string; children: React.ReactNode; fullWidth?: boolean }) {
    return (
        <div className={cn("space-y-3 w-full animate-in fade-in duration-500", fullWidth && "sm:col-span-2")}>
            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/85 ml-1">
                {label}
            </label>
            <div className="relative group">{children}</div>
        </div>
    );
}

function SettingSection({ title, description, children }: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-4">
                    <h2 className="text-3xl font-black tracking-tighter uppercase text-foreground">{title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{description}</p>
                </div>
                <div className="md:col-span-2 bg-card border border-black/5 dark:border-white/5 p-10 rounded-[3rem] shadow-sm shadow-black/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-12">{children}</div>
                </div>
            </div>
            <Separator className="bg-black/5 dark:bg-white/5 mt-20 mb-20" />
        </section>
    );
}

// [Rule 5] 로딩 시 콘텐츠 구조를 반영한 스켈레톤 컴포넌트
function SettingSkeleton() {
    return (
        <div className="space-y-20 animate-in fade-in duration-500">
            {[1, 2].map((i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-48 rounded-xl bg-black/5 dark:bg-white/5" />
                        <Skeleton className="h-20 w-full rounded-2xl bg-black/5 dark:bg-white/5" />
                    </div>
                    <div className="md:col-span-2 bg-card border border-black/5 dark:border-white/5 p-10 rounded-[3rem] shadow-sm shadow-black/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-12">
                            {[1, 2, 3, 4].map((j) => (
                                <div key={j} className="space-y-3">
                                    <Skeleton className="h-4 w-20 ml-1 bg-black/5 dark:bg-white/5" />
                                    <Skeleton className="h-14 w-full rounded-2xl bg-black/5 dark:bg-white/5" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

const INPUT_CLASS = "rounded-2xl h-14 border-2 border-black/5 dark:border-white/5 focus-visible:ring-blue-500/20 bg-muted/5 font-bold";
// [Rule 11 DRY] 초기화 버튼 공통 className - 동일 패턴이 2회 이상 반복되므로 상수로 추상화
const RESET_BUTTON_CLASS = `${INPUT_CLASS} w-64`;

export default function SettingPage() {
    const { clearStockWatchList, clearStockMemo } = useStockStore();
    const { form, isEditing, isSaving, isLoading, handleChange, handleAvatarChange, handleSave, handleReset } = useProfileForm();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = useCallback(() => fileInputRef.current?.click(), []);

    const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleAvatarChange(file);
    }, [handleAvatarChange]);

    if (isLoading) {
        return (
            <div className="flex flex-col w-full bg-background min-h-screen">
                {/* 페이지 타이틀 레이아웃 유지하며 스켈레톤 노출 */}
                <div className="sticky top-0 flex items-center gap-3 px-6 h-11 border-b border-black/5 dark:border-white/5 bg-background/95 backdrop-blur-xl z-50">
                    <Skeleton className="size-4 rounded-lg bg-black/10" />
                    <Skeleton className="h-4 w-24 bg-black/10" />
                </div>
                <main className="flex-1 px-12 py-20">
                    <div className="max-w-[1600px] w-full">
                        <SettingSkeleton />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full bg-background selection:bg-blue-500/20 relative">
            {/* 페이지 타이틀 (MarketDashboard 스타일 + 스티키 고정) */}
            <div className="sticky top-0 flex items-center gap-3 px-6 h-11 border-b border-black/5 dark:border-white/5 shrink-0 bg-background/95 backdrop-blur-xl z-50">
                <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/10">
                    <Settings className="size-4 text-blue-500" />
                </div>
                <div>
                    <h1 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">설정</h1>
                    <p className="text-[9px] font-black tracking-[0.3em] text-muted-foreground/40 uppercase">System Config</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {/* [Best Practice] 변경 사항 취소 버튼 추가 */}
                    <Button
                        variant="ghost"
                        disabled={!isEditing || isSaving}
                        onClick={handleReset}
                        className="rounded-lg px-4 h-7 tracking-widest font-black transition-all text-muted-foreground/40 hover:text-foreground text-[10px]"
                    >
                        취소
                    </Button>
                    <Button
                        disabled={!isEditing || isSaving}
                        onClick={handleSave}
                        size="sm"
                        className="rounded-lg px-4 h-7 tracking-widest font-black shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all bg-blue-600 hover:bg-blue-500 text-white border-none text-[10px] disabled:opacity-50"
                    >
                        {isSaving ? "동기화 중..." : "저장하기"}
                    </Button>
                </div>
            </div>

            {/* 본문 */}
            <main className="flex-1 px-12 py-20">
                <div className="max-w-[1600px] w-full">
                    {isLoading ? (
                        <SettingSkeleton />
                    ) : (
                        <>
                            <SettingSection
                                title="사용자 정보"
                                description="시스템 프로필과 기본 계정 정보를 관리합니다. 모든 변경 사항은 즉시 동기화 노드에 반영됩니다."
                            >
                                <SettingSectionItem label="프로필 사진" fullWidth>
                                    <div
                                        className="relative group cursor-pointer w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
                                        onClick={handleAvatarClick}
                                        onKeyDown={(e) => e.key === "Enter" && handleAvatarClick()}
                                        tabIndex={0}
                                        role="button"
                                        aria-label="프로필 이미지 변경"
                                    >
                                        <Avatar className="h-32 w-32 border-4 border-background shadow-2xl transition-transform group-hover:scale-105">
                                            {/* [Best Practice] referrerPolicy 및 명확한 Fallback 설정 */}
                                            <AvatarImage
                                                src={form.userAvatar || "/images/placeholder-avatar.png"}
                                                className="object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                            <AvatarFallback className="text-2xl font-bold bg-blue-50 text-blue-600">사용자</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <Upload className="text-white size-8 translate-y-2 group-hover:translate-y-0 transition-transform duration-300" />
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={onFileChange}
                                            className="hidden"
                                            accept="image/*"
                                            aria-label="프로필 사진 파일 선택"
                                        />
                                    </div>
                                </SettingSectionItem>

                                <SettingSectionItem label="이름">
                                    <Input
                                        value={form.userName}
                                        onChange={(e) => handleChange("userName", e.target.value)}
                                        placeholder="이름을 입력하세요"
                                        className={INPUT_CLASS}
                                    />
                                </SettingSectionItem>

                                <SettingSectionItem label="이메일 주소">
                                    <Input
                                        value={form.userEmail}
                                        onChange={(e) => handleChange("userEmail", e.target.value)}
                                        placeholder="example@domain.com"
                                        className={INPUT_CLASS}
                                    />
                                </SettingSectionItem>

                                <SettingSectionItem label="소속 부서">
                                    <Input
                                        value={form.userDepartment}
                                        onChange={(e) => handleChange("userDepartment", e.target.value)}
                                        placeholder="소속 팀명을 입력하세요"
                                        className={INPUT_CLASS}
                                    />
                                </SettingSectionItem>

                                <SettingSectionItem label="권한">
                                    <Select
                                        value={form.userRole}
                                        onValueChange={(value) => handleChange("userRole", value ?? "USER")}
                                    >
                                        <SelectTrigger className={INPUT_CLASS}>
                                            <SelectValue placeholder="직책 선택" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-2 border-black/5 dark:border-white/5 shadow-xl backdrop-blur-xl bg-card/95">
                                            <SelectItem value="ADMIN USER" className="rounded-xl focus:bg-blue-500/10 focus:text-blue-600 font-bold py-3 transition-colors">관리자</SelectItem>
                                            <SelectItem value="USER" className="rounded-xl focus:bg-blue-500/10 focus:text-blue-600 font-bold py-3 transition-colors">일반 사용자</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </SettingSectionItem>
                            </SettingSection>

                            <SettingSection title="주식 페이지 설정" description="주식 페이지의 기본 설정을 관리합니다.">
                                <SettingSectionItem label="관심종목 초기화">
                                    <AlertDialogButton
                                        onConfirm={clearStockWatchList}
                                        title="관심종목 초기화"
                                        description="관심종목을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                                        variant="destructive"
                                        size="lg"
                                        className={RESET_BUTTON_CLASS}
                                    >
                                        초기화
                                    </AlertDialogButton>
                                </SettingSectionItem>
                                <SettingSectionItem label="메모 초기화">
                                    <AlertDialogButton
                                        onConfirm={clearStockMemo}
                                        title="메모 초기화"
                                        description="메모를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                                        variant="destructive"
                                        size="lg"
                                        className={RESET_BUTTON_CLASS}
                                    >
                                        초기화
                                    </AlertDialogButton>
                                </SettingSectionItem>
                            </SettingSection>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}