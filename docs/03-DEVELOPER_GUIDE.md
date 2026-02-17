# 开发者指南

完整的开发环境设置、开发工作流、贡献指南和部署说明。

## 贡献指南

感谢你对本项目的关注！我们欢迎各种形式的贡献。

### 行为准则

在所有互动中保持尊重、包容和专业。

### 分支命名规范

- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档更新
- `test/` - 测试相关
- `refactor/` - 代码重构
- `chore/` - 维护任务

示例：`feature/add-merge-operation`

### Commit 规范

使用 Conventional Commits：

```
type(scope): description

feat(stage): add drag and drop support
fix(rebase): handle conflict detection
docs(readme): update installation guide
test(git): add integration tests
refactor(store): simplify state management
```

类型：`feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `style`

## 环境准备

### 系统要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- VS Code >= 1.80.0
- Git >= 2.20.0

### 验证环境

```bash
node -v        # >= 18.0.0
npm -v         # >= 9.0.0
git --version  # >= 2.20.0
code --version # >= 1.80.0
```

### 安装依赖

```bash
# Fork 并克隆仓库
git clone https://github.com/yourusername/git-gui-vscode.git
cd git-gui-vscode

# 安装依赖
npm install

# 构建项目
npm run build
```

## 开发工作流

### 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

### 启动开发模式

打开两个终端：

```bash
# Terminal 1 - Extension (watch mode)
npm run dev:extension

# Terminal 2 - Webview (hot reload)
npm run dev:webview
```

然后在 VS Code 中按 `F5` 启动 Extension Development Host。

### 热重载

- Extension: 修改代码后按 `Ctrl+R` (Windows/Linux) 或 `Cmd+R` (macOS)
- Webview: Vite 自动热重载

## 项目结构

```
git-gui-vscode/
├── packages/
│   ├── extension/      # VS Code Extension (Backend)
│   │   ├── src/
│   │   │   ├── git/           # Git operations
│   │   │   ├── rpc/           # RPC server
│   │   │   ├── webview/       # Webview providers
│   │   │   └── views/         # Tree views
│   │   └── package.json
│   ├── webview/        # React UI (Frontend)
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── store/         # Zustand state
│   │   │   └── services/      # RPC client
│   │   └── package.json
│   └── shared/         # Shared types
│       └── src/types.ts
└── docs/              # Documentation
```

## 添加新功能

### 1. 后端 (Extension)

```typescript
// packages/extension/src/git/operations/NewOperation.ts
export class NewOperation {
    constructor(private git: SimpleGit) {}
    
    async doSomething(): Promise<void> {
        // 实现逻辑
    }
}

// 注册 RPC 处理器
this.rpcServer.register('git.doSomething', () => 
    this.newOps.doSomething()
);
```

### 2. 前端 (Webview)

```typescript
// packages/webview/src/store/gitStore.ts
doSomething: async () => {
    await rpcClient.call('git.doSomething');
}

// packages/webview/src/components/MyComponent.tsx
const { doSomething } = useGitStore();
<button onClick={doSomething}>Do Something</button>
```

### 3. 添加测试

```typescript
// packages/extension/src/git/operations/NewOperation.test.ts
describe('NewOperation', () => {
    it('should do something', async () => {
        // 测试逻辑
    });
});
```

## 测试

### 运行测试

```bash
# 所有测试
npm test

# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# Watch 模式
npm test -- --watch

# 生成覆盖率
npm test -- --coverage
```

### 测试要求

提交 PR 前：
- [ ] 所有测试通过
- [ ] 新功能有测试
- [ ] 测试覆盖率达标（Extension 70%+, Webview 60%+）

### 编写测试

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('MyFeature', () => {
    it('should work', async () => {
        const mockGit = { add: vi.fn() } as any;
        // 测试逻辑
        expect(mockGit.add).toHaveBeenCalled();
    });
});
```

## 代码规范

### Linting 和格式化

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix

# 格式化代码
npm run format

# 检查格式
npm run format:check
```

### TypeScript 规范

- 使用 TypeScript strict mode
- 优先使用 interface 而非 type
- 函数使用显式返回类型
- 避免使用 `any`

### React 规范

- 使用函数组件和 Hooks
- 保持组件小而专注
- 使用有意义的组件和 prop 名称
- 提取可复用逻辑到自定义 hooks

### 命名规范

- 组件: PascalCase (`StagePanel.tsx`)
- 文件: 组件用 PascalCase，工具用 camelCase
- 函数: camelCase (`stageFiles`)
- 常量: UPPER_SNAKE_CASE (`MAX_COMMITS`)
- 类型/接口: PascalCase (`GitStatus`)

## 调试

### 调试 Extension

1. 在代码中设置断点
2. 按 `F5` 启动调试
3. 断点会在 Extension Host 中触发

### 调试 Webview

1. 在 Extension Host 窗口中右键 webview
2. 选择 "Inspect Element"
3. 使用 Chrome DevTools 调试

## 提交 Pull Request

### PR 检查清单

- [ ] 分支与 main 同步
- [ ] 所有测试通过
- [ ] 代码符合规范
- [ ] 文档已更新
- [ ] Commit 消息符合规范
- [ ] PR 描述清晰

### PR 描述模板

```markdown
## 描述

简要描述更改内容

## 更改类型

- [ ] Bug 修复
- [ ] 新功能
- [ ] 破坏性更改
- [ ] 文档更新

## 测试

如何测试这些更改？

## 截图（如适用）

UI 更改请添加截图

## 检查清单

- [ ] 测试通过
- [ ] 文档已更新
- [ ] 无破坏性更改（或已记录）
```

### 审查流程

1. 自动检查运行（测试、构建）
2. 维护者代码审查
3. 处理反馈
4. 批准并合并

## 构建和打包

### 构建项目

```bash
# 构建所有包
npm run build

# 构建特定包
npm run build --workspace=packages/extension
npm run build --workspace=packages/webview
```

### 打包为 VSIX

```bash
# 安装 vsce
npm install -g @vscode/vsce

# 打包
cd packages/extension
vsce package
```

生成的 VSIX 文件位于 `packages/extension/git-gui-0.1.0.vsix`

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
npm version patch  # 0.1.0 -> 0.1.1
npm version minor  # 0.1.0 -> 0.2.0
npm version major  # 0.1.0 -> 1.0.0
```

### 3. 发布

```bash
# 打包
npm run package

# 发布到 Marketplace
vsce publish
```

### 发布检查清单

- [ ] 所有测试通过
- [ ] Linter 通过
- [ ] 构建成功
- [ ] 版本号已更新
- [ ] CHANGELOG.md 已更新
- [ ] 在本地测试 VSIX

## 性能优化

### 减少 Git 调用

```typescript
// ✅ 好: 批量获取
const [status, branches, log] = await Promise.all([
    git.status(),
    git.branch(),
    git.log()
]);
```

### 防抖高频操作

```typescript
const debouncedRefresh = debounce(() => {
    fetchStatus();
}, 300);
```

## 常见问题

### Extension 没有加载

检查 Output > Extension Host 中的错误信息，重新构建并重载窗口。

### Webview 显示空白

确保 webview 已构建：`npm run build --workspace=packages/webview`

### 测试失败

先构建所有包：`npm run build && npm test`

### 类型错误

重新构建 shared 包并重启 TypeScript 服务器。

## Remote-SSH 开发

扩展完全支持 Remote-SSH：

1. 连接到远程服务器
2. 打开远程 Git 仓库
3. 扩展自动安装到远程
4. 所有 Git 操作在远程执行

配置已包含 `extensionKind: ["workspace"]`，无需额外设置。

## 文档更新

### 何时更新文档

- 新功能 → 更新 README 和相关文档
- API 更改 → 更新开发者文档
- 破坏性更改 → 更新 CHANGELOG.md
- Bug 修复 → 更新 CHANGELOG.md

### 文档风格

- 使用清晰简洁的语言
- 包含代码示例
- UI 功能添加截图
- 保持文档更新

## 贡献者认可

贡献者将在以下位置获得认可：
- README.md 贡献者部分
- 发布说明
- GitHub 贡献者页面

## 资源链接

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [simple-git Documentation](https://github.com/steveukx/git-js)
- [React Documentation](https://react.dev/)
- [Vitest Documentation](https://vitest.dev/)

## 获取帮助

- 查看文档: `docs/` 目录
- 提交 Issue: GitHub Issues
- 查看示例: `tests/` 目录
- GitHub Discussions: 问题和讨论

## 许可证

通过贡献，你同意你的贡献将在 MIT 许可证下授权。

---

感谢你的贡献！🎉
