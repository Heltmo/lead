const fs = require('fs')
const path = require('path')

let sqlite = null
try {
  sqlite = require('node:sqlite')
} catch (_) {
  sqlite = null
}

function createWorkspaceStore(options = {}) {
  const dbPath = options.dbPath
  const workflowPath = options.workflowPath
  const savedSearchesPath = options.savedSearchesPath
  if (sqlite && dbPath) return createSqliteWorkspaceStore({ dbPath, workflowPath, savedSearchesPath })
  return createJsonWorkspaceStore({ workflowPath, savedSearchesPath })
}

function createSqliteWorkspaceStore({ dbPath, workflowPath, savedSearchesPath }) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const db = new sqlite.DatabaseSync(dbPath)
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workflow_leads (
      lead_id TEXT PRIMARY KEY,
      run_id TEXT,
      lead_name TEXT,
      workflow_json TEXT NOT NULL,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS saved_searches (
      search_key TEXT PRIMARY KEY,
      search_json TEXT NOT NULL,
      saved_at TEXT
    );
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT NOT NULL,
      activity_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)
  db.prepare('INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)').run('schema_version', '1')
  importLegacyJson({ db, workflowPath, savedSearchesPath })

  return {
    mode: 'sqlite',
    dbPath,
    workflowPath,
    savedSearchesPath,
    readWorkflowStore() {
      const leads = {}
      for (const row of db.prepare('SELECT lead_id, workflow_json FROM workflow_leads').all()) {
        const workflow = parseJson(row.workflow_json, null)
        if (workflow && typeof workflow === 'object') leads[row.lead_id] = workflow
      }
      return { leads }
    },
    writeWorkflowStore(store = {}) {
      const leads = store && store.leads && typeof store.leads === 'object' ? store.leads : {}
      db.exec('BEGIN')
      try {
        db.exec('DELETE FROM workflow_leads')
        const insertWorkflow = db.prepare('INSERT OR REPLACE INTO workflow_leads (lead_id, run_id, lead_name, workflow_json, updated_at) VALUES (?, ?, ?, ?, ?)')
        const insertActivity = db.prepare('INSERT INTO activity_log (lead_id, activity_json, created_at) VALUES (?, ?, ?)')
        for (const [leadId, workflow] of Object.entries(leads)) {
          const normalizedLeadId = String(leadId || workflow.leadId || '').trim()
          if (!normalizedLeadId) continue
          const updatedAt = workflow.updatedAt || new Date().toISOString()
          insertWorkflow.run(
            normalizedLeadId,
            limitText(workflow.runId || '', 120),
            limitText(workflow.leadName || '', 180),
            JSON.stringify({ ...workflow, leadId: normalizedLeadId }),
            updatedAt
          )
          const latestActivity = Array.isArray(workflow.activities) ? workflow.activities[0] : null
          if (latestActivity && latestActivity.at === updatedAt) {
            insertActivity.run(normalizedLeadId, JSON.stringify(latestActivity), latestActivity.at)
          }
        }
        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
    readSavedSearches() {
      return db.prepare('SELECT search_json FROM saved_searches ORDER BY saved_at DESC LIMIT 30')
        .all()
        .map((row) => parseJson(row.search_json, null))
        .filter(Boolean)
    },
    writeSavedSearches(searches = []) {
      db.exec('BEGIN')
      try {
        db.exec('DELETE FROM saved_searches')
        const insert = db.prepare('INSERT OR REPLACE INTO saved_searches (search_key, search_json, saved_at) VALUES (?, ?, ?)')
        for (const search of (Array.isArray(searches) ? searches : []).slice(0, 30)) {
          const key = savedSearchKey(search)
          if (!key.trim()) continue
          insert.run(key, JSON.stringify(search), search.savedAt || new Date().toISOString())
        }
        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
    exportSnapshot() {
      return {
        exportedAt: new Date().toISOString(),
        storage: { mode: 'sqlite', dbPath },
        workflow: this.readWorkflowStore(),
        savedSearches: this.readSavedSearches(),
        activityLog: db.prepare('SELECT lead_id, activity_json, created_at FROM activity_log ORDER BY id DESC LIMIT 200')
          .all()
          .map((row) => ({
            leadId: row.lead_id,
            activity: parseJson(row.activity_json, {}),
            createdAt: row.created_at,
          })),
      }
    },
    close() {
      db.close()
    },
  }
}

function createJsonWorkspaceStore({ workflowPath, savedSearchesPath }) {
  return {
    mode: 'json',
    dbPath: null,
    workflowPath,
    savedSearchesPath,
    readWorkflowStore() {
      const parsed = readJsonFile(workflowPath, { leads: {} })
      return parsed && typeof parsed === 'object' && parsed.leads ? parsed : { leads: {} }
    },
    writeWorkflowStore(store = {}) {
      writeJsonFile(workflowPath, { leads: store.leads || {} })
    },
    readSavedSearches() {
      const parsed = readJsonFile(savedSearchesPath, [])
      return Array.isArray(parsed) ? parsed.slice(0, 30) : []
    },
    writeSavedSearches(searches = []) {
      writeJsonFile(savedSearchesPath, Array.isArray(searches) ? searches.slice(0, 30) : [])
    },
    exportSnapshot() {
      return {
        exportedAt: new Date().toISOString(),
        storage: { mode: 'json', workflowPath, savedSearchesPath },
        workflow: this.readWorkflowStore(),
        savedSearches: this.readSavedSearches(),
        activityLog: [],
      }
    },
    close() {},
  }
}

function importLegacyJson({ db, workflowPath, savedSearchesPath }) {
  const imported = db.prepare('SELECT value FROM schema_meta WHERE key = ?').get('legacy_imported')
  if (imported && imported.value === 'true') return

  const workflow = readJsonFile(workflowPath, null)
  if (workflow && workflow.leads && typeof workflow.leads === 'object') {
    const insert = db.prepare('INSERT OR IGNORE INTO workflow_leads (lead_id, run_id, lead_name, workflow_json, updated_at) VALUES (?, ?, ?, ?, ?)')
    for (const [leadId, value] of Object.entries(workflow.leads)) {
      if (!leadId || !value || typeof value !== 'object') continue
      insert.run(leadId, limitText(value.runId || '', 120), limitText(value.leadName || '', 180), JSON.stringify({ ...value, leadId }), value.updatedAt || '')
    }
  }

  const savedSearches = readJsonFile(savedSearchesPath, null)
  if (Array.isArray(savedSearches)) {
    const insert = db.prepare('INSERT OR IGNORE INTO saved_searches (search_key, search_json, saved_at) VALUES (?, ?, ?)')
    for (const search of savedSearches.slice(0, 30)) {
      if (!search || typeof search !== 'object') continue
      insert.run(savedSearchKey(search), JSON.stringify(search), search.savedAt || '')
    }
  }

  db.prepare('INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)').run('legacy_imported', 'true')
}

function savedSearchKey(entry = {}) {
  return [entry.query, entry.sellerIntent, entry.searchScope, entry.provider].map((value) => String(value || '').toLowerCase()).join('::')
}

function parseJson(value, fallback) {
  try { return JSON.parse(value) } catch (_) { return fallback }
}

function readJsonFile(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')) } catch (_) { return fallback }
}

function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const tmp = `${filePath}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2))
  fs.renameSync(tmp, filePath)
}

function limitText(value, max) {
  return String(value || '').slice(0, max)
}

module.exports = { createWorkspaceStore }
