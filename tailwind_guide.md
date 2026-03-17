# 🎨 테일윈드 CSS(Tailwind CSS) 마스터 가이드

이 문서는 **Frontend Encyclopedia**의 실전 편으로, 프로젝트에서 세련된 UI를 빠르고 효율적으로 구축하기 위한 테일윈드 CSS의 핵심 개념과 실무 팁을 정리한 가이드라인입니다.

---

## 🏗️ 1. 테일윈드의 철학: Utility-First
테일윈드는 클래스명 자체가 스타일(CSS)입니다. CSS 파일을 따로 만들고 클래스 이름을 고민하는 시간을 없애줍니다.

- **기존 방식**: `.search-button { background: blue; color: white; }`
- **테일윈드**: `<button class="bg-blue-500 text-white">`

---

## 📏 2. 핵심 수치 체계 (Spacing & Sizing)
테일윈드의 숫자는 보통 **1 = 4px (0.25rem)** 단위를 기준으로 합니다.

| 클래스 | 실제 크기 | 설명 |
| :--- | :--- | :--- |
| `p-1` | 4px | 아주 좁은 간격 |
| `p-4` | 16px | 가장 표준적인 간격 (1rem) |
| `w-64` | 256px | 보통 사이드바나 큰 인풋 너비 |
| `w-full` | 100% | 부모 너비에 꽉 채움 |
| `h-screen` | 100vh | 화면 높이 전체 차지 |

---

## 🍱 3. 레이아웃의 마스터: Flexbox & Grid
현대적인 레이아웃의 90%는 이 클래스들로 해결됩니다.

### **Flexbox (선형 배치)**
- `flex`: Flex 컨테이너 선언
- `flex-col`: 세로로 쌓기 (리스트, 폼 등)
- `items-center`: 수직 중앙 정렬 (글자와 아이콘 높이 맞추기 등)
- `justify-between`: 양 끝으로 벌리기 (좌측 티커, 우측 가격)
- `gap-2`: 요소 사이의 일정한 간격 (8px)

### **Grid (격자 배치)**
- `grid`: Grid 컨테이너 선언
- `grid-cols-2`: 2단 열 구성
- `gap-4`: 격자 사이의 간격

---

## 📍 4. 위치 제어: Positioning (이번 작업 핵심!)
드롭다운, 모달, 툴팁을 만들 때 필수입니다.

- `relative`: 기준점 설정 (부모 요소에 적용)
- `absolute`: 자유로운 영혼 (부모의 품 안에서 이동)
- `top-full`: 부모 엘리먼트의 바로 아래 끝단에서 시작
- `z-50`: 다른 요소보다 무조건 위로 떠 있게 함 (Layer index)

---

## ✨ 5. 심미적 디테일 (Aesthetics)
앱의 '고급스러움'을 결정짓는 수치들입니다.

- **둥근 모서리**: `rounded-lg` (8px), `rounded-full` (알약 모양)
- **그림자**: `shadow-md` (기본), `shadow-xl` (떠 있는 느낌)
- **테두리**: `border`, `border-white/10` (투명도가 섞인 세련된 테두리)
- **배경**: `bg-white/5` (유리 같은 느낌), `backdrop-blur-sm` (투명도 뒤 흐림 효과)

---

## ⚡ 6. 상태와 반응형 (States & Variants)
- **Hover**: `hover:scale-105` (마우스 올리면 살짝 확대)
- **Active**: `active:opacity-70` (클릭 시 눌리는 느낌)
- **Focus**: `focus:ring-2` (인풋 선택 시 강조)
- **Responsive**: `lg:flex` (큰 화면(1024px 이상)에서만 Flex 적용)

---

## 💡 시니어의 실무 꿀팁

1. **임의 수치 쓰기**: `w-[327px]` 처럼 대괄호를 쓰면 정해진 규격 외의 수치도 즉석에서 쓸 수 있습니다.
2. **반쪽 투명도**: `bg-blue-500/50` 처럼 색상 로직 뒤에 `/숫자`를 붙이면 아주 쉽게 투명도를 조절합니다.
3. **Transition**: 애니메이션 효과를 주려면 `transition-all duration-300`을 먼저 적어두는 습관을 들이세요.

---

### 🏁 다음 작업 가이드
이제 [StockSearch.tsx](file:///Users/moca/FrontEndStudyProject-/src/app/stock-page/components/StockSearch.tsx)에서 이 지식들을 활용해 보세요. 입력을 위한 `input` 바로 아래에 `absolute` 속성을 가진 최근 검색 기록 리스트를 만드는 것이 목표입니다! 🚀
