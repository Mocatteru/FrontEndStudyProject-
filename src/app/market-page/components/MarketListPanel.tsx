'use client'

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import MarketListRow from "./MarketListRow";

// ── 지수·환율 목록 ─────────────────────────────────
const INDEX_EXCHANGE_ITEMS = [
    { symbol: "^KS11", name: "코스피", group: "주가지수" },
    { symbol: "^KQ11", name: "코스닥", group: "주가지수" },
    { symbol: "^IXIC", name: "나스닥", group: "주가지수" },
    { symbol: "^GSPC", name: "S&P 500", group: "주가지수" },
    { symbol: "^SOX", name: "필라델피아 반도체", group: "주가지수" },
    { symbol: "^VIX", name: "VIX (공포지수)", group: "주가지수" },
    { symbol: "^DJI", name: "다우존스", group: "주가지수" },
    { symbol: "^N225", name: "닛케이 225", group: "주가지수" },
    { symbol: "DX-Y.NYB", name: "달러 인덱스", group: "환율" },
    { symbol: "USDKRW=X", name: "달러 환율 (USD/KRW)", group: "환율" },
    { symbol: "USDJPY=X", name: "엔화 환율 (USD/JPY)", group: "환율" },
    { symbol: "EURUSD=X", name: "유로 환율 (EUR/USD)", group: "환율" },
];

// ── 원자재 목록 ────────────────────────────────────
const COMMODITY_ITEMS = [
    { symbol: "GC=F", name: "금 (Gold)", group: "귀금속" },
    { symbol: "SI=F", name: "은 (Silver)", group: "귀금속" },
    { symbol: "HG=F", name: "구리 (Copper)", group: "귀금속" },
    { symbol: "CL=F", name: "WTI 원유", group: "에너지" },
    { symbol: "NG=F", name: "천연가스", group: "에너지" },
    { symbol: "RB=F", name: "휘발유 선물", group: "에너지" },
    { symbol: "ZC=F", name: "옥수수 (Corn)", group: "농산물" },
    { symbol: "ZS=F", name: "대두 (Soybean)", group: "농산물" },
    { symbol: "ZW=F", name: "밀 (Wheat)", group: "농산물" },
];

type TabValue = "index" | "commodity";

// ── 섹션 레이블 ────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
    return (
        <p className="px-3 pt-3 pb-0.5 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 select-none">
            {children}
        </p>
    );
}

interface MarketListPanelProps {
    selectedSymbol: string;
    onSelect: (symbol: string, name: string) => void;
}

// ── 섹션 그룹 렌더러 (DRY 원칙) ──────────────────────
function MarketGroup({ title, items, selectedSymbol, onSelect }: {
    title: string;
    items: { symbol: string; name: string }[];
    selectedSymbol: string;
    onSelect: (symbol: string, name: string) => void;
}) {
    if (!items.length) return null;
    return (
        <>
            <SectionLabel>{title}</SectionLabel>
            {items.map(item => (
                <MarketListRow
                    key={item.symbol}
                    symbol={item.symbol}
                    name={item.name}
                    isSelected={selectedSymbol === item.symbol}
                    onClick={onSelect}
                />
            ))}
        </>
    );
}

export default function MarketListPanel({ selectedSymbol, onSelect }: MarketListPanelProps) {
    const [activeTab, setActiveTab] = useState<TabValue>("index");

    return (
        <div className="flex flex-col h-full">
            {/* ── 탭 헤더: shadcn TabsList 대신 직접 구현 (justify-center 강제 적용 문제 방지) */}
            <div className="shrink-0 flex items-center gap-1 px-6 h-11 border-b border-black/5 dark:border-white/5">
                {(["index", "commodity"] as const).map((tab) => {
                    const label = tab === "index" ? "지수 · 환율" : "원자재";
                    const isActive = activeTab === tab;
                    return (
                        <Button
                            key={tab}
                            type="button"
                            variant="ghost"
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "rounded-xl px-4 h-8 text-[11px] font-black uppercase tracking-widest transition-all",
                                isActive
                                    ? "bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                                    : "text-muted-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                            )}
                        >
                            {label}
                        </Button>
                    );
                })}
            </div>

            {/* ── 탭 콘텐츠 ──────────────────────────────── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === "index" && (
                    <div className="p-2 space-y-0.5">
                        <MarketGroup title="주가지수" items={INDEX_EXCHANGE_ITEMS.filter(i => i.group === "주가지수")} selectedSymbol={selectedSymbol} onSelect={onSelect} />
                        <MarketGroup title="환율" items={INDEX_EXCHANGE_ITEMS.filter(i => i.group === "환율")} selectedSymbol={selectedSymbol} onSelect={onSelect} />
                    </div>
                )}

                {activeTab === "commodity" && (
                    <div className="p-2 space-y-0.5">
                        <MarketGroup title="귀금속" items={COMMODITY_ITEMS.filter(i => i.group === "귀금속")} selectedSymbol={selectedSymbol} onSelect={onSelect} />
                        <MarketGroup title="에너지" items={COMMODITY_ITEMS.filter(i => i.group === "에너지")} selectedSymbol={selectedSymbol} onSelect={onSelect} />
                        <MarketGroup title="농산물" items={COMMODITY_ITEMS.filter(i => i.group === "농산물")} selectedSymbol={selectedSymbol} onSelect={onSelect} />
                    </div>
                )}
            </div>
        </div>
    );
}
