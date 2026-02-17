# 发布配置完成总结

## ✅ 已完成的配置

### 1. 文档

- ✅ **PUBLISHING.md** - 详细的发布指南，包含开发者账户配置
- ✅ **QUICK_START_PUBLISHING.md** - 5 分钟快速开始指南
- ✅ **RELEASE_CHECKLIST.md** - 发布前检查清单
- ✅ **packages/extension/resources/README.md** - 扩展图标说明

### 2. CI/CD 配置

- ✅ **.github/workflows/ci.yml** - 持续集成
  - 自动运行测试（Node 18.x 和 20.x）
  - Lint 和格式检查
  - 类型检查
  - 构建验证
  - 上传构建产物

- ✅ **.github/workflows/release.yml** - 自动发布
  - 创建 GitHub Release 时自动触发
  - 自动发布到 VS Code Marketplace
  - 上传 .vsix 文件到 Release

### 3. 自动化脚本

- ✅ **scripts/prepare-release.sh** - 发布准备脚本
  - 自动运行所有检查
  - 更新版本号
  - 构建和打包
  - 提供下一步操作指引

### 4. 项目配置更新

- ✅ **packages/extension/package.json**
  - 添加 author、license、keywords 等元数据
  - 添加发布相关脚本
  - 优化 repository 和 bugs 链接
  - 添加 icon 和 galleryBanner 配置

- ✅ **README.md**
  - 添加发布流程说明

- ✅ **.github/PULL_REQUEST_TEMPLATE.md**
  - PR 模板，规范贡献流程

## 📋 你需要做的事情

### 必须完成（发布前）

1. **配置开发者账户**（约 10 分钟）
   - [ ] 创建 Azure DevOps 账户
   - [ ] 创建 Personal Access Token (PAT)
   - [ ] 创建 VS Code Marketplace Publisher
   - [ ] 记录 Publisher ID 和 PAT

   📖 详细步骤：[QUICK_START_PUBLISHING.md](./QUICK_START_PUBLISHING.md)

2. **更新项目信息**
   - [ ] 修改 `packages/extension/package.json` 中的 `publisher` 字段
   - [ ] 修改 `author.name` 为你的名字
   - [ ] 修改 `repository.url` 为你的 GitHub 仓库地址
   - [ ] 修改 `bugs.url` 和 `homepage` 链接

3. **配置 GitHub Secrets**
   - [ ] 在 GitHub 仓库设置中添加 `VSCE_PAT` Secret
   - [ ] 值为你的 Personal Access Token

4. **添加扩展图标**（可选但推荐）
   - [ ] 创建 128x128 的 PNG 图标
   - [ ] 保存到 `packages/extension/resources/icon.png`
   
   📖 详细说明：[packages/extension/resources/README.md](./packages/extension/resources/README.md)

### 推荐完成（提升质量）

5. **完善文档**
   - [ ] 更新 `packages/extension/README.md` 添加功能截图
   - [ ] 添加使用示例和 GIF 演示
   - [ ] 完善功能说明

6. **测试**
   - [ ] 在本地完整测试所有功能
   - [ ] 打包并安装测试：`npm run package && code --install-extension packages/extension/*.vsix`

## 🚀 首次发布流程

### 方式 1：使用自动化脚本（推荐）

```bash
# 1. 运行发布准备脚本
./scripts/prepare-release.sh patch

# 2. 更新 CHANGELOG.md
# 添加版本 0.1.1 的更新内容

# 3. 提交更改
git add .
git commit -m "chore: prepare for release v0.1.1"
git push origin main

# 4. 在 GitHub 创建 Release
# - 访问: https://github.com/your-username/git-gui-vscode/releases/new
# - Tag: v0.1.1
# - Title: v0.1.1
# - Description: 从 CHANGELOG.md 复制内容
# - 点击 "Publish release"

# 5. 等待 GitHub Actions 自动发布（约 5 分钟）
# 查看进度: https://github.com/your-username/git-gui-vscode/actions
```

### 方式 2：手动发布

```bash
# 1. 登录 vsce
npx @vscode/vsce login your-publisher-id
# 输入你的 PAT

# 2. 构建
npm run build

# 3. 发布
cd packages/extension
npx @vscode/vsce publish patch
```

## 📊 CI/CD 工作流程

### 每次 Push 到 main 分支

1. 自动运行测试（Node 18.x 和 20.x）
2. Lint 和格式检查
3. TypeScript 类型检查
4. 构建项目
5. 打包扩展
6. 上传 .vsix 文件（保留 7 天）

### 创建 GitHub Release

1. 自动触发发布流程
2. 提取版本号
3. 更新 package.json 版本
4. 运行测试
5. 构建和打包
6. 发布到 VS Code Marketplace
7. 上传 .vsix 到 Release

## 🔍 验证发布

发布成功后：

1. 访问 [VS Code Marketplace](https://marketplace.visualstudio.com/)
2. 搜索你的扩展
3. 在 VS Code 中安装：
   ```
   Ctrl+Shift+X → 搜索 "Git GUI" → 安装
   ```

## 📚 相关文档

- [QUICK_START_PUBLISHING.md](./QUICK_START_PUBLISHING.md) - 5 分钟快速开始
- [PUBLISHING.md](./PUBLISHING.md) - 详细发布指南
- [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) - 发布检查清单
- [VS Code 官方文档](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

## 🎯 下一步

1. 完成上面的"必须完成"清单
2. 阅读 [QUICK_START_PUBLISHING.md](./QUICK_START_PUBLISHING.md)
3. 配置开发者账户
4. 进行首次发布测试

## 💡 提示

- 首次发布建议使用 `0.1.0` 版本
- 发布前务必在本地完整测试
- 保存好你的 PAT，它只显示一次
- 可以先发布到私有仓库测试流程

---

**准备好了吗？** 开始阅读 [QUICK_START_PUBLISHING.md](./QUICK_START_PUBLISHING.md) 吧！
