import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* [학습 포인트: 개발 서버 보안 설정 (CORS/Origin)]
     스마트폰(10.10.4.71)으로 접속할 때 에러가 나는 이유는 Next.js 개발 서버가 보안을 위해 
     'localhost' 외의 다른 주소(Origin)에서 들어오는 내부 리소스(HMR 등) 요청을 기본적으로 차단하기 때문입니다.
     
     실무 해결책: 
     이 옵션에 허용할 기기의 IP 주소를 추가해주면 Next.js가 해당 기기를 "안전한 기기"로 인식합니다.
  */
  experimental: {
    // @ts-ignore: Next.js 15+ 최신 버전에서 외부 IP 접속(HMR)을 위해 필요한 속성이나, 아직 타입 정의가 반영되지 않았을 수 있음
    allowedDevOrigins: ["10.10.4.71", "localhost:3000"],
  },
};

export default nextConfig;
