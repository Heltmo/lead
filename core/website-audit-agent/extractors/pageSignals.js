const { buildContactCtaProfile } = require('./contactCtaProfile')
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
    const actionTexts = [...document.querySelectorAll('a[href],button,[role=\"button\"],input[type=submit],input[type=button]')]
      .map((element) => text(element.innerText || element.value || element.getAttribute('aria-label') || element.getAttribute('title')))
      .filter(Boolean)
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
      ctas: unique(hrefs.filter((link) => /\b(contact|kontakt|book|booking|bestill|timebestilling|bordbestilling|reserv|ring|telefon|request|tilbud|pristilbud|befaring|call|quote|demo|consult|konsultasjon|buy|sign up|apply)\b/i.test(link.text)).map((link) => link.text)),
      actionTexts,
      hasForm: document.querySelectorAll('form,input,textarea,select').length > 0,
      links: hrefs.filter((link) => link.text || link.href).slice(0, 100),
      socialLinks: hrefs.filter((link) => socialDomains.some((domain) => link.href.includes(domain))),
      technologySignals: {
        generator: document.querySelector('meta[name="generator"]')?.getAttribute('content') ?? '',
        scripts: [...document.scripts].map((script) => script.src).filter(Boolean).slice(0, 50),
      },
    }
  }).then((signals) => {
    const normalized = {
      ...signals,
      title: normalizeText(signals.title),
      metaDescription: normalizeText(signals.metaDescription),
      emails: unique(signals.emails),
      phones: unique(signals.phones),
      ctas: unique(signals.ctas),
    }
    const contactCtaProfile = buildContactCtaProfile({
      texts: [signals.title, signals.metaDescription, ...signals.actionTexts, ...(signals.headings || []).map((heading) => heading.text)],
      links: signals.links,
      emails: normalized.emails,
      phones: normalized.phones,
      hasForm: signals.hasForm,
    })
    return {
      ...normalized,
      ctas: unique([...normalized.ctas, ...contactCtaProfile.ctaTerms]),
      contactCtaProfile,
    }
  })
}

module.exports = { extractPageSignals }
