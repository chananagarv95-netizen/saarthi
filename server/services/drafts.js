// Formal letter / application drafter. Templates always work offline; when an
// LLM is configured it only polishes wording and translates — it must not add facts.
const { completeJson, LLMUnavailableError } = require('./llm');
const { normalizeProfile } = require('./catalog');

const today = () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
const v = (x, placeholder) => (String(x || '').trim() || `[${placeholder}]`);
const lines = (text) => String(text || '').split(/\n+/).map((s) => s.trim()).filter(Boolean);
const signature = (d) => `Yours faithfully,\n\n${v(d.name, 'Your name')}\n${v(d.address, 'Your address')}\n${d.phone ? `Phone: ${d.phone}\n` : ''}Date: ${today()}`;

const TYPES = {
  RTI: {
    title: 'RTI application',
    blurb: 'Ask any public authority for information under the RTI Act, 2005.',
    fields: [
      { key: 'authority', label: 'Public authority / department', placeholder: 'e.g. Municipal Corporation of Delhi', required: true },
      { key: 'authorityAddress', label: 'Office address', placeholder: 'Address of the PIO' },
      { key: 'questions', label: 'Information you want (one per line)', type: 'textarea', placeholder: 'Status of my complaint no. 1234 dated…\nCopies of file notings on…', required: true },
      { key: 'period', label: 'Period the information relates to', placeholder: 'e.g. 1 Jan 2025 – 30 Sep 2026' },
      { key: 'bpl', label: 'I hold a BPL card (fee exempt)', type: 'checkbox' }
    ],
    build: (d) => `To,
The Public Information Officer,
${v(d.authority, 'Public authority')}
${v(d.authorityAddress, 'Office address')}

Subject: Application seeking information under Section 6(1) of the Right to Information Act, 2005

Sir/Madam,

I, ${v(d.name, 'Your name')}, a citizen of India, request you to provide the following information under the Right to Information Act, 2005:

${(lines(d.questions).length ? lines(d.questions) : ['[Information sought]']).map((q, i) => `${i + 1}. ${q}`).join('\n')}

Period: ${v(d.period, 'Period')}

${d.bpl ? 'I belong to the Below Poverty Line (BPL) category and am exempt from the application fee. A copy of my BPL card is enclosed.' : 'The application fee of ₹10 has been paid by [IPO / DD / court-fee stamp / online payment no. ____].'}

If the information sought is held by another public authority, kindly transfer this application under Section 6(3) of the Act. I request that the information be provided in printed/electronic form.

${signature(d)}`,
    instructions: [
      'Central government bodies: file online at rtionline.gov.in. For state bodies use your state RTI portal or post the letter to the PIO.',
      'Fee is ₹10 for central authorities (state fees vary). BPL applicants are exempt.',
      'The PIO must reply within 30 days (48 hours if it concerns life or liberty).',
      'No reply or unsatisfactory reply? File a first appeal with the First Appellate Authority within 30 days.'
    ],
    portal: 'https://rtionline.gov.in'
  },
  GRIEVANCE: {
    title: 'Public grievance',
    blurb: 'A clear complaint for CPGRAMS or any government office.',
    fields: [
      { key: 'department', label: 'Department / office', placeholder: 'e.g. Delhi Jal Board, Lajpat Nagar', required: true },
      { key: 'issue', label: 'What is the problem?', type: 'textarea', placeholder: 'No water supply in Block C since 3 October…', required: true },
      { key: 'since', label: 'Since when', placeholder: 'e.g. 3 October 2026' },
      { key: 'previous', label: 'Previous complaint numbers (if any)', placeholder: 'e.g. DJB/2026/5512' },
      { key: 'relief', label: 'What resolution do you want?', placeholder: 'Restore supply and fix the pipeline' }
    ],
    build: (d) => `To,
The Officer In-charge,
${v(d.department, 'Department / office')}

Subject: Grievance regarding ${v(lines(d.issue)[0]?.slice(0, 80), 'issue')}

Sir/Madam,

I wish to bring the following issue to your notice:

${v(d.issue, 'Describe the problem')}

This problem has continued since ${v(d.since, 'date')}.${d.previous ? ` I have already complained earlier (reference: ${d.previous}), but the issue remains unresolved.` : ''}

I request you to kindly ${v(d.relief, 'state the resolution you want')} at the earliest and inform me of the action taken.

${signature(d)}`,
    instructions: [
      'File online on CPGRAMS (pgportal.gov.in) choosing the right ministry/state, or submit to the office and get a stamped acknowledgement.',
      'Attach photos or earlier complaint copies.',
      'Note the registration number and track it; you can appeal on CPGRAMS if the resolution is unsatisfactory.'
    ],
    portal: 'https://pgportal.gov.in'
  },
  LOST_DOCUMENT: {
    title: 'Lost document report (police)',
    blurb: 'Report a lost Aadhaar, PAN, passport, RC, certificate etc. — needed for duplicates.',
    fields: [
      { key: 'document', label: 'Which document was lost?', placeholder: 'e.g. Passport', required: true },
      { key: 'docNumber', label: 'Document number (last 4 digits are enough)', placeholder: 'e.g. ending 4521' },
      { key: 'when', label: 'Date & time of loss', placeholder: 'e.g. 10 Oct 2026, around 6 pm', required: true },
      { key: 'where', label: 'Where it was lost', placeholder: 'e.g. DTC bus route 534 near Nehru Place', required: true },
      { key: 'policeStation', label: 'Police station', placeholder: 'e.g. Kalkaji Police Station' }
    ],
    build: (d) => `To,
The Station House Officer,
${v(d.policeStation, 'Police station')}

Subject: Report of loss of ${v(d.document, 'document')}

Sir/Madam,

I, ${v(d.name, 'Your name')}, wish to report that my ${v(d.document, 'document')}${d.docNumber ? ` (number ${d.docNumber})` : ''} was lost on ${v(d.when, 'date and time')} at/near ${v(d.where, 'place')}. Despite searching, I have not been able to find it.

I request you to kindly register this report and provide an acknowledgement / Lost Article Report, which I need to apply for a duplicate document. I also request that any misuse of the document be treated as unauthorised.

${signature(d)}`,
    instructions: [
      'Many states let you file a Lost Article Report online through the state police website or app — you get an instant PDF.',
      'Otherwise submit this letter at the police station and get a stamped copy.',
      'Use the report to apply for the duplicate (e.g. Passport Seva, UIDAI, RTO).'
    ],
    portal: ''
  },
  CYBER_FRAUD: {
    title: 'Cyber / UPI fraud complaint',
    blurb: 'Complaint to your bank and the cyber cell to freeze and recover money.',
    fields: [
      { key: 'bank', label: 'Your bank & branch', placeholder: 'e.g. SBI, Saket branch', required: true },
      { key: 'account', label: 'Account (last 4 digits)', placeholder: 'e.g. ending 7781' },
      { key: 'transactions', label: 'Transactions (amount, date, UTR — one per line)', type: 'textarea', placeholder: '₹15,000 on 12 Oct 2026, UTR 428XXXXXXX', required: true },
      { key: 'how', label: 'How it happened', type: 'textarea', placeholder: 'Received a fake electricity bill SMS with a payment link…' },
      { key: 'ncrp', label: '1930 / cybercrime.gov.in complaint number', placeholder: 'e.g. 31610260012345' }
    ],
    build: (d) => `To,
The Branch Manager,
${v(d.bank, 'Bank & branch')}
(Copy to: Cyber Crime Cell)

Subject: Unauthorised / fraudulent transaction — request to freeze and reverse

Sir/Madam,

I, ${v(d.name, 'Your name')}, hold account ${v(d.account, 'account no.')} with your branch. The following fraudulent transaction(s) were made:

${(lines(d.transactions).length ? lines(d.transactions) : ['[Amount, date, UTR]']).map((t, i) => `${i + 1}. ${t}`).join('\n')}

How it happened: ${v(d.how, 'brief description')}

${d.ncrp ? `I have reported this on the National Cybercrime Reporting Portal / 1930 (complaint no. ${d.ncrp}).` : 'I have reported / am reporting this on 1930 and cybercrime.gov.in.'}

I request you to immediately block further debits, raise a dispute, coordinate with the beneficiary bank to freeze the amount, and reverse it as per RBI guidelines on customer liability for unauthorised electronic transactions. Please acknowledge this complaint.

${signature(d)}`,
    instructions: [
      'Call 1930 first — speed matters for freezing the money.',
      'Submit this letter to your bank (email + branch) within 3 working days of the fraud; under RBI rules, prompt reporting limits your liability.',
      'Keep screenshots, SMS and UTR numbers. File on cybercrime.gov.in if not done already.'
    ],
    portal: 'https://cybercrime.gov.in'
  },
  CONSUMER: {
    title: 'Consumer complaint / notice',
    blurb: 'Formal notice to a seller or service provider before going to the consumer commission.',
    fields: [
      { key: 'company', label: 'Company / seller', placeholder: 'e.g. ABC Electronics Pvt Ltd', required: true },
      { key: 'order', label: 'Order / invoice details', placeholder: 'Order #A123, 2 Sep 2026, ₹24,999', required: true },
      { key: 'issue', label: 'What went wrong?', type: 'textarea', placeholder: 'Phone stopped working within 10 days; replacement refused…', required: true },
      { key: 'relief', label: 'What do you want?', placeholder: 'Full refund of ₹24,999' }
    ],
    build: (d) => `To,
The Customer Grievance Officer,
${v(d.company, 'Company / seller')}

Subject: Complaint regarding ${v(d.order, 'order / invoice')}

Sir/Madam,

I purchased goods/services from you as per ${v(d.order, 'order details')}. ${v(d.issue, 'Describe the problem')}

This amounts to deficiency in service / unfair trade practice under the Consumer Protection Act, 2019. I request you to provide ${v(d.relief, 'the relief you want')} within 15 days of this notice, failing which I will approach the National Consumer Helpline and the appropriate Consumer Commission without further notice.

${signature(d)}`,
    instructions: [
      'Send by email and registered post; keep proof of delivery.',
      'If unresolved, register with the National Consumer Helpline (1915) and then file on e-Daakhil (edaakhil.nic.in).'
    ],
    portal: 'https://consumerhelpline.gov.in'
  },
  GENERAL: {
    title: 'General application',
    blurb: 'Any formal application — school, bank, office, municipal body.',
    fields: [
      { key: 'to', label: 'Addressed to', placeholder: 'e.g. The Principal, Govt. Senior Secondary School, Rohini', required: true },
      { key: 'subject', label: 'Subject', placeholder: 'e.g. Request for transfer certificate', required: true },
      { key: 'body', label: 'What do you want to say?', type: 'textarea', placeholder: 'Key points, reasons, dates…', required: true }
    ],
    build: (d) => `To,
${v(d.to, 'Addressed to')}

Subject: ${v(d.subject, 'Subject')}

Sir/Madam,

${v(d.body, 'Body of the application')}

I shall be grateful for your kind consideration.

${signature(d)}`,
    instructions: ['Keep a copy and get a dated acknowledgement when you submit it.'],
    portal: ''
  }
};

const draftTypes = () => Object.entries(TYPES).map(([id, t]) => ({ id, title: t.title, blurb: t.blurb, fields: t.fields }));

const sanitizeDetails = (type, raw = {}) => {
  const out = {};
  for (const f of [...TYPES[type].fields, { key: 'name' }, { key: 'address' }, { key: 'phone' }]) {
    const val = raw[f.key];
    out[f.key] = f.type === 'checkbox' ? Boolean(val) : String(val ?? '').slice(0, f.type === 'textarea' ? 2000 : 300);
  }
  return out;
};

const createDraft = async ({ type, details, profile: rawProfile }) => {
  const t = TYPES[type];
  const profile = normalizeProfile(rawProfile);
  const d = sanitizeDetails(type, { name: profile.name, ...details });
  const base = t.build(d);
  let letter = base;
  let provider = 'template';

  // Only bother the model when it adds value: non-English output or polishing free text.
  try {
    const { data, provider: used } = await completeJson({
      temperature: 0.2,
      maxTokens: 2500,
      messages: [
        {
          role: 'system',
          content: `You polish formal Indian government letters. Improve grammar and clarity of the user's draft${profile.language !== 'English' ? ` and translate it into ${profile.language} (native script)` : ''}.
Strict rules: keep the same structure, addressee, subject, numbered lists, legal references and every fact. Do NOT add facts, numbers, dates or claims that are not in the draft. Keep any [bracketed placeholders] exactly as they are.
Return ONLY JSON: {"letter": "<full letter text with \\n line breaks>"}`
        },
        { role: 'user', content: base }
      ]
    });
    if (typeof data.letter === 'string' && data.letter.trim().length > base.length * 0.5) {
      letter = data.letter.trim();
      provider = used;
    }
  } catch (error) {
    if (!(error instanceof LLMUnavailableError)) throw error;
  }

  return { type, title: t.title, letter, instructions: t.instructions, portal: t.portal, provider };
};

module.exports = { TYPES, draftTypes, createDraft, sanitizeDetails };
