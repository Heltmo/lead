#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')
const { runAccessibilityAudit } = require('../audits/accessibility')
const { scoreLead } = require('../audits/leadScore')
const { extractPageSignals } = require('../extractors/pageSignals')

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const url = args.url || args._[0]
  if (!url) throw new Error('Usage: node cli/audit-url.js <url> [--out reports/report.json]')
  const normalizedUrl = normalizeUrl(url)
  const outPath = path.resolve(args.out || 'reports/latest-report.json')
  const screenshotDir = path.resolve(args.screenshots || 'screenshots/latest')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.mkdirSync(screenshotDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const report = { url: normalizedUrl, startedAt: new Date().toISOString(), finishedAt: '', status: 'failed', signals: null, accessibility: null, screenshots: {}, leadQuality: null, errors: [] }
  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
    const desktop = await desktopContext.newPage()
    await desktop.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await desktop.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    report.signals = await extractPageSignals(desktop)
    report.accessibility = await runAccessibilityAudit(desktop)
    const desktopScreenshot = path.join(screenshotDir, 'desktop.png')
    await desktop.screenshot({ path: desktopScreenshot, fullPage: true })
    report.screenshots.desktop = desktopScreenshot
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
    const mobile = await mobileContext.newPage()
    await mobile.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await mobile.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    const mobileScreenshot = path.join(screenshotDir, 'mobile.png')
    await mobile.screenshot({ path: mobileScreenshot, fullPage: true })
    report.screenshots.mobile = mobileScreenshot
    report.leadQuality = scoreLead(report)
    report.status = 'passed'
  } catch (error) {
    report.errors.push({ message: error.message, stack: error.stack })
  } finally {
    await browser.close()
    report.finishedAt = new Date().toISOString()
    fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`)
    console.log(JSON.stringify({ status: report.status, report: outPath, score: report.leadQuality?.score ?? null }, null, 2))
    if (report.status !== 'passed') process.exitCode = 1
  }
}

function normalizeUrl(value) { return /^https?:\/\//i.test(value) ? value : `https://${value}` }

function parseArgs(args) {
  const parsed = { _: [] }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg.startsWith('--')) { parsed[arg.slice(2)] = args[i + 1]; i += 1 } else { parsed._.push(arg) }
  }
  return parsed
}

main().catch((error) => { console.error(error); process.exit(1) })
