# 项目优化和打磨计划

## 概述

基于全面的代码审查,本文档列出了项目的优化和改进计划。优先级分为 P0 (关键)、P1 (高)、P2 (中)、P3 (低)。

**审查日期**: 2026-02-15  
**当前状态**: Phase 6 完成, 86% 进度  
**测试覆盖**: Extension 75.6%, Webview 15.36%

---

## 一、安全问题 (P0 - 关键)

### 1.1 输入验证缺失 ⚠️

**问题描述:**
- StageOperations: 文件路径未验证直接传给 git
- RebaseOperations: commit message 可能包含特殊字符导致命令注入
- BranchOperations: 分支名未验证
- 无路径遍历保护 (../ 或绝对路径)

**影响**: 高 - 可能导致命令注入或路径遍历攻击

**解决方案:**
```typescript
// 创建输入验证工具类
export class InputValidator {
    static validateFilePath(path: string): boolean {
        // 检查路径遍历
        if (path.includes('..') || path.startsWith('/')) {
            throw new Error('Invalid file path');
        }
        return true;
    }
    
    static validateBranchName(name: string): boolean {
        // Git 分支名规则
        const validPattern = /^[a-zA-Z0-9/_-]+$/;
        if (!validPattern.test(name)) {
            throw new Error('Invalid branch name');
        }
        return true;
    }
    
    static sanitizeCommitMessage(message: string): string {
        // 转义特殊字符
        return message.replace(/[`$\\]/g, '\\$&');
    }
}
```

**工作量**: 2-3 天  
**优先级**: P0

### 1.2 RPC 安全问题 ⚠️

**问题描述:**
- RPCServer 无认证机制
- 无速率限制
- 参数未验证
- 任何代码可注册 RPC 处理器

**影响**: 中 - 恶意 webview 可能滥用 RPC

**解决方案:**
```typescript
// 添加速率限制
export class RateLimiter {
    private requests = new Map<string, number[]>();
    private readonly limit = 100; // 每分钟最多 100 次
    
    check(method: string): boolean {
        const now = Date.now();
        const requests = this.requests.get(method) || [];
        
        // 清理 1 分钟前的请求
        const recent = requests.filter(t => now - t < 60000);
        
        if (recent.length >= this.limit) {
            throw new Error(`Rate limit exceeded for ${method}`);
        }
        
        recent.push(now);
        this.requests.set(method, recent);
        return true;
    }
}

// 添加参数验证
export class RPCValidator {
    private schemas = new Map<string, any>();
    
    register(method: string, schema: any): void {
        this.schemas.set(method, schema);
    }
    
    validate(method: string, params: any[]): boolean {
        const schema = this.schemas.get(method);
        if (!schema) return true;
        
        // 使用 zod 或其他验证库
        return schema.parse(params);
    }
}
```

**工作量**: 3-4 天  
**优先级**: P0

---

## 二、代码质量问题 (P1 - 高)

### 2.1 RebaseOperations 交互式 Rebase 实现 🔧

**问题描述:**
- TODO 文件写入方式不可靠
- 存在竞态条件
- 文件系统操作无同步
- getRebaseProgress() 静默返回 null

**影响**: 中 - 交互式 rebase 可能失败

**解决方案:**
```typescript
// 使用 GIT_SEQUENCE_EDITOR 环境变量
async interactiveRebase(onto: string, commits: RebaseCommit[]): Promise<void> {
    const todoContent = this.createRebaseTodo(commits);
    const todoFile = path.join(os.tmpdir(), `rebase-todo-${Date.now()}`);
    
    fs.writeFileSync(todoFile, todoContent);
    
    // 设置环境变量
    const env = {
        ...process.env,
        GIT_SEQUENCE_EDITOR: `cat ${todoFile} >`
    };
    
    await this.git.env(env).rebase(['-i', onto]);
    
    // 清理临时文件
    fs.unlinkSync(todoFile);
}
```

**工作量**: 2-3 天  
**优先级**: P1

### 2.2 ErrorHandler 改进 🔧

**问题描述:**
- 基于正则的错误检测脆弱
- 丢失错误上下文 (堆栈跟踪)
- 无错误分类代码
- 通用错误消息

**解决方案:**
```typescript
export enum GitErrorCode {
    CONFLICT = 'CONFLICT',
    NOT_FOUND = 'NOT_FOUND',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    UNKNOWN = 'UNKNOWN'
}

export class GitError extends Error {
    constructor(
        public code: GitErrorCode,
        message: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'GitError';
    }
}

export class ErrorHandler {
    static parseGitError(error: unknown): GitError {
        if (error instanceof Error) {
            const message = error.message;
            
            if (message.includes('CONFLICT')) {
                return new GitError(
                    GitErrorCode.CONFLICT,
                    'Merge conflict detected',
                    error
                );
            }
            
            // ... 其他错误类型
        }
        
        return new GitError(GitErrorCode.UNKNOWN, String(error));
    }
}
```

**工作量**: 2 天  
**优先级**: P1

### 2.3 RPC Client 内存泄漏 🐛

**问题描述:**
- 超时触发时未清理 pending handlers
- 缓存键可能冲突
- 无请求去重

**解决方案:**
```typescript
async call(method: string, ...params: any[]): Promise<any> {
    const id = ++this.requestId;
    const request: RPCRequest = { id, method, params };
    
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            // 清理 pending
            this.pending.delete(id);
            reject(new Error(`RPC timeout: ${method}`));
        }, this.REQUEST_TIMEOUT);
        
        this.pending.set(id, {
            resolve: (value: any) => {
                clearTimeout(timeoutId);
                this.pending.delete(id);  // 确保清理
                resolve(value);
            },
            reject: (error: any) => {
                clearTimeout(timeoutId);
                this.pending.delete(id);  // 确保清理
                reject(error);
            }
        });
        
        this.vscode.postMessage(request);
    });
}
```

**工作量**: 1 天  
**优先级**: P1

---

## 三、性能优化 (P1 - 高)

### 3.1 GraphLayoutEngine 算法优化 ⚡

**问题描述:**
- buildChildrenMap() 有 O(n²) 复杂度
- 无记忆化
- 泳道分配未优化
- 所有节点都计算即使不可见

**解决方案:**
```typescript
export class GraphLayoutEngine {
    private layoutCache = new Map<string, LayoutResult>();
    
    layout(commits: CommitNode[]): LayoutResult {
        // 检查缓存
        const cacheKey = this.getCacheKey(commits);
        if (this.layoutCache.has(cacheKey)) {
            return this.layoutCache.get(cacheKey)!;
        }
        
        // O(n) 构建子节点映射
        const childrenMap = this.buildChildrenMapOptimized(commits);
        
        // 优化的泳道分配
        const lanes = this.assignLanesOptimized(commits, childrenMap);
        
        const result = this.calculatePositions(commits, lanes);
        
        // 缓存结果
        this.layoutCache.set(cacheKey, result);
        
        return result;
    }
    
    private buildChildrenMapOptimized(commits: CommitNode[]): Map<string, CommitNode[]> {
        const map = new Map<string, CommitNode[]>();
        
        // 单次遍历
        for (const commit of commits) {
            for (const parent of commit.parents) {
                if (!map.has(parent)) {
                    map.set(parent, []);
                }
                map.get(parent)!.push(commit);
            }
        }
        
        return map;
    }
}
```

**工作量**: 3-4 天  
**优先级**: P1

### 3.2 RPC 请求优化 ⚡

**问题描述:**
- 无请求批处理
- 缓存无限增长
- JSON.stringify 阻塞线程

**解决方案:**
```typescript
export class RPCClient {
    private batchQueue: RPCRequest[] = [];
    private batchTimer: NodeJS.Timeout | null = null;
    private readonly BATCH_DELAY = 10; // 10ms
    private readonly MAX_CACHE_SIZE = 100;
    
    async call(method: string, ...params: any[]): Promise<any> {
        // 批处理请求
        return new Promise((resolve, reject) => {
            const id = ++this.requestId;
            const request = { id, method, params };
            
            this.pending.set(id, { resolve, reject });
            this.batchQueue.push(request);
            
            if (!this.batchTimer) {
                this.batchTimer = setTimeout(() => {
                    this.flushBatch();
                }, this.BATCH_DELAY);
            }
        });
    }
    
    private flushBatch(): void {
        if (this.batchQueue.length === 0) return;
        
        // 发送批量请求
        this.vscode.postMessage({
            type: 'batch',
            requests: this.batchQueue
        });
        
        this.batchQueue = [];
        this.batchTimer = null;
    }
    
    private evictCache(): void {
        if (this.requestCache.size > this.MAX_CACHE_SIZE) {
            // LRU 淘汰
            const oldest = this.requestCache.keys().next().value;
            this.requestCache.delete(oldest);
        }
    }
}
```

**工作量**: 2-3 天  
**优先级**: P1

---

## 四、架构改进 (P2 - 中)

### 4.1 GitGuiViewProvider 拆分 🏗️

**问题描述:**
- 200+ 行代码
- 职责过多 (webview 生命周期 + RPC 注册 + 操作初始化)
- 难以测试

**解决方案:**
```typescript
// 拆分为多个类
export class GitGuiViewProvider {
    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly operationRegistry: OperationRegistry,
        private readonly rpcRegistry: RPCRegistry
    ) {}
    
    resolveWebviewView(webviewView: vscode.WebviewView): void {
        // 只负责 webview 生命周期
    }
}

export class OperationRegistry {
    private operations = new Map<string, any>();
    
    register(name: string, operation: any): void {
        this.operations.set(name, operation);
    }
    
    get(name: string): any {
        return this.operations.get(name);
    }
}

export class RPCRegistry {
    constructor(
        private rpcServer: RPCServer,
        private operations: OperationRegistry
    ) {}
    
    registerAll(): void {
        // 注册所有 RPC 处理器
    }
}
```

**工作量**: 3-4 天  
**优先级**: P2

### 4.2 错误恢复机制 🔄

**问题描述:**
- 无重试逻辑
- 多步操作失败无回滚
- 瞬态错误导致操作失败

**解决方案:**
```typescript
export class RetryPolicy {
    async execute<T>(
        fn: () => Promise<T>,
        options: {
            maxRetries: number;
            backoff: 'exponential' | 'linear';
            retryableErrors: string[];
        }
    ): Promise<T> {
        let lastError: Error;
        
        for (let i = 0; i <= options.maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error as Error;
                
                if (!this.isRetryable(error, options.retryableErrors)) {
                    throw error;
                }
                
                if (i < options.maxRetries) {
                    const delay = this.calculateDelay(i, options.backoff);
                    await this.sleep(delay);
                }
            }
        }
        
        throw lastError!;
    }
}
```

**工作量**: 2-3 天  
**优先级**: P2

---

## 五、测试改进 (P2 - 中)

### 5.1 提升 Webview 测试覆盖率 🧪

**当前状态**: 15.36%  
**目标**: 60%+

**计划:**
1. 为所有 UI 组件添加测试
2. 测试用户交互流程
3. 测试错误场景
4. 测试边界条件

**工作量**: 5-7 天  
**优先级**: P2

### 5.2 添加安全测试 🔒

**缺失测试:**
- 输入验证测试
- 命令注入测试
- 路径遍历测试
- RPC 安全测试

**示例:**
```typescript
describe('Security Tests', () => {
    it('should reject path traversal attempts', () => {
        expect(() => {
            InputValidator.validateFilePath('../../../etc/passwd');
        }).toThrow('Invalid file path');
    });
    
    it('should sanitize commit messages', () => {
        const malicious = 'test`rm -rf /`';
        const sanitized = InputValidator.sanitizeCommitMessage(malicious);
        expect(sanitized).not.toContain('`');
    });
});
```

**工作量**: 3-4 天  
**优先级**: P2

### 5.3 性能测试 ⏱️

**缺失测试:**
- 大型仓库测试 (10,000+ commits)
- 内存使用测试
- 渲染性能测试
- RPC 性能测试

**工作量**: 2-3 天  
**优先级**: P2

---

## 六、用户体验改进 (P3 - 低)

### 6.1 加载状态优化 ⏳

**改进点:**
- 添加骨架屏
- 优化加载动画
- 显示进度百分比
- 添加取消按钮

**工作量**: 2-3 天  
**优先级**: P3

### 6.2 错误提示改进 💬

**改进点:**
- 更友好的错误消息
- 提供解决建议
- 添加帮助链接
- 错误分类展示

**工作量**: 2-3 天  
**优先级**: P3

### 6.3 键盘快捷键 ⌨️

**改进点:**
- 添加全局快捷键
- 支持 Vim 模式
- 快捷键自定义
- 快捷键提示

**工作量**: 3-4 天  
**优先级**: P3

---

## 七、文档完善 (P2 - 中)

### 7.1 API 文档 📚

**需要添加:**
- RPC 方法文档
- Git 操作类文档
- 组件 Props 文档
- Store Actions 文档

**工作量**: 2-3 天  
**优先级**: P2

### 7.2 用户文档 📖

**需要添加:**
- 功能使用指南
- 常见问题 FAQ
- 故障排除指南
- 视频教程

**工作量**: 3-4 天  
**优先级**: P2

---

## 八、实施计划

### Sprint 1 (2 周) - 安全和关键问题

**目标**: 修复所有 P0 问题

- [ ] 添加输入验证 (3 天)
- [ ] RPC 安全加固 (4 天)
- [ ] 修复内存泄漏 (1 天)
- [ ] 修复 Interactive Rebase (3 天)
- [ ] 安全测试 (3 天)

### Sprint 2 (2 周) - 性能和代码质量

**目标**: 完成所有 P1 问题

- [ ] GraphLayoutEngine 优化 (4 天)
- [ ] RPC 请求优化 (3 天)
- [ ] ErrorHandler 改进 (2 天)
- [ ] 性能测试 (3 天)
- [ ] 代码审查和重构 (2 天)

### Sprint 3 (2 周) - 架构和测试

**目标**: 完成主要 P2 问题

- [ ] GitGuiViewProvider 拆分 (4 天)
- [ ] 错误恢复机制 (3 天)
- [ ] Webview 测试覆盖 (5 天)
- [ ] API 文档 (2 天)

### Sprint 4 (1 周) - 用户体验和文档

**目标**: 完成 P3 和剩余 P2

- [ ] 加载状态优化 (2 天)
- [ ] 错误提示改进 (2 天)
- [ ] 用户文档 (3 天)

---

## 九、成功指标

### 代码质量

- [ ] 无 P0 安全问题
- [ ] 无 P1 代码质量问题
- [ ] Extension 测试覆盖 > 80%
- [ ] Webview 测试覆盖 > 60%

### 性能

- [ ] 10,000 commits 加载 < 3s
- [ ] 渲染帧率 > 55 FPS
- [ ] 内存使用 < 200MB
- [ ] RPC 响应 < 100ms

### 用户体验

- [ ] 所有操作有加载状态
- [ ] 所有错误有友好提示
- [ ] 支持键盘快捷键
- [ ] 完整的用户文档

---

## 十、风险评估

### 高风险

- **安全问题**: 可能导致严重漏洞
- **性能问题**: 影响大型仓库使用
- **架构重构**: 可能引入新 bug

### 中风险

- **测试覆盖**: 需要大量时间
- **文档编写**: 需要持续维护

### 低风险

- **用户体验**: 渐进式改进
- **代码优化**: 可逐步进行

---

## 总结

本优化计划涵盖了安全、性能、代码质量、架构、测试和用户体验等多个方面。

**总工作量**: 约 8 周  
**关键路径**: 安全问题 → 性能优化 → 测试覆盖  
**预期收益**: 更安全、更快、更稳定的产品

建议按优先级顺序实施,先解决 P0 和 P1 问题,再逐步完成 P2 和 P3 改进。
