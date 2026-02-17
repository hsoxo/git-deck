# Extension Resources

## Icon

扩展图标文件。

### 当前状态

- ✅ SVG 图标已创建：`icon.svg`
- ⚠️ PNG 图标待创建：`icon.png`（发布到 Marketplace 需要）

### 创建 PNG 图标

你可以使用以下任一方法将 SVG 转换为 PNG：

#### 方法 1: 使用在线工具
1. 访问 [CloudConvert](https://cloudconvert.com/svg-to-png) 或 [Convertio](https://convertio.co/svg-png/)
2. 上传 `icon.svg`
3. 设置尺寸为 128x128 像素
4. 下载并保存为 `icon.png`

#### 方法 2: 使用 ImageMagick（如果已安装）
```bash
cd packages/extension/resources
convert -background none -size 128x128 icon.svg icon.png
```

#### 方法 3: 使用 Inkscape（如果已安装）
```bash
cd packages/extension/resources
inkscape icon.svg --export-type=png --export-width=128 --export-height=128 -o icon.png
```

#### 方法 4: 使用 Node.js (sharp)
```bash
npm install -g sharp-cli
cd packages/extension/resources
sharp -i icon.svg -o icon.png resize 128 128
```

### 要求

- 文件名: `icon.png`
- 尺寸: 128x128 像素（推荐）或更大
- 格式: PNG
- 背景: 透明或纯色

### 放置位置

将图标文件放在此目录下：`packages/extension/resources/icon.png`

### 更新 package.json

创建 PNG 图标后，在 `packages/extension/package.json` 中取消注释：

```json
{
  "icon": "resources/icon.png",
  "galleryBanner": {
    "color": "#1e1e1e",
    "theme": "dark"
  }
}
```

### 设计说明

当前图标设计：
- 深色背景 (#1e1e1e)
- Git 分支图示意（蓝色主分支 + 绿色分支）
- 简洁的 "Git GUI" 文字

你可以根据需要修改 `icon.svg` 来自定义设计。

### 在线工具

可以使用以下工具创建或编辑图标：

- [Figma](https://www.figma.com/)
- [Canva](https://www.canva.com/)
- [Inkscape](https://inkscape.org/)（开源）
- [GIMP](https://www.gimp.org/)（开源）

### 示例

你可以参考其他流行的 Git 扩展的图标设计：

- GitLens
- Git Graph
- Git History
