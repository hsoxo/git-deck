# 快速开始：发布到 VS Code Marketplace

## 🚀 5 分钟快速配置

### 第 1 步：创建 Microsoft 账户（如果没有）

访问 [Microsoft 账户注册](https://signup.live.com/) 创建账户。

### 第 2 步：创建 Azure DevOps 组织和 PAT

1. 访问 [Azure DevOps](https://dev.azure.com/)
2. 登录并创建组织
3. 点击右上角用户图标 → **User settings** → **Personal access tokens**
4. 点击 **New Token**，配置：
   - Name: `vscode-marketplace`
   - Scopes: **Marketplace (Manage)**
   - Expiration: 90 天
5. 复制生成的 Token（只显示一次！）

### 第 3 步：创建 Publisher

1. 访问 [Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. 点击 **Create publisher**
3. 填写：
   - ID: `your-unique-id`（例如：`john-doe`）
   - Name: 显示名称
   - Email: 你的邮箱
4. 记住你的 Publisher ID

### 第 4 步：更新项目配置

编辑 `packages/extension/package.json`：

```json
{
  "publisher": "your-publisher-id",  // 改成你的 Publisher ID
  "author": {
    "name": "Your Name"  // 改成你的名字
  },
  "repository": {
    "url": "https://github.com/your-username/git-gui-vscode.git"  // 改成你的仓库
  }
}
```

### 第 5 步：配置 GitHub Secrets

1. 进入 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. 添加：
   - Name: `VSCE_PAT`
   - Value: 粘贴第 2 步的 Token

## 🎯 发布流程

### 方式 1：自动发布（推荐）

```bash
# 1. 准备发布（自动运行测试、构建、更新版本）
./scripts/prepare-release.sh patch  # 或 minor, major

# 2. 更新 CHANGELOG.md（添加本次更新内容）

# 3. 提交并推送
git add .
git commit -m "chore: prepare for release v0.1.1"
git push origin main

# 4. 在 GitHub 上创建 Release
# - Tag: v0.1.1
# - Title: v0.1.1
# - Description: 从 CHANGELOG.md 复制

# 5. 等待 GitHub Actions 自动发布（约 5 分钟）
```

### 方式 2：手动发布

```bash
# 1. 登录
npx @vscode/vsce login your-publisher-id
# 输入你的 PAT

# 2. 构建和发布
npm run build
cd packages/extension
npx @vscode/vsce publish patch  # 或 minor, major
```

## ✅ 验证发布

1. 访问 [VS Code Marketplace](https://marketplace.visualstudio.com/)
2. 搜索你的扩展名称
3. 在 VS Code 中安装并测试

## 📝 版本号说明

- **patch** (0.1.0 → 0.1.1): Bug 修复
- **minor** (0.1.0 → 0.2.0): 新功能
- **major** (0.1.0 → 1.0.0): 破坏性变更

## 🔧 常见问题

### 问题 1：发布失败 - 权限不足

**解决**: 确保 PAT 有 **Marketplace (Manage)** 权限。

### 问题 2：Publisher 不存在

**解决**: 在 [Marketplace Publisher Management](https://marketplace.visualstudio.com/manage) 创建 Publisher。

### 问题 3：包太大

**解决**: 检查 `.vscodeignore` 文件，确保排除了 `node_modules`, `src`, `tests` 等。

### 问题 4：GitHub Actions 失败

**解决**: 
1. 检查 `VSCE_PAT` Secret 是否正确配置
2. 查看 Actions 日志了解具体错误
3. 确保 package.json 中的 `publisher` 字段正确

## 📚 更多信息

- 详细发布指南：[PUBLISHING.md](./PUBLISHING.md)
- 发布检查清单：[RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)
- VS Code 官方文档：[Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

## 🎉 首次发布后

1. 在 README.md 中添加 Marketplace 徽章
2. 添加扩展截图到 `packages/extension/resources/`
3. 完善扩展描述和功能列表
4. 收集用户反馈并持续改进

---

**需要帮助？** 查看 [PUBLISHING.md](./PUBLISHING.md) 获取详细说明。
