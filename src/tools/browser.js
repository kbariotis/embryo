import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

let browser;
let page;

export async function browser_open({ url }, signal) {
  if (signal?.aborted) throw new Error('Task aborted');
  if (!url) return "Error: No URL provided.";
  if (!browser) {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    page = await context.newPage();
  }
  await page.goto(url.startsWith('http') || url.startsWith('file') ? url : `https://${url}`, { signal });
  return `Opened ${url}`;
}

export async function browser_click({ selector }, signal) {
  if (signal?.aborted) throw new Error('Task aborted');
  if (!page) return "Error: No browser open.";
  if (!selector) return "Error: No selector provided.";
  
  try {
    // Try as a direct selector first (CSS, XPath, or Playwright-specific like text=)
    await page.click(selector, { signal, timeout: 5000 });
  } catch (err) {
    // Fallback: try to find by text if it looks like a simple string
    try {
      if (!selector.includes('=') && !selector.includes('[') && !selector.includes('.') && !selector.includes('#')) {
        await page.click(`text="${selector}"`, { signal, timeout: 5000 });
      } else {
        throw err;
      }
    } catch (fallbackErr) {
      return `Error: Could not find or click element with selector "${selector}".`;
    }
  }
  return `Clicked ${selector}`;
}

export async function browser_type({ selector, text }, signal) {
  if (signal?.aborted) throw new Error('Task aborted');
  if (!page) return "Error: No browser open.";
  if (!selector || text === undefined) return "Error: browser_type requires 'selector' and 'text'.";
  
  try {
    await page.fill(selector, text, { signal, timeout: 5000 });
  } catch (err) {
    try {
      if (!selector.includes('=') && !selector.includes('[') && !selector.includes('.') && !selector.includes('#')) {
        await page.fill(`text="${selector}"`, { signal, timeout: 5000 });
      } else {
        throw err;
      }
    } catch (fallbackErr) {
      return `Error: Could not find or type into element with selector "${selector}".`;
    }
  }
  return `Typed "${text}" into ${selector}`;
}

export async function browser_get_content(args, signal) {
  if (signal?.aborted) throw new Error('Task aborted');
  if (!page) return "Error: No browser open.";
  const text = await page.evaluate(() => document.body.innerText);
  return text.slice(0, 2000); // Truncate for LLM
}

export async function close_browser() {
  try {
    if (browser) {
      await browser.close();
    }
  } catch (err) {
    // Ignore errors during closure
  } finally {
    browser = null;
    page = null;
  }
}
