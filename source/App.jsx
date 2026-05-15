import React from 'react';

const TWEAK_DEFAULTS = {
  "accentColor": "#2563EB",
  "livingAgent": true,
  "allowCursorFollow": true,
  "proactiveSuggestions": true,
  "activityLevel": "Balanced",
  "reduceMotion": false,
  "muteAssistant": false
};

const SIDEBAR_GROUPS = [
  { label: 'Overview', items: ['Dashboard', 'Attention Center', 'Search'] },
  { label: 'Manage', items: ['Companies / Clients', 'Expirations', 'Licenses', 'Contracts', 'Documents'] },
  { label: 'Work', items: ['Tasks', 'Reports'] },
  { label: 'Admin', items: ['Data Import', 'Settings'] }
];

const moduleMeta = {
  Dashboard: ['Operational command center', 'Know what expires. Know what it costs not to act. Act on time.'],
  'Attention Center': ['Operational issue center', 'Resolve critical renewals, ownership gaps, missing evidence and approval blockers before they become financial or operational risk.'],
  Search: ['Global record search', 'Find companies, renewals, documents and owners.'],
  'Companies / Clients': ['Client operating model', 'Companies, contacts, exposure and ownership.'],
  Expirations: ['Renewal calendar', 'Prioritize upcoming dates and missing actions.'],
  Licenses: ['Software and SaaS licenses', 'Track products, quantities, spend and risk.'],
  Contracts: ['Commercial agreements', 'Track obligations, parties, value and status.'],
  Documents: ['Record document vault', 'Find quotes, agreements, warranties and evidence.'],
  Tasks: ['Operational work queue', 'Assign and close renewal work.'],
  Reports: ['Executive reporting', 'Prepare operational and governance reports.'],
  'Data Import': ['Spreadsheet onboarding', 'Map, validate and import tenant records.'],
  Settings: ['Workspace administration', 'Configure access, data, automation and governance.']
};

const riskItems = [
  ['SSL certificate expires in 12 days', 'Critical', 'Grupo Regency', 'Assign owner and renew certificate', 'Luis Mora'],
  ['Dell PowerEdge R750 warranty expired', 'Critical', 'Metro Retail Group', 'Approve replacement coverage', 'Ana Ríos'],
  ['Trend Micro renewal quote pending', 'High', 'Banisi', 'Send quote to Paola Medina', 'María Chen'],
  ['Microsoft true-up needs finance approval', 'Medium', 'Canal Bank', 'Approve 480-seat renewal', 'Elena Ruiz']
];

const companies = [
  ['Banisi', 'Financial services', 'Paola Medina', 'María Chen', '42 records', '7 expiring in 60 days', '$486K', 'High'],
  ['Grupo Regency', 'Hospitality', 'Ricardo Solís', 'Luis Mora', '31 records', '5 expiring in 30 days', '$214K', 'Critical'],
  ['Nova Finance', 'Banking', 'Nadia Brooks', 'Tomás Vega', '18 records', '3 expiring in 45 days', '$162K', 'Medium'],
  ['Metro Retail Group', 'Retail', 'Sofía Torres', 'Ana Ríos', '27 assets', '4 overdue / expiring', '$96K', 'Critical']
];

const contacts = [
  ['Paola Medina', 'Banisi', 'VP Security', 'paola.medina@banisi.com', 'Technical', 'Main contact'],
  ['Ricardo Solís', 'Grupo Regency', 'IT Operations Director', 'ricardo.solis@regency.pa', 'Technical', 'DNS approver'],
  ['Nadia Brooks', 'Nova Finance', 'Legal Counsel', 'nadia.brooks@novafinance.com', 'Legal', 'Contract reviewer'],
  ['Sofía Torres', 'Metro Retail Group', 'Infrastructure Manager', 'sofia.torres@metroretail.co', 'Technical', 'Warranty owner']
];

const expirations = [
  ['Trend Micro Vision One Credits', 'Software license', 'Banisi', 'May 2, 2026', '28 days', 'High', 'María Chen', 'Send renewal quote'],
  ['Wildcard SSL Certificate', 'SSL certificate', 'Grupo Regency', 'Apr 16, 2026', '12 days', 'Critical', 'Luis Mora', 'Assign owner and renew'],
  ['Dell R750 Warranty', 'Hardware warranty', 'Metro Retail Group', 'Mar 30, 2026', 'Expired', 'Critical', 'Ana Ríos', 'Approve replacement coverage'],
  ['Gold Support Contract', 'Support agreement', 'Banisi', 'Jul 3, 2026', '90 days', 'Low', 'Diego Paredes', 'Schedule QBR']
];

const licenses = [
  ['Trend Micro Vision One Credits', 'Trend Micro', 'Banisi', '1,200 credits', 'Expires May 2, 2026', '$42,800', 'María Chen', 'High risk'],
  ['Microsoft 365 Business Premium', 'Microsoft', 'Canal Bank', '480 seats', 'Renews Jun 3, 2026', '$63,360', 'Elena Ruiz', 'Approval needed'],
  ['Veeam Backup for Microsoft 365', 'Veeam', 'Nova Finance', '250 mailboxes', 'Renews May 19, 2026', '$18,900', 'Tomás Vega', 'Usage review'],
  ['FortiGate UTP Support', 'Fortinet', 'Global Logistics Panamá', '8 appliances', 'Renews Aug 17, 2026', '$24,100', 'Diego Paredes', 'Healthy']
];

const contracts = [
  ['Gold Support Contract', 'Support agreement', 'Banisi', 'Nextcom', 'Ends May 2, 2026', '$42,800', 'High risk'],
  ['Data Processing Addendum', 'Legal compliance', 'Nova Finance', 'CloudSecure Ltd.', 'Ends Jun 15, 2026', '$12,500', 'Legal review'],
  ['Managed Network Agreement', 'Service agreement', 'Grupo Regency', 'NetOps Panamá', 'Auto-renews Apr 28, 2026', '$58,200', 'Owner missing'],
  ['Hardware Support MSA', 'Master services', 'Metro Retail Group', 'Dell Technologies', 'Ends Sep 9, 2026', '$31,400', 'Active']
];

const documents = [
  ['Trend Micro Renewal Quote.pdf', 'Quote', 'Trend Micro Vision One renewal', 'Banisi', 'Uploaded by María', 'Version 2'],
  ['Gold Support Contract Signed.pdf', 'Contract', 'Support agreement with Nextcom', 'Banisi', 'Uploaded by Legal', 'Version 4'],
  ['Dell Warranty Coverage.xlsx', 'Coverage evidence', 'R750 warranty inventory', 'Metro Retail Group', 'Uploaded by Ana', 'Version 1'],
  ['Regency SSL CSR.txt', 'Certificate', 'Wildcard certificate renewal', 'Grupo Regency', 'Uploaded by Luis', 'Version 3']
];

const tasks = [
  ['Send renewal proposal', 'Banisi', 'Trend Micro renewal', 'María Chen', 'High', 'Apr 12', 'In progress'],
  ['Assign DNS approver', 'Grupo Regency', 'SSL certificate renewal', 'Luis Mora', 'Critical', 'Today', 'Blocked'],
  ['Review DPA amendment', 'Nova Finance', 'CloudSecure contract', 'Nadia Brooks', 'Medium', 'Apr 18', 'Waiting legal'],
  ['Approve warranty coverage', 'Metro Retail Group', 'Dell R750 support', 'Ana Ríos', 'Critical', 'Overdue', 'Escalated']
];

const reports = [
  ['Renewal Exposure by Client', 'Executive summary', 'Finance and operations', 'María Chen', 'Weekly', 'Ready'],
  ['Critical Expirations Board Pack', 'Risk report', 'Leadership', 'Luis Mora', 'Monthly', 'Draft'],
  ['Data Completeness Review', 'Governance report', 'Administrators', 'Elena Ruiz', 'Biweekly', 'Needs review']
];

const importRows = [
  ['License inventory import', 'licenses_may.csv', '328 rows', '14 duplicates suggested', 'Ready to review'],
  ['Vendor catalog cleanup', 'providers.xlsx', '82 rows', '9 potential matches', 'Mapping required'],
  ['Warranty batch upload', 'dell_assets.csv', '146 rows', '3 serial conflicts', 'Validation failed']
];

const settingsAdminGroups = [
  { id: 'company', label: 'Company', title: 'Company', description: 'Workspace identity, tenant branding and regional defaults.', items: [
    ['Workspace profile', 'Legal name, workspace ownership and company details.', 'Complete', 'Open'],
    ['Branding', 'Logo, accent color and tenant-facing identity assets.', 'Ready', 'Manage'],
    ['Localization', 'Language, timezone, number formats and currency defaults.', 'Active', 'Edit']
  ]},
  { id: 'access', label: 'Access', title: 'Access', description: 'Users, roles and security controls for the workspace.', items: [
    ['Users', 'Invite, suspend and review workspace members.', '42 active', 'Manage'],
    ['Roles & permissions', 'Role templates and module-level access rules.', '8 roles', 'Review'],
    ['Security', 'Session policies, password rules and device controls.', 'Healthy', 'Configure'],
    ['SSO / MFA', 'Single sign-on, MFA enforcement and recovery settings.', 'MFA enforced', 'Edit']
  ]},
  { id: 'data', label: 'Data', title: 'Data', description: 'Catalogs, fields and record structures used across managed assets.', items: [
    ['Categories', 'Record categories and required-field rules by type.', '10 active', 'Manage'],
    ['Custom fields', 'Tenant-specific fields by module, category and workflow.', '27 fields', 'Configure'],
    ['Vendors / Providers', 'Provider catalog with duplicate prevention and ownership.', '186 records', 'Open'],
    ['Brands / Manufacturers', 'Brand catalog linked to products, assets and warranties.', '74 records', 'Open'],
    ['Products & SKUs', 'Product templates, SKUs, quantities and renewal defaults.', '412 SKUs', 'Review'],
    ['Tags', 'Governed tags for reporting, filtering and segmentation.', '32 tags', 'Manage']
  ]},
  { id: 'automation', label: 'Automation', title: 'Automation', description: 'Rules that turn dates, risk and missing data into accountable action.', items: [
    ['Notification rules', 'When owners, approvers and executives receive updates.', '18 rules', 'Manage'],
    ['Escalation policies', 'Escalate overdue, critical and ownerless records.', '5 policies', 'Review'],
    ['Approval workflows', 'Finance, legal and technical approval chains.', '4 workflows', 'Configure'],
    ['Default alert policies', 'Category defaults for certificates, licenses and contracts.', 'By category', 'Edit']
  ]},
  { id: 'ai-operator', label: 'AI Operator', title: 'AI Operator', description: 'Assistant availability, permissions, approvals and operator behavior.', items: [
    ['Assistant availability', 'Enable Opriva AI Assistant for approved workspace users.', 'Enabled', 'Review'],
    ['AI permissions', 'Allowed AI actions, drafts and approval boundaries.', 'Approval-first', 'Review'],
    ['Approval rules', 'Review requirements and workspace data scope.', 'Required', 'Review'],
    ['Operator behavior', 'Living-agent motion, cursor following and helper messages.', 'Balanced', 'Review']
  ]},
  { id: 'governance', label: 'Governance', title: 'Governance', description: 'Auditability, import history, retention and controlled exports.', items: [
    ['Audit log', 'Immutable activity history for records and settings.', 'On', 'Open'],
    ['Import history', 'Past imports, mapping decisions and validation outcomes.', '23 imports', 'Open'],
    ['Data retention', 'Archive, deletion and evidence-retention policies.', '7 years', 'Configure'],
    ['Export history', 'Track generated exports for compliance review.', '12 exports', 'Open']
  ]},
  { id: 'integrations', label: 'Integrations', title: 'Integrations', description: 'API access, webhooks and external system connections.', items: [
    ['API keys', 'Generate and revoke API keys for external integrations.', '2 active', 'Manage'],
    ['Webhooks', 'Configure outbound event hooks to external systems.', '1 active', 'Configure'],
    ['Email connectors', 'SMTP or email service for notifications and follow-ups.', 'Configured', 'Edit'],
    ['External systems', 'PSA, ITSM and third-party platform integrations.', '0 connected', 'Browse']
  ]}
];

const MODULE_LIST = [
  ['Expirations',       'Renewal calendar and expiration tracking.'],
  ['Licenses',          'Software and SaaS license management.'],
  ['Contracts',         'Commercial agreements and obligations.'],
  ['Documents',         'Record document vault and evidence management.'],
  ['Tasks',             'Operational work queue and follow-up tracking.'],
  ['Reports',           'Executive and governance reporting.'],
  ['Data Import',       'Spreadsheet onboarding and bulk record import.'],
  ['Vendors / Providers', 'Vendor catalog and supplier management.'],
  ['Assets / Hardware', 'Hardware asset tracking and warranty management.'],
];


const AI_CONTEXTS = {
  Dashboard: {
    role: 'Executive prioritization assistant',
    metadata: 'Context: 418 expirations · 74 open tasks · 41 missing documents',
    suggestions: ['What needs attention today?', 'Generate executive brief', 'Create tasks for critical items', 'Explain renewal exposure'],
    result: 'I found 12 critical renewals. 3 are missing owners, 4 are missing documents and 2 expire in less than 15 days.',
    findings: ['Critical exposure is concentrated in Banisi and Grupo Regency.', 'Owner gaps are blocking certificate and warranty work.', 'Finance approval is needed before two vendor renewals can move.'],
    actions: ['Create tasks', 'Assign owners', 'Generate summary', 'Draft emails'],
    sources: ['Attention queue', 'Expiration dates', 'Open tasks', 'Document requirements']
  },
  'Attention Center': { role: 'Triage assistant', metadata: 'Context: 9 critical alerts · 18 escalations · 14 missing owners', suggestions: ['Group alerts by urgency', 'Suggest owners', 'Create resolution tasks', 'Draft escalation message'], result: 'I grouped open alerts into certificate risk, missing evidence and approval blockers so teams can resolve the highest-impact work first.', findings: ['3 alerts require same-day action.', '5 alerts can be assigned to existing client owners.', 'Evidence requests should be batched by company.'], actions: ['Create resolution tasks', 'Assign owners', 'Draft escalation', 'Open related records'], sources: ['Alert rules', 'Owner history', 'Risk score', 'Client records'] },
  Search: { role: 'Natural language search assistant', metadata: 'Context: global records · documents · owners · saved views', suggestions: ['Find records without owners', 'Show renewals in 30 days', 'Find missing documents', 'Explain search results'], result: 'I can turn plain language into structured searches and explain why each result matters operationally.', findings: ['Search can include owners, documents and renewal windows.', 'Results are grouped by record type.', 'Sensitive actions remain review-first.'], actions: ['Run search', 'Save view', 'Open records', 'Export summary'], sources: ['Global index', 'Documents', 'Owners', 'Saved views'] },
  'Companies / Clients': { role: 'Client intelligence assistant', metadata: 'Context: 128 companies · $1.8M exposure · 312 contacts', suggestions: ['Summarize client exposure', 'Prepare meeting brief', 'Show upcoming renewals', 'Draft follow-up email'], result: 'Banisi has $486K exposure, 7 renewals in 60 days and two document gaps that should be discussed before the next account meeting.', findings: ['Trend Micro renewal is the largest near-term item.', 'Gold Support Contract is missing signed evidence.', 'Paola Medina is the primary technical contact.'], actions: ['Prepare meeting brief', 'Draft follow-up email', 'Open related records', 'Create tasks'], sources: ['Company records', 'Contacts', 'Contracts', 'Expirations'] },
  Expirations: { role: 'Renewal risk assistant', metadata: 'Context: 418 expirations · 36 due in 30 days · 14 missing owners', suggestions: ['Find critical expirations', 'Detect missing actions', 'Recommend next steps', 'Create renewal tasks'], result: 'The next renewal wave has 12 high-risk items; the fastest improvement is assigning missing owners and requesting required documents today.', findings: ['Two records expire in less than 15 days.', 'Ownerless records are mostly certificate and warranty items.', 'Documents block 4 renewal approvals.'], actions: ['Create renewal tasks', 'Assign owners', 'Draft vendor emails', 'Review before applying'], sources: ['Expiration dates', 'Risk scores', 'Owner fields', 'Document rules'] },
  Licenses: { role: 'License renewal assistant', metadata: 'Context: 184 licenses · 29 renewals · $742K annual spend', suggestions: ['Analyze renewal exposure by brand', 'Find licenses missing documents', 'Draft vendor follow-up', 'Generate renewal forecast'], result: 'License exposure is led by Microsoft and Trend Micro, with three renewals missing supporting quotes.', findings: ['Microsoft true-up needs approval.', 'Trend Micro quote is versioned but not approved.', 'Veeam usage should be reviewed before renewal.'], actions: ['Generate forecast', 'Draft vendor follow-up', 'Request documents', 'Create approval task'], sources: ['License table', 'Brands', 'Spend data', 'Documents'] },
  Contracts: { role: 'Contract review assistant', metadata: 'Context: 96 contracts · 12 notice periods · 7 legal reviews', suggestions: ['Summarize contract', 'Extract key dates', 'Detect auto-renewal risks', 'Create legal review task'], result: 'I found three contracts in notice windows. One auto-renewal lacks legal review and should be escalated before the renewal deadline.', findings: ['Managed Network Agreement auto-renews soon.', 'Gold Support Contract is missing the signed PDF.', 'Legal review is pending for two agreements.'], actions: ['Create legal review task', 'Extract dates', 'Draft counterparty email', 'Open related records'], sources: ['Contract metadata', 'Notice periods', 'Documents', 'Tasks'] },
  Documents: { role: 'Document intelligence assistant', metadata: 'Context: 624 documents · 41 missing required files · 23 restricted files', suggestions: ['Summarize document', 'Extract dates', 'Link to related record', 'Identify missing evidence'], result: 'The most important document gap is the signed Gold Support Contract because it blocks renewal approval and governance evidence.', findings: ['One quote has newer version available.', 'Required evidence is missing on 4 high-risk records.', 'Restricted documents should remain approval-gated.'], actions: ['Request evidence', 'Link records', 'Extract dates', 'Upload replacement'], sources: ['Document vault', 'Required-document rules', 'Linked records', 'Access policy'] },
  Tasks: { role: 'Work planning assistant', metadata: 'Context: 74 open tasks · 11 overdue · 18 blocked', suggestions: ['Prioritize my tasks', 'Create tasks from alerts', 'Find overdue work', 'Suggest next actions'], result: 'Your highest-impact work today is resolving the SSL owner gap, approving warranty coverage and requesting the Banisi signed contract.', findings: ['Two critical tasks are overdue.', 'Blocked work is mostly missing approvals.', 'Owner workload is uneven across the team.'], actions: ['Prioritize queue', 'Assign task', 'Create tasks from alerts', 'Draft updates'], sources: ['Task board', 'Alerts', 'Due dates', 'Owner workload'] },
  Reports: { role: 'Report builder assistant', metadata: 'Context: 12 templates · 8 scheduled reports · 31 recent exports', suggestions: ['Generate executive summary', 'Build renewal exposure report', 'Explain trends', 'Schedule report'], result: 'I can generate a concise executive renewal brief using exposure, critical items, owner gaps and open approval blockers.', findings: ['Leadership needs exposure and next actions, not raw tables.', 'Governance report should include document completeness.', 'Trends show certificate risk rising.'], actions: ['Generate report', 'Schedule report', 'Export summary', 'Review sources'], sources: ['Reports', 'Expirations', 'Tasks', 'Documents'] },
  'Data Import': { role: 'Data cleanup assistant', metadata: 'Context: 3 imports · 14 duplicates · 7 missing owners', suggestions: ['Map columns', 'Detect duplicates', 'Fix formats', 'Suggest missing owners'], result: 'The import can be improved by mapping Expiration Date, merging 12 duplicate vendors and assigning owners based on company history.', findings: ['One sheet has invalid date formats.', 'Trend Micro duplicates an existing vendor.', 'Seven rows need owners before confirmation.'], actions: ['Review mapping', 'Merge duplicates', 'Apply owner suggestions', 'Confirm import'], sources: ['Import preview', 'Catalog records', 'Validation rules', 'Owner history'] },
  Settings: { role: 'Configuration assistant', metadata: 'Context: 18 alert rules · 27 custom fields · 14 templates', suggestions: ['Recommend alert policy', 'Suggest required fields', 'Create category template', 'Configure onboarding checklist'], result: 'Your workspace is configured well, but license and certificate categories should require owner, renewal date and evidence before records can become active.', findings: ['Approval before AI actions is enabled.', 'Data access is workspace scoped.', 'Two categories have weak required-field rules.'], actions: ['Update policy', 'Create template', 'Review AI settings', 'Open audit log'], sources: ['Settings', 'Data Management', 'Automation rules', 'Governance policy'] }
};

const AI_WORKFLOWS = ['90-day renewal review','Missing owner cleanup','Missing documents cleanup','Client meeting brief','Executive report generator','Contract review','Import mapping assistant','Renewal follow-up drafts'];
const AI_CONFIRMATION = 'Opriva AI will create 8 tasks assigned to 3 users. Review before applying?';

function cx(...values){ return values.filter(Boolean).join(' '); }
function asArray(data){ return Array.isArray(data) ? data : []; }
function safeText(value, fallback='Not specified'){ return value || fallback; }
function riskClass(value){ const v = String(value || '').toLowerCase(); return v.includes('critical') || v.includes('urgent') ? 'critical' : v.includes('high') || v.includes('approval') || v.includes('blocked') || v.includes('failed') || v.includes('unassigned') || v.includes('needs assignment') ? 'high' : v.includes('review') ? 'review' : v.includes('medium') || v.includes('warning') ? 'medium' : 'low'; }
function initials(name){ return String(name || 'Opriva').split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0] || '').join('').toUpperCase() || 'OP'; }

function Badge({ children, tone }){ const badgeTone = riskClass(tone || children); return <span className={cx('badge', badgeTone)}>{safeText(children)}</span>; }
function Avatar({ name }){ return <span className="avatar" aria-hidden="true">{initials(name)}</span>; }
function EmptyState({ title, message, action }){ return <div className="stateBox emptyState" role="status"><strong>{title || 'No records found'}</strong><span>{message || 'Adjust filters or create a new record to continue.'}</span>{action && <button>{action}</button>}</div>; }
function ErrorState({ title, message }){ return <div className="stateBox errorState" role="alert"><strong>{title || 'Data could not be loaded'}</strong><span>{message || 'Retry the request or contact support if the problem continues.'}</span><div><button>Retry</button><button className="ghostBtn">Contact support</button></div></div>; }
function LoadingRows({ columns }){ const safeColumns = asArray(columns); return <tbody aria-busy="true">{[0,1,2].map(i => <tr className="skeletonRow" key={i}>{safeColumns.map((c,j)=><td key={c || j}><span className="skeletonLine" /></td>)}</tr>)}</tbody>; }
function Table({ columns, rows, loading=false, error=false, emptyTitle, emptyMessage, selectedIndex=-1, actions=true }){
  const safeColumns = asArray(columns);
  const safeRows = asArray(rows);
  if (error) return <ErrorState title="Failed data loading" message="Opriva could not load this table. Retry or open support with the current workspace context." />;
  if (!loading && safeRows.length === 0) return <EmptyState title={emptyTitle || 'No records yet'} message={emptyMessage || 'This module has no matching records for the current filters.'} action="Create record" />;
  return <div className="tableWrap"><table><thead><tr>{safeColumns.map(c => <th key={c}>{safeText(c)}</th>)}{actions && <th aria-label="Row actions">Actions</th>}</tr></thead>{loading ? <LoadingRows columns={[...safeColumns,'Actions']} /> : <tbody>{safeRows.map((row, i) => { const safeRow = asArray(row); return <tr key={i} className={i===selectedIndex?'selectedRow':''} aria-selected={i===selectedIndex}>{safeColumns.map((column, j) => { const cell = safeText(safeRow[j]); return <td key={column || j}>{j === safeColumns.length - 1 || /risk|status|priority|severity/i.test(column || '') ? <Badge>{cell}</Badge> : cell}</td>; })}{actions && <td><button className="rowAction" aria-label={`Open ${safeText(safeRow[0], 'record')}`}>Open</button></td>}</tr>; })}</tbody>}</table></div>;
}
function ToastStack({ notices = [] }){
  const safeNotices = Array.isArray(notices) ? notices.filter(Boolean) : [];
  if (!safeNotices.length) return null;
  return <div className="toastStack" aria-live="polite">{safeNotices.slice(0,3).map((notice, index) => <div className={cx('toast', notice.tone === 'error' && 'errorToast')} key={notice.id || notice.message || index}>{notice.message || notice}</div>)}</div>;
}
function ValidationPanel(){ return <div className="validationPanel" role="group" aria-label="Import validation states"><div><strong>Required field missing</strong><span>Owner is required for 7 license rows.</span></div><div><strong>Invalid date</strong><span>Three rows use 31/31/2026.</span></div><div><strong>Duplicate record warning</strong><span>12 vendors resemble existing catalog records.</span></div><div><strong>Invalid file format</strong><span>Upload CSV or XLSX files only.</span></div><button disabled title="Fix validation errors before confirming">Confirm import</button></div>; }

function ScreenHeader({ active, subtitle, children }){
  const meta = moduleMeta[active] || ['Opriva Workspace', 'Enterprise operational intelligence.'];
  return <header className="screenHeader"><div><p>{meta[0]}</p><h1>{active}</h1><span>{subtitle || meta[1]}</span></div>{children && <div className="headerActions">{children}</div>}</header>;
}

function StatCards(){
  return <section className="statsGrid" aria-label="Workspace summary">
    {[
      ['90-day exposure', '$284,000', '47 managed records', 'High exposure'],
      ['30-day critical expirations', '12', '3 above $25,000 impact', 'Urgent'],
      ['Missing owners', '18', '14% of active portfolio', 'Needs assignment'],
      ['Pending actions', '9', 'Emails, tasks and documents', 'Review']
    ].map(([label, value, note, badge]) => <article className="statCard" key={label}><span>{label}</span><strong>{value}</strong><p>{note}</p><Badge tone={badge}>{badge}</Badge></article>)}
  </section>;
}

function Dashboard(){
  const priorityRows = [
    ['Dell Support Contract','Contract','Dell','May 26, 2026','12 days','$42,800','Unassigned','Assign owner'],
    ['Microsoft 365 Renewal','License','Microsoft','Jun 1, 2026','18 days','$31,200','Ana Ruiz','Prepare renewal'],
    ['Fortinet Warranty','Warranty','Fortinet','Jun 7, 2026','24 days','$18,600','Luis Mora','Request quote'],
    ['SSL Wildcard Certificate','Certificate','DigiCert','May 23, 2026','9 days','$3,200','Unassigned','Prepare renewal'],
    ['Adobe Creative Cloud','SaaS','Adobe','Jun 11, 2026','28 days','$9,800','Carlos Vega','Review usage']
  ];
  return <main className="content dashboardContent"><ScreenHeader active="Dashboard"><button>Import records</button><button className="primary">Review exposure</button></ScreenHeader><StatCards/><section className="dashboardStack"><article className="panel aiRiskPanel"><div><div className="panelTitle"><h2>AI Risk Summary</h2><span>Financial exposure command center</span></div><p className="insightCopy">This week, 12 records enter a critical renewal window. The highest impact item is the Dell Support Contract for $42,800, expiring in 12 days without an assigned owner. Recommended action: assign an owner and prepare the renewal email today.</p></div><div className="actionStack compactActions"><button>Review critical items</button><button>Assign owners</button><button>Prepare vendor email</button></div></article><article className="panel priorityQueuePanel"><div className="panelTitle"><h2>Priority action queue</h2><span>Records prioritized by urgency, financial value and ownership gaps.</span></div><div className="tableWrap priorityQueueWrap"><table className="priorityQueueTable"><thead><tr>{['Record','Type','Vendor','Expiry date','Days left','Value','Owner','Recommended action'].map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{priorityRows.map(row=><tr key={row[0]}>{row.map((cell,index)=><td key={index} className={cx(index===0 && 'recordCell', index===1 && 'compactCell', index===2 && 'compactCell', index===4 && 'compactCell', index===5 && 'compactCell', index===6 && 'compactCell', index===7 && 'actionCell')}>{index===6 && cell==='Unassigned' ? <Badge tone="Warning">Unassigned</Badge> : index===7 ? <button type="button" className="rowAction">{cell}</button> : cell}</td>)}</tr>)}</tbody></table></div></article></section></main>;
}

function AttentionCenter(){
  const attentionSummary = [
    ['Critical issues', '12', '$84,600 exposed in 30 days', 'Urgent'],
    ['Missing owners', '18', '14% of active portfolio', 'Assign'],
    ['Missing evidence', '7', 'Contracts or documents required', 'Evidence needed'],
    ['Pending approvals', '9', 'AI drafts and tasks waiting', 'Review']
  ];
  return <main className="content attentionContent"><ScreenHeader active="Attention Center" subtitle="Resolve critical renewals, ownership gaps, missing evidence and approval blockers before they become financial or operational risk."><button>Assign owners</button><button className="primary">Create task</button></ScreenHeader><section className="statsGrid attentionSummaryGrid" aria-label="Attention Center summary">{attentionSummary.map(([label, value, note, badge]) => <article className="statCard" key={label}><span>{label}</span><strong>{value}</strong><p>{note}</p><Badge tone={badge}>{badge}</Badge></article>)}</section><div className="aiInsightBar attentionInsightBar" aria-label="Attention Center AI insight"><div className="aiInsightBarLeft"><span className="aiInsightBarLabel">AI insight</span><p className="aiInsightBarText">Opriva found 12 critical renewal issues. Assigning 5 missing owners and requesting 7 documents would reduce the fastest operational risk.</p></div><div className="aiInsightBarActions"><button>Assign owners</button><button>Request documents</button><button>Create tasks</button></div></div><section className="panel"><div className="panelTitle"><h2>Attention workflow</h2><span>Saved views, issue grouping and bulk operations</span></div><div className="tabs"><button className="active">Critical</button><button>Escalations</button><button>Missing owners</button><button>Missing evidence</button><button>Pending approvals</button></div><div className="toolbar"><input placeholder="Filter issues, records, vendors or owners…"/><button>Saved view: Critical this week</button><button>Severity</button><button>Owner</button><button>Bulk actions</button></div><div className="tableWrap attentionWorkflowWrap"><table className="attentionWorkflowTable"><thead><tr>{['Issue / Record','Vendor','Impact','Due','Owner','Recommended action','Status'].map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{[['Renewal expires in 12 days','Dell Support Contract','Dell','$42,800','May 26, 2026','Unassigned','Assign owner','Critical'],['Certificate expires in 9 days','SSL Wildcard Certificate','DigiCert','$3,200','May 23, 2026','Unassigned','Prepare renewal','Critical'],['Renewal quote not requested','Microsoft 365 Renewal','Microsoft','$31,200','Jun 1, 2026','Ana Ruiz','Prepare vendor email','High'],['Warranty expires in 24 days','Fortinet Warranty','Fortinet','$18,600','Jun 7, 2026','Luis Mora','Request quote','High']].map(row => <tr key={row[1]}><td className="issueRecordCell"><span>{row[0]}</span><strong>{row[1]}</strong></td><td className="compactCell">{row[2]}</td><td className="compactCell">{row[3]}</td><td className="dateCell">{row[4]}</td><td className="compactCell">{row[5]==='Unassigned' ? <Badge tone="Needs assignment">Unassigned</Badge> : row[5]}</td><td className="actionCell"><button type="button" className="rowAction">{row[6]}</button></td><td className="compactCell"><Badge tone={row[7]}>{row[7]}</Badge></td></tr>)}</tbody></table></div></section><section className="panel"><div className="panelTitle"><h2>Issue groups</h2><span>Grouped by financial impact, urgency and blocker type.</span></div><Table columns={['Group','Count','Business impact','Primary owner','Action']} rows={[["Critical certificate and warranty gaps",'3','Service continuity risk','Luis Mora','Escalate today'],['High-risk renewals','5','$128K renewal exposure','María Chen','Prepare approvals'],['Missing evidence','7','Contracts blocked','Nadia Brooks','Request documents']]}/></section></main>;
}

function SearchScreen(){
  const results = [['License','Trend Micro Vision One Credits','Banisi','Expires May 2, 2026 · High risk'],['Contract','Gold Support Contract','Banisi','Signed PDF missing · notice period open'],['Owner','María Chen','7 active renewals','2 approvals pending'],['Document','Trend Micro Renewal Quote.pdf','Version 2','Linked to license renewal']];
  return <main className="content"><ScreenHeader active="Search" subtitle="Fast global search for records, documents, owners, expirations and operational questions."/><section className="searchHero"><input aria-label="Search Opriva" placeholder="Ask: which high-risk renewals need documents this month?"/><button className="primary">Search</button></section><section className="panel"><div className="panelTitle"><h2>Search scope</h2><span>Natural language queries with structured filters</span></div><div className="tabs"><button className="active">All</button><button>Records</button><button>Documents</button><button>Owners</button><button>Expirations</button></div><div className="toolbar"><button>Recent: Banisi renewals</button><button>Recent: missing signed contracts</button><button>Suggested: certificates expiring in 30 days</button></div></section><section className="panel"><div className="panelTitle"><h2>Grouped results</h2><span>Best matches across operational objects</span></div><Table columns={['Type','Result','Context','Why it matters']} rows={results}/></section></main>;
}

function CompaniesScreen(){
  const [tab, setTab] = React.useState('Companies');
  const companyRecords = [['Expirations','Trend Micro renewal','May 2, 2026','High','María Chen'],['Licenses','Vision One Credits','1,200 credits','High','María Chen'],['Contracts','Gold Support Contract','Notice due Mar 18','High','Nadia Brooks'],['Tasks','Request signed quote','Due Friday','Open','María Chen']];
  return <main className="content"><ScreenHeader active="Companies / Clients" subtitle="Company detail remains the workspace for contacts, expirations, licenses, contracts, documents and tasks."><button>Configure columns</button><button className="primary">Add company</button></ScreenHeader><div className="tabs" role="tablist"><button className={tab==='Companies'?'active':''} onClick={()=>setTab('Companies')}>Companies</button><button className={tab==='Contacts'?'active':''} onClick={()=>setTab('Contacts')}>Contacts</button><button>Exposure</button><button>Documents</button></div><section className="panel"><div className="toolbar"><input placeholder="Search companies, contacts or domains…"/><button>Saved view: High exposure</button><button>Filters</button><button>Columns</button></div>{tab==='Contacts' ? <><div className="panelTitle"><h2>Key contacts</h2><span>Technical, commercial and legal owners per client</span></div><Table columns={['Contact','Company','Role','Email','Contact type','Responsibility']} rows={contacts}/></> : <><div className="panelTitle"><h2>Companies and clients</h2><span>Exposure, next dates and owner accountability</span></div><Table columns={['Company','Segment','Main contact','Corexi owner','Managed records','Renewal pressure','Exposure','Risk']} rows={companies}/></>}</section><section className="panel"><div className="panelTitle"><h2>Banisi workspace preview</h2><span>Related records stay connected to the client context</span></div><Table columns={['Area','Record','Timing','Risk / status','Owner']} rows={companyRecords}/></section></main>;
}

function ListScreen({ active, columns, rows, note }){
  return <main className="content"><ScreenHeader active={active} subtitle={note}/><section className="panel"><div className="panelTitle"><h2>{active} records</h2><span>Sample rows use meaningful business values for the module.</span></div><Table columns={columns} rows={rows}/></section></main>;
}

function OperationalList({ active, columns, rows, note, tabs=['All','Critical','30 days','Overdue','Missing owner'], ai='Corexi AI can summarize blockers, owners and next actions for this queue.' }){
  const safeRows = Array.isArray(rows) ? rows : [];
  return <main className="content">
    <ScreenHeader active={active} subtitle={note}><button>Bulk actions</button><button>Configure columns</button><button className="primary">New record</button></ScreenHeader>
    <AiInsightBar active={active}/>
    <section className="panel worklistPanel">
      <div className="tabs">{tabs.map((tab,i)=><button key={tab} className={i===0?'active':''}>{tab}</button>)}</div>
      <div className="toolbar"><input placeholder={`Filter ${active.toLowerCase()} by company, owner, vendor or risk…`}/><button>Saved view: Operational risk</button><button>Advanced filters</button><button>AI summary</button></div>
      <div className="panelTitle"><h2>{active} worklist</h2><span>{ai}</span></div>
      <Table columns={columns} rows={safeRows}/>
    </section>
  </main>;
}

function ContractsScreen(){
  const rows = [['Gold Support Contract','Support agreement','Banisi','Nextcom','María Chen','Signed PDF missing','Auto-renews','60 days','Legal review','Confirm signed document','High risk'],['Microsoft Enterprise Agreement','Software agreement','Canal Bank','Microsoft','Rafael Soto','Signed','Manual renewal','90 days','Approved','Prepare true-up','Medium risk'],['SOC Monitoring MSA','Managed service','Grupo Regency','SecureOps','Luis Mora','Signed','Auto-renews','45 days','Counterparty review','Validate SLA credits','Medium risk']];
  return <OperationalList active="Contracts" note="Counterparty, legal, notice-period and renewal obligations stay visible." tabs={['All','High risk','Notice period','Auto-renewal','Missing document']} columns={['Contract','Type','Company','Counterparty','Owner','Document','Renewal','Notice','Legal status','Next action','Risk']} rows={rows}/>;
}

function DocumentsScreen(){
  const rows = [['Trend Micro Renewal Quote.pdf','Quote','Trend Micro Vision One renewal','Banisi','María','Version 2','Internal','Linked','Approved'],['Gold Support Contract.pdf','Contract','Gold Support Contract','Banisi','Nadia','Missing signed version','Restricted','Required','Missing'],['R750 Warranty Evidence.pdf','Warranty proof','Dell PowerEdge R750 Warranty','Canal Bank','Luis','Version 1','Internal','Linked','Valid']];
  return <OperationalList active="Documents" note="Govern evidence, versions, access and required document gaps." tabs={['All','Required missing','Restricted','Pending review','Linked records']} columns={['Document','Type','Linked record','Company','Uploaded by','Version','Access','Requirement','Status']} rows={rows}/>;
}

function TasksScreen(){
  const board = [['To do','Request signed Trend Micro quote','Banisi','María Chen','High'],['In progress','Assign SSL certificate owner','Grupo Regency','Luis Mora','Critical'],['Blocked','Legal approval for support contract','Banisi','Nadia Brooks','High']];
  return <main className="content"><ScreenHeader active="Tasks" subtitle="Tasks support both list execution and board-style operational follow-up."><button>Saved view</button><button className="primary">New task</button></ScreenHeader><section className="panel"><div className="tabs"><button className="active">List view</button><button>Board view</button><button>My tasks</button><button>Overdue</button></div><div className="toolbar"><input placeholder="Filter tasks by owner, company, record or status…"/><button>Bulk update</button><button>Group by owner</button></div><Table columns={['Task','Company','Record','Owner','Priority','Due','Status']} rows={tasks}/></section><section className="panel"><div className="panelTitle"><h2>Kanban board snapshot</h2><span>Board view for execution without losing list precision</span></div><div className="kanban">{['To do','In progress','Blocked'].map(status=><div className="kanbanCol" key={status}><h3>{status}</h3>{board.filter(card=>card[0]===status).map(card=><article className="taskCard" key={card[1]}><strong>{card[1]}</strong><span>{card[2]} · {card[3]}</span><Badge tone={card[4]}>{card[4]}</Badge></article>)}</div>)}</div></section></main>;
}

function ReportsScreen(){
  return <main className="content"><ScreenHeader active="Reports" subtitle="Reports center for templates, schedules, generated reports, governance and exports."><button>Schedule report</button><button className="primary">Generate report</button></ScreenHeader><section className="split"><article className="panel wide"><div className="panelTitle"><h2>Report templates</h2><span>Operational, executive and governance-ready templates</span></div><Table columns={['Template','Type','Audience','Owner','Cadence','Status']} rows={reports}/></article><aside className="panel"><div className="panelTitle"><h2>Export center</h2><span>Controlled outputs with history</span></div><div className="actionStack"><button>Executive renewal brief</button><button>Governance evidence export</button><button>Client exposure CSV</button><button disabled aria-disabled="true">Export selected rows</button></div><div className="miniState loadingState" role="status"><span className="spinner"/>Report generation queued for executive renewal brief.</div><ErrorState title="Failed report generation" message="The governance export timed out. Retry generation or contact support with the report ID." /></aside></section><section className="panel"><div className="panelTitle"><h2>Scheduled and generated reports</h2><span>Recurring packs and recent outputs</span></div><Table columns={['Report','Schedule','Last generated','Recipients','Next run','Governance status']} rows={[["Monthly renewal exposure",'Monthly','May 1, 2026','Finance, Procurement','Jun 1, 2026','Approved'],['Board risk brief','Weekly','May 6, 2026','Executive team','May 13, 2026','Draft ready'],['Audit evidence package','On demand','Apr 28, 2026','Compliance','Not scheduled','Export logged']]}/></section></main>;
}

function DataImportScreen(){
  const steps = ['Upload file','Select module','Map columns','Validate fields','Detect duplicates','Fix errors','AI suggestions','Confirm','Summary'];
  return <main className="content"><ScreenHeader active="Data Import" subtitle="A full import workflow from file upload through validation, duplicate detection and confirmation."><button>Download template</button><button className="primary">Start import</button></ScreenHeader><section className="panel"><div className="panelTitle"><h2>Import history</h2><span>Landing page with recent jobs and operational status</span></div><Table columns={['Import','File','Rows','Duplicate prevention','Status']} rows={importRows}/></section><section className="panel"><div className="panelTitle"><h2>Import wizard</h2><span>Guided steps prevent bad data before records are created</span></div><div className="wizardSteps">{steps.map((step,i)=><div className={cx('wizardStep',i<3&&'done',i===3&&'active')} key={step}><strong>{i+1}</strong><span>{step}</span></div>)}</div><Table columns={['Validation area','Finding','AI suggestion','Action']} rows={[["Column mapping",'Expiration Date matched with 94% confidence','Map to expiration_date','Review mapping'],['Duplicates','12 vendors resemble existing catalog entries','Use Trend Micro existing vendor','Merge suggestions'],['Required fields','7 license rows missing owner','Assign María Chen based on company history','Apply suggestion']]}/><div className="miniState loadingState" role="status"><span className="spinner"/>Import processing: validating 1,248 rows before confirmation.</div><ErrorState title="Failed import" message="The uploaded workbook contains an invalid file format in one sheet. Retry with CSV/XLSX or open help." /><ValidationPanel /></section></main>;
}

function SettingsHealthBar(){
  return <div className="settingsHealthBar" role="status" aria-label="Configuration health">
    <span className="settingsHealthDot" aria-hidden="true" />
    <span className="settingsHealthText"><strong>Configuration health: 71%</strong> &nbsp;·&nbsp; 2 required-field gaps found</span>
    <button type="button" className="settingsHealthBtn">Review setup</button>
  </div>;
}

function Settings(){
  const [query, setQuery] = React.useState('');
  const [openedGroupId, setOpenedGroupId] = React.useState(null);
  const [workspaceMode, setWorkspaceMode] = React.useState('MSP / Integrator');
  const [modules, setModules] = React.useState({
    'Expirations': true, 'Licenses': true, 'Contracts': true,
    'Documents': true, 'Tasks': true, 'Reports': true,
    'Data Import': true, 'Vendors / Providers': true, 'Assets / Hardware': false
  });
  const toggleModule = function(name){ setModules(function(prev){ var next = {}; Object.keys(prev).forEach(function(k){ next[k] = prev[k]; }); next[name] = !prev[name]; return next; }); };
  const normalized = query.trim().toLowerCase();
  const filteredGroups = settingsAdminGroups.map(function(group){
    return {
      id: group.id, label: group.label, description: group.description,
      items: group.items.filter(function(item){
        return !normalized || (group.label + ' ' + item[0] + ' ' + item[1]).toLowerCase().includes(normalized);
      })
    };
  }).filter(function(group){
    return !normalized || group.items.length > 0 || group.label.toLowerCase().includes(normalized);
  });
  const openedGroup = openedGroupId ? settingsAdminGroups.find(function(g){ return g.id === openedGroupId; }) : null;

  return <main className="content settingsPage settingsDirectoryPage">
    <ScreenHeader active="Settings" subtitle="Manage workspace, access, data, automation, AI and governance." />
    {!openedGroup && <div className="settingsHub">
      <div className="settingsHubRow">
        <SettingsHealthBar />
        <input
          className="settingsSearchInput"
          value={query}
          onChange={function(e){ setQuery(e.target.value); }}
          placeholder="Search settings..."
          aria-label="Search settings"
        />
      </div>
      {filteredGroups.length === 0
        ? <p className="settingsNoResults">No matching settings found.</p>
        : <div className="settingsGroupGrid">
            {filteredGroups.map(function(group){
              return <article className="settingsDirectoryGroup" key={group.id}>
                <h3 className="settingsGroupLabel">{group.label}</h3>
                <ul className="settingsItemList" role="list">
                  {group.items.map(function(item){
                    var name = item[0];
                    return <li key={name}>
                      <button type="button" className="settingsItemLink" onClick={function(){ setOpenedGroupId(group.id); }}>
                        {name}
                      </button>
                    </li>;
                  })}
                </ul>
              </article>;
            })}
          </div>
      }
    </div>}
    {openedGroup && <div className="settingsDetailWorkspace" aria-live="polite">
      <button className="settingsBackButton" type="button" onClick={function(){ setOpenedGroupId(null); }}>← Back to Settings</button>
      {openedGroup.id === 'ai-operator'
        ? <AiSettingsPanel />
        : <SettingsGroupPanel
            group={openedGroup}
            workspaceMode={workspaceMode}
            setWorkspaceMode={setWorkspaceMode}
            modules={modules}
            toggleModule={toggleModule}
          />
      }
    </div>}
  </main>;
}

function SettingsGroupPanel({ group, workspaceMode, setWorkspaceMode, modules, toggleModule }){
  var isCompany = group.id === 'company';
  var items = Array.isArray(group.items) ? group.items : [];
  return <div className="settingsDetailPanel settingsFocusedPanel">
    <div className="settingsDetailHeader">
      <span className="eyebrow">{group.label}</span>
      <h2>{group.label}</h2>
      <p>{group.description}</p>
    </div>
    {isCompany && <div className="settingsDetailSection">
      <p className="settingsSectionLabel">Workspace mode</p>
      <p className="settingsWorkspaceModeDesc">Controls entity labels, sidebar modules and operating model across the workspace.</p>
      <div className="workspaceModeSegment" role="group" aria-label="Select workspace mode">
        {['MSP / Integrator', 'Internal IT', 'Hybrid'].map(function(mode){
          return <button key={mode} type="button"
            className={workspaceMode === mode ? 'active' : ''}
            onClick={function(){ setWorkspaceMode(mode); }}
          >{mode}</button>;
        })}
      </div>
    </div>}
    <div className="settingsDetailSection">
      <p className="settingsSectionLabel">{isCompany ? 'Workspace settings' : 'Settings'}</p>
      <div className="settingsRows">
        {items.map(function(item){
          var name = item[0]; var desc = item[1]; var status = item[2]; var action = item[3];
          return <SettingsRow key={name} title={name} description={desc} status={status} action={action || 'Manage'} />;
        })}
      </div>
    </div>
    {isCompany && <div className="settingsDetailSection">
      <p className="settingsSectionLabel">Module enablement</p>
      <p className="settingsWorkspaceModeDesc">Enable or disable modules for this workspace. Disabled modules are hidden from all users.</p>
      <div className="settingsModuleGrid">
        {MODULE_LIST.map(function(entry){
          var name = entry[0]; var desc = entry[1];
          var isOn = modules[name] !== false;
          return <div key={name} className="settingsModuleRow">
            <div className="settingsModuleMeta">
              <strong className="settingsModuleName">{name}</strong>
              <span className="settingsModuleDesc">{desc}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isOn}
              aria-label={name + ': ' + (isOn ? 'enabled' : 'disabled')}
              className={cx('switchControl', isOn && 'isOn')}
              onClick={function(){ toggleModule(name); }}
            ><span /></button>
          </div>;
        })}
      </div>
    </div>}
  </div>;
}

function SettingsRow({ title, description, status, action }){
  return <div className="adminSettingRow">
    <div className="adminSettingCopy">
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
    <div className="adminSettingControl">
      <em>{status}</em>
      <button type="button">{action || 'Manage'}</button>
    </div>
  </div>;
}


const CONTEXTUAL_MICRO_MESSAGES = {
  Dashboard: [
    { text: 'I can help you prioritize today’s alerts.', action: 'Prioritize' },
    { text: 'Want me to summarize what needs attention?', action: 'Summarize' },
    { text: 'I found records missing owners. Want to review them?', action: 'Review' }
  ],
  'Data Import': [
    { text: 'Want me to guide you through uploading a spreadsheet?', action: 'Guide me' },
    { text: 'I can map columns and detect duplicates for you.', action: 'Map columns' },
    { text: 'Upload your Excel and I’ll help organize the data.', action: 'Start import' }
  ],
  Expirations: [
    { text: 'I can help you create a new expiration.', action: 'Create' },
    { text: 'Want me to find critical renewals?', action: 'Find risks' },
    { text: 'I can check which records are missing owners.', action: 'Check owners' }
  ],
  Licenses: [
    { text: 'I can help you register a new license.', action: 'Register' },
    { text: 'Want me to group licenses by brand or renewal date?', action: 'Group' },
    { text: 'I found high-risk renewals. Want to create follow-up tasks?', action: 'Create tasks' }
  ],
  Contracts: [
    { text: 'Upload a contract and I can extract key dates.', action: 'Extract dates' },
    { text: 'Want me to check auto-renewal risks?', action: 'Check risks' },
    { text: 'I can summarize obligations and renewal terms.', action: 'Summarize' }
  ],
  'Companies / Clients': [
    { text: 'Want a quick client summary?', action: 'Summarize' },
    { text: 'I can prepare a meeting brief for this company.', action: 'Prepare brief' },
    { text: 'I can show exposure, documents and pending tasks.', action: 'Show exposure' }
  ],
  Documents: [
    { text: 'Want me to summarize this document?', action: 'Summarize' },
    { text: 'I can extract dates and link this file to a record.', action: 'Extract' },
    { text: 'Need help finding missing documents?', action: 'Find gaps' }
  ],
  Tasks: [
    { text: 'Want me to prioritize your tasks?', action: 'Prioritize' },
    { text: 'I can create tasks from open alerts.', action: 'Create tasks' },
    { text: 'I can help you close overdue work.', action: 'Plan work' }
  ],
  Reports: [
    { text: 'Want me to generate an executive summary?', action: 'Generate' },
    { text: 'I can build a renewal exposure report.', action: 'Build report' },
    { text: 'I can prepare a board-ready brief.', action: 'Prepare brief' }
  ],
  Settings: [
    { text: 'Want help configuring notification rules?', action: 'Configure' },
    { text: 'I can suggest required fields for each category.', action: 'Suggest fields' },
    { text: 'I can help set up your workspace.', action: 'Set up' }
  ],
  Search: [
    { text: 'I found something relevant here.', action: 'Show me' },
    { text: 'Want me to narrow these results?', action: 'Refine' },
    { text: 'I can turn this search into next actions.', action: 'Create actions' }
  ],
  'Attention Center': [
    { text: 'Want me to triage these alerts?', action: 'Triage' },
    { text: 'I can separate urgent risk from routine reminders.', action: 'Sort' },
    { text: 'Need a quick plan for today’s blockers?', action: 'Plan' }
  ]
};

function getContextualTip(active, index = 0){
  const tips = CONTEXTUAL_MICRO_MESSAGES[active] || CONTEXTUAL_MICRO_MESSAGES.Dashboard;
  return tips[Math.abs(index) % tips.length];
}

function getAiContext(active){
  return AI_CONTEXTS[active] || AI_CONTEXTS.Dashboard;
}

function AiInsightCard({ active }){
  const context = getAiContext(active);
  const safeActions = Array.isArray(context.actions) ? context.actions.slice(0, 1) : [];
  return <aside className="panel aiInsightCard" aria-label={`${active} AI insight`}>
    <div className="aiInsightHeader"><span>AI insight</span><strong>{context.role || 'Context assistant'}</strong></div>
    <p>{context.result || 'Opriva AI can summarize risks, missing data and next actions for this screen.'}</p>
    <div className="compactActions">{safeActions.map(action => <button key={action}>{action}</button>)}</div>
  </aside>;
}

function AiInsightBar({ active }){
  const context = getAiContext(active);
  const safeActions = Array.isArray(context.actions) ? context.actions.slice(0, 2) : [];
  return <div className="aiInsightBar" aria-label={`${active} AI insight`}>
    <div className="aiInsightBarLeft">
      <span className="aiInsightBarLabel">AI insight</span>
      <p className="aiInsightBarText">{context.result || 'Opriva AI can summarize risks, missing data and next actions for this screen.'}</p>
    </div>
    <div className="aiInsightBarActions">
      {safeActions.map(action => <button key={action}>{action}</button>)}
    </div>
  </div>;
}

function AiOutput({ active }){
  const context = getAiContext(active);
  const findings = Array.isArray(context.findings) ? context.findings.slice(0,2) : [];
  const actions = Array.isArray(context.actions) ? context.actions.slice(0,2) : [];
  const sources = Array.isArray(context.sources) ? context.sources : [];
  return <section className="aiOutput" aria-label="Recent AI result">
    <span className="eyebrow">Recent result</span>
    <p>{context.result || 'No recent AI output for this screen.'}</p>
    <div className="aiMiniLists"><div><strong>Key findings</strong>{findings.map(f => <span key={f}>{f}</span>)}</div><div><strong>Recommended actions</strong>{actions.map(a => <span key={a}>{a}</span>)}</div></div>
    <div className="compactActions">{actions.map((action, index) => <button key={action} className={index === 0 ? 'primary' : ''}>{action}</button>)}</div>
    <p className="sourceLine">{sources.slice(0,3).join(' · ') || 'Current screen context'}</p>
  </section>;
}

function AiWorkflowWorkspace({ active }){
  const workflows = Array.isArray(AI_WORKFLOWS) ? AI_WORKFLOWS.slice(0,4) : [];
  return <section className="panel aiWorkspace" aria-label="AI workflow workspace">
    <div className="panelTitle"><div><h2>AI workflows</h2><span>Advanced workflows stay collapsed until users need them.</span></div><button>View history</button></div>
    <div className="aiWorkspaceInput"><input aria-label="Ask Opriva AI in workflow workspace" placeholder="Ask Opriva AI…"/><button className="primary">Start</button></div>
    <details className="workflowDetails"><summary>Recommended workflows</summary><div className="workflowGrid">{workflows.map(workflow => <button key={workflow}><strong>{workflow}</strong><span>Uses {active} context when relevant</span></button>)}</div></details>
  </section>;
}

function AiSettingsPanel(){
  const allowedActions = [
    ['Create tasks','Allow Opriva AI to prepare task suggestions for user approval.','Requires approval','toggle',true],
    ['Draft emails','Allow Opriva AI to draft follow-up messages without sending them automatically.','Draft only','toggle',true],
    ['Summarize documents','Allow Opriva AI to summarize uploaded files and extract key dates.','Enabled','toggle',true],
    ['Generate reports','Allow Opriva AI to prepare executive and operational summaries.','Enabled','toggle',true]
  ];
  const safety = [
    ['Require approval before actions','AI-created tasks, reports or drafts must be reviewed before being applied.','Required','toggle',true],
    ['Data access scope','Limit AI responses to records inside the current workspace.','Workspace records only','scope',true]
  ];
  const operator = [
    ['Living AI Operator','Allows the floating Opriva AI Operator to feel present with subtle animation.','Enabled','toggle',true],
    ['Eye follows cursor','Allows the green focus point to softly follow the cursor.','Enabled','toggle',true],
    ['Contextual helper messages','Shows short helpful messages based on the current screen.','Balanced','toggle',true],
    ['Activity level','Controls how proactive the assistant feels.','Balanced','segment',true]
  ];
  return <section className="aiSettingsPanel aiGovernancePanel" id="AI-Operator" aria-labelledby="ai-settings-title">
    <aside className="aiSettingsSummary">
      <span className="eyebrow">AI & Operator</span>
      <h2 id="ai-settings-title">AI Settings</h2>
      <p>Keep Opriva AI helpful, controlled and approval-first.</p>
      <div className="aiSafetyNote"><strong>Approval-first assistant</strong><span>Opriva AI can prepare work, summarize records and guide users while keeping final decisions with your team.</span></div>
    </aside>
    <div className="aiSettingsMain">
      <div className="aiSettingSection">
        <h3>Assistant availability</h3>
        <AiSettingRow title="Enable Opriva AI Assistant" description="Allows users to ask questions, summarize records and receive operational guidance." status="Enabled" enabled />
      </div>
      <div className="aiSettingSection">
        <h3>Allowed actions</h3>
        <div className="aiSettingStack">{allowedActions.map(([title, description, status, type, enabled]) => <AiSettingRow key={title} title={title} description={description} status={status} enabled={enabled} type={type} />)}</div>
      </div>
      <div className="aiSettingSection">
        <h3>Approval and safety</h3>
        <div className="aiSettingStack">{safety.map(([title, description, status, type, enabled]) => <AiSettingRow key={title} title={title} description={description} status={status} enabled={enabled} type={type} />)}</div>
      </div>
      <div className="aiSettingSection">
        <h3>AI Operator behavior</h3>
        <div className="aiSettingStack">{operator.map(([title, description, status, type, enabled]) => <AiSettingRow key={title} title={title} description={description} status={status} enabled={enabled} type={type} />)}</div>
      </div>
      <article className="aiInsightReadable">
        <div><span className="eyebrow">AI Insight</span><p>“Your workspace is configured safely. License and certificate categories should require owner, renewal date and evidence before records become active.”</p></div>
        <button type="button">Review policy</button>
      </article>
    </div>
  </section>;
}

function AiSettingRow({ title, description, status, enabled = false, type = 'toggle' }){
  return <div className="aiSettingRow">
    <div className="aiSettingCopy"><strong>{title}</strong><span>{description}</span></div>
    <div className="aiSettingControl"><em>{status}</em>{type === 'scope' ? <button className="scopePill" type="button">Workspace records only</button> : type === 'segment' ? <div className="activitySegment" role="group" aria-label="Activity level"><button type="button">Quiet</button><button className="active" type="button">Balanced</button><button type="button">Proactive</button></div> : <button className={cx('switchControl', enabled && 'isOn')} type="button" role="switch" aria-checked={enabled} aria-label={`${title}: ${enabled ? 'enabled' : 'disabled'}`}><span /></button>}</div>
  </div>;
}

function prefersReducedMotion(){
  return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function OprivaAgentLogo({ interactive = true, mode = 'idle' }){
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const handleMove = event => {
    if (!interactive || prefersReducedMotion()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
    const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
    setPos({ x: Math.max(-5, Math.min(5, nx)), y: Math.max(-5, Math.min(5, ny)) });
  };
  return <span className={cx('oprivaAgentLogo', `logo-${mode}`)} onPointerMove={handleMove} onPointerLeave={() => setPos({ x: 0, y: 0 })} aria-hidden="true">
    <span className="agentOrbit" />
    <span className="agentDot" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }} />
  </span>;
}

function FloatingAgentButton({ active, isOpen, onClick, settings }){
  const [mode, setMode] = React.useState('idle');
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [tip, setTip] = React.useState(null);
  const [tipIndex, setTipIndex] = React.useState(0);
  const [ignoredCount, setIgnoredCount] = React.useState(0);
  const [dismissedKey, setDismissedKey] = React.useState('');
  const reduced = Boolean(settings.reduceMotion || prefersReducedMotion());
  const living = settings.livingAgent && !settings.muteAssistant && !reduced;
  const activity = settings.activityLevel || 'Balanced';
  const assistiveScreens = ['Dashboard', 'Attention Center', 'Expirations', 'Tasks', 'Data Import'];
  const isTyping = () => {
    const el = document.activeElement;
    return Boolean(el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
  };

  React.useEffect(() => {
    setTip(null);
    setTipIndex(index => index + 1);
  }, [active]);

  React.useEffect(() => {
    if (settings.muteAssistant) { setMode('muted'); setTip(null); return; }
    if (isOpen) { setMode('working'); setTip(null); return; }
    const baseMode = assistiveScreens.includes(active) && settings.proactiveSuggestions ? 'assistive' : 'idle';
    setMode(living ? baseMode : 'muted');
    if (!living || !settings.proactiveSuggestions || activity === 'Quiet') return;
    const delay = activity === 'Proactive' ? 3600 : 6200 + ignoredCount * 2600;
    const timer = window.setTimeout(() => {
      if (isTyping()) return;
      const nextTip = getContextualTip(active, tipIndex + ignoredCount);
      const key = `${active}-${nextTip.text}`;
      if (key === dismissedKey) return;
      setMode(baseMode === 'assistive' ? 'assistive' : 'curious');
      setTip({ ...nextTip, key });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [active, isOpen, living, settings.muteAssistant, settings.proactiveSuggestions, activity, ignoredCount, dismissedKey, tipIndex]);

  React.useEffect(() => {
    if (!tip) return;
    const timer = window.setTimeout(() => {
      setTip(null);
      setIgnoredCount(count => Math.min(3, count + 1));
    }, activity === 'Proactive' ? 6200 : 5000);
    return () => window.clearTimeout(timer);
  }, [tip, activity]);

  React.useEffect(() => {
    if (!living || !settings.allowCursorFollow) { setOffset({ x: 0, y: 0 }); return; }
    let lastMove = 0;
    let returnTimer;
    const handlePointer = event => {
      const now = Date.now();
      if (isTyping() || now - lastMove < 2800) return;
      lastMove = now;
      const homeX = window.innerWidth - 52;
      const homeY = window.innerHeight - 52;
      const dx = Math.max(-14, Math.min(10, (event.clientX - homeX) * 0.035));
      const dy = Math.max(-14, Math.min(10, (event.clientY - homeY) * 0.035));
      setOffset({ x: dx, y: dy });
      window.clearTimeout(returnTimer);
      returnTimer = window.setTimeout(() => setOffset({ x: 0, y: 0 }), 1100);
    };
    window.addEventListener('pointermove', handlePointer, { passive: true });
    return () => { window.removeEventListener('pointermove', handlePointer); window.clearTimeout(returnTimer); };
  }, [living, settings.allowCursorFollow]);

  const closeTip = () => {
    if (tip && tip.key) setDismissedKey(tip.key);
    setTip(null);
    setIgnoredCount(count => Math.min(3, count + 1));
  };
  const useTip = () => {
    setTip(null);
    setIgnoredCount(0);
    onClick();
  };
  return <div className="floatingAgentWrap" style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
    {tip && !settings.muteAssistant && <div className={cx('agentNudge', mode)} role="status" aria-live="polite">
      <p>{tip.text}</p>
      <div><button type="button" onClick={useTip}>{tip.action || 'Help me'}</button><button type="button" aria-label="Dismiss Opriva AI tip" onClick={closeTip}>×</button></div>
    </div>}
    <button className={cx('floatingAgentBtn', mode, living && 'living')} type="button" aria-label="Open Opriva AI Assistant" data-tooltip="Open Opriva AI" onClick={onClick}>
      <OprivaAgentLogo interactive={living && settings.allowCursorFollow} mode={mode} />
      <span>Opriva Agent</span>
    </button>
  </div>;
}

function AgentBehaviorControls({ settings, onChange }){
  const controls = [
    ['livingAgent', 'Enable living AI Operator'],
    ['proactiveSuggestions', 'Show contextual tips'],
    ['allowCursorFollow', 'Allow soft cursor follow'],
    ['reduceMotion', 'Reduce motion'],
    ['muteAssistant', 'Mute assistant for this session']
  ];
  return <details className="agentControls"><summary>AI Operator behavior</summary>{controls.map(([key,label]) => <label key={key}><span>{label}</span><input type="checkbox" checked={Boolean(settings[key])} onChange={event => onChange(key, event.target.checked)} /></label>)}<label className="selectSetting"><span>Activity level</span><select value={settings.activityLevel || 'Balanced'} onChange={event => onChange('activityLevel', event.target.value)}><option>Quiet</option><option>Balanced</option><option>Proactive</option></select></label></details>;
}

function AiDrawer({ active, onClose, settings, onSettingChange }){
  const context = getAiContext(active);
  const metadata = String(context.metadata || '418 expirations · 74 open tasks · 41 missing documents').replace(/^Context:\s*/, '');
  const suggestions = ['What needs attention today?', 'Find missing owners', 'Draft follow-up email'];
  return <aside className="aiDrawer" aria-label="Opriva AI assistant">
    <header><div><span>Opriva AI</span><h2>Context: {active}</h2></div><button aria-label="Close Opriva AI assistant" onClick={onClose}>×</button></header>
    <p className="aiSubtitle">Ask about renewals, risks, missing data or next actions.</p>
    <div className="aiInputRow"><input aria-label="Ask Opriva AI" placeholder="Ask Opriva AI..."/><button className="primary">Ask</button></div>
    <div className="aiSuggestions" aria-label="Suggested Opriva AI actions">{suggestions.map(item => <button key={item}>{item}</button>)}</div>
    <button className="moreActions">More actions</button>
    <p className="contextMeta">{metadata}</p>
    <AgentBehaviorControls settings={settings} onChange={onSettingChange} />
  </aside>;
}

const aiStyles = `.floatingAgentBtn{position:fixed;right:24px;bottom:24px;z-index:80;width:var(--ocd-tweak-agent-button-size,56px);height:var(--ocd-tweak-agent-button-size,56px);border-radius:18px;padding:0;display:grid;place-items:center;background:#fff;border:1px solid #DCE6F0;box-shadow:0 16px 36px rgba(11,31,58,.14);color:#0F2138}.floatingAgentBtn>span:not(.oprivaAgentLogo){position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.floatingAgentBtn:hover{background:#fff;border-color:#CFE0F2;box-shadow:0 18px 40px rgba(11,31,58,.16);transform:translateY(-1px)}.floatingAgentBtn:focus-visible{outline:2px solid rgba(37,99,235,.24);outline-offset:3px}.oprivaAgentLogo{position:relative;width:34px;height:34px;display:block}.agentOrbit{position:absolute;inset:5px;border:2px solid #0D9488;border-right-color:transparent;border-radius:999px;transform:rotate(-24deg);transition:inset .18s ease,border-color .18s ease}.agentDot{position:absolute;left:13px;top:13px;width:8px;height:8px;border-radius:999px;background:#2563EB;box-shadow:0 0 0 4px rgba(37,99,235,.10);transition:width .18s ease,height .18s ease,box-shadow .18s ease,transform .16s ease}.floatingAgentBtn:hover .agentOrbit{inset:3px;border-color:#14B8A6;border-right-color:transparent}.floatingAgentBtn:hover .agentDot{width:10px;height:10px;box-shadow:0 0 0 7px rgba(45,212,191,.12)}.floatingAgentBtn:before{content:"";position:absolute;inset:7px;border-radius:15px;border:1px solid rgba(45,212,191,.16);opacity:0;transition:opacity .18s ease}.floatingAgentBtn:hover:before{opacity:1}.floatingAgentBtn:after{content:attr(data-tooltip);position:absolute;right:0;bottom:calc(100% + 10px);white-space:nowrap;background:#0B1F3A;color:#fff;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:650;box-shadow:0 12px 28px rgba(11,31,58,.18);opacity:0;transform:translateY(4px);pointer-events:none;transition:opacity .16s ease,transform .16s ease}.floatingAgentBtn:hover:after,.floatingAgentBtn:focus-visible:after{opacity:1;transform:translateY(0)}.aiInsightCard{align-self:start;border-color:#EEF2F7;background:#fff;box-shadow:0 8px 22px rgba(15,35,65,.03)}.aiInsightHeader{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px}.aiInsightHeader span,.eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:800}.aiInsightHeader strong{font-size:12px;color:#526174;font-weight:800}.aiInsightCard p{color:#475569;line-height:1.5;margin:0 0 10px;font-size:13px}.compactActions{display:flex;gap:8px;flex-wrap:wrap}.compactActions button{font-size:12px;padding:7px 10px;border-color:#E4EAF2;background:#fff;color:#40516A}.aiDrawer{position:fixed;right:18px;top:78px;width:min(356px,calc(100vw - 36px));max-height:calc(100vh - 102px);overflow:auto;background:#fff;border:1px solid #E2E8F0;border-radius:18px;box-shadow:0 18px 48px rgba(15,23,42,.13);z-index:70;padding:16px;display:flex;flex-direction:column;gap:12px;animation:drawerIn .18s ease-out}.aiDrawer header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #F1F5F9;padding-bottom:10px}.aiDrawer header span{font-size:12px;letter-spacing:0;text-transform:none;color:#0F2138;font-weight:850}.aiDrawer h2{margin:3px 0 0;font-size:13px;color:#64748b;font-weight:650}.aiDrawer header button{border-color:transparent;background:transparent;padding:4px 8px;color:#64748b}.aiSubtitle,.contextMeta,.sourceLine{font-size:12px;color:#64748b;margin:0;line-height:1.45}.aiInputRow{display:flex;gap:8px}.aiInputRow input,.aiWorkspaceInput input{flex:1;border:1px solid #DDE6F1;border-radius:11px;padding:10px 11px;background:#FAFCFF;outline:0}.aiSuggestions{display:grid;grid-template-columns:1fr;gap:7px}.aiSuggestions button,.workflowGrid button{justify-content:flex-start;text-align:left;background:#fff;border-color:#E7EDF5;color:#334155;font-weight:700}.moreActions{align-self:flex-start;background:transparent;border-color:transparent;color:#526174;padding:5px 0;font-size:13px}.moreActions:hover{background:transparent;color:#0F2138}.aiOutput{border:1px solid #EEF2F7;background:#fff;border-radius:13px;padding:12px}.aiOutput p{margin:5px 0 10px;line-height:1.45;font-size:13px;color:#334155}.aiMiniLists{display:grid;gap:8px;margin:8px 0}.aiMiniLists div{display:grid;gap:4px}.aiMiniLists strong{font-size:12px;color:#0F2138}.aiMiniLists span{font-size:12px;color:#64748b;line-height:1.35}.aiWorkspace{margin-top:18px}.aiWorkspaceInput{display:flex;gap:10px;margin:12px 0}.workflowDetails{border:1px solid #EEF2F7;border-radius:14px;padding:10px;background:#fff}.workflowDetails summary{cursor:pointer;font-weight:800;color:#334155}.workflowGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.workflowGrid button{display:flex;flex-direction:column;gap:4px;padding:10px}.workflowGrid span,.settingItem span{font-size:12px;color:#64748b}.aiSettingsPanel{margin-top:18px;border-top:1px solid #eef2f7;padding-top:18px}.aiSettingsPanel h3{margin:0 0 4px}.aiSettingsPanel p{margin:0 0 12px;color:#64748b}@keyframes drawerIn{from{opacity:.8;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}@media(max-width:980px){.workflowGrid,.settingsGrid{grid-template-columns:1fr}.split{grid-template-columns:1fr}.aiDrawer{left:18px;width:auto}}@media(prefers-reduced-motion:reduce){.floatingAgentBtn,.agentOrbit,.agentDot,.aiDrawer{animation:none!important;transition:none!important}.floatingAgentBtn:hover{transform:none}}`;


const livingAgentStyles = `.floatingAgentWrap{position:fixed;right:24px;bottom:24px;z-index:90;transition:transform .85s cubic-bezier(.2,.8,.2,1);pointer-events:none}.floatingAgentWrap .floatingAgentBtn{position:relative;right:auto;bottom:auto;z-index:91;width:56px;height:56px;border-radius:18px;pointer-events:auto;overflow:visible}.floatingAgentBtn.living{animation:agentFloat 5.8s ease-in-out infinite}.floatingAgentBtn.assistive{box-shadow:0 18px 42px rgba(13,148,136,.18),0 0 0 1px rgba(13,148,136,.10)}.floatingAgentBtn.working .agentOrbit{animation:agentThink 1.2s linear infinite}.floatingAgentBtn.muted{box-shadow:0 10px 24px rgba(11,31,58,.10);opacity:.92}.logo-assistive .agentDot{background:#0D9488;box-shadow:0 0 0 6px rgba(13,148,136,.12)}.logo-curious .agentOrbit{transform:rotate(-12deg);border-color:#2563EB;border-right-color:transparent}.logo-working .agentDot{background:#0B1F3A}.agentNudge{position:absolute;right:68px;bottom:7px;max-width:220px;background:#fff;color:#334155;border:1px solid #E2E8F0;border-radius:14px;padding:9px 11px;font-size:12px;font-weight:750;box-shadow:0 14px 34px rgba(11,31,58,.12);pointer-events:none;white-space:nowrap;animation:nudgeIn .22s ease-out}.agentNudge.assistive{color:#0F766E;border-color:#BFEFE6;background:#F8FFFD}.agentControls{border-top:1px solid #EEF2F7;padding-top:10px}.agentControls summary{cursor:pointer;font-size:12px;font-weight:850;color:#526174}.agentControls label{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:9px 0;font-size:12px;color:#526174}.agentControls input{accent-color:#2563EB}.toastStack{right:24px;bottom:98px;z-index:85}.aiDrawer{z-index:88}.aiDrawer .agentControls{margin-top:2px}@keyframes agentFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}@keyframes nudgeIn{from{opacity:0;transform:translateX(5px)}to{opacity:1;transform:translateX(0)}}@keyframes agentThink{to{transform:rotate(336deg)}}@media(max-width:720px){.floatingAgentWrap{right:18px;bottom:18px}.agentNudge{display:none}}@media(prefers-reduced-motion:reduce){.floatingAgentWrap,.floatingAgentBtn.living,.agentNudge,.floatingAgentBtn.working .agentOrbit{animation:none!important;transition:none!important;transform:none!important}}`;


/* --- Opriva visual upgrades preserved from the newer version, without touching page routing --- */
function OprivaProductMark(){
  return <span className="brandMark oprivaProductMark" aria-hidden="true">
    <svg viewBox="0 0 32 32" focusable="false">
      <path className="oprivaOpenContour" d="M22.9 8.1A11.3 11.3 0 1 0 23 23.8" />
      <circle className="oprivaFocusDot" cx="24.5" cy="16" r="2.65" />
    </svg>
  </span>;
}

function SidebarShell({ active, onSelect }){
  return <aside className="sidebar">
    <div className="brand" aria-label="Opriva product identity">
      <OprivaProductMark />
      <span className="brandCopy"><strong>Opriva</strong><span>IT Asset & Renewal Intelligence</span></span>
    </div>
    <nav>
      {SIDEBAR_GROUPS.map(group => <div className="navGroup" key={group.label}>
        <p>{group.label}</p>
        {group.items.map(item => <button key={item} className={active === item ? 'active' : ''} onClick={() => onSelect(item)} type="button">{item === 'Expirations' ? 'Assets & Renewals' : item}</button>)}
      </div>)}
    </nav>
  </aside>;
}

function TopbarShell({ active, onSearch, onAlerts }){
  return <header className="topbar">
    <button className="tenantLockup" type="button" aria-label="Open workspace menu">
      <span className="tenantLogo">B</span>
      <div><strong>Banisi Workspace</strong><span>{active || 'Dashboard'}</span></div>
    </button>
    <label className="globalSearch"><span aria-hidden="true">⌘K</span><input onFocus={onSearch} placeholder="Search records, renewals, documents..." aria-label="Global Search" /></label>
    <div className="topActions"><button type="button" onClick={onAlerts} aria-label="Open alerts">9 alerts</button><span className="avatar">MC</span></div>
  </header>;
}

function OprivaAgentMark({ eyeFollowsCursor = true, blinkSignal = 0 }){
  const iconRef = React.useRef(null);
  const contourRef = React.useRef(null);
  const dotRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const idleTimerRef = React.useRef(null);
  const blinkTimerRef = React.useRef(null);
  const motionRef = React.useRef({ x: 24.5, y: 16, angle: 0, targetAngle: 0, blink: 1, blinkTarget: 1, active: false });

  React.useEffect(() => {
    const center = 16;
    const radius = 8.45;
    const restAngle = 0;
    const ease = 0.12;
    const blinkEase = 0.34;
    const reduced = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    const setTargetFromAngle = angle => {
      const motion = motionRef.current;
      motion.targetAngle = angle;
      motion.active = true;
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        motion.active = false;
        motion.targetAngle = restAngle;
      }, 900);
    };

    const handleMouseMove = event => {
      if (!eyeFollowsCursor || reduced || !iconRef.current) return;
      const rect = iconRef.current.getBoundingClientRect();
      const iconCenterX = rect.left + rect.width / 2;
      const iconCenterY = rect.top + rect.height / 2;
      setTargetFromAngle(Math.atan2(event.clientY - iconCenterY, event.clientX - iconCenterX));
    };

    const returnToRest = () => {
      const motion = motionRef.current;
      motion.active = false;
      motion.targetAngle = restAngle;
    };

    const animate = () => {
      const motion = motionRef.current;
      const desiredAngle = eyeFollowsCursor && motion.active ? motion.targetAngle : restAngle;
      let delta = desiredAngle - motion.angle;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      motion.angle += delta * ease;
      motion.blink += (motion.blinkTarget - motion.blink) * blinkEase;

      const targetX = center + Math.cos(motion.angle) * radius;
      const targetY = center + Math.sin(motion.angle) * radius;
      motion.x += (targetX - motion.x) * ease;
      motion.y += (targetY - motion.y) * ease;

      if (dotRef.current) {
        dotRef.current.setAttribute('cx', motion.x.toFixed(2));
        dotRef.current.setAttribute('cy', motion.y.toFixed(2));
      }
      if (contourRef.current) {
        const degrees = motion.angle * 180 / Math.PI;
        const scaleY = Math.max(0.2, motion.blink);
        const centerOffset = 16 * (1 - scaleY);
        contourRef.current.setAttribute('transform', `rotate(${degrees.toFixed(2)} 16 16) translate(0 ${centerOffset.toFixed(2)}) scale(1 ${scaleY.toFixed(3)})`);
      }
      rafRef.current = window.requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', returnToRest);
    window.addEventListener('blur', returnToRest);
    rafRef.current = window.requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', returnToRest);
      window.removeEventListener('blur', returnToRest);
      window.clearTimeout(idleTimerRef.current);
      window.clearTimeout(blinkTimerRef.current);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, [eyeFollowsCursor]);

  const triggerBlink = () => {
    const motion = motionRef.current;
    motion.blinkTarget = 0.22;
    window.clearTimeout(blinkTimerRef.current);
    blinkTimerRef.current = window.setTimeout(() => { motion.blinkTarget = 1; }, 160);
  };

  React.useEffect(() => { if (blinkSignal > 0) triggerBlink(); }, [blinkSignal]);

  return <span className="agentMark" aria-hidden="true" ref={iconRef} onMouseEnter={triggerBlink}>
    <svg viewBox="0 0 32 32" className="agentMarkSvg" focusable="false">
      <g ref={contourRef}><path className="agentContour" d="M22.9 8.1A11.3 11.3 0 1 0 23 23.8" /></g>
      <circle ref={dotRef} className="agentFocusDot" cx="24.5" cy="16" r="2.7" />
    </svg>
  </span>;
}

function FloatingOprivaAgentButton({ isOpen, onClick, eyeFollowsCursor }){
  const [idleNudgeVisible, setIdleNudgeVisible] = React.useState(false);
  const [blinkSignal, setBlinkSignal] = React.useState(0);
  const inactivityTimerRef = React.useRef(null);

  React.useEffect(() => {
    const resetInactivity = () => {
      setIdleNudgeVisible(false);
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = window.setTimeout(() => {
        setIdleNudgeVisible(true);
        setBlinkSignal(value => value + 1);
      }, 8000);
    };
    resetInactivity();
    window.addEventListener('mousemove', resetInactivity, { passive: true });
    window.addEventListener('keydown', resetInactivity);
    window.addEventListener('pointerdown', resetInactivity, { passive: true });
    return () => {
      window.clearTimeout(inactivityTimerRef.current);
      window.removeEventListener('mousemove', resetInactivity);
      window.removeEventListener('keydown', resetInactivity);
      window.removeEventListener('pointerdown', resetInactivity);
    };
  }, []);

  return <div className="agentWrap">
    <span className={cx('agentTip', idleNudgeVisible && 'isVisible')} role="status">I’m here if you want help prioritizing renewals.</span>
    <button className="agentButton" onClick={onClick} aria-label="Open Opriva AI Assistant" title="Open Opriva AI" type="button">
      <OprivaAgentMark open={isOpen} eyeFollowsCursor={eyeFollowsCursor} blinkSignal={blinkSignal} />
    </button>
  </div>;
}

function OprivaDrawer({ active, onClose, eyeFollowsCursor, setEyeFollowsCursor }){
  const suggestions = ['What needs attention today?', 'Find missing owners', 'Draft follow-up email'];
  return <aside className="aiDrawer" aria-label="Opriva AI drawer">
    <div className="drawerHeader"><div><h2>Opriva AI</h2><p>Context: {active}</p></div><button onClick={onClose} type="button" aria-label="Close Opriva AI">×</button></div>
    <p className="drawerText">Ask about renewals, risks, missing data or next actions.</p>
    <input className="drawerInput" placeholder="Ask Opriva AI..." aria-label="Ask Opriva AI" />
    <div className="suggestions">{suggestions.map(item => <button key={item} type="button">{item}</button>)}</div>
    <div className="agentSettings" aria-label="Opriva AI Operator settings"><label><input type="checkbox" checked={eyeFollowsCursor} onChange={event => setEyeFollowsCursor(event.target.checked)} /><span>Eye follows cursor</span></label></div>
    <p className="meta">418 expirations · 74 open tasks · 41 missing documents</p>
  </aside>;
}


function AssetsRenewalsScreen(){
  const rows = [
    { record: 'Dell Support Contract', type: 'Contract', vendor: 'Dell', expiry: 'May 26, 2026', days: '12 days', value: '$42,800', owner: 'Unassigned', status: 'Critical', action: 'Assign owner' },
    { record: 'Microsoft 365 Renewal', type: 'License', vendor: 'Microsoft', expiry: 'Jun 1, 2026', days: '18 days', value: '$31,200', owner: 'Ana Ruiz', status: 'High', action: 'Prepare renewal' },
    { record: 'Fortinet Warranty', type: 'Warranty', vendor: 'Fortinet', expiry: 'Jun 7, 2026', days: '24 days', value: '$18,600', owner: 'Luis Mora', status: 'High', action: 'Request quote' },
    { record: 'SSL Wildcard Certificate', type: 'Certificate', vendor: 'DigiCert', expiry: 'May 23, 2026', days: '9 days', value: '$3,200', owner: 'Unassigned', status: 'Critical', action: 'Prepare renewal' },
    { record: 'Adobe Creative Cloud', type: 'SaaS', vendor: 'Adobe', expiry: 'Jun 11, 2026', days: '28 days', value: '$9,800', owner: 'Carlos Vega', status: 'Medium', action: 'Review usage' },
    { record: 'HPE Server Warranty', type: 'Warranty', vendor: 'HPE', expiry: 'Jul 18, 2026', days: '65 days', value: '$22,400', owner: 'Maria Chen', status: 'Medium', action: 'Schedule review' },
    { record: 'Veeam Backup Renewal', type: 'License', vendor: 'Veeam', expiry: 'Aug 4, 2026', days: '82 days', value: '$14,900', owner: 'Diego Paredes', status: 'Low', action: 'Monitor' }
  ];
  const tabs = ['All','Critical','30 days','60 days','Missing owner','Expired'];
  const filters = ['Type','Owner','Vendor','Status','Saved view: Operational risk'];
  return <main className="content assetsRenewalsPage">
    <ScreenHeader active="Assets & Renewals" eyebrow="RENEWAL WORKLIST" subtitle="Manage tracked assets, licenses, contracts, warranties, SaaS subscriptions and certificates by urgency, value and ownership."><button>Import records</button><button>Configure columns</button><button className="primary">New record</button></ScreenHeader>
    <div className="tabs assetsTabs" role="tablist" aria-label="Renewal worklist filters">{tabs.map((tab,index)=><button key={tab} className={index===0?'active':''}>{tab}</button>)}</div>
    <section className="panel renewalControlsPanel">
      <div className="toolbar assetsFilterRow"><input aria-label="Filter renewal records" placeholder="Filter by record, vendor, owner, type or status..." />{filters.map(filter=><button key={filter}>{filter}</button>)}</div>
    </section>
    <section className="panel aiInsightBar assetsInsightBar"><p><strong>AI Insight</strong> Opriva found 12 records entering a critical renewal window and 18 records without an assigned owner. Start by assigning owners to high-value records expiring in the next 30 days.</p><div className="compactActions"><button>Assign owners</button><button>Review critical</button><button>Prepare emails</button></div></section>
    <section className="panel renewalWorklistPanel"><div className="panelTitle"><h2>Renewal worklist</h2><span>All tracked records prioritized by expiry date, financial exposure and ownership gaps.</span></div><div className="tableWrap renewalWorklistWrap"><table className="renewalWorklistTable"><thead><tr>{['Record','Type','Vendor','Expiry date','Days left','Value','Owner','Status','Recommended action'].map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.record}><td className="renewalRecordCell"><strong>{row.record}</strong></td><td>{row.type}</td><td>{row.vendor}</td><td className="dateCell">{row.expiry}</td><td className="daysCell">{row.days}</td><td className="valueCell">{row.value}</td><td className="ownerCell">{row.owner==='Unassigned' ? <Badge tone="Warning">Unassigned</Badge> : row.owner}</td><td className="statusCell"><Badge tone={row.status}>{row.status}</Badge></td><td className="actionCell"><button type="button" className="rowAction">{row.action}</button></td></tr>)}</tbody></table></div></section>
  </main>;
}


const assetsRenewalsStyles = ``;

function App(){
  const [active, setActive] = React.useState('Dashboard');
  const [aiOpen, setAiOpen] = React.useState(false);
  const [eyeFollowsCursor, setEyeFollowsCursor] = React.useState(true);
  const route = active === 'Search' ? <SearchScreen/> : active === 'Dashboard' ? <Dashboard/> : active === 'Attention Center' ? <AttentionCenter/> : active === 'Companies / Clients' ? <CompaniesScreen/> : active === 'Settings' ? <Settings/> : active === 'Expirations' ? <AssetsRenewalsScreen/> : active === 'Licenses' ? <OperationalList active="Licenses" note="Brand, product, SKU, quantity, usage, renewal status and document links stay visible." tabs={['All','High risk','Under-used','Missing document','Renewal due']} columns={['License','Brand','Company','Quantity','Renewal','Amount','Owner','Risk']} rows={licenses}/> : active === 'Contracts' ? <ContractsScreen/> : active === 'Documents' ? <DocumentsScreen/> : active === 'Tasks' ? <TasksScreen/> : active === 'Reports' ? <ReportsScreen/> : active === 'Data Import' ? <DataImportScreen/> : <Dashboard/>;
  return <div className="app">
    <style>{styles + aiStyles + livingAgentStyles + oprivaUpgradeStyles + assetsRenewalsStyles + aiSettingsFixStyles + settingsAdminOverrideStyles + settingsDirectoryOverrideStyles}</style>
    <SidebarShell active={active} onSelect={setActive} />
    <section className="workspace"><TopbarShell active={active} onSearch={() => setActive('Search')} onAlerts={() => setActive('Attention Center')} />{route}</section>
    <FloatingOprivaAgentButton isOpen={aiOpen} onClick={() => setAiOpen(true)} eyeFollowsCursor={eyeFollowsCursor} />
    {aiOpen && <OprivaDrawer active={active} onClose={() => setAiOpen(false)} eyeFollowsCursor={eyeFollowsCursor} setEyeFollowsCursor={setEyeFollowsCursor} />}
    <ToastStack />
  </div>;
}

const aiSettingsFixStyles = `
.aiGovernancePanel{grid-column:1 / -1;display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);gap:22px;padding:22px;background:#fff;border:1px solid var(--border);border-radius:20px;box-shadow:0 12px 30px rgba(15,35,65,.045);align-items:start}.aiSettingsSummary{position:sticky;top:92px;display:grid;gap:12px;padding:2px 4px}.aiSettingsSummary h2{margin:0;color:#0B1F3A;font-size:24px;letter-spacing:-.03em}.aiSettingsSummary p{margin:0;color:#475569;line-height:1.55}.aiSafetyNote{border:1px solid #DDEFEA;background:#F6FEFC;border-radius:16px;padding:14px;display:grid;gap:5px}.aiSafetyNote strong{color:#0F3D39;font-size:14px}.aiSafetyNote span{color:#55706E;font-size:13px;line-height:1.45}.aiSettingsMain{display:grid;gap:16px;min-width:0}.aiSettingSection{border:1px solid #E6ECF3;background:#FBFCFE;border-radius:18px;padding:16px;display:grid;gap:12px}.aiSettingSection h3{margin:0;color:#132033;font-size:14px;letter-spacing:.01em}.aiSettingGrid{display:grid;grid-template-columns:repeat(2,minmax(280px,1fr));gap:10px}.aiSettingRow{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;border:1px solid #E4EBF3;background:#fff;border-radius:14px;padding:14px 14px 14px 16px}.aiSettingCopy{min-width:0;display:grid;gap:5px}.aiSettingCopy strong{color:#10223B;font-size:14px;line-height:1.25}.aiSettingCopy span{color:#66758A;font-size:13px;line-height:1.45;max-width:56ch}.aiSettingControl{display:flex;align-items:center;justify-content:flex-end;gap:10px;min-width:max-content}.aiSettingControl em{font-style:normal;white-space:nowrap;border:1px solid #CDEDE5;background:#F0FDFA;color:#0F766E;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:800}.switchControl{width:42px;height:24px;border-radius:999px;border:1px solid #CFE6E1;background:#E6F7F3;padding:2px;display:inline-flex;align-items:center;justify-content:flex-end;box-shadow:none}.switchControl span{width:18px;height:18px;border-radius:50%;background:#0D9488;display:block;box-shadow:0 1px 4px rgba(13,148,136,.24)}.switchControl:not(.isOn){justify-content:flex-start;background:#F1F5F9;border-color:#CBD5E1}.switchControl:not(.isOn) span{background:#94A3B8}.scopePill{height:30px;border-radius:999px;border-color:#DDEFEA;background:#F8FFFD;color:#0F766E;padding:0 10px;font-size:12px;white-space:nowrap}.aiInsightReadable{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;border:1px solid #DDEFEA;background:linear-gradient(180deg,#FFFFFF,#F8FEFC);border-radius:18px;padding:16px}.aiInsightReadable p{margin:6px 0 0;color:#334155;line-height:1.55}.aiInsightReadable button{white-space:nowrap;border-color:#CDEDE5;color:#0F766E;background:#fff}.eyebrow{color:#0D9488;text-transform:uppercase;letter-spacing:.13em;font-size:11px;font-weight:900}@media(max-width:1180px){.aiGovernancePanel{grid-template-columns:1fr}.aiSettingsSummary{position:static}.aiSettingGrid{grid-template-columns:1fr}}@media(max-width:720px){.aiSettingRow,.aiInsightReadable{grid-template-columns:1fr}.aiSettingControl{justify-content:space-between;min-width:0}.aiSettingControl em{white-space:normal}.scopePill{white-space:normal;height:auto;min-height:30px}}
`;


const settingsAdminOverrideStyles = `
  .settingsPage{gap:18px;padding-bottom:40px}.settingsAdminShell{display:grid;grid-template-columns:minmax(260px,292px) minmax(0,1fr);gap:22px;align-items:start}.settingsAdminNav{position:sticky;top:88px;max-height:calc(100vh - 112px);overflow:auto;background:#fff;border:1px solid var(--border);border-radius:20px;padding:14px;box-shadow:0 12px 30px rgba(15,35,65,.045);align-self:start}.settingsAdminSearch{display:grid;gap:7px;margin-bottom:14px}.settingsAdminSearch span{font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:900;color:#64748B}.settingsAdminSearch input{width:100%;border:1px solid #DDE6F1;border-radius:12px;background:#FAFCFF;padding:11px 12px;outline:0;color:#10223B}.settingsAdminSearch input:focus{border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,.1)}.settingsNavGroups{display:grid;gap:16px}.settingsNavGroup{display:grid;gap:4px}.settingsNavGroup p{margin:0 0 3px;color:#0B1F3A;font-size:12px;font-weight:850;letter-spacing:.02em}.settingsNavGroup button{width:100%;text-align:left;border:0;background:transparent;color:#64748B;border-radius:10px;padding:8px 10px;font-size:13px;font-weight:700;box-shadow:none}.settingsNavGroup button:hover{background:#F8FAFC;color:#10223B}.settingsNavGroup button.active{background:#EDF7F6;color:#0F766E;box-shadow:inset 3px 0 0 #0D9488}.settingsNoResults{margin:0;color:#64748B;font-size:13px;line-height:1.45}.settingsAdminContent{min-width:0;display:block}.settingsDetailPanel{background:#fff;border:1px solid var(--border);border-radius:22px;padding:22px;box-shadow:0 12px 30px rgba(15,35,65,.045);min-width:0}.settingsDetailHeader{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding-bottom:18px;border-bottom:1px solid #EEF2F7}.settingsDetailHeader h2{margin:4px 0 0;color:#0B1F3A;font-size:26px;letter-spacing:-.035em}.settingsDetailHeader p{margin:7px 0 0;color:#64748B;line-height:1.55;max-width:680px}.settingsRows{display:grid;gap:10px;margin-top:16px}.adminSettingRow,.aiSettingRow{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;border:1px solid #E4EBF3;background:#fff;border-radius:15px;padding:15px 15px 15px 17px}.adminSettingRow:hover,.aiSettingRow:hover{border-color:#DCE6F1;background:#FCFDFE}.adminSettingCopy,.aiSettingCopy{min-width:0;display:grid;gap:5px}.adminSettingCopy strong,.aiSettingCopy strong{color:#10223B;font-size:14px;line-height:1.25}.adminSettingCopy span,.aiSettingCopy span{color:#66758A;font-size:13px;line-height:1.45;max-width:70ch}.adminSettingControl,.aiSettingControl{display:flex;align-items:center;justify-content:flex-end;gap:10px;min-width:max-content}.adminSettingControl em,.aiSettingControl em{font-style:normal;white-space:nowrap;border:1px solid #CDEDE5;background:#F0FDFA;color:#0F766E;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:850}.adminSettingControl button{height:32px;border-radius:10px;background:#F8FAFC;color:#334155;padding:0 11px}.aiGovernancePanel{grid-column:auto;display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);gap:22px;padding:22px;background:#fff;border:1px solid var(--border);border-radius:22px;box-shadow:0 12px 30px rgba(15,35,65,.045);align-items:start;min-width:0}.aiSettingsSummary{position:sticky;top:104px;display:grid;gap:12px;padding:2px 4px}.aiSettingsSummary h2{font-size:26px;letter-spacing:-.035em}.aiSettingsMain{display:grid;gap:16px;min-width:0}.aiSettingGrid{display:grid;grid-template-columns:1fr;gap:10px}.aiSettingStack{display:grid;gap:10px}.activitySegment{display:flex;align-items:center;border:1px solid #DDE6F1;border-radius:999px;background:#F8FAFC;padding:2px}.activitySegment button{height:26px;border:0;background:transparent;border-radius:999px;padding:0 9px;font-size:12px;color:#64748B;box-shadow:none}.activitySegment button.active{background:#fff;color:#0F766E;box-shadow:0 1px 4px rgba(15,35,65,.08)}.aiInsightReadable p{max-width:82ch}@media(max-width:1180px){.settingsAdminShell{grid-template-columns:1fr}.settingsAdminNav,.aiSettingsSummary{position:static;max-height:none}.settingsNavGroups{grid-template-columns:repeat(2,minmax(0,1fr))}.aiGovernancePanel{grid-template-columns:1fr}}@media(max-width:720px){.settingsNavGroups{grid-template-columns:1fr}.settingsDetailHeader,.adminSettingRow,.aiSettingRow,.aiInsightReadable{grid-template-columns:1fr;display:grid}.adminSettingControl,.aiSettingControl{justify-content:space-between;min-width:0;flex-wrap:wrap}.adminSettingControl em,.aiSettingControl em{white-space:normal}.scopePill{white-space:normal;height:auto;min-height:30px}.activitySegment{width:100%;justify-content:space-between}.activitySegment button{flex:1}.settingsAdminShell{gap:14px}.settingsDetailPanel,.aiGovernancePanel{padding:16px}}
`;

const styles = `
:root{--accent:var(--ocd-tweak-accent-color,#2563EB);--density:var(--ocd-tweak-panel-density,1);--risk:var(--ocd-tweak-risk-emphasis,1);--navy:#0B1F3A;--bg:#F7F9FC;--card:#FFFFFF;--text:#111827;--muted:#6B7280;--border:#E5E7EB;--teal:#0D9488}*{box-sizing:border-box}body{margin:0;background:var(--bg);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text)}button,input{font:inherit}button{border:1px solid var(--border);background:#fff;color:#243247;border-radius:10px;padding:9px 12px;font-weight:700;cursor:pointer}button:hover{border-color:#D6DEE9;background:#FAFCFF;box-shadow:0 1px 4px rgba(15,35,65,.025)}.app{min-height:100vh;display:grid;grid-template-columns:264px 1fr}.sidebar{background:var(--navy);color:#DDE8F7;padding:18px 14px;display:flex;flex-direction:column;gap:22px}.brand{display:flex;gap:12px;align-items:center;padding:8px 8px 14px;border-bottom:1px solid rgba(255,255,255,.12)}.mark{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#2DD4BF,#2563EB);display:grid;place-items:center;color:white;font-weight:900}.brand strong{display:block;letter-spacing:.14em;font-size:13px}.brand span{display:block;color:#8EA2BC;font-size:12px;margin-top:2px}.navGroup{display:grid;gap:5px;margin-bottom:18px}.navGroup p{margin:0 8px 6px;color:#8EA2BC;font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:850}.navGroup button{width:100%;text-align:left;background:transparent;border-color:transparent;color:#C9D6E6;border-radius:10px;padding:9px 10px;font-size:14px}.navGroup button:hover{background:rgba(255,255,255,.055);color:#F8FAFC;border-color:transparent}.navGroup button.active{background:rgba(255,255,255,.085);color:#fff;border-color:rgba(255,255,255,.055)}.workspace{min-width:0;display:flex;flex-direction:column}.topbar{height:64px;background:rgba(255,255,255,.86);backdrop-filter:blur(14px);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;padding:0 22px;position:sticky;top:0;z-index:10}.topbar div:first-child{margin-right:auto}.topbar span{display:block;color:var(--muted);font-size:12px}.topbar strong{font-size:14px}.topSearch{min-width:260px;text-align:left;color:#6B7280;background:#F8FAFC}.alertBtn{background:#FFF7ED;border-color:#FED7AA;color:#9A3412}.aiBtn{background:#F7FAFF;border-color:#D8E6FB;color:#1E4FB8}.avatar{width:32px;height:32px;border-radius:999px;background:#EAF2FF;color:#1D4ED8;display:inline-grid;place-items:center;font-size:12px;font-weight:900}.content{padding:28px;display:grid;gap:18px}.screenHeader{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.screenHeader p{margin:0 0 6px;color:var(--teal);text-transform:uppercase;font-size:11px;letter-spacing:.14em;font-weight:900}.screenHeader h1{margin:0;color:#0F2138;font-size:clamp(26px,3vw,38px);letter-spacing:-.045em}.screenHeader span{display:block;margin-top:6px;color:#66758A;max-width:720px}.headerActions{display:flex;gap:10px}.primary{background:var(--accent);border-color:var(--accent);color:#fff}.statsGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.statCard,.panel,.settingsSearch,.settingsGroup{background:var(--card);border:1px solid var(--border);border-radius:18px;box-shadow:0 12px 30px rgba(15,35,65,.045)}.statCard{padding:18px}.statCard span{color:#66758A;font-size:13px}.statCard strong{display:block;margin:8px 0 3px;font-size:28px;letter-spacing:-.04em;color:#10223B}.statCard p{margin:0;color:#7B8797;font-size:13px}.split{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(280px,.7fr);gap:16px}.panel{padding:calc(var(--density)*18px);min-width:0}.panelTitle{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;margin-bottom:14px}.panelTitle h2{margin:0;color:#132033;font-size:17px}.panelTitle span{color:#75849A;font-size:13px}.tableWrap{overflow:auto;border:1px solid #EEF2F7;border-radius:14px}table{width:100%;border-collapse:collapse;min-width:760px;background:white}th,td{text-align:left;padding:13px 14px;border-bottom:1px solid #EEF2F7;font-size:13.5px;vertical-align:middle}th{background:#FAFCFF;color:#66758A;font-size:11px;text-transform:uppercase;letter-spacing:.1em}tr:last-child td{border-bottom:0}.badge{display:inline-flex;align-items:center;white-space:nowrap;border-radius:999px;padding:4px 8px;font-size:12px;font-weight:800;border:1px solid #DDE6F1;color:#40516A;background:#F8FAFC}.badge.critical{background:#FEF2F2;color:#B91C1C;border-color:#FECACA;box-shadow:0 0 0 calc((var(--risk) - 1)*2px) rgba(220,38,38,.12)}.badge.high{background:#FFF7ED;color:#C2410C;border-color:#FED7AA}.badge.medium{background:#FEFCE8;color:#A16207;border-color:#FDE68A}.badge.review{background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE}.badge.low{background:#F0FDF4;color:#15803D;border-color:#BBF7D0}.insight{line-height:1.55;color:#40516A}.searchHero,.settingsSearch{display:flex;gap:12px;align-items:center;padding:14px}.searchHero input,.settingsSearch input{width:100%;border:1px solid #DDE6F1;border-radius:12px;padding:12px 13px;outline:0;background:#FAFCFF}.tabs{display:flex;gap:8px;border-bottom:1px solid var(--border);padding-bottom:10px}.tabs button{background:transparent}.tabs .active{background:#F7FAFF;border-color:#D8E6FB;color:#1E4FB8}.settingsPage{gap:20px}.settingsSearch{justify-content:space-between}.settingsSearch strong{display:block;color:#10223B}.settingsSearch span{display:block;color:#66758A;font-size:13px;margin-top:3px}.settingsSearch input{max-width:360px}.settingsLayout{display:grid;grid-template-columns:220px 1fr;gap:18px;align-items:start}.settingsNav{position:sticky;top:84px;background:#fff;border:1px solid var(--border);border-radius:16px;padding:10px;display:grid;gap:4px}.settingsNav a{text-decoration:none;color:#526174;padding:9px 10px;border-radius:10px;font-weight:750;font-size:14px}.settingsNav a:hover{background:#F8FAFC;color:#0F2138}.settingsGroups{display:grid;gap:18px}.settingsGroup{padding:20px}.settingsGroup.important{border-color:#A7F3D0;box-shadow:0 14px 36px rgba(13,148,136,.08)}.settingsGroupHeader{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px}.settingsGroup h2{margin:0;color:#10223B;font-size:20px;letter-spacing:-.025em}.settingsGroup p{margin:5px 0 0;color:#66758A;line-height:1.45}.settingsGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.settingItem{height:auto;min-height:86px;display:flex;justify-content:space-between;align-items:flex-start;gap:14px;text-align:left;border-radius:14px;padding:14px;background:#fff}.settingItem strong{display:block;color:#132033}.settingItem span{display:block;margin-top:5px;color:#66758A;font-weight:500;line-height:1.35}.settingItem em{font-style:normal;color:#526174;background:#F8FAFC;border:1px solid #EEF2F7;border-radius:999px;padding:4px 8px;font-size:12px;white-space:nowrap}.moduleEnablement{margin-top:12px;border:1px dashed #99F6E4;background:#F0FDFA;border-radius:14px;padding:14px;display:flex;justify-content:space-between;gap:16px;align-items:center}.moduleEnablement h3{margin:0;color:#134E4A;font-size:15px}.moduleEnablement p{margin:4px 0 0;color:#0F766E;font-size:13px}.modulePills{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.aiDrawer{position:fixed;right:14px;top:78px;bottom:14px;width:min(380px,calc(100vw - 28px));background:white;border:1px solid #DDE6F1;border-radius:20px;box-shadow:0 24px 80px rgba(11,31,58,.22);z-index:40;padding:18px;display:grid;align-content:start;gap:14px}.aiDrawer header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.aiDrawer header span{font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:900;color:#0D9488}.aiDrawer h2{margin:4px 0 0}.aiDrawer p{margin:0;color:#526174;line-height:1.5}.toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:12px 0 14px}.toolbar input{min-width:min(360px,100%);flex:1;border:1px solid #DDE6F1;border-radius:12px;padding:11px 12px;background:#FAFCFF;outline:0}.actionStack{display:grid;gap:10px}.actionStack button{text-align:left}.kanban{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.kanbanCol{border:1px solid #EEF2F7;background:#FAFCFF;border-radius:16px;padding:12px;display:grid;gap:10px;align-content:start}.kanbanCol h3{margin:0;font-size:13px;color:#526174;text-transform:uppercase;letter-spacing:.08em}.taskCard{background:white;border:1px solid #E7EDF5;border-radius:14px;padding:12px;display:grid;gap:8px}.taskCard strong{font-size:14px;color:#132033}.taskCard span{color:#66758A;font-size:12px}.wizardSteps{display:grid;grid-template-columns:repeat(9,minmax(96px,1fr));gap:8px;overflow:auto;padding-bottom:4px;margin-bottom:14px}.wizardStep{border:1px solid #E7EDF5;background:#fff;border-radius:14px;padding:10px;display:grid;gap:6px;min-height:76px}.wizardStep strong{width:24px;height:24px;border-radius:999px;display:grid;place-items:center;background:#EEF2F7;color:#526174;font-size:12px}.wizardStep span{font-size:12px;font-weight:800;color:#526174}.wizardStep.done strong{background:#DCFCE7;color:#15803D}.wizardStep.active{border-color:#BFDBFE;background:#EFF6FF}.wizardStep.active strong{background:#2563EB;color:white}a:focus-visible,button:focus-visible,input:focus-visible,.settingItem:focus-visible,.wizardStep:focus-visible{outline:2px solid rgba(37,99,235,.18);outline-offset:2px;box-shadow:none}button:active{transform:translateY(1px)}button:disabled,button[aria-disabled="true"]{cursor:not-allowed;opacity:.52;background:#F3F6FA;color:#8A97A8;border-color:#E1E8F0;box-shadow:none;transform:none}.statCard,.panel,.settingItem,.taskCard,.wizardStep,.settingsNav a,.actionStack button{transition:border-color .16s ease,box-shadow .16s ease,background .16s ease,transform .16s ease}.statCard:hover,.panel:hover,.settingItem:hover,.taskCard:hover,.wizardStep:hover,.actionStack button:hover{border-color:#E0E7F0;box-shadow:0 4px 14px rgba(15,35,65,.035);transform:none;background:#fff}tbody tr{transition:background .14s ease}tbody tr:hover td{background:#FAFBFD}.selectedRow td{background:#F8FBFF!important}.selectedRow td:first-child{box-shadow:inset 2px 0 0 #DBEAFE}.rowAction{padding:6px 9px;font-size:12px;border-radius:8px;background:#F8FAFC}.rowAction:hover{background:#F3F6FA;border-color:#E1E8F0;color:#334155}.rowAction:focus-visible{background:#F8FBFF;border-color:#C9D7EA;color:#1E4FB8}.stateBox{border:1px solid #DDE6F1;border-radius:14px;background:#FAFCFF;padding:14px;display:grid;gap:8px;color:#40516A}.stateBox strong{color:#132033}.stateBox span{font-size:13px;line-height:1.45}.emptyState{background:#F8FAFC}.errorState{background:#FFF7F7;border-color:#FECACA}.errorState strong{color:#B91C1C}.errorState div{display:flex;gap:8px;flex-wrap:wrap}.ghostBtn{background:transparent}.skeletonRow td{background:#fff}.skeletonLine{display:block;width:100%;max-width:180px;height:12px;border-radius:999px;background:linear-gradient(90deg,#EEF2F7,#F8FAFC,#EEF2F7);background-size:200% 100%;animation:pulse 1.2s ease-in-out infinite}.miniState{display:flex;align-items:center;gap:9px;border:1px solid #DDE6F1;background:#F8FAFC;border-radius:12px;padding:10px 12px;color:#526174;font-size:13px}.loadingState{border-color:#BFDBFE;background:#EFF6FF;color:#1D4ED8}.spinner{width:14px;height:14px;border-radius:50%;border:2px solid rgba(37,99,235,.24);border-top-color:#2563EB;animation:spin .8s linear infinite}.validationPanel{border:1px solid #FDE68A;background:#FFFBEB;border-radius:16px;padding:14px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.validationPanel div{background:#fff;border:1px solid #FDE68A;border-radius:12px;padding:10px}.validationPanel strong{display:block;color:#92400E;font-size:13px}.validationPanel span{display:block;color:#785E1E;font-size:12px;margin-top:3px}.toastStack{position:fixed;right:24px;bottom:96px;display:grid;gap:8px;z-index:75;pointer-events:none}.toast{background:#0B1F3A;color:white;border:1px solid rgba(255,255,255,.12);box-shadow:0 16px 40px rgba(11,31,58,.22);border-radius:12px;padding:10px 12px;font-size:13px;font-weight:750;animation:toastOut 4s ease forwards}.errorToast{background:#7F1D1D}@keyframes toastOut{0%,78%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(8px)}}@keyframes pulse{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:1050px){.app{grid-template-columns:1fr}.sidebar{position:static}.statsGrid,.split,.settingsLayout,.settingsGrid{grid-template-columns:1fr}.topbar{flex-wrap:wrap;height:auto;padding:12px}.topSearch{min-width:0;flex:1}.content{padding:20px}.settingsNav{position:static}.screenHeader{display:grid}}@media(max-width:720px){.sidebar nav{display:grid;grid-template-columns:1fr 1fr;gap:8px}.navGroup{margin:0}.statsGrid{grid-template-columns:1fr}.settingsSearch,.moduleEnablement{display:grid}.settingsSearch input{max-width:none}table{min-width:680px}}
.aiInsightBar{display:flex;align-items:center;gap:16px;background:#F0FDFA;border:1px solid #A7F3D0;border-radius:14px;padding:11px 16px;flex-wrap:wrap;row-gap:8px}
  .attentionContent{padding-top:28px}

  .dashboardStack{display:grid;grid-template-columns:1fr;gap:16px;min-width:0}
  .aiRiskPanel{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:22px;align-items:center}
  .aiRiskPanel .panelTitle{margin-bottom:8px;align-items:flex-start}
  .aiRiskPanel .insightCopy{margin:0;color:#40516A;line-height:1.55;max-width:96ch}
  .compactActions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;min-width:260px}
  .compactActions button{white-space:nowrap;text-align:center;padding:8px 10px;font-size:12.5px}
  .priorityQueuePanel{width:100%}
  .priorityQueueWrap{width:100%;overflow-x:auto}
  .priorityQueueTable{min-width:1080px;table-layout:fixed}
  .priorityQueueTable th,.priorityQueueTable td{padding:12px 12px}
  .priorityQueueTable th:nth-child(1){width:20%}
  .priorityQueueTable th:nth-child(2){width:10%}
  .priorityQueueTable th:nth-child(3){width:11%}
  .priorityQueueTable th:nth-child(4){width:12%}
  .priorityQueueTable th:nth-child(5){width:9%}
  .priorityQueueTable th:nth-child(6){width:9%}
  .priorityQueueTable th:nth-child(7){width:12%}
  .priorityQueueTable th:nth-child(8){width:17%}
  .priorityQueueTable .recordCell{line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;white-space:normal}
  .priorityQueueTable .compactCell,.priorityQueueTable .actionCell{white-space:nowrap}
  .priorityQueueTable .actionCell .rowAction{white-space:nowrap;padding:6px 8px}
  @media(max-width:1050px){.aiRiskPanel{grid-template-columns:1fr}.compactActions{justify-content:flex-start;min-width:0}.priorityQueueTable{min-width:980px}}

.aiInsightBarLeft{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
.aiInsightBarLabel{font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:900;color:#0D9488;white-space:nowrap;flex-shrink:0}
.aiInsightBarText{margin:0;color:#134E4A;font-size:13px;line-height:1.45;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.aiInsightBarActions{display:flex;gap:8px;flex-shrink:0}
.aiInsightBarActions button{height:28px;border-radius:999px;background:#fff;border:1px solid #5EEAD4;color:#0F766E;padding:0 11px;font-size:12px;font-weight:700;white-space:nowrap}
.aiInsightBarActions button:hover{background:#F0FDFA;border-color:#2DD4BF}
.worklistPanel td:not(:first-child){white-space:nowrap}
.worklistPanel td:first-child{white-space:normal;max-width:260px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
/* Dashboard priority queue fit refinement */
.priorityQueueWrap{max-width:100%;overflow:hidden}
.priorityQueueTable{width:100%;min-width:0;table-layout:fixed}
.priorityQueueTable th,.priorityQueueTable td{padding:9px 7px;font-size:12.5px;line-height:1.25}
.priorityQueueTable th:nth-child(1){width:23%}
.priorityQueueTable th:nth-child(2){width:7%}
.priorityQueueTable th:nth-child(3){width:8%}
.priorityQueueTable th:nth-child(4){width:11%}
.priorityQueueTable th:nth-child(5){width:8%}
.priorityQueueTable th:nth-child(6){width:8%}
.priorityQueueTable th:nth-child(7){width:11%}
.priorityQueueTable th:nth-child(8){width:24%}
.priorityQueueTable .recordCell{line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;white-space:normal}
.priorityQueueTable .compactCell{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.priorityQueueTable .actionCell{white-space:nowrap;overflow:visible}
.priorityQueueTable .actionCell .rowAction{white-space:nowrap;padding:5px 7px;font-size:11.5px;line-height:1;border-color:#A7F3D0;background:#ECFDF5;color:#047857}
.priorityQueueTable .actionCell .rowAction:hover{background:#D1FAE5;border-color:#6EE7B7}
@media(max-width:1050px){.priorityQueueTable th:nth-child(2),.priorityQueueTable td:nth-child(2){display:none}.priorityQueueTable th:nth-child(1){width:27%}.priorityQueueTable th:nth-child(3){width:9%}.priorityQueueTable th:nth-child(4){width:12%}.priorityQueueTable th:nth-child(5){width:8%}.priorityQueueTable th:nth-child(6){width:9%}.priorityQueueTable th:nth-child(7){width:12%}.priorityQueueTable th:nth-child(8){width:23%}}
.attentionWorkflowWrap{max-width:100%;overflow:hidden}
.attentionWorkflowTable{width:100%;min-width:0;table-layout:fixed}
.attentionWorkflowTable th,.attentionWorkflowTable td{padding:10px 7px;font-size:12.5px;line-height:1.28;vertical-align:middle}
.attentionWorkflowTable th:nth-child(1){width:30%}
.attentionWorkflowTable th:nth-child(2){width:10%}
.attentionWorkflowTable th:nth-child(3){width:9%}
.attentionWorkflowTable th:nth-child(4){width:13%}
.attentionWorkflowTable th:nth-child(5){width:11%}
.attentionWorkflowTable th:nth-child(6){width:18%}
.attentionWorkflowTable th:nth-child(7){width:9%}
.attentionWorkflowTable .issueRecordCell{white-space:normal;min-width:0;display:grid;gap:2px}
.attentionWorkflowTable .issueRecordCell span{color:#64748B;font-size:12px;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.attentionWorkflowTable .issueRecordCell strong{color:#0B1F3A;font-size:13px;font-weight:800;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.attentionWorkflowTable .compactCell,.attentionWorkflowTable .dateCell{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.attentionWorkflowTable .dateCell{overflow:visible;text-overflow:clip}
.attentionWorkflowTable .actionCell{white-space:nowrap;overflow:visible}
.attentionWorkflowTable .actionCell .rowAction{white-space:nowrap;padding:5px 7px;font-size:11.5px;line-height:1;border-color:#A7F3D0;background:#ECFDF5;color:#047857}
.attentionWorkflowTable .actionCell .rowAction:hover{background:#D1FAE5;border-color:#6EE7B7}
`;


const settingsDirectoryOverrideStyles = `
.settingsDirectoryPage{gap:24px;padding-bottom:52px}
.settingsHub{display:grid;gap:28px}
.settingsHubRow{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.settingsHealthBar{display:flex;align-items:center;gap:8px;padding:7px 12px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;white-space:nowrap;flex-shrink:0}
.settingsHealthDot{width:7px;height:7px;border-radius:50%;background:#D97706;flex-shrink:0}
.settingsHealthText{font-size:13px;color:#78350F;line-height:1}
.settingsHealthText strong{font-weight:800}
.settingsHealthBtn{height:24px;padding:0 9px;font-size:12px;font-weight:700;border-radius:6px;border:1px solid #FCD34D;color:#92400E;background:#fff;box-shadow:none;white-space:nowrap;cursor:pointer}
.settingsHealthBtn:hover{background:#FFFBEB;box-shadow:none}
.settingsSearchInput{height:36px;border:1px solid #E2E8F0;border-radius:9px;padding:0 13px;outline:0;font:inherit;font-size:14px;color:#1E293B;background:#FAFCFF;width:240px}
.settingsSearchInput:focus{border-color:#0D9488;box-shadow:0 0 0 3px rgba(13,148,136,.1)}
.settingsGroupGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px 48px}
.settingsDirectoryGroup{display:flex;flex-direction:column}
.settingsGroupLabel{margin:0 0 10px;padding-bottom:8px;font-size:11.5px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#0B1F3A;border-bottom:1.5px solid #F1F5F9}
.settingsItemList{margin:0;padding:0;list-style:none;display:flex;flex-direction:column}
.settingsItemLink{width:100%;text-align:left;border:0;background:transparent;box-shadow:none;color:#475569;font-size:13.5px;font-weight:500;padding:5px 0;cursor:pointer;line-height:1.4;border-radius:0}
.settingsItemLink:hover{color:#0D9488;background:transparent;box-shadow:none}
.settingsNoResults{color:#64748B;font-size:13px}
.settingsDetailWorkspace{display:grid;gap:12px;max-width:800px}
.settingsBackButton{justify-self:start;border:0;background:transparent;box-shadow:none;color:#64748B;padding:4px 0;font-size:13px;font-weight:700;cursor:pointer}
.settingsBackButton:hover{color:#0B1F3A;background:transparent;box-shadow:none}
.settingsDetailPanel,.settingsFocusedPanel{background:#fff;border:1px solid #E8EEF4;border-radius:18px;padding:24px;box-shadow:0 1px 3px rgba(15,35,65,.05),0 6px 20px rgba(15,35,65,.04);display:grid;gap:0}
.settingsDetailHeader{padding-bottom:16px;border-bottom:1px solid #F1F5F9}
.settingsDetailHeader h2{margin:4px 0 0;color:#0B1F3A;font-size:20px;font-weight:800;letter-spacing:-.02em}
.settingsDetailHeader p{margin:5px 0 0;color:#64748B;font-size:13px;line-height:1.5;max-width:58ch}
.settingsDetailSection{padding-top:20px}
.settingsSectionLabel{margin:0 0 10px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#94A3B8;display:block}
.settingsWorkspaceModeDesc{margin:0 0 12px;font-size:13px;color:#64748B;line-height:1.45}
.workspaceModeSegment{display:inline-flex;align-items:center;border:1px solid #E2E8F0;border-radius:10px;background:#F8FAFC;padding:3px;gap:2px}
.workspaceModeSegment button{height:30px;border:0;background:transparent;border-radius:7px;padding:0 14px;font-size:13px;font-weight:700;color:#64748B;box-shadow:none;white-space:nowrap;cursor:pointer}
.workspaceModeSegment button.active{background:#fff;color:#0F766E;box-shadow:0 1px 3px rgba(15,35,65,.1);border:1px solid #CDEDE5}
.settingsRows{display:grid;gap:6px}
.adminSettingRow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;border:1px solid #F1F5F9;background:#FAFCFF;border-radius:10px;padding:12px 14px}
.adminSettingRow:hover{border-color:#E8EEF4;background:#fff}
.adminSettingCopy{display:grid;gap:2px;min-width:0}
.adminSettingCopy strong{color:#1E293B;font-size:13.5px;font-weight:700}
.adminSettingCopy span{color:#64748B;font-size:12px;line-height:1.35}
.adminSettingControl{display:flex;align-items:center;gap:8px;flex-shrink:0}
.adminSettingControl em{font-style:normal;white-space:nowrap;border:1px solid #E8EEF4;background:#F8FAFC;color:#64748B;border-radius:999px;padding:3px 9px;font-size:11.5px;font-weight:700}
.adminSettingControl button{height:26px;border-radius:7px;background:#fff;color:#334155;padding:0 10px;font-size:12px;border-color:#E2E8F0;font-weight:700;cursor:pointer}
.settingsModuleGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.settingsModuleRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;border:1px solid #F1F5F9;border-radius:9px;background:#FAFCFF}
.settingsModuleRow:hover{border-color:#E8EEF4;background:#fff}
.settingsModuleMeta{display:grid;gap:1px;min-width:0}
.settingsModuleName{font-size:13px;color:#1E293B;font-weight:700}
.settingsModuleDesc{font-size:11.5px;color:#94A3B8;line-height:1.3}
.switchControl{width:38px;height:21px;border-radius:999px;border:1.5px solid #CBD5E1;background:#E2E8F0;padding:1.5px;display:inline-flex;align-items:center;justify-content:flex-start;box-shadow:none;flex-shrink:0;cursor:pointer}
.switchControl span{width:16px;height:16px;border-radius:50%;background:#94A3B8;display:block;flex-shrink:0}
.switchControl.isOn{background:#E6F7F3;border-color:#5EEAD4;justify-content:flex-end}
.switchControl.isOn span{background:#0D9488}
.aiGovernancePanel{display:grid;grid-template-columns:minmax(200px,236px) minmax(0,1fr);gap:24px;padding:24px;background:#fff;border:1px solid #E8EEF4;border-radius:18px;box-shadow:0 1px 3px rgba(15,35,65,.05),0 6px 20px rgba(15,35,65,.04);align-items:start}
.aiSettingsSummary{position:sticky;top:88px;display:grid;gap:12px}
.aiSettingsSummary h2{margin:0;color:#0B1F3A;font-size:20px;font-weight:800;letter-spacing:-.02em}
.aiSettingsSummary p{margin:0;color:#475569;font-size:13px;line-height:1.55}
.aiSafetyNote{border:1px solid #DDEFEA;background:#F6FEFC;border-radius:12px;padding:12px;display:grid;gap:4px}
.aiSafetyNote strong{color:#0F3D39;font-size:13px;font-weight:800;display:block}
.aiSafetyNote span{color:#55706E;font-size:12px;line-height:1.45}
.aiSettingsMain{display:grid;gap:8px;min-width:0}
.aiSettingSection{border:1px solid #F1F5F9;background:#FAFCFF;border-radius:12px;padding:14px;display:grid;gap:8px}
.aiSettingSection h3{margin:0;color:#1E293B;font-size:13px;font-weight:800}
.aiSettingStack{display:grid;gap:5px}
.aiSettingRow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;border:1px solid #F1F5F9;background:#fff;border-radius:9px;padding:11px 13px}
.aiSettingCopy{display:grid;gap:2px;min-width:0}
.aiSettingCopy strong{color:#1E293B;font-size:13.5px;font-weight:700}
.aiSettingCopy span{color:#64748B;font-size:12px;line-height:1.4;max-width:50ch}
.aiSettingControl{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-shrink:0}
.aiSettingControl em{font-style:normal;white-space:nowrap;border:1px solid #CDEDE5;background:#F0FDFA;color:#0F766E;border-radius:999px;padding:2px 8px;font-size:11.5px;font-weight:800}
.scopePill{height:26px;border-radius:999px;border-color:#DDEFEA;background:#F8FFFD;color:#0F766E;padding:0 10px;font-size:12px;white-space:nowrap}
.activitySegment{display:flex;align-items:center;border:1px solid #E2E8F0;border-radius:999px;background:#F8FAFC;padding:2px}
.activitySegment button{height:24px;border:0;background:transparent;border-radius:999px;padding:0 8px;font-size:12px;color:#64748B;box-shadow:none;cursor:pointer}
.activitySegment button.active{background:#fff;color:#0F766E;box-shadow:0 1px 3px rgba(15,35,65,.08)}
.aiInsightReadable{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;border:1px solid #DDEFEA;background:#F8FFFD;border-radius:12px;padding:12px 14px}
.aiInsightReadable p{margin:4px 0 0;color:#334155;font-size:13px;line-height:1.5}
.aiInsightReadable button{white-space:nowrap;border-color:#CDEDE5;color:#0F766E;background:#fff;font-size:12px;cursor:pointer}
.eyebrow{color:#0D9488;text-transform:uppercase;letter-spacing:.12em;font-size:11px;font-weight:900;display:block;margin-bottom:3px}
@media(max-width:1100px){.settingsGroupGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.aiGovernancePanel{grid-template-columns:1fr}.aiSettingsSummary{position:static}}
@media(max-width:700px){.settingsGroupGrid{grid-template-columns:1fr}.settingsModuleGrid{grid-template-columns:1fr}.adminSettingRow{grid-template-columns:1fr}.adminSettingControl{justify-content:flex-start}.aiSettingRow,.aiInsightReadable{grid-template-columns:1fr}.aiSettingControl{justify-content:flex-start}.workspaceModeSegment{display:grid;grid-template-columns:1fr;border-radius:10px}.workspaceModeSegment button{text-align:center}.settingsHubRow{flex-direction:column;align-items:flex-start}.settingsSearchInput{width:100%}}
`;


const oprivaUpgradeStyles = `
.app{min-height:100vh;display:flex}.sidebar{width:282px;background:linear-gradient(180deg,#0B1F3A,#07111F);color:#EAF4F7;padding:24px 18px;position:fixed;inset:0 auto 0 0;overflow:auto}.workspace{margin-left:282px;min-width:0;flex:1;display:flex;flex-direction:column}.brand{height:62px;display:flex;align-items:center;gap:12px;margin-bottom:18px;padding:0;border-bottom:0}.brandMark{width:36px;height:36px;display:grid;place-items:center;flex:0 0 auto}.brandMark svg{width:36px;height:36px;overflow:visible}.oprivaOpenContour,.agentContour{fill:none;stroke:#24BFA6;stroke-width:2.35;stroke-linecap:round;stroke-linejoin:round}.oprivaFocusDot,.agentFocusDot{fill:#0B7D63;filter:drop-shadow(0 2px 7px rgba(13,148,136,.28))}.brandCopy{display:flex;flex-direction:column;line-height:1.05}.brandCopy strong{font-size:19px;font-weight:650;letter-spacing:.01em;color:#fff}.brandCopy span{margin-top:5px;color:#94A3B8;font-size:11px;letter-spacing:.06em;text-transform:uppercase}.navGroup{margin-top:20px}.navGroup p{margin:0 0 8px 8px;color:#8BA4BD;font-size:11px;text-transform:uppercase;letter-spacing:.1em}.navGroup button{width:100%;border:0;background:transparent;color:#C8D7E5;text-align:left;padding:10px 12px;border-radius:12px;cursor:pointer}.navGroup button:hover,.navGroup button.active{background:rgba(255,255,255,.08);color:#fff}.topbar{height:68px;background:#fff;border-bottom:1px solid var(--border);display:grid;grid-template-columns:250px minmax(260px,560px) auto;gap:24px;align-items:center;padding:0 28px;position:sticky;top:0;z-index:5}.tenantLockup{display:flex;align-items:center;gap:11px;border:0;background:transparent;text-align:left;padding:0;box-shadow:none}.tenantLockup:hover{background:transparent;box-shadow:none}.tenantLogo,.avatar{display:grid;place-items:center;border-radius:50%;background:#EEF6FF;color:#184E94;font-weight:700}.tenantLogo{width:38px;height:38px}.avatar{width:34px;height:34px;font-size:12px}.tenantLockup div{display:flex;flex-direction:column}.tenantLockup strong{font-size:14px;color:#0F2138}.tenantLockup span{font-size:12px;color:var(--muted)}.globalSearch{height:40px;border:1px solid var(--border);border-radius:999px;background:#F8FAFC;display:flex;align-items:center;gap:10px;padding:0 14px;color:#64748B}.globalSearch input{border:0;outline:0;background:transparent;width:100%;color:var(--text)}.globalSearch:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px rgba(37,99,235,.12)}.topActions{display:flex;align-items:center;gap:12px;justify-content:end}.topActions button{height:34px;border:1px solid var(--border);border-radius:999px;background:#fff;color:#0F766E;padding:0 12px}.agentWrap{position:fixed;right:24px;bottom:96px;z-index:90;display:flex;align-items:center;gap:12px}.agentTip{max-width:244px;background:#0F172A;color:#EAF4F7;padding:10px 12px;border-radius:14px;font-size:12px;box-shadow:0 18px 45px rgba(15,23,42,.2);opacity:0;transform:translateX(6px);pointer-events:none;transition:opacity .22s ease,transform .22s ease}.agentTip.isVisible{opacity:.94;transform:translateX(0)}.agentButton{width:62px;height:62px;border:1px solid rgba(13,148,136,.22);border-radius:20px;background:rgba(255,255,255,.92);box-shadow:0 16px 40px rgba(15,23,42,.16);display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(18px);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.agentButton:hover{box-shadow:0 20px 48px rgba(15,23,42,.22),0 0 0 6px rgba(45,212,191,.08);border-color:rgba(13,148,136,.45)}.agentMark{width:38px;height:38px;display:grid;place-items:center}.agentMarkSvg{width:38px;height:38px;overflow:visible}.agentContour{transform-origin:16px 16px}.agentFocusDot{transform-origin:center}.aiDrawer{position:fixed;right:24px;bottom:174px;top:auto;width:min(360px,calc(100vw - 48px));max-height:calc(100vh - 210px);overflow:auto;background:#fff;border:1px solid var(--border);border-radius:22px;box-shadow:0 24px 70px rgba(15,23,42,.2);z-index:88;padding:18px;display:block}.drawerHeader{display:flex;justify-content:space-between;gap:12px;align-items:start}.drawerHeader h2{margin:0;font-size:18px}.drawerHeader p,.drawerText,.meta{color:var(--muted);font-size:13px}.drawerHeader button{border:0;background:#F1F5F9;border-radius:10px;width:30px;height:30px;padding:0}.drawerInput{width:100%;border:1px solid var(--border);border-radius:14px;padding:12px;margin:12px 0}.drawerInput:focus{outline:0;border-color:var(--teal);box-shadow:0 0 0 3px rgba(13,148,136,.12)}.suggestions{display:grid;gap:8px}.suggestions button{border:1px solid var(--border);background:#fff;text-align:left;border-radius:12px;padding:10px}.agentSettings{margin-top:12px;padding-top:12px;border-top:1px solid #EEF2F7}.agentSettings label{display:flex;align-items:center;gap:9px;color:#334155;font-size:13px}@media(max-width:1050px){.sidebar{position:relative;width:100%;height:auto}.app{display:block}.workspace{margin-left:0}.topbar{grid-template-columns:1fr;gap:10px;height:auto;padding:16px}.agentWrap{right:18px;bottom:84px}}`;

export default App;