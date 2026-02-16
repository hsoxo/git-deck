# Native Diff Integration

## 概述

Git GUI 现在使用 VS Code 原生的 diff 视图，提供完整的行级别 stage/unstage 功能。

## 主要改进

### 1. 欢迎视图重命名
- 视图名称从 "Git GUI" 改为 "Welcome"
- 提供清晰的介绍和使用说明
- 包含功能列表和快捷提示

### 2. 自动文件监听
- 监听工作区所有文件的变化
- 自动刷新 Changes 树视图
- 实时更新 unstaged/staged 状态
- 支持文件创建、修改、删除事件

### 3. VS Code 原生 Diff 集成
- 点击文件直接打开 VS Code 原生 diff 编辑器
- 完整支持行级别的 stage/unstage 操作
- 无需自己实现 diff 功能

## 使用方法

### 查看文件 Diff
1. 在 Changes 视图中点击任意文件
2. 自动打开 VS Code 原生 diff 编辑器
3. 左侧显示原始版本，右侧显示修改版本

### 行级别 Stage/Unstage
在 diff 编辑器中：

#### Unstaged 文件（工作区 ↔ Index）
1. 选择要 stage 的行
2. 右键菜单 → "Stage Selected Ranges"
3. 或使用快捷键（根据 VS Code 配置）

#### Staged 文件（Index ↔ HEAD）
1. 选择要 unstage 的行
2. 右键菜单 → "Unstage Selected Ranges"
3. 或使用快捷键（根据 VS Code 配置）

### 文件级别操作
在 Changes 树视图中：
- 点击 Stage 按钮：暂存整个文件
- 点击 Unstage 按钮：取消暂存整个文件
- 点击 Discard 按钮：丢弃文件的所有更改

## 技术实现

### Diff URI 方案
```typescript
// Unstaged: 工作区 vs Index
vscode.commands.executeCommand(
    'vscode.diff',
    fileUri.with({ scheme: 'git', query: '' }),  // Index
    fileUri,                                      // Working Tree
    `${filePath} (Working Tree ↔ Index)`
);

// Staged: Index vs HEAD
vscode.commands.executeCommand(
    'vscode.diff',
    fileUri.with({ scheme: 'git', query: 'HEAD' }), // HEAD
    fileUri.with({ scheme: 'git', query: '' }),      // Index
    `${filePath} (Index ↔ HEAD)`
);
```

### 文件监听
```typescript
const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');

fileWatcher.onDidChange(refreshChanges);
fileWatcher.onDidCreate(refreshChanges);
fileWatcher.onDidDelete(refreshChanges);
```

## 优势

1. **原生体验**：使用 VS Code 内置的 diff 功能，用户体验一致
2. **功能完整**：支持所有 VS Code Git 扩展的功能
3. **维护简单**：不需要自己实现和维护 diff 逻辑
4. **性能优化**：利用 VS Code 的优化和缓存机制
5. **自动更新**：文件变化自动反映在视图中

## 与 VS Code Git 扩展的关系

Git GUI 与 VS Code 内置的 Git 扩展完美配合：
- 使用相同的 diff 视图
- 共享相同的 Git 操作
- 行级别操作由 VS Code Git 扩展提供
- Git GUI 提供额外的可视化和树状视图

## 下一步

- [ ] 添加文件状态图标（M, A, D, U）
- [ ] 优化文件监听性能（debounce）
- [ ] 添加冲突文件的特殊处理
- [ ] 支持子模块的 diff 查看
