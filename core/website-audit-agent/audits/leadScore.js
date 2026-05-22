function scoreLead(report) {
  const issues = []
  let score = 100
  if (!report.signals.metaDescription) { score -= 10; issues.push('Missing meta description') }
  if (report.signals.ctas.length === 0) { score -= 20; issues.push('No clear CTA detected') }
  if (report.signals.emails.length === 0 && report.signals.phones.length === 0) { score -= 15; issues.push('No email or phone detected') }
  if (report.accessibility.seriousViolationCount > 0) { score -= Math.min(30, report.accessibility.seriousViolationCount * 10); issues.push('Serious accessibility issues detected') }
  const h1Count = report.signals.headings.filter((heading) => heading.level === 'h1').length
  if (h1Count !== 1) { score -= 10; issues.push(`Expected exactly one h1, found ${h1Count}`) }
  return { score: Math.max(0, score), issues, summary: issues.length === 0 ? 'No obvious deterministic lead-quality issues detected.' : issues.join('; ') }
}

module.exports = { scoreLead }
