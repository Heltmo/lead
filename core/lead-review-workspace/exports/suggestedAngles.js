function buildSuggestedAngle(item) {
  const issues = normalizeText((item.issues || []).join(' '))
  const categories = item.issueCategories || {}
  const responseStatus = Number(item.performance?.responseStatus || 0)
  const failedRequestCount = Number(item.performance?.failedRequestCount || 0)
  const consoleErrorCount = Number(item.performance?.consoleErrorCount || 0)
  const missingContact = !hasAny(item.emails) && !hasAny(item.phones)
  const missingCta = includesAny(issues, ['no clear cta', 'missing cta'])
  const missingMeta = issues.includes('meta description')
  const missingH1 = issues.includes('h1')
  const hasAccessibility = (categories.accessibility || 0) > 0 || issues.includes('accessibility')
  const hasPerformance = (categories.performance || 0) > 0 || includesAny(issues, ['oversized image', 'page transfer size', 'performance', 'slow'])
  const hasFailedRequests = failedRequestCount > 0 || issues.includes('failed network request') || issues.includes('failed request')
  const hasConsoleErrors = consoleErrorCount > 0 || issues.includes('console error')
  const browserIssues = [hasFailedRequests ? 'failed network requests' : '', hasConsoleErrors ? 'console errors' : ''].filter(Boolean).join(' and ')
  const technologyContext = primaryTechnologyContext(item)
  const marketContext = marketContextPhrase(item)

  if (responseStatus >= 400 || issues.includes('404') || issues.includes('unavailable')) {
    return angle('Website availability issue', 'The website returned HTTP ' + (responseStatus || 'error') + ' during audit, so ' + marketContext + ' may hit an availability problem before they can contact the business.')
  }

  if (missingCta && missingContact) {
    return angle('Booking/contact friction', 'Visitors may struggle to take the next step because the site has no clear booking/contact CTA and no visible email or phone signal.')
  }

  if (missingCta && browserIssues) {
    return angle('Conversion and technical friction', 'Visitors may not know how to book or request help because the site lacks a clear CTA, and the browser observed ' + browserIssues + '.')
  }

  if (missingCta && hasPerformance) {
    return angle('Booking and mobile performance', 'Visitors may not know how to book or request help, and performance or asset issues may make mobile browsing feel slower.')
  }

  if (missingCta && hasAccessibility) {
    return angle('Booking and accessibility friction', 'Visitors may not know how to book or request help, and accessibility issues may make the page harder to use.')
  }

  if (missingCta) {
    return angle('Booking/contact friction', 'Visitors may not know how to book or request help because the site does not expose a clear primary CTA.')
  }

  if (missingContact || (categories.contactability || 0) > 0) {
    return angle('Contactability gap', 'Potential customers may struggle to make contact because key email or phone signals are missing from the page.')
  }

  if ((categories.seo || 0) > 0 || missingMeta || missingH1) {
    const missingParts = [missingMeta ? 'meta description' : '', missingH1 ? 'H1 heading' : ''].filter(Boolean).join(' and ')
    return angle('SEO foundation gap', 'Search visibility may be weak because the page is missing ' + (missingParts || 'basic SEO structure') + '.')
  }

  if (hasAccessibility) {
    return angle('Accessibility/usability issue', 'Accessibility issues may make the site harder to use and reduce trust for visitors who need clear, readable pages.')
  }

  if (browserIssues) {
    return angle('Technical trust issue', 'The browser observed ' + browserIssues + ', which can break parts of the visitor journey and reduce trust.')
  }

  if (hasPerformance || (categories.technical || 0) > 0) {
    return angle('Mobile performance issue', technologyContext + 'shows performance or asset issues that may make mobile browsing feel slower than it should.')
  }

  return angle('General improvement opportunity', 'The site has measurable improvement signals that are worth reviewing before outreach.')
}

function suggestAngle(item) {
  return buildSuggestedAngle(item).suggestedAngle
}

function suggestAngleDetail(item) {
  return buildSuggestedAngle(item).suggestedAngleDetail
}

function angle(suggestedAngle, suggestedAngleDetail) {
  return { suggestedAngle, suggestedAngleDetail }
}

function hasAny(value) {
  return Array.isArray(value) && value.length > 0
}

function includesAny(value, needles) {
  return needles.some((needle) => value.includes(needle))
}

function normalizeText(value) {
  return String(value || '').toLowerCase()
}

function primaryTechnologyContext(item) {
  const technologies = item.technologies || []
  if (technologies.includes('WordPress')) return 'The WordPress site '
  if (technologies.includes('Shopify')) return 'The Shopify site '
  if (technologies.includes('Wix')) return 'The Wix site '
  if (technologies.includes('Squarespace')) return 'The Squarespace site '
  return 'The site '
}

function marketContextPhrase(item) {
  return item.location ? 'visitors in ' + item.location : 'visitors'
}

module.exports = { buildSuggestedAngle, suggestAngle, suggestAngleDetail }
