'use client';

import { SidebarContent, SidebarHeader, SidebarGroup, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar";
import { Star, List, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockWatchListSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function StockWatchListSidebar({ isOpen, onToggle }: StockWatchListSidebarProps) {
    return (
        <aside
            className={cn(
                "h-full border-l border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-md transition-all duration-500 ease-in-out flex flex-col overflow-hidden shrink-0",
                isOpen ? "w-72" : "w-16"
            )}
        >
            <SidebarHeader className={cn(
                "p-4 border-b border-black/5 dark:border-white/10 flex items-center transition-all duration-500",
                isOpen ? "flex-row justify-between h-20" : "flex-col justify-center h-20"
            )}>
                {isOpen ? (
                    <>
                        <div className="flex items-center gap-2 font-bold text-sm text-blue-500 animate-in fade-in slide-in-from-left-2">
                            <Star className="size-5 fill-current text-blue-500" />
                            <span>나의 관심 종목</span>
                        </div>
                        <button
                            onClick={onToggle}
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all text-muted-foreground hover:text-foreground active:scale-90"
                        >
                            <Menu className="size-5" />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onToggle}
                        className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl hover:bg-blue-500/20 transition-all active:scale-90 shadow-sm border border-blue-500/10"
                    >
                        <Menu className="size-5" />
                    </button>
                )}
            </SidebarHeader>

            <SidebarContent className={cn(
                "p-2 space-y-4 overflow-y-auto custom-scrollbar flex flex-col flex-1",
                !isOpen && "items-center pt-6"
            )}>
                <SidebarGroup className={cn("w-full transition-all duration-500", !isOpen && "px-0")}>
                    {/* {isOpen && (
                        <SidebarGroupLabel className="flex items-center gap-2 mb-2 px-2 animate-in fade-in slide-in-from-left-2">
                            <List className="size-3" />
                            <span>Watchlist Summary</span>
                        </SidebarGroupLabel>
                    )} */}

                    <SidebarMenu className={cn("px-2 transition-all duration-500", !isOpen && "px-0 flex flex-col items-center gap-4")}>
                        {isOpen ? (
                            <div className="p-6 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl bg-black/5 dark:bg-white/5 animate-in fade-in slide-in-from-bottom-2">
                                <Star className="size-6 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-xs font-semibold text-foreground">관심 종목이 없습니다.</p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1 italic">자주 보는 종목을 추가해보세요!</p>
                            </div>
                        ) : (
                            null
                        )}

                        {/* {!isOpen && (
                            <div className="size-10 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-muted-foreground/20 border border-black/5">
                                <Star className="size-4" />
                            </div>
                        )} */}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
        </aside>
    );
}