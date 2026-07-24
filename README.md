# AITokenSharing 产品分析

> AI Token 共享/转售网关平台 —— 前端静态逆向分析报告

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/ZoranAop/aitokenSharing/blob/main/LICENSE)

## 概述

本仓库对 AITokenSharing 进行了完整的产品拆解与逆向分析。AITokenSharing 是一个将多个 AI 服务商订阅聚合成「池（Pool）」的 Token 共享/转售网关平台，支持 OpenAI、Claude、Gemini、DeepSeek 等主流 AI 模型，并通过「挖矿得币」的经济叙事形成供给与消费侧闭环。

## 报告内容

- [📄 完整分析报告](./AITokenSharing%E5%88%86%E6%9E%90.md)
- [🖥️ 交互式架构图](./docs/architecture.html)（双击打开浏览器查看）
- [📖 逆向复现指南](./HOWTO.md)

报告涵盖以下十三个章节：

| 章节 | 内容 |
|------|------|
| **一、产品定位** | 平台核心价值主张与一句话定位 |
| **二、系统架构** | Mermaid 流程图展示客户端-网关-上游-生态四层架构 |
| **三、功能模块分解** | 前端路由、后端 API 与功能映射表 |
| **四、核心请求链路逻辑** | 从建池到代理转发的完整 7 步流程 + 时序图 |
| **五、挖矿机制解读** | Token Mining Pool 差异化设定深度分析 |
| **六、技术栈与架构** | React + Vite 前端、RESTful API、矿工客户端 |
| **七、商业模式与风险提示** | 盈利模式及合规隐患 |
| **八、安全深度分析** | 攻击面梳理、凭证管理风险、合规矩阵、加固建议 |
| **九、竞品横向对比** | LiteLLM / One API / AIHubMix 等多维度对比 |
| **十、挖矿经济模型量化** | TC 积分参数估算、可持续性分析、收益率测算 |
| **十一、API 调用示例** | curl / Python 示例（OpenAI / Anthropic / Gemini 端点） |
| **十二、复现方法** | 同类平台逆向分析的标准化流程 |
| **十三、附录：关键路由/API 清单** | 全部前端路由、网关端点、后端 API |

## 核心发现

- 平台通过**格式自动转换**实现 OpenAI ↔ Claude ↔ Gemini ↔ DeepSeek 的跨协议互操作
- 引入 **Token Mining Pool** 机制，激励用户贡献自有 AI 订阅额度以赚取 TC 积分
- 后端承担选池/选上游/负载均衡/限流/计量等核心路由逻辑
- 需警惕多用户共享 API Key 违反上游服务商 ToS 的风险

## 分析方法

- **落地页直接抓取**：提取平台营销内容与页面结构
- **前端静态资源逆向**：对 Vite/React SPA 的 `/assets/index-*.js` 打包文件进行静态代码分析
- **路由与 API 枚举**：从打包文件提取完整的 React Router 路由表与后端 API 端点
- **非侵入式**：所有分析基于公开可访问的静态资源，未对后端服务进行实际接口调用

## 免责声明

本报告仅用于技术学习与研究目的。报告中的分析基于公开可访问的前端静态资源，不代表对 AITokenSharing 平台或其运营方的任何评价。使用者应自行判断平台合规性，并遵守相关法律法规及各 AI 服务商的 Terms of Service。

## 贡献

欢迎贡献竞品分析与报告改进，详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 系列扩展

本仓库是「AI 网关产品逆向分析」系列之一。未来计划覆盖：

- [ ] LiteLLM — 开源 LLM 网关架构分析
- [ ] One API — 多模型接入管理平台拆解
- [ ] AIHubMix — 模型聚合分销平台
- [ ] Cloudflare AI Gateway — 边缘 AI 代理方案
- [ ] 自建 vs SaaS — AI 网关选型决策框架

欢迎 Watch 本仓库关注更新，也欢迎贡献竞品分析。

## License

MIT
