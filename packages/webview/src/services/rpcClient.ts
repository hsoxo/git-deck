import type { RPCRequest, RPCResponse } from '@git-gui/shared';

declare const acquireVsCodeApi: () => any;

class RPCClient {
    private vscode: any;
    private requestId = 0;
    private pending = new Map<
        number,
        { resolve: (value: any) => void; reject: (error: any) => void }
    >();
    private requestCache = new Map<
        string,
        { result: any; timestamp: number; accessCount: number }
    >();
    private readonly CACHE_TTL = 1000; // 1 second cache
    private readonly MAX_CACHE_SIZE = 100; // Max cache entries
    private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
    private inflightRequests = new Map<string, Promise<any>>(); // Request deduplication

    constructor() {
        if (typeof acquireVsCodeApi !== 'undefined') {
            this.vscode = acquireVsCodeApi();
            window.addEventListener('message', this.handleMessage.bind(this));
        }
    }

    async call(method: string, ...params: any[]): Promise<any> {
        if (!this.vscode) {
            throw new Error('VS Code API not available');
        }

        // Check cache for read-only operations
        if (this.isReadOnlyMethod(method)) {
            const cacheKey = this.getCacheKey(method, params);
            const cached = this.requestCache.get(cacheKey);

            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                cached.accessCount++;
                return cached.result;
            }

            // Request deduplication: merge concurrent identical requests
            const inflightKey = cacheKey;
            if (this.inflightRequests.has(inflightKey)) {
                return this.inflightRequests.get(inflightKey)!;
            }

            const promise = this.executeRequest(method, params, cacheKey);
            this.inflightRequests.set(inflightKey, promise);

            try {
                const result = await promise;
                return result;
            } finally {
                this.inflightRequests.delete(inflightKey);
            }
        }

        return this.executeRequest(method, params);
    }

    private async executeRequest(method: string, params: any[], cacheKey?: string): Promise<any> {
        const id = ++this.requestId;
        const request: RPCRequest = { id, method, params };

        return new Promise((resolve, reject) => {
            // Timeout handling
            const timeoutId = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`RPC timeout: ${method}`));
            }, this.REQUEST_TIMEOUT);

            this.pending.set(id, {
                resolve: (value: any) => {
                    clearTimeout(timeoutId);
                    this.pending.delete(id);

                    // Cache result for read-only operations
                    if (cacheKey && this.isReadOnlyMethod(method)) {
                        this.evictCacheIfNeeded();
                        this.requestCache.set(cacheKey, {
                            result: value,
                            timestamp: Date.now(),
                            accessCount: 1,
                        });
                    }

                    resolve(value);
                },
                reject: (error: any) => {
                    clearTimeout(timeoutId);
                    this.pending.delete(id);
                    reject(error);
                },
            });

            this.vscode.postMessage(request);
        });
    }

    /**
     * Clear cache for specific method or all cache
     */
    clearCache(method?: string): void {
        if (method) {
            for (const key of this.requestCache.keys()) {
                if (key.startsWith(method)) {
                    this.requestCache.delete(key);
                }
            }
        } else {
            this.requestCache.clear();
        }
    }

    /**
     * Evict cache entries using LFU (Least Frequently Used) strategy
     */
    private evictCacheIfNeeded(): void {
        if (this.requestCache.size >= this.MAX_CACHE_SIZE) {
            // Find least frequently used entry
            let minAccessCount = Infinity;
            let leastUsedKey: string | null = null;

            for (const [key, entry] of this.requestCache.entries()) {
                if (entry.accessCount < minAccessCount) {
                    minAccessCount = entry.accessCount;
                    leastUsedKey = key;
                }
            }

            if (leastUsedKey) {
                this.requestCache.delete(leastUsedKey);
            }
        }
    }

    private isReadOnlyMethod(method: string): boolean {
        return (
            method.startsWith('git.get') ||
            method.startsWith('git.list') ||
            method === 'git.getStatus' ||
            method === 'git.getLog' ||
            method === 'git.getBranches'
        );
    }

    private getCacheKey(method: string, params: any[]): string {
        // Optimize JSON serialization: use stable stringify for cache key
        return `${method}:${this.stableStringify(params)}`;
    }

    /**
     * Stable JSON stringify to avoid redundant serialization
     * Caches stringified params to reduce repeated stringify calls
     */
    private stableStringify(obj: any): string {
        if (obj === null || obj === undefined) {
            return String(obj);
        }
        if (typeof obj !== 'object') {
            return String(obj);
        }
        if (Array.isArray(obj)) {
            return `[${obj.map((item) => this.stableStringify(item)).join(',')}]`;
        }
        // Sort keys for stable output
        const keys = Object.keys(obj).sort();
        const pairs = keys.map((k) => `"${k}":${this.stableStringify(obj[k])}`);
        return `{${pairs.join(',')}}`;
    }

    private handleMessage(event: MessageEvent) {
        const response: RPCResponse = event.data;

        if (!response.id) {
            // This is a notification message
            return;
        }

        const pending = this.pending.get(response.id);
        if (!pending) {
            return;
        }

        if (response.error) {
            pending.reject(new Error(response.error));
        } else {
            pending.resolve(response.result);
        }

        this.pending.delete(response.id);
    }
}

export const rpcClient = new RPCClient();
