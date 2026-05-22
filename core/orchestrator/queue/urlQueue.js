function createQueue(urls, options = {}) {
  const maxRetries = Number(options.maxRetries ?? 1)
  return urls.map((url, index) => ({
    id: `url-${String(index + 1).padStart(4, '0')}`,
    url,
    status: 'pending',
    attempts: 0,
    maxRetries,
    startedAt: '',
    finishedAt: '',
    reportPath: '',
    errors: [],
  }))
}

function nextRunnableItem(queue) {
  return queue.find((item) => item.status === 'pending' || (item.status === 'failed' && item.attempts <= item.maxRetries))
}

module.exports = { createQueue, nextRunnableItem }
