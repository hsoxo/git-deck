# 安装和使用 Git GUI - 完整指南

## 📦 第一步：安装扩展

### 方法 1: 从 VSIX 文件安装（推荐）

```bash
# 在项目根目录执行
code --install-extension packages/extension/git-gui-0.1.0.vsix
```

### 方法 2: 从 Kiro IDE 界面安装

1. 打开 Kiro IDE
2. 按 `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
3. 输入 "Extensions: Install from VSIX"
4. 选择 `packages/extension/git-gui-0.1.0.vsix`
5. 点击 "Install"

### 验证安装

```bash
# 打开扩展面板
Ctrl+Shift+X

# 搜索 "Git GUI"
# 应该显示 "已安装" 状态
```

## 🎯 第二步：打开 Git 仓库

扩展只在 Git 仓库中工作，所以需要：

```bash
# 方式 1: 打开现有仓库
File → Open Folder → 选择包含 .git 的文件夹

# 方式 2: 克隆仓库
Ctrl+Shift+P → "Git: Clone" → 输入仓库 URL
```

## 🚀 第三步：打开 Git GUI

### 🌟 推荐方式：侧边栏

1. **找到 Git GUI 图标**
   - 查看左侧活动栏（最左边的垂直工具栏）
   - 找到 Git 分支图标 🌿
   - 图标位置通常在：文件、搜索、Git、调试、扩展等图标附近

2. **点击图标**
   - 点击 Git 分支图标
   - 侧边栏会打开，显示 "Git GUI" 面板

3. **打开主界面**
   - 在侧边栏中点击 **"Open Git GUI"** 按钮
   - 主界面会在编辑器区域打开

### 📋 备选方式：命令面板

如果找不到图标，使用命令面板：

```bash
1. 按 Ctrl+Shift+P (Mac: Cmd+Shift+P)
2. 输入 "Git GUI: Open"
3. 按 Enter
```

## 🎨 第四步：开始使用

### 界面布局

```
┌─────────────────────────────────────────────────────────┐
│ Git GUI                                    [刷新] [×]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 提交历史 (Commit History)                           │
│  ┌───────────────────────────────────────────────┐     │
│  │  ● main feat: add new feature                 │     │
│  │  │                                             │     │
│  │  ● fix: bug fix                               │     │
│  │  │                                             │     │
│  │  ● docs: update readme                        │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  📝 更改 (Changes)                                      │
│  ┌───────────────────────────────────────────────┐     │
│  │  未暂存 (Unstaged) - 2 个文件                 │     │
│  │    📄 modified: src/file1.ts                  │     │
│  │    📄 modified: src/file2.ts                  │     │
│  │                                               │     │
│  │  已暂存 (Staged) - 1 个文件                   │     │
│  │    📄 added: src/file3.ts                     │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  💬 提交信息 (Commit Message)                           │
│  ┌───────────────────────────────────────────────┐     │
│  │  feat: your commit message here               │     │
│  └───────────────────────────────────────────────┘     │
│  [Commit] [Amend]                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 基本操作流程

#### 1. 查看更改
- 修改文件后，更改会自动显示在 "Changes" 区域
- 未暂存的文件显示在 "Unstaged" 列表

#### 2. Stage 文件
```bash
# 方式 1: 点击文件
点击 Unstaged 列表中的文件

# 方式 2: 右键菜单
右键点击文件 → Stage

# 方式 3: Stage 全部
点击 "Stage All" 按钮
```

#### 3. 查看 Diff
```bash
# 双击文件
双击任意文件查看详细更改

# 会显示：
- 绿色：新增的行
- 红色：删除的行
```

#### 4. 提交更改
```bash
1. 在 "Commit Message" 框输入提交信息
   例如: "feat: add user authentication"

2. 点击 "Commit" 按钮
   或按 Ctrl+Enter

3. 提交成功后，更改会出现在历史记录中
```

#### 5. 查看历史
```bash
# 在 Commit History 区域：
- 单击 commit 查看基本信息
- 双击 commit 查看完整详情
- 右键 commit 显示操作菜单
```

## 🔧 常见操作

### 撤销更改 (Discard)
```bash
1. 右键点击 Unstaged 文件
2. 选择 "Discard Changes"
3. 确认操作
```

### 修改最后一次提交 (Amend)
```bash
1. 修改文件并 Stage
2. 在 Commit Message 框输入新消息（可选）
3. 点击 "Amend" 按钮
```

### 创建分支
```bash
1. 在 Commit History 中右键点击 commit
2. 选择 "Create Branch"
3. 输入分支名称
4. 确认创建
```

### Rebase 操作
```bash
1. 在 Commit History 中右键点击目标 commit
2. 选择 "Rebase"
3. 按照提示操作
4. 如有冲突，解决后继续
```

### Cherry-pick
```bash
1. 在 Commit History 中右键点击 commit
2. 选择 "Cherry-pick"
3. 确认操作
```

### Stash 管理
```bash
# 创建 Stash
1. 点击 "Stash" 按钮
2. 输入 stash 消息（可选）
3. 确认

# 应用 Stash
1. 在 Stash 列表中选择
2. 点击 "Apply" 或 "Pop"
```

## 🎓 进阶技巧

### 技巧 1: 搜索提交
```bash
1. 在 History 面板找到搜索框
2. 输入关键词：
   - 提交消息
   - 作者名称
   - Commit hash
3. 按 Enter 搜索
```

### 技巧 2: 多选文件
```bash
1. 按住 Ctrl (Mac: Cmd)
2. 点击多个文件
3. 批量 Stage/Unstage
```

### 技巧 3: 快速提交
```bash
1. 在 Commit Message 框中输入消息
2. 按 Ctrl+Enter 快速提交
   （无需点击按钮）
```

### 技巧 4: 查看分支
```bash
1. 在 History 中查看分支标签
2. 不同分支用不同颜色显示
3. 当前分支有特殊标记
```

## 🌐 Remote-SSH 使用

### 在远程服务器使用

```bash
# 1. 连接远程
Ctrl+Shift+P → "Remote-SSH: Connect to Host"

# 2. 打开远程仓库
File → Open Folder → 选择远程 Git 仓库

# 3. 等待扩展安装
首次连接需要几秒钟安装扩展

# 4. 使用 Git GUI
完全相同的操作方式！
所有 Git 操作在远程服务器执行
```

## 🐛 故障排查

### 问题 1: 找不到 Git GUI 图标

**解决方案**:
```bash
# 方案 A: 确保活动栏可见
View → Appearance → Show Activity Bar

# 方案 B: 使用命令面板
Ctrl+Shift+P → "Git GUI: Open"

# 方案 C: 重新加载窗口
Ctrl+Shift+P → "Developer: Reload Window"
```

### 问题 2: 扩展未激活

**检查**:
```bash
# 1. 确认在 Git 仓库中
git status

# 2. 查看扩展日志
View → Output → 选择 "Git GUI"

# 3. 重新安装扩展
卸载后重新安装 VSIX 文件
```

### 问题 3: 界面显示空白

**解决**:
```bash
# 1. 刷新界面
点击 "Refresh" 按钮

# 2. 重新打开
关闭面板，重新执行 "Git GUI: Open"

# 3. 检查 Git 仓库
确保当前文件夹是有效的 Git 仓库
```

### 问题 4: 操作失败

**检查**:
```bash
# 1. 查看错误信息
界面会显示错误提示

# 2. 查看日志
View → Output → Git GUI

# 3. 检查 Git 状态
在终端运行: git status
```

## 📚 完整功能列表

### ✅ 已实现功能

#### 基础操作
- [x] 查看文件状态
- [x] Stage/Unstage 文件
- [x] Commit 更改
- [x] Amend commit
- [x] Discard 更改
- [x] 查看 Diff

#### 历史查看
- [x] 提交历史列表
- [x] 图形化分支显示
- [x] Commit 详情
- [x] 搜索提交
- [x] 虚拟滚动（支持大型仓库）

#### 分支管理
- [x] 列出分支
- [x] 创建分支
- [x] 切换分支
- [x] 删除分支
- [x] 重命名分支
- [x] 合并分支

#### 高级操作
- [x] Rebase
- [x] Interactive Rebase
- [x] Cherry-pick
- [x] Stash 管理
- [x] Revert commit

#### Remote 支持
- [x] Remote-SSH 完全支持
- [x] 远程仓库操作

## 🎯 快速参考

### 常用命令
| 操作 | 快捷键/方法 |
|------|------------|
| 打开 Git GUI | `Ctrl+Shift+P` → "Git GUI: Open" |
| 刷新 | 点击刷新按钮 |
| Stage 文件 | 点击文件 |
| Commit | `Ctrl+Enter` (在消息框中) |
| 查看 Diff | 双击文件 |
| 搜索 | 在搜索框输入 |

### 界面区域
| 区域 | 功能 |
|------|------|
| Commit History | 查看提交历史和分支 |
| Changes | 管理文件更改 |
| Commit Message | 输入提交信息 |
| Stash | 管理 stash |
| Branches | 管理分支 |

## 💡 最佳实践

1. **频繁提交**: 小步提交，便于回滚
2. **清晰消息**: 使用规范的 commit message
3. **查看 Diff**: 提交前检查更改
4. **使用分支**: 功能开发使用独立分支
5. **定期 Stash**: 临时保存未完成的工作

## 📞 获取帮助

- **文档**: 查看 `docs/` 目录
- **日志**: View → Output → Git GUI
- **问题**: 提交 GitHub Issue

---

**现在开始使用**: 点击左侧活动栏的 Git 分支图标 🌿 → Open Git GUI 🚀

**提示**: 如果是第一次使用，建议先在测试仓库中尝试各种操作！
