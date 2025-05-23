# BTagShield - B站标签过滤器

BTagShield 是一个简单高效的 Chrome 扩展，用于根据视频标签自动过滤 Bilibili (B站) 视频内容。

## 主要功能

- **基于标签过滤**: 自动检测视频标签并与您设置的过滤规则进行匹配
- **平滑通知系统**: 当发现匹配的标签时，显示友好的通知并自动返回上一页
- **灵活的匹配规则**: 支持精确匹配和包含匹配
- **标签管理**: 方便地添加、删除和搜索过滤标签
- **暗色模式**: 支持浅色/深色主题切换
- **过滤历史**: 记录过滤操作，方便查看过滤统计

## 安装方法

### 支持的浏览器

BTagShield 支持所有基于 Chromium 内核的浏览器，包括但不限于：
- Google Chrome
- Microsoft Edge
- Brave Browser
- Opera
- 360安全浏览器
- 搜狗浏览器
- QQ浏览器

### 安装步骤

1. 下载此仓库的代码 (点击"Code"按钮，然后选择"Download ZIP")
2. 解压下载的 ZIP 文件
3. 打开您的浏览器，访问扩展管理页面（Chrome/Edge 可输入 `chrome://extensions/`）
4. 开启右上角的"开发者模式"
5. 点击"加载已解压的扩展程序"（或"加载解压的扩展"）按钮
6. 选择解压后的 BTagShield 文件夹

## 使用方法

1. 安装扩展后，点击浏览器工具栏中的 BTagShield 图标打开控制面板
2. 在文本框中输入您想要过滤的标签，然后点击"添加"按钮
3. 浏览 B 站视频时，如果视频包含您设置的过滤标签，扩展将自动显示通知并返回上一页

## 隐私声明

BTagShield 不会收集或传输您的个人数据。所有过滤规则和设置都保存在您的浏览器本地存储中。

## 技术特点

- 使用原生 JavaScript 开发，无需外部依赖
- 针对 B站 DOM 结构优化的标签检测算法
- 平滑过渡的通知系统，使用 CSS 动画和优化的 JavaScript 计时器
- 完善的防抖和节流机制，优化性能
- 兼容 B站 多种页面结构

## 贡献指南

欢迎提交 Issues 和 Pull Requests 来帮助改进 BTagShield。

## 许可证

[GNU General Public License v3.0](LICENSE)

版权所有 (C) 2025 小能 (xiaonengya) <ckl1234512345@outlook.com>
