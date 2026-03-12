import { useErrorStore } from "@/store/errorStore";
import axios from "axios";

/**
 * [Axios Utils] 공통 통신 유틸리티
 * - 역할: 모든 API 요청의 베이스 설정과 에러 핸들링을 한곳에서 처리합니다.
 */
const baseURL = 'https://jsonplaceholder.typicode.com';

export async function fetchData(url: string) {
    try {
        // axios.get: HTTP GET 요청을 보내는 메서드입니다.
        const res = await axios.get(`${baseURL}${url}`).then((res) => res.data);
        return res;

    } catch (error) {
        /**
         * [실무 패턴] 중앙 집중식 에러 처리
         * - 모든 API 에러는 여기서 catch되어 로그를 남기고, 
         * - UI 라이브러리나 Store(errorStore)를 통해 사용자에게 알림을 보냅니다.
         */
        console.error(`[API Error] ${url}:`, error);

        let errorMessage = '데이터를 불러오는 중 문제가 발생했습니다.';
        if (axios.isAxiosError(error)) {
            // axios.isAxiosError: TypeScript에서 에러 객체가 Axios 타입인지 타입 가드 역할을 합니다.
            errorMessage = error.message;
        }

        useErrorStore.getState().showError(errorMessage); // 전역 알림(Toast 등) 트리거
        throw error;
    }
}