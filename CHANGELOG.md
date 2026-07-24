# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-07-24

### Changed
- 全局重命名：AITokenBus → AITokenSharing，产品拆解报告 → 产品分析
- 分析报告文件名 `AITokenBus分析.md` → `AITokenSharing分析.md`
- mock-server 中 API Key、包名同步更新（`aitokenbus` → `aitokensharing`）

### Fixed
- 修复 `CHANGELOG.md` 错别字「基础」→「基础」
- 修复 `docs/architecture.html` API 清单与 `server.js` 不一致：
  - 移除不存在的 `/api/pools/create`、`/api/market/list`、`/api/mine/available-models`
  - 补充 `POST /v1beta/models/:name`，修正各模块端点计数
- 补全 `mock-server/README.md` 端点表（新增 12 个缺失端点）
- 修复分析报告中 `/api/mine/available-models` 不一致问题

### Added
- 英文版 README 补充「Series Expansion」章节，与中文版对齐
- 新增 `CONTRIBUTING.md` 贡献指南
- 新增 `.github/ISSUE_TEMPLATE/`（Bug/Feature 模板）与 PR 模板
- 新增 `.github/workflows/ci.yml` GitHub Actions CI（自动运行 mock-server 测试）
- 新增 `mock-server/Dockerfile` 与 `.dockerignore`，支持容器化运行
- `mock-server/package.json` 新增 `engines` 字段声明 Node 版本
- `mock-server/server.js` 新增 SSE 流式响应支持（`stream: true`）
- `mock-server/tests/test-management.js` 新增 401 无效 Token 错误用例
- 新增 `mock-server/miner-client.js` 矿工客户端示例（心跳 + 任务轮询）

## [1.1.0] - 2026-07-24

### Added
- 英文版 README（`README_EN.md`）
- 分析报告新增目录导航（锚点跳转）
- 分析报告新增请求链路 Mermaid 序列图
- 分析报告新增第九章「安全深度分析」
- 分析报告新增第十章「竞品横向对比」
- 分析报告新增第十一章「挖矿经济模型量化」
- 分析报告新增第十二章「API 调用示例」
- 分析报告新增第十三章「复现方法」
- 交互式架构图 HTML（`docs/architecture.html`）
- 逆向复现指南（`HOWTO.md`）
- `.gitignore` 与 `LICENSE`

### Changed
- README.md 全面重写，从单行标题扩展为完整项目首页
- 修复 shields.io badge 链接为绝对路径

## [1.0.0] - 2026-07-24

### Added
- 初始版本：AITokenSharing 产品分析（8 章）
- 基础 README.md
