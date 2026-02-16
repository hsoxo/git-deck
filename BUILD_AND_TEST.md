# 构建和测试指南

## ✅ 构建成功

VSIX 文件已成功生成：`packages/extension/git-gui-0.1.0.vsix` (164KB)

## 🔧 构建步骤

### 完整构建流程

```bash
# 1. 构建 shared 包（必须先构建）
cd packages/shared
npm run build

# 2. 返回根目录，构建所有包
cd ../..
npm run build

# 3. 打包扩展
cd packages/extension
npm run package
```

### 快速构建（推荐）

```bash
# 从根目录一键构建和打包
npm run build
cd packages/extension
npm run package
```

## 📦 生成的文件

- `packages/extension/git-gui-0.1.0.vsix` - VS Code 扩展安装包
- `packages/extension/dist/` - 编译后的扩展代码
- `packages/extension/webview-dist/` - 编译后的 Webview 资源
- `packages/webview/dist/` - Webview 构建产物
- `packages/shared/dist/` - 共享类型定义

## 🧪 本地测试

### 1. 安装扩展

```bash
# 方式 1: 命令行安装
code --install-extension packages/extension/git-gui-0.1.0.vsix

# 方式 2: VS Code UI 安装
# 1. 打开 VS Code
# 2. Ctrl+Shift+P → "Extensions: Install from VSIX"
# 3. 选择 git-gui-0.1.0.vsix
```

### 2. 测试本地功能

```bash
# 1. 打开一个 Git 仓库
code /path/to/your/git/repo

# 2. 打开 Git GUI
Ctrl+Shift+P → "Git GUI: Open"

# 3. 测试基本功能
- 查看提交历史
- Stage/Unstage 文件
- Commit 更改
- 查看 Diff
- 分支操作
```

### 3. 测试 Remote-SSH

```bash
# 1. 连接到远程服务器
Ctrl+Shift+P → "Remote-SSH: Connect to Host"

# 2. 打开远程 Git 仓库
File → Open Folder → 选择远程仓库

# 3. 验证扩展自动安装
# 打开扩展面板，确认 Git GUI 显示在 "SSH: [服务器] - Installed"

# 4. 测试功能
Ctrl+Shift+P → "Git GUI: Open"
# 验证所有功能正常工作
```

## 🐛 常见构建问题

### 问题 1: "Module has no exported member 'RemoteInfo'"

**原因**: shared 包未构建

**解决**:
```bash
cd packages/shared
npm run build
```

### 问题 2: "vsce: command not found"

**原因**: vsce 未安装

**解决**:
```bash
npm install -g @vscode/vsce
# 或使用项目本地的 vsce
npx vsce package
```

### 问题 3: "webview-dist not found"

**原因**: webview 未构建

**解决**:
```bash
cd packages/webview
npm run build
```

### 问题 4: 构建失败，类型错误

**解决**:
```bash
# 清理并重新构建
npm run clean  # 如果有这个命令
rm -rf packages/*/dist packages/*/node_modules/.cache
npm install
npm run build
```

## 📊 构建验证

### 检查 VSIX 内容

```bash
# 查看文件大小
ls -lh packages/extension/git-gui-0.1.0.vsix

# 预期: ~160-200KB
```

### 验证关键文件

VSIX 应该包含：
- ✅ `extension/package.json` - 包含 extensionKind 配置
- ✅ `extension/dist/extension.js` - 编译后的扩展代码
- ✅ `extension/webview-dist/` - Webview 资源
- ✅ `extension/webview-dist/assets/index.js` - Webview JS
- ✅ `extension/webview-dist/assets/index.css` - Webview CSS

## 🚀 发布前检查

### 代码质量检查

```bash
# 运行 linter
npm run lint

# 运行测试
npm test

# 生成测试覆盖率
npm run test:coverage
```

### 功能测试检查清单

- [ ] 本地环境所有功能正常
- [ ] Remote-SSH 环境所有功能正常
- [ ] 性能测试通过
- [ ] 错误处理正常
- [ ] 文档完整

### package.json 验证

```bash
# 检查关键配置
cat packages/extension/package.json | grep -A 2 "extensionKind"
# 应该显示: "extensionKind": ["workspace"]

cat packages/extension/package.json | grep -A 2 "activationEvents"
# 应该包含: "workspaceContains:.git"

cat packages/extension/package.json | grep "main"
# 应该显示: "main": "./dist/extension.js"
```

## 📝 构建日志

### 最近一次构建

- **日期**: 2026-02-16
- **版本**: 0.1.0
- **大小**: 164KB
- **状态**: ✅ 成功

### 构建输出

```
✓ Shared package built
✓ Webview built (179.92 KB)
✓ Extension built (73.29 KB)
✓ VSIX packaged (163.53 KB)
```

## 🔄 持续集成

### GitHub Actions 示例

```yaml
name: Build and Package

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build shared
        run: npm run build --workspace=@git-gui/shared
      
      - name: Build all
        run: npm run build
      
      - name: Run tests
        run: npm test
      
      - name: Package extension
        run: |
          cd packages/extension
          npm run package
      
      - name: Upload VSIX
        uses: actions/upload-artifact@v3
        with:
          name: extension-vsix
          path: packages/extension/*.vsix
```

## 📚 相关文档

- [部署指南](./docs/06-DEPLOYMENT_AND_INSTALL.md)
- [Remote SSH 支持](./docs/07-REMOTE_SSH_SUPPORT.md)
- [Remote SSH 快速开始](./docs/REMOTE_SSH_QUICK_START.md)
- [Remote SSH 测试](./docs/08-REMOTE_SSH_TESTING.md)

## 💡 提示

1. **首次构建**: 确保先构建 shared 包
2. **增量构建**: 修改代码后只需运行 `npm run build`
3. **清理构建**: 删除 `dist` 目录后重新构建
4. **调试模式**: 使用 `npm run dev:extension` 和 `npm run dev:webview`

## ✨ 下一步

现在你可以：

1. ✅ 安装并测试扩展
2. ✅ 在 Remote-SSH 环境测试
3. ✅ 准备发布到 Marketplace

---

**构建成功！** 🎉
