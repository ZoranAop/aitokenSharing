# AITokenSharing 模拟网关环境

用于验证 [产品分析](../AITokenSharing分析.md) 中 API 调用示例的本地模拟服务器。

## 快速开始

```bash
cd mock-server
npm install
npm start
```

服务启动在 `http://localhost:3456`。

### Docker 运行

```bash
docker build -t aitokensharing-mock-server .
docker run -p 3456:3456 aitokensharing-mock-server
```

## 模拟数据

| 资源 | 值 |
|------|-----|
| **API Key** | `sk-mock-aitokensharing-key-00001` |
| **API Key (成员)** | `sk-mock-member-key-00002` |
| **平台 JWT Token** | `mock-jwt-platform-token-12345` |
| **用户** | alice@example.com / bob@example.com |
| **矿池** | 官方矿池 (pool_official)、DeepSeek 专用池 (pool_deepseek) |

## 可用端点

### 代理网关 (API Key 鉴权)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/v1/chat/completions` | OpenAI 兼容 Chat API |
| POST | `/v1/responses` | OpenAI 兼容 Responses API |
| GET | `/v1/models` | 模型列表 |
| POST | `/v1/messages` | Anthropic 兼容 Messages API |
| GET | `/v1beta/models` | Gemini 模型列表 |
| POST | `/v1beta/models/:name` | Gemini generateContent |

### 管理 API (JWT Token 鉴权)

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| Auth | POST | `/api/auth/password` | 邮箱密码登录 |
| Auth | GET | `/api/auth/me` | 当前用户信息 |
| Auth | GET | `/api/auth/profile` | 用户完整资料 |
| Auth | GET | `/api/auth/github` | GitHub OAuth 跳转 |
| Auth | GET | `/api/auth/github/callback` | GitHub OAuth 回调 |
| Auth | POST | `/api/auth/github/bind` | 绑定 GitHub 账号 |
| Auth | POST | `/api/auth/github/unbind` | 解绑 GitHub 账号 |
| Wallet | GET | `/api/wallet/account` | 钱包余额 |
| Wallet | GET | `/api/wallet/transactions` | 交易流水 |
| Wallet | GET | `/api/wallet/consumption-logs` | 消费日志 |
| Wallet | GET | `/api/wallet/consumption-stats` | 消费统计 |
| Mine | GET | `/api/mine/miner-keys` | 查看 API Key 列表 |
| Mine | POST | `/api/mine/miner-keys` | 生成新 API Key |
| Mine | GET | `/api/mine/miners` | 矿机列表 |
| Mine | GET | `/api/mine/my-mines` | 我创建的矿 |
| Mine | GET | `/api/mine/pools` | 矿池列表 |
| Mine | GET | `/api/mine/free-llm` | 免费模型列表 |
| Mine | GET | `/api/mine/llm` | 可用 LLM 列表 |
| Mine | GET | `/api/mine/vendors` | 服务商列表 |
| Mine | GET | `/api/mine/paid-vendors` | 付费服务商列表 |
| Mine | GET | `/api/mine/types` | 矿类型列表 |
| Mine | POST | `/api/mine/heartbeat` | 矿工心跳上报 |
| Mine | GET | `/api/mine/tasks/poll` | 任务轮询 |
| Pools | GET | `/api/pools/created` | 我创建的池 |
| Pools | GET | `/api/pools/joined` | 我加入的池 |
| Pools | POST | `/api/pools/join` | 申请加入池 |
| Pools | GET | `/api/pools/my-requests` | 我的入池申请 |
| Market | GET | `/api/market/listings` | 市场挂牌列表 |
| Routes | GET | `/api/routes/available-pools` | 可用池路由 |
| Health | GET | `/api/health` | 健康检查 |

## 运行测试

```bash
# Node.js 测试 — 代理网关端点（含 SSE 流式测试）
node tests/test-gateway.js

# Node.js 测试 — 管理 API（含 401/404 错误用例）
node tests/test-management.js

# Python 测试 (需先 pip install openai)
python tests/test-python.py

# 一键运行全部 Node.js 测试
npm test
```

## 矿工客户端示例

```bash
# 启动矿工客户端（需先启动 mock-server）
node miner-client.js

# 自定义配置
GPU_INFO="NVIDIA RTX 4090" HEARTBEAT_INTERVAL=5 node miner-client.js
```

矿工客户端模拟本地 daemon 行为：定期心跳上报 + 任务轮询。

## 模拟特性

- **格式转换**: 根据 model 名称自动判断上游 provider 并记录转换步骤
- **速率限制**: 实现 RPM 限制（默认 60/min），超出返回 429
- **用量计量**: 每次请求记录 token 消耗和 TC 成本
- **矿工心跳**: 模拟 miner daemon 心跳上报
- **多租户隔离**: 不同 API Key 归属不同用户和池
- **SSE 流式响应**: `/v1/chat/completions` 支持 `stream: true`，返回 OpenAI 兼容的 Server-Sent Events 流

## 与真实 AITokenSharing 的差异

| 特性 | 模拟环境 | 真实 AITokenSharing |
|------|---------|----------------|
| AI 响应 | 固定模板回复 | 实际调用上游 AI 模型 |
| 格式转换 | 仅记录转换步骤 | 真实请求/响应格式转换 |
| 矿工客户端 | HTTP 心跳模拟 | 本地 daemon 进程 |
| 计费 | 模拟 TC 扣减 | 实际 TC 积分结算 |

## 架构对应

```
模拟环境                           真实 AITokenSharing
─────────                          ────────────────
mock-server/server.js             AITokenSharing 后端
  ├── /v1/* (代理端点)      ←→    网关 Proxy 层
  ├── /api/auth/*           ←→    鉴权服务
  ├── /api/wallet/*         ←→    钱包服务
  ├── /api/mine/*           ←→    矿池服务
  ├── /api/pools/*          ←→    池管理服务
  └── /api/market/*         ←→    市场服务

test-gateway.js       →  Claude Code / Codex / 工具
test-management.js    →  Web 控制台
test-python.py        →  Python SDK 应用
```
