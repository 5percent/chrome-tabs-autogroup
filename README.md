# README.md

# Chrome Tab Grouping Extension

该扩展用于自动将新开的标签页进行分组，以提高浏览器的使用效率。

## 功能

- 自动识别新标签页并进行分组
- 提供用户友好的界面
- 支持中文本地化

## 文件结构

```
chrome-tab-grouping
├── src
│   ├── background.js       // 后台脚本
│   ├── content.js         // 内容脚本
│   └── manifest.json      // 扩展配置文件
├── icons
│   ├── icon16.png         // 16x16 图标
│   ├── icon48.png         // 48x48 图标
│   └── icon128.png        // 128x128 图标
├── _locales
│   └── zh_CN
│       └── messages.json   // 本地化字符串
├── package.json            // npm 配置文件
└── README.md               // 项目文档
```

## 安装

1. 下载或克隆此项目。
2. 在 Chrome 浏览器中打开 `chrome://extensions/`。
3. 启用开发者模式。
4. 点击“加载已解压的扩展程序”，选择项目目录。

## 使用

安装后，扩展会自动开始工作，您可以在新标签页中查看分组效果。

## 贡献

欢迎提交问题和拉取请求！