function createBatchReport({ sourceFile, startedAt, results }) {
  const successfulAudits = results.filter((result) => result.status === 'passed')
  const pendingAudits = results.filter((result) => result.status === 'pending')
  const failedAudits = results.filter((result) => result.status !== 'passed' && result.status !== 'pending')
  const ranked = [...successfulAudits].sort((a, b) => (b.leadScore ?? 0) - (a.leadScore ?? 0))
  return {
    sourceFile,
    processedAt: new Date().toISOString(),
    startedAt,
    totalSites: results.length,
    successfulAudits: successfulAudits.length,
    failedAudits: failedAudits.length,
    pendingAudits: pendingAudits.length,
    topLeads: ranked.slice(0, 10).map(toLeadSummary),
    results,
  }
}

function toLeadSummary(result) {
  return { name: result.name, url: result.url, title: result.title, leadScore: result.leadScore, technologies: result.technologies, issueCategories: result.issueCategories, issues: result.issues }
}

module.exports = { createBatchReport }
