# 06 - 部署与安装指南

完整的构建、打包、安装和配置指南。

## 前置要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **VS Code**: >= 1.80.0
- **Git**: >= 2.20.0

验证环境：

```bash
node -v    # 应该 >= 18.0.0
npm -v     # 应该 >= 9.0.0
git --version  # 应该 >= 2.20.0
code --version # 应该 >= 1.80.0
```

---

## 快速安装（用户）

### 方式 1: 从 VSIX 文件安装

1. 下载 `.vsix` 文件
2. 打开 VS Code
3. 按 `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
4. 输入 "Extensions: Install from VSIX"
5. 选择下载的 `.vsix` 文件
6. 重新加载 VS Code

### 方式 2: 从命令行安装

```bash
code --install-extension git-deck-0.1.0.vsix
```

### 方式 3: 从 VS Code Marketplace 安装

*即将推出 - 扩展将发布到 Marketplace*

---

## 从源码构建（开发者）

### 步骤 1: 克隆并安装依赖

```bash
# 克隆仓库
git clone <repository-url>
cd git-deck

# 安装依赖
npm install
```

### 步骤 2: 构建扩展

```bash
# 构建所有包 (extension + webview)
npm run build
```

这将：
- 编译 TypeScript 到 JavaScript
- 使用 Vite 打包 webview
- 生成 source maps
- 输出到 `packages/extension/dist` 和 `packages/webview/dist`

### 步骤 3: 打包为 VSIX

```bash
# 安装 vsce (如果尚未安装)
npm install -g @vscode/vsce

# 打包扩展
cd packages/extension
vsce package
```

这将在 `packages/extension` 目录创建 `.vsix` 文件（例如 `git-deck-0.1.0.vsix`）。

### 步骤 4: 安装 VSIX

```bash
# 通过命令行安装
code --install-extension git-deck-0.1.0.vsix

# 或使用 VS Code UI（见快速安装）
```

---

## 开发工作流

### 开发模式运行

```bash
# 终端 1: 监听 extension 变化
npm run dev:extension

# 终端 2: 监听 webview 变化
npm run dev:webview

# 在 VS Code 中按 F5 启动 Extension Development Host
```

### 发布前测试

```bash
# 运行所有测试
npm test

# 运行特定测试套件
npm run test:unit           # 仅单元测试
npm run test:integration    # 仅集成测试
npm run test:e2e           # 仅 E2E 测试

# 运行 linter
npm run lint

# 运行完整质量门禁
npm run lint && npm run test:all && npm run build
```

---

## 配置

### 扩展设置

安装后，在 VS Code 设置中配置扩展：

```json
{
  "gitDeck.autoRefresh": true,
  "gitDeck.commitGraph.maxCommits": 1000,
  "gitDeck.security.enableRateLimit": true,
  "gitDeck.security.enableValidation": true
}
```

### 安全设置

扩展包含内置安全功能：

- **速率限制**: 防止 RPC 滥用（默认: 100 请求/分钟）
- **输入验证**: 防止路径遍历和命令注入
- **参数验证**: 基于 schema 的所有 RPC 调用验证

禁用安全功能（不推荐）：

```json
{
  "gitDeck.security.enableRateLimit": false,
  "gitDeck.security.enableValidation": false
}
```

---

## 使用

### 打开 Git Deck

1. 在 VS Code 中打开 Git 仓库
2. 点击活动栏（左侧边栏）中的 Git Deck 图标
3. 或使用命令面板: `Git Deck: Open`

### 基本操作

- **查看提交**: 提交历史自动显示
- **暂存文件**: 在 Changes 面板中点击文件
- **提交**: 输入消息并点击 Commit 按钮
- **创建分支**: 右键点击提交 → Create Branch
- **合并**: 右键点击分支 → Merge
- **Rebase**: 右键点击提交 → Rebase
- **Cherry-pick**: 右键点击提交 → Cherry-pick
- **Stash**: 在 Changes 面板中点击 Stash 按钮

---

## 故障排除

### 扩展未加载

**症状**: Git Deck 图标未出现或面板空白

**解决方案**:
1. 检查 VS Code 版本: `code --version` (必须 >= 1.80.0)
2. 重新加载 VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"
3. 检查扩展已启用: Extensions 面板 → Git Deck → Enable
4. 检查 Output 面板: View → Output → 从下拉菜单选择 "Git Deck"

### Git 操作失败

**症状**: commit、merge、rebase 等操作失败并报错

**解决方案**:
1. 验证 Git 已安装: `git --version`
2. 检查仓库有效: 在仓库中打开终端，运行 `git status`
3. 检查 Git 凭证已配置:
   ```bash
   git config user.name
   git config user.email
   ```
4. 检查 Output 面板查看详细错误消息

### 性能问题

**症状**: 扩展缓慢或无响应

**解决方案**:
1. 在设置中减少提交限制:
   ```json
   {
     "gitDeck.commitGraph.maxCommits": 500
   }
   ```
2. 清除缓存: 命令面板 → "Git Deck: Clear Cache"
3. 检查仓库大小: 大型仓库（10,000+ 提交）可能较慢
4. 如不需要可禁用自动刷新:
   ```json
   {
     "gitDeck.autoRefresh": false
   }
   ```

### Webview 未显示

**症状**: 面板打开但内容未加载

**解决方案**:
1. 检查浏览器控制台: `Ctrl+Shift+P` → "Developer: Toggle Developer Tools"
2. 在 Console 标签中查找 JavaScript 错误
3. 验证 webview 文件存在: `packages/webview/dist/index.html`
4. 重新构建 webview: `npm run build:webview`
5. 重新加载窗口: `Ctrl+Shift+P` → "Developer: Reload Window"

### 速率限制错误

**症状**: "Rate limit exceeded" 错误

**解决方案**:
1. 等待 60 秒让速率限制重置
2. 在设置中增加速率限制:
   ```json
   {
     "gitDeck.security.rateLimitConfig": {
       "maxRequests": 200,
       "windowMs": 60000
     }
   }
   ```
3. 禁用速率限制（不推荐）:
   ```json
   {
     "gitDeck.security.enableRateLimit": false
   }
   ```

### 输入验证错误

**症状**: "Invalid file path" 或 "Invalid branch name" 错误

**解决方案**:
1. 检查文件路径不包含 `..` 或以 `/` 开头
2. 检查分支名遵循 Git 命名规则:
   - 无空格或特殊字符
   - 不能以 `.` 或 `-` 开头
   - 不能包含 `..`
3. 如果是合法用例，请报告为 bug

---

## 卸载

### 通过 VS Code UI

1. 打开 Extensions 面板 (`Ctrl+Shift+X`)
2. 找到 "Git Deck"
3. 点击齿轮图标 → Uninstall
4. 重新加载 VS Code

### 通过命令行

```bash
code --uninstall-extension git-deck
```

---

## 发布（维护者）

### 前置要求

1. 创建 Azure DevOps 账户
2. 生成 Personal Access Token (PAT)
3. 安装 vsce: `npm install -g @vscode/vsce`

### 发布步骤

```bash
# 登录到 marketplace
vsce login <publisher-name>

# 发布新版本
cd packages/extension
vsce publish

# 或发布特定版本
vsce publish 1.0.0
vsce publish minor
vsce publish major
```

### 发布前检查清单

- [ ] 所有测试通过: `npm test`
- [ ] Linter 通过: `npm run lint`
- [ ] 构建成功: `npm run build`
- [ ] `package.json` 中版本号已更新
- [ ] CHANGELOG.md 已更新
- [ ] README.md 已更新
- [ ] 截图已更新（如果 UI 有变化）
- [ ] 在本地测试 VSIX

---

## 生产部署建议

### CI/CD 集成

```bash
# 在 CI 中运行
npm ci
npm run lint
npm run test:all
npm run build
npm run package
```

### 版本管理

- 使用语义化版本 (Semantic Versioning)
- 固定 Node/npm 版本（使用 `.nvmrc`）
- 保留变更日志（CHANGELOG.md）
- 创建 Git tags

### 安全考虑

- 对安全相关改动增加回归测试
- 定期更新依赖
- 运行安全审计: `npm audit`
- 在发布前进行手动安全测试

---

## 支持

- **Issues**: https://github.com/yourusername/git-deck/issues
- **Discussions**: https://github.com/yourusername/git-deck/discussions
- **Documentation**: https://github.com/yourusername/git-deck/tree/main/docs

## 其他资源

- [VS Code Extension API](https://code.visualstudio.com/api)
- [发布扩展](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
