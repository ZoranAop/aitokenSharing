// 代理网关端点测试 — 模拟 Claude Code / Codex 等工具调用
const BASE = 'http://localhost:3456';
const API_KEY = 'sk-mock-aitokensharing-key-00001';

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

(async () => {
  console.log('\n=== AITokenSharing Mock Gateway — 代理端点测试 ===\n');

  await test('POST /v1/chat/completions (OpenAI)', async () => {
    const { data } = await fetchJSON(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hello, this is a test from the mock gateway!' }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    if (!data.choices?.[0]?.message?.content) throw new Error('Missing response content');
    console.log(`-> model: ${data.model}, tokens: ${data.usage.total_tokens}, gateway_meta: ${JSON.stringify(data._gateway_meta?.format_conversion?.steps)}`);
  });

  await test('POST /v1/chat/completions (Claude via OpenAI)', async () => {
    const { data } = await fetchJSON(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: 'Tell me about the mock server.' }],
      }),
    });
    if (data._gateway_meta?.upstream_provider !== 'anthropic') throw new Error('Expected anthropic upstream');
  });

  await test('POST /v1/messages (Anthropic)', async () => {
    const { data } = await fetchJSON(`${BASE}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 100, messages: [{ role: 'user', content: 'Hello from Anthropic endpoint!' }] }),
    });
    if (data.type !== 'message') throw new Error('Expected message type');
  });

  await test('GET /v1/models (OpenAI)', async () => {
    const { data } = await fetchJSON(`${BASE}/v1/models`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });
    if (!data.data || data.data.length < 4) throw new Error('Expected >= 4 models');
    console.log(`-> ${data.data.length} models available`);
  });

  await test('GET /v1beta/models (Gemini)', async () => {
    const { data } = await fetchJSON(`${BASE}/v1beta/models`, {
      headers: { 'x-api-key': API_KEY },
    });
    if (!data.models) throw new Error('Missing models');
    console.log(`-> ${data.models.length} Gemini models`);
  });

  await test('POST /v1/responses (OpenAI Responses)', async () => {
    const { data } = await fetchJSON(`${BASE}/v1/responses`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', input: 'What is reverse engineering?' }),
    });
    if (!data.output) throw new Error('Missing output');
  });

  await test('POST /v1beta/models/gemini-pro (Gemini)', async () => {
    const { data } = await fetchJSON(`${BASE}/v1beta/models/gemini-pro`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Hello Gemini!' }] }] }),
    });
    if (!data.candidates) throw new Error('Missing candidates');
  });

  await test('POST /v1/chat/completions (SSE 流式)', async () => {
    const res = await fetch(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Stream test' }],
        stream: true,
      }),
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/event-stream')) throw new Error(`Expected text/event-stream, got ${ct}`);
    const text = await res.text();
    if (!text.includes('data: [DONE]')) throw new Error('Missing [DONE] terminator');
    const chunkCount = (text.match(/data: \{/g) || []).length;
    if (chunkCount < 2) throw new Error(`Expected >= 2 chunks, got ${chunkCount}`);
    console.log(`-> ${chunkCount} SSE chunks received, stream OK`);
  });

  await test('401 无效 API Key', async () => {
    const res = await fetch(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer invalid-key', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: 'test' }] }),
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('429 速率限制', async () => {
    const makeReq = () => fetch(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: 'rate limit test' }] }),
    });
    // Fire 61 requests to trigger RPM limit (60)
    const results = await Promise.all(Array.from({ length: 61 }, () => makeReq()));
    const status429 = results.filter(r => r.status === 429);
    if (status429.length === 0) throw new Error('Expected at least one 429 response');
    console.log(`-> ${status429.length} requests got 429 (RPM limit working)`);
  });

  console.log('\n  All proxy gateway tests completed.\n');
})();
