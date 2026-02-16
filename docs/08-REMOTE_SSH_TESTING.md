# Remote SSH 测试指南

## 测试环境准备

### 1. 准备远程服务器

确保你有一个可以通过 SSH 访问的远程服务器：
- Linux/macOS/Windows (WSL)
- 已安装 Git >= 2.20.0
- 已安装 Node.js >= 18.0.0（如果需要调试）

### 2. 配置 SSH 连接

在本地 VS Code 中配置 SSH：

```bash
# 编辑 SSH 配置
~/.ssh/config

# 添加远程主机
Host my-remote-server
    HostName 192.168.1.100
    User your-username
    IdentityFile ~/.ssh/id_rsa
```

## 测试步骤

### 步骤 1: 构建扩展

```bash
# 在本地构建扩展
cd git-gui-vscode
npm install
npm run build

# 打包为 VSIX
cd packages/extension
npm run package
```

### 步骤 2: 安装扩展

```bash
# 在本地 VS Code 安装
code --install-extension git-gui-0.1.0.vsix
```

### 步骤 3: 连接到远程服务器

1. 打开 VS Code
2. 按 `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
3. 输入 "Remote-SSH: Connect to Host"
4. 选择你的远程服务器
5. 等待连接建立

### 步骤 4: 打开远程 Git 仓库

在远程窗口中：
1. File → Open Folder
2. 选择远程服务器上的 Git 仓库
3. 等待扩展自动安装到远程

### 步骤 5: 验证扩展安装

检查扩展是否正确安装到远程：

1. 打开扩展面板 (`Ctrl+Shift+X`)
2. 在搜索框中输入 "Git GUI"
3. 确认扩展显示在 "SSH: your-server - Installed" 部分

### 步骤 6: 测试基本功能

#### 6.1 打开 Git GUI

```bash
Ctrl+Shift+P → "Git GUI: Open"
```

预期结果：
- ✅ Webview 面板打开
- ✅ 显示远程仓库的提交历史
- ✅ 显示文件状态

#### 6.2 测试 Stage 操作

1. 修改远程仓库中的文件
2. 在 Git GUI 中查看更改
3. Stage 文件
4. 提交更改

预期结果：
- ✅ 能看到文件更改
- ✅ Stage 操作成功
- ✅ Commit 操作成功

#### 6.3 测试 History 查看

1. 查看提交历史
2. 点击不同的 commit
3. 查看 commit 详情

预期结果：
- ✅ 提交历史正确显示
- ✅ 图形化分支正确渲染
- ✅ Commit 详情正确显示

#### 6.4 测试 Branch 操作

1. 创建新分支
2. 切换分支
3. 合并分支

预期结果：
- ✅ 分支操作成功
- ✅ 分支列表正确更新

#### 6.5 测试 Rebase 操作

1. 选择一个 commit
2. 执行 rebase
3. 处理冲突（如果有）

预期结果：
- ✅ Rebase 操作成功
- ✅ 冲突处理正常

## 性能测试

### 测试不同网络延迟

使用 `tc` 命令模拟网络延迟（Linux）：

```bash
# 添加 100ms 延迟
sudo tc qdisc add dev eth0 root netem delay 100ms

# 测试扩展性能
# 记录操作响应时间

# 移除延迟
sudo tc qdisc del dev eth0 root
```

### 测试大型仓库

在远程服务器上克隆大型仓库：

```bash
# 克隆 Linux 内核（大型仓库）
git clone https://github.com/torvalds/linux.git

# 在 VS Code 中打开
# 测试 Git GUI 性能
```

预期结果：
- ✅ 初次加载 < 5 秒
- ✅ 滚动流畅
- ✅ 操作响应 < 2 秒

## 故障排查

### 问题 1: 扩展未安装到远程

**症状**: 连接到远程后，扩展列表中没有 Git GUI

**解决方案**:
1. 检查 `package.json` 中的 `extensionKind` 配置
2. 确认为 `["workspace"]`
3. 重新打包并安装扩展

### 问题 2: Webview 显示空白

**症状**: Git GUI 面板打开但内容为空

**解决方案**:
1. 打开 Remote 窗口的开发者工具
2. 检查 Console 中的错误
3. 确认 `webview-dist` 文件夹已包含在 VSIX 中
4. 检查资源路径是否正确使用 `asWebviewUri()`

### 问题 3: Git 操作失败

**症状**: Stage/Commit 等操作报错

**解决方案**:
1. 在远程终端中测试 Git 命令
2. 检查 Git 版本: `git --version`
3. 检查仓库状态: `git status`
4. 查看扩展日志: Output → Git GUI

### 问题 4: 性能问题

**症状**: 操作缓慢或卡顿

**解决方案**:
1. 检查网络延迟: `ping remote-server`
2. 减少加载的 commit 数量（配置中）
3. 检查远程服务器资源使用情况
4. 考虑使用本地缓存

## 调试技巧

### 查看扩展日志

```bash
# 在 Remote 窗口中
View → Output → 选择 "Git GUI"
```

### 查看 Webview 日志

```bash
# 右键点击 Webview 面板
# 选择 "Open Webview Developer Tools"
# 查看 Console 标签
```

### 查看 RPC 通信

在 `RPCServer.ts` 中添加日志：

```typescript
async handle(message: any): Promise<any> {
    logger.debug('RPC Request:', message);
    const result = await this.handlers[message.method](...message.params);
    logger.debug('RPC Response:', result);
    return result;
}
```

## 自动化测试

### 创建测试脚本

```bash
#!/bin/bash
# test-remote.sh

echo "Testing Git GUI in Remote-SSH environment..."

# 连接到远程
code --remote ssh-remote+my-server /path/to/repo

# 等待连接
sleep 5

# 打开 Git GUI
code --remote ssh-remote+my-server --command gitGui.open

echo "Manual testing required - check the opened window"
```

## 测试检查清单

### 基本功能
- [ ] 扩展自动安装到远程
- [ ] Webview 正常显示
- [ ] 提交历史正确加载
- [ ] 文件状态正确显示

### Git 操作
- [ ] Stage/Unstage 文件
- [ ] Commit 更改
- [ ] Amend commit
- [ ] Discard 更改
- [ ] 查看 Diff

### 高级操作
- [ ] Rebase
- [ ] Cherry-pick
- [ ] Stash
- [ ] Branch 管理
- [ ] Merge

### 性能
- [ ] 初次加载 < 5 秒
- [ ] 操作响应 < 2 秒
- [ ] 大仓库可用
- [ ] 高延迟网络可用

### 错误处理
- [ ] 非 Git 仓库提示
- [ ] Git 命令失败提示
- [ ] 网络断开恢复
- [ ] 冲突处理

## 测试报告模板

```markdown
# Git GUI Remote-SSH 测试报告

## 测试环境
- 本地系统: [Windows/macOS/Linux]
- 远程系统: [Linux/macOS/Windows]
- VS Code 版本: [版本号]
- Git 版本: [版本号]
- 网络延迟: [延迟时间]

## 测试结果

### 基本功能
- 扩展安装: [✅/❌]
- Webview 显示: [✅/❌]
- 历史加载: [✅/❌]

### Git 操作
- Stage: [✅/❌]
- Commit: [✅/❌]
- Rebase: [✅/❌]
- Branch: [✅/❌]

### 性能
- 初次加载: [时间]
- 操作响应: [时间]

### 问题
[列出遇到的问题]

### 建议
[改进建议]
```

## 持续集成

### GitHub Actions 示例

```yaml
name: Test Remote Extension

on: [push, pull_request]

jobs:
  test-remote:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build extension
        run: npm run build
      
      - name: Package extension
        run: |
          cd packages/extension
          npm run package
      
      - name: Upload VSIX
        uses: actions/upload-artifact@v3
        with:
          name: extension
          path: packages/extension/*.vsix
```

## 参考资料

- [VS Code Remote Development](https://code.visualstudio.com/docs/remote/remote-overview)
- [Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Remote Extension Guide](https://code.visualstudio.com/api/advanced-topics/remote-extensions)
