const fs = require('fs')
const path = require('path')

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }) }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')) }
function writeJson(file, value) { ensureDir(path.dirname(file)); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`) }
function exists(file) { return fs.existsSync(file) }

module.exports = { ensureDir, exists, readJson, writeJson }
