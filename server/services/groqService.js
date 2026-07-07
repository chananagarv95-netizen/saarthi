const Groq = require('groq-sdk');

const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama3-70b-8192';

const WORKFLOWS = [
  'LOST_AADHAAR',
  'SCHOLARSHIP',
  'PASSPORT',
  'DRIVING_LICENCE',
  'INCOME_CERT',
  'COMPLAINT',
  'PROPERTY',
  'HEALTHCARE',
  'AGRICULTURE',
  'EMPLOYMENT',
  'PAN',
  'DOMICILE',
  'BIRTH_CERT',
  'DEATH_CERT',
  'MARRIAGE_CERT',
  'PENSION',
  'ELECTRICITY',
  'WATER',
  'GAS',
  'CROP_INSURANCE',
  'GENERAL'
];

const DEFAULT_INTENT = {
  intent: 'general_government_service_query',
  department: 'Government Services',
  confidence: 0.7,
  workflow: 'GENERAL',
  reply: 'I can help you identify the right government service and the next steps. Please share a little more detail about what you need.',
  timeline: 'Varies by service and department.',
  requiredDocuments: [],
  estimatedTime: 'Varies',
  sources: ['Official government portal'],
  nextActions: ['Share more details about your request'],
  widgetType: 'GENERAL'
};

const DEFAULT_DOCUMENT = {
  documentType: 'Unknown document',
  isValid: false,
  confidence: 0,
  extractedFields: {
    name: '',
    dob: '',
    address: '',
    idNumber: '',
    expiryDate: '',
    issuedBy: ''
  },
  missingFields: [],
  verificationStatus: 'Manual review required',
  department: 'Government Services',
  nextSteps: ['Upload a clear document image or verify details on the official portal'],
  eligibilityStatus: 'Unable to determine',
  remarks: 'The document could not be fully verified from the available file metadata.'
};

const SYSTEM_INSTRUCTION = `You are SAARTHI, India's AI Citizen Companion, a trusted and empathetic assistant for Indian government services.

Return only valid JSON. Do not include markdown, prose outside JSON, comments, or trailing commas.

For chat intent responses, use exactly these keys:
intent, department, confidence, workflow, reply, timeline, requiredDocuments, estimatedTime, sources, nextActions, widgetType.

Workflow must be one of:
${WORKFLOWS.join(', ')}

Keep reply concise, calm, practical, and citizen-friendly.`;

const WORKFLOW_SYSTEM_INSTRUCTION = `You are a government services expert for India.

Return only valid JSON. Do not include markdown or prose outside JSON.

Use exactly these top-level keys:
workflow, title, description, steps, requiredDocuments, fees, timeline, governmentPortal, helpline, eligibilityCriteria.

Each item in steps must include:
stepNumber, title, description, action.`;

const DOCUMENT_SYSTEM_INSTRUCTION = `You are a document verification assistant for Indian government services.

Return only valid JSON. Do not include markdown or prose outside JSON.

Use exactly these top-level keys:
documentType, isValid, confidence, extractedFields, missingFields, verificationStatus, department, nextSteps, eligibilityStatus, remarks.

extractedFields must include:
name, dob, address, idNumber, expiryDate, issuedBy.`;

const getClient = () => {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error('GROQ_API_KEY is not configured');
    error.status = 500;
    error.code = 'MISSING_GROQ_API_KEY';
    throw error;
  }

  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const parseJson = (content) => {
  if (!content || typeof content !== 'string') {
    throw new Error('AI response was empty');
  }

  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('AI response was not valid JSON');
  }
};

const asArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value === undefined || value === null || value === '') return [];
  if (typeof value === 'object') return [JSON.stringify(value)];
  return [String(value)];
};

const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asString = (value, fallback = '') => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const normalizeWorkflow = (workflow) => {
  const candidate = String(workflow || '').toUpperCase();
  return WORKFLOWS.includes(candidate) ? candidate : 'GENERAL';
};

const normalizeWorkflowCode = (candidate, fallback = 'GENERAL') => {
  const normalized = normalizeWorkflow(candidate);
  if (normalized !== 'GENERAL') return normalized;
  return normalizeWorkflow(fallback);
};

const normalizeIntent = (data) => {
  const workflow = normalizeWorkflow(data.workflow);

  return {
    intent: asString(data.intent, DEFAULT_INTENT.intent),
    department: asString(data.department, DEFAULT_INTENT.department),
    confidence: Math.max(0, Math.min(1, asNumber(data.confidence, DEFAULT_INTENT.confidence))),
    workflow,
    reply: asString(data.reply, DEFAULT_INTENT.reply),
    timeline: asString(data.timeline, DEFAULT_INTENT.timeline),
    requiredDocuments: asArray(data.requiredDocuments),
    estimatedTime: asString(data.estimatedTime, DEFAULT_INTENT.estimatedTime),
    sources: asArray(data.sources),
    nextActions: asArray(data.nextActions),
    widgetType: asString(data.widgetType, workflow)
  };
};

const normalizeWorkflowResponse = (data, workflow) => ({
  workflow: normalizeWorkflowCode(data.workflow, workflow),
  title: asString(data.title, `${workflow} Guidance`),
  description: asString(data.description, 'Step-by-step guidance for this government service.'),
  steps: Array.isArray(data.steps) ? data.steps.map((step, index) => ({
    stepNumber: asNumber(step.stepNumber, index + 1),
    title: asString(step.title, `Step ${index + 1}`),
    description: asString(step.description),
    action: asString(step.action)
  })) : [],
  requiredDocuments: asArray(data.requiredDocuments),
  fees: asString(data.fees, 'Check the official portal for the latest fee.'),
  timeline: asString(data.timeline, 'Varies by department.'),
  governmentPortal: asString(data.governmentPortal, 'https://www.india.gov.in'),
  helpline: asString(data.helpline, 'Contact the relevant department helpline.'),
  eligibilityCriteria: asArray(data.eligibilityCriteria)
});

const normalizeDocument = (data) => ({
  documentType: asString(data.documentType, DEFAULT_DOCUMENT.documentType),
  isValid: Boolean(data.isValid),
  confidence: Math.max(0, Math.min(1, asNumber(data.confidence, DEFAULT_DOCUMENT.confidence))),
  extractedFields: {
    ...DEFAULT_DOCUMENT.extractedFields,
    ...(data.extractedFields && typeof data.extractedFields === 'object' ? data.extractedFields : {})
  },
  missingFields: asArray(data.missingFields),
  verificationStatus: asString(data.verificationStatus, DEFAULT_DOCUMENT.verificationStatus),
  department: asString(data.department, DEFAULT_DOCUMENT.department),
  nextSteps: asArray(data.nextSteps),
  eligibilityStatus: asString(data.eligibilityStatus, DEFAULT_DOCUMENT.eligibilityStatus),
  remarks: asString(data.remarks, DEFAULT_DOCUMENT.remarks)
});

const createJsonCompletion = async ({ messages, temperature = 0.2 }) => {
  const client = getClient();
  let lastError;

  for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        temperature,
        response_format: { type: 'json_object' }
      });

      return parseJson(response.choices?.[0]?.message?.content);
    } catch (error) {
      lastError = error;
      const status = error.status || error.response?.status;
      if (model === PRIMARY_MODEL && (status === 400 || status === 404 || status === 429 || status >= 500)) {
        continue;
      }
      if (model === PRIMARY_MODEL && /model|rate|quota|limit|unavailable/i.test(error.message || '')) {
        continue;
      }
      break;
    }
  }

  throw lastError;
};

const processIntent = async (userMessage) => {
  const data = await createJsonCompletion({
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      {
        role: 'user',
        content: `Classify this citizen request and provide guidance as JSON only:\n\n${userMessage}`
      }
    ]
  });

  return normalizeIntent(data);
};

const processWorkflow = async (workflow, userContext) => {
  const data = await createJsonCompletion({
    temperature: 0.1,
    messages: [
      { role: 'system', content: WORKFLOW_SYSTEM_INSTRUCTION },
      {
        role: 'user',
        content: `Generate detailed workflow guidance for ${workflow}.

User context: ${userContext || 'No additional context provided.'}

Include a practical checklist, required documents, fees, timeline, official Indian government portal link, helpline, and eligibility criteria. Return JSON only.`
      }
    ]
  });

  return normalizeWorkflowResponse(data, workflow);
};

const analyzeDocument = async (base64Data, mimeType, filename) => {
  const data = await createJsonCompletion({
    temperature: 0.1,
    messages: [
      { role: 'system', content: DOCUMENT_SYSTEM_INSTRUCTION },
      {
        role: 'user',
        content: `Analyze this uploaded document using the available metadata and return JSON only.

Filename: ${filename || 'unknown'}
MIME type: ${mimeType || 'unknown'}
Base64 size: ${base64Data ? base64Data.length : 0} characters

If the document contents are not readable from metadata alone, mark confidence low and recommend manual/official portal verification.`
      }
    ]
  });

  return normalizeDocument(data);
};

const processVoiceTranscript = async (transcript) => {
  return processIntent(transcript);
};

module.exports = { processIntent, processWorkflow, analyzeDocument, processVoiceTranscript };
