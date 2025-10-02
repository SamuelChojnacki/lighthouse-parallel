const lighthouse = require('lighthouse').default || require('lighthouse');
const chromeLauncher = require('chrome-launcher');

/**
 * Worker script that runs in a child process
 * Executes a single Lighthouse audit with isolated Chrome instance
 */
async function runLighthouseAudit(url, options = {}) {
  let chrome;

  try {
    // Set Chrome path if provided via environment variable (for Docker/Nixpacks)
    const chromePath = process.env.CHROME_PATH;

    // Launch Chrome with unique port (auto-assigned)
    const launchOptions = {
      chromeFlags: [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=site-per-process',
      ],
    };

    // Add Chrome path if available (for Docker environments)
    if (chromePath) {
      launchOptions.chromePath = chromePath;
    }

    chrome = await chromeLauncher.launch(launchOptions);

    // Default Lighthouse configuration
    const lighthouseOptions = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: options.categories || ['performance'],
      port: chrome.port,
      formFactor: 'mobile',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
      },
      screenEmulation: {
        mobile: true,
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
      },
    };

    const startTime = Date.now();
    const runnerResult = await lighthouse(url, lighthouseOptions);
    const duration = Date.now() - startTime;

    return {
      success: true,
      url,
      lhr: runnerResult.lhr,
      report: runnerResult.report,
      duration,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      url,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

// Handle messages from parent process
process.on('message', async (msg) => {
  if (msg.type === 'RUN_AUDIT') {
    const result = await runLighthouseAudit(msg.url, msg.options);
    if (process.send) {
      process.send({ type: 'AUDIT_RESULT', result });
      // Wait for IPC message to flush before exiting
      setTimeout(() => process.exit(0), 100);
    } else {
      process.exit(1);
    }
  }
});

// Handle errors
process.on('uncaughtException', (error) => {
  if (process.send) {
    process.send({
      type: 'AUDIT_RESULT',
      result: {
        success: false,
        error: error.message,
        stack: error.stack,
      },
    });
    setTimeout(() => process.exit(1), 100);
  } else {
    process.exit(1);
  }
});