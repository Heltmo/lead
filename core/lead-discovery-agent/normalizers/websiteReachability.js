const http = require('http')
const https = require('https')

async function validateWebsiteReachability(website, options = {}) {
  const timeoutMs = Number(options.timeoutMs || 5000)
  return requestWebsite(website, { timeoutMs, redirectsRemaining: 3 })
}

function requestWebsite(website, options) {
  return new Promise((resolve) => {
    let url
    try { url = new URL(website) } catch { resolve({ reachable: false, statusCode: 0, error: 'invalid_url' }); return }
    const transport = url.protocol === 'http:' ? http : https
    const request = transport.request(url, { method: 'HEAD', timeout: options.timeoutMs }, (response) => {
      const location = response.headers.location
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && location && options.redirectsRemaining > 0) {
        response.resume()
        const nextUrl = new URL(location, url).href
        requestWebsite(nextUrl, { ...options, redirectsRemaining: options.redirectsRemaining - 1 }).then(resolve)
        return
      }
      response.resume()
      resolve({ reachable: response.statusCode >= 200 && response.statusCode < 500, statusCode: response.statusCode, error: '' })
    })
    request.on('timeout', () => { request.destroy(); resolve({ reachable: false, statusCode: 0, error: 'timeout' }) })
    request.on('error', (error) => resolve({ reachable: false, statusCode: 0, error: error.code || error.message }))
    request.end()
  })
}

module.exports = { validateWebsiteReachability }
