# Git GUI 调试指南

## 使用 Output 面板查看日志

我们已经为 Git GUI 扩展添加了详细的日志输出功能，可以帮助你调试 GUI 加载问题。

### 如何查看日志

1. **打开 Output 面板**
   - 使用快捷键：`Ctrl+Shift+U` (Windows/Linux) 或 `Cmd+Shift+U` (macOS)
   - 或者通过菜单：`View` → `Output`

2. **选择 Git GUI 频道**
   - 在 Output 面板右上角的下拉菜单中选择 `Git GUI`

3. **或者使用命令**
   - 打开命令面板 (`Ctrl+Shift+P` / `Cmd+Shift+P`)
   - 输入 `Git GUI: Show Output`

### 启用调试模式

为了看到更详细的日志，建议启用调试模式：

1. 打开设置：`File` → `Preferences` → `Settings`
2. 搜索 `gitGui.logLevel`
3. 将值设置为 `debug`

或者直接编辑 `settings.json`：
```json
{
  "gitGui.logLevel": "debug"
}
```

### 日志内容说明

日志会显示以下信息：

#### 扩展初始化
- 扩展激活状态
- 配置加载情况
- Output Channel 创建

#### Webview 加载
- Webview 面板创建
- HTML 内容设置
- 资源路径（script 和 style URI）
- Git 仓库路径

#### RPC 通信
- 前端发送的 RPC 请求（方法名、参数）
- 后端接收到的请求
- 请求处理时间
- 响应结果或错误

#### 前端初始化
- React 应用启动
- 组件挂载
- 数据加载（git status、history）

### 常见问题排查

#### 1. GUI 一直显示 Loading

查看日志中是否有：
- `[RPC Client] Initializing...` - 前端 RPC 客户端是否初始化
- `[RPC Client] Calling method: git.getStatus` - 是否发送了请求
- `Received message from webview` - 后端是否收到请求
- `RPC result:` - 是否有响应

#### 2. 资源加载失败

查看日志中的：
- `Script URI:` 和 `Style URI:` - 检查路径是否正确
- 浏览器控制台中是否有 404 错误

#### 3. Git 操作失败

查看日志中的：
- `Repository path:` - 仓库路径是否正确
- `RPC error:` - 具体的错误信息

### 重新构建扩展

如果修改了代码，需要重新构建：

```bash
# 在项目根目录
npm run build

# 或者在 packages/extension 目录
cd packages/extension
npm run build
```

然后重新加载 VS Code 窗口：
- 命令面板 → `Developer: Reload Window`

### 查看浏览器控制台

Webview 使用浏览器引擎，可以查看其控制台：

1. 打开命令面板 (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. 输入 `Developer: Open Webview Developer Tools`
3. 选择 `Git GUI` webview

这会打开一个类似浏览器开发者工具的窗口，可以看到：
- Console 日志
- Network 请求
- 元素检查
- JavaScript 错误

### 日志示例

正常启动的日志应该类似：

```
[10:30:15] [Git GUI] [INFO] Git GUI extension is now active
[10:30:15] [Git GUI] [INFO] Logger initialized with VS Code Output Channel
[10:30:15] [Git GUI] [INFO] Debug mode enabled
[10:30:15] [Git GUI] [DEBUG] Open command triggered
[10:30:15] [Git GUI] [INFO] Creating or showing Git GUI panel
[10:30:15] [Git GUI] [DEBUG] Creating new webview panel
[10:30:15] [Git GUI] [INFO] Webview panel created successfully
[10:30:15] [Git GUI] [DEBUG] Initializing GitGuiPanel constructor
[10:30:15] [Git GUI] [DEBUG] Repository path: /path/to/your/repo
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
[10:30:16] [Git GUI] [DEBUG] Timer started: RPC git.getStatus
[10:30:16] [Git GUI] [DEBUG] Timer ended: RPC git.getStatus - 45ms
[10:30:16] [Git GUI] [DEBUG] RPC result: git.getStatus { ... }
[10:30:16] [Git GUI] [DEBUG] Sending response to webview { id: 1, hasError: false }
```

### 反馈问题

如果遇到问题，请提供：
1. Output 面板中的完整日志
2. Webview Developer Tools 中的 Console 日志
3. 你的操作步骤
4. VS Code 版本和操作系统
