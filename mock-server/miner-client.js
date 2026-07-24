/**
 * AITokenSharing 矿工客户端示例
 *
 * 模拟本地 miner daemon 的行为：
 * 1. 使用平台 JWT Token 鉴权
 * 2. 定期发送心跳（上报 GPU 信息）
 * 3. 轮询任务队列，接收推理任务
 *
 * 运行方式: node miner-client.js
 *
 * 在真实 AITokenSharing 平台中，矿工客户端是一个本地 daemon 进程，
 * 持续运行并贡献自有 AI 订阅额度以赚取 TC 积分。
 */

const BASE = process.env.MOCK_SERVER_URL || 'http://localhost:3456';
const TOKEN = process.env.PLATFORM_TOKEN || 'mock-jwt-platform-token-12345';
const GPU_INFO = process.env.GPU_INFO || 'NVIDIA RTX 4090';
const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL || '10', 10); // seconds
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '5', 10); // seconds

const headers = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function sendHeartbeat() {
  try {
    const res = await fetch(`${BASE}/api/mine/heartbeat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ gpuInfo: GPU_INFO }),
    });
    const data = await res.json();
    if (data.status === 'ok') {
      console.log(`[${new Date().toISOString()}] Heartbeat OK | GPU: ${GPU_INFO}`);
    } else {
      console.error(`[${new Date().toISOString()}] Heartbeat failed:`, data);
    }
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Heartbeat error: ${e.message}`);
  }
}

async function pollTasks() {
  try {
    const res = await fetch(`${BASE}/api/mine/tasks/poll`, { headers });
    const data = await res.json();
    if (data.tasks && data.tasks.length > 0) {
      for (const task of data.tasks) {
        console.log(`[${new Date().toISOString()}] Received task: ${task.id} | type: ${task.type} | model: ${task.model}`);
        console.log(`  Prompt: ${task.prompt}`);
      }
    } else {
      console.log(`[${new Date().toISOString()}] No pending tasks`);
    }
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Poll error: ${e.message}`);
  }
}

async function showStatus() {
  try {
    const res = await fetch(`${BASE}/api/mine/miners`, { headers });
    const data = await res.json();
    if (data.miners && data.miners.length > 0) {
      const m = data.miners[0];
      console.log(`[${new Date().toISOString()}] Miner: ${m.id} | status: ${m.status} | GPU: ${m.gpuInfo} | earned: ${m.earnedTC} TC`);
    }
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Status error: ${e.message}`);
  }
}

console.log('========================================');
console.log('  AITokenSharing Miner Client (Mock)');
console.log('========================================');
console.log(`  Server:    ${BASE}`);
console.log(`  GPU:       ${GPU_INFO}`);
console.log(`  Heartbeat: every ${HEARTBEAT_INTERVAL}s`);
console.log(`  Poll:      every ${POLL_INTERVAL}s`);
console.log('========================================\n');

sendHeartbeat();
showStatus();
pollTasks();

setInterval(sendHeartbeat, HEARTBEAT_INTERVAL * 1000);
setInterval(pollTasks, POLL_INTERVAL * 1000);

process.on('SIGINT', () => {
  console.log('\nMiner client stopped.');
  process.exit(0);
});
