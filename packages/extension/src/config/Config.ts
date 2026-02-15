import * as vscode from 'vscode';

/**
 * 扩展配置管理
 */
export class Config {
    private static readonly SECTION = 'gitGui';

    /**
     * 获取配置值
     */
    static get<T>(key: string, defaultValue: T): T {
        const config = vscode.workspace.getConfiguration(this.SECTION);
        return config.get<T>(key, defaultValue);
    }

    /**
     * 设置配置值
     */
    static async set(key: string, value: any, target?: vscode.ConfigurationTarget): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.SECTION);
        await config.update(key, value, target);
    }

    /**
     * 获取日志级别
     */
    static getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
        return this.get('logLevel', 'info');
    }

    /**
     * 获取最大日志条数
     */
    static getMaxLogCount(): number {
        return this.get('maxLogCount', 100);
    }

    /**
     * 获取是否启用缓存
     */
    static isCacheEnabled(): boolean {
        return this.get('enableCache', true);
    }

    /**
     * 获取缓存TTL（毫秒）
     */
    static getCacheTTL(): number {
        return this.get('cacheTTL', 1000);
    }

    /**
     * 获取RPC超时时间（毫秒）
     */
    static getRPCTimeout(): number {
        return this.get('rpcTimeout', 30000);
    }

    /**
     * 获取是否自动刷新
     */
    static isAutoRefreshEnabled(): boolean {
        return this.get('autoRefresh', true);
    }

    /**
     * 获取自动刷新间隔（毫秒）
     */
    static getAutoRefreshInterval(): number {
        return this.get('autoRefreshInterval', 5000);
    }
}
