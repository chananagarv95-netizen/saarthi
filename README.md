# SAARTHI — AI Citizen Companion for India

Get any Indian government service done, step by step, in your own language. Ask in text or voice, check documents, find schemes you qualify for, and track deadlines.

## Features

| | |
|---|---|
| **AI assistant** | Understands requests in 13 Indian languages and Hinglish, keeps conversation context, and suggests follow-up questions. |
| **Verified official links** | Portals and helplines come from a curated catalog (`server/services/catalog.js`), never from the model, so a URL can't be hallucinated. |
| **Voice in, voice out** | Speech input and read-aloud in the user's language (Web Speech API, no extra service). |
| **Document check** | Upload a photo or PDF: SAARTHI reads the fields, flags problems and expiry, and says what the document is useful for. Aadhaar numbers are always masked and files are never stored. |
| **Scheme finder** | Matches the profile against 19 central schemes (PM-KISAN, PM-JAY, NSP, APY, Mudra, SVANidhi…). Deterministic rules, instant, works without AI. |
| **Tracker** | Renewals and deadlines with `.ics` calendar reminders. |
| **Any AI provider** | Groq, NVIDIA NIM, OpenRouter, Gemini, OpenAI, Ollama or any OpenAI-compatible endpoint, with automatic failover. |
| **Offline mode** | With no API key the app still works, using the verified catalog. |
| **Privacy by design** | Profile, chats and tracker live in `localStorage`. The API is stateless and has no database. |
| **Product polish** | Three.js hero, dark mode, installable PWA, mobile bottom navigation, accessible controls, reduced-motion support. |

## Quick start

```bash
npm install
cp server/.env.example server/.env   # add at least one key (or none, for offline mode)
npm run api                           # API on http://localhost:3001
npm run dev                           # UI on http://localhost:5173 (proxies /api)
```

Production locally: `npm run build && npm start` serves the UI and API on port 3001.

## AI providers

Set **any one** key. Several keys form a failover chain, tried in this order (override with `LLM_PROVIDERS=nvidia,groq`).

| Provider | Env var | Default model (override with `<PROVIDER>_MODEL`) |
|---|---|---|
| Groq (free tier) | `GROQ_API_KEY` | `llama-3.3-70b-versatile` · vision `llama-4-scout` |
| NVIDIA NIM (free credits) | `NVIDIA_API_KEY` | `meta/llama-3.3-70b-instruct` · vision `llama-4-maverick` |
| OpenRouter | `OPENROUTER_API_KEY` | `meta-llama/llama-3.3-70b-instruct` · vision `gemini-2.5-flash` |
| Google Gemini (free tier) | `GEMINI_API_KEY` | `gemini-2.5-flash` |
| OpenAI | `OPENAI_API_KEY` | `gpt-4.1-mini` |
| Ollama (local) | `OLLAMA_BASE_URL` | `llama3.2` |
| Anything OpenAI-compatible | `LLM_BASE_URL` + `LLM_API_KEY` + `LLM_MODEL` | — |

Document reading needs a vision-capable model (`<PROVIDER>_VISION_MODEL`). PDFs with a text layer work with any model.

## Deploy

**Vercel** (UI on the CDN, API as one serverless function):

```bash
vercel --prod
vercel env add GROQ_API_KEY production   # or NVIDIA_API_KEY, GEMINI_API_KEY…
vercel --prod                            # redeploy so the key takes effect
```

**Docker** (Render, Railway, Fly, any VPS):

```bash
docker build -t saarthi . && docker run -p 3001:3001 -e GROQ_API_KEY=... saarthi
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Status and configured providers |
| POST | `/api/chat` | `{ message, history[], profile }` → answer, workflow, verified service info, follow-ups |
| POST | `/api/workflow` | `{ workflow, profile }` → personalised step-by-step guide |
| POST | `/api/schemes` | `{ profile }` → matched schemes |
| POST | `/api/document/analyze` | multipart `file` (PDF/JPG/PNG/WEBP, ≤ 4 MB) → extracted fields, issues, expiry |
| GET | `/api/services` | Service catalog |

## Project layout

```
api/index.js              Vercel entry (wraps the Express app)
server/index.js           Express app: security, validation, routes, static hosting
server/services/llm.js    Provider-agnostic OpenAI-compatible client with failover
server/services/catalog.js Verified services, helplines, scheme rules, offline classifier
server/services/assistant.js Chat / workflow / document logic (AI + offline fallback)
server/test/              node:test suite (npm test)
src/                      React 19 + Vite frontend, Three.js hero
```

## Quality

- `npm test` runs the API tests: classifier, scheme rules, Aadhaar masking, JSON repair, provider failover against a fake server, validation and endpoints.
- `npm run lint` runs oxlint.
- Security: Helmet CSP, rate limits (general and uploads), input size limits, in-memory uploads only, no secrets in the client.

## Disclaimer

SAARTHI is an independent assistant and is not affiliated with the Government of India. Answers and scheme matches are guidance; always confirm on the official portal. Catalog last reviewed: October 2026.
