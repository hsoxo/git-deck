import type { RPCRequest, RPCResponse } from '@git-gui/shared';
import { logger } from '../utils/Logger';
import { ErrorHandler } from '../utils/ErrorHandler';
import { RateLimiter } from './RateLimiter';
import { RPCValidator, type MethodSchema } from './RPCValidator';

type RPCHandler = (...args: any[]) => Promise<any> | any;

export interface RPCServerOptions {
    enableRateLimit?: boolean;
    enableValidation?: boolean;
    rateLimitConfig?: { maxRequests: number; windowMs: number };
}

export class RPCServer {
    private handlers = new Map<string, RPCHandler>();
    private rateLimiter: RateLimiter;
    private validator: RPCValidator;
    private options: Required<RPCServerOptions>;

    constructor(options: RPCServerOptions = {}) {
        this.options = {
            enableRateLimit: options.enableRateLimit ?? true,
            enableValidation: options.enableValidation ?? true,
            rateLimitConfig: options.rateLimitConfig ?? { maxRequests: 100, windowMs: 60000 },
        };

        this.rateLimiter = new RateLimiter(this.options.rateLimitConfig);
        this.validator = new RPCValidator();
    }

    register(method: string, handler: RPCHandler, schema?: MethodSchema): void {
        if (!method || method.trim() === '') {
            throw new Error('Invalid method name');
        }

        if (typeof handler !== 'function') {
            throw new Error('Handler must be a function');
        }

        if (this.handlers.has(method)) {
            throw new Error('Method already registered');
        }

        this.handlers.set(method, handler);

        if (schema && this.options.enableValidation) {
            this.validator.register(method, schema);
        }

        logger.debug(`Registered RPC handler: ${method}`);
    }

    private validateRequest(request: RPCRequest): void {
        if (!request.method || typeof request.method !== 'string') {
            throw new Error('Invalid RPC request: method is required');
        }

        if (request.id === undefined || request.id === null) {
            throw new Error('Invalid RPC request: id is required');
        }

        if (!Array.isArray(request.params)) {
            throw new Error('Invalid RPC request: params must be an array');
        }
    }

    private sanitizeError(error: unknown): string {
        const errorStr = ErrorHandler.formatGitError(error);

        // Remove sensitive information
        return errorStr
            .replace(/\/home\/[^/]+/g, '/home/<user>')
            .replace(/\/Users\/[^/]+/g, '/Users/<user>')
            .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\<user>')
            .replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, '<ip-address>')
            .replace(/[a-f0-9]{32,}/gi, '<hash>');
    }

    async handleRequest(
        request: RPCRequest,
        postMessage: (response: RPCResponse) => void
    ): Promise<void> {
        try {
            this.validateRequest(request);
            const response = await this.handle(request);

            // Sanitize errors before sending
            if (response.error) {
                response.error = this.sanitizeError(response.error);
            }

            postMessage(response);
        } catch (error) {
            postMessage({
                id: request.id,
                error: this.sanitizeError(error),
            });
        }
    }

    async handle(request: RPCRequest): Promise<RPCResponse> {
        const { id, method, params } = request;
        logger.debug(`RPC call: ${method}`, params);

        // Rate limiting check
        if (this.options.enableRateLimit) {
            try {
                this.rateLimiter.check(method);
            } catch (error) {
                const errorMsg = `Rate limit exceeded for ${method}`;
                logger.warn(errorMsg);
                return { id, error: errorMsg };
            }
        }

        const handler = this.handlers.get(method);

        if (!handler) {
            const error = `Unknown method: ${method}`;
            logger.error(error);
            return { id, error };
        }

        try {
            // Parameter validation
            if (this.options.enableValidation) {
                this.validator.validate(method, params);
            }

            logger.time(`RPC ${method}`);
            const result = await handler(...params);
            logger.timeEnd(`RPC ${method}`);
            logger.debug(`RPC result: ${method}`, result);

            return { id, result };
        } catch (error) {
            logger.error(`RPC error: ${method}`, error);
            const errorMessage = ErrorHandler.formatGitError(error);

            return {
                id,
                error: errorMessage,
            };
        }
    }

    getRateLimitStats(method: string): { count: number; limit: number } {
        return this.rateLimiter.getStats(method);
    }

    resetRateLimit(method?: string): void {
        this.rateLimiter.reset(method);
    }
}
