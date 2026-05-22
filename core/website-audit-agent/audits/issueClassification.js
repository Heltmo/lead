function classifyIssues(report) {
  const issues = []
  const signals = report.signals
  const accessibility = report.accessibility
  const performance = report.performance ?? {}
  const h1Count = signals.headings.filter((heading) => heading.level === 'h1').length

  if (!signals.metaDescription) add(issues, 'seo', 'medium', 'Missing meta description', 'Meta description is empty or absent.')
  if (h1Count !== 1) add(issues, 'seo', 'medium', `Expected exactly one h1, found ${h1Count}`, 'The page should expose one clear primary heading.')
  if (signals.ctas.length === 0) add(issues, 'conversion', 'high', 'No clear CTA detected', 'No link text matched common action patterns.')
  if (signals.emails.length === 0 && signals.phones.length === 0) add(issues, 'contactability', 'high', 'No email or phone detected', 'The page did not expose obvious contact details.')
  if ((accessibility?.seriousViolationCount ?? 0) > 0) add(issues, 'accessibility', 'high', 'Serious accessibility issues detected', `${accessibility.seriousViolationCount} serious or critical Axe violations found.`)
  if ((signals.socialLinks ?? []).length === 0) add(issues, 'trust', 'low', 'No social links detected', 'No common social profile links were found.')
  if ((report.technology?.technologies ?? []).length === 0) add(issues, 'technical', 'low', 'No recognized technology stack detected', 'No deterministic platform/framework signals matched known detectors.')

  if (performance.responseStatus && performance.responseStatus >= 400) add(issues, 'technical', 'high', `HTTP status ${performance.responseStatus}`, 'Main page returned an error status.')
  if ((performance.failedRequests?.length ?? 0) > 0) add(issues, 'technical', 'high', 'Failed network requests detected', `${performance.failedRequests.length} request(s) failed during page load.`)
  if ((performance.consoleErrors?.length ?? 0) > 0) add(issues, 'technical', 'medium', 'Console errors detected', `${performance.consoleErrors.length} console error(s) were observed.`)
  if ((performance.loadMs ?? 0) > 5000) add(issues, 'performance', 'high', 'Slow full page load', `Load event took ${performance.loadMs}ms.`)
  else if ((performance.loadMs ?? 0) > 3000) add(issues, 'performance', 'medium', 'Elevated full page load time', `Load event took ${performance.loadMs}ms.`)
  if ((performance.transferSizeBytes ?? 0) > 3_000_000) add(issues, 'performance', 'high', 'Large page transfer size', `Observed transfer size was ${performance.transferSizeBytes} bytes.`)
  else if ((performance.transferSizeBytes ?? 0) > 1_500_000) add(issues, 'performance', 'medium', 'Elevated page transfer size', `Observed transfer size was ${performance.transferSizeBytes} bytes.`)
  if ((performance.missingImageDimensions ?? 0) > 0) add(issues, 'ux', 'low', 'Images missing explicit dimensions', `${performance.missingImageDimensions} image(s) may contribute to layout shift risk.`)
  if ((performance.oversizedImages ?? 0) > 0) add(issues, 'performance', 'medium', 'Oversized image assets detected', `${performance.oversizedImages} image(s) are much larger than rendered size.`)

  return {
    counts: issues.reduce((acc, issue) => { acc[issue.category] = (acc[issue.category] ?? 0) + 1; return acc }, {}),
    severityCounts: issues.reduce((acc, issue) => { acc[issue.severity] = (acc[issue.severity] ?? 0) + 1; return acc }, {}),
    issues,
  }
}

function add(issues, category, severity, label, detail) { issues.push({ category, severity, label, detail }) }

module.exports = { classifyIssues }
