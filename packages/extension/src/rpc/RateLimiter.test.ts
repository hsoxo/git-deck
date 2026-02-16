import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from './RateLimiter';

describe('RateLimiter', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
        limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 });
    });

    describe('check', () => {
        it('should allow requests under the limit', () => {
            expect(limiter.check('test')).toBe(true);
            expect(limiter.check('test')).toBe(true);
            expect(limiter.check('test')).toBe(true);
        });

        it('should block requests over the limit', () => {
            for (let i = 0; i < 5; i++) {
                expect(limiter.check('test')).toBe(true);
            }
            expect(() => limiter.check('test')).toThrow('Rate limit exceeded');
        });

        it('should track different methods separately', () => {
            for (let i = 0; i < 5; i++) {
                expect(limiter.check('method1')).toBe(true);
            }
            expect(() => limiter.check('method1')).toThrow('Rate limit exceeded');
            expect(limiter.check('method2')).toBe(true);
        });

        it('should reset after time window', async () => {
            const shortLimiter = new RateLimiter({ maxRequests: 2, windowMs: 50 });

            expect(shortLimiter.check('test')).toBe(true);
            expect(shortLimiter.check('test')).toBe(true);
            expect(() => shortLimiter.check('test')).toThrow('Rate limit exceeded');

            await new Promise((resolve) => setTimeout(resolve, 60));

            expect(shortLimiter.check('test')).toBe(true);
        });
    });

    describe('reset', () => {
        it('should reset specific method', () => {
            for (let i = 0; i < 5; i++) {
                limiter.check('test');
            }
            expect(() => limiter.check('test')).toThrow('Rate limit exceeded');

            limiter.reset('test');
            expect(limiter.check('test')).toBe(true);
        });

        it('should reset all methods', () => {
            for (let i = 0; i < 5; i++) {
                limiter.check('method1');
                limiter.check('method2');
            }
            expect(() => limiter.check('method1')).toThrow('Rate limit exceeded');
            expect(() => limiter.check('method2')).toThrow('Rate limit exceeded');

            limiter.reset();
            expect(limiter.check('method1')).toBe(true);
            expect(limiter.check('method2')).toBe(true);
        });
    });

    describe('getStats', () => {
        it('should return correct stats', () => {
            limiter.check('test');
            limiter.check('test');
            limiter.check('test');

            const stats = limiter.getStats('test');
            expect(stats.count).toBe(3);
            expect(stats.limit).toBe(5);
        });

        it('should return zero for unused method', () => {
            const stats = limiter.getStats('unused');
            expect(stats.count).toBe(0);
            expect(stats.limit).toBe(5);
        });
    });
});
