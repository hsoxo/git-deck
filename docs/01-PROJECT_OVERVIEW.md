# Git GUI for VS Code - 项目概述

## 项目简介

Git GUI for VS Code 是一个深度集成在 VS Code 中的可视化 Git 管理工具，提供类似 Fork/GitKraken 的图形化操作体验，专注于 Git 历史可视化和常用操作的图形化执行。

## 核心价值

- **可视化优先** - 让 Git 历史和分支关系一目了然
- **操作可控** - 每个操作的影响范围清晰可见
- **工作流集成** - 无缝融入 VS Code 开发流程
- **降低心智负担** - 减少命令行记忆，提高操作信心

## 目标用户

### 主要用户
- 工作年限：2-8 年开发经验
- Git 熟练度：中高级（理解 rebase、cherry-pick 等概念）
- 工作场景：多分支并行开发、频繁代码整合

### 用户痛点
- VS Code 原生 Git 功能不够直观
- 独立 Git GUI 工具割裂工作流
- 复杂 Git 操作容易出错

## 核心功能

### 已实现功能 ✅

#### 1. Stage & Commit 管理
- 文件暂存/取消暂存
- 提交更改
- 修改最后一次提交（Amend）
- 丢弃更改（Discard）
- 查看文件 Diff

#### 2. Commit History 可视化
- 图形化 commit 树展示
- 分支和合并可视化
- Commit 详情查看
- 搜索和过滤功能
- 虚拟滚动支持大型仓库

#### 3. Rebase 操作
- 普通 Rebase
- 交互式 Rebase（pick, reword, edit, squash, fixup, drop）
- 冲突处理流程
- 进度显示
- 中止/跳过支持

#### 4. Cherry-pick 操作
- 单个/批量 Cherry-pick
- 冲突处理
- 操作状态管理

#### 5. Revert 操作
- 回滚单个/多个 commits
- 创建 revert commit
- 冲突处理

#### 6. Stash 管理
- 创建 Stash（支持 untracked 文件）
- 应用/Pop Stash
- 删除 Stash
- Stash 列表展示

#### 7. Branch Management
- 列出本地/远程分支
- 创建/删除/重命名分支
- 切换分支
- 合并分支
- 上游跟踪管理

### 计划功能 📋

#### Phase 7: 优化与完善
- 性能优化（大型仓库）
- 用户体验提升
- 完善测试覆盖率
- 文档完善

#### 未来功能
- 远程仓库操作（Push/Pull/Fetch）
- GitHub/GitLab 集成
- Commit 规范化工具
- AI 辅助 commit message
- 团队协作功能

## 技术栈

### 后端（Extension）
- **语言**: TypeScript
- **框架**: VS Code Extension API
- **Git 库**: simple-git
- **构建**: tsup
- **测试**: Vitest

### 前端（Webview）
- **语言**: TypeScript
- **框架**: React 18.3.1
- **状态管理**: Zustand
- **图形渲染**: Canvas API
- **构建**: Vite
- **测试**: Vitest + Testing Library

### 共享
- **类型定义**: @git-gui/shared
- **通信协议**: JSON-RPC

## 架构设计

```
┌─────────────────────────────────────────┐
│         VS Code Extension Host          │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │      Webview UI (React)           │  │
│  │  ┌─────────────┬────────────────┐ │  │
│  │  │  Sidebar    │  Main Panel    │ │  │
│  │  │  - Branches │  - History     │ │  │
│  │  │  - Stashes  │  - Graph       │ │  │
│  │  │  - Status   │  - Operations  │ │  │
│  │  └─────────────┴────────────────┘ │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │    Git Service Layer              │  │
│  │  - GitService                     │  │
│  │  - Operations (Stage, Rebase...)  │  │
│  │  - RPC Server                     │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │    Git Core (simple-git)          │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 项目结构

```
git-gui-vscode/
├── packages/
│   ├── extension/          # VS Code Extension (后端)
│   │   ├── src/
│   │   │   ├── extension.ts
│   │   │   ├── git/       # Git 操作核心
│   │   │   ├── rpc/       # RPC 通信
│   │   │   ├── utils/     # 工具类
│   │   │   └── webview/   # Webview 管理
│   │   └── package.json
│   ├── webview/           # React UI (前端)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── store/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   └── package.json
│   └── shared/            # 共享类型定义
│       └── src/types.ts
├── tests/
│   ├── integration/       # 集成测试
│   └── e2e/              # E2E 测试
└── docs/                 # 文档
```

## 开发进度

**当前阶段**: Phase 6 完成，准备 Phase 7

**总体进度**: 86% (6/7 Phases)

- ✅ Phase 1: 基础框架（100%）
- ✅ Phase 2: Stage & Commit（100%）
- ✅ Phase 3: History 可视化（100%）
- ✅ Phase 4: Rebase 操作（100%）
- ✅ Phase 5: Cherry-pick & Stash（100%）
- ✅ Phase 6: Branch Management（100%）
- ⏳ Phase 7: 优化与完善（0%）

## 质量指标

### 测试覆盖
- **单元测试**: 178 个（Extension）+ 41 个（Webview）= 219 个
- **集成测试**: 37 个
- **总计**: 256 个自动化测试
- **Extension 覆盖率**: 75.6% ✅
- **Webview 覆盖率**: 15.36%

### 代码质量
- ✅ TypeScript 严格模式
- ✅ ESLint + Prettier
- ✅ 完整的错误处理
- ✅ 日志系统
- ✅ 配置管理

### 构建产物
- Extension: 58.92 KB
- Webview: 175.63 KB

## 性能指标

- 初始加载: < 500ms (100 commits)
- 布局计算: ~10ms
- 渲染时间: ~16ms (60 FPS)
- 支持 commits: 10,000+
- 内存使用: ~30MB

## 兼容性

- **VS Code**: >= 1.80.0
- **Git**: >= 2.20.0
- **Node.js**: >= 18.0.0
- **操作系统**: Windows, macOS, Linux

## 许可证

MIT License

## 贡献

欢迎贡献！请查看 [开发者手册](./03-DEVELOPER_GUIDE.md) 了解如何参与开发。

## 相关文档

- [技术实现路线](./02-TECHNICAL_ROADMAP.md)
- [开发者手册](./03-DEVELOPER_GUIDE.md)
- [已实现功能](./04-IMPLEMENTED_FEATURES.md)
- [优化计划](./05-OPTIMIZATION_PLAN.md)
