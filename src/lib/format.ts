/**
 * 제목의 길이거 일정 수 를 넘으면 ...를 표시하는 함수입니다
 * @param title 제목
 * @param limit ...를 표시할 길이 
 * @returns string
 */
export function truncateTitle(title: string, limit: number) {
    if (!title) return '';
    return title.length > limit ? `${title.slice(0, limit)}...` : title;
}