function createPerformanceObserver(page) {
  const failedRequests = []
  const consoleErrors = []
  const responses = []

  page.on('requestfailed', (request) => {
    failedRequests.push({ url: request.url(), method: request.method(), failure: request.failure()?.errorText ?? 'unknown' })
  })

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push({ text: message.text(), location: message.location() })
  })

  page.on('response', async (response) => {
    const headers = response.headers()
    const contentLength = Number(headers['content-length'] ?? 0)
    responses.push({ url: response.url(), status: response.status(), contentType: headers['content-type'] ?? '', transferSize: Number.isFinite(contentLength) ? contentLength : 0 })
  })

  return {
    async collect() {
      const pageMetrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0]
        const resources = performance.getEntriesByType('resource')
        const images = [...document.images].map((image) => ({
          src: image.currentSrc || image.src,
          width: image.naturalWidth,
          height: image.naturalHeight,
          renderedWidth: image.clientWidth,
          renderedHeight: image.clientHeight,
          hasWidth: image.hasAttribute('width'),
          hasHeight: image.hasAttribute('height'),
        }))
        return {
          domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
          loadMs: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
          resourceCount: resources.length,
          transferSize: Math.round(resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0)),
          encodedBodySize: Math.round(resources.reduce((sum, resource) => sum + (resource.encodedBodySize || 0), 0)),
          imageCount: images.length,
          missingImageDimensions: images.filter((image) => !image.hasWidth || !image.hasHeight).length,
          oversizedImages: images.filter((image) => image.width > 0 && image.renderedWidth > 0 && image.width > image.renderedWidth * 2.5).length,
        }
      })
      const mainResponse = responses.find((response) => response.contentType.includes('text/html')) ?? responses[0] ?? null
      return {
        responseStatus: mainResponse?.status ?? null,
        domContentLoadedMs: pageMetrics.domContentLoadedMs,
        loadMs: pageMetrics.loadMs,
        resourceCount: pageMetrics.resourceCount,
        transferSizeBytes: pageMetrics.transferSize,
        encodedBodySizeBytes: pageMetrics.encodedBodySize,
        imageCount: pageMetrics.imageCount,
        missingImageDimensions: pageMetrics.missingImageDimensions,
        oversizedImages: pageMetrics.oversizedImages,
        failedRequests: failedRequests.slice(0, 25),
        consoleErrors: consoleErrors.slice(0, 25),
      }
    },
  }
}

module.exports = { createPerformanceObserver }
