import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('rpcClient', () => {
    const mockVsCodeApi = {
        postMessage: vi.fn(),
    };

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        (globalThis as any).acquireVsCodeApi = () => mockVsCodeApi;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('cleans up pending handlers on success', async () => {
        const { rpcClient } = await import('./rpcClient');

        const promise = rpcClient.call('test.method', 'arg1');
        const id = mockVsCodeApi.postMessage.mock.calls[0][0].id;

        window.dispatchEvent(
            new MessageEvent('message', {
                data: { id, result: 'ok' },
            })
        );

        await expect(promise).resolves.toBe('ok');
        expect((rpcClient as any).pending.size).toBe(0);
    });

    it('cleans up pending handlers on error', async () => {
        const { rpcClient } = await import('./rpcClient');

        const promise = rpcClient.call('test.method', 'arg1');
        const id = mockVsCodeApi.postMessage.mock.calls[0][0].id;

        window.dispatchEvent(
            new MessageEvent('message', {
                data: { id, error: 'boom' },
            })
        );

        await expect(promise).rejects.toThrow('boom');
        expect((rpcClient as any).pending.size).toBe(0);
    });

    it('cleans up pending handlers on timeout', async () => {
        vi.useFakeTimers();
        const { rpcClient } = await import('./rpcClient');

        const promise = rpcClient.call('test.timeout');
        vi.advanceTimersByTime(30000);

        await expect(promise).rejects.toThrow('RPC timeout: test.timeout');
        expect((rpcClient as any).pending.size).toBe(0);
    });

    it('returns cached value for read-only methods within TTL', async () => {
        const { rpcClient } = await import('./rpcClient');

        const p1 = rpcClient.call('git.getStatus');
        const id1 = mockVsCodeApi.postMessage.mock.calls[0][0].id;
        window.dispatchEvent(
            new MessageEvent('message', { data: { id: id1, result: { files: [] } } })
        );
        await expect(p1).resolves.toEqual({ files: [] });

        const p2 = rpcClient.call('git.getStatus');
        await expect(p2).resolves.toEqual({ files: [] });

        expect(mockVsCodeApi.postMessage).toHaveBeenCalledTimes(1);
    });

    it('deduplicates concurrent identical read-only requests', async () => {
        const { rpcClient } = await import('./rpcClient');

        // Clear cache first
        rpcClient.clearCache();

        // Make two concurrent identical requests
        const p1 = rpcClient.call('git.getStatus');
        const p2 = rpcClient.call('git.getStatus');

        // Should only send one request
        expect(mockVsCodeApi.postMessage).toHaveBeenCalledTimes(1);

        const id = mockVsCodeApi.postMessage.mock.calls[0][0].id;
        window.dispatchEvent(
            new MessageEvent('message', { data: { id, result: { files: [] } } })
        );

        await expect(p1).resolves.toEqual({ files: [] });
        await expect(p2).resolves.toEqual({ files: [] });
    });

    it('evicts least frequently used cache entry when cache is full', async () => {
        const { rpcClient } = await import('./rpcClient');
        const MAX_CACHE_SIZE = (rpcClient as any).MAX_CACHE_SIZE;

        // Fill cache to max
        for (let i = 0; i < MAX_CACHE_SIZE; i++) {
            const promise = rpcClient.call('git.getStatus', i);
            const id = mockVsCodeApi.postMessage.mock.calls[i][0].id;
            window.dispatchEvent(
                new MessageEvent('message', { data: { id, result: { files: [i] } } })
            );
            await promise;
        }

        expect((rpcClient as any).requestCache.size).toBe(MAX_CACHE_SIZE);

        // Access first entry multiple times to increase its access count
        await rpcClient.call('git.getStatus', 0);
        await rpcClient.call('git.getStatus', 0);

        // Add one more entry, should evict least frequently used
        const promise = rpcClient.call('git.getStatus', MAX_CACHE_SIZE);
        const id = mockVsCodeApi.postMessage.mock.calls[MAX_CACHE_SIZE][0].id;
        window.dispatchEvent(
            new MessageEvent('message', { data: { id, result: { files: [MAX_CACHE_SIZE] } } })
        );
        await promise;

        // Cache size should still be at max
        expect((rpcClient as any).requestCache.size).toBe(MAX_CACHE_SIZE);

        // First entry (most frequently used) should still be in cache
        const cacheKey0 = (rpcClient as any).getCacheKey('git.getStatus', [0]);
        expect((rpcClient as any).requestCache.has(cacheKey0)).toBe(true);
    });

    it('uses stable stringify for cache keys', async () => {
        const { rpcClient } = await import('./rpcClient');

        // Objects with same content but different key order should have same cache key
        const key1 = (rpcClient as any).getCacheKey('test', [{ a: 1, b: 2 }]);
        const key2 = (rpcClient as any).getCacheKey('test', [{ b: 2, a: 1 }]);

        expect(key1).toBe(key2);
    });

    it('does not deduplicate write operations', async () => {
        const { rpcClient } = await import('./rpcClient');

        // Make two concurrent write requests
        const p1 = rpcClient.call('git.commit', 'message1');
        const p2 = rpcClient.call('git.commit', 'message1');

        // Should send two separate requests
        expect(mockVsCodeApi.postMessage).toHaveBeenCalledTimes(2);

        const id1 = mockVsCodeApi.postMessage.mock.calls[0][0].id;
        const id2 = mockVsCodeApi.postMessage.mock.calls[1][0].id;

        window.dispatchEvent(new MessageEvent('message', { data: { id: id1, result: 'ok1' } }));
        window.dispatchEvent(new MessageEvent('message', { data: { id: id2, result: 'ok2' } }));

        await expect(p1).resolves.toBe('ok1');
        await expect(p2).resolves.toBe('ok2');
    });
});
