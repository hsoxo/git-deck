# Remote-SSH 快速开始

## 5分钟快速上手

### 1️⃣ 安装扩展（本地）

```bash
# 方式 1: 从 VSIX 安装
code --install-extension git-gui-0.1.0.vsix

# 方式 2: 从 Marketplace 安装（即将推出）
# 在扩展面板搜索 "Git GUI"
```

### 2️⃣ 连接远程服务器

```bash
# 打开命令面板
Ctrl+Shift+P (Windows/Linux)
Cmd+Shift+P (Mac)

# 输入并选择
Remote-SSH: Connect to Host

# 选择或添加你的服务器
```

### 3️⃣ 打开远程 Git 仓库

在远程窗口中：
- File → Open Folder
- 选择包含 `.git` 的文件夹
- 等待扩展自动安装（首次连接需要几秒钟）

### 4️⃣ 打开 Git GUI

```bash
# 命令面板
Ctrl+Shift+P → "Git GUI: Open"

# 或点击侧边栏图标
```

## 验证安装

### ✅ 检查扩展已安装到远程

1. 打开扩展面板 (`Ctrl+Shift+X`)
2. 搜索 "Git GUI"
3. 应该显示在 "SSH: [服务器名] - Installed" 部分

### ✅ 检查功能正常

- 能看到提交历史
- 能看到文件更改
- 能执行 Stage/Commit 操作

## 常见问题

### Q: 扩展没有自动安装到远程？

**A:** 检查 `package.json` 中是否有：
```json
{
  "extensionKind": ["workspace"]
}
```

### Q: Webview 显示空白？

**A:** 
1. 检查 `webview-dist` 文件夹是否在 VSIX 中
2. 查看开发者工具 Console 的错误信息
3. 确认使用了 `webview.asWebviewUri()` 转换路径

### Q: Git 操作失败？

**A:**
1. 在远程终端测试: `git status`
2. 检查 Git 版本: `git --version` (需要 >= 2.20.0)
3. 查看扩展日志: Output → Git GUI

### Q: 性能很慢？

**A:**
1. 检查网络延迟: `ping [服务器]`
2. 减少加载的提交数量（在设置中）
3. 考虑使用更快的网络连接

## 技术细节

### 扩展运行位置

```
本地 VS Code (UI)
    ↕ SSH Tunnel
远程服务器 (Extension + Git)
```

- **Extension Host**: 运行在远程服务器
- **Git 操作**: 在远程服务器执行
- **Webview UI**: 在本地渲染，数据来自远程

### 关键配置

```json
// package.json
{
  "extensionKind": ["workspace"],  // 在远程运行
  "activationEvents": [
    "onCommand:gitGui.open",
    "workspaceContains:.git"       // 检测到 Git 仓库时激活
  ]
}
```

### 资源路径处理

```typescript
// 正确的方式
const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'webview-dist', 'assets', 'index.js')
);

// ❌ 错误的方式
const scriptUri = path.join(__dirname, 'webview-dist', 'assets', 'index.js');
```

## 性能优化建议

### 1. 减少初始加载的提交数

```json
// settings.json
{
  "gitGui.maxLogCount": 50  // 默认 100
}
```

### 2. 禁用自动刷新（如果不需要）

```json
{
  "gitGui.autoRefresh": false
}
```

### 3. 使用本地缓存

扩展已内置缓存机制，只读操作会自动缓存 1 秒。

## 调试技巧

### 查看扩展日志

```
View → Output → 选择 "Git GUI"
```

### 查看 Webview 日志

```
右键 Webview 面板 → Open Webview Developer Tools
```

### 查看 RPC 通信

在 `RPCServer.ts` 中启用 debug 日志：

```typescript
logger.setDebugMode(true);
```

## 支持的环境

### 远程系统
- ✅ Linux (Ubuntu, CentOS, Debian, etc.)
- ✅ macOS
- ✅ Windows (WSL)

### 要求
- Git >= 2.20.0
- Node.js >= 18.0.0 (仅开发时需要)
- VS Code >= 1.80.0

## 下一步

- 📖 阅读[完整文档](./07-REMOTE_SSH_SUPPORT.md)
- 🧪 查看[测试指南](./08-REMOTE_SSH_TESTING.md)
- 🐛 [报告问题](https://github.com/your-org/git-gui-vscode/issues)

## 反馈

如果遇到问题或有改进建议，欢迎：
- 提交 Issue
- 发起 Discussion
- 贡献代码

---

**提示**: 首次连接到远程服务器时，扩展需要几秒钟安装。后续连接会更快。
