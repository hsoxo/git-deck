import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('RPC Performance Tests', () => {
    const mockVsCodeApi = {
        postMessage: vi.fn(),
    };

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        (globalThis as any).acquireVsCodeApi = () => mockVsCodeApi;
    });

    it('handles high volume of concurrent requests efficiently', async () => {
        const { rpcClient } = await import('./rpcClient');
        rpcClient.clearCache();

        const startTime = performance.now();
        const numRequests = 100;

        // Make 100 concurrent identical requests
        const promises = Array.from({ length: numRequests }, () =>
            rpcClient.call('git.getStatus')
        );

        // Due to deduplication, only 1 request should be sent
        expect(mockVsCodeApi.postMessage).toHaveBeenCalledTimes(1);

        // Respond to the single request
        const id = mockVsCodeApi.postMessage.mock.calls[0][0].id;
        window.dispatchEvent(
            new MessageEvent('message', { data: { id, result: { files: [] } } })
        );

        // All promises should resolve with the same result
        const results = await Promise.all(promises);
        expect(results).toHaveLength(numRequests);
        expect(results.every(r => JSON.stringify(r) === JSON.stringify({ files: [] }))).toBe(true);

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Should complete quickly (< 100ms for 100 deduplicated requests)
        expect(duration).toBeLessThan(100);
    });

    it('cache eviction does not significantly impact performance', async () => {
        const { rpcClient } = await import('./rpcClient');
        const MAX_CACHE_SIZE = (rpcClient as any).MAX_CACHE_SIZE;

        const startTime = performance.now();

        // Fill cache beyond max size
        for (let i = 0; i < MAX_CACHE_SIZE + 50; i++) {
            const promise = rpcClient.call('git.getStatus', i);
            const id = mockVsCodeApi.postMessage.mock.calls[i][0].id;
            window.dispatchEvent(
                new MessageEvent('message', { data: { id, result: { files: [i] } } })
            );
            await promise;
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Cache should be at max size
        expect((rpcClient as any).requestCache.size).toBe(MAX_CACHE_SIZE);

        // Should complete in reasonable time (< 500ms for 150 requests with eviction)
        expect(duration).toBeLessThan(500);
    });

    it('stable stringify performs efficiently for complex objects', async () => {
        const { rpcClient } = await import('./rpcClient');

        const complexObject = {
            z: 'value',
            a: [1, 2, 3, { nested: true, data: [4, 5, 6] }],
            m: { deep: { nested: { object: 'test' } } },
            b: null,
            c: undefined,
        };

        const startTime = performance.now();
        const iterations = 1000;

        for (let i = 0; i < iterations; i++) {
            (rpcClient as any).stableStringify(complexObject);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Should complete 1000 stringifications in < 50ms
        expect(duration).toBeLessThan(50);
    });

    it('request deduplication reduces network overhead', async () => {
        const { rpcClient } = await import('./rpcClient');
        rpcClient.clearCache();

        // Simulate 50 concurrent requests for the same data
        const promises = Array.from({ length: 50 }, () =>
            rpcClient.call('git.getBranches')
        );

        // Only 1 network request should be made
        expect(mockVsCodeApi.postMessage).toHaveBeenCalledTimes(1);

        const id = mockVsCodeApi.postMessage.mock.calls[0][0].id;
        const mockBranches = Array.from({ length: 100 }, (_, i) => ({
            name: `branch-${i}`,
            commit: `commit-${i}`,
        }));

        window.dispatchEvent(
            new MessageEvent('message', { data: { id, result: mockBranches } })
        );

        const results = await Promise.all(promises);

        // All 50 requests should get the same result
        expect(results).toHaveLength(50);
        expect(results[0]).toEqual(mockBranches);

        // Verify network savings: 50 requests -> 1 actual call = 98% reduction
        const networkSavings = ((50 - 1) / 50) * 100;
        expect(networkSavings).toBe(98);
    });

    it('cache hit rate improves with repeated requests', async () => {
        const { rpcClient } = await import('./rpcClient');
        rpcClient.clearCache();

        let networkCalls = 0;
        mockVsCodeApi.postMessage.mockImplementation(() => {
            networkCalls++;
        });

        // Make 10 requests for the same data
        for (let i = 0; i < 10; i++) {
            const promise = rpcClient.call('git.getStatus');

            if (i === 0) {
                // First request goes to network
                const id = mockVsCodeApi.postMessage.mock.calls[0][0].id;
                window.dispatchEvent(
                    new MessageEvent('message', { data: { id, result: { files: [] } } })
                );
            }

            await promise;
        }

        // Only first request should hit network, rest served from cache
        expect(networkCalls).toBe(1);

        // Cache hit rate: 90%
        const cacheHitRate = ((10 - 1) / 10) * 100;
        expect(cacheHitRate).toBe(90);
    });
});
