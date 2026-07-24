# 贡献指南

感谢你对 AITokenSharing 项目的关注！本仓库是一个「AI 网关产品逆向分析」系列仓库，欢迎贡献竞品分析、报告改进或 mock-server 增强。

## 如何贡献

### 报告问题

- 使用 [GitHub Issues](https://github.com/ZoranAop/aitokenSharing/issues) 提交问题
- 请使用对应的 Issue 模板（Bug 报告 / 功能请求）
- 提交前请搜索是否已有相同问题

### 改进分析报告

- 修正报告中的事实错误或不一致之处
- 补充遗漏的 API 端点或路由
- 改进 Mermaid 图表的可读性
- 添加新的分析维度（如性能、可用性等）

### 贡献竞品分析

本仓库计划覆盖以下平台的分析，欢迎认领：

- LiteLLM — 开源 LLM 网关架构分析
- One API — 多模型接入管理平台拆解
- AIHubMix — 模型聚合分销平台
- Cloudflare AI Gateway — 边缘 AI 代理方案
- 自建 vs SaaS — AI 网关选型决策框架

### 改进 mock-server

- 添加新的端点模拟
- 增强格式转换逻辑
- 添加新的测试用例
- 改进文档

## 提交规范

### Commit 消息

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <description>

feat: 新增功能
fix: 修复 bug
docs: 文档改进
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

示例：
- `feat: 新增 SSE 流式响应支持`
- `fix: 修复 architecture.html API 清单不一致`
- `docs: 补全 mock-server 端点表`

### Pull Request 流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feat/your-feature`
3. 提交更改：`git commit -m 'feat: your feature'`
4. 推送分支：`git push origin feat/your-feature`
5. 创建 Pull Request，描述改动内容

### 代码风格

- JavaScript：2 空格缩进，单引号
- Markdown：使用中文标点，代码块标注语言
- 保持文件末尾换行

## 法律声明

- 所有分析基于**公开可访问**的静态资源
- **不要**对后端 API 进行实际调用（可能涉及未授权访问）
- **不要**提交任何真实的 API Key 或凭证
- 报告中标注分析方法，明确声明非侵入式
- 遵守各 AI 服务商的 Terms of Service

## 开发环境

```bash
# 克隆仓库
git clone https://github.com/ZoranAop/aitokenSharing.git
cd aitokenSharing

# 启动 mock-server
cd mock-server
npm install
npm start

# 运行测试
npm test
```

## 许可证

贡献的代码将遵循 [MIT License](./LICENSE)。
