import type { RPCRequest, RPCResponse } from '@git-gui/shared';

declare const acquireVsCodeApi: () => any;

class RPCClient {
    private vscode: any;
    private requestId = 0;
    private pending = new Map<
        number,
        { resolve: (value: any) => void; reject: (error: any) => void }
    >();
    private requestCache = new Map<string, { result: any; timestamp: number }>();
    private readonly CACHE_TTL = 1000; // 1 second cache
    private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

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
                return cached.result;
            }
        }

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
                    if (this.isReadOnlyMethod(method)) {
                        const cacheKey = this.getCacheKey(method, params);
                        this.requestCache.set(cacheKey, {
                            result: value,
                            timestamp: Date.now(),
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
        return `${method}:${JSON.stringify(params)}`;
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
