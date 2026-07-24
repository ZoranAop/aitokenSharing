const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3456;

// ========== 模拟数据 ==========
const API_KEYS = new Map();
const USERS = new Map();
const POOLS = new Map();
const MINERS = new Map();
const WALLETS = new Map();
const USAGE_LOGS = [];

function initMockData() {
  const userId = 'user_001';
  const apiKey = 'sk-mock-aitokensharing-key-00001';
  const platformToken = 'mock-jwt-platform-token-12345';

  API_KEYS.set(apiKey, { userId, poolId: 'pool_official', quotaRemaining: 1000000, rpmLimit: 60 });
  API_KEYS.set('sk-mock-member-key-00002', { userId: 'user_002', poolId: 'pool_official', quotaRemaining: 500000, rpmLimit: 30 });

  USERS.set(userId, { id: userId, name: 'Alice', email: 'alice@example.com', platformToken, githubLinked: true });
  USERS.set('user_002', { id: 'user_002', name: 'Bob', email: 'bob@example.com', platformToken: 'mock-jwt-token-bob', githubLinked: false });

  POOLS.set('pool_official', {
    id: 'pool_official', name: '官方矿池', creatorId: userId, status: 'active', officialPoolBadge: true,
    members: ['user_001', 'user_002'], marketStatus: 'public',
    upstreams: [
      { provider: 'openai', model: 'gpt-4o', baseUrl: 'https://api.openai.com/v1' },
      { provider: 'anthropic', model: 'claude-sonnet-4-20250514', baseUrl: 'https://api.anthropic.com' },
      { provider: 'google', model: 'gemini-pro', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
    ],
  });

  POOLS.set('pool_deepseek', {
    id: 'pool_deepseek', name: 'DeepSeek 专用池', creatorId: 'user_002', status: 'active',
    members: ['user_002'], marketStatus: 'public',
    upstreams: [{ provider: 'deepseek', model: 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1' }],
  });

  MINERS.set('miner_001', { id: 'miner_001', userId, poolId: 'pool_official', status: 'online', gpuInfo: 'NVIDIA RTX 4090', earnedTC: 1250, heartbeats: [] });
  MINERS.set('miner_002', { id: 'miner_002', userId: 'user_002', poolId: 'pool_official', status: 'offline', gpuInfo: 'NVIDIA RTX 3080', earnedTC: 340, heartbeats: [] });

  WALLETS.set(userId, { userId, balance: 5000, currency: 'TC', transactions: [{ id: 'tx_001', amount: 100, type: 'earn', source: 'mining', time: Date.now() - 3600000 }] });
  WALLETS.set('user_002', { userId: 'user_002', balance: 1200, currency: 'TC', transactions: [{ id: 'tx_002', amount: 50, type: 'earn', source: 'market', time: Date.now() - 7200000 }] });
}

initMockData();

// ========== 中间件 ==========
function authApiKey(req, res, next) {
  const key = req.headers['authorization']?.replace('Bearer ', '') || req.headers['x-api-key'];
  if (!key || !API_KEYS.has(key)) {
    return res.status(401).json({ error: { message: 'Invalid API Key', type: 'authentication_error', code: 401 } });
  }
  req.apiKeyInfo = API_KEYS.get(key);
  next();
}

function authPlatformToken(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing platform token' });
  req.user = Array.from(USERS.values()).find(u => u.platformToken === token);
  if (!req.user) return res.status(401).json({ error: 'Invalid platform token' });
  next();
}

function rateLimit(req, res, next) {
  if (req.apiKeyInfo) {
    const now = Date.now();
    const windowMs = 60000;
    req.apiKeyInfo._windowStart = req.apiKeyInfo._windowStart || now;
    req.apiKeyInfo._reqCount = req.apiKeyInfo._reqCount || 0;
    if (now - req.apiKeyInfo._windowStart > windowMs) {
      req.apiKeyInfo._windowStart = now;
      req.apiKeyInfo._reqCount = 0;
    }
    req.apiKeyInfo._reqCount++;
    if (req.apiKeyInfo._reqCount > req.apiKeyInfo.rpmLimit) {
      return res.status(429).json({ error: { message: `RPM limit exceeded (${req.apiKeyInfo.rpmLimit}/min)`, type: 'rate_limit_error', code: 429 } });
    }
  }
  next();
}

// ========== 格式转换模拟 ==========
function simulateFormatConversion(requestFormat, targetProvider) {
  const transformLog = {
    inputFormat: requestFormat,
    targetProvider,
    steps: [],
  };

  if (requestFormat === 'openai' && targetProvider === 'anthropic') {
    transformLog.steps.push('OpenAI messages[] → Anthropic messages[] (role mapping)');
    transformLog.steps.push('temperature → mapped', 'max_tokens → max_tokens');
  } else if (requestFormat === 'openai' && targetProvider === 'google') {
    transformLog.steps.push('OpenAI messages[] → Gemini contents[].parts[]');
    transformLog.steps.push('system message → systemInstruction');
  } else if (requestFormat === 'anthropic' && targetProvider === 'openai') {
    transformLog.steps.push('Anthropic messages[] → OpenAI messages[]');
    transformLog.steps.push('max_tokens → max_tokens');
  } else if (requestFormat === 'openai' && targetProvider === 'deepseek') {
    transformLog.steps.push('OpenAI format → DeepSeek (compatible, passthrough)');
  } else {
    transformLog.steps.push('No conversion needed (compatible format)');
  }

  return transformLog;
}

function getProviderFromModel(model) {
  if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) return 'openai';
  if (model.startsWith('claude-')) return 'anthropic';
  if (model.startsWith('gemini-')) return 'google';
  if (model.startsWith('deepseek-')) return 'deepseek';
  return 'openai';
}

function mockAIResponse(messages, model) {
  const lastMsg = messages[messages.length - 1]?.content || 'Hello';
  const provider = getProviderFromModel(model);
  return {
    id: `chatcmpl-${uuidv4().slice(0, 8)}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: `[Mock ${provider.toUpperCase()} Response via AITokenSharing Gateway]\nModel: ${model}\nReply: This is a simulated response to "${lastMsg.slice(0, 50)}${lastMsg.length > 50 ? '...' : ''}".\n\nIn production, this request would be routed to the actual ${provider} API after format conversion and load balancing.`,
      },
      finish_reason: 'stop',
    }],
    usage: {
      prompt_tokens: 25,
      completion_tokens: 45,
      total_tokens: 70,
      tc_cost: 0.035,
    },
    _gateway_meta: {
      pool_id: 'pool_official',
      upstream_provider: provider,
      format_conversion: simulateFormatConversion('openai', provider),
      latency_ms: 320,
    },
  };
}

// ========== 代理网关端点 (/v1/*) ==========

// OpenAI 兼容 — Chat Completions（支持 SSE 流式响应）
app.post('/v1/chat/completions', authApiKey, rateLimit, (req, res) => {
  const { model, messages, stream } = req.body;
  if (!model || !messages) return res.status(400).json({ error: { message: 'model and messages are required', type: 'invalid_request_error' } });

  const response = mockAIResponse(messages, model);
  USAGE_LOGS.push({ time: Date.now(), userId: req.apiKeyInfo.userId, model, tokens: response.usage.total_tokens, tcCost: response.usage.tc_cost });

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const fullContent = response.choices[0].message.content;
    const chunkSize = 4;
    const chunks = [];
    for (let i = 0; i < fullContent.length; i += chunkSize) {
      chunks.push(fullContent.slice(i, i + chunkSize));
    }

    let sent = 0;
    const interval = setInterval(() => {
      if (sent < chunks.length) {
        const chunk = {
          id: response.id,
          object: 'chat.completion.chunk',
          created: response.created,
          model: response.model,
          choices: [{
            index: 0,
            delta: { content: chunks[sent] },
            finish_reason: null,
          }],
        };
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        sent++;
      } else {
        const finalChunk = {
          id: response.id,
          object: 'chat.completion.chunk',
          created: response.created,
          model: response.model,
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
        };
        res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        clearInterval(interval);
      }
    }, 50);
  } else {
    res.json(response);
  }
});

// OpenAI 兼容 — Models
app.get('/v1/models', authApiKey, (_req, res) => {
  res.json({
    object: 'list',
    data: [
      { id: 'gpt-4o', object: 'model', owned_by: 'openai' },
      { id: 'gpt-4o-mini', object: 'model', owned_by: 'openai' },
      { id: 'claude-sonnet-4-20250514', object: 'model', owned_by: 'anthropic' },
      { id: 'gemini-pro', object: 'model', owned_by: 'google' },
      { id: 'deepseek-chat', object: 'model', owned_by: 'deepseek' },
    ],
  });
});

// OpenAI 兼容 — Responses
app.post('/v1/responses', authApiKey, rateLimit, (req, res) => {
  const { model, input } = req.body;
  if (!input) return res.status(400).json({ error: { message: 'input is required' } });
  res.json({
    id: `resp_${uuidv4().slice(0, 8)}`,
    object: 'response',
    model: model || 'gpt-4o',
    output: [{ type: 'message', content: [{ type: 'output_text', text: `[Mock] Response to: "${input.slice(0, 80)}"` }] }],
    usage: { input_tokens: 15, output_tokens: 30, total_tokens: 45 },
  });
});

// Anthropic 兼容 — Messages
app.post('/v1/messages', authApiKey, rateLimit, (req, res) => {
  const { model, messages, max_tokens } = req.body;
  if (!model || !messages) return res.status(400).json({ error: { type: 'invalid_request_error', message: 'model and messages are required' } });

  res.json({
    id: `msg_${uuidv4().slice(0, 8)}`,
    type: 'message',
    role: 'assistant',
    model,
    content: [{ type: 'text', text: `[Mock Anthropic Response via AITokenSharing] Model: ${model}. Your message was processed through the gateway.` }],
    stop_reason: 'end_turn',
    usage: { input_tokens: 20, output_tokens: Number(max_tokens) || 100 },
  });
});

// Gemini 兼容 — Models
app.get('/v1beta/models', authApiKey, (_req, res) => {
  res.json({
    models: [
      { name: 'models/gemini-pro', displayName: 'Gemini Pro', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-pro-vision', displayName: 'Gemini Pro Vision', supportedGenerationMethods: ['generateContent'] },
    ],
  });
});

// Gemini 兼容 — generateContent
app.post('/v1beta/models/:modelName', authApiKey, rateLimit, (req, res) => {
  const { modelName } = req.params;
  res.json({
    candidates: [{
      content: { parts: [{ text: `[Mock Gemini Response via AITokenSharing] Model: ${modelName}. Request processed by gateway.` }], role: 'model' },
      finishReason: 'STOP',
    }],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 30 },
  });
});

// ========== 管理 API (/api/*) ==========

// Auth
app.post('/api/auth/password', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = Array.from(USERS.values()).find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: user.platformToken, user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/auth/me', authPlatformToken, (req, res) => {
  res.json({ id: req.user.id, name: req.user.name, email: req.user.email, githubLinked: req.user.githubLinked });
});

app.get('/api/auth/profile', authPlatformToken, (req, res) => {
  res.json({ ...req.user, createdAt: '2026-01-15', poolsCreated: 2, poolsJoined: 3, totalEarnedTC: 5000 });
});

app.get('/api/auth/github', (_req, res) => {
  res.redirect('https://github.com/login/oauth/authorize?client_id=mock_client_id&scope=user:email');
});

app.get('/api/auth/github/callback', (req, res) => {
  const { code } = req.query;
  res.json({ token: 'mock-jwt-platform-token-12345', githubUser: { login: 'mockuser', id: 12345 } });
});

app.post('/api/auth/github/bind', authPlatformToken, (_req, res) => res.json({ success: true }));
app.post('/api/auth/github/unbind', authPlatformToken, (_req, res) => res.json({ success: true }));

// Wallet
app.get('/api/wallet/account', authPlatformToken, (req, res) => {
  const wallet = WALLETS.get(req.user.id) || { balance: 0, currency: 'TC', transactions: [] };
  res.json(wallet);
});

app.get('/api/wallet/transactions', authPlatformToken, (req, res) => {
  const wallet = WALLETS.get(req.user.id);
  res.json(wallet?.transactions || []);
});

app.get('/api/wallet/consumption-logs', authPlatformToken, (req, res) => {
  const logs = USAGE_LOGS.filter(l => l.userId === req.user.id);
  res.json({ logs, totalTCSpent: logs.reduce((s, l) => s + (l.tcCost || 0), 0) });
});

app.get('/api/wallet/consumption-stats', authPlatformToken, (req, res) => {
  res.json({ todayTCSpent: 12.5, thisMonthTCSpent: 340, totalTCSpent: 1280, topModels: [{ model: 'gpt-4o', count: 45 }, { model: 'claude-sonnet-4-20250514', count: 30 }] });
});

// Mine / Mining
app.get('/api/mine/miner-keys', authPlatformToken, (req, res) => {
  const keys = Array.from(API_KEYS.entries())
    .filter(([, v]) => v.userId === req.user.id)
    .map(([key, v]) => ({ key: key.slice(0, 8) + '...', fullKey: key, poolId: v.poolId, quotaRemaining: v.quotaRemaining, rpmLimit: v.rpmLimit, createdAt: Date.now() - 86400000 }));
  res.json({ keys });
});

app.post('/api/mine/miner-keys', authPlatformToken, (req, res) => {
  const newKey = `sk-mock-${uuidv4().slice(0, 12)}`;
  API_KEYS.set(newKey, { userId: req.user.id, poolId: req.body.poolId || 'pool_official', quotaRemaining: 500000, rpmLimit: 30 });
  res.json({ key: newKey, message: 'API Key generated successfully' });
});

app.get('/api/mine/miners', authPlatformToken, (req, res) => {
  const miners = Array.from(MINERS.values()).filter(m => m.userId === req.user.id);
  res.json({ miners });
});

app.get('/api/mine/my-mines', authPlatformToken, (req, res) => {
  const mines = Array.from(POOLS.values()).filter(p => p.creatorId === req.user.id);
  res.json({ mines });
});

app.get('/api/mine/pools', authPlatformToken, (_req, res) => {
  res.json({ pools: Array.from(POOLS.values()).map(p => ({ id: p.id, name: p.name, memberCount: p.members.length, status: p.status, officialPoolBadge: p.officialPoolBadge })) });
});

app.get('/api/mine/free-llm', authPlatformToken, (_req, res) => {
  res.json({ freeModels: [{ model: 'gpt-4o-mini', provider: 'openai', dailyLimit: 100 }, { model: 'gemini-flash', provider: 'google', dailyLimit: 50 }] });
});

app.get('/api/mine/llm', authPlatformToken, (_req, res) => res.json({ models: ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4-20250514', 'gemini-pro', 'deepseek-chat'] }));
app.get('/api/mine/vendors', authPlatformToken, (_req, res) => res.json({ vendors: ['openai', 'anthropic', 'google', 'deepseek'] }));
app.get('/api/mine/paid-vendors', authPlatformToken, (_req, res) => res.json({ vendors: ['openai', 'anthropic', 'google'] }));
app.get('/api/mine/types', authPlatformToken, (_req, res) => res.json({ types: ['free', 'paid', 'mining'] }));

app.post('/api/mine/heartbeat', authPlatformToken, (req, res) => {
  const miner = Array.from(MINERS.values()).find(m => m.userId === req.user.id);
  if (miner) {
    miner.heartbeats.push({ time: Date.now(), gpuInfo: req.body.gpuInfo });
    miner.status = 'online';
  }
  res.json({ status: 'ok', serverTime: Date.now() });
});

app.get('/api/mine/tasks/poll', authPlatformToken, (req, res) => {
  res.json({ tasks: [{ id: 'task_001', type: 'inference', model: 'gpt-4o-mini', prompt: 'What is 2+2?' }] });
});

// Pools
app.get('/api/pools/created', authPlatformToken, (req, res) => {
  const pools = Array.from(POOLS.values()).filter(p => p.creatorId === req.user.id);
  res.json({ pools });
});

app.get('/api/pools/joined', authPlatformToken, (req, res) => {
  const pools = Array.from(POOLS.values()).filter(p => p.members.includes(req.user.id) && p.creatorId !== req.user.id);
  res.json({ pools });
});

app.post('/api/pools/join', authPlatformToken, (req, res) => {
  const pool = POOLS.get(req.body.poolId);
  if (!pool) return res.status(404).json({ error: 'Pool not found' });
  res.json({ status: 'pending', message: 'Join request submitted, awaiting approval' });
});

app.get('/api/pools/my-requests', authPlatformToken, (_req, res) => {
  res.json({ requests: [{ poolId: 'pool_deepseek', status: 'pending', createdAt: Date.now() - 3600000 }] });
});

// Market
app.get('/api/market/listings', authPlatformToken, (_req, res) => {
  res.json({ listings: Array.from(POOLS.values()).filter(p => p.marketStatus === 'public').map(p => ({ id: p.id, name: p.name, memberCount: p.members.length, fee: '0.5%', models: p.upstreams.map(u => u.model) })) });
});

// Routes
app.get('/api/routes/available-pools', authPlatformToken, (_req, res) => {
  res.json({ pools: Array.from(POOLS.values()).map(p => ({ id: p.id, name: p.name, upstreamCount: p.upstreams.length, memberCount: p.members.length })) });
});

// ========== 仪表板 / 健康检查 ==========
app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime(), activeKeys: API_KEYS.size, activeMiners: Array.from(MINERS.values()).filter(m => m.status === 'online').length }));

// ========== 启动 ==========
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║     AITokenSharing Mock Gateway Server                  ║
║     http://localhost:${PORT}                            ║
╠══════════════════════════════════════════════════════╣
║  代理网关端点 (API Key 鉴权):                         ║
║    POST /v1/chat/completions    (OpenAI 兼容)       ║
║    POST /v1/responses           (OpenAI 兼容)       ║
║    GET  /v1/models              (OpenAI 兼容)       ║
║    POST /v1/messages            (Anthropic 兼容)    ║
║    GET  /v1beta/models          (Gemini 兼容)       ║
║    POST /v1beta/models/:name    (Gemini 兼容)       ║
╠══════════════════════════════════════════════════════╣
║  管理 API (JWT Token 鉴权):                          ║
║    /api/auth/*    认证 (password + GitHub OAuth)    ║
║    /api/wallet/*  钱包 (余额/流水/消费)             ║
║    /api/mine/*    矿池 (Key/矿机/心跳)              ║
║    /api/pools/*   池管理 (创建/加入/审批)           ║
║    /api/market/*  市场 (挂牌)                       ║
║    /api/routes/*  路由 (可用池)                     ║
╠══════════════════════════════════════════════════════╣
║  测试 API Key:                                      ║
║    sk-mock-aitokensharing-key-00001                     ║
║  平台 JWT Token:                                    ║
║    mock-jwt-platform-token-12345                    ║
╠══════════════════════════════════════════════════════╣
║  健康检查: GET /api/health                           ║
║  测试脚本: node tests/test-gateway.js                ║
║           node tests/test-management.js              ║
╚══════════════════════════════════════════════════════╝
  `);
});
