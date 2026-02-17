# Git GUI 用户指南

完整的安装、使用和故障排查指南。

## 📦 安装

### 从 VSIX 安装

```bash
code --install-extension packages/extension/git-gui-0.1.0.vsix
```

### 验证安装

1. 打开扩展面板 (`Ctrl+Shift+X`)
2. 搜索 "Git GUI"
3. 确认显示 "已安装"

## 🚀 打开 Git GUI

### 方式 1: 侧边栏图标（推荐）

1. 点击左侧活动栏的 Git 分支图标 🌿
2. 在侧边栏中点击 "Open Git GUI" 按钮

### 方式 2: 命令面板

1. 按 `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
2. 输入 "Git GUI: Open"
3. 按 Enter

### 方式 3: 源代码管理面板

1. 打开源代码管理面板（左侧栏的 Git 图标）
2. 点击标题栏的 Git GUI 图标

## 🎨 界面概览

```
┌─────────────────────────────────────────────────────────┐
│ Git GUI                                    [刷新] [×]   │
├─────────────────────────────────────────────────────────┤
│  📊 Commit History - 图形化提交历史                      │
│  📝 Changes - 文件更改管理                               │
│  💬 Commit Message - 提交信息输入                        │
│  🌿 Branches - 分支管理                                  │
│  📦 Stash - 暂存管理                                     │
└─────────────────────────────────────────────────────────┘
```

## 📝 基本操作

### Stage 和 Commit

1. **Stage 文件**
   - 点击 Unstaged 列表中的文件
   - 或右键 → Stage
   - 或点击 "Stage All" 暂存所有文件

2. **查看 Diff**
   - 双击文件查看更改详情

3. **Commit 更改**
   - 在 Commit Message 框输入提交信息
   - 点击 "Commit" 按钮或按 `Ctrl+Enter`

### 查看历史

- 单击 commit 查看基本信息
- 双击 commit 查看完整详情
- 右键 commit 显示操作菜单

### 分支操作

- 在 Branches 列表中点击分支切换
- 右键分支显示操作菜单（删除、重命名、合并等）
- 在 Commit History 中右键 commit 可创建分支

## 🔧 高级功能

### Rebase

1. 在 Commit History 中右键目标 commit
2. 选择 "Rebase"
3. 按提示操作，如有冲突需解决

### Cherry-pick

1. 右键要复制的 commit
2. 选择 "Cherry-pick"
3. 确认操作

### Stash 管理

- 点击 "Stash" 按钮创建暂存
- 在 Stash 列表中选择并 Apply/Pop

### Amend Commit

1. 修改文件并 Stage
2. 点击 "Amend" 按钮修改最后一次提交

## 💡 使用技巧

### 键盘快捷键

- `Ctrl+Shift+P` - 打开命令面板
- `Ctrl+Enter` - 快速提交（在 Commit Message 框中）
- `Ctrl+点击` - 多选文件

### 搜索提交

- 在 History 面板使用搜索框
- 可按作者、消息或 hash 搜索

### 多选操作

- 按住 `Ctrl` (Mac: `Cmd`) 点击多个文件
- 批量 Stage/Unstage

## 🌐 Remote-SSH 支持

Git GUI 完全支持 VS Code Remote-SSH：

1. 连接到远程服务器
2. 打开远程 Git 仓库
3. 扩展自动安装到远程
4. 使用方式完全相同

所有 Git 操作都在远程服务器上执行。

## 🐛 故障排查

### 找不到 Git GUI 图标

**解决方案**:
1. 确保活动栏可见: View → Appearance → Show Activity Bar
2. 使用命令面板: `Ctrl+Shift+P` → "Git GUI: Open"
3. 重新加载窗口: `Ctrl+Shift+P` → "Developer: Reload Window"

### 扩展未激活

**检查**:
1. 确认在 Git 仓库中（运行 `git status` 验证）
2. 查看扩展日志: View → Output → Git GUI
3. 重新安装扩展

### 界面显示空白

**解决**:
1. 点击 "Refresh" 按钮
2. 关闭并重新打开 Git GUI
3. 确保当前文件夹是有效的 Git 仓库

### 操作失败

**检查**:
1. 查看界面上的错误提示
2. 查看日志: View → Output → Git GUI
3. 在终端运行 `git status` 检查 Git 状态

## 📚 功能列表

### 基础功能
- ✅ 查看文件状态
- ✅ Stage/Unstage 文件
- ✅ Commit 更改
- ✅ Amend commit
- ✅ Discard 更改
- ✅ 查看 Diff

### 历史查看
- ✅ 提交历史列表
- ✅ 图形化分支显示
- ✅ Commit 详情
- ✅ 搜索提交

### 分支管理
- ✅ 创建、切换、删除分支
- ✅ 重命名分支
- ✅ 合并分支

### 高级操作
- ✅ Rebase / Interactive Rebase
- ✅ Cherry-pick
- ✅ Stash 管理
- ✅ Revert commit

### Remote 支持
- ✅ Remote-SSH 完全支持
- ✅ 远程仓库操作

## 💡 最佳实践

1. **频繁提交** - 小步提交，便于回滚
2. **清晰消息** - 使用规范的 commit message
3. **查看 Diff** - 提交前检查更改
4. **使用分支** - 功能开发使用独立分支
5. **定期 Stash** - 临时保存未完成的工作

## 📞 获取帮助

- 查看文档: `docs/` 目录
- 查看日志: View → Output → Git GUI
- 提交问题: GitHub Issues
