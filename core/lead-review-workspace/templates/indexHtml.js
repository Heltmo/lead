function renderIndexHtml(model) {
  const itemsJson = JSON.stringify(model.items.map((item) => ({
    id: item.id,
    rank: item.rank,
    name: item.name,
    url: item.url,
    status: item.status,
    leadScore: item.leadScore,
    title: item.title,
    pageTitle: item.pageTitle || item.title,
    technologies: item.technologies,
    issueCategories: item.issueCategories,
    issues: item.issues,
    emails: item.emails || [],
    phones: item.phones || [],
    performance: item.performance || {},
    suggestedAngle: item.suggestedAngle || 'General improvement opportunity',
    suggestedAngleDetail: item.suggestedAngleDetail || 'The site has measurable improvement signals that are worth reviewing before outreach.',
    opportunityBullets: item.opportunityBullets || {},
    reviewStatus: model.reviewStatus.items[item.id]?.status || 'unreviewed',
    priority: model.reviewStatus.items[item.id]?.priority || 'unset',
    nextAction: model.reviewStatus.items[item.id]?.nextAction || 'unset',
    owner: model.reviewStatus.items[item.id]?.owner || '',
    lastReviewedAt: model.reviewStatus.items[item.id]?.lastReviewedAt || '',
    tags: model.reviewStatus.items[item.id]?.tags || [],
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
.lead.opportunity-high { border-color: #f59e0b; box-shadow: inset 3px 0 0 #f59e0b; }
.lead.opportunity-medium { border-color: #52525b; box-shadow: inset 3px 0 0 #71717a; }
.lead-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.lead h2 { margin: 0 0 8px; font-size: 18px; line-height: 1.3; }
.lead-url { margin: 0; color: #a1a1aa; word-break: break-all; }
.score-badge { min-width: 88px; text-align: center; border: 1px solid #52525b; border-radius: 8px; padding: 8px; background: #18181b; }
.score-badge strong { display: block; font-size: 24px; color: #facc15; }
.triage-grid { display: grid; grid-template-columns: minmax(260px, 1.15fr) minmax(260px, 1fr) minmax(220px, .8fr); gap: 14px; margin-top: 16px; }
.panel { border: 1px solid #27272a; border-radius: 8px; padding: 14px; background: #0c0c0f; }
.panel-title { margin: 0 0 10px; color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 0; }
.angle { margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #f4f4f5; }
.angle-detail { margin: 0 0 10px; color: #d4d4d8; line-height: 1.5; }
.meta, .links, .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
.chip { border: 1px solid #3f3f46; border-radius: 999px; padding: 4px 8px; color: #d4d4d8; font-size: 12px; }
.chip.urgent { border-color: #f59e0b; color: #fde68a; }
.issue-list { margin: 8px 0 0; padding-left: 18px; }
.issue-list li { margin: 6px 0; }
.score { font-weight: 700; color: #facc15; }
.note { color: #a1a1aa; }
@media (max-width: 900px) { .triage-grid { grid-template-columns: 1fr; } .lead-header { display: block; } .score-badge { margin-top: 12px; } }
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
<label>Priority<select id="priorityFilter"></select></label>
<label>Next action<select id="nextActionFilter"></select></label>
<label>Owner<select id="ownerFilter"></select></label>
<label>Tag<select id="tagFilter"></select></label>
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
for (const [id, values] of Object.entries({ scoreFilter: filters.scoreRanges, statusFilter: filters.reviewStatuses, priorityFilter: filters.priorities, nextActionFilter: filters.nextActions, ownerFilter: filters.owners, tagFilter: filters.tags, technologyFilter: filters.technologies, issueFilter: filters.issueCategories })) {
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
  const priority = document.getElementById('priorityFilter').value;
  const nextAction = document.getElementById('nextActionFilter').value;
  const owner = document.getElementById('ownerFilter').value;
  const tag = document.getElementById('tagFilter').value;
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
    if (priority !== 'all' && item.priority !== priority) continue;
    if (nextAction !== 'all' && item.nextAction !== nextAction) continue;
    if (owner !== 'all' && item.owner !== owner) continue;
    if (tag !== 'all' && !item.tags.includes(tag)) continue;
    if (technology !== 'all' && !item.technologies.includes(technology)) continue;
    if (issue !== 'all' && !Object.keys(item.issueCategories).includes(issue)) continue;
    const opportunityText = opportunityValues(item).join(' ');
    const haystack = [item.url, item.title, item.pageTitle, item.name, item.suggestedAngle, item.suggestedAngleDetail, opportunityText, item.owner, item.nextAction, item.priority, item.notes, item.tags.join(' '), item.issues.join(' ')].join(' ').toLowerCase();
    if (query && !haystack.includes(query)) continue;
    list.appendChild(renderCard(item));
  }
  document.getElementById('shortlistedCount').textContent = shortlisted;
  document.getElementById('reviewedCount').textContent = reviewed;
  document.getElementById('rejectedCount').textContent = rejected;
}
function renderCard(item) {
  const el = document.createElement('article');
  el.className = 'lead ' + opportunityClass(item);
  const topIssues = item.issues.length ? item.issues.slice(0, 3) : ['No issues recorded'];
  const painPoints = (item.opportunityBullets.painPointBullets || []).slice(0, 3);
  el.innerHTML = '<div class="lead-header">' +
    '<div><h2>' + escapeHtml(item.rank + '. ' + (item.name || item.title || item.url)) + '</h2><p class="lead-url"><a href="' + escapeAttr(item.url) + '">' + escapeHtml(item.url) + '</a></p></div>' +
    '<div class="score-badge"><span>Lead score</span><strong>' + item.leadScore + '</strong><small>' + escapeHtml(scoreLabel(item)) + '</small></div>' +
    '</div>' +
    '<div class="triage-grid">' +
      '<section class="panel"><p class="panel-title">Business opportunity</p><p class="angle">' + escapeHtml(item.suggestedAngle) + '</p><p class="angle-detail">' + escapeHtml(item.suggestedAngleDetail) + '</p>' +
        '<ul class="issue-list">' + painPoints.map((value) => '<li>' + escapeHtml(value) + '</li>').join('') + '</ul>' +
        '<p><strong>Offer:</strong> ' + escapeHtml(item.opportunityBullets.suggestedOffer || '') + '</p>' +
        '<p><strong>Opener:</strong> ' + escapeHtml(item.opportunityBullets.outreachOpener || '') + '</p>' +
        '<p class="note">' + escapeHtml(item.opportunityBullets.whyThisLeadMatters || '') + '</p>' +
        '<div class="chips"><span class="chip urgent">Review: ' + escapeHtml(item.reviewStatus) + '</span><span class="chip">Priority: ' + escapeHtml(item.priority) + '</span><span class="chip">Next: ' + escapeHtml(item.nextAction) + '</span></div>' +
        '<p class="note">' + escapeHtml(contactability(item)) + '</p></section>' +
      '<section class="panel"><p class="panel-title">Top evidence</p><ul class="issue-list">' + topIssues.map((value) => '<li>' + escapeHtml(value) + '</li>').join('') + '</ul>' +
        '<div class="chips">' + Object.keys(item.issueCategories).map((value) => '<span class="chip">' + escapeHtml(value + ':' + item.issueCategories[value]) + '</span>').join('') + '</div></section>' +
      '<section class="panel"><p class="panel-title">Review metadata</p>' +
        '<p>Audit status: <strong>' + escapeHtml(item.status || 'unknown') + '</strong></p>' +
        (item.pageTitle ? '<p>Page title: ' + escapeHtml(item.pageTitle) + '</p>' : '') +
        (item.owner ? '<p>Owner: <strong>' + escapeHtml(item.owner) + '</strong></p>' : '<p>Owner: unassigned</p>') +
        (item.lastReviewedAt ? '<p>Last reviewed: ' + escapeHtml(item.lastReviewedAt) + '</p>' : '') +
        (item.notes ? '<p class="note">Notes: ' + escapeHtml(item.notes) + '</p>' : '') +
        '<div class="chips">' + item.tags.map((value) => '<span class="chip">tag:' + escapeHtml(value) + '</span>').join('') + '</div></section>' +
    '</div>' +
    '<div class="chips"><span class="chip">Tech: ' + escapeHtml(item.technologies.length ? item.technologies.join(', ') : 'unknown') + '</span><span class="chip">Email: ' + escapeHtml(item.emails.length ? 'found' : 'missing') + '</span><span class="chip">Phone: ' + escapeHtml(item.phones.length ? 'found' : 'missing') + '</span></div>' +
    '<div class="links">' + link('HTML report', item.links.htmlReport) + link('JSON', item.links.jsonArtifact) + link('Desktop screenshot', item.links.desktopScreenshot) + link('Mobile screenshot', item.links.mobileScreenshot) + '</div>';
  return el;
}
function opportunityValues(item) {
  const opportunity = item.opportunityBullets || {};
  return (opportunity.painPointBullets || []).concat([opportunity.suggestedOffer || '', opportunity.outreachOpener || '', opportunity.whyThisLeadMatters || '']);
}
function opportunityClass(item) {
  const issueTotal = Object.values(item.issueCategories || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  if (item.leadScore <= 20 || issueTotal >= 6) return 'opportunity-high';
  if (item.leadScore <= 50 || issueTotal >= 3) return 'opportunity-medium';
  return '';
}
function scoreLabel(item) {
  if (item.leadScore <= 20) return 'High opportunity';
  if (item.leadScore <= 50) return 'Review closely';
  return 'Lower urgency';
}
function contactability(item) {
  const parts = [];
  parts.push(item.emails.length ? 'email found' : 'email missing');
  parts.push(item.phones.length ? 'phone found' : 'phone missing');
  return 'Contactability: ' + parts.join(', ');
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
