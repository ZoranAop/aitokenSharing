# AI 网关前端逆向分析复现指南

本指南介绍如何对任意 AI 网关/代理平台进行前端静态资源逆向分析，复现本仓库中对 AITokenSharing 的分析方法。

## 适用场景

- 分析 AI API 网关平台的产品功能与架构
- 提取前端路由表和后端 API 端点清单
- 理解平台的商业模式与经济系统设计
- 安全审计与合规性评估

## 工具准备

| 工具 | 用途 |
|------|------|
| **浏览器 DevTools**（Chrome/Edge） | 抓取网络请求、查看 Sources、断点调试 |
| **curl / wget** | 下载前端静态资源 |
| **Node.js** | 运行 JS 解析脚本 |
| **jq** | JSON 处理（可选） |
| **rg (ripgrep)** 或 **grep** | 代码搜索 |

## 第一步：落地页信息收集

```bash
# 抓取首页 HTML
curl -sL "https://目标域名/" -o landing.html

# 提取页面描述、关键词
grep -i '<meta.*description' landing.html
grep -i '<title>' landing.html

# 抓取多语言页面（常见路径）
curl -sL "https://目标域名/" -H "Accept-Language: zh-CN" -o landing_zh.html
curl -sL "https://目标域名/" -H "Accept-Language: en" -o landing_en.html
```

**分析要点：**
- 产品名称、标语、核心价值主张
- 首页描述的功能特性
- 多语言支持情况
- 社交链接、联系信息

## 第二步：识别前端框架与入口文件

打开浏览器 DevTools → Network 面板，刷新页面，观察加载的资源：

```bash
# 常见框架特征
# Vite/React → /assets/index-*.js
# Next.js → /_next/static/chunks/
# Vue CLI → /js/app.*.js 或 /js/chunk-vendors.*.js
# Angular → main.*.js, polyfills.*.js
```

**判断依据：**
- 查看 HTML 中 `<script>` 标签的 `type="module"` 属性 → 可能是 Vite
- 查看 JS 文件头部注释是否包含 `webpack` / `vite` 标识
- 查看 window 对象上是否有 `__REACT_DEVTOOLS_GLOBAL_HOOK__` 等框架标记

## 第三步：下载并分析前端打包文件

```bash
# 识别入口 JS 文件名（从 landing.html 中提取）
# 以 Vite 为例：
ASSET_URL=$(grep -oP '/assets/index-[^"]+\.js' landing.html | head -1)
curl -sL "https://目标域名${ASSET_URL}" -o bundle.js

# 文件可能很大（几 MB），先查看大小
wc -c bundle.js
```

## 第四步：提取前端路由表

React Router 路由通常在打包文件中以字符串数组形式出现：

```bash
# 搜索常见路由前缀
rg -o '"/[a-z][a-z0-9/-]*"' bundle.js | sort -u
rg -o "'/[a-z][a-z0-9/-]*'" bundle.js | sort -u

# 搜索 React Router 的 createBrowserRouter / Route path
rg -o 'path:\s*"[^"]+"' bundle.js | sort -u

# 搜索路由常量名
rg -o 'ROUTES\.[A-Z_]+' bundle.js | sort -u
```

**整理方法：** 将提取到的路径按层级关系组织，标注对应的页面功能。

## 第五步：提取后端 API 端点

```bash
# 搜索 API 路径模式
rg -o '"/api/[a-z][a-z0-9/-]*"' bundle.js | sort -u
rg -o "'/api/[a-z][a-z0-9/-]*'" bundle.js | sort -u

# 搜索 fetch/axios 请求
rg -o 'fetch\("[^"]+"\)' bundle.js | sort -u
rg -o 'axios\.(get|post|put|delete)\("[^"]+"' bundle.js | sort -u

# 搜索 API 基础 URL 配置
rg -o 'baseURL\s*:\s*"[^"]*"' bundle.js
rg -o 'API_BASE[^,;]+' bundle.js
```

## 第六步：提取功能特征码

搜索关键功能关键词来理解系统设计：

```bash
# 认证相关
rg -i 'oauth|github.*auth|login|register|jwt|token.*auth' bundle.js | head -30

# 支付/积分相关
rg -i 'wallet|balance|credit|coin|token.*earn|mining|miner' bundle.js | head -30

# 池/路由相关
rg -i 'pool|upstream|downstream|proxy|route.*balance|load.*balanc' bundle.js | head -30

# 格式转换相关
rg -i 'transform|translate|convert|openai.*format|claude.*format' bundle.js | head -30

# 配置/模型相关
rg -i 'model.*list|provider|allowed.*model|vendor' bundle.js | head -30
```

## 第七步：分析 i18n 国际化文本

多语言文件是理解产品功能的金矿：

```bash
# 常见 i18n 文件位置
# - /locales/zh-CN.json
# - /locales/en.json
# - /assets/locale-*.js

# 搜索语言包关键词
rg -o '"zh-CN"\s*:\s*\{[^}]+' bundle.js
rg -o '"en"\s*:\s*\{[^}]+' bundle.js

# 提取所有 i18n key
rg -o 't\("[^"]+"\)' bundle.js | sort -u
```

## 第八步：整理与报告撰写

将分析结果整理为结构化报告：

```
1. 产品定位（一句话概括）
2. 系统架构图（Mermaid flowchart）
3. 功能模块分解表（路由 + API + 功能说明）
4. 核心业务流程（分步骤描述）
5. 差异化功能深度分析
6. 技术栈总结
7. 商业模式与风险评估
8. 附录（路由/API 清单）
```

## 注意事项

### 法律合规
- 仅分析**公开可访问**的静态资源
- **不要**对后端 API 进行实际调用（可能涉及未授权访问）
- **不要**绕过任何认证机制
- **不要**利用分析结果进行任何破坏或滥用
- 报告中标注分析方法，明确声明非侵入式

### 技术注意
- 打包后的 JS 经混淆/压缩，变量名可能无意义，需结合上下文推断
- 路由和 API 端点可能被动态拼接，需额外注意字符串模板
- 部分功能逻辑在后端，前端仅能看到接口定义和参数
- Source Map 文件（`.js.map`）若可访问能大幅提升分析精度

### 工具推荐
- [unwebpack-sourcemap](https://github.com/rarecoil/unwebpack-sourcemap) — 从 source map 还原源码
- [js-beautify](https://github.com/beautify-web/js-beautify) — 格式化压缩 JS
- [AST Explorer](https://astexplorer.net/) — 可视化 AST 分析

---

*本指南仅供安全研究与技术学习使用。*
