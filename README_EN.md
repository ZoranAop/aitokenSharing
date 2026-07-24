# AITokenSharing Product Analysis Report

> AI Token Sharing/Resale Gateway Platform — Frontend Static Reverse Engineering Analysis

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/ZoranAop/aitokenSharing/blob/main/LICENSE)

[中文版](./README.md) | English

## Overview

This repository contains a comprehensive product analysis and reverse engineering study of AITokenSharing — an AI Token sharing/resale gateway platform that aggregates multiple AI service provider subscriptions (OpenAI, Claude, Gemini, DeepSeek) into "Pools". Members receive their own derived API Keys and can access all services through unified OpenAI/Anthropic/Gemini-compatible endpoints.

## Report Contents

- [Full Analysis Report (Chinese)](./AITokenSharing%E5%88%86%E6%9E%90.md)
- [Interactive Architecture Diagram](./docs/architecture.html) (open in browser)
- [Reverse Engineering Guide](./HOWTO.md)

The report covers thirteen chapters:

| Chapter | Content |
|---------|---------|
| **1. Product Positioning** | Core value proposition and one-sentence positioning |
| **2. System Architecture** | Mermaid flowchart showing client-gateway-upstream-ecosystem layers |
| **3. Functional Module Breakdown** | Frontend routes, backend APIs, and function mapping |
| **4. Core Request Flow Logic** | Complete 7-step process + sequence diagram |
| **5. Mining Mechanism Analysis** | Deep dive into the Token Mining Pool differential |
| **6. Tech Stack & Architecture** | React + Vite frontend, RESTful API, miner client |
| **7. Business Model & Risk Warnings** | Monetization model and compliance concerns |
| **8. Security Deep Dive** | Attack surface, credential risks, compliance matrix, hardening |
| **9. Competitor Comparison** | Multi-dimensional comparison with LiteLLM / One API / AIHubMix |
| **10. Mining Economic Model** | TC credit parameters, sustainability analysis, ROI estimation |
| **11. API Examples** | curl / Python examples (OpenAI / Anthropic / Gemini endpoints) |
| **12. Replication Method** | Standardized workflow for reverse-engineering similar platforms |
| **13. Appendix: Route/API Inventory** | All frontend routes, gateway endpoints, backend APIs |

## Key Findings

- Platform achieves cross-protocol interoperability through **automatic format conversion** (OpenAI ↔ Claude ↔ Gemini ↔ DeepSeek)
- Introduces **Token Mining Pool** mechanism to incentivize users to contribute their own AI subscription quotas in exchange for TC credits
- Backend handles core routing logic including pool selection, upstream routing, load balancing, rate limiting, and metering
- Multi-user sharing of API Keys likely violates upstream providers' Terms of Service

## Analysis Methodology

- **Landing page scraping**: Extract marketing content and page structure
- **Frontend static resource reverse engineering**: Static code analysis of Vite/React SPA `/assets/index-*.js` bundles
- **Route & API enumeration**: Extract complete React Router table and backend API endpoints from bundle
- **Non-intrusive**: All analysis based on publicly accessible static resources; no actual API calls made

## Disclaimer

This report is for technical learning and research purposes only. The analysis is based on publicly accessible frontend static resources and does not represent any judgment of the AITokenSharing platform or its operators. Users should independently assess platform compliance and adhere to relevant laws, regulations, and each AI service provider's Terms of Service.

## License

MIT
