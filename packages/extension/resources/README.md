# Extension Resources

## Icon

在发布到 Marketplace 之前，需要添加扩展图标。

### 要求

- 文件名: `icon.png`
- 尺寸: 128x128 像素（推荐）或更大
- 格式: PNG
- 背景: 透明或纯色

### 放置位置

将图标文件放在此目录下：`packages/extension/resources/icon.png`

### 更新 package.json

确保 `packages/extension/package.json` 中的 `icon` 字段指向正确的路径：

```json
{
  "icon": "resources/icon.png"
}
```

### 设计建议

- 使用简洁的设计，在小尺寸下也能清晰识别
- 使用与 Git 相关的图标元素（如分支、提交节点等）
- 考虑使用品牌色彩
- 确保在深色和浅色主题下都清晰可见

### 在线工具

可以使用以下工具创建图标：

- [Figma](https://www.figma.com/)
- [Canva](https://www.canva.com/)
- [GIMP](https://www.gimp.org/)
- [Inkscape](https://inkscape.org/)

### 示例

你可以参考其他流行的 Git 扩展的图标设计：

- GitLens
- Git Graph
- Git History
