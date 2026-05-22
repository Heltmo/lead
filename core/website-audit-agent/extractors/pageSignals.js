function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function unique(values) {
  return [...new Set(values.map(normalizeText).filter(Boolean))]
}

async function extractPageSignals(page) {
  return page.evaluate(() => {
    const text = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()
    const unique = (values) => [...new Set(values.map(text).filter(Boolean))]
    const bodyText = document.body?.innerText ?? ''
    const hrefs = [...document.querySelectorAll('a[href]')].map((link) => ({
      text: text(link.innerText || link.getAttribute('aria-label') || link.getAttribute('title')),
      href: link.href,
    }))
    const emailMatches = bodyText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []
    const mailtoEmails = hrefs.filter((link) => link.href.startsWith('mailto:')).map((link) => decodeURIComponent(link.href.replace(/^mailto:/, '').split('?')[0]))
    const phoneMatches = bodyText.match(/(?:\+?\d[\d().\s-]{7,}\d)/g) ?? []
    const telPhones = hrefs.filter((link) => link.href.startsWith('tel:')).map((link) => decodeURIComponent(link.href.replace(/^tel:/, '')))
    const socialDomains = ['linkedin.com', 'facebook.com', 'instagram.com', 'x.com', 'twitter.com', 'youtube.com', 'tiktok.com']
    return {
      title: document.title,
      metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      canonicalUrl: document.querySelector('link[rel="canonical"]')?.href ?? '',
      headings: [...document.querySelectorAll('h1,h2,h3')].map((heading) => ({ level: heading.tagName.toLowerCase(), text: text(heading.innerText) })).filter((heading) => heading.text),
      emails: unique([...emailMatches, ...mailtoEmails]),
      phones: unique([...phoneMatches, ...telPhones]),
      ctas: unique(hrefs.filter((link) => /\b(contact|book|start|request|call|quote|demo|consult|buy|sign up|apply)\b/i.test(link.text)).map((link) => link.text)),
      links: hrefs.filter((link) => link.text || link.href).slice(0, 100),
      socialLinks: hrefs.filter((link) => socialDomains.some((domain) => link.href.includes(domain))),
      technologySignals: {
        generator: document.querySelector('meta[name="generator"]')?.getAttribute('content') ?? '',
        scripts: [...document.scripts].map((script) => script.src).filter(Boolean).slice(0, 50),
      },
    }
  }).then((signals) => ({
    ...signals,
    title: normalizeText(signals.title),
    metaDescription: normalizeText(signals.metaDescription),
    emails: unique(signals.emails),
    phones: unique(signals.phones),
    ctas: unique(signals.ctas),
  }))
}

module.exports = { extractPageSignals }
