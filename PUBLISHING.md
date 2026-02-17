# 发布 Git GUI 扩展到 VS Code Marketplace

## 前置准备

### 1. 创建 Azure DevOps 账户和 Personal Access Token (PAT)

VS Code Marketplace 使用 Azure DevOps 进行身份验证。

#### 步骤：

1. 访问 [Azure DevOps](https://dev.azure.com/)
2. 使用 Microsoft 账户登录（如果没有，需要先注册）
3. 创建一个组织（Organization）

#### 创建 Personal Access Token：

1. 点击右上角的用户图标 → **User settings** → **Personal access tokens**
2. 点击 **New Token**
3. 配置 Token：
   - **Name**: `vscode-marketplace-publisher`
   - **Organization**: 选择你的组织
   - **Expiration**: 建议选择 90 天或自定义
   - **Scopes**: 选择 **Custom defined**
     - 勾选 **Marketplace** → **Manage**（这是发布扩展所需的权限）
4. 点击 **Create**
5. **重要**: 复制生成的 Token 并保存到安全的地方（只会显示一次）

### 2. 创建 Publisher

1. 访问 [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. 使用同一个 Microsoft 账户登录
3. 点击 **Create publisher**
4. 填写信息：
   - **ID**: 唯一标识符（例如：`your-name` 或 `your-company`）
   - **Name**: 显示名称
   - **Email**: 联系邮箱
5. 创建完成后，记住你的 Publisher ID

### 3. 更新 package.json

将 `packages/extension/package.json` 中的 `publisher` 字段更新为你的 Publisher ID：

```json
{
  "publisher": "your-publisher-id"
}
```

### 4. 配置 vsce（VS Code Extension Manager）

安装 vsce（如果还没安装）：

```bash
npm install -g @vscode/vsce
```

使用 PAT 登录：

```bash
vsce login your-publisher-id
```

输入你在步骤 1 中创建的 Personal Access Token。

## 手动发布

### 1. 构建扩展

```bash
npm run build
```

### 2. 打包扩展

```bash
npm run package
```

这会在 `packages/extension/` 目录下生成 `.vsix` 文件。

### 3. 发布到 Marketplace

```bash
cd packages/extension
vsce publish
```

或者指定版本号：

```bash
vsce publish patch  # 0.1.0 -> 0.1.1
vsce publish minor  # 0.1.0 -> 0.2.0
vsce publish major  # 0.1.0 -> 1.0.0
```

## 使用 CI/CD 自动发布

### GitHub Actions 配置

1. 在 GitHub 仓库中添加 Secret：
   - 进入仓库 → **Settings** → **Secrets and variables** → **Actions**
   - 点击 **New repository secret**
   - 添加以下 Secret：
     - **Name**: `VSCE_PAT`
     - **Value**: 你的 Personal Access Token

2. 推送代码时，CI/CD 会自动运行测试和构建

3. 创建 Release 时，会自动发布到 Marketplace：
   - 进入 GitHub 仓库 → **Releases** → **Create a new release**
   - 创建新的 tag（例如：`v0.1.0`）
   - 填写 Release notes
   - 点击 **Publish release**

### 发布流程

1. **开发阶段**: 每次 push 到 `main` 分支会触发测试和构建
2. **发布阶段**: 创建 GitHub Release 会自动发布到 Marketplace

## 版本管理

建议使用语义化版本（Semantic Versioning）：

- **MAJOR** (1.0.0): 不兼容的 API 变更
- **MINOR** (0.1.0): 向后兼容的功能新增
- **PATCH** (0.0.1): 向后兼容的问题修复

更新版本：

```bash
# 在 packages/extension 目录下
npm version patch  # 或 minor, major
```

## 测试本地安装

在发布前，可以先测试本地安装：

```bash
# 打包
npm run package

# 安装到 VS Code
code --install-extension packages/extension/git-gui-*.vsix
```

## 常见问题

### 1. 发布失败：权限不足

确保 PAT 有 **Marketplace (Manage)** 权限。

### 2. Publisher 不存在

确保已在 [Marketplace Publisher Management](https://marketplace.visualstudio.com/manage) 创建 Publisher。

### 3. 包大小过大

检查 `.vscodeignore` 文件，确保排除了不必要的文件（如 `node_modules`, `src`, `tests` 等）。

## 相关链接

- [VS Code Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce Documentation](https://github.com/microsoft/vscode-vsce)
- [Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
- [Azure DevOps](https://dev.azure.com/)
