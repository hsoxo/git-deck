# Git GUI 快速调试指南

## 🔍 GUI 一直显示 Loading？按照以下步骤排查

### 第一步：查看日志

1. **打开 Output 面板**
   ```
   快捷键：Ctrl+Shift+U (Windows/Linux) 或 Cmd+Shift+U (macOS)
   或菜单：View → Output
   ```

2. **选择 "Git GUI" 频道**
   - 在 Output 面板右上角的下拉菜单中选择

3. **或使用命令**
   ```
   Ctrl+Shift+P → 输入 "Git GUI: Show Output"
   ```

### 第二步：启用详细日志

在 VS Code 设置中：
```json
{
  "gitGui.logLevel": "debug"
}
```

### 第三步：重新加载窗口

```
Ctrl+Shift+P → Developer: Reload Window
```

### 第四步：打开 Git GUI 并查看日志

```
Ctrl+Shift+P → Git GUI: Open
```

然后立即切换到 Output 面板查看日志。

### 第五步：查看 Webview 控制台

```
Ctrl+Shift+P → Developer: Open Webview Developer Tools
选择 "Git GUI"
```

## 📋 日志检查清单

在 Output 面板中查找以下关键信息：

- ✅ `Git GUI extension is now active` - 扩展已激活
- ✅ `Logger initialized` - 日志系统已初始化
- ✅ `Creating new webview panel` - 正在创建面板
- ✅ `Repository path: /path/to/repo` - 仓库路径
- ✅ `Script URI:` 和 `Style URI:` - 资源路径
- ✅ `Webview HTML content set successfully` - HTML 已设置
- ✅ `Received message from webview` - 收到前端消息
- ✅ `RPC call: git.getStatus` - Git 操作调用
- ✅ `RPC result:` - 操作结果

## 🐛 常见问题

### 问题 1：看不到任何日志
- 确认已选择 "Git GUI" 频道
- 确认 `gitGui.logLevel` 设置为 `debug`
- 重新加载窗口

### 问题 2：看到 "VS Code API not available"
- Webview 初始化失败
- 检查 webview-dist 目录是否存在
- 重新构建：`npm run build`

### 问题 3：看到 "RPC timeout"
- Git 操作超时
- 检查 Git 是否安装
- 检查是否在 Git 仓库中
- 检查仓库是否损坏

### 问题 4：看到 "Failed to load git status"
- Git 命令执行失败
- 查看详细错误信息
- 检查 Git 权限

## 🔧 重新构建扩展

如果修改了代码或怀疑构建有问题：

```bash
# 在项目根目录
npm run build

# 然后重新加载 VS Code
Ctrl+Shift+P → Developer: Reload Window
```

## 📞 获取帮助

提供以下信息：
1. Output 面板的完整日志（Git GUI 频道）
2. Webview Developer Tools 的 Console 日志
3. 你的操作步骤
4. VS Code 版本：`Help → About`
5. 操作系统版本
