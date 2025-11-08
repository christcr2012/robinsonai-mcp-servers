/**
 * Playwright Handler Functions (50 handlers)
 * Browser automation and testing
 */

// Helper function to format Playwright responses
function formatPlaywrightResponse(result: any) {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ============================================================
// BROWSER MANAGEMENT HANDLERS (10 handlers)
// ============================================================

export async function playwrightLaunchBrowser(this: any, args: any) {
  if (!this.playwrightBrowser) {
    const playwright = await import('playwright');
    const { browserType = 'chromium', headless = true, options = {} } = args;
    const browser = browserType === 'chromium' ? playwright.chromium :
                    browserType === 'firefox' ? playwright.firefox :
                    playwright.webkit;
    this.playwrightBrowser = await browser.launch({ headless, ...options });
    return formatPlaywrightResponse({ status: 'launched', browserType, headless });
  }
  return formatPlaywrightResponse({ status: 'already launched' });
}

export async function playwrightCloseBrowser(this: any, args: any) {
  if (this.playwrightBrowser) {
    await this.playwrightBrowser.close();
    this.playwrightBrowser = null;
    this.playwrightContext = null;
    this.playwrightPage = null;
    return formatPlaywrightResponse({ status: 'closed' });
  }
  return formatPlaywrightResponse({ status: 'no browser to close' });
}

export async function playwrightNewContext(this: any, args: any) {
  if (!this.playwrightBrowser) throw new Error('Browser not launched');
  const { options = {} } = args;
  this.playwrightContext = await this.playwrightBrowser.newContext(options);
  return formatPlaywrightResponse({ status: 'context created' });
}

export async function playwrightCloseContext(this: any, args: any) {
  if (this.playwrightContext) {
    await this.playwrightContext.close();
    this.playwrightContext = null;
    this.playwrightPage = null;
    return formatPlaywrightResponse({ status: 'context closed' });
  }
  return formatPlaywrightResponse({ status: 'no context to close' });
}

export async function playwrightNewPage(this: any, args: any) {
  if (!this.playwrightContext) {
    if (!this.playwrightBrowser) throw new Error('Browser not launched');
    this.playwrightContext = await this.playwrightBrowser.newContext();
  }
  this.playwrightPage = await this.playwrightContext.newPage();
  return formatPlaywrightResponse({ status: 'page created' });
}

export async function playwrightClosePage(this: any, args: any) {
  if (this.playwrightPage) {
    await this.playwrightPage.close();
    this.playwrightPage = null;
    return formatPlaywrightResponse({ status: 'page closed' });
  }
  return formatPlaywrightResponse({ status: 'no page to close' });
}

export async function playwrightGetPages(this: any, args: any) {
  if (!this.playwrightContext) throw new Error('No context available');
  const pages = this.playwrightContext.pages();
  return formatPlaywrightResponse({ count: pages.length, pages: pages.map((p: any) => p.url()) });
}

export async function playwrightSetViewport(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { width, height } = args;
  await this.playwrightPage.setViewportSize({ width, height });
  return formatPlaywrightResponse({ viewport: { width, height } });
}

export async function playwrightSetUserAgent(this: any, args: any) {
  if (!this.playwrightContext) throw new Error('No context available');
  const { userAgent } = args;
  await this.playwrightContext.setExtraHTTPHeaders({ 'User-Agent': userAgent });
  return formatPlaywrightResponse({ userAgent });
}

export async function playwrightSetExtraHttpHeaders(this: any, args: any) {
  if (!this.playwrightContext) throw new Error('No context available');
  const { headers } = args;
  await this.playwrightContext.setExtraHTTPHeaders(headers);
  return formatPlaywrightResponse({ headers });
}

// ============================================================
// PAGE NAVIGATION HANDLERS (10 handlers)
// ============================================================

export async function playwrightGoto(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { url, options = {} } = args;
  await this.playwrightPage.goto(url, options);
  return formatPlaywrightResponse({ url, status: 'navigated' });
}

export async function playwrightGoBack(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { options = {} } = args;
  await this.playwrightPage.goBack(options);
  return formatPlaywrightResponse({ status: 'navigated back' });
}

export async function playwrightGoForward(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { options = {} } = args;
  await this.playwrightPage.goForward(options);
  return formatPlaywrightResponse({ status: 'navigated forward' });
}

export async function playwrightReload(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { options = {} } = args;
  await this.playwrightPage.reload(options);
  return formatPlaywrightResponse({ status: 'reloaded' });
}

export async function playwrightGetUrl(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const url = this.playwrightPage.url();
  return formatPlaywrightResponse({ url });
}

export async function playwrightGetTitle(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const title = await this.playwrightPage.title();
  return formatPlaywrightResponse({ title });
}

export async function playwrightGetContent(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const content = await this.playwrightPage.content();
  return formatPlaywrightResponse({ content });
}

export async function playwrightSetContent(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { html, options = {} } = args;
  await this.playwrightPage.setContent(html, options);
  return formatPlaywrightResponse({ status: 'content set' });
}

export async function playwrightWaitForLoadState(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { state = 'load', options = {} } = args;
  await this.playwrightPage.waitForLoadState(state as any, options);
  return formatPlaywrightResponse({ state, status: 'loaded' });
}

export async function playwrightWaitForUrl(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { url, options = {} } = args;
  await this.playwrightPage.waitForURL(url, options);
  return formatPlaywrightResponse({ url, status: 'matched' });
}

// ============================================================
// ELEMENT INTERACTION HANDLERS (15 handlers)
// ============================================================

export async function playwrightClick(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector, options = {} } = args;
  await this.playwrightPage.click(selector, options);
  return formatPlaywrightResponse({ selector, status: 'clicked' });
}

export async function playwrightDblclick(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector, options = {} } = args;
  await this.playwrightPage.dblclick(selector, options);
  return formatPlaywrightResponse({ selector, status: 'double-clicked' });
}

export async function playwrightFill(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector, value, options = {} } = args;
  await this.playwrightPage.fill(selector, value, options);
  return formatPlaywrightResponse({ selector, value, status: 'filled' });
}

export async function playwrightType(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector, text, options = {} } = args;
  await this.playwrightPage.type(selector, text, options);
  return formatPlaywrightResponse({ selector, text, status: 'typed' });
}

export async function playwrightPress(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector, key, options = {} } = args;
  await this.playwrightPage.press(selector, key, options);
  return formatPlaywrightResponse({ selector, key, status: 'pressed' });
}

export async function playwrightSelectOption(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector, values, options = {} } = args;
  await this.playwrightPage.selectOption(selector, values, options);
  return formatPlaywrightResponse({ selector, values, status: 'selected' });
}

export async function playwrightCheck(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector, options = {} } = args;
  await this.playwrightPage.check(selector, options);
  return formatPlaywrightResponse({ selector, status: 'checked' });
}

export async function playwrightUncheck(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector, options = {} } = args;
  await this.playwrightPage.uncheck(selector, options);
  return formatPlaywrightResponse({ selector, status: 'unchecked' });
}

export async function playwrightHover(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector, options = {} } = args;
  await this.playwrightPage.hover(selector, options);
  return formatPlaywrightResponse({ selector, status: 'hovered' });
}

export async function playwrightFocus(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector, options = {} } = args;
  await this.playwrightPage.focus(selector, options);
  return formatPlaywrightResponse({ selector, status: 'focused' });
}

export async function playwrightGetAttribute(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector, name } = args;
  const value = await this.playwrightPage.getAttribute(selector, name);
  return formatPlaywrightResponse({ selector, name, value });
}

export async function playwrightGetTextContent(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector } = args;
  const text = await this.playwrightPage.textContent(selector);
  return formatPlaywrightResponse({ selector, text });
}

export async function playwrightGetInnerText(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector } = args;
  const text = await this.playwrightPage.innerText(selector);
  return formatPlaywrightResponse({ selector, text });
}

export async function playwrightGetInnerHtml(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector } = args;
  const html = await this.playwrightPage.innerHTML(selector);
  return formatPlaywrightResponse({ selector, html });
}

// ============================================================
// ASSERTIONS & WAITS HANDLERS (10 handlers)
// ============================================================

export async function playwrightWaitForSelector(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector, options = {} } = args;
  await this.playwrightPage.waitForSelector(selector, options);
  return formatPlaywrightResponse({ selector, status: 'found' });
}

export async function playwrightWaitForTimeout(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { timeout } = args;
  await this.playwrightPage.waitForTimeout(timeout);
  return formatPlaywrightResponse({ timeout, status: 'waited' });
}

export async function playwrightIsVisible(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector } = args;
  const visible = await this.playwrightPage.isVisible(selector);
  return formatPlaywrightResponse({ selector, visible });
}

export async function playwrightIsHidden(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector } = args;
  const hidden = await this.playwrightPage.isHidden(selector);
  return formatPlaywrightResponse({ selector, hidden });
}

export async function playwrightIsEnabled(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector } = args;
  const enabled = await this.playwrightPage.isEnabled(selector);
  return formatPlaywrightResponse({ selector, enabled });
}

export async function playwrightIsDisabled(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector } = args;
  const disabled = await this.playwrightPage.isDisabled(selector);
  return formatPlaywrightResponse({ selector, disabled });
}

export async function playwrightIsChecked(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector } = args;
  const checked = await this.playwrightPage.isChecked(selector);
  return formatPlaywrightResponse({ selector, checked });
}

export async function playwrightIsEditable(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector } = args;
  const editable = await this.playwrightPage.isEditable(selector);
  return formatPlaywrightResponse({ selector, editable });
}

export async function playwrightCountElements(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector } = args;
  const count = await this.playwrightPage.locator(selector).count();
  return formatPlaywrightResponse({ selector, count });
}

export async function playwrightEvaluate(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { script, args: scriptArgs } = args;
  const result = await this.playwrightPage.evaluate(script, scriptArgs);
  return formatPlaywrightResponse({ result });
}

// ============================================================
// SCREENSHOTS & VIDEOS HANDLERS (5 handlers)
// ============================================================

export async function playwrightScreenshot(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { path, options = {} } = args;
  await this.playwrightPage.screenshot({ path, ...options });
  return formatPlaywrightResponse({ path, status: 'screenshot saved' });
}

export async function playwrightScreenshotElement(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { selector, path, options = {} } = args;
  const element = await this.playwrightPage.locator(selector);
  await element.screenshot({ path, ...options });
  return formatPlaywrightResponse({ selector, path, status: 'screenshot saved' });
}

export async function playwrightPdf(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const { path, options = {} } = args;
  await this.playwrightPage.pdf({ path, ...options });
  return formatPlaywrightResponse({ path, status: 'PDF saved' });
}

export async function playwrightStartVideo(this: any, args: any) {
  if (!this.playwrightContext) throw new Error('No context available');
  const { options = {} } = args;
  // Video recording is configured at context creation
  return formatPlaywrightResponse({ message: 'Video recording must be configured at context creation', options });
}

export async function playwrightStopVideo(this: any, args: any) {
  if (!this.playwrightPage) throw new Error('No page available');
  const video = this.playwrightPage.video();
  if (video) {
    const path = await video.path();
    await this.playwrightPage.close();
    return formatPlaywrightResponse({ path, status: 'video saved' });
  }
  return formatPlaywrightResponse({ message: 'No video recording active' });
}

