# Git GUI 日志功能更新说明

## 🎉 更新内容

我们为 Git GUI 扩展添加了完整的日志输出功能，现在你可以在 VS Code 的 Output 面板中查看详细的运行日志，方便调试 GUI 加载问题。

## 🆕 新功能

### 1. VS Code Output 面板集成
- 所有日志现在输出到 VS Code 的 Output 面板
- 专用的 "Git GUI" 日志频道
- 带时间戳的格式化日志
- 支持对象和数组的 JSON 格式化

### 2. 新增命令
- `Git GUI: Show Output` - 快速打开日志面板

### 3. 详细的日志记录

#### 后端日志（Extension）
- ✅ 扩展激活和初始化
- ✅ Webview 面板创建过程
- ✅ Git 仓库路径和配置
- ✅ 资源文件路径（script、style URI）
- ✅ RPC 请求和响应
- ✅ Git 操作执行和耗时
- ✅ 错误和警告信息

#### 前端日志（Webview）
- ✅ React 应用初始化
- ✅ RPC 客户端初始化
- ✅ VS Code API 可用性检查
- ✅ 数据加载过程
- ✅ 组件挂载和渲染
- ✅ 前后端通信详情

### 4. 默认启用 Debug 模式
- 默认日志级别改为 `debug`
- 显示更详细的调试信息
- 包含性能计时信息

## 📦 安装更新

### 方法一：重新安装 VSIX（推荐）

1. 卸载旧版本（如果已安装）
   ```
   Ctrl+Shift+P → Extensions: Show Installed Extensions
   找到 Git GUI → 右键 → Uninstall
   ```

2. 安装新版本
   ```
   Ctrl+Shift+P → Extensions: Install from VSIX...
   选择 packages/extension/git-gui-0.1.0.vsix
   ```

3. 重新加载窗口
   ```
   Ctrl+Shift+P → Developer: Reload Window
   ```

### 方法二：开发模式运行

如果你在开发环境中：

1. 重新构建
   ```bash
   npm run build
   ```

2. 按 F5 启动调试
   - 或者在 Run and Debug 面板点击 "Run Extension"

## 🔍 如何使用

### 查看日志

1. **打开 Output 面板**
   - 快捷键：`Ctrl+Shift+U` (Windows/Linux) 或 `Cmd+Shift+U` (macOS)
   - 或命令：`Git GUI: Show Output`

2. **选择 Git GUI 频道**
   - 在 Output 面板右上角的下拉菜单中选择 "Git GUI"

3. **打开 Git GUI**
   - 命令：`Git GUI: Open`
   - 观察日志输出

### 调整日志级别

在 VS Code 设置中：
```json
{
  "gitGui.logLevel": "debug"  // 显示所有日志（默认）
  // 或 "info"   // 仅显示重要信息
  // 或 "warn"   // 仅显示警告和错误
  // 或 "error"  // 仅显示错误
}
```

### 查看 Webview 控制台

除了 Output 面板，还可以查看 Webview 的浏览器控制台：

```
Ctrl+Shift+P → Developer: Open Webview Developer Tools
选择 "Git GUI"
```

## 🐛 调试 Loading 问题

如果 GUI 一直显示 Loading，现在可以通过日志快速定位问题：

1. 打开 Output 面板（`Ctrl+Shift+U`），选择 "Git GUI"
2. 打开 Git GUI（`Ctrl+Shift+P` → `Git GUI: Open`）
3. 查看日志，按以下顺序检查：

   ```
   ✅ [INFO] Git GUI extension is now active
   ✅ [INFO] Webview panel created successfully
   ✅ [DEBUG] Repository path: /your/repo/path
   ✅ [DEBUG] Script URI: vscode-webview://...
   ✅ [INFO] Webview HTML content set successfully
   ✅ [DEBUG] Received message from webview
   ✅ [DEBUG] RPC call: git.getStatus
   ✅ [DEBUG] Git status retrieved successfully
   ```

4. 如果某个步骤失败，日志会显示详细的错误信息

## 📚 文档

我们创建了以下文档帮助你使用日志功能：

- **`如何查看日志.md`** - 中文快速指南 ⭐ 推荐先看这个
- **`QUICK_DEBUG_GUIDE.md`** - 快速调试步骤
- **`DEBUG_OUTPUT.md`** - 详细的调试指南
- **`OUTPUT_LOGGING_SUMMARY.md`** - 技术实现总结

## 🔄 更新的文件

### 后端（Extension）
- `packages/extension/src/utils/Logger.ts` - 日志系统重构
- `packages/extension/src/extension.ts` - Output Channel 初始化
- `packages/extension/src/webview/GitGuiPanel.ts` - Webview 日志
- `packages/extension/src/git/GitService.ts` - Git 操作日志
- `packages/extension/package.json` - 新增命令和配置

### 前端（Webview）
- `packages/webview/src/main.tsx` - 初始化日志
- `packages/webview/src/App.tsx` - 组件日志
- `packages/webview/src/services/rpcClient.ts` - RPC 通信日志

## 💡 使用建议

1. **开发调试时**
   - 使用 `debug` 级别
   - 同时查看 Output 面板和 Webview Developer Tools

2. **日常使用时**
   - 使用 `info` 级别
   - 减少日志输出，提高性能

3. **遇到问题时**
   - 切换到 `debug` 级别
   - 重新加载窗口
   - 重现问题并查看日志

4. **报告问题时**
   - 提供 Output 面板的完整日志
   - 提供 Webview Developer Tools 的 Console 日志
   - 说明操作步骤和环境信息

## ✨ 下一步

1. 安装更新后的扩展
2. 打开 Output 面板查看日志
3. 如果 GUI 有问题，日志会告诉你原因
4. 查看 `如何查看日志.md` 了解详细使用方法

---

如有问题，请查看文档或提供日志信息以便我们帮助你解决。
