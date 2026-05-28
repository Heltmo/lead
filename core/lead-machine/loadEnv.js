const fs = require('fs')

function loadEnvFiles(filePaths, env = process.env) {
  const loaded = []
  for (const filePath of filePaths) {
    if (!filePath || !fs.existsSync(filePath)) continue
    const content = fs.readFileSync(filePath, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line)
      if (!parsed) continue
      if (env[parsed.key] === undefined) {
        env[parsed.key] = parsed.value
        loaded.push(parsed.key)
      }
    }
  }
  return loaded
}

function parseEnvLine(line) {
  const trimmed = String(line || '').trim()
  if (!trimmed || trimmed.startsWith('#')) return null
  const index = trimmed.indexOf('=')
  if (index <= 0) return null
  const key = trimmed.slice(0, index).trim()
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null
  let value = trimmed.slice(index + 1).trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  return { key, value }
}

module.exports = { loadEnvFiles, parseEnvLine }
