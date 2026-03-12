"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  /**
   * [학습 포인트] Hydration Mismatch 방지 패턴
   * 클라이언트 사이드에서만 테마 상태를 알 수 있으므로, 
   * 컴포넌트가 브라우저에 마운트된 이후에만 테마 관련 UI를 렌더링하도록 제어합니다.
   */
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 아직 마운트되지 않은 상태(서버 렌더링 시점)에서는 레이아웃 깨짐을 방지하기 위해 
  // 실제 버튼 대신 빈 공간이나 스켈레톤을 반환합니다.
  if (!mounted) {
    return (
      <button className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 transition-colors">
        <span className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
