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
});
