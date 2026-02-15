import type { RPCRequest, RPCResponse } from '@git-gui/shared';
import { logger } from '../utils/Logger';
import { ErrorHandler } from '../utils/ErrorHandler';

type RPCHandler = (...args: any[]) => Promise<any> | any;

export class RPCServer {
    private handlers = new Map<string, RPCHandler>();

    register(method: string, handler: RPCHandler): void {
        this.handlers.set(method, handler);
        logger.debug(`Registered RPC handler: ${method}`);
    }

    async handle(request: RPCRequest): Promise<RPCResponse> {
        const { id, method, params } = request;
        logger.debug(`RPC call: ${method}`, params);

        const handler = this.handlers.get(method);

        if (!handler) {
            const error = `Unknown method: ${method}`;
            logger.error(error);
            return { id, error };
        }

        try {
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
}
