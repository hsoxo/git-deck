# 07 - Remote SSH Support Requirements

## 概述

本文档定义了 Git GUI 扩展对 VS Code Remote-SSH 环境的支持需求。目标是让扩展在远程 SSH 连接环境下能够完全正常工作，提供与本地开发相同的用户体验。

## 背景

当前扩展在 Remote-SSH 环境下无法正常工作，主要问题：
1. 扩展未正确安装到远程服务器
2. Webview 资源加载路径不正确
3. 扩展激活机制在远程环境下失败
4. RPC 通信在远程环境下可能存在问题

## 最佳方案：Remote Extension Host 架构

采用 VS Code 官方推荐的 Remote Extension Host 架构，确保扩展在远程服务器上正确运行。

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    本地 VS Code Client                       │
│  - UI 渲染                                                   │
│  - 用户交互                                                  │
│  - Webview 显示                                              │
└────────────────────────┬────────────────────────────────────┘
                         │ SSH Tunnel
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  远程 Extension Host                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Git GUI Extension                                    │  │
│  │  - Git 操作（在远程执行）                             │  │
│  │  - 文件系统访问（远程文件）                           │  │
│  │  - RPC Server                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Webview Panel                                        │  │
│  │  - HTML/CSS/JS 资源                                   │  │
│  │  - 通过 VS Code API 传输到本地渲染                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 功能需求

### FR-1: 扩展自动安装到远程

**优先级**: P0（必须）

**描述**: 当用户通过 Remote-SSH 连接到远程服务器时，扩展应自动安装到远程环境。

**实现要点**:
- 在 `package.json` 中正确配置 `extensionKind`
- 支持 `workspace` 和 `ui` 两种模式
- 默认使用 `workspace` 模式（在远程运行）

**验收标准**:
- 连接到远程服务器后，扩展自动安装
- 扩展图标显示在远程扩展列表中
- 命令面板中可以找到 Git GUI 命令

### FR-2: Webview 资源正确加载

**优先级**: P0（必须）

**描述**: Webview 的 HTML、CSS、JS 资源在远程环境下能够正确加载和显示。

**实现要点**:
- 使用 `webview.asWebviewUri()` 转换资源路径
- 资源文件必须包含在 VSIX 包中
- 正确配置 CSP（Content Security Policy）
- 支持 VS Code 的资源隧道机制

**验收标准**:
- Webview 面板能够正常打开
- 所有 CSS 样式正确应用
- JavaScript 代码正常执行
- 图片和字体资源正确加载

### FR-3: Git 操作在远程执行

**优先级**: P0（必须）

**描述**: 所有 Git 操作必须在远程服务器上执行，操作远程仓库。

**实现要点**:
- GitService 使用远程工作区路径
- simple-git 在远程环境中执行
- 文件路径使用远程文件系统路径
- 正确处理远程文件系统的权限

**验收标准**:
- 能够读取远程仓库的 Git 状态
- 能够执行 stage、commit、push 等操作
- 能够查看远程仓库的提交历史
- 能够进行分支操作

### FR-4: RPC 通信适配远程环境

**优先级**: P0（必须）

**描述**: Webview 与扩展后端的 RPC 通信在远程环境下正常工作。

**实现要点**:
- 使用 VS Code 的 `postMessage` API
- 消息通过 SSH 隧道自动传输
- 正确处理消息序列化和反序列化
- 实现超时和错误处理机制

**验收标准**:
- Webview 能够调用后端 RPC 方法
- 后端能够返回结果到 Webview
- 大数据量传输不会超时
- 错误能够正确传递和显示

### FR-5: 扩展激活机制

**优先级**: P0（必须）

**描述**: 扩展在远程环境下能够正确激活。

**实现要点**:
- 使用 `onCommand` 激活事件
- 检测远程工作区是否为 Git 仓库
- 提供友好的错误提示
- 支持多工作区环境

**验收标准**:
- 打开远程工作区后扩展自动激活
- 非 Git 仓库时给出友好提示
- 命令在命令面板中可见
- 扩展日志正确输出到输出面板

### FR-6: 性能优化

**优先级**: P1（重要）

**描述**: 在远程环境下保持良好的性能，减少网络延迟影响。

**实现要点**:
- 实现本地缓存机制
- 批量处理 Git 操作
- 使用增量更新而非全量刷新
- 压缩传输数据

**验收标准**:
- 初次加载时间 < 3 秒
- 操作响应时间 < 1 秒
- 大仓库（1000+ 提交）性能可接受
- 网络延迟 100ms 时仍可用

### FR-7: 离线和断线处理

**优先级**: P2（可选）

**描述**: 处理 SSH 连接断开和网络不稳定的情况。

**实现要点**:
- 检测连接状态
- 自动重连机制
- 缓存未完成的操作
- 显示连接状态指示器

**验收标准**:
- 连接断开时显示友好提示
- 重新连接后自动恢复
- 未完成的操作不会丢失
- 用户能够手动重试失败的操作

## 技术实现要点

### 1. package.json 配置

```json
{
  "name": "git-gui",
  "extensionKind": [
    "workspace"
  ],
  "activationEvents": [
    "onCommand:gitGui.open",
    "workspaceContains:.git"
  ],
  "main": "./dist/extension.js",
  "browser": "./dist/web-extension.js"
}
```

### 2. 资源路径处理

```typescript
// 正确的资源路径处理
const webviewPath = vscode.Uri.joinPath(this.extensionUri, 'webview-dist');
const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(webviewPath, 'assets', 'index.js')
);
```

### 3. 工作区路径处理

```typescript
// 使用 VS Code API 获取远程路径
const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
if (!workspaceFolder) {
    throw new Error('No workspace folder found');
}
const repoPath = workspaceFolder.uri.fsPath; // 自动处理远程路径
```

### 4. CSP 配置

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'none'; 
               style-src ${webview.cspSource} 'unsafe-inline'; 
               script-src 'nonce-${nonce}'; 
               img-src ${webview.cspSource} https: data:; 
               font-src ${webview.cspSource};">
```

## 测试需求

### 测试环境

1. **本地环境**: 验证本地功能不受影响
2. **Remote-SSH 环境**: 
   - Linux 远程服务器
   - macOS 远程服务器
   - Windows 远程服务器（WSL）
3. **网络条件**:
   - 低延迟（< 50ms）
   - 中等延迟（50-200ms）
   - 高延迟（> 200ms）

### 测试用例

#### TC-1: 基本功能测试
- 连接到远程服务器
- 打开 Git 仓库
- 执行 Git GUI: Open 命令
- 验证 Webview 正常显示

#### TC-2: Git 操作测试
- 查看 Git 状态
- Stage 文件
- Commit 更改
- 查看提交历史
- 切换分支

#### TC-3: 性能测试
- 测量初次加载时间
- 测量操作响应时间
- 测试大仓库性能
- 测试高延迟网络

#### TC-4: 错误处理测试
- 非 Git 仓库
- Git 命令失败
- 网络断开
- 权限不足

#### TC-5: 兼容性测试
- VS Code 不同版本
- 不同操作系统
- 不同 Git 版本

## 文档需求

### 用户文档

1. **安装指南**: 如何在 Remote-SSH 环境下安装扩展
2. **使用指南**: Remote-SSH 环境下的特殊注意事项
3. **故障排查**: 常见问题和解决方案

### 开发文档

1. **架构文档**: Remote Extension Host 架构说明
2. **调试指南**: 如何调试远程扩展
3. **性能优化**: 远程环境性能优化技巧

## 里程碑

### Milestone 1: 基础支持（2 周）
- [ ] 配置 extensionKind
- [ ] 修复资源路径问题
- [ ] 实现基本的远程 Git 操作
- [ ] 基础测试通过

### Milestone 2: 功能完善（2 周）
- [ ] 实现所有 Git 操作
- [ ] 优化 RPC 通信
- [ ] 添加错误处理
- [ ] 完整测试覆盖

### Milestone 3: 性能优化（1 周）
- [ ] 实现缓存机制
- [ ] 优化数据传输
- [ ] 性能测试达标
- [ ] 用户体验优化

### Milestone 4: 文档和发布（1 周）
- [ ] 完善用户文档
- [ ] 完善开发文档
- [ ] 发布 Beta 版本
- [ ] 收集用户反馈

## 风险和挑战

### 技术风险

1. **VS Code API 限制**: 某些 API 在远程环境下可能有限制
   - 缓解措施: 提前验证所有使用的 API

2. **网络延迟**: 高延迟网络影响用户体验
   - 缓解措施: 实现本地缓存和乐观更新

3. **资源加载**: Webview 资源在远程环境下加载可能失败
   - 缓解措施: 充分测试资源路径处理

### 兼容性风险

1. **VS Code 版本**: 不同版本的 Remote-SSH 行为可能不同
   - 缓解措施: 测试多个 VS Code 版本

2. **操作系统差异**: 不同操作系统的路径处理不同
   - 缓解措施: 使用 VS Code 的路径 API

## 成功标准

1. ✅ 扩展在 Remote-SSH 环境下能够正常安装和激活
2. ✅ 所有核心功能在远程环境下正常工作
3. ✅ 性能指标达到要求（加载 < 3s，操作 < 1s）
4. ✅ 通过所有测试用例
5. ✅ 用户文档完整清晰
6. ✅ 至少 90% 的用户反馈为正面

## 参考资料

- [VS Code Remote Development](https://code.visualstudio.com/docs/remote/remote-overview)
- [VS Code Extension API - Remote Development](https://code.visualstudio.com/api/advanced-topics/remote-extensions)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Extension Capabilities](https://code.visualstudio.com/api/extension-capabilities/common-capabilities)
