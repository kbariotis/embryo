import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

let browser;
let page;

export async function browser_open({ url }) {
  if (!url) return "Error: No URL provided.";
  if (!browser) {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    page = await context.newPage();
  }
  await page.goto(url.startsWith('http') ? url : `https://${url}`);
  return `Opened ${url}`;
}

export async function browser_click({ selector }) {
  if (!page) return "Error: No browser open.";
  if (!selector) return "Error: No selector provided.";
  await page.click(selector);
  return `Clicked ${selector}`;
}

export async function browser_type({ selector, text }) {
  if (!page) return "Error: No browser open.";
  if (!selector || text === undefined) return "Error: browser_type requires 'selector' and 'text'.";
  
  await page.fill(selector, text);
  return `Typed "${text}" into ${selector}`;
}

export async function browser_get_content() {
  if (!page) return "Error: No browser open.";
  const text = await page.evaluate(() => document.body.innerText);
  return text.slice(0, 2000); // Truncate for LLM
}

export async function close_browser() {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
  }
}
