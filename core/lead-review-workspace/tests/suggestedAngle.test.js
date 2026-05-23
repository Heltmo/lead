const { buildSuggestedAngle, suggestAngle, suggestAngleDetail } = require('../exports/suggestedAngles')

const base = {
  issues: [],
  issueCategories: {},
  emails: ['hello@example.com'],
  phones: ['+4712345678'],
  technologies: [],
  performance: { responseStatus: 200, failedRequestCount: 0, consoleErrorCount: 0 },
}

assertAngle(item({ performance: { responseStatus: 404 } }), 'Website availability issue', 'HTTP 404', 'broken website angle should mention observed HTTP status')
assertAngle(item({ issues: ['No clear CTA detected'], emails: [], phones: [] }), 'Booking/contact friction', 'no clear booking/contact CTA', 'missing CTA/contact angle should be specific')
assertAngle(item({ issues: ['No clear CTA detected', 'Failed network requests detected'], performance: { responseStatus: 200, failedRequestCount: 2 } }), 'Conversion and technical friction', 'lacks a clear CTA, and the browser observed failed network requests', 'CTA angle should include technical evidence when present')
assertAngle(item({ issues: ['Missing meta description', 'Missing H1'] }), 'SEO foundation gap', 'meta description and H1 heading', 'SEO angle should mention missing structure')
assertAngle(item({ issueCategories: { accessibility: 1 } }), 'Accessibility/usability issue', 'Accessibility issues may make the site harder to use', 'accessibility angle should explain usability impact')
assertAngle(item({ performance: { responseStatus: 200, failedRequestCount: 2, consoleErrorCount: 1 }, issues: ['Failed network requests detected', 'Console errors detected'] }), 'Technical trust issue', 'failed network requests and console errors', 'technical browser angle should include observed errors')
assertAngle(item({ issueCategories: { performance: 1 }, technologies: ['WordPress'], issues: ['Oversized image assets detected'] }), 'Mobile performance issue', 'WordPress site shows performance or asset issues', 'performance angle should use technology context when available')
assertAngle(item(), 'General improvement opportunity', 'measurable improvement signals', 'fallback angle should remain deterministic')

const seo = item({ issues: ['Missing meta description'] })
assertEqual(suggestAngle(seo), 'SEO foundation gap', 'suggestAngle helper should return label')
assertIncludes(suggestAngleDetail(seo), 'meta description', 'suggestAngleDetail helper should return detail')

function item(overrides = {}) {
  return {
    ...base,
    ...overrides,
    issueCategories: overrides.issueCategories || base.issueCategories,
    emails: overrides.emails || base.emails,
    phones: overrides.phones || base.phones,
    technologies: overrides.technologies || base.technologies,
    performance: { ...base.performance, ...(overrides.performance || {}) },
  }
}

function assertAngle(value, expectedLabel, expectedDetailPart, message) {
  const angle = buildSuggestedAngle(value)
  assertEqual(angle.suggestedAngle, expectedLabel, message + ' label')
  assertIncludes(angle.suggestedAngleDetail, expectedDetailPart, message + ' detail')
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message + '. Expected ' + JSON.stringify(actual) + ' to equal ' + JSON.stringify(expected))
  }
}

function assertIncludes(value, expected, message) {
  if (!value.includes(expected)) {
    throw new Error(message + '. Expected ' + JSON.stringify(value) + ' to include ' + JSON.stringify(expected))
  }
}
