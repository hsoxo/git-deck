import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RPCServer } from './RPCServer';
import type { RPCRequest } from '@git-gui/shared';

describe('RPCServer', () => {
    let server: RPCServer;

    beforeEach(() => {
        server = new RPCServer();
    });

    describe('register and handle', () => {
        it('should register and call handler', async () => {
            const handler = vi.fn().mockResolvedValue('result');
            server.register('test', handler);

            const request: RPCRequest = { id: 1, method: 'test', params: ['arg1', 'arg2'] };
            const response = await server.handle(request);

            expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
            expect(response).toEqual({ id: 1, result: 'result' });
        });

        it('should return error for unknown method', async () => {
            const request: RPCRequest = { id: 1, method: 'unknown', params: [] };
            const response = await server.handle(request);

            expect(response).toEqual({ id: 1, error: 'Unknown method: unknown' });
        });

        it('should handle handler errors', async () => {
            const handler = vi.fn().mockRejectedValue(new Error('Test error'));
            server.register('test', handler);

            const request: RPCRequest = { id: 1, method: 'test', params: [] };
            const response = await server.handle(request);

            expect(response.id).toBe(1);
            expect(response.error).toContain('Test error');
        });
    });

    describe('rate limiting', () => {
        it('should enforce rate limits', async () => {
            const limitedServer = new RPCServer({
                enableRateLimit: true,
                rateLimitConfig: { maxRequests: 2, windowMs: 1000 },
            });

            const handler = vi.fn().mockResolvedValue('ok');
            limitedServer.register('test', handler);

            const request: RPCRequest = { id: 1, method: 'test', params: [] };

            // First two requests should succeed
            let response = await limitedServer.handle(request);
            expect(response.result).toBe('ok');

            response = await limitedServer.handle(request);
            expect(response.result).toBe('ok');

            // Third request should be rate limited
            response = await limitedServer.handle(request);
            expect(response.error).toContain('Rate limit exceeded');
        });

        it('should allow disabling rate limiting', async () => {
            const noLimitServer = new RPCServer({ enableRateLimit: false });
            const handler = vi.fn().mockResolvedValue('ok');
            noLimitServer.register('test', handler);

            const request: RPCRequest = { id: 1, method: 'test', params: [] };

            // Should allow many requests
            for (let i = 0; i < 200; i++) {
                const response = await noLimitServer.handle(request);
                expect(response.result).toBe('ok');
            }
        });

        it('should reset rate limits', async () => {
            const limitedServer = new RPCServer({
                enableRateLimit: true,
                rateLimitConfig: { maxRequests: 1, windowMs: 1000 },
            });

            const handler = vi.fn().mockResolvedValue('ok');
            limitedServer.register('test', handler);

            const request: RPCRequest = { id: 1, method: 'test', params: [] };

            await limitedServer.handle(request);
            let response = await limitedServer.handle(request);
            expect(response.error).toContain('Rate limit exceeded');

            limitedServer.resetRateLimit('test');
            response = await limitedServer.handle(request);
            expect(response.result).toBe('ok');
        });
    });

    describe('parameter validation', () => {
        it('should validate parameters with schema', async () => {
            const handler = vi.fn().mockResolvedValue('ok');
            server.register('test', handler, {
                params: [
                    { type: 'string', required: true },
                    { type: 'number', required: true },
                ],
            });

            // Valid parameters
            let request: RPCRequest = { id: 1, method: 'test', params: ['hello', 42] };
            let response = await server.handle(request);
            expect(response.result).toBe('ok');

            // Invalid parameters
            request = { id: 2, method: 'test', params: ['hello', 'not a number'] };
            response = await server.handle(request);
            expect(response.error).toContain('expected number');
        });

        it('should allow disabling validation', async () => {
            const noValidationServer = new RPCServer({ enableValidation: false });
            const handler = vi.fn().mockResolvedValue('ok');

            noValidationServer.register('test', handler, {
                params: [{ type: 'string', required: true }],
            });

            // Should allow invalid parameters when validation is disabled
            const request: RPCRequest = { id: 1, method: 'test', params: [123] };
            const response = await noValidationServer.handle(request);
            expect(response.result).toBe('ok');
        });

        it('should validate complex schemas', async () => {
            const handler = vi.fn().mockResolvedValue('ok');
            server.register('test', handler, {
                params: [
                    {
                        type: 'object',
                        properties: {
                            name: { type: 'string', required: true, minLength: 1 },
                            age: { type: 'number', required: false, min: 0 },
                        },
                    },
                ],
            });

            // Valid object
            let request: RPCRequest = {
                id: 1,
                method: 'test',
                params: [{ name: 'John', age: 30 }],
            };
            let response = await server.handle(request);
            expect(response.result).toBe('ok');

            // Missing required property
            request = { id: 2, method: 'test', params: [{ age: 30 }] };
            response = await server.handle(request);
            expect(response.error).toContain('name is required');

            // Invalid property type
            request = { id: 3, method: 'test', params: [{ name: 'John', age: 'thirty' }] };
            response = await server.handle(request);
            expect(response.error).toContain('expected number');
        });
    });

    describe('getRateLimitStats', () => {
        it('should return rate limit stats', async () => {
            const handler = vi.fn().mockResolvedValue('ok');
            server.register('test', handler);

            const request: RPCRequest = { id: 1, method: 'test', params: [] };
            await server.handle(request);
            await server.handle(request);

            const stats = server.getRateLimitStats('test');
            expect(stats.count).toBe(2);
            expect(stats.limit).toBe(100);
        });
    });
});
