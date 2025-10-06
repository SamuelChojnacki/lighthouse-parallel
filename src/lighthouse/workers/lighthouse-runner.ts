import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';

interface LighthouseOptions {
  categories?: string[];
  locale?: string;
}

interface LighthouseResult {
  success: boolean;
  url: string;
  lhr?: any;
  report?: string;
  duration?: number;
  timestamp: string;
  error?: string;
  stack?: string;
}

interface ParentMessage {
  type: 'RUN_AUDIT';
  url: string;
  options: LighthouseOptions;
}

interface ChildMessage {
  type: 'AUDIT_RESULT';
  result: LighthouseResult;
}

/**
 * Worker script that runs in a child process
 * Executes a single Lighthouse audit with isolated Chrome instance
 */
async function runLighthouseAudit(
  url: string,
  options: LighthouseOptions = {},
): Promise<LighthouseResult> {
  let chrome: chromeLauncher.LaunchedChrome | undefined;

  try {
    // Set Chrome path - force Docker path if Nixpacks path is detected
    let chromePath = process.env.CHROME_PATH;

    // Override incorrect Nixpacks path with Docker path
    if (chromePath && chromePath.includes('/nix/')) {
      chromePath = '/usr/bin/chromium';
    }

    // Launch Chrome with unique port (auto-assigned)
    const launchOptions: chromeLauncher.Options = {
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
      logLevel: 'error' as const,
      output: 'json' as const,
      onlyCategories: options.categories || ['performance'],
      locale: (options.locale || 'en') as any,
      port: chrome.port,
      formFactor: 'mobile' as const,
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

    if (!runnerResult) {
      throw new Error('Lighthouse returned no result');
    }

    return {
      success: true,
      url,
      lhr: runnerResult.lhr,
      report: Array.isArray(runnerResult.report) ? runnerResult.report[0] : runnerResult.report,
      duration,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      url,
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    };
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

// Handle messages from parent process
process.on('message', async (msg: ParentMessage) => {
  if (msg.type === 'RUN_AUDIT') {
    const result = await runLighthouseAudit(msg.url, msg.options);
    if (process.send) {
      const response: ChildMessage = { type: 'AUDIT_RESULT', result };
      process.send(response);
      // Parent will kill this process after receiving the result
      // No timeout needed - parent controls lifecycle completely
    } else {
      process.exit(1);
    }
  }
});

// Handle errors
process.on('uncaughtException', (error: Error) => {
  if (process.send) {
    const response: ChildMessage = {
      type: 'AUDIT_RESULT',
      result: {
        success: false,
        error: error.message,
        stack: error.stack,
        url: '',
        timestamp: new Date().toISOString(),
      },
    };
    process.send(response);
    // Parent will kill this process after receiving the error result
  } else {
    process.exit(1);
  }
});
