const { jsonrepair } = require('jsonrepair');

// Provider-agnostic LLM client. Every supported provider speaks the OpenAI
// /chat/completions dialect, so one fetch call covers all of them.
// Configure any subset of keys; they are tried in order until one answers.

const PRESETS = {
  groq: {
    key: 'GROQ_API_KEY',
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    visionModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
    json: true
  },
  nvidia: {
    key: 'NVIDIA_API_KEY',
    baseURL: 'https://integrate.api.nvidia.com/v1',
    model: 'meta/llama-3.3-70b-instruct',
    visionModel: 'meta/llama-4-maverick-17b-128e-instruct',
    json: false // NIM support for response_format varies by model; the prompt enforces JSON instead
  },
  openrouter: {
    key: 'OPENROUTER_API_KEY',
    baseURL: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct',
    visionModel: 'google/gemini-2.5-flash',
    json: true
  },
  gemini: {
    key: 'GEMINI_API_KEY',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.5-flash',
    visionModel: 'gemini-2.5-flash',
    json: true
  },
  openai: {
    key: 'OPENAI_API_KEY',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
    visionModel: 'gpt-4.1-mini',
    json: true
  },
  ollama: {
    key: 'OLLAMA_BASE_URL', // no key needed; presence of the URL enables it
    baseURL: 'http://localhost:11434/v1',
    model: 'llama3.2',
    visionModel: 'llama3.2-vision',
    json: true
  },
  custom: {
    key: 'LLM_BASE_URL', // any other OpenAI-compatible endpoint (Together, Fireworks, DeepInfra, vLLM, LM Studio...)
    baseURL: '',
    model: '',
    visionModel: '',
    json: false
  }
};

const env = (name) => (process.env[name] || '').trim();

// Reads env on every call so tests and hot config changes need no restart.
const getProviders = () => {
  const order = env('LLM_PROVIDERS')
    ? env('LLM_PROVIDERS').split(',').map((s) => s.trim().toLowerCase())
    : Object.keys(PRESETS);

  return order
    .filter((name) => PRESETS[name] && env(PRESETS[name].key))
    .map((name) => {
      const p = PRESETS[name];
      const up = name.toUpperCase();
      const isCustom = name === 'custom';
      const baseURL = isCustom ? env('LLM_BASE_URL') : env(`${up}_BASE_URL`) || p.baseURL;
      const model = env(isCustom ? 'LLM_MODEL' : `${up}_MODEL`) || p.model;
      return {
        name,
        baseURL: baseURL.replace(/\/+$/, ''),
        apiKey: isCustom ? env('LLM_API_KEY') : name === 'ollama' ? 'ollama' : env(p.key),
        model,
        visionModel: env(isCustom ? 'LLM_VISION_MODEL' : `${up}_VISION_MODEL`) || p.visionModel || model,
        json: p.json
      };
    })
    .filter((p) => p.baseURL && p.model);
};

class LLMUnavailableError extends Error {
  constructor(message, causes = []) {
    super(message);
    this.code = 'LLM_UNAVAILABLE';
    this.causes = causes;
  }
}

const parseJson = (content) => {
  if (!content || typeof content !== 'string') throw new Error('Empty model response');
  const cleaned = content
    .replace(/<think>[\s\S]*?<\/think>/gi, '') // reasoning models (DeepSeek R1, Qwen) prepend thoughts
    .replace(/```(?:json)?/gi, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    if (start === -1) throw new Error('Model did not return valid JSON');
    // Smaller/open models often emit near-JSON (missing commas, truncated tail): repair it.
    return JSON.parse(jsonrepair(cleaned.slice(start)));
  }
};

const callProvider = async (provider, { messages, temperature, vision, maxTokens }) => {
  const body = {
    model: vision ? provider.visionModel : provider.model,
    messages,
    temperature,
    max_tokens: maxTokens
  };
  if (provider.json) body.response_format = { type: 'json_object' };

  const res = await fetch(`${provider.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
      'HTTP-Referer': env('PUBLIC_URL') || 'https://saarthi.app', // OpenRouter attribution; ignored elsewhere
      'X-Title': 'SAARTHI'
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(env('LLM_TIMEOUT_MS')) || 45000)
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`${provider.name} HTTP ${res.status}: ${text.slice(0, 200)}`);
  const data = JSON.parse(text);
  return parseJson(data.choices?.[0]?.message?.content);
};

// Returns { data, provider }. Throws LLMUnavailableError when nothing answered,
// so callers can fall back to the offline engine.
const completeJson = async ({ messages, temperature = 0.2, vision = false, maxTokens = 1500 }) => {
  const providers = getProviders();
  if (!providers.length) throw new LLMUnavailableError('No LLM provider configured');

  const causes = [];
  for (const provider of providers) {
    try {
      const data = await callProvider(provider, { messages, temperature, vision, maxTokens });
      return { data, provider: provider.name };
    } catch (error) {
      causes.push(error.message);
      console.warn(`[llm] ${provider.name} failed: ${error.message}`);
    }
  }
  throw new LLMUnavailableError('All LLM providers failed', causes);
};

module.exports = { completeJson, getProviders, parseJson, LLMUnavailableError, PRESETS };
