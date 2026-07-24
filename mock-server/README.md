# AITokenBus 模拟网关环境

用于验证 [产品拆解报告](../AITokenBus分析.md) 中 API 调用示例的本地模拟服务器。

## 快速开始

```bash
cd mock-server
npm install
npm start
```

服务启动在 `http://localhost:3456`。

## 模拟数据

| 资源 | 值 |
|------|-----|
| **API Key** | `sk-mock-aitokenbus-key-00001` |
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

| 模块 | 路径 | 说明 |
|------|------|------|
| Auth | `/api/auth/password` | 邮箱密码登录 |
| Auth | `/api/auth/me` | 当前用户信息 |
| Auth | `/api/auth/profile` | 用户完整资料 |
| Wallet | `/api/wallet/account` | 钱包余额 |
| Wallet | `/api/wallet/transactions` | 交易流水 |
| Wallet | `/api/wallet/consumption-logs` | 消费日志 |
| Wallet | `/api/wallet/consumption-stats` | 消费统计 |
| Mine | `/api/mine/miner-keys` | 查看/生成 API Key |
| Mine | `/api/mine/miners` | 矿机列表 |
| Mine | `/api/mine/pools` | 矿池列表 |
| Mine | `/api/mine/heartbeat` | 矿工心跳 |
| Mine | `/api/mine/tasks/poll` | 任务轮询 |
| Pools | `/api/pools/created` | 我创建的池 |
| Pools | `/api/pools/joined` | 我加入的池 |
| Pools | `/api/pools/join` | 申请加入池 |
| Market | `/api/market/listings` | 市场挂牌列表 |
| Routes | `/api/routes/available-pools` | 可用池路由 |

## 运行测试

```bash
# Node.js 测试 — 代理网关端点
node tests/test-gateway.js

# Node.js 测试 — 管理 API
node tests/test-management.js

# Python 测试 (需先 pip install openai)
python tests/test-python.py
```

## 模拟特性

- **格式转换**: 根据 model 名称自动判断上游 provider 并记录转换步骤
- **速率限制**: 实现 RPM 限制（默认 60/min），超出返回 429
- **用量计量**: 每次请求记录 token 消耗和 TC 成本
- **矿工心跳**: 模拟 miner daemon 心跳上报
- **多租户隔离**: 不同 API Key 归属不同用户和池

## 与真实 AITokenBus 的差异

| 特性 | 模拟环境 | 真实 AITokenBus |
|------|---------|----------------|
| AI 响应 | 固定模板回复 | 实际调用上游 AI 模型 |
| 格式转换 | 仅记录转换步骤 | 真实请求/响应格式转换 |
| 矿工客户端 | HTTP 心跳模拟 | 本地 daemon 进程 |
| 计费 | 模拟 TC 扣减 | 实际 TC 积分结算 |

## 架构对应

```
模拟环境                           真实 AITokenBus
─────────                          ────────────────
mock-server/server.js             AITokenBus 后端
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
