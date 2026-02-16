# 06 - Deployment & Installation Guide (VS Code)

本指南说明如何构建、打包、安装并运行 Git Deck VS Code 扩展。

## 1) 前置要求

- Node.js >= 18
- npm >= 9
- VS Code 最新稳定版
- Git >= 2.20（推荐）

验证：

```bash
node -v
npm -v
git --version
code --version
```

## 2) 拉取与安装依赖

```bash
git clone <repo-url> git-deck
cd git-deck
npm install
```

## 3) 质量门禁（建议每次发布前执行）

```bash
npm run lint
npm run test:all
npm run build
```

通过标准：
- lint 无 error（warning 可按团队策略处理）
- unit + integration 测试通过
- build 成功

## 4) 打包 VSIX 并安装到 VS Code

### 4.1 生成扩展包

```bash
npm run package
```

通常会在 `packages/extension/` 下生成 `.vsix` 文件（例如 `git-gui-*.vsix`）。

### 4.2 安装 VSIX

方式 A（命令行）：

```bash
code --install-extension packages/extension/*.vsix
```

方式 B（UI）：
1. 打开 VS Code
2. Extensions 面板 → `...` → **Install from VSIX...**
3. 选择生成的 `.vsix`

### 4.3 升级/覆盖安装

```bash
code --install-extension packages/extension/*.vsix --force
```

### 4.4 卸载

```bash
code --uninstall-extension <publisher.extension-id>
```

> 具体 extension id 以 `packages/extension/package.json` 的 `publisher` + `name` 为准。

## 5) 开发模式运行（推荐本地联调）

### 5.1 分别启动 webview 与 extension 开发流程

```bash
npm run dev:webview
npm run dev:extension
```

### 5.2 在 VS Code 中运行扩展宿主

在 `packages/extension` 工程中使用 VS Code 打开，按 `F5` 启动 **Extension Development Host**。

## 6) 生产部署建议

- 固定 Node/npm 版本（建议用 `.nvmrc` + CI 镜像）
- CI 强制执行：`lint` + `test:all` + `build`
- 发布前保留变更日志（CHANGELOG）
- 对安全相关改动（RPC、输入校验、限流）增加回归测试

## 7) 常见问题排查

### Q1: `eslint/vitest/tsc not found`
- 先执行 `npm install`
- 确认在仓库根目录运行脚本

### Q2: VSIX 安装后无效
- 重启 VS Code
- 检查 extension id 是否冲突
- 用 `--force` 重装

### Q3: 集成测试失败（尤其 Git 相关）
- 确认本机 Git 可用
- 确认系统临时目录权限正常
- 重新执行 `npm run test:all`

### Q4: 打包失败
- 先执行 `npm run build`
- 检查 `packages/extension` 中 tsup/tsconfig 配置

---

如需自动化发布，可在 CI 中串联：

```bash
npm ci
npm run lint
npm run test:all
npm run build
npm run package
```
