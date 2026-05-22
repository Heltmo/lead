import { test } from '@playwright/test'
import { expectNoAccessibilityViolations } from '../helpers/accessibility'

test.describe('[Project] accessibility', () => {
  test('has no automated WCAG violations on the main page', async ({ page }) => {
    await page.goto('/')
    await expectNoAccessibilityViolations(page)
  })
})
