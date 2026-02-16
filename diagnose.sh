#!/bin/bash

# Git GUI 诊断脚本

echo "🔍 Git GUI 诊断工具"
echo "===================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

check_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 1. 检查 Git 安装
echo "1️⃣  检查 Git 安装"
echo "-------------------"
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    check_pass "Git 已安装: $GIT_VERSION"
    
    # 检查版本
    GIT_VER=$(git --version | grep -oP '\d+\.\d+' | head -1)
    if [ "$(echo "$GIT_VER >= 2.20" | bc)" -eq 1 ]; then
        check_pass "Git 版本符合要求 (>= 2.20.0)"
    else
        check_warn "Git 版本较低，建议升级到 2.20.0 或更高"
    fi
else
    check_fail "Git 未安装或不在 PATH 中"
    echo "   请安装 Git: https://git-scm.com/downloads"
fi
echo ""

# 2. 检查 Git 仓库
echo "2️⃣  检查 Git 仓库"
echo "-------------------"
if git rev-parse --git-dir > /dev/null 2>&1; then
    check_pass "当前目录是 Git 仓库"
    
    # 检查仓库路径
    GIT_DIR=$(git rev-parse --git-dir)
    check_info "Git 目录: $GIT_DIR"
    
    # 检查工作目录
    WORK_DIR=$(git rev-parse --show-toplevel)
    check_info "工作目录: $WORK_DIR"
else
    check_fail "当前目录不是 Git 仓库"
    echo "   请在 Git 仓库中运行此脚本"
    echo "   或运行: git init"
fi
echo ""

# 3. 检查提交历史
echo "3️⃣  检查提交历史"
echo "-------------------"
if git log --oneline -1 > /dev/null 2>&1; then
    COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    check_pass "有提交历史 ($COMMIT_COUNT 个提交)"
    
    # 显示最近的提交
    echo "   最近的提交:"
    git log --oneline -3 | sed 's/^/   /'
else
    check_warn "没有提交历史"
    echo "   这是一个新仓库，请创建第一个提交"
    echo "   运行: git add . && git commit -m 'Initial commit'"
fi
echo ""

# 4. 检查分支
echo "4️⃣  检查分支"
echo "-------------------"
if git branch > /dev/null 2>&1; then
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "detached HEAD")
    check_pass "当前分支: $CURRENT_BRANCH"
    
    BRANCH_COUNT=$(git branch | wc -l)
    check_info "分支数量: $BRANCH_COUNT"
    
    # 显示所有分支
    if [ $BRANCH_COUNT -gt 0 ]; then
        echo "   分支列表:"
        git branch | sed 's/^/   /'
    fi
else
    check_warn "无法获取分支信息"
fi
echo ""

# 5. 检查文件状态
echo "5️⃣  检查文件状态"
echo "-------------------"
if git status --porcelain > /dev/null 2>&1; then
    MODIFIED=$(git status --porcelain | grep '^ M' | wc -l)
    ADDED=$(git status --porcelain | grep '^A' | wc -l)
    DELETED=$(git status --porcelain | grep '^ D' | wc -l)
    UNTRACKED=$(git status --porcelain | grep '^??' | wc -l)
    
    check_pass "文件状态正常"
    check_info "修改: $MODIFIED, 新增: $ADDED, 删除: $DELETED, 未跟踪: $UNTRACKED"
    
    if [ $((MODIFIED + ADDED + DELETED + UNTRACKED)) -gt 0 ]; then
        echo "   有未提交的更改"
    else
        echo "   工作目录干净"
    fi
else
    check_fail "无法获取文件状态"
fi
echo ""

# 6. 检查远程仓库
echo "6️⃣  检查远程仓库"
echo "-------------------"
if git remote -v > /dev/null 2>&1; then
    REMOTE_COUNT=$(git remote | wc -l)
    if [ $REMOTE_COUNT -gt 0 ]; then
        check_pass "已配置远程仓库 ($REMOTE_COUNT 个)"
        echo "   远程列表:"
        git remote -v | sed 's/^/   /'
    else
        check_warn "没有配置远程仓库"
        echo "   这是一个本地仓库"
    fi
else
    check_warn "无法获取远程仓库信息"
fi
echo ""

# 7. 检查 VS Code / Kiro IDE
echo "7️⃣  检查 IDE"
echo "-------------------"
if command -v code &> /dev/null; then
    CODE_VERSION=$(code --version | head -1)
    check_pass "VS Code 已安装: $CODE_VERSION"
else
    check_warn "VS Code 命令行工具未找到"
    echo "   可能使用的是 Kiro IDE 或其他编辑器"
fi
echo ""

# 8. 检查扩展
echo "8️⃣  检查 Git GUI 扩展"
echo "-------------------"
if [ -f "packages/extension/git-gui-0.1.0.vsix" ]; then
    VSIX_SIZE=$(ls -lh packages/extension/git-gui-0.1.0.vsix | awk '{print $5}')
    check_pass "VSIX 文件存在 ($VSIX_SIZE)"
else
    check_warn "VSIX 文件不存在"
    echo "   运行: cd packages/extension && npm run package"
fi
echo ""

# 9. 检查权限
echo "9️⃣  检查权限"
echo "-------------------"
if [ -r ".git" ] && [ -w ".git" ]; then
    check_pass "有 .git 目录的读写权限"
else
    check_fail "没有 .git 目录的读写权限"
    echo "   运行: sudo chown -R \$USER:\$USER .git"
fi
echo ""

# 10. 性能检查
echo "🔟 性能检查"
echo "-------------------"
if git rev-parse --git-dir > /dev/null 2>&1; then
    # 检查仓库大小
    REPO_SIZE=$(du -sh .git 2>/dev/null | cut -f1)
    check_info "仓库大小: $REPO_SIZE"
    
    # 检查对象数量
    OBJECT_COUNT=$(git count-objects -v 2>/dev/null | grep '^count:' | awk '{print $2}')
    check_info "对象数量: $OBJECT_COUNT"
    
    # 检查提交数量
    if [ "$COMMIT_COUNT" -gt 10000 ]; then
        check_warn "提交数量较多 ($COMMIT_COUNT)，可能影响性能"
        echo "   建议在设置中减少 maxLogCount"
    else
        check_pass "提交数量适中 ($COMMIT_COUNT)"
    fi
fi
echo ""

# 总结
echo "📊 诊断总结"
echo "===================="
echo ""

# 检查关键问题
ISSUES=0

if ! command -v git &> /dev/null; then
    echo "❌ Git 未安装"
    ISSUES=$((ISSUES + 1))
fi

if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ 不在 Git 仓库中"
    ISSUES=$((ISSUES + 1))
fi

if ! git log --oneline -1 > /dev/null 2>&1; then
    echo "⚠️  没有提交历史"
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ 所有关键检查通过！${NC}"
    echo ""
    echo "Git GUI 应该可以正常工作。"
    echo ""
    echo "如果仍然有问题，请："
    echo "1. 查看扩展日志: View → Output → Git GUI"
    echo "2. 查看控制台: 右键 webview → Inspect Element"
    echo "3. 查看故障排查指南: TROUBLESHOOTING.md"
else
    echo -e "${RED}✗ 发现 $ISSUES 个关键问题${NC}"
    echo ""
    echo "请先解决上述问题，然后重试。"
fi

echo ""
echo "💡 提示:"
echo "- 完整文档: docs/"
echo "- 故障排查: TROUBLESHOOTING.md"
echo "- 使用指南: HOW_TO_USE.md"
echo ""
