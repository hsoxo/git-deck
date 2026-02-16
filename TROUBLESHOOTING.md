# 🔧 Git GUI 故障排查指南

## 问题：一直显示加载中

### 可能的原因和解决方案

#### 1. 不在 Git 仓库中 ⭐ 最常见

**症状**: 打开后一直显示 "Loading Git repository..."

**检查**:
```bash
# 在终端中运行
git status

# 如果显示 "not a git repository"，说明不在 Git 仓库中
```

**解决**:
```bash
# 方案 A: 打开一个 Git 仓库
File → Open Folder → 选择包含 .git 文件夹的目录

# 方案 B: 初始化 Git 仓库
git init

# 方案 C: 克隆一个仓库
git clone <repository-url>
```

#### 2. Git 未安装或不在 PATH 中

**症状**: 加载后显示错误 "Failed to load git status"

**检查**:
```bash
# 检查 Git 是否安装
git --version

# 应该显示类似: git version 2.x.x
```

**解决**:
```bash
# Linux (Ubuntu/Debian)
sudo apt-get install git

# Linux (CentOS/RHEL)
sudo yum install git

# macOS
brew install git

# Windows
# 从 https://git-scm.com/download/win 下载安装
```

#### 3. RPC 通信失败

**症状**: 控制台显示 RPC 相关错误

**检查**:
```bash
# 打开开发者工具
Ctrl+Shift+I (Windows/Linux)
Cmd+Option+I (Mac)

# 查看 Console 标签的错误信息
```

**解决**:
```bash
# 重新加载窗口
Ctrl+Shift+P → "Developer: Reload Window"

# 或重新安装扩展
```

#### 4. 权限问题

**症状**: 错误信息包含 "permission denied" 或 "EACCES"

**检查**:
```bash
# 检查仓库权限
ls -la .git

# 检查当前用户
whoami
```

**解决**:
```bash
# 修复权限
sudo chown -R $USER:$USER .git

# 或使用 sudo 打开 IDE（不推荐）
```

#### 5. 扩展未正确激活

**症状**: 没有任何错误，但一直加载

**检查**:
```bash
# 查看扩展日志
View → Output → 选择 "Git GUI"

# 查找 "activated successfully" 消息
```

**解决**:
```bash
# 重新加载窗口
Ctrl+Shift+P → "Developer: Reload Window"

# 重新安装扩展
code --install-extension git-gui-0.1.0.vsix --force
```

## 调试步骤

### 步骤 1: 查看控制台日志

```bash
1. 打开 Git GUI
2. 右键点击 webview 区域
3. 选择 "Inspect Element" 或 "Open Webview Developer Tools"
4. 查看 Console 标签

查找以下信息：
- "Git GUI: Loading data..." - 开始加载
- "Git GUI: Data loaded successfully" - 加载成功
- 任何红色错误信息
```

### 步骤 2: 查看扩展日志

```bash
1. View → Output
2. 从下拉菜单选择 "Git GUI"
3. 查看日志输出

查找以下信息：
- "Git GUI extension is now active" - 扩展激活
- "Git GUI extension activated successfully" - 激活成功
- 任何错误或警告信息
```

### 步骤 3: 验证 Git 仓库

```bash
# 在终端中运行
git status
git log --oneline -5

# 应该能看到仓库状态和提交历史
```

### 步骤 4: 测试 Git 命令

```bash
# 测试基本命令
git branch
git log --oneline -1
git status --porcelain

# 如果这些命令失败，Git GUI 也会失败
```

## 常见错误信息

### 错误 1: "Failed to load git status"

**原因**: Git 命令执行失败

**解决**:
```bash
# 检查是否在 Git 仓库中
git status

# 检查 Git 是否正常工作
git --version
```

### 错误 2: "Failed to load git history"

**原因**: 仓库没有提交历史

**解决**:
```bash
# 检查是否有提交
git log

# 如果是新仓库，创建第一个提交
git add .
git commit -m "Initial commit"
```

### 错误 3: "No workspace folder found"

**原因**: 没有打开文件夹

**解决**:
```bash
File → Open Folder → 选择一个文件夹
```

### 错误 4: "RPC timeout"

**原因**: Git 操作超时（大型仓库）

**解决**:
```bash
# 增加超时时间
Settings → 搜索 "gitGui.rpcTimeout"
# 设置为更大的值，如 60000 (60秒)
```

### 错误 5: "ENOENT: no such file or directory"

**原因**: Git 可执行文件未找到

**解决**:
```bash
# 确保 Git 在 PATH 中
which git  # Linux/Mac
where git  # Windows

# 如果没有，添加 Git 到 PATH
```

## 性能问题

### 问题：加载很慢

**原因**: 大型仓库或慢速磁盘

**解决**:
```bash
# 减少加载的提交数量
Settings → 搜索 "gitGui.maxLogCount"
# 设置为较小的值，如 50

# 禁用自动刷新
Settings → 搜索 "gitGui.autoRefresh"
# 设置为 false
```

### 问题：操作响应慢

**原因**: 网络延迟（Remote-SSH）或大型仓库

**解决**:
```bash
# 启用缓存
Settings → 搜索 "gitGui.enableCache"
# 设置为 true

# 增加缓存时间
Settings → 搜索 "gitGui.cacheTTL"
# 设置为更大的值，如 5000 (5秒)
```

## 完整诊断流程

### 1. 基础检查

```bash
□ 扩展已安装
  → Ctrl+Shift+X → 搜索 "Git GUI" → 确认 "已安装"

□ 在 Git 仓库中
  → 终端运行: git status

□ Git 已安装
  → 终端运行: git --version

□ 有提交历史
  → 终端运行: git log
```

### 2. 日志检查

```bash
□ 查看扩展日志
  → View → Output → Git GUI
  → 查找 "activated successfully"

□ 查看控制台日志
  → 右键 webview → Inspect Element
  → 查看 Console 标签
  → 查找错误信息
```

### 3. 重置尝试

```bash
□ 重新加载窗口
  → Ctrl+Shift+P → "Developer: Reload Window"

□ 重新安装扩展
  → 卸载 → 重新安装 VSIX

□ 清除缓存
  → 关闭 IDE → 删除缓存目录 → 重新打开
```

## 获取帮助

如果以上方法都无法解决问题，请：

### 1. 收集信息

```bash
# 系统信息
- 操作系统: ___________
- IDE 版本: ___________
- Git 版本: ___________
- 扩展版本: 0.1.0

# 错误信息
- 扩展日志: (View → Output → Git GUI)
- 控制台日志: (Inspect Element → Console)
- 错误截图
```

### 2. 提交 Issue

```bash
# 在 GitHub 上提交 Issue，包含：
1. 问题描述
2. 重现步骤
3. 预期行为
4. 实际行为
5. 系统信息
6. 日志和截图
```

### 3. 临时解决方案

```bash
# 如果 Git GUI 无法使用，可以：
1. 使用 VS Code 内置的 Git 功能
2. 使用命令行 Git
3. 使用其他 Git GUI 工具（GitKraken, Fork, etc.）
```

## 快速修复命令

```bash
# 一键诊断脚本
cat > diagnose.sh << 'EOF'
#!/bin/bash
echo "=== Git GUI 诊断 ==="
echo ""
echo "1. Git 版本:"
git --version || echo "❌ Git 未安装"
echo ""
echo "2. Git 仓库状态:"
git status || echo "❌ 不在 Git 仓库中"
echo ""
echo "3. 提交历史:"
git log --oneline -5 || echo "❌ 没有提交历史"
echo ""
echo "4. 分支列表:"
git branch || echo "❌ 无法获取分支"
echo ""
echo "5. 当前目录:"
pwd
echo ""
echo "6. .git 目录:"
ls -la .git || echo "❌ .git 目录不存在"
EOF

chmod +x diagnose.sh
./diagnose.sh
```

## 预防措施

### 最佳实践

```bash
1. 始终在 Git 仓库中使用
2. 确保 Git 版本 >= 2.20.0
3. 定期更新扩展
4. 不要在超大型仓库中使用（> 100,000 commits）
5. 使用 .gitignore 排除大文件
```

### 配置建议

```json
{
  "gitGui.logLevel": "info",
  "gitGui.maxLogCount": 100,
  "gitGui.enableCache": true,
  "gitGui.cacheTTL": 1000,
  "gitGui.rpcTimeout": 30000,
  "gitGui.autoRefresh": true,
  "gitGui.autoRefreshInterval": 5000
}
```

---

**还有问题？** 查看 [完整文档](./docs/) 或 [提交 Issue](https://github.com/your-org/git-gui-vscode/issues)
