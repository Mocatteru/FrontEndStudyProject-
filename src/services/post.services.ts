import { fetchData } from "./api.utils";


/**
 * [Service Layer] API 비즈니스 로직
 * - 역할: 구성된 Axios 인스턴스를 사용하여 서버와 직접 통신합니다.
 * - 특징: '데이터 가공'과 'API 호출'을 컴포넌트에서 분리하여 재사용성을 높였습니다.
 * - 실무 팁: 각 함수는 Promise를 반환하며, React Query와 결합되어 강력한 시너지를 냅니다.
 */
const baseURL = 'https://jsonplaceholder.typicode.com';


export function getPosts() {
    return fetchData(baseURL, '/posts?_limit=10');
}


//TODO: PUT, POST, DELETE API 구현시 함수 추가

//Legacy Code
// class ApiService {
//     protected baseURL = 'https://jsonplaceholder.typicode.com'; //내가 일할때 헀던 API 사이트에서 받아오는건데 만약
//     //백엔드 서버단이 바뀌면 프론트엔드는 baseURL만 수정하면 됨

//     async get<T>(endPoint: string): Promise<T> {
//         try {
//             const response = await axios.get(`${this.baseURL}${endPoint}`);
//             return response.data;
//         }
//         catch (error) {
//             // 시니어의 팁: 여기서 로그를 남기거나 전역 에러 알림을 띄웁니다.
//             console.error(`[API Error] ${endPoint}:`, error);
//             throw error; // 에러를 다시 던져서 UI(React Query)가 알 수 있게 합니다.
//         }
//     }
// }

// class PostService extends ApiService {
//     getPosts() {
//         return this.get<Post[]>('/posts?_limit=10');
//     }
// }

// export const postService = new PostService();