function readNumericId(name, { required = false } = {}) {
  const value = process.env[name];

  if (!value) {
    if (required) {
      throw new Error(
        `${name} is required. In PowerShell set it first, e.g. $env:${name} = "740"`
      );
    }

    return '';
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a numeric id.`);
  }

  return value;
}

function requireBatchAndSession() {
  const batchId = readNumericId('BATCH_ID', { required: true });
  const sessionId = readNumericId('SESSION_ID', { required: true });

  return { batchId, sessionId };
}

/**
 * Skip the current test when BATCH_ID / SESSION_ID are not set.
 * Use at the start of env-dependent tests so missing vars are not reported as app bugs.
 */
function skipWithoutBatchAndSession(test) {
  const batchId = process.env.BATCH_ID;
  const sessionId = process.env.SESSION_ID;

  test.skip(
    !batchId || !sessionId,
    'Set $env:BATCH_ID and $env:SESSION_ID before running this test (example: 740 and 10822).'
  );

  return requireBatchAndSession();
}

module.exports = {
  readNumericId,
  requireBatchAndSession,
  skipWithoutBatchAndSession,
};
