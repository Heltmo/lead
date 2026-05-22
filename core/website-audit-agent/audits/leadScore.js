function scoreLead(report) {
  const classifiedIssues = report.issueClassification?.issues ?? []
  let score = 100

  for (const issue of classifiedIssues) {
    score -= penaltyFor(issue)
  }

  if ((report.technology?.technologies ?? []).some((tech) => ['Wix', 'Squarespace'].includes(tech.name))) {
    score += 5
  }

  const issues = classifiedIssues.map((issue) => issue.label)
  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    classifiedIssues,
    summary: issues.length === 0 ? 'No obvious deterministic lead-quality issues detected.' : issues.join('; '),
  }
}

function penaltyFor(issue) {
  const severityPenalty = { high: 15, medium: 8, low: 4 }[issue.severity] ?? 5
  const categoryAdjustment = {
    conversion: 5,
    contactability: 5,
    accessibility: 5,
    performance: 3,
    technical: 2,
    seo: 0,
    trust: 0,
    ux: 0,
  }[issue.category] ?? 0
  return severityPenalty + categoryAdjustment
}

module.exports = { scoreLead }
