# Changes Tree View Feature

## 概述

现在 Unstaged/Staged Changes 已经移到了 VS Code 侧边栏的 Git GUI 视图中，以树状文件夹结构展示。

## 功能特性

### 1. 树状文件结构
- 文件按照文件夹层级组织
- 文件夹可以展开/折叠
- 文件夹优先排序，然后按字母顺序排列

### 2. 两个独立的区域
- **Unstaged Changes**: 显示未暂存的修改和未跟踪的文件
- **Staged Changes**: 显示已暂存的文件

### 3. 快捷操作
- 点击文件：查看 diff
- Stage 按钮：暂存单个文件（Unstaged 区域）
- Unstage 按钮：取消暂存单个文件（Staged 区域）
- Discard 按钮：丢弃更改（Unstaged 区域）
- Stage All：暂存所有更改（标题栏按钮）
- Unstage All：取消暂存所有更改（右键菜单）

### 4. 视图位置
在 VS Code 左侧活动栏中点击 Git GUI 图标，即可看到：
- Git GUI 欢迎视图（顶部）
- Changes 树视图（下方）

## 使用方法

1. 打开 VS Code
2. 点击左侧活动栏的 Git GUI 图标
3. 在 "Changes" 视图中查看文件树
4. 使用内联按钮进行 stage/unstage/discard 操作
5. 点击文件查看 diff

## 技术实现

- 使用 VS Code TreeDataProvider API
- 自动构建文件树结构
- 集成 Git 操作命令
- 支持刷新和自动更新

## 下一步优化

- [ ] 添加文件状态图标（M, A, D, U 等）
- [ ] 支持多选文件批量操作
- [ ] 添加搜索/过滤功能
- [ ] 支持拖拽 stage/unstage
- [ ] 显示文件变更统计（+/-）
