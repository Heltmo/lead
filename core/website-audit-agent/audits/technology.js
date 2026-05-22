function detectTechnology(signals) {
  const evidence = collectEvidence(signals)
  const technologies = []
  addIf(technologies, evidence, 'WordPress', [/wp-content/i, /wp-includes/i, /wordpress/i])
  addIf(technologies, evidence, 'Shopify', [/cdn\.shopify\.com/i, /myshopify\.com/i, /shopify/i])
  addIf(technologies, evidence, 'Wix', [/wixstatic\.com/i, /wix.com/i, /x-wix/i])
  addIf(technologies, evidence, 'Squarespace', [/squarespace\.com/i, /static1\.squarespace\.com/i])
  addIf(technologies, evidence, 'Webflow', [/webflow\.com/i, /webflow\.js/i])
  addIf(technologies, evidence, 'React', [/react/i, /__REACT_DEVTOOLS_GLOBAL_HOOK__/i])
  addIf(technologies, evidence, 'Vite', [/@vite\/client/i, /vite/i])
  addIf(technologies, evidence, 'Google Analytics', [/googletagmanager\.com/i, /google-analytics\.com/i, /gtag\(/i])
  return { technologies, evidence: evidence.slice(0, 100) }
}

function collectEvidence(signals) {
  return [
    signals.technologySignals?.generator,
    ...(signals.technologySignals?.scripts ?? []),
    ...(signals.links ?? []).map((link) => link.href),
    signals.canonicalUrl,
  ].filter(Boolean)
}

function addIf(technologies, evidence, name, patterns) {
  const matches = evidence.filter((item) => patterns.some((pattern) => pattern.test(item)))
  if (matches.length > 0) technologies.push({ name, confidence: 'deterministic', evidence: matches.slice(0, 5) })
}

module.exports = { detectTechnology }
