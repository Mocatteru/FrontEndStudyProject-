/**
 * [Pure Function: 순수 함수]
 * - 특징: 같은 입력에 대해 항상 같은 출력을 내며, 외부 상태를 변경하지 않습니다.
 * - 장점: 부작용(Side Effect)이 없어 테스트 코드를 작성하기 매우 쉽고 유지보수가 편합니다.
 * - 활용: __tests__/lib/format.test.ts 파일에서 이 함수의 동작을 검증하고 있습니다.
 * 
 * 제목의 길이가 일정 수를 넘으면 ...를 표시합니다.
 * @param title 제목
 * @param limit ...를 표시할 길이 
 * @returns string
 */
export function TruncateTitle(title: string, limit: number) {
    if (!title) return ''; // 예외 처리: 데이터가 없는 경우 빈 문자열 반환 (방어적 프로그래밍)
    return title.length > limit ? `${title.slice(0, limit)}...` : title;
}