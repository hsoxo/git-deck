import * as vscode from 'vscode';

/**
 * 日志工具 - 输出到 VS Code Output 面板
 */
export class Logger {
    private static instance: Logger;
    private prefix = '[Git GUI]';
    private debugMode = process.env.NODE_ENV === 'development';
    private outputChannel: vscode.OutputChannel | null = null;
    private timers = new Map<string, number>();

    private constructor() { }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * 初始化 Output Channel
     */
    initialize(outputChannel: vscode.OutputChannel): void {
        this.outputChannel = outputChannel;
        this.info('Logger initialized with VS Code Output Channel');
    }

    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
        this.info(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    private formatMessage(level: string, message: string, ...args: any[]): string {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const argsStr = args.length > 0 ? ' ' + args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') : '';
        return `[${timestamp}] ${this.prefix} [${level}] ${message}${argsStr}`;
    }

    private log(level: string, message: string, ...args: any[]): void {
        const formattedMessage = this.formatMessage(level, message, ...args);

        // 输出到 console（用于开发调试）
        console.log(formattedMessage);

        // 输出到 VS Code Output Channel
        if (this.outputChannel) {
            this.outputChannel.appendLine(formattedMessage);
        }
    }

    debug(message: string, ...args: any[]): void {
        if (this.debugMode) {
            this.log('DEBUG', message, ...args);
        }
    }

    info(message: string, ...args: any[]): void {
        this.log('INFO', message, ...args);
    }

    warn(message: string, ...args: any[]): void {
        this.log('WARN', message, ...args);
    }

    error(message: string, error?: unknown, ...args: any[]): void {
        const errorDetails = error instanceof Error
            ? `${error.message}\n${error.stack}`
            : String(error);
        this.log('ERROR', message, errorDetails, ...args);
    }

    time(label: string): void {
        if (this.debugMode) {
            this.timers.set(label, Date.now());
            this.debug(`Timer started: ${label}`);
        }
    }

    timeEnd(label: string): void {
        if (this.debugMode) {
            const startTime = this.timers.get(label);
            if (startTime) {
                const duration = Date.now() - startTime;
                this.debug(`Timer ended: ${label} - ${duration}ms`);
                this.timers.delete(label);
            }
        }
    }

    /**
     * 显示 Output Channel
     */
    show(): void {
        if (this.outputChannel) {
            this.outputChannel.show(true);
        }
    }
}

export const logger = Logger.getInstance();
