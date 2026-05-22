const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')
const { runAccessibilityAudit } = require('./accessibility')
const { classifyIssues } = require('./issueClassification')
const { scoreLead } = require('./leadScore')
const { detectTechnology } = require('./technology')
const { extractPageSignals } = require('../extractors/pageSignals')

async function auditWebsite(inputUrl, options = {}) {
  const normalizedUrl = normalizeUrl(inputUrl)
  const screenshotDir = path.resolve(options.screenshotDir || 'screenshots/latest')
  fs.mkdirSync(screenshotDir, { recursive: true })
  const browser = options.browser || await chromium.launch({ headless: true })
  const shouldCloseBrowser = !options.browser
  const report = { url: normalizedUrl, startedAt: new Date().toISOString(), finishedAt: '', status: 'failed', signals: null, accessibility: null, screenshots: {}, technology: null, issueClassification: null, leadQuality: null, errors: [] }
  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
    const desktop = await desktopContext.newPage()
    await desktop.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: options.timeout ?? 30000 })
    await desktop.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    report.signals = await extractPageSignals(desktop)
    report.accessibility = await runAccessibilityAudit(desktop)
    report.technology = detectTechnology(report.signals)
    report.issueClassification = classifyIssues(report)
    const desktopScreenshot = path.join(screenshotDir, 'desktop.png')
    await desktop.screenshot({ path: desktopScreenshot, fullPage: true })
    report.screenshots.desktop = desktopScreenshot
    await desktopContext.close()

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
    const mobile = await mobileContext.newPage()
    await mobile.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: options.timeout ?? 30000 })
    await mobile.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    const mobileScreenshot = path.join(screenshotDir, 'mobile.png')
    await mobile.screenshot({ path: mobileScreenshot, fullPage: true })
    report.screenshots.mobile = mobileScreenshot
    await mobileContext.close()

    report.leadQuality = scoreLead(report)
    report.status = 'passed'
  } catch (error) {
    report.errors.push({ message: error.message, stack: error.stack })
  } finally {
    if (shouldCloseBrowser) await browser.close()
    report.finishedAt = new Date().toISOString()
  }
  return report
}

function normalizeUrl(value) { return /^https?:\/\//i.test(value) ? value : `https://${value}` }

module.exports = { auditWebsite, normalizeUrl }
