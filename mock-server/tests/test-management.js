// 管理 API 测试 — 模拟平台 Web 控制台操作
const BASE = 'http://localhost:3456';
const TOKEN = 'mock-jwt-platform-token-12345';

async function test(name, fn) {
  process.stdout.write(`  ${name}... `);
  try {
    await fn();
    console.log('OK');
  } catch (e) {
    console.log(`FAILED: ${e.message}`);
  }
}

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data).slice(0, 100)}`);
  return { status: res.status, data };
}

const authHeaders = (token = TOKEN) => ({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });

(async () => {
  console.log('\n=== AITokenBus Mock Gateway — 管理 API 测试 ===\n');

  // Auth
  await test('POST /api/auth/password (登录)', async () => {
    const { data } = await fetchJSON(`${BASE}/api/auth/password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'any' }),
    });
    if (data.token !== TOKEN) throw new Error('Token mismatch');
  });

  await test('GET /api/auth/me', async () => {
    const { data } = await fetchJSON(`${BASE}/api/auth/me`, { headers: authHeaders() });
    if (data.name !== 'Alice') throw new Error('User mismatch');
  });

  await test('GET /api/auth/profile', async () => {
    const { data } = await fetchJSON(`${BASE}/api/auth/profile`, { headers: authHeaders() });
    console.log(`-> user: ${data.name}, pools: ${data.poolsCreated} created / ${data.poolsJoined} joined`);
  });

  // Wallet
  await test('GET /api/wallet/account', async () => {
    const { data } = await fetchJSON(`${BASE}/api/wallet/account`, { headers: authHeaders() });
    console.log(`-> balance: ${data.balance} ${data.currency}`);
  });

  await test('GET /api/wallet/transactions', async () => {
    const { data } = await fetchJSON(`${BASE}/api/wallet/transactions`, { headers: authHeaders() });
    if (!Array.isArray(data)) throw new Error('Expected array');
  });

  await test('GET /api/wallet/consumption-stats', async () => {
    const { data } = await fetchJSON(`${BASE}/api/wallet/consumption-stats`, { headers: authHeaders() });
    console.log(`-> today: ${data.todayTCSpent} TC, month: ${data.thisMonthTCSpent} TC`);
  });

  // Mine
  await test('GET /api/mine/miner-keys', async () => {
    const { data } = await fetchJSON(`${BASE}/api/mine/miner-keys`, { headers: authHeaders() });
    console.log(`-> ${data.keys.length} key(s)`);
  });

  await test('POST /api/mine/miner-keys (生成新 Key)', async () => {
    const { data } = await fetchJSON(`${BASE}/api/mine/miner-keys`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ poolId: 'pool_official' }),
    });
    if (!data.key.startsWith('sk-mock-')) throw new Error('Invalid key format');
  });

  await test('GET /api/mine/miners', async () => {
    const { data } = await fetchJSON(`${BASE}/api/mine/miners`, { headers: authHeaders() });
    if (!data.miners) throw new Error('Missing miners');
    console.log(`-> ${data.miners.length} miner(s), status: ${data.miners[0]?.status}`);
  });

  await test('POST /api/mine/heartbeat', async () => {
    const { data } = await fetchJSON(`${BASE}/api/mine/heartbeat`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ gpuInfo: 'NVIDIA RTX 4090' }),
    });
    if (data.status !== 'ok') throw new Error('Heartbeat failed');
  });

  await test('GET /api/mine/tasks/poll', async () => {
    const { data } = await fetchJSON(`${BASE}/api/mine/tasks/poll`, { headers: authHeaders() });
    console.log(`-> ${data.tasks.length} pending task(s)`);
  });

  await test('GET /api/mine/pools', async () => {
    const { data } = await fetchJSON(`${BASE}/api/mine/pools`, { headers: authHeaders() });
    console.log(`-> ${data.pools.length} pools available`);
  });

  await test('GET /api/mine/free-llm', async () => {
    const { data } = await fetchJSON(`${BASE}/api/mine/free-llm`, { headers: authHeaders() });
    console.log(`-> ${data.freeModels.length} free models`);
  });

  // Pools
  await test('GET /api/pools/created', async () => {
    const { data } = await fetchJSON(`${BASE}/api/pools/created`, { headers: authHeaders() });
    console.log(`-> ${data.pools.length} created pools`);
  });

  await test('GET /api/pools/joined', async () => {
    const { data } = await fetchJSON(`${BASE}/api/pools/joined`, { headers: authHeaders() });
    console.log(`-> ${data.pools.length} joined pools`);
  });

  await test('POST /api/pools/join', async () => {
    const { data } = await fetchJSON(`${BASE}/api/pools/join`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ poolId: 'pool_deepseek' }),
    });
    if (data.status !== 'pending') throw new Error('Expected pending status');
  });

  // Market
  await test('GET /api/market/listings', async () => {
    const { data } = await fetchJSON(`${BASE}/api/market/listings`, { headers: authHeaders() });
    console.log(`-> ${data.listings.length} market listings`);
  });

  // Routes
  await test('GET /api/routes/available-pools', async () => {
    const { data } = await fetchJSON(`${BASE}/api/routes/available-pools`, { headers: authHeaders() });
    console.log(`-> ${data.pools.length} available pools`);
  });

  // Health
  await test('GET /api/health', async () => {
    const { data } = await fetchJSON(`${BASE}/api/health`);
    console.log(`-> uptime: ${data.uptime.toFixed(0)}s, keys: ${data.activeKeys}, miners: ${data.activeMiners}`);
  });

  console.log('\n  All management API tests completed.\n');
})();
