const fs = require('fs');

/**
 * Load KEY=value pairs from a local env file without overriding variables
 * already present in the process environment.
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

/**
 * 10-digit Indian mobile starting with 9. Unique per call so staging
 * does not collide with a record created by an earlier run.
 */
function uniqueIndianMobile() {
  const tail = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-9);
  return `9${tail}`;
}

/**
 * Preferred-date value accepted by the demo form datetime picker: 26-Nov-2026.
 */
function futurePreferredDate(daysAhead = 2) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');

  return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

async function validationMessage(locator) {
  return locator.evaluate((element) => element.validationMessage);
}

module.exports = {
  loadEnvFile,
  uniqueIndianMobile,
  futurePreferredDate,
  validationMessage,
};
