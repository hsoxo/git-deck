#!/bin/bash

# 发布准备脚本
# 用法: ./scripts/prepare-release.sh [patch|minor|major]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
if [ -z "$1" ]; then
    echo -e "${RED}错误: 请指定版本类型 (patch, minor, major)${NC}"
    echo "用法: ./scripts/prepare-release.sh [patch|minor|major]"
    exit 1
fi

VERSION_TYPE=$1

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}错误: 版本类型必须是 patch, minor 或 major${NC}"
    exit 1
fi

echo -e "${GREEN}=== Git GUI 发布准备 ===${NC}\n"

# 1. 检查是否在 main 分支
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}警告: 当前不在 main 分支 (当前: $CURRENT_BRANCH)${NC}"
    read -p "是否继续? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 2. 检查是否有未提交的更改
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}错误: 有未提交的更改，请先提交或暂存${NC}"
    git status -s
    exit 1
fi

# 3. 拉取最新代码
echo -e "${GREEN}[1/8] 拉取最新代码...${NC}"
git pull origin $CURRENT_BRANCH

# 4. 安装依赖
echo -e "${GREEN}[2/8] 安装依赖...${NC}"
npm ci

# 5. 运行 lint
echo -e "${GREEN}[3/8] 运行 lint...${NC}"
npm run lint

# 6. 运行格式检查
echo -e "${GREEN}[4/8] 运行格式检查...${NC}"
npm run format:check

# 7. 运行类型检查
echo -e "${GREEN}[5/8] 运行类型检查...${NC}"
npm run tsc

# 8. 运行测试
echo -e "${GREEN}[6/8] 运行测试...${NC}"
npm run test:unit

# 9. 构建
echo -e "${GREEN}[7/8] 构建项目...${NC}"
npm run build

# 10. 打包
echo -e "${GREEN}[8/8] 打包扩展...${NC}"
npm run package

# 11. 获取当前版本
CURRENT_VERSION=$(node -p "require('./packages/extension/package.json').version")
echo -e "\n${GREEN}当前版本: ${CURRENT_VERSION}${NC}"

# 12. 计算新版本
cd packages/extension
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version | sed 's/v//')
cd ../..

echo -e "${GREEN}新版本: ${NEW_VERSION}${NC}\n"

# 13. 提示下一步
echo -e "${GREEN}=== 准备完成! ===${NC}\n"
echo -e "下一步操作:"
echo -e "1. 更新 CHANGELOG.md，添加版本 ${NEW_VERSION} 的更新内容"
echo -e "2. 检查 packages/extension/package.json 中的版本号"
echo -e "3. 提交更改:"
echo -e "   ${YELLOW}git add .${NC}"
echo -e "   ${YELLOW}git commit -m \"chore: prepare for release v${NEW_VERSION}\"${NC}"
echo -e "   ${YELLOW}git push origin ${CURRENT_BRANCH}${NC}"
echo -e "4. 在 GitHub 上创建 Release (tag: v${NEW_VERSION})"
echo -e "\n或者手动发布:"
echo -e "   ${YELLOW}cd packages/extension && vsce publish${NC}"
