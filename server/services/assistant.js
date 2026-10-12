const { completeJson, LLMUnavailableError } = require('./llm');
const { SERVICES, WORKFLOWS, classify, publicService, normalizeProfile } = require('./catalog');

// ── helpers ──────────────────────────────────────────────────────────────────
const str = (v, fallback = '') => (v === undefined || v === null || v === '' ? fallback : typeof v === 'object' ? JSON.stringify(v) : String(v));
const strList = (v, max = 12) => (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean).map((x) => str(x)).slice(0, max);
const clamp01 = (v, d) => (Number.isFinite(Number(v)) ? Math.max(0, Math.min(1, Number(v))) : d);
const normWorkflow = (w) => (WORKFLOWS.includes(String(w || '').toUpperCase()) ? String(w).toUpperCase() : 'GENERAL');

// UIDAI rules forbid displaying full Aadhaar numbers; mask everything we return.
const maskAadhaar = (value) => {
  if (typeof value === 'string') return value.replace(/\b(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})\b/g, 'XXXX XXXX $3');
  if (Array.isArray(value)) return value.map(maskAadhaar);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskAadhaar(v)]));
  return value;
};

const catalogBrief = WORKFLOWS.map((id) => `${id}: ${SERVICES[id].title}${SERVICES[id].portal ? ` (${SERVICES[id].portal})` : ''}`).join('\n');

const profileLine = (p) => {
  const parts = [p.name && `name ${p.name}`, p.age !== null && `age ${p.age}`, p.gender, p.state && `lives in ${p.state}`, p.occupation, p.income !== null && `annual family income ₹${p.income}`, p.category && `category ${p.category.toUpperCase()}`];
  return parts.filter(Boolean).join(', ') || 'not provided';
};

const languageRule = (lang, mirror = false) => `Write every human-readable string value in ${lang} (use its native script, e.g. Devanagari for Hindi).${mirror ? " If the user clearly writes in a different language or Hinglish, mirror the user's language instead." : ''} Keep JSON keys, workflow codes and URLs in English.`;

// ── chat ─────────────────────────────────────────────────────────────────────
const offlineChat = (message, history = []) => {
  // Follow-ups like "what documents for that?" inherit the topic of earlier user turns.
  const lastTopic = history.filter((m) => m.role === 'user').map((m) => m.content).join(' ');
  let { workflow, score } = classify(message);
  if (!score && lastTopic) ({ workflow, score } = classify(lastTopic));
  const svc = SERVICES[workflow];
  const reply = score > 0
    ? `Here is how to get help with ${svc.title}:\n\n${svc.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    : 'I can guide you through Indian government services — Aadhaar, PAN, passport, driving licence, scholarships, pensions, ration card, farmer schemes, complaints and more. Tell me what you need, for example "I lost my Aadhaar card".';
  return {
    workflow,
    reply,
    requiredDocuments: svc.documents,
    nextActions: score > 0 ? ['Open the official portal', 'View the full checklist'] : [],
    estimatedTime: '',
    confidence: score > 0 ? Math.min(0.9, 0.4 + score * 0.1) : 0.2,
    followUps: score > 0 ? [] : ['I lost my Aadhaar card', 'How do I apply for a passport?', 'Which schemes am I eligible for?']
  };
};

const processChat = async ({ message, history = [], profile: rawProfile }) => {
  const profile = normalizeProfile(rawProfile);
  let result;
  let provider = 'offline';

  try {
    const { data, provider: used } = await completeJson({
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are SAARTHI, a trusted, empathetic AI companion that helps Indian citizens with government services.

Rules:
- Be accurate and practical. Never invent portals, phone numbers, fees or deadlines. If unsure, say it varies and point to the official portal.
- If the user describes an emergency (danger, violence, medical emergency) tell them to call 112 first.
- If the user reports an online/UPI fraud, tell them to call 1930 immediately.
- Never ask for full Aadhaar numbers, OTPs, passwords or bank PINs.
- Personalise using the citizen profile when relevant (state-specific portals, eligibility).
- ${languageRule(profile.language, true)}

Known services (pick the best workflow code):
${catalogBrief}

Citizen profile: ${profileLine(profile)}

Return ONLY a JSON object with keys:
workflow (one code from the list above),
reply (helpful answer, can use short numbered steps separated by \\n, max ~150 words),
requiredDocuments (array of strings),
nextActions (array of short strings),
estimatedTime (string, "" if unknown),
confidence (0-1),
followUps (array of up to 3 short follow-up questions the user may ask next).`
        },
        ...history.slice(-8).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: str(m.content).slice(0, 2000) })),
        { role: 'user', content: message }
      ]
    });
    provider = used;
    result = {
      workflow: normWorkflow(data.workflow),
      reply: str(data.reply, offlineChat(message, history).reply),
      requiredDocuments: strList(data.requiredDocuments),
      nextActions: strList(data.nextActions, 5),
      estimatedTime: str(data.estimatedTime),
      confidence: clamp01(data.confidence, 0.7),
      followUps: strList(data.followUps, 3)
    };
  } catch (error) {
    if (!(error instanceof LLMUnavailableError)) throw error;
    result = offlineChat(message, history);
  }

  return { ...result, service: publicService(result.workflow), provider };
};

// ── workflow checklist ──────────────────────────────────────────────────────
const offlineWorkflow = (workflow) => {
  const svc = SERVICES[workflow];
  return {
    title: svc.title,
    steps: svc.steps.map((s, i) => ({ title: `Step ${i + 1}`, description: s })),
    requiredDocuments: svc.documents,
    fees: svc.fees || 'Check the official portal for the current fee.',
    timeline: 'Varies by state and department.',
    tips: []
  };
};

const processWorkflow = async ({ workflow: rawWorkflow, context = '', profile: rawProfile }) => {
  const workflow = normWorkflow(rawWorkflow);
  const profile = normalizeProfile(rawProfile);
  const svc = SERVICES[workflow];
  let result;
  let provider = 'offline';

  try {
    const { data, provider: used } = await completeJson({
      temperature: 0.1,
      maxTokens: 2500, // non-Latin scripts (Hindi, Tamil...) use many more tokens
      messages: [
        {
          role: 'system',
          content: `You are an expert on Indian government procedures. Produce a precise, personalised checklist.
Ground your answer on this verified reference; you may add state-specific detail but never contradict it or invent URLs/phone numbers:
Service: ${svc.title} — ${svc.department}
Official portal: ${svc.portal || 'state-specific'}
Helpline: ${svc.helpline || 'n/a'}
Reference steps: ${svc.steps.join(' | ')}
Reference documents: ${svc.documents.join(', ')}
${svc.fees ? `Reference fees: ${svc.fees}` : ''}

${languageRule(profile.language)}

Return ONLY JSON with keys: title, steps (array of {title, description}), requiredDocuments (array), fees (string), timeline (string), tips (array of up to 3 practical tips).`
        },
        { role: 'user', content: `Citizen profile: ${profileLine(profile)}\nContext: ${str(context).slice(0, 500) || 'none'}` }
      ]
    });
    provider = used;
    const steps = Array.isArray(data.steps) ? data.steps.slice(0, 12).map((s, i) => ({ title: str(s?.title, `Step ${i + 1}`), description: str(s?.description) })) : [];
    result = {
      title: str(data.title, svc.title),
      steps: steps.length ? steps : offlineWorkflow(workflow).steps,
      requiredDocuments: strList(data.requiredDocuments).length ? strList(data.requiredDocuments) : svc.documents,
      fees: str(data.fees, svc.fees || 'Check the official portal for the current fee.'),
      timeline: str(data.timeline, 'Varies by state and department.'),
      tips: strList(data.tips, 3)
    };
  } catch (error) {
    if (!(error instanceof LLMUnavailableError)) throw error;
    result = offlineWorkflow(workflow);
  }

  // Portal/helpline always come from the verified catalog.
  return { workflow, ...result, portal: svc.portal, helpline: svc.helpline, provider };
};

// ── document analysis ───────────────────────────────────────────────────────
const DOC_SCHEMA = `Return ONLY JSON with keys:
documentType (e.g. "Aadhaar card", "PAN card", "Income certificate", "Class 12 marksheet"),
summary (1-2 sentences),
extractedFields (object of human-readable label -> value for the key fields you can read; write any Aadhaar number as XXXX XXXX + last 4 digits),
quality ("good" | "poor" | "unreadable"),
issues (array: missing fields, blur, expiry, name mismatch risks),
expiryDate (string, "" if none),
usefulFor (array of workflow codes from: ${WORKFLOWS.join(', ')}),
nextSteps (array of short strings),
confidence (0-1).
Do not claim the document is officially verified or genuine — you can only read it.`;

const offlineDocument = (text = '') => {
  const pan = text.match(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/);
  const aadhaar = /\b\d{4}\s?\d{4}\s?\d{4}\b/.test(text);
  const dob = text.match(/\b\d{2}[/-]\d{2}[/-]\d{4}\b/);
  const fields = {};
  if (pan) fields['PAN'] = pan[0];
  if (dob) fields['Date'] = dob[0];
  const documentType = aadhaar ? 'Aadhaar card (likely)' : pan ? 'PAN card (likely)' : text ? 'Text document' : 'Unknown document';
  return {
    documentType,
    summary: text ? 'Basic offline scan completed. Configure an AI provider for full field extraction.' : 'AI document reading is not configured on this server, so the document could not be read.',
    extractedFields: fields,
    quality: text ? 'good' : 'unreadable',
    issues: text ? [] : ['Automatic reading unavailable — please check the document manually.'],
    expiryDate: '',
    usefulFor: aadhaar ? ['LOST_AADHAAR'] : pan ? ['PAN'] : [],
    nextSteps: ['Store official documents in DigiLocker (digilocker.gov.in)'],
    confidence: text ? 0.4 : 0
  };
};

const normalizeDocResult = (data) => ({
  documentType: str(data.documentType, 'Unknown document'),
  summary: str(data.summary),
  extractedFields: data.extractedFields && typeof data.extractedFields === 'object' && !Array.isArray(data.extractedFields)
    ? Object.fromEntries(Object.entries(data.extractedFields).slice(0, 20).map(([k, v]) => [str(k), str(v)]).filter(([, v]) => v))
    : {},
  quality: ['good', 'poor', 'unreadable'].includes(data.quality) ? data.quality : 'poor',
  issues: strList(data.issues, 8),
  expiryDate: str(data.expiryDate),
  usefulFor: strList(data.usefulFor, 5).map(normWorkflow).filter((w) => w !== 'GENERAL'),
  nextSteps: strList(data.nextSteps, 6),
  confidence: clamp01(data.confidence, 0.5)
});

let pdfParse; // lazy: only load the PDF parser when a PDF arrives
const extractPdfText = async (buffer) => {
  pdfParse = pdfParse || require('pdf-parse/lib/pdf-parse.js');
  const { text } = await pdfParse(buffer, { max: 5 });
  return text.replace(/\s+/g, ' ').trim();
};

const analyzeDocument = async ({ buffer, mimeType, filename, profile: rawProfile }) => {
  const profile = normalizeProfile(rawProfile);
  const isPdf = mimeType === 'application/pdf';
  const pdfText = isPdf ? await extractPdfText(buffer).catch(() => '') : '';

  if (isPdf && pdfText.length < 30) {
    return {
      ...offlineDocument(''),
      documentType: 'Scanned PDF',
      summary: 'This PDF has no readable text layer (it looks scanned).',
      issues: ['Upload a clear photo or screenshot (JPG/PNG) of the page instead so it can be read.'],
      provider: 'none'
    };
  }

  const system = `You read Indian government documents for citizens. ${languageRule(profile.language)}\n${DOC_SCHEMA}`;
  const userContent = isPdf
    ? `Filename: ${filename}\nDocument text:\n${pdfText.slice(0, 8000)}`
    : [
        { type: 'text', text: `Read this document image. Filename: ${filename}` },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${buffer.toString('base64')}` } }
      ];

  try {
    const { data, provider } = await completeJson({
      temperature: 0.1,
      vision: !isPdf,
      messages: [{ role: 'system', content: system }, { role: 'user', content: userContent }]
    });
    return { ...maskAadhaar(normalizeDocResult(data)), provider };
  } catch (error) {
    if (!(error instanceof LLMUnavailableError)) throw error;
    return { ...maskAadhaar(offlineDocument(pdfText)), provider: 'offline' };
  }
};

module.exports = { processChat, processWorkflow, analyzeDocument, maskAadhaar, offlineChat };
