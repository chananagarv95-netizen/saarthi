const { processWorkflow } = require('../services/groqService');

// Mock government data
const MOCK_GOV_DATA = {
  DRIVING_LICENCE: {
    fees: { renewal: 200, fresh: 500, international: 1000 },
    offices: ['RTO Delhi', 'RTO Mumbai', 'RTO Bangalore', 'RTO Chennai'],
    portal: 'https://parivahan.gov.in'
  },
  PASSPORT: {
    fees: { normal: 1500, tatkal: 3500, minorFresh: 1000 },
    offices: ['PSK New Delhi', 'PSK Mumbai', 'PSK Bangalore'],
    portal: 'https://passportindia.gov.in'
  },
  SCHOLARSHIP: {
    schemes: ['NSP Post-Matric', 'NSP Pre-Matric', 'Merit-cum-Means', 'State Merit'],
    portal: 'https://scholarships.gov.in',
    income_limit: 250000
  }
};

const handleWorkflow = async (req, res, next) => {
  try {
    const { workflow, context = '' } = req.body;
    if (!workflow) return res.status(400).json({ error: 'Workflow is required' });

    const data = await processWorkflow(workflow, context);
    const mockData = MOCK_GOV_DATA[workflow] || {};

    return res.json({ ...data, mockGovData: mockData, generatedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

const handleEligibility = async (req, res, next) => {
  try {
    const { workflow, userDetails } = req.body;
    // Mock eligibility check
    const eligible = true;
    const reasons = ['Age criteria met', 'Income within limit', 'Documents available'];
    return res.json({ eligible, reasons, workflow, checkedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

module.exports = { handleWorkflow, handleEligibility };
