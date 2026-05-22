import AxeBuilder from '@axe-core/playwright'
import { expect } from '@playwright/test'

const defaultTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

export async function expectNoAccessibilityViolations(page, options = {}) {
  const tags = options.tags ?? defaultTags
  const results = await new AxeBuilder({ page }).withTags(tags).analyze()

  expect(results.violations, formatViolations(results.violations)).toEqual([])
}

function formatViolations(violations) {
  if (violations.length === 0) {
    return 'No accessibility violations found.'
  }

  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => `- ${node.target.join(', ')}: ${node.failureSummary ?? 'No failure summary'}`)
        .join('\n')

      return `${violation.id} (${violation.impact ?? 'unknown impact'}): ${violation.help}
${nodes}`
    })
    .join('\n\n')
}
