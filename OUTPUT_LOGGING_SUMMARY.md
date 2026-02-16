# Git GUI Output 日志功能总结

## ✅ 已完成的改进

### 1. 集成 VS Code Output Channel

**修改文件：** `packages/extension/src/utils/Logger.ts`

- 将日志输出从 console 改为 VS Code 的 Output Channel
- 添加时间戳格式化
- 支持对象和数组的 JSON 格式化输出
- 添加 `show()` 方法用于显示 Output 面板
- 保留 console 输出用于开发调试

### 2. 扩展初始化日志

**修改文件：** `packages/extension/src/extension.ts`

- 在扩展激活时创建 "Git GUI" Output Channel
- 初始化 Logger 并传入 Output Channel
- 添加 `gitGui.showOutput` 命令用于快速打开日志面板
- 记录扩展激活和配置加载过程

### 3. Webview 加载日志

**修改文件：** `packages/extension/src/webview/GitGuiPanel.ts`

- 记录 Webview 面板创建过程
- 输出仓库路径
- 输出资源 URI（script 和 style）
- 记录 Git 操作初始化
- 记录 RPC 处理器注册
- 记录 HTML 内容设置
- 详细记录 webview 消息收发

### 4. RPC 通信日志

**修改文件：** `packages/extension/src/rpc/RPCServer.ts`

- 已有的 RPC 调用日志
- 请求参数和响应结果记录
- 性能计时（debug 模式）

**修改文件：** `packages/webview/src/services/rpcClient.ts`

- 前端 RPC 客户端初始化日志
- VS Code API 可用性检查
- 请求发送日志
- 响应接收日志
- 超时和错误日志

### 5. Git 操作日志

**修改文件：** `packages/extension/src/git/GitService.ts`

- 记录 Git 状态查询
- 记录 Git 日志查询
- 输出操作耗时
- 输出结果统计（文件数量、提交数量等）

### 6. 前端初始化日志

**修改文件：** `packages/webview/src/main.tsx`

- React 初始化日志
- Root 元素检查
- 组件渲染日志
- 错误捕获和显示

**修改文件：** `packages/webview/src/App.tsx`

- 组件挂载日志
- 数据加载过程日志
- 加载成功/失败日志

### 7. 配置更新

**修改文件：** `packages/extension/package.json`

- 添加 `gitGui.showOutput` 命令
- 将默认日志级别改为 `debug`
- 更新日志级别配置说明
- 移除冗余的激活事件

## 📖 使用指南

### 查看日志的三种方式

1. **快捷键**
   - `Ctrl+Shift+U` (Windows/Linux) 或 `Cmd+Shift+U` (macOS)
   - 然后在下拉菜单选择 "Git GUI"

2. **命令面板**
   - `Ctrl+Shift+P` → `Git GUI: Show Output`

3. **菜单**
   - `View` → `Output` → 选择 "Git GUI"

### 日志级别设置

在 VS Code 设置中：
```json
{
  "gitGui.logLevel": "debug"  // 显示所有日志
}
```

可选值：
- `debug` - 显示所有日志（推荐用于调试）
- `info` - 显示信息、警告和错误
- `warn` - 仅显示警告和错误
- `error` - 仅显示错误

## 🔍 日志内容示例

### 正常启动流程

```
[10:30:15] [Git GUI] [INFO] Git GUI extension is now active
[10:30:15] [Git GUI] [INFO] Logger initialized with VS Code Output Channel
[10:30:15] [Git GUI] [INFO] Debug mode enabled
[10:30:15] [Git GUI] [DEBUG] Open command triggered
[10:30:15] [Git GUI] [INFO] Creating or showing Git GUI panel
[10:30:15] [Git GUI] [DEBUG] Creating new webview panel
[10:30:15] [Git GUI] [INFO] Webview panel created successfully
[10:30:15] [Git GUI] [DEBUG] Initializing GitGuiPanel constructor
[10:30:15] [Git GUI] [DEBUG] Repository path: /home/user/project
[10:30:15] [Git GUI] [DEBUG] Git operations initialized
[10:30:15] [Git GUI] [DEBUG] RPC handlers registered
[10:30:15] [Git GUI] [DEBUG] Setting webview HTML content
[10:30:15] [Git GUI] [DEBUG] Webview path: /path/to/extension/webview-dist
[10:30:15] [Git GUI] [DEBUG] Script URI: vscode-webview://...
[10:30:15] [Git GUI] [DEBUG] Style URI: vscode-webview://...
[10:30:15] [Git GUI] [INFO] Webview HTML content set successfully
[10:30:15] [Git GUI] [INFO] GitGuiPanel initialized successfully
[10:30:16] [Git GUI] [DEBUG] Received message from webview { method: 'git.getStatus', id: 1 }
[10:30:16] [Git GUI] [DEBUG] RPC call: git.getStatus []
[10:30:16] [Git GUI] [DEBUG] Getting git status...
[10:30:16] [Git GUI] [DEBUG] Timer started: git.status
[10:30:16] [Git GUI] [DEBUG] Timer ended: git.status - 45ms
[10:30:16] [Git GUI] [DEBUG] Git status retrieved successfully {
  staged: 2,
  unstaged: 3,
  untracked: 1,
  current: 'main'
}
[10:30:16] [Git GUI] [DEBUG] RPC result: git.getStatus { ... }
[10:30:16] [Git GUI] [DEBUG] Sending response to webview { id: 1, hasError: false }
```

### 错误情况示例

```
[10:30:15] [Git GUI] [ERROR] Failed to get status Error: Not a git repository
[10:30:15] [Git GUI] [DEBUG] RPC error: git.getStatus Error: Not a git repository
```

## 🐛 调试 Loading 问题

如果 GUI 一直显示 Loading，按以下顺序检查日志：

1. **扩展是否激活？**
   - 查找：`Git GUI extension is now active`

2. **Webview 是否创建？**
   - 查找：`Webview panel created successfully`

3. **资源路径是否正确？**
   - 查找：`Script URI:` 和 `Style URI:`
   - 确认路径包含 `webview-dist`

4. **前端是否初始化？**
   - 打开 Webview Developer Tools
   - 查找：`[Git GUI Webview] Starting initialization...`
   - 查找：`[RPC Client] Initialized successfully`

5. **RPC 通信是否正常？**
   - 查找：`Received message from webview`
   - 查找：`RPC call: git.getStatus`
   - 查找：`Sending response to webview`

6. **Git 操作是否成功？**
   - 查找：`Git status retrieved successfully`
   - 查找：`Retrieved X commits`

## 📝 相关文档

- `DEBUG_OUTPUT.md` - 详细的调试指南
- `QUICK_DEBUG_GUIDE.md` - 快速调试步骤

## 🔄 下次使用

1. 重新加载 VS Code 窗口：`Ctrl+Shift+P` → `Developer: Reload Window`
2. 打开 Output 面板：`Ctrl+Shift+U` → 选择 "Git GUI"
3. 打开 Git GUI：`Ctrl+Shift+P` → `Git GUI: Open`
4. 观察日志输出，查找问题

## 💡 提示

- 日志会自动滚动到最新内容
- 可以使用 Output 面板右上角的清除按钮清空日志
- Debug 模式会输出更多信息，但可能影响性能
- 生产环境建议使用 `info` 级别
