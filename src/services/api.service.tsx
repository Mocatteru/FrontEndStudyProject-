import axios from "axios";
class ApiService {
    protected baseURL = 'https://jsonplaceholder.typicode.com'; //내가 일할때 헀던 API 사이트에서 받아오는건데 만약
    //백엔드 서버단이 바뀌면 프론트엔드는 baseURL만 수정하면 됨

    async get<T>(endPoint: string): Promise<T> {
        const response = await axios.get(`${this.baseURL}${endPoint}`);
        console.log(`${this.baseURL}${endPoint}`);
        return response.data;
    }
}

class PostService extends ApiService {
    getPosts() {
        return this.get<any[]>('/posts?_limit=10'); //TODO: 타입정의 any[] <- 나중에 받아오는 api에 타입정의해서 없애야할거같음
    }
}

export const postService = new PostService();