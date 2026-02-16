import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RPCServer } from '../../../packages/extension/src/rpc/RPCServer';
import { RateLimiter } from '../../../packages/extension/src/rpc/RateLimiter';
import { RPCValidator } from '../../../packages/extension/src/rpc/RPCValidator';

describe('Security: RPC Security Tests', () => {
    let rpcServer: RPCServer;
    let rateLimiter: RateLimiter;
    let rpcValidator: RPCValidator;

    beforeEach(() => {
        rpcServer = new RPCServer();
        rateLimiter = new RateLimiter({ maxRequests: 10, windowMs: 1000 });
        rpcValidator = new RPCValidator();
    });

    describe('Rate Limiting', () => {
        it('should allow requests within limit', () => {
            for (let i = 0; i < 10; i++) {
                expect(() => rateLimiter.check('testMethod')).not.toThrow();
            }
        });

        it('should block requests exceeding limit', () => {
            for (let i = 0; i < 10; i++) {
                rateLimiter.check('testMethod');
            }
            expect(() => rateLimiter.check('testMethod')).toThrow('Rate limit exceeded');
        });

        it('should reset after time window', async () => {
            for (let i = 0; i < 10; i++) {
                rateLimiter.check('testMethod');
            }

            // Wait for window to expire
            await new Promise((resolve) => setTimeout(resolve, 1100));

            expect(() => rateLimiter.check('testMethod')).not.toThrow();
        });

        it('should track different methods separately', () => {
            for (let i = 0; i < 10; i++) {
                rateLimiter.check('method1');
            }

            expect(() => rateLimiter.check('method2')).not.toThrow();
        });

        it('should handle concurrent requests', () => {
            const promises = Array.from({ length: 5 }, () =>
                Promise.resolve(rateLimiter.check('testMethod'))
            );

            expect(() => Promise.all(promises)).not.toThrow();
        });
    });

    describe('Parameter Validation', () => {
        beforeEach(() => {
            rpcValidator.register('stageFiles', {
                params: [
                    {
                        type: 'array',
                        items: { type: 'string', pattern: /^[^/].*/ },
                    },
                ],
            });

            rpcValidator.register('createBranch', {
                params: [
                    {
                        type: 'object',
                        properties: {
                            name: { type: 'string', pattern: /^[a-zA-Z0-9/_-]+$/ },
                        },
                    },
                ],
            });
        });

        it('should validate array parameters', () => {
            expect(() => {
                rpcValidator.validate('stageFiles', [['file1.txt', 'file2.txt']]);
            }).not.toThrow();
        });

        it('should reject invalid array items', () => {
            expect(() => {
                rpcValidator.validate('stageFiles', [['/etc/passwd']]);
            }).toThrow();
        });

        it('should validate object parameters', () => {
            expect(() => {
                rpcValidator.validate('createBranch', [{ name: 'feature/test' }]);
            }).not.toThrow();
        });

        it('should reject invalid object properties', () => {
            expect(() => {
                rpcValidator.validate('createBranch', [{ name: 'feature..test' }]);
            }).toThrow();
        });

        it('should allow unregistered methods', () => {
            expect(() => {
                rpcValidator.validate('unknownMethod', []);
            }).not.toThrow();
        });
    });

    describe('RPC Request Validation', () => {
        it('should reject requests without method', () => {
            const invalidRequest = { id: 1, params: [] };
            expect(() => {
                rpcServer['validateRequest'](invalidRequest as any);
            }).toThrow('Invalid RPC request');
        });

        it('should reject requests without id', () => {
            const invalidRequest = { method: 'test', params: [] };
            expect(() => {
                rpcServer['validateRequest'](invalidRequest as any);
            }).toThrow('Invalid RPC request');
        });

        it('should reject requests with invalid params type', () => {
            const invalidRequest = { id: 1, method: 'test', params: 'not-array' };
            expect(() => {
                rpcServer['validateRequest'](invalidRequest as any);
            }).toThrow('Invalid RPC request');
        });

        it('should accept valid requests', () => {
            const validRequest = { id: 1, method: 'test', params: [] };
            expect(() => {
                rpcServer['validateRequest'](validRequest);
            }).not.toThrow();
        });
    });

    describe('RPC Method Registration Security', () => {
        it('should prevent duplicate method registration', () => {
            rpcServer.register('testMethod', async () => 'result1');

            expect(() => {
                rpcServer.register('testMethod', async () => 'result2');
            }).toThrow('Method already registered');
        });

        it('should validate method names', () => {
            expect(() => {
                rpcServer.register('', async () => 'result');
            }).toThrow('Invalid method name');
        });

        it('should validate handler is a function', () => {
            expect(() => {
                rpcServer.register('testMethod', 'not-a-function' as any);
            }).toThrow('Handler must be a function');
        });
    });

    describe('RPC Error Handling', () => {
        it('should not leak internal errors', async () => {
            rpcServer.register('errorMethod', async () => {
                throw new Error('Internal database connection failed at 192.168.1.1');
            });

            const mockPostMessage = vi.fn();
            await rpcServer['handleRequest'](
                { id: 1, method: 'errorMethod', params: [] },
                mockPostMessage
            );

            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.not.stringContaining('192.168.1.1'),
                })
            );
        });

        it('should sanitize error messages', async () => {
            rpcServer.register('errorMethod', async () => {
                throw new Error('Error: /home/user/.ssh/id_rsa not found');
            });

            const mockPostMessage = vi.fn();
            await rpcServer['handleRequest'](
                { id: 1, method: 'errorMethod', params: [] },
                mockPostMessage
            );

            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.not.stringContaining('/home/user'),
                })
            );
        });
    });

    describe('RPC Timeout Protection', () => {
        it('should timeout long-running operations', async () => {
            const limiter = new RateLimiter({
                maxRequests: 100,
                windowMs: 1000,
                timeout: 100,
            });

            const slowOperation = async () => {
                await new Promise((resolve) => setTimeout(resolve, 200));
            };

            await expect(limiter.executeWithTimeout('slowOp', slowOperation)).rejects.toThrow(
                'Operation timeout'
            );
        });

        it('should complete fast operations', async () => {
            const limiter = new RateLimiter({
                maxRequests: 100,
                windowMs: 1000,
                timeout: 100,
            });

            const fastOperation = async () => 'result';

            await expect(limiter.executeWithTimeout('fastOp', fastOperation)).resolves.toBe(
                'result'
            );
        });
    });

    describe('RPC Abuse Prevention', () => {
        it('should detect rapid repeated requests', () => {
            const requests: any[] = [];
            for (let i = 0; i < 50; i++) {
                requests.push({ id: i, method: 'sameMethod', params: [] });
            }

            let blockedCount = 0;
            requests.forEach((req) => {
                try {
                    rateLimiter.check(req.method);
                } catch {
                    blockedCount++;
                }
            });

            expect(blockedCount).toBeGreaterThan(0);
        });

        it('should allow burst then throttle', () => {
            const results: boolean[] = [];

            // First 10 should succeed
            for (let i = 0; i < 10; i++) {
                try {
                    rateLimiter.check('burstMethod');
                    results.push(true);
                } catch {
                    results.push(false);
                }
            }

            // Next requests should fail
            for (let i = 0; i < 5; i++) {
                try {
                    rateLimiter.check('burstMethod');
                    results.push(true);
                } catch {
                    results.push(false);
                }
            }

            const successCount = results.filter((r) => r).length;
            expect(successCount).toBe(10);
        });
    });

    describe('Memory Safety', () => {
        it('should limit stored request history', () => {
            const limiter = new RateLimiter({
                maxRequests: 1000,
                windowMs: 60000,
                maxHistorySize: 100,
            });

            // Make many requests
            for (let i = 0; i < 200; i++) {
                try {
                    limiter.check(`method${i % 10}`);
                } catch {
                    // Ignore rate limit errors
                }
            }

            // Trigger cleanup
            limiter.cleanup();

            const historySize = limiter.getHistorySize();
            expect(historySize).toBeLessThanOrEqual(100);
        });

        it('should cleanup old entries', async () => {
            const limiter = new RateLimiter({
                maxRequests: 100,
                windowMs: 100,
            });

            for (let i = 0; i < 10; i++) {
                limiter.check('testMethod');
            }

            const sizeBefore = limiter.getHistorySize();

            await new Promise((resolve) => setTimeout(resolve, 150));
            limiter.cleanup();

            const sizeAfter = limiter.getHistorySize();
            expect(sizeAfter).toBeLessThan(sizeBefore);
        });
    });
});
