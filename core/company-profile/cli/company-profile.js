#!/usr/bin/env node
const { enrichCompanyProfile } = require('../companyProfile')

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.name && !args.companyName) {
    console.error('Usage: npm run company-profile -- --name "Glomma Tannklinikk" --city "Fredrikstad"')
    process.exitCode = 1
    return
  }
  const profile = await enrichCompanyProfile({
    companyName: args.companyName || args.name,
    website: args.website,
    phone: args.phone,
    email: args.email,
    address: args.address,
    city: args.city,
    industry: args.industry,
  })
  console.log(JSON.stringify(profile, null, 2))
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) out[key] = true
    else { out[key] = next; i += 1 }
  }
  return out
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error)
  process.exitCode = 1
})
