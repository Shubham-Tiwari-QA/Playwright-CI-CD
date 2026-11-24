const { uniqueIndianMobile, futurePreferredDate } = require('../utils/helpers');

const DEMO_URL = process.env.DEMO_BASE_URL || 'https://stagelearn.classmonitor.com/demo';

const copy = {
  success: 'You have successfully registered for demo.',
  duplicateWarning: 'User is already registered for demo in the last 10 days',
  invalidPhone: 'Please enter a valid phone number.',
  requiredText: 'Please fill out this field.',
  requiredSelect: 'Please select an item in the list.',
  painWordError: 'Parent pain points must contain at least 6 words.',
  aspirationWordError: 'Parent aspirations must contain at least 6 words.',
  invalidEmail: "Please include an '@' in the email address. 'not-an-email' is missing an '@'.",
  countryNote: 'Enter country code and phone number SEPARATELY.',
  nonIndianEmailNote: 'Non-Indian users will be notified via email only.',
  minimumWordsNote: 'Please enter at least 6 words.',
};

const packages = {
  value: process.env.DEMO_PACKAGE_VALUE || '103',
  label: process.env.DEMO_PACKAGE_LABEL || 'Demo Checking',
};

const executive = {
  value: process.env.DEMO_EXECUTIVE_VALUE || '1023-Test 1',
  label: process.env.DEMO_EXECUTIVE_LABEL || 'Test 1',
};

const childAge = {
  value: process.env.DEMO_CHILD_AGE || '6',
  label: '5-6 Year',
};

function buildDemoLead(overrides = {}) {
  const phone = overrides.phone || uniqueIndianMobile();

  return {
    phone,
    name: 'QA Parent',
    email: `qa.parent.${phone}@example.com`,
    childAge: childAge.value,
    childAgeLabel: childAge.label,
    painPoints: 'Child needs help with reading focus and confidence',
    aspirations: 'Child should build strong reading writing and confidence',
    packageValue: packages.value,
    packageLabel: packages.label,
    executiveValue: executive.value,
    executiveLabel: executive.label,
    preferredDate: futurePreferredDate(2),
    preferredTime: '10:00 AM',
    remarks: 'Playwright staging automation',
    usPhone: '2025550123',
    ...overrides,
    phone,
    email: overrides.email || `qa.parent.${phone}@example.com`,
  };
}

const invalidPhones = ['12345', '5123456789', '987654321'];

const shortText = 'too few words here';
const sixWords = 'one two three four five six';

module.exports = {
  DEMO_URL,
  copy,
  packages,
  executive,
  childAge,
  buildDemoLead,
  invalidPhones,
  shortText,
  sixWords,
};
