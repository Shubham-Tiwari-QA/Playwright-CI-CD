const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function walkSpecs(suite, specs) {
  for (const spec of suite.specs || []) {
    specs.push(spec);
  }
  for (const child of suite.suites || []) {
    walkSpecs(child, specs);
  }
}

const reportsDir = path.join(process.cwd(), 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const resultsPath = path.join(reportsDir, 'playwright-results.json');
const results = readJson(resultsPath);

const summary = {
  buildNumber: process.env.BUILD_NUMBER || '',
  branch: 'main',
  commit: process.env.GIT_COMMIT_SHORT || '',
  batchId: process.env.BATCH_ID || '',
  sessionId: process.env.SESSION_ID || '',
  interrupted: false,
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  durationMs: 0,
  failures: [],
  htmlReportPresent: fs.existsSync(
    path.join(process.cwd(), 'playwright-report', 'index.html')
  ),
  jsonReportPresent: Boolean(results),
  failureReason: '',
};

if (!results) {
  summary.interrupted = true;
  summary.failureReason =
    'Playwright JSON results missing. The test run was interrupted or did not complete.';
} else {
  const specs = [];
  for (const suite of results.suites || []) {
    walkSpecs(suite, specs);
  }

  for (const spec of specs) {
    summary.total += 1;
    const outcomes = (spec.tests || []).flatMap((t) => t.results || []);
    const last = outcomes[outcomes.length - 1];
    const status = last?.status || (spec.ok ? 'passed' : 'failed');

    if (status === 'skipped' || status === 'interrupted') {
      summary.skipped += 1;
    } else if (status === 'passed' || status === 'expected' || status === 'flaky') {
      summary.passed += 1;
    } else {
      summary.failed += 1;
      summary.failures.push(spec.title || 'unnamed');
    }
  }

  if (results.stats) {
    summary.durationMs = results.stats.duration || 0;
    // Prefer Playwright stats when present for accuracy.
    if (typeof results.stats.expected === 'number') {
      summary.passed = results.stats.expected + (results.stats.flaky || 0);
      summary.failed = results.stats.unexpected || 0;
      summary.skipped = results.stats.skipped || 0;
      summary.total = summary.passed + summary.failed + summary.skipped;
    }
  }

  if (summary.failed > 0) {
    summary.failureReason = `${summary.failed} test(s) failed. First: ${
      summary.failures[0] || 'n/a'
    }`;
  } else if (summary.total === 0) {
    summary.interrupted = true;
    summary.failureReason = 'No tests were recorded in the JSON report.';
  } else {
    summary.failureReason = 'NONE';
  }
}

const text = [
  'ClassMonitor Playwright Jenkins Report',
  `Build: ${summary.buildNumber}`,
  `Branch: ${summary.branch}`,
  `Commit: ${summary.commit}`,
  `BATCH_ID: ${summary.batchId}`,
  `SESSION_ID: ${summary.sessionId}`,
  `Interrupted: ${summary.interrupted}`,
  `Total: ${summary.total}`,
  `Passed: ${summary.passed}`,
  `Failed: ${summary.failed}`,
  `Skipped: ${summary.skipped}`,
  `DurationMs: ${summary.durationMs}`,
  `HTML Report Present: ${summary.htmlReportPresent}`,
  `JSON Report Present: ${summary.jsonReportPresent}`,
  `Failure Reason: ${summary.failureReason}`,
  summary.failures.length
    ? `Failures: ${summary.failures.join(' | ')}`
    : 'Failures: NONE',
].join('\n');

fs.writeFileSync(path.join(reportsDir, 'execution-summary.txt'), `${text}\n`, 'utf8');
fs.writeFileSync(
  path.join(reportsDir, 'execution-summary.json'),
  `${JSON.stringify(summary, null, 2)}\n`,
  'utf8'
);

console.log(text);
