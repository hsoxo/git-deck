# 发布检查清单

在发布新版本之前，请确保完成以下步骤：

## 发布前准备

### 1. 代码质量检查

- [ ] 所有测试通过
  ```bash
  npm run test:all
  ```

- [ ] 代码格式检查通过
  ```bash
  npm run format:check
  npm run lint
  ```

- [ ] TypeScript 类型检查通过
  ```bash
  npm run tsc
  ```

### 2. 功能测试

- [ ] 在本地 VS Code 中测试扩展
  ```bash
  npm run build
  npm run package
  code --install-extension packages/extension/git-gui-*.vsix
  ```

- [ ] 测试主要功能：
  - [ ] 查看文件变更
  - [ ] Stage/Unstage 文件
  - [ ] 提交代码
  - [ ] 查看 Git Graph
  - [ ] 查看 Diff
  - [ ] Amend commit
  - [ ] Push/Pull

### 3. 文档更新

- [ ] 更新 CHANGELOG.md
  - 添加新版本号和日期
  - 列出新功能
  - 列出 Bug 修复
  - 列出破坏性变更（如果有）

- [ ] 更新 README.md（如果有新功能）

- [ ] 检查所有文档链接是否有效

### 4. 版本号更新

- [ ] 确定版本号类型（patch/minor/major）
  - **Patch** (0.1.x): Bug 修复
  - **Minor** (0.x.0): 新功能，向后兼容
  - **Major** (x.0.0): 破坏性变更

- [ ] 更新版本号
  ```bash
  cd packages/extension
  npm version patch  # 或 minor, major
  ```

### 5. Git 操作

- [ ] 提交所有更改
  ```bash
  git add .
  git commit -m "chore: prepare for release v0.x.x"
  ```

- [ ] 推送到远程仓库
  ```bash
  git push origin main
  ```

- [ ] 等待 CI 通过

## 发布流程

### 方式 1: 使用 GitHub Release（推荐，自动发布）

1. [ ] 在 GitHub 上创建新的 Release
   - 进入仓库 → Releases → Create a new release
   - Tag: `v0.x.x`（必须以 v 开头）
   - Title: `v0.x.x`
   - Description: 从 CHANGELOG.md 复制相关内容
   - 点击 "Publish release"

2. [ ] 等待 GitHub Actions 自动发布到 Marketplace
   - 查看 Actions 标签页确认发布状态
   - 发布成功后会自动上传 .vsix 文件到 Release

### 方式 2: 手动发布

1. [ ] 构建和打包
   ```bash
   npm run build
   npm run package
   ```

2. [ ] 发布到 Marketplace
   ```bash
   cd packages/extension
   vsce publish
   ```

3. [ ] 创建 Git tag
   ```bash
   git tag v0.x.x
   git push origin v0.x.x
   ```

## 发布后验证

- [ ] 在 [VS Code Marketplace](https://marketplace.visualstudio.com/) 上确认新版本已发布

- [ ] 在 VS Code 中搜索并安装扩展，验证功能正常

- [ ] 检查扩展页面显示是否正确
  - 图标
  - 描述
  - 截图
  - README

- [ ] 在 GitHub 上创建 Release（如果使用手动发布）

## 发布后工作

- [ ] 在社交媒体/论坛宣布新版本（可选）

- [ ] 监控 GitHub Issues 中的用户反馈

- [ ] 更新项目看板/任务列表

## 回滚流程（如果需要）

如果发现严重问题需要回滚：

1. [ ] 在 Marketplace 上取消发布（unpublish）
   ```bash
   vsce unpublish
   ```

2. [ ] 修复问题并发布 patch 版本

3. [ ] 在 GitHub Release 中标注问题版本

## 常用命令

```bash
# 查看当前版本
npm version

# 构建
npm run build

# 打包
npm run package

# 发布 patch 版本（0.1.0 -> 0.1.1）
npm run publish:patch

# 发布 minor 版本（0.1.0 -> 0.2.0）
npm run publish:minor

# 发布 major 版本（0.1.0 -> 1.0.0）
npm run publish:major

# 查看打包内容
npx @vscode/vsce ls
```

## 注意事项

1. **版本号**: 必须遵循语义化版本规范
2. **CHANGELOG**: 每次发布都要更新
3. **测试**: 发布前必须在本地完整测试
4. **CI/CD**: 确保 CI 通过后再发布
5. **备份**: 发布前确保代码已推送到远程仓库
