import { describe, it, expect } from 'vitest';
import { truncateTitle } from '../../lib/format';

describe('truncateTitle 함수 테스트', () => {
    it('글자 수가 한계치보다 적으면 그대로 반환해야 한다', () => {
        expect(truncateTitle('안녕하세요', 10)).toBe('안녕하세요');
    });

    it('글자 수가 한계치를 넘으면 자르고 ...을 붙여야 한다', () => {
        expect(truncateTitle('안녕하세요 반갑습니다', 5)).toBe('안녕하세요...');
    });

    it('입력값이 빈 문자열이면 빈 문자열을 반환해야 한다', () => {
        expect(truncateTitle('', 5)).toBe('');
    });
});