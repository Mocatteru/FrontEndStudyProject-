import { useErrorStore } from "@/store/errorStore";
import axios from "axios";

const baseURL = 'https://jsonplaceholder.typicode.com';

export async function fetchData(url: string) {
    try {
        const res = await axios.get(`${baseURL}${url}`).then((res) => res.data);
        return res;

    } catch (error) {
        console.error(`[API Error] ${url}:`, error);

        let errorMessage = '데이터를 불러오는 중 문제가 발생했습니다.';
        if (axios.isAxiosError(error)) {
            errorMessage = error.message;
        }

        useErrorStore.getState().showError(errorMessage);
        throw error;
    }
}