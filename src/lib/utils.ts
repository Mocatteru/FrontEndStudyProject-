import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── 마켓 공통 유틸리티 ─────────────────────────────
export function formatMarketPrice(price?: number, currency?: string): string {
    if (price == null) return "---";
    if (currency === "KRW") return price.toLocaleString("ko-KR");
    // 소수점 2자리 고정 (지수, 원자재, 환율 모두 동일 기준)
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
