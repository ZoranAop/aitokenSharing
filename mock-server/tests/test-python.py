"""
AITokenSharing Mock Server — Python 客户端测试
模拟使用 OpenAI SDK 通过 AITokenSharing 网关调用不同上游模型

运行方式: pip install openai && python tests/test-python.py
"""
import json
import sys

try:
    from openai import OpenAI
except ImportError:
    print("请先安装 openai: pip install openai")
    sys.exit(1)

BASE_URL = "http://localhost:3456/v1"
API_KEY = "sk-mock-aitokensharing-key-00001"

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)

print("\n=== AITokenSharing Mock Gateway — Python SDK 测试 ===\n")

# 1. 获取模型列表
print("[1] 获取可用模型列表...")
models = client.models.list()
print(f"    共 {len(models.data)} 个模型可用:")
for m in models.data:
    print(f"      - {m.id} ({m.owned_by})")

# 2. OpenAI 原生调用
print("\n[2] 调用 GPT-4o (OpenAI 原生)...")
resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "介绍一下 AITokenSharing 的矿池机制"}],
    temperature=0.7,
    max_tokens=300,
)
print(f"    模型: {resp.model}")
print(f"    Token 用量: {resp.usage.total_tokens}")
print(f"    回复: {resp.choices[0].message.content[:100]}...")

# 3. 跨协议调用 — OpenAI SDK → Claude (平台自动格式转换)
print("\n[3] 跨协议调用: OpenAI SDK → Claude Sonnet...")
resp = client.chat.completions.create(
    model="claude-sonnet-4-20250514",
    messages=[{"role": "user", "content": "Explain mining pools in simple terms"}],
    max_tokens=200,
)
print(f"    模型: {resp.model}")
print(f"    上游 Provider: {resp._gateway_meta.upstream_provider if hasattr(resp, '_gateway_meta') else 'N/A'}")
print(f"    回复: {resp.choices[0].message.content[:100]}...")

# 4. 跨协议调用 — OpenAI SDK → DeepSeek
print("\n[4] 跨协议调用: OpenAI SDK → DeepSeek...")
resp = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "What is reverse engineering?"}],
    max_tokens=150,
)
print(f"    模型: {resp.model}")
print(f"    Token 用量: {resp.usage.total_tokens}")

# 5. 跨协议调用 — OpenAI SDK → Gemini
print("\n[5] 跨协议调用: OpenAI SDK → Gemini...")
resp = client.chat.completions.create(
    model="gemini-pro",
    messages=[{"role": "user", "content": "Hello from Python SDK via AITokenSharing!"}],
    max_tokens=100,
)
print(f"    模型: {resp.model}")
print(f"    上游: {resp._gateway_meta.upstream_provider if hasattr(resp, '_gateway_meta') else 'N/A'}")

# 6. 流式调用模拟（非流式 API，但结构兼容）
print("\n[6] 批量调用测试...")
results = []
for model in ["gpt-4o", "claude-sonnet-4-20250514", "deepseek-chat"]:
    r = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": "Say hi"}],
        max_tokens=50,
    )
    results.append({"model": r.model, "tokens": r.usage.total_tokens})

for r in results:
    print(f"    {r['model']}: {r['tokens']} tokens")

# 7. 错误处理测试
print("\n[7] 错误处理测试...")
try:
    wrong_client = OpenAI(api_key="invalid-key", base_url=BASE_URL)
    wrong_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": "test"}],
    )
except Exception as e:
    print(f"    正确捕获错误: {str(e)[:80]}")

print("\n  Python SDK 测试全部完成!\n")
