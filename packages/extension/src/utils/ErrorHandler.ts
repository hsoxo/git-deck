/**
 * 统一的错误处理工具
 */
export class ErrorHandler {
    /**
     * 格式化 Git 错误消息
     */
    static formatGitError(error: unknown): string {
        if (error instanceof Error) {
            const message = error.message;

            // 提取有用的错误信息
            if (message.includes('fatal:')) {
                const match = message.match(/fatal: (.+)/);
                return match ? match[1] : message;
            }

            if (message.includes('error:')) {
                const match = message.match(/error: (.+)/);
                return match ? match[1] : message;
            }

            return message;
        }

        return String(error);
    }

    /**
     * 判断是否是冲突错误
     */
    static isConflictError(error: unknown): boolean {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            return (
                message.includes('conflict') ||
                message.includes('merge') ||
                message.includes('rebase')
            );
        }
        return false;
    }

    /**
     * 判断是否是网络错误
     */
    static isNetworkError(error: unknown): boolean {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            return (
                message.includes('network') ||
                message.includes('timeout') ||
                message.includes('connection')
            );
        }
        return false;
    }

    /**
     * 创建用户友好的错误消息
     */
    static createUserMessage(error: unknown, operation: string): string {
        const formattedError = this.formatGitError(error);

        if (this.isConflictError(error)) {
            return `${operation} failed due to conflicts. Please resolve conflicts and try again.`;
        }

        if (this.isNetworkError(error)) {
            return `${operation} failed due to network issues. Please check your connection and try again.`;
        }

        return `${operation} failed: ${formattedError}`;
    }
}
