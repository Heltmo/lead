function renderIndexHtml(model) {
  const itemsJson = JSON.stringify(model.items.map((item) => ({
    id: item.id,
    rank: item.rank,
    name: item.name,
    url: item.url,
    status: item.status,
    leadScore: item.leadScore,
    title: item.title,
    technologies: item.technologies,
    issueCategories: item.issueCategories,
    issues: item.issues,
    reviewStatus: model.reviewStatus.items[item.id]?.status || 'unreviewed',
    notes: model.reviewStatus.items[item.id]?.notes || '',
    links: item.relativeLinks,
  })))
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lead Review Workspace</title>
<style>
:root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #09090b; color: #f4f4f5; }
body { margin: 0; background: #09090b; color: #f4f4f5; }
header, main { max-width: 1220px; margin: 0 auto; padding: 24px; }
header { border-bottom: 1px solid #27272a; }
h1 { margin: 0 0 8px; font-size: 28px; }
a { color: #93c5fd; }
.filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin: 20px 0; }
label { display: grid; gap: 6px; color: #a1a1aa; font-size: 13px; }
select, input { background: #111113; color: #f4f4f5; border: 1px solid #3f3f46; border-radius: 6px; padding: 9px; }
.summary { display: flex; flex-wrap: wrap; gap: 12px; color: #d4d4d8; }
.lead { border: 1px solid #27272a; background: #111113; border-radius: 8px; padding: 18px; margin: 14px 0; }
.lead h2 { margin: 0 0 10px; font-size: 18px; }
.meta, .links, .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
.chip { border: 1px solid #3f3f46; border-radius: 999px; padding: 4px 8px; color: #d4d4d8; font-size: 12px; }
.score { font-weight: 700; color: #facc15; }
.note { color: #a1a1aa; }
</style>
</head>
<body>
<header>
<h1>Lead Review Workspace</h1>
<p class="note">Run ${escapeHtml(model.runId || 'unknown')} / ${model.items.length} leads / state stored in review-status.json</p>
<div class="summary"><span>Shortlisted: <strong id="shortlistedCount">0</strong></span><span>Reviewed: <strong id="reviewedCount">0</strong></span><span>Rejected: <strong id="rejectedCount">0</strong></span></div>
</header>
<main>
<section class="filters">
<label>Score range<select id="scoreFilter"></select></label>
<label>Review status<select id="statusFilter"></select></label>
<label>Technology<select id="technologyFilter"></select></label>
<label>Issue category<select id="issueFilter"></select></label>
<label>Search<input id="searchFilter" type="search" placeholder="URL, title, issue"></label>
</section>
<p class="note">This static workspace reads generated state. To persist review decisions, edit review-status.json and regenerate selected-leads.csv.</p>
<section id="leadList"></section>
</main>
<script>
const items = ${itemsJson};
const filters = ${JSON.stringify(model.filters)};
const list = document.getElementById('leadList');
for (const [id, values] of Object.entries({ scoreFilter: filters.scoreRanges, statusFilter: filters.reviewStatuses, technologyFilter: filters.technologies, issueFilter: filters.issueCategories })) {
  const select = document.getElementById(id);
  for (const value of values) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
  select.addEventListener('change', render);
}
document.getElementById('searchFilter').addEventListener('input', render);
function render() {
  const score = document.getElementById('scoreFilter').value;
  const status = document.getElementById('statusFilter').value;
  const technology = document.getElementById('technologyFilter').value;
  const issue = document.getElementById('issueFilter').value;
  const query = document.getElementById('searchFilter').value.toLowerCase();
  let shortlisted = 0, reviewed = 0, rejected = 0;
  list.innerHTML = '';
  for (const item of items) {
    if (item.reviewStatus === 'shortlisted') shortlisted += 1;
    if (item.reviewStatus === 'reviewed') reviewed += 1;
    if (item.reviewStatus === 'rejected') rejected += 1;
    if (!matchesScore(item.leadScore, score)) continue;
    if (status !== 'all' && item.reviewStatus !== status) continue;
    if (technology !== 'all' && !item.technologies.includes(technology)) continue;
    if (issue !== 'all' && !Object.keys(item.issueCategories).includes(issue)) continue;
    const haystack = [item.url, item.title, item.name, item.issues.join(' ')].join(' ').toLowerCase();
    if (query && !haystack.includes(query)) continue;
    list.appendChild(renderCard(item));
  }
  document.getElementById('shortlistedCount').textContent = shortlisted;
  document.getElementById('reviewedCount').textContent = reviewed;
  document.getElementById('rejectedCount').textContent = rejected;
}
function renderCard(item) {
  const el = document.createElement('article');
  el.className = 'lead';
  el.innerHTML = '<h2>' + escapeHtml(item.rank + '. ' + (item.name || item.url)) + '</h2>' +
    '<div class="meta"><span class="score">Score ' + item.leadScore + '</span><span>' + escapeHtml(item.reviewStatus) + '</span><span>' + escapeHtml(item.status) + '</span></div>' +
    '<p><a href="' + escapeAttr(item.url) + '">' + escapeHtml(item.url) + '</a></p>' +
    '<p>' + escapeHtml(item.title || '') + '</p>' +
    '<div class="chips">' + item.technologies.map((value) => '<span class="chip">' + escapeHtml(value) + '</span>').join('') + Object.keys(item.issueCategories).map((value) => '<span class="chip">' + escapeHtml(value + ':' + item.issueCategories[value]) + '</span>').join('') + '</div>' +
    '<ul>' + (item.issues.length ? item.issues.slice(0, 6) : ['No issues recorded']).map((value) => '<li>' + escapeHtml(value) + '</li>').join('') + '</ul>' +
    '<div class="links">' + link('HTML report', item.links.htmlReport) + link('JSON', item.links.jsonArtifact) + link('Desktop', item.links.desktopScreenshot) + link('Mobile', item.links.mobileScreenshot) + '</div>' +
    (item.notes ? '<p class="note">Notes: ' + escapeHtml(item.notes) + '</p>' : '');
  return el;
}
function matchesScore(value, range) {
  if (range === 'all') return true;
  const parts = range.split('-').map(Number);
  return value >= parts[0] && value <= parts[1];
}
function link(label, href) { return href ? '<a href="' + escapeAttr(href) + '">' + escapeHtml(label) + '</a>' : ''; }
function escapeHtml(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function escapeAttr(value) { return escapeHtml(value); }
render();
</script>
</body>
</html>
`
}

function escapeHtml(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

module.exports = { renderIndexHtml }
