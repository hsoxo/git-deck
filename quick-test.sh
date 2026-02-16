#!/bin/bash

# Git GUI 快速测试脚本

set -e

echo "🚀 Git GUI 快速测试脚本"
echo "========================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 VSIX 文件
echo -e "${BLUE}📦 检查 VSIX 文件...${NC}"
if [ -f "packages/extension/git-gui-0.1.0.vsix" ]; then
    SIZE=$(ls -lh packages/extension/git-gui-0.1.0.vsix | awk '{print $5}')
    echo -e "${GREEN}✓ VSIX 文件存在 (${SIZE})${NC}"
else
    echo -e "${RED}✗ VSIX 文件不存在${NC}"
    echo -e "${YELLOW}运行: cd packages/extension && npm run package${NC}"
    exit 1
fi

echo ""

# 检查 VS Code
echo -e "${BLUE}🔍 检查 VS Code...${NC}"
if command -v code &> /dev/null; then
    VERSION=$(code --version | head -n 1)
    echo -e "${GREEN}✓ VS Code 已安装 (${VERSION})${NC}"
else
    echo -e "${RED}✗ VS Code 未安装${NC}"
    exit 1
fi

echo ""

# 询问是否安装
echo -e "${YELLOW}是否要安装扩展到 VS Code? (y/n)${NC}"
read -r INSTALL

if [ "$INSTALL" = "y" ] || [ "$INSTALL" = "Y" ]; then
    echo ""
    echo -e "${BLUE}📥 安装扩展...${NC}"
    code --install-extension packages/extension/git-gui-0.1.0.vsix
    echo -e "${GREEN}✓ 扩展安装完成${NC}"
    echo ""
    echo -e "${YELLOW}提示: 重新加载 VS Code 窗口以激活扩展${NC}"
    echo -e "${YELLOW}命令: Ctrl+Shift+P → 'Developer: Reload Window'${NC}"
fi

echo ""

# 显示测试步骤
echo -e "${BLUE}📋 测试步骤:${NC}"
echo ""
echo "1. 本地测试:"
echo "   - 打开一个 Git 仓库"
echo "   - Ctrl+Shift+P → 'Git GUI: Open'"
echo "   - 验证功能正常"
echo ""
echo "2. Remote-SSH 测试:"
echo "   - Ctrl+Shift+P → 'Remote-SSH: Connect to Host'"
echo "   - 打开远程 Git 仓库"
echo "   - 验证扩展自动安装"
echo "   - Ctrl+Shift+P → 'Git GUI: Open'"
echo "   - 验证功能正常"
echo ""

# 显示配置验证
echo -e "${BLUE}🔧 配置验证:${NC}"
echo ""

# 检查 extensionKind
if grep -q '"extensionKind".*\["workspace"\]' packages/extension/package.json; then
    echo -e "${GREEN}✓ extensionKind 配置正确${NC}"
else
    echo -e "${RED}✗ extensionKind 配置缺失或错误${NC}"
fi

# 检查 activationEvents
if grep -q 'workspaceContains:.git' packages/extension/package.json; then
    echo -e "${GREEN}✓ activationEvents 包含 workspaceContains:.git${NC}"
else
    echo -e "${YELLOW}⚠ activationEvents 可能缺少 workspaceContains:.git${NC}"
fi

# 检查 main 入口
if grep -q '"main".*"./dist/extension.js"' packages/extension/package.json; then
    echo -e "${GREEN}✓ main 入口配置正确${NC}"
else
    echo -e "${RED}✗ main 入口配置错误${NC}"
fi

echo ""

# 显示文档链接
echo -e "${BLUE}📚 相关文档:${NC}"
echo "  - BUILD_AND_TEST.md - 构建和测试指南"
echo "  - REMOTE_SSH_IMPLEMENTATION.md - Remote SSH 实现总结"
echo "  - docs/REMOTE_SSH_QUICK_START.md - 快速开始"
echo "  - docs/08-REMOTE_SSH_TESTING.md - 详细测试指南"
echo ""

echo -e "${GREEN}✨ 准备就绪！${NC}"
