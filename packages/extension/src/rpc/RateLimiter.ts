import { logger } from '../utils/Logger';

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    timeout?: number;
    maxHistorySize?: number;
}

export class RateLimiter {
    private requests = new Map<string, number[]>();
    private readonly config: RateLimitConfig;

    constructor(config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }) {
        this.config = {
            ...config,
            timeout: config.timeout || 30000,
            maxHistorySize: config.maxHistorySize || 1000,
        };
    }

    check(method: string): boolean {
        const now = Date.now();
        const requests = this.requests.get(method) || [];

        // Clean up old requests outside the time window
        const recent = requests.filter((t) => now - t < this.config.windowMs);

        if (recent.length >= this.config.maxRequests) {
            logger.warn(
                `Rate limit exceeded for ${method}: ${recent.length}/${this.config.maxRequests}`
            );
            throw new Error(`Rate limit exceeded for ${method}`);
        }

        recent.push(now);
        this.requests.set(method, recent);
        return true;
    }

    async executeWithTimeout<T>(method: string, fn: () => Promise<T>): Promise<T> {
        return Promise.race([
            fn(),
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('Operation timeout')), this.config.timeout)
            ),
        ]);
    }

    reset(method?: string): void {
        if (method) {
            this.requests.delete(method);
        } else {
            this.requests.clear();
        }
    }

    getStats(method: string): { count: number; limit: number } {
        const now = Date.now();
        const requests = this.requests.get(method) || [];
        const recent = requests.filter((t) => now - t < this.config.windowMs);

        return {
            count: recent.length,
            limit: this.config.maxRequests,
        };
    }

    getHistorySize(): number {
        let total = 0;
        for (const requests of this.requests.values()) {
            total += requests.length;
        }
        return total;
    }

    cleanup(): void {
        const now = Date.now();
        for (const [method, requests] of this.requests.entries()) {
            const recent = requests.filter((t) => now - t < this.config.windowMs);
            if (recent.length === 0) {
                this.requests.delete(method);
            } else {
                this.requests.set(method, recent);
            }
        }

        // Enforce max history size
        if (this.getHistorySize() > this.config.maxHistorySize!) {
            // Remove oldest entries
            const allEntries = Array.from(this.requests.entries());
            allEntries.sort((a, b) => {
                const aOldest = Math.min(...a[1]);
                const bOldest = Math.min(...b[1]);
                return aOldest - bOldest;
            });

            while (this.getHistorySize() > this.config.maxHistorySize!) {
                const [method] = allEntries.shift()!;
                this.requests.delete(method);
            }
        }
    }
}
