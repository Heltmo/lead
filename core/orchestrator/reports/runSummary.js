function buildRunSummary(run) {
  const completed = run.queue.filter((item) => item.status === 'completed')
  const failed = run.queue.filter((item) => item.status === 'failed')
  const pending = run.queue.filter((item) => item.status === 'pending')
  return {
    runId: run.runId,
    pipeline: run.pipeline,
    status: run.status,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    totalItems: run.queue.length,
    completedItems: completed.length,
    failedItems: failed.length,
    pendingItems: pending.length,
    results: run.queue.map((item) => ({
      id: item.id,
      url: item.url,
      businessName: item.businessName || item.sourceMetadata?.businessName || '',
      source: item.source || item.sourceMetadata?.source || '',
      location: item.location || item.sourceMetadata?.location || '',
      industry: item.industry || item.sourceMetadata?.industry || '',
      confidence: item.confidence || item.sourceMetadata?.confidence || '',
      sources: item.sources || item.sourceMetadata?.sources || [],
      sourceType: item.sourceType || item.sourceMetadata?.sourceType || '',
      auditEligible: item.auditEligible ?? item.sourceMetadata?.auditEligible,
      auditExclusionReason: item.auditExclusionReason || item.sourceMetadata?.auditExclusionReason || '',
      provenance: item.provenance || item.sourceMetadata?.provenance || {},
      sourceMetadata: item.sourceMetadata || {},
      status: item.status,
      attempts: item.attempts,
      reportPath: item.reportPath,
      errors: item.errors,
    })),
  }
}

module.exports = { buildRunSummary }
