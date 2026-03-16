import { describe, it, expect } from 'vitest';
import { TruncateTitle } from '@/lib/format';
import { FormatPriceCurrency } from '@/types/stock';

describe('truncateTitle 함수 테스트', () => {
    it('글자 수가 한계치보다 적으면 그대로 반환해야 한다', () => {
        expect(TruncateTitle('안녕하세요', 10)).toBe('안녕하세요');
    });

    it('글자 수가 한계치를 넘으면 자르고 ...을 붙여야 한다', () => {
        expect(TruncateTitle('안녕하세요 반갑습니다', 5)).toBe('안녕하세요...');
    });

    it('입력값이 빈 문자열이면 빈 문자열을 반환해야 한다', () => {
        expect(TruncateTitle('', 5)).toBe('');
    });
});

describe('FormatPriceCurrency 함수 테스트', () => {
    it('1000000을 입력하면 1,000,000원 으로 반환해야 한다', () => {
        expect(FormatPriceCurrency('KRW', "1000000")).toBe('1,000,000원');
    });

    it('1000을 입력하면 $1,000 으로 반환해야 한다', () => {
        expect(FormatPriceCurrency('USD', "1000")).toBe('$1,000');
    });

    it('0을 입력하면 $0 으로 반환해야 한다', () => {
        expect(FormatPriceCurrency("USD", "0 ")).toBe('$0');
    });
});
