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
    results: run.queue.map((item) => ({ id: item.id, url: item.url, status: item.status, attempts: item.attempts, reportPath: item.reportPath, errors: item.errors })),
  }
}

module.exports = { buildRunSummary }
