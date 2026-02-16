# Remote-SSH 实现检查清单

## ✅ 代码修改

### package.json 配置
- [x] 添加 `"extensionKind": ["workspace"]`
- [x] 添加 `"workspaceContains:.git"` 激活事件
- [x] 修正 `main` 入口为 `"./dist/extension.js"`

### .vscodeignore 配置
- [x] 移除 `test-extension.js` 引用
- [x] 确保包含 `!webview-dist/**`
- [x] 确保包含 `!dist/**`

### 代码验证
- [x] `extension.ts` 使用 `workspaceFolder.uri.fsPath`
- [x] `GitGuiPanel.ts` 使用 `webview.asWebviewUri()`
- [x] `GitService.ts` 接受路径参数
- [x] CSP 配置使用 `webview.cspSource`

## ✅ 文档创建

### 新增文档
- [x] `docs/REMOTE_SSH_QUICK_START.md` - 快速上手指南
- [x] `docs/08-REMOTE_SSH_TESTING.md` - 测试指南
- [x] `REMOTE_SSH_IMPLEMENTATION.md` - 实现总结

### 更新文档
- [x] `docs/07-REMOTE_SSH_SUPPORT.md` - 更新为实现状态
- [x] `README.md` - 添加 Remote SSH 功能说明

## 🧪 测试准备

### 构建测试
- [ ] 运行 `npm install`
- [ ] 运行 `npm run build`
- [ ] 运行 `npm test`
- [ ] 检查构建产物存在

### 打包测试
- [ ] 运行 `cd packages/extension && npm run package`
- [ ] 检查 `.vsix` 文件生成
- [ ] 解压 `.vsix` 验证内容
  - [ ] `dist/` 目录存在
  - [ ] `webview-dist/` 目录存在
  - [ ] `package.json` 正确

### 本地安装测试
- [ ] 运行 `code --install-extension git-gui-0.1.0.vsix`
- [ ] 打开本地 Git 仓库
- [ ] 运行 `Git GUI: Open` 命令
- [ ] 验证所有功能正常

## 🌐 Remote-SSH 测试

### 环境准备
- [ ] 准备远程 Linux 服务器
- [ ] 配置 SSH 连接
- [ ] 在远程服务器安装 Git >= 2.20.0
- [ ] 在远程服务器准备测试 Git 仓库

### 连接测试
- [ ] 在本地 VS Code 安装扩展
- [ ] 连接到远程服务器
- [ ] 打开远程 Git 仓库
- [ ] 验证扩展自动安装到远程

### 功能测试

#### 基础功能
- [ ] 扩展激活成功
- [ ] Webview 面板打开
- [ ] 提交历史正确显示
- [ ] 文件状态正确显示

#### Stage & Commit
- [ ] 修改文件能被检测
- [ ] Stage 文件成功
- [ ] Unstage 文件成功
- [ ] Commit 成功
- [ ] Amend commit 成功
- [ ] Discard 更改成功

#### History & Graph
- [ ] 提交历史加载
- [ ] 图形化分支显示
- [ ] 点击 commit 查看详情
- [ ] 搜索功能正常
- [ ] 虚拟滚动正常

#### Branch 操作
- [ ] 列出分支
- [ ] 创建分支
- [ ] 切换分支
- [ ] 删除分支
- [ ] 重命名分支
- [ ] 合并分支

#### 高级操作
- [ ] Rebase 操作
- [ ] Interactive Rebase
- [ ] Cherry-pick
- [ ] Stash 管理
- [ ] Revert commit

#### Diff 查看
- [ ] 查看 unstaged diff
- [ ] 查看 staged diff
- [ ] 查看 commit diff
- [ ] Diff 统计正确

### 性能测试
- [ ] 初次加载时间 < 5 秒
- [ ] 操作响应时间 < 2 秒
- [ ] 大仓库（1000+ commits）可用
- [ ] 高延迟网络（100ms+）可用

### 错误处理测试
- [ ] 非 Git 仓库提示
- [ ] Git 命令失败提示
- [ ] 冲突处理正常
- [ ] 网络断开恢复

## 📊 性能基准

### 目标指标
- 初次加载: < 5 秒
- 操作响应: < 2 秒
- 支持 commits: 10,000+
- 网络延迟容忍: 200ms

### 实际测试结果
- [ ] 初次加载: _____ 秒
- [ ] Stage 操作: _____ 秒
- [ ] Commit 操作: _____ 秒
- [ ] 加载 100 commits: _____ 秒
- [ ] 加载 1000 commits: _____ 秒

## 🐛 问题记录

### 发现的问题
1. 
2. 
3. 

### 已解决的问题
1. ✅ package.json 缺少 extensionKind
2. ✅ main 入口路径错误
3. ✅ .vscodeignore 包含测试文件

## 📝 测试报告

### 测试环境
- 本地系统: _____
- 远程系统: _____
- VS Code 版本: _____
- Git 版本: _____
- 网络延迟: _____

### 测试结果
- 基础功能: [ ] 通过 / [ ] 失败
- Git 操作: [ ] 通过 / [ ] 失败
- 高级功能: [ ] 通过 / [ ] 失败
- 性能测试: [ ] 通过 / [ ] 失败

### 测试结论
- [ ] ✅ 可以发布
- [ ] ⚠️ 需要修复问题后发布
- [ ] ❌ 不建议发布

## 🚀 发布准备

### 发布前检查
- [ ] 所有测试通过
- [ ] 文档完整
- [ ] CHANGELOG 更新
- [ ] 版本号更新
- [ ] 截图更新（如需要）

### 发布步骤
- [ ] 创建 Git tag
- [ ] 推送到仓库
- [ ] 发布到 Marketplace
- [ ] 发布 Release Notes

## 📚 文档检查

### 用户文档
- [x] README.md 包含 Remote SSH 说明
- [x] 快速开始指南完整
- [x] 故障排查指南完整

### 开发文档
- [x] 架构文档完整
- [x] 测试指南完整
- [x] 实现细节文档完整

## ✨ 最终确认

- [ ] 代码审查完成
- [ ] 测试全部通过
- [ ] 文档审查完成
- [ ] 性能达标
- [ ] 准备发布

---

**检查日期**: _____  
**检查人**: _____  
**状态**: [ ] 待测试 / [ ] 测试中 / [ ] 已完成
