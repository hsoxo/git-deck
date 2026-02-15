# 开发者手册

## 环境准备

### 系统要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **VS Code**: >= 1.80.0
- **Git**: >= 2.20.0
- **操作系统**: Windows, macOS, Linux

### 安装依赖

```bash
# 克隆仓库
git clone <repository-url>
cd git-gui-vscode

# 安装依赖 (所有 packages)
npm install
```

## 开发环境配置

### 1. 构建项目

```bash
# 构建所有包
npm run build

# 构建特定包
npm run build --workspace=packages/extension
npm run build --workspace=packages/webview
npm run build --workspace=packages/shared
```

### 2. 启动开发模式

**方式一: Watch 模式 (推荐)**

打开两个终端:

```bash
# Terminal 1 - Extension
npm run dev:extension

# Terminal 2 - Webview  
npm run dev:webview
```

**方式二: VS Code 调试**

1. 按 `F5` 或 Run > Start Debugging
2. 新的 VS Code 窗口会打开 (Extension Host)
3. 在新窗口中打开一个 Git 仓库
4. 侧边栏找到 "Git GUI" 视图

### 3. 热重载

- **Extension**: 修改代码后按 `Ctrl+R` (Windows/Linux) 或 `Cmd+R` (macOS) 重载
- **Webview**: Vite 自动热重载,无需手动刷新

## 项目结构

```
git-gui-vscode/
├── packages/
│   ├── extension/          # VS Code Extension (后端)
│   │   ├── src/
│   │   │   ├── extension.ts
│   │   │   ├── git/        # Git 操作
│   │   │   ├── rpc/        # RPC 服务器
│   │   │   ├── webview/    # Webview 提供者
│   │   │   └── utils/      # 工具类
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   └── vitest.config.ts
│   ├── webview/            # React UI (前端)
│   │   ├── src/
│   │   │   ├── components/ # React 组件
│   │   │   ├── store/      # Zustand stores
│   │   │   ├── services/   # RPC 客户端
│   │   │   └── utils/      # 工具函数
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── vitest.config.ts
│   └── shared/             # 共享类型
│       ├── src/
│       │   └── types.ts
│       ├── package.json
│       └── tsconfig.json
├── tests/
│   ├── integration/        # 集成测试
│   └── e2e/               # E2E 测试
├── docs/                  # 文档
├── package.json           # Root package.json
└── README.md
```

## 开发工作流

### 添加新功能

1. **后端 (Extension)**

```typescript
// packages/extension/src/git/operations/NewOperation.ts
export class NewOperation {
    constructor(private git: SimpleGit) {}
    
    async doSomething(): Promise<void> {
        // 实现逻辑
    }
}

// 注册 RPC 处理器
// packages/extension/src/webview/GitGuiViewProvider.ts
this.rpcServer.register('git.doSomething', () => 
    this.newOps.doSomething()
);
```

2. **前端 (Webview)**

```typescript
// packages/webview/src/store/gitStore.ts
doSomething: async () => {
    await rpcClient.call('git.doSomething');
    // 更新状态
}

// packages/webview/src/components/MyComponent.tsx
const { doSomething } = useGitStore();
<button onClick={doSomething}>Do Something</button>
```

3. **添加测试**

```typescript
// packages/extension/src/git/operations/NewOperation.test.ts
describe('NewOperation', () => {
    it('should do something', async () => {
        // 测试逻辑
    });
});
```

### 修改现有功能

1. 找到对应的文件
2. 修改代码
3. 更新测试
4. 运行测试确保通过
5. 手动测试功能

## 测试

### 运行测试

```bash
# 所有测试
npm test

# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# E2E 测试
npm run test:e2e

# 特定包的测试
npm test --workspace=packages/extension
npm test --workspace=packages/webview

# Watch 模式
npm test -- --watch

# 生成覆盖率报告
npm test -- --coverage
```

### 查看覆盖率报告

```bash
# 生成 HTML 报告
npm test -- --coverage

# 打开报告
open packages/extension/coverage/index.html
open packages/webview/coverage/index.html
```

### 编写测试

**单元测试示例:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { StageOperations } from './StageOperations';

describe('StageOperations', () => {
    it('should stage files', async () => {
        const mockGit = { add: vi.fn() } as any;
        const ops = new StageOperations(mockGit);
        
        await ops.stage(['file.ts']);
        
        expect(mockGit.add).toHaveBeenCalledWith(['file.ts']);
    });
});
```

**集成测试示例:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Git Operations Integration', () => {
    let testRepoPath: string;
    let git: SimpleGit;
    
    beforeEach(async () => {
        testRepoPath = path.join(os.tmpdir(), `test-${Date.now()}`);
        fs.mkdirSync(testRepoPath);
        git = simpleGit(testRepoPath);
        await git.init();
    });
    
    afterEach(() => {
        fs.rmSync(testRepoPath, { recursive: true });
    });
    
    it('should stage and commit', async () => {
        fs.writeFileSync(path.join(testRepoPath, 'test.txt'), 'content');
        await git.add('test.txt');
        await git.commit('Test commit');
        
        const log = await git.log();
        expect(log.latest?.message).toBe('Test commit');
    });
});
```

## 调试

### 调试 Extension

1. 在代码中设置断点
2. 按 `F5` 启动调试
3. 断点会在 Extension Host 中触发
4. 使用 Debug Console 查看变量

### 调试 Webview

1. 在 Extension Host 窗口中右键 webview
2. 选择 "Inspect Element"
3. 使用 Chrome DevTools 调试
4. 在 Sources 面板设置断点

### 调试测试

**VS Code Launch Configuration:**

```json
{
    "type": "node",
    "request": "launch",
    "name": "Debug Tests",
    "runtimeExecutable": "npm",
    "runtimeArgs": ["test", "--", "--run"],
    "console": "integratedTerminal"
}
```

### 查看日志

- **Extension 日志**: Output > Extension Host
- **Webview 日志**: Webview DevTools Console
- **Git 命令日志**: Logger.debug() 输出

## 代码规范

### Linting

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix
```

### 格式化

```bash
# 格式化代码
npm run format

# 检查格式
npm run format:check
```

### TypeScript

```bash
# 类型检查
npm run build

# 特定包
npm run build --workspace=packages/extension
```

### Commit 规范

使用 Conventional Commits:

```
type(scope): description

[optional body]

[optional footer]
```

**类型:**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `test`: 测试相关
- `refactor`: 代码重构
- `chore`: 构建/工具相关

**示例:**
```
feat(stage): add drag and drop support
fix(rebase): handle conflict detection correctly
docs(readme): update installation instructions
```

## 包管理

### 添加依赖

```bash
# Extension
npm install <package> --workspace=packages/extension

# Webview
npm install <package> --workspace=packages/webview

# Shared
npm install <package> --workspace=packages/shared

# 开发依赖
npm install -D <package> --workspace=packages/extension
```

### 更新依赖

```bash
# 检查更新
npm outdated

# 更新所有
npm update

# 更新特定包
npm update <package> --workspace=<workspace>
```

### 注意事项

- 使用精确版本号 (无 ^ 或 ~)
- 在 .npmrc 中配置: `save-exact=true`
- 更新依赖后运行测试

## 常见问题

### Q: Extension 没有加载?

**A:** 检查 Output > Extension Host 中的错误信息

```bash
# 重新构建
npm run build

# 重新加载窗口
Ctrl+R (Windows/Linux) 或 Cmd+R (macOS)
```

### Q: Webview 显示空白?

**A:** 确保 webview 已构建

```bash
npm run build --workspace=packages/webview
# 或
npm run dev:webview
```

### Q: 测试失败?

**A:** 先构建所有包

```bash
npm run build
npm test
```

### Q: 类型错误?

**A:** 重新构建 shared 包

```bash
npm run build --workspace=packages/shared

# 重启 TypeScript 服务器
Ctrl+Shift+P > "TypeScript: Restart TS Server"
```

### Q: Git 操作失败?

**A:** 检查 Git 版本和仓库状态

```bash
git --version  # 应该 >= 2.20.0
git status     # 检查仓库状态
```

### Q: RPC 通信失败?

**A:** 检查 RPC 注册和调用

```typescript
// Extension: 确保已注册
this.rpcServer.register('git.method', handler);

// Webview: 确保方法名正确
await rpcClient.call('git.method', params);
```

## 性能优化建议

### 1. 减少 Git 调用

```typescript
// ❌ 不好: 多次调用
const status = await git.status();
const branches = await git.branch();
const log = await git.log();

// ✅ 好: 批量获取
const [status, branches, log] = await Promise.all([
    git.status(),
    git.branch(),
    git.log()
]);
```

### 2. 使用缓存

```typescript
// RPC 客户端自动缓存只读操作
// 无需手动实现
```

### 3. 防抖高频操作

```typescript
const debouncedRefresh = debounce(() => {
    fetchStatus();
    fetchHistory();
}, 300);
```

### 4. 虚拟滚动

```typescript
// 使用 VirtualScroll 组件
<VirtualScroll
    items={commits}
    itemHeight={50}
    renderItem={(commit) => <CommitRow commit={commit} />}
/>
```

## 发布流程

### 1. 准备发布

```bash
# 运行所有测试
npm test

# 检查代码质量
npm run lint
npm run format:check

# 构建生产版本
npm run build
```

### 2. 更新版本

```bash
# 更新版本号
npm version patch  # 0.1.0 -> 0.1.1
npm version minor  # 0.1.0 -> 0.2.0
npm version major  # 0.1.0 -> 1.0.0
```

### 3. 打包发布

```bash
# 打包
npm run package

# 发布到 Marketplace
vsce publish
```

## 开发技巧

### 1. 快速重载

- Extension: `Ctrl+R` / `Cmd+R`
- Webview: 自动热重载

### 2. 快速测试

```bash
# 运行单个测试文件
npm test -- path/to/test.ts

# 运行匹配的测试
npm test -- -t "test name"
```

### 3. 调试技巧

- 使用 `logger.debug()` 输出调试信息
- 使用 `logger.time()` / `logger.timeEnd()` 测量性能
- 使用 Chrome DevTools 调试 Webview

### 4. 代码片段

VS Code 中创建代码片段加速开发:

```json
{
    "Git Operation": {
        "prefix": "gitop",
        "body": [
            "export class ${1:Operation}Operations {",
            "    constructor(private git: SimpleGit) {}",
            "    ",
            "    async ${2:method}(): Promise<void> {",
            "        logger.debug('${2:method}');",
            "        await this.git.${3:command}();",
            "    }",
            "}"
        ]
    }
}
```

## 资源链接

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [simple-git Documentation](https://github.com/steveukx/git-js)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Vitest Documentation](https://vitest.dev/)

## 获取帮助

- 查看文档: `docs/` 目录
- 提交 Issue: GitHub Issues
- 查看示例: `tests/` 目录
- 阅读源码: 代码中有详细注释

---

Happy Coding! 🚀
