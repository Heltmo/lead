function classifyIssues(report) {
  const issues = []
  const signals = report.signals
  const accessibility = report.accessibility
  const h1Count = signals.headings.filter((heading) => heading.level === 'h1').length
  if (!signals.metaDescription) add(issues, 'seo', 'Missing meta description', 'Meta description is empty or absent.')
  if (h1Count !== 1) add(issues, 'seo', `Expected exactly one h1, found ${h1Count}`, 'The page should expose one clear primary heading.')
  if (signals.ctas.length === 0) add(issues, 'conversion', 'No clear CTA detected', 'No link text matched common action patterns.')
  if (signals.emails.length === 0 && signals.phones.length === 0) add(issues, 'contactability', 'No email or phone detected', 'The page did not expose obvious contact details.')
  if ((accessibility?.seriousViolationCount ?? 0) > 0) add(issues, 'accessibility', 'Serious accessibility issues detected', `${accessibility.seriousViolationCount} serious or critical Axe violations found.`)
  if ((signals.socialLinks ?? []).length === 0) add(issues, 'trust', 'No social links detected', 'No common social profile links were found.')
  if ((report.technology?.technologies ?? []).length === 0) add(issues, 'technical', 'No recognized technology stack detected', 'No deterministic platform/framework signals matched known detectors.')
  return {
    counts: issues.reduce((acc, issue) => { acc[issue.category] = (acc[issue.category] ?? 0) + 1; return acc }, {}),
    issues,
  }
}

function add(issues, category, label, detail) { issues.push({ category, label, detail }) }

module.exports = { classifyIssues }
