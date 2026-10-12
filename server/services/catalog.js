// Curated, verified service + scheme data. This is the source of truth for
// official portals and helplines: LLM output is grounded on it and portal/helpline
// fields are always overwritten from here, so the model can never invent a URL.
// Fees and rules change: keep `lastReviewed` honest when you edit.

const lastReviewed = '2026-10';

const SERVICES = {
  LOST_AADHAAR: {
    title: 'Aadhaar (lost / download / update)', emoji: '🪪', department: 'UIDAI',
    portal: 'https://myaadhaar.uidai.gov.in', helpline: '1947',
    keywords: ['aadhaar', 'aadhar', 'adhar', 'uid', 'uidai', 'e-aadhaar', 'आधार'],
    documents: ['Registered mobile number or email', 'Enrolment ID (EID) or Aadhaar number, if known'],
    steps: [
      'Open myAadhaar → "Retrieve EID/UID" and enter your name and registered mobile/email to get your Aadhaar number by SMS.',
      'Use "Download Aadhaar" with the OTP to get the password-protected e-Aadhaar PDF (password: first 4 letters of name in CAPS + birth year).',
      'Optionally "Order Aadhaar PVC Card" online (₹50, delivered by Speed Post).',
      'If your mobile is not linked, visit an Aadhaar Seva Kendra / enrolment centre for biometric verification.'
    ]
  },
  PASSPORT: {
    title: 'Passport (fresh / re-issue)', emoji: '🛂', department: 'Ministry of External Affairs',
    portal: 'https://www.passportindia.gov.in', helpline: '1800-258-1800',
    keywords: ['passport', 'psk', 'tatkal', 'tatkaal', 'पासपोर्ट'],
    documents: ['Proof of present address (Aadhaar, utility bill, bank passbook)', 'Proof of date of birth (birth certificate, Aadhaar, PAN, 10th certificate)', 'Old passport (for re-issue)'],
    steps: [
      'Register on Passport Seva Online / mPassport Seva app and fill the application.',
      'Pay the fee online and book an appointment at a Passport Seva Kendra (PSK) or POPSK.',
      'Visit with original documents for biometrics and document verification.',
      'Complete police verification at your address.',
      'Passport is dispatched by Speed Post; track status on the portal.'
    ],
    fees: 'Fresh 36-page (normal): ₹1,500 · Tatkaal: ₹3,500'
  },
  DRIVING_LICENCE: {
    title: 'Driving licence (learner / new / renewal)', emoji: '🚗', department: 'Ministry of Road Transport & Highways',
    portal: 'https://sarathi.parivahan.gov.in', helpline: '',
    keywords: ['driving licence', 'driving license', 'dl', 'licence', 'license', 'learner', 'rto', 'parivahan', 'sarathi', 'ड्राइविंग'],
    documents: ['Existing DL (for renewal)', 'Address proof', 'Age proof', 'Form 1A medical certificate (if 40+ or for transport vehicles)', 'Passport photo & signature'],
    steps: [
      'Open Sarathi Parivahan and select your state.',
      'Choose the service (Learner Licence, Driving Licence, DL renewal, duplicate DL).',
      'Fill the application and upload documents; many services support Aadhaar-based contactless processing.',
      'Pay the fee and book a test slot if a test is required.',
      'Attend the test (if any). The DL is sent to your address by post.'
    ]
  },
  SCHOLARSHIP: {
    title: 'Scholarships (NSP)', emoji: '🎓', department: 'Ministry of Education & partner ministries',
    portal: 'https://scholarships.gov.in', helpline: '0120-6619540',
    keywords: ['scholarship', 'nsp', 'fellowship', 'student aid', 'छात्रवृत्ति'],
    documents: ['Aadhaar', 'Income certificate', 'Caste/category certificate (if applicable)', 'Previous year marksheet', 'Aadhaar-seeded bank account', 'Fee receipt / bonafide certificate'],
    steps: [
      'Complete One Time Registration (OTR) on the National Scholarship Portal using Aadhaar.',
      'Log in and pick the schemes you are eligible for (central and state schemes are listed).',
      'Fill the application and upload documents before the deadline.',
      'Your institute, then the district/state nodal officer, verify the application.',
      'The amount is paid by DBT into your Aadhaar-seeded bank account.'
    ]
  },
  INCOME_CERT: {
    title: 'Income certificate', emoji: '📄', department: 'State Revenue Department',
    portal: 'https://services.india.gov.in', helpline: '',
    keywords: ['income certificate', 'income cert', 'aay praman', 'आय प्रमाण'],
    documents: ['Aadhaar', 'Ration card / address proof', 'Salary slip, ITR or self-declaration of income', 'Passport photo'],
    steps: [
      "Open your state's e-District / ServicePlus portal (listed on services.india.gov.in).",
      'Register and choose "Income Certificate".',
      'Fill the form, upload documents and pay the small state fee.',
      'The Patwari/Tehsildar verifies the application.',
      'Download the digitally signed certificate; it is also pushed to DigiLocker in most states.'
    ]
  },
  DOMICILE: {
    title: 'Domicile / residence certificate', emoji: '🏠', department: 'State Revenue Department',
    portal: 'https://services.india.gov.in', helpline: '',
    keywords: ['domicile', 'residence certificate', 'niwas', 'निवास'],
    documents: ['Aadhaar', 'Proof of residence for the period required by your state', 'Birth certificate / school certificate', 'Passport photo'],
    steps: [
      "Open your state's e-District portal.",
      'Apply for Domicile / Residence Certificate and upload proof of residence.',
      'Verification by the revenue office (Tehsil/SDM).',
      'Download the digitally signed certificate.'
    ]
  },
  BIRTH_CERT: {
    title: 'Birth certificate', emoji: '👶', department: 'Office of the Registrar General (CRS)',
    portal: 'https://crsorgi.gov.in', helpline: '',
    keywords: ['birth certificate', 'birth cert', 'janm', 'जन्म प्रमाण'],
    documents: ['Hospital birth report / discharge summary', "Parents' ID proof", 'Address proof'],
    steps: [
      'Births are registered with the local registrar (municipality/panchayat); registration within 21 days is free.',
      'Apply on the Civil Registration System portal or your state portal.',
      'For late registration (after 21 days / 1 year) an affidavit and magistrate order may be needed.',
      'Download the certificate once issued.'
    ]
  },
  DEATH_CERT: {
    title: 'Death certificate', emoji: '🕊️', department: 'Office of the Registrar General (CRS)',
    portal: 'https://crsorgi.gov.in', helpline: '',
    keywords: ['death certificate', 'death cert', 'mrityu', 'मृत्यु प्रमाण'],
    documents: ['Hospital death report / doctor certificate', "Deceased's ID (Aadhaar)", "Applicant's ID proof"],
    steps: [
      'Report the death to the local registrar within 21 days (free).',
      'Apply on the Civil Registration System portal or your state portal.',
      'Collect / download the certificate; it is needed for pension, insurance and property transfer.'
    ]
  },
  MARRIAGE_CERT: {
    title: 'Marriage certificate', emoji: '💍', department: 'State Registration Department',
    portal: 'https://services.india.gov.in', helpline: '',
    keywords: ['marriage certificate', 'marriage registration', 'vivah', 'विवाह'],
    documents: ['Age proof of both spouses', 'Address proof', 'Marriage photograph / invitation', 'Witness ID proofs', 'Passport photos'],
    steps: [
      "Apply on your state's marriage registration / e-District portal (Hindu Marriage Act or Special Marriage Act).",
      'Book an appointment with the Sub-Registrar / Marriage Officer.',
      'Appear with both spouses and witnesses for verification.',
      'Collect the marriage certificate.'
    ]
  },
  PAN: {
    title: 'PAN card', emoji: '💳', department: 'Income Tax Department',
    portal: 'https://www.incometax.gov.in', helpline: '1800-103-0025',
    keywords: ['pan', 'pan card', 'e-pan', 'पैन'],
    documents: ['Aadhaar linked to your mobile number'],
    steps: [
      'On the Income Tax e-filing portal, use "Instant e-PAN" — free, Aadhaar OTP based, issued in minutes.',
      'For a physical card or corrections, apply via Protean (NSDL) or UTIITSL.',
      'Link PAN with Aadhaar if not already linked.'
    ]
  },
  VOTER_ID: {
    title: 'Voter ID (EPIC)', emoji: '🗳️', department: 'Election Commission of India',
    portal: 'https://voters.eci.gov.in', helpline: '1950',
    keywords: ['voter', 'voter id', 'epic', 'election card', 'vote', 'मतदाता'],
    documents: ['Age proof', 'Address proof', 'Passport photo'],
    steps: [
      'New registration: Form 6 on the Voters Service Portal or Voter Helpline app.',
      'Correction / shifting address: Form 8.',
      'A Booth Level Officer (BLO) may verify your details.',
      'Download e-EPIC once your application is approved.'
    ]
  },
  RATION_CARD: {
    title: 'Ration card (NFSA)', emoji: '🍚', department: 'Department of Food & Public Distribution',
    portal: 'https://nfsa.gov.in', helpline: '1967',
    keywords: ['ration', 'ration card', 'pds', 'nfsa', 'राशन'],
    documents: ['Aadhaar of all family members', 'Address proof', 'Income certificate', 'Passport photo of head of family'],
    steps: [
      "Apply on your state's food & civil supplies portal (linked from nfsa.gov.in).",
      'Add all family members with Aadhaar.',
      'Verification by the food inspector.',
      'With One Nation One Ration Card you can draw rations at any fair price shop in India (Mera Ration app).'
    ]
  },
  HEALTHCARE: {
    title: 'Ayushman Bharat (PM-JAY)', emoji: '🏥', department: 'National Health Authority',
    portal: 'https://beneficiary.nha.gov.in', helpline: '14555',
    keywords: ['ayushman', 'pmjay', 'pm-jay', 'health card', 'health insurance', 'hospital', 'abha', 'आयुष्मान'],
    documents: ['Aadhaar', 'Ration card / family ID'],
    steps: [
      'Check eligibility on the beneficiary portal or Ayushman app using your mobile number and Aadhaar.',
      'Complete e-KYC to generate your Ayushman card.',
      'Get up to ₹5 lakh per family per year of cashless treatment at empanelled hospitals.',
      'All citizens aged 70+ are eligible under Ayushman Vay Vandana, regardless of income.'
    ]
  },
  AGRICULTURE: {
    title: 'PM-KISAN & farmer services', emoji: '🌾', department: 'Ministry of Agriculture & Farmers Welfare',
    portal: 'https://pmkisan.gov.in', helpline: '155261',
    keywords: ['farmer', 'kisan', 'pm-kisan', 'pm kisan', 'crop', 'msp', 'agriculture', 'farm', 'किसान'],
    documents: ['Aadhaar', 'Land ownership records', 'Aadhaar-seeded bank account'],
    steps: [
      'Register on the PM-KISAN portal via "New Farmer Registration" or at a CSC.',
      'Complete e-KYC (OTP, biometric or face authentication) — mandatory for installments.',
      'Eligible landholding farmer families receive ₹6,000 per year in three installments by DBT.',
      'For MSP procurement, register on your state procurement portal before the season.'
    ]
  },
  CROP_INSURANCE: {
    title: 'Crop insurance (PMFBY)', emoji: '🌦️', department: 'Ministry of Agriculture & Farmers Welfare',
    portal: 'https://pmfby.gov.in', helpline: '14447',
    keywords: ['crop insurance', 'pmfby', 'fasal bima', 'crop loss', 'फसल बीमा'],
    documents: ['Aadhaar', 'Land records / sowing certificate', 'Bank account details'],
    steps: [
      'Enrol on the PMFBY portal, through your bank or a CSC before the season cut-off.',
      'Premium is capped at 2% (kharif), 1.5% (rabi) and 5% (commercial/horticulture crops).',
      'Report crop loss within 72 hours on the Crop Insurance app or helpline 14447.'
    ]
  },
  EMPLOYMENT: {
    title: 'Jobs & skilling', emoji: '💼', department: 'Ministry of Labour & Employment',
    portal: 'https://www.ncs.gov.in', helpline: '1800-425-1514',
    keywords: ['job', 'jobs', 'employment', 'naukri', 'skill', 'unemployed', 'e-shram', 'eshram', 'नौकरी', 'रोजगार'],
    documents: ['Aadhaar', 'Educational certificates', 'Resume'],
    steps: [
      'Register on the National Career Service portal to search jobs and job fairs.',
      'Unorganised workers can register on e-Shram (eshram.gov.in) for a UAN card and welfare schemes.',
      'Find free government skilling courses on Skill India Digital (skillindiadigital.gov.in).'
    ]
  },
  PENSION: {
    title: 'Pension & life certificate', emoji: '👵', department: 'NSAP / Department of Pension',
    portal: 'https://nsap.nic.in', helpline: '',
    keywords: ['pension', 'old age', 'widow pension', 'life certificate', 'jeevan pramaan', 'पेंशन'],
    documents: ['Aadhaar', 'Age proof', 'BPL proof (for NSAP)', 'Bank account'],
    steps: [
      'Old-age, widow and disability pensions (NSAP) are applied for through your state social welfare portal or block office.',
      'Existing pensioners submit a Digital Life Certificate every November via Jeevan Pramaan (jeevanpramaan.gov.in) — face authentication works from a phone.',
      'Track payments on the NSAP portal.'
    ]
  },
  COMPLAINT: {
    title: 'Public grievance (CPGRAMS)', emoji: '📣', department: 'Department of Administrative Reforms & Public Grievances',
    portal: 'https://pgportal.gov.in', helpline: '',
    keywords: ['complaint', 'grievance', 'not working', 'pothole', 'broken road', 'bribe', 'shikayat', 'शिकायत'],
    documents: ['Description of the issue', 'Photos or supporting documents', 'Previous complaint reference (if any)'],
    steps: [
      'Lodge your grievance on CPGRAMS (or the CPGRAMS app) choosing the right ministry/state.',
      'Write a clear complaint: what, where, since when, and what resolution you want.',
      'Note the registration number and track status online.',
      'If not satisfied with the resolution, file an appeal on the same portal.'
    ]
  },
  CONSUMER: {
    title: 'Consumer complaint', emoji: '🛒', department: 'Department of Consumer Affairs',
    portal: 'https://consumerhelpline.gov.in', helpline: '1915',
    keywords: ['consumer', 'refund', 'defective', 'overcharged', 'e-commerce', 'warranty'],
    documents: ['Invoice / bill', 'Order and payment details', 'Communication with the seller'],
    steps: [
      'Register a complaint with the National Consumer Helpline (1915, app or WhatsApp).',
      'If unresolved, file a case on e-Daakhil (edaakhil.nic.in) with the consumer commission.'
    ]
  },
  CYBER_FRAUD: {
    title: 'Cyber fraud / online scam', emoji: '🛡️', department: 'Indian Cyber Crime Coordination Centre (MHA)',
    portal: 'https://cybercrime.gov.in', helpline: '1930',
    keywords: ['fraud', 'scam', 'cyber', 'upi', 'fake link', 'upi fraud', 'cheated', 'ठगी', 'hacked', 'otp fraud', 'money stolen', 'phishing', 'धोखाधड़ी'],
    documents: ['Transaction IDs / UTR numbers', 'Screenshots of messages and payments', 'Bank statement'],
    steps: [
      'Call 1930 IMMEDIATELY — reporting within the first hours gives the best chance to freeze the money.',
      'File a complaint on cybercrime.gov.in with transaction IDs and screenshots.',
      'Inform your bank to block cards/UPI and dispute the transaction.',
      'Do not share OTPs or install remote-access apps on anyone’s request.'
    ]
  },
  ELECTRICITY: {
    title: 'Electricity (bill / new connection / complaint)', emoji: '⚡', department: 'State DISCOM',
    portal: '', helpline: '1912',
    keywords: ['electricity', 'bijli', 'power cut', 'meter', 'electric bill', 'बिजली'],
    documents: ['Consumer number / last bill', 'ID & address proof (new connection)', 'Ownership or tenancy proof'],
    steps: [
      'Pay bills on your DISCOM website or any Bharat BillPay (BBPS) app.',
      'Apply for a new connection on the DISCOM portal; consumer rules set deadlines (about 7 days in metros, 15 in other municipal areas, 30 in rural areas).',
      'Report outages or faults on 1912 (most states) or the DISCOM app.'
    ]
  },
  WATER: {
    title: 'Water supply', emoji: '🚰', department: 'Municipal Corporation / Jal Board',
    portal: '', helpline: '',
    keywords: ['water', 'pani', 'water bill', 'water supply', 'पानी'],
    documents: ['Consumer number / last bill', 'Property documents (new connection)'],
    steps: [
      'Pay bills and apply for connections on your municipal corporation / Jal Board website.',
      'For supply complaints, use the municipal helpline or app; escalate on CPGRAMS if unresolved.'
    ]
  },
  GAS: {
    title: 'LPG gas (booking / Ujjwala / subsidy)', emoji: '🔥', department: 'Ministry of Petroleum & Natural Gas',
    portal: 'https://www.mylpg.in', helpline: '1800-2333-555',
    keywords: ['gas', 'lpg', 'cylinder', 'ujjwala', 'indane', 'hp gas', 'bharat gas', 'गैस'],
    documents: ['Aadhaar', 'Address proof', 'Bank account (for subsidy)'],
    steps: [
      'Book refills, check subsidy (PAHAL/DBTL) or transfer connection via mylpg.in or your distributor app.',
      'Women from poor households can apply for a free connection under PM Ujjwala Yojana (pmuy.gov.in).',
      'For a gas leak emergency call 1906.'
    ]
  },
  PROPERTY: {
    title: 'Property registration & land records', emoji: '🏘️', department: 'State Registration / Revenue Department',
    portal: '', helpline: '',
    keywords: ['property', 'land record', 'registry', 'mutation', 'khasra', 'khatauni', 'bhulekh', 'जमीन'],
    documents: ['Sale deed draft', 'ID proof of buyer, seller and witnesses', 'Previous title documents', 'Stamp duty payment receipt'],
    steps: [
      "View land records (RoR, khasra/khatauni) on your state's Bhulekh / land records portal.",
      "Calculate and pay stamp duty on your state's IGRS / e-stamping portal.",
      'Book an appointment at the Sub-Registrar office for registration.',
      'Apply for mutation so the land records show the new owner.'
    ]
  },
  GENERAL: {
    title: 'Government services', emoji: '🏛️', department: 'Government of India',
    portal: 'https://www.india.gov.in', helpline: '',
    keywords: [],
    documents: [],
    steps: [
      'Search the service on india.gov.in or the UMANG app (one app for 1,000+ central and state services).',
      'Keep issued certificates in DigiLocker (digilocker.gov.in) — they are legally valid as originals.'
    ]
  }
};

const WORKFLOWS = Object.keys(SERVICES);

const CATEGORIES = [
  { id: 'identity', label: 'Identity & IDs', ids: ['LOST_AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENCE'] },
  { id: 'certificates', label: 'Certificates', ids: ['INCOME_CERT', 'DOMICILE', 'BIRTH_CERT', 'DEATH_CERT', 'MARRIAGE_CERT'] },
  { id: 'welfare', label: 'Welfare & health', ids: ['SCHOLARSHIP', 'HEALTHCARE', 'RATION_CARD', 'PENSION', 'GAS'] },
  { id: 'farmers', label: 'Farmers', ids: ['AGRICULTURE', 'CROP_INSURANCE'] },
  { id: 'work', label: 'Jobs & property', ids: ['EMPLOYMENT', 'PROPERTY'] },
  { id: 'utilities', label: 'Utilities', ids: ['ELECTRICITY', 'WATER'] },
  { id: 'justice', label: 'Complaints & safety', ids: ['CYBER_FRAUD', 'COMPLAINT', 'CONSUMER'] }
];
const categoryOf = Object.fromEntries(CATEGORIES.flatMap((c) => c.ids.map((id) => [id, c.id])));

// Google Maps search for the nearest office that handles the service.
const OFFICE = {
  LOST_AADHAAR: 'Aadhaar Seva Kendra', PASSPORT: 'Passport Seva Kendra', DRIVING_LICENCE: 'RTO office', VOTER_ID: 'Electoral Registration Office',
  PAN: 'PAN card centre', INCOME_CERT: 'Tehsil office', DOMICILE: 'Tehsil office', BIRTH_CERT: 'Municipal corporation office', DEATH_CERT: 'Municipal corporation office',
  MARRIAGE_CERT: 'Sub Registrar office', PROPERTY: 'Sub Registrar office', RATION_CARD: 'Food and civil supplies office', HEALTHCARE: 'Ayushman Bharat hospital',
  AGRICULTURE: 'Common Service Centre', CROP_INSURANCE: 'Common Service Centre', PENSION: 'Block Development Office', EMPLOYMENT: 'Employment exchange',
  ELECTRICITY: 'Electricity board office', WATER: 'Jal Board office', GAS: 'LPG gas distributor', CYBER_FRAUD: 'Cyber crime police station',
  CONSUMER: 'District consumer commission', SCHOLARSHIP: 'Common Service Centre', GENERAL: 'Common Service Centre'
};
const officeUrl = (id) => (OFFICE[id] ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${OFFICE[id]} near me`)}` : '');

// Rule-of-thumb scheme screening. Each check returns a reason string when the
// profile looks eligible, else null. These are indicative only — the UI always
// says "confirm on the official portal".
const SCHEMES = [
  {
    id: 'pm-kisan', name: 'PM-KISAN', benefit: '₹6,000/year income support in 3 installments',
    url: 'https://pmkisan.gov.in',
    check: (p) => (p.occupation === 'farmer' ? 'You are a farmer; landholding farmer families qualify (income-tax payers and pensioners excluded).' : null)
  },
  {
    id: 'pmfby', name: 'PM Fasal Bima Yojana', benefit: 'Low-premium crop insurance',
    url: 'https://pmfby.gov.in',
    check: (p) => (p.occupation === 'farmer' ? 'Available to all farmers growing notified crops.' : null)
  },
  {
    id: 'ayushman-vay-vandana', name: 'Ayushman Vay Vandana (PM-JAY 70+)', benefit: '₹5 lakh/year cashless health cover',
    url: 'https://beneficiary.nha.gov.in',
    check: (p) => (p.age >= 70 ? 'Every citizen aged 70+ is eligible regardless of income.' : null)
  },
  {
    id: 'pm-jay', name: 'Ayushman Bharat PM-JAY', benefit: '₹5 lakh/year cashless health cover per family',
    url: 'https://beneficiary.nha.gov.in',
    check: (p) => (p.age < 70 && p.income !== null && p.income <= 300000 ? 'Low-income families are often covered (eligibility is based on SECC/state lists) — check with your mobile number.' : null)
  },
  {
    id: 'nsp', name: 'National Scholarship Portal schemes', benefit: 'Pre/post-matric and merit scholarships',
    url: 'https://scholarships.gov.in',
    check: (p) => (p.occupation === 'student' && (p.income === null || p.income <= 800000) ? 'Students from families below the scheme income limits (₹2.5–8 lakh depending on scheme) can apply.' : null)
  },
  {
    id: 'pm-internship', name: 'PM Internship Scheme', benefit: '12-month internship in top companies with monthly stipend',
    url: 'https://pminternship.mca.gov.in',
    check: (p) => (p.age >= 21 && p.age <= 24 && p.occupation === 'unemployed' && (p.income === null || p.income < 800000) ? 'Ages 21–24, not in full-time work or full-time education (online/distance learners can apply), family income under ₹8 lakh.' : null)
  },
  {
    id: 'apy', name: 'Atal Pension Yojana', benefit: 'Guaranteed pension of ₹1,000–5,000/month from age 60',
    url: 'https://www.pfrda.org.in',
    check: (p) => (p.age >= 18 && p.age <= 40 && (p.income === null || p.income <= 700000) ? 'Open to ages 18–40 who are not income-tax payers.' : null)
  },
  {
    id: 'pmjjby', name: 'PM Jeevan Jyoti Bima Yojana', benefit: '₹2 lakh life cover for ₹436/year',
    url: 'https://www.jansuraksha.gov.in',
    check: (p) => (p.age >= 18 && p.age <= 50 ? 'Ages 18–50 with a bank or post office account.' : null)
  },
  {
    id: 'pmsby', name: 'PM Suraksha Bima Yojana', benefit: '₹2 lakh accident cover for ₹20/year',
    url: 'https://www.jansuraksha.gov.in',
    check: (p) => (p.age >= 18 && p.age <= 70 ? 'Ages 18–70 with a bank or post office account.' : null)
  },
  {
    id: 'eshram', name: 'e-Shram card', benefit: 'UAN for unorganised workers + access to welfare schemes',
    url: 'https://eshram.gov.in',
    check: (p) => (['unorganised_worker', 'street_vendor', 'artisan', 'homemaker'].includes(p.occupation) && p.age >= 16 && p.age <= 59 ? 'Unorganised workers aged 16–59 not covered by EPFO/ESIC.' : null)
  },
  {
    id: 'pm-sym', name: 'PM Shram Yogi Maandhan', benefit: '₹3,000/month pension from age 60',
    url: 'https://maandhan.in',
    check: (p) => (['unorganised_worker', 'street_vendor', 'artisan'].includes(p.occupation) && p.age >= 18 && p.age <= 40 && (p.income === null || p.income <= 180000) ? 'Unorganised workers aged 18–40 earning up to ₹15,000/month.' : null)
  },
  {
    id: 'mudra', name: 'PM Mudra Yojana', benefit: 'Collateral-free business loans up to ₹20 lakh',
    url: 'https://www.mudra.org.in',
    check: (p) => (['self_employed', 'street_vendor', 'artisan'].includes(p.occupation) ? 'For non-farm micro and small businesses.' : null)
  },
  {
    id: 'svanidhi', name: 'PM SVANidhi', benefit: 'Working-capital loans for street vendors with interest subsidy',
    url: 'https://pmsvanidhi.mohua.gov.in',
    check: (p) => (p.occupation === 'street_vendor' ? 'For urban street vendors.' : null)
  },
  {
    id: 'vishwakarma', name: 'PM Vishwakarma', benefit: 'Skill training, toolkit grant and concessional credit for artisans',
    url: 'https://pmvishwakarma.gov.in',
    check: (p) => (p.occupation === 'artisan' && p.age >= 18 ? 'For traditional artisans and craftspeople aged 18+.' : null)
  },
  {
    id: 'stand-up-india', name: 'Stand-Up India', benefit: 'Bank loans of ₹10 lakh–1 crore for a new enterprise',
    url: 'https://www.standupmitra.in',
    check: (p) => (['self_employed', 'unemployed'].includes(p.occupation) && (p.gender === 'female' || ['sc', 'st'].includes(p.category)) && p.age >= 18 ? 'For women and SC/ST entrepreneurs starting a greenfield business.' : null)
  },
  {
    id: 'ujjwala', name: 'PM Ujjwala Yojana', benefit: 'Free LPG connection',
    url: 'https://pmuy.gov.in',
    check: (p) => (p.gender === 'female' && p.age >= 18 && p.income !== null && p.income <= 250000 ? 'Adult women from poor households without an LPG connection.' : null)
  },
  {
    id: 'pmay', name: 'PM Awas Yojana', benefit: 'Housing assistance / interest subsidy',
    url: 'https://pmay-urban.gov.in',
    check: (p) => (p.income !== null && p.income <= 900000 && p.age >= 18 ? 'For EWS/LIG/MIG families (income up to ₹9 lakh) without a pucca house; rural applicants use pmayg.nic.in.' : null)
  },
  {
    id: 'ignoaps', name: 'Old Age Pension (NSAP)', benefit: 'Monthly pension for senior citizens',
    url: 'https://nsap.nic.in',
    check: (p) => (p.age >= 60 && p.income !== null && p.income <= 200000 ? 'Seniors aged 60+ from BPL households.' : null)
  },
  {
    id: 'udid', name: 'UDID disability card', benefit: 'Single ID for all disability benefits',
    url: 'https://www.swavlambancard.gov.in',
    check: (p) => (p.disability ? 'For persons with a certified disability.' : null)
  }
];

const normalizeProfile = (raw = {}) => {
  const num = (v) => (v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));
  return {
    name: String(raw.name || '').slice(0, 80),
    age: num(raw.age),
    gender: String(raw.gender || '').toLowerCase(),
    state: String(raw.state || '').slice(0, 60),
    income: num(raw.income),
    occupation: String(raw.occupation || '').toLowerCase(),
    category: String(raw.category || '').toLowerCase(),
    disability: Boolean(raw.disability),
    language: String(raw.language || 'English').slice(0, 30)
  };
};

const matchSchemes = (rawProfile) => {
  const p = normalizeProfile(rawProfile);
  if (p.age === null) p.age = -1; // unknown age: age-gated rules simply don't match
  return SCHEMES.map(({ check, ...s }) => ({ ...s, reason: check(p) })).filter((s) => s.reason);
};

// Keyword classifier used when no LLM is configured or all providers fail.
const classify = (text) => {
  const t = ` ${String(text).toLowerCase()} `;
  let best = 'GENERAL';
  let bestScore = 0;
  for (const [id, svc] of Object.entries(SERVICES)) {
    // Multi-word keywords are more specific, so they score higher.
    const score = svc.keywords.reduce((acc, k) => {
      const hit = /^[a-z0-9 -]+$/.test(k) ? new RegExp(`[^a-z0-9]${k}[^a-z0-9]`).test(t) : t.includes(k);
      return acc + (hit ? k.split(' ').length + 1 : 0);
    }, 0);
    if (score > bestScore) { best = id; bestScore = score; }
  }
  return { workflow: best, score: bestScore };
};

const publicService = (id) => {
  const s = SERVICES[id] || SERVICES.GENERAL;
  const key = SERVICES[id] ? id : 'GENERAL';
  return { id: key, title: s.title, emoji: s.emoji, department: s.department, category: categoryOf[key] || 'general', portal: s.portal, helpline: s.helpline, documents: s.documents, fees: s.fees || '', office: OFFICE[key] || '', officeUrl: officeUrl(key) };
};

// Full record (with steps) for the services directory.
const serviceDetail = (id) => ({ ...publicService(id), steps: SERVICES[id].steps });

module.exports = { SERVICES, WORKFLOWS, SCHEMES, CATEGORIES, classify, matchSchemes, normalizeProfile, publicService, serviceDetail, lastReviewed };
