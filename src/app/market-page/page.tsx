import MarketDashboard from "./MarketDashboard";

export const metadata = {
  title: "글로벌 마켓 지수 및 원자재 현황",
  description: "전 세계 주요 지수, 원자재, 환율 정보를 한눈에 확인하세요.",
};

export default function Page() {
  return <MarketDashboard />;
}
