/**
 * 简单的日志工具
 */
export class Logger {
    private static instance: Logger;
    private prefix = '[Git GUI]';
    private debugMode = process.env.NODE_ENV === 'development';

    private constructor() {}

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }

    debug(message: string, ...args: any[]): void {
        if (this.debugMode) {
            console.log(`${this.prefix} [DEBUG]`, message, ...args);
        }
    }

    info(message: string, ...args: any[]): void {
        console.log(`${this.prefix} [INFO]`, message, ...args);
    }

    warn(message: string, ...args: any[]): void {
        console.warn(`${this.prefix} [WARN]`, message, ...args);
    }

    error(message: string, error?: unknown, ...args: any[]): void {
        console.error(`${this.prefix} [ERROR]`, message, error, ...args);
    }

    time(label: string): void {
        if (this.debugMode) {
            console.time(`${this.prefix} ${label}`);
        }
    }

    timeEnd(label: string): void {
        if (this.debugMode) {
            console.timeEnd(`${this.prefix} ${label}`);
        }
    }
}

export const logger = Logger.getInstance();
