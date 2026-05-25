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
      phone: item.phone || item.sourceMetadata?.phone || '',
      address: item.address || item.sourceMetadata?.address || '',
      placeId: item.placeId || item.sourceMetadata?.placeId || '',
      rating: item.rating || item.sourceMetadata?.rating || '',
      reviewCount: item.reviewCount || item.sourceMetadata?.reviewCount || '',
      businessStatus: item.businessStatus || item.sourceMetadata?.businessStatus || '',
      providerTypes: item.providerTypes || item.sourceMetadata?.providerTypes || [],
      sourceMetadata: item.sourceMetadata || {},
      status: item.status,
      attempts: item.attempts,
      reportPath: item.reportPath,
      errors: item.errors,
    })),
  }
}

module.exports = { buildRunSummary }
