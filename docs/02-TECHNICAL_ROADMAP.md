# 技术实现路线图

## 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     VS Code Extension                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐         ┌──────────────────────┐      │
│  │  Extension Host │◄────────┤   Webview (React)    │      │
│  │   (Node.js)     │   RPC   │                      │      │
│  │  ┌───────────┐  │         │  ┌────────────────┐  │      │
│  │  │ Git Core  │  │         │  │  UI Components │  │      │
│  │  │ (simple-  │  │         │  │  - History     │  │      │
│  │  │  git)     │  │         │  │  - Graph       │  │      │
│  │  └───────────┘  │         │  │  - Stage       │  │      │
│  │  ┌───────────┐  │         │  │  - Operations  │  │      │
│  │  │ Services  │◄─┼─────────┤  └────────────────┘  │      │
│  │  │ Layer     │  │         │  ┌────────────────┐  │      │
│  │  └───────────┘  │         │  │  State Manager │  │      │
│  └─────────────────┘         │  │  (Zustand)     │  │      │
│                               │  └────────────────┘  │      │
└─────────────────────────────────────────────────────────────┘
```

## 技术选型

| 层级 | 技术 | 版本 | 理由 |
|------|------|------|------|
| Extension 框架 | VS Code Extension API | 1.80+ | 官方标准 |
| Git 操作 | simple-git | 3.27.0 | 成熟、API 完整 |
| UI 框架 | React | 18.3.1 | 生态成熟、类型安全 |
| 状态管理 | Zustand | 5.0.2 | 轻量、简单、性能好 |
| 图形渲染 | Canvas API | - | 性能优于 SVG |
| 通信协议 | JSON-RPC | - | 标准、易调试 |
| 构建工具 | Vite + tsup | 5.0.11 / 8.0.1 | 快速、现代化 |
| 测试框架 | Vitest | 1.2.0 | 与 Vite 集成好 |

## 核心模块

### 1. Extension Host (后端)

**目录结构:**
```
packages/extension/src/
├── extension.ts              # 入口文件
├── git/
│   ├── GitService.ts         # Git 操作核心服务
│   ├── LogParser.ts          # 解析 git log
│   └── operations/           # Git 操作类
│       ├── StageOperations.ts
│       ├── RebaseOperations.ts
│       ├── CherryPickOperations.ts
│       ├── StashOperations.ts
│       ├── RevertOperations.ts
│       ├── DiffOperations.ts
│       ├── LogOperations.ts
│       └── BranchOperations.ts
├── rpc/
│   └── RPCServer.ts          # RPC 服务端
├── webview/
│   └── GitGuiViewProvider.ts # Webview 管理
└── utils/
    ├── ErrorHandler.ts       # 错误处理
    └── Logger.ts             # 日志系统
```

### 2. Webview (前端)

**目录结构:**
```
packages/webview/src/
├── App.tsx
├── components/
│   ├── Stage/                # 暂存区组件
│   ├── History/              # 历史记录组件
│   ├── Operations/           # 操作对话框
│   ├── Branch/               # 分支管理
│   └── Diff/                 # Diff 查看器
├── store/
│   └── gitStore.ts           # Zustand 状态管理
├── services/
│   ├── rpcClient.ts          # RPC 客户端
│   └── GraphLayoutEngine.ts  # 图形布局引擎
└── utils/
    └── CanvasRenderer.ts     # Canvas 渲染器
```

### 3. Shared Types

**目录结构:**
```
packages/shared/src/
├── index.ts
└── types.ts                  # 共享类型定义
```

## 通信协议

### RPC 消息格式

```typescript
// Request
{
  id: number,
  method: string,
  params: any[]
}

// Response
{
  id: number,
  result?: any,
  error?: string
}
```

### 通信流程示例

```
Webview                    Extension
  │                            │
  ├─ call('git.stageFiles') ──>│
  │                            ├─ StageOperations.stage()
  │                            ├─ git add files
  │<── result ─────────────────┤
  │                            │
  ├─ fetchStatus() ────────────>│
  │                            ├─ GitService.getStatus()
  │<── status ─────────────────┤
  │                            │
```

## 性能优化策略

### 1. 大型仓库优化

- **分页加载**: 每次加载 100 commits
- **虚拟滚动**: 只渲染可见区域
- **增量加载**: 滚动到底部自动加载更多
- **请求缓存**: RPC 客户端缓存只读操作 (1秒 TTL)

### 2. 渲染优化

- **Canvas 渲染**: 高性能图形绘制
- **高 DPI 支持**: devicePixelRatio 适配
- **防抖优化**: 文件监听防抖 300ms
- **O(n) 布局算法**: 智能泳道分配

### 3. 状态同步

- **文件监听**: chokidar 监听 .git 目录
- **轮询备份**: 5秒轮询确保同步
- **防抖刷新**: 避免频繁更新

## 错误处理机制

### 统一错误处理

```typescript
// ErrorHandler 工具类
- formatGitError()      // 格式化 Git 错误
- isConflictError()     // 判断冲突错误
- isNetworkError()      // 判断网络错误
- createUserMessage()   // 创建用户友好消息
```

### 错误分类

- **Git 错误**: fatal, error, conflict
- **网络错误**: timeout, connection refused
- **文件系统错误**: ENOENT, EACCES
- **用户错误**: 无效输入、权限不足

## 日志系统

### Logger 功能

```typescript
- debug()    // 调试信息 (仅开发模式)
- info()     // 一般信息
- warn()     // 警告信息
- error()    // 错误信息
- time()     // 性能计时开始
- timeEnd()  // 性能计时结束
```

### 日志级别

- **Development**: 所有日志
- **Production**: info, warn, error

## 测试策略

### 测试覆盖目标

- **Extension**: 70%+ (已达成 75.6%)
- **Webview**: 60%+ (当前 15.36%)
- **核心逻辑**: 90%+

### 测试类型

1. **单元测试** (Vitest)
   - Git 操作类
   - 工具函数
   - Store actions

2. **集成测试** (Vitest)
   - 真实 Git 仓库操作
   - 完整操作流程
   - 冲突处理

3. **E2E 测试** (Mocha)
   - Extension 激活
   - 命令注册
   - Webview 通信

## 构建流程

### 开发模式

```bash
# Extension watch
npm run dev:extension

# Webview dev server
npm run dev:webview
```

### 生产构建

```bash
# 构建所有包
npm run build

# 打包 extension
npm run package
```

### 构建产物

- **Extension**: ~60 KB (tsup 打包)
- **Webview**: ~175 KB (Vite 打包)
- **Shared**: < 1 KB

## 发布流程

### 1. 版本管理

- 使用语义化版本 (Semantic Versioning)
- 更新 CHANGELOG.md
- 创建 Git tag

### 2. 打包发布

```bash
# 安装 vsce
npm install -g @vscode/vsce

# 打包
vsce package

# 发布到 Marketplace
vsce publish
```

### 3. 发布检查清单

- [ ] 所有测试通过
- [ ] 代码审查完成
- [ ] 文档更新
- [ ] 版本号更新
- [ ] CHANGELOG 更新
- [ ] 截图和演示准备

## 技术债务

### 已知限制

1. **Interactive Rebase**: TODO 文件写入方式需要改进
2. **远程分支**: 不支持删除远程分支
3. **Webview 测试**: 覆盖率较低 (15.36%)
4. **GraphLayoutEngine**: 可进一步优化算法

### 未来改进

1. **性能**: Web Worker 处理布局计算
2. **功能**: GitHub/GitLab 集成
3. **测试**: 提升 Webview 测试覆盖率
4. **国际化**: 多语言支持

## 兼容性

### 系统要求

- **VS Code**: >= 1.80.0
- **Node.js**: >= 18.0.0
- **Git**: >= 2.20.0
- **操作系统**: Windows, macOS, Linux

### 浏览器兼容性

- Webview 基于 Chromium
- 支持现代 JavaScript 特性
- Canvas API 支持

## 安全考虑

### 当前实现

- 使用 VS Code Git 凭证管理
- 不存储敏感信息
- 通过 simple-git 避免命令注入

### 需要改进

- 输入验证 (文件路径、分支名)
- RPC 认证和授权
- 速率限制
- 路径遍历保护

## 参考资源

- [VS Code Extension API](https://code.visualstudio.com/api)
- [simple-git Documentation](https://github.com/steveukx/git-js)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Vitest Documentation](https://vitest.dev/)
