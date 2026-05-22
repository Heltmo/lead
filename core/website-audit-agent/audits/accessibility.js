const AxeBuilder = require('@axe-core/playwright').default

async function runAccessibilityAudit(page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  return {
    violationCount: results.violations.length,
    seriousViolationCount: results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact)).length,
    violations: results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map((node) => ({ target: node.target, failureSummary: node.failureSummary })),
    })),
  }
}

module.exports = { runAccessibilityAudit }
