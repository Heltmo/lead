function scoreLead(report) {
  const classifiedIssues = report.issueClassification?.issues ?? []
  let score = 100

  for (const issue of classifiedIssues) {
    score -= penaltyFor(issue.category)
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

function penaltyFor(category) {
  return {
    seo: 10,
    ux: 10,
    conversion: 20,
    accessibility: 20,
    contactability: 15,
    technical: 5,
    trust: 5,
  }[category] ?? 5
}

module.exports = { scoreLead }
