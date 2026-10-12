const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Start with no provider keys so tests are deterministic and free.
for (const k of ['GROQ_API_KEY', 'NVIDIA_API_KEY', 'OPENROUTER_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'OLLAMA_BASE_URL', 'LLM_BASE_URL', 'LLM_PROVIDERS']) process.env[k] = '';

const { classify, matchSchemes } = require('../services/catalog');
const { maskAadhaar } = require('../services/assistant');
const { parseJson, completeJson, getProviders } = require('../services/llm');
const app = require('../index');

let server, base, fake, fakeBase;
const fakeCalls = [];

before(async () => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
  // Fake OpenAI-compatible provider: /bad/* fails, /good/* answers.
  fake = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      fakeCalls.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(body) });
      if (req.url.startsWith('/bad')) { res.writeHead(500); return res.end('boom'); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: '<think>{x}</think>```json\n{"workflow":"passport","reply":"ok"}\n```' } }] }));
    });
  }).listen(0);
  fakeBase = `http://127.0.0.1:${fake.address().port}`;
});
after(() => { server.close(); fake.close(); });

test('classifier routes common requests to the right service', () => {
  assert.equal(classify('I lost my aadhaar card').workflow, 'LOST_AADHAAR');
  assert.equal(classify('मेरा आधार खो गया').workflow, 'LOST_AADHAAR');
  assert.equal(classify('someone did a UPI fraud on me').workflow, 'CYBER_FRAUD');
  assert.equal(classify('renew my driving licence').workflow, 'DRIVING_LICENCE');
  assert.equal(classify('money gone through a fake UPI link').workflow, 'CYBER_FRAUD');
  assert.equal(classify('hello there').workflow, 'GENERAL');
  assert.equal(classify('company plan').workflow, 'GENERAL'); // "pan" must not match inside words
});

test('scheme rules respect age/occupation/income', () => {
  const ids = (p) => matchSchemes(p).map((s) => s.id);
  assert.ok(ids({ age: 35, occupation: 'farmer', income: 150000 }).includes('pm-kisan'));
  assert.ok(!ids({ age: 35, occupation: 'salaried', income: 150000 }).includes('pm-kisan'));
  assert.ok(ids({ age: 72 }).includes('ayushman-vay-vandana'));
  assert.ok(!ids({ age: 45, income: 900000 }).includes('apy'));
  assert.ok(!ids({ age: 23, occupation: 'student', income: 200000 }).includes('pm-internship')); // full-time students excluded
  assert.ok(ids({ age: 23, occupation: 'unemployed', income: 200000 }).includes('pm-internship'));
  assert.deepEqual(ids({}), []); // empty profile matches nothing rather than everything
});

test('aadhaar numbers are masked everywhere', () => {
  const out = maskAadhaar({ a: '1234 5678 9012', b: ['id 123456789012'], c: { d: '1234-5678-9012' } });
  assert.deepEqual(out, { a: 'XXXX XXXX 9012', b: ['id XXXX XXXX 9012'], c: { d: 'XXXX XXXX 9012' } });
});

test('parseJson tolerates fences, think tags and prose', () => {
  assert.deepEqual(parseJson('<think>{no}</think>Sure! ```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseJson('{"steps":["a" "b"], "x": "trunc'), { steps: ['a', 'b'], x: 'trunc' });
  assert.throws(() => parseJson('no json here'));
});

test('falls back to the next provider when one fails', async () => {
  Object.assign(process.env, { LLM_PROVIDERS: 'groq,custom', GROQ_API_KEY: 'k1', GROQ_BASE_URL: `${fakeBase}/bad`, LLM_BASE_URL: `${fakeBase}/good`, LLM_API_KEY: 'k2', LLM_MODEL: 'm' });
  try {
    assert.deepEqual(getProviders().map((p) => p.name), ['groq', 'custom']);
    const { data, provider } = await completeJson({ messages: [{ role: 'user', content: 'hi' }] });
    assert.equal(provider, 'custom');
    assert.equal(data.workflow, 'passport');
    assert.equal(fakeCalls.at(-1).auth, 'Bearer k2');
    assert.equal(fakeCalls.at(-2).body.response_format.type, 'json_object'); // groq gets JSON mode
  } finally {
    for (const k of ['LLM_PROVIDERS', 'GROQ_API_KEY', 'GROQ_BASE_URL', 'LLM_BASE_URL', 'LLM_API_KEY', 'LLM_MODEL']) process.env[k] = '';
  }
});

test('chat works offline and returns verified portal data', async () => {
  const res = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'I need a new passport' }) });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.provider, 'offline');
  assert.equal(data.workflow, 'PASSPORT');
  assert.equal(data.service.portal, 'https://www.passportindia.gov.in');
});

test('input validation rejects bad requests', async () => {
  const post = (path, body) => fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await post('/api/chat', { message: '' })).status, 400);
  assert.equal((await post('/api/chat', { message: 'x'.repeat(2001) })).status, 400);
  assert.equal((await post('/api/workflow', { workflow: 'NOPE' })).status, 400);
  const form = new FormData();
  form.append('file', new Blob(['hi'], { type: 'text/plain' }), 'a.txt');
  assert.equal((await fetch(`${base}/api/document/analyze`, { method: 'POST', body: form })).status, 400);
});

test('workflow + schemes + health endpoints', async () => {
  const wf = await (await fetch(`${base}/api/workflow`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workflow: 'cyber_fraud' }) })).json();
  assert.equal(wf.helpline, '1930');
  assert.ok(wf.steps.length > 0);
  const sc = await (await fetch(`${base}/api/schemes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: { age: 30, occupation: 'street_vendor', income: 120000 } }) })).json();
  assert.ok(sc.schemes.some((s) => s.id === 'svanidhi'));
  const health = await (await fetch(`${base}/api/health`)).json();
  assert.equal(health.ai, 'offline');
});

test('letter drafter works offline and never drops user facts', async () => {
  const types = await (await fetch(`${base}/api/drafts/types`)).json();
  assert.ok(types.types.some((t) => t.id === 'RTI'));
  const post = (body) => fetch(`${base}/api/drafts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const rti = await (await post({ type: 'RTI', details: { authority: 'MCD', questions: 'Status of complaint 42\nCopy of file notings', bpl: true }, profile: { name: 'Asha' } })).json();
  assert.equal(rti.provider, 'template');
  assert.match(rti.letter, /Section 6\(1\)/);
  assert.match(rti.letter, /1\. Status of complaint 42\n2\. Copy of file notings/);
  assert.match(rti.letter, /BPL/);
  assert.match(rti.letter, /Asha/);
  assert.match(rti.letter, /\[Office address\]/); // missing fields become visible placeholders
  assert.equal((await post({ type: 'NOPE', details: {} })).status, 400);
  assert.equal((await post({ type: 'RTI' })).status, 400);
});

test('services directory exposes categories, steps and office links', async () => {
  const data = await (await fetch(`${base}/api/services`)).json();
  const passport = data.services.find((s) => s.id === 'PASSPORT');
  assert.ok(passport.steps.length > 0);
  assert.equal(passport.category, 'identity');
  assert.match(passport.officeUrl, /^https:\/\/www\.google\.com\/maps\/search\//);
  assert.ok(data.services.every((s) => data.categories.some((c) => c.id === s.category)));
});
