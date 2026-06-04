import * as XLSX from 'xlsx';
import {
  DOC_TYPE_OPTIONS,
  LICENSE_ALERT_POLICY_OPTIONS,
  LICENSE_TERM_OPTIONS,
  SUPPORT_ALERT_POLICY_OPTIONS,
  SUPPORT_COVERAGE_NAME_OPTIONS,
  SUPPORT_COVERAGE_TYPE_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from './constants/formOptions.js';
import {
  companies,
  contacts,
  contractsInternalIT,
  contractsMsp,
  documentsInternalIT,
  documentsMsp,
  hardwareInternalIT,
  hardwareMsp,
  importRows,
  licensesInternalIT,
  licensesMsp,
  reportsInternalIT,
  reportsMsp,
  tasksInternalIT,
  tasksMsp,
} from './data/demoSeedData.js';
import { IMPORT_CANONICAL_FIELDS, IMPORT_TARGET_OPTIONS } from './importSandbox/importConstants.js';
import { buildImportLicenseDisplayName, formatImportMoney, importMoney, normalizeImportDate, withImportRecordMeta } from './importSandbox/importFormatting.js';
import { addKeysToSet, isDuplicateByKeys, matchesExistingRecord } from './importSandbox/importDuplicates.js';
import { createImportMappings, getMappedImportValue, getMappedImportValueAny } from './importSandbox/importMapping.js';
import { detectImportTarget, suggestImportTargetFromSource } from './importSandbox/importTargets.js';
import { detectImportSourceType, normalizeImportText } from './importSandbox/importText.js';
import { getImportSheetData } from './importSandbox/workbookParsing.js';
import { calcExpirationState, calcRiskLevel, inferLicenseTerm, suggestRenewalDate } from './utils/dates.js';
import { buildSuggestedCoveragesForLicense, buildSuggestedCoveragesForHardware, buildCoverageRecordsForBatch } from './utils/coverage.js';
import SearchableSelect from './components/SearchableSelect.jsx';
import { autoFillDocName, extractFileMetadata, fmtFileSize, fmtUploadedAt } from './utils/files.js';
import { calcMargin } from './utils/money.js';
import { asArray, cx, riskClass, safeText } from './utils/text.js';
import { getImportSandboxRecords, getLocalStoreRecords, getModuleClientDeptIndex, getModuleColumns, getRecordCell, isLocalStoreRecord } from './store/recordSelectors.js';
import { createRecordId, RECORD_STORE, toRecords } from './store/recordStore.js';
import { addActivityEvent } from './store/activityStore.js';
import { getImportedClientRows, getImportedDashboardPriorityRows, getImportedRenewalRows } from './store/recordProjections.js';
import { getDashboardMetrics } from './store/dashboardMetrics.js';

// Reusable dialog focus manager (A11y-1). When `active` becomes true it:
//  - remembers the element that had focus (the trigger),
//  - moves focus to the first focusable element inside `ref` (or the container),
//  - traps Tab / Shift+Tab inside the dialog,
//  - closes on Escape via `onClose` — but only if the event was not already
//    handled (e.g. an open SearchableSelect dropdown calls preventDefault on its
//    own Escape without stopping propagation, so we skip closing in that case),
//  - restores focus to the trigger on close/unmount.
// Returns an onKeyDown handler to spread onto the dialog container. Scoped to a
// single surface per call; not global. Does not change layout or ARIA.
function useDialogFocus(ref, active, onClose){
  const triggerRef = React.useRef(null);
  React.useEffect(function(){
    if (!active) return undefined;
    triggerRef.current = (typeof document !== 'undefined') ? document.activeElement : null;
    var node = ref.current;
    var focusTimer = window.setTimeout(function(){
      if (!ref.current) return;
      var focusables = ref.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [role="combobox"]');
      var first = focusables.length ? focusables[0] : ref.current;
      if (first && typeof first.focus === 'function') first.focus();
    }, 30);
    return function(){
      window.clearTimeout(focusTimer);
      var trigger = triggerRef.current;
      if (trigger && typeof trigger.focus === 'function' && document.contains(trigger)) {
        trigger.focus();
      }
    };
  }, [active, ref]);

  function onKeyDown(e){
    if (e.key === 'Escape') {
      // If an inner control (e.g. SearchableSelect dropdown) already handled
      // Escape, it called preventDefault; let it close the dropdown first and
      // leave the dialog open.
      if (e.defaultPrevented) return;
      e.preventDefault();
      if (onClose) onClose();
      return;
    }
    if (e.key === 'Tab') {
      var container = ref.current;
      if (!container) return;
      var focusables = Array.prototype.slice.call(container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [role="combobox"]'))
        .filter(function(el){ return el.offsetParent !== null || el === document.activeElement; });
      if (focusables.length === 0) { e.preventDefault(); if (container.focus) container.focus(); return; }
      var firstEl = focusables[0];
      var lastEl = focusables[focusables.length - 1];
      var activeEl = document.activeElement;
      if (e.shiftKey) {
        if (activeEl === firstEl || !container.contains(activeEl)) { e.preventDefault(); lastEl.focus(); }
      } else {
        if (activeEl === lastEl || !container.contains(activeEl)) { e.preventDefault(); firstEl.focus(); }
      }
    }
  }

  return onKeyDown;
}

function useViewport(){
  const [vp, setVp] = React.useState('desktop');
  React.useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setVp(w < 768 ? 'mobile' : (w < 1200 ? 'tablet' : 'desktop'));
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return vp;
}

const TWEAK_DEFAULTS = {
  "accentColor": "#2563EB",
  "livingAgent": true,
  "allowCursorFollow": true,
  "proactiveSuggestions": true,
  "activityLevel": "Balanced",
  "reduceMotion": false,
  "muteAssistant": false
};


const DEPARTMENT_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "departmentSpacing": 22,
  "departmentBottomPadding": 168,
  "departmentPanelPadding": 22,
  "selectedPreviewSoftness": 14
}/*EDITMODE-END*/;

const SIDEBAR_GROUPS = [
  { label: 'Overview', items: ['Dashboard', 'Attention Center'] },
  { label: 'Manage', items: ['Companies / Clients', 'Expirations', 'Licenses', 'Hardware', 'Contracts', 'Documents'] },
  { label: 'Work', items: ['Tasks', 'Reports'] },
  { label: 'Admin', items: ['Data Import', 'Settings'] }
];

const moduleMeta = {
  Dashboard: ['Operational command center', 'Know what expires. Know what it costs not to act. Act on time.'],
  'Attention Center': ['Operational issue center', 'Resolve critical renewals, ownership gaps, missing evidence and approval blockers before they become financial or operational risk.'],
  Search: ['Global command search', 'Find records, owners, documents and renewal intelligence across the workspace.'],
  'Companies / Clients': ['Client operating model', 'Manage client context, contacts, ownership, renewal exposure and related records from one workspace.'],
  Expirations: ['Renewal calendar', 'Prioritize upcoming dates and missing actions.'],
  Licenses: ['Software and SaaS licenses', 'Track products, quantities, spend and risk.'],
  Hardware: ['Physical asset inventory', 'Track physical assets, serials, warranty dates, support coverage and renewal actions.'],
  Contracts: ['Commercial agreements', 'Track obligations, parties, value and status.'],
  Documents: ['Record document vault', 'Find quotes, agreements, warranties and evidence.'],
  Tasks: ['Operational work queue', 'Assign and close renewal work.'],
  Reports: ['Executive reporting', 'Prepare operational and governance reports.'],
  'Data Import': ['Spreadsheet onboarding', 'Map, validate and import tenant records.'],
  Settings: ['Workspace administration', 'Configure access, data, automation and governance.']
};


function getPageDisplayName(page, workspaceMode){
  if (page === 'Expirations') {
    if (workspaceMode === 'Internal IT') return 'Renewals Forecast';
    if (workspaceMode === 'Custom') return 'Configurable Records';
    return 'Assets & Renewals';
  }
  if (page === 'Companies / Clients') {
    if (workspaceMode === 'Internal IT') return 'Departments';
    if (workspaceMode === 'Hybrid') return 'Organizations';
    if (workspaceMode === 'Custom') return 'Organizations';
    return 'Companies / Clients';
  }
  return page || 'Dashboard';
}

const modeConfig = {
  'Internal IT': {
    sidebarLabels: {
      'Companies / Clients': 'Departments',
      'Expirations': 'Renewals Forecast',
      'Assets & Renewals': 'Renewals Forecast'
    }
  },
  Hybrid: {
    sidebarLabels: {
      'Companies / Clients': 'Organizations'
    }
  },
  Custom: {
    sidebarLabels: {
      'Companies / Clients': 'Organizations',
      'Expirations': 'Configurable Records',
      'Assets & Renewals': 'Configurable Records'
    }
  }
};

const commercialRelationshipModel = {
  internalIT: {
    brandManufacturer: 'Technology brand used by the organization.',
    supplierProvider: 'Company that sells, invoices, implements or administers the technology for the organization.',
    example: {
      brand: 'Microsoft',
      supplierProvider: 'Nextcom',
      organization: 'Grupo Regency'
    }
  },
  mspIntegrator: {
    client: 'End client served by the MSP or integrator.',
    brandManufacturer: 'Technology brand sold or managed.',
    distributorUpstreamSupplier: 'Wholesaler or distributor the MSP buys from.',
    mspSeller: 'Integrator company that sells to the client.',
    example: {
      client: 'Grupo Regency',
      brand: 'Microsoft',
      distributor: 'Licencias Online',
      mspSeller: 'Nextcom'
    }
  }
};

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
    ['Providers & Distributors', 'Provider and distributor catalog with duplicate prevention and ownership.', '186 records', 'Open'],
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
    ['Session activity', 'Local session events — real audit log requires backend.', 'Backend required', 'Open'],
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
  ['Assets & Renewals', 'Renewal calendar and expiration tracking.'],
  ['Licenses',          'Software and SaaS license management.'],
  ['Contracts',         'Commercial agreements and obligations.'],
  ['Documents',         'Record document vault and evidence management.'],
  ['Tasks',             'Operational work queue and follow-up tracking.'],
  ['Reports',           'Executive and governance reporting.'],
  ['Data Import',       'Spreadsheet onboarding and bulk record import.'],
  ['Providers & Distributors', 'Provider and distributor catalog with duplicate prevention and ownership.'],
  ['Hardware', 'Optional detailed hardware inventory and warranty tracking.'],
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
  'Data Import': { role: 'Data cleanup assistant', metadata: 'Context: 3 imports · 14 duplicates · 7 missing owners', suggestions: ['Map columns', 'Detect duplicates', 'Fix formats', 'Suggest missing owners'], result: 'Opriva found naming conflicts, missing owners and evidence gaps in the import file. Review relationship matches and complete required fields before confirming the upload.', findings: ['One sheet has invalid date formats.', 'Relationship names resemble existing catalog records.', 'Seven rows need owners before confirmation.'], actions: ['Review mapping', 'Review matches', 'Apply owner suggestions', 'Confirm import'], sources: ['Import preview', 'Catalog records', 'Validation rules', 'Owner history'] },
  Hardware: { role: 'Hardware renewal assistant', metadata: 'Context: physical assets · warranty dates · support coverage · ownership gaps', suggestions: ['Find expiring warranties', 'Surface assets without support', 'Identify missing owners', 'Create renewal tasks'], result: 'I found hardware assets with expiring warranties, missing support coverage and unassigned ownership that need action before renewal deadlines.', findings: ['Two assets expire within 30 days and have no support contract.', 'Several assets are missing an assigned owner.', 'Approval status is pending for high-value hardware renewals.'], actions: ['Create renewal tasks', 'Assign owners', 'Request support quote', 'Review approval status'], sources: ['Hardware inventory', 'Warranty dates', 'Support contracts', 'Owner records'] },
  Settings: { role: 'Configuration assistant', metadata: 'Context: 18 alert rules · 27 custom fields · 14 templates', suggestions: ['Recommend alert policy', 'Suggest required fields', 'Create category template', 'Configure onboarding checklist'], result: 'Your workspace is configured well, but license and certificate categories should require owner, renewal date and evidence before records can become active.', findings: ['Approval before AI actions is enabled.', 'Data access is workspace scoped.', 'Two categories have weak required-field rules.'], actions: ['Update policy', 'Create template', 'Review AI settings', 'Open audit log'], sources: ['Settings', 'Data Management', 'Automation rules', 'Governance policy'] }
};

const AI_WORKFLOWS = ['90-day renewal review','Missing owner cleanup','Missing documents cleanup','Client meeting brief','Executive report generator','Contract review','Import mapping assistant','Renewal follow-up drafts'];

function Badge({ children, tone }){ const badgeTone = riskClass(tone || children); return <span className={cx('badge', badgeTone)}>{safeText(children)}</span>; }
function EmptyState({ title, message, action }){ return <div className="stateBox emptyState" role="status"><strong>{title || 'No records found'}</strong><span>{message || 'Adjust filters or create a new record to continue.'}</span>{action && <button>{action}</button>}</div>; }
function ErrorState({ title, message }){ return <div className="stateBox errorState" role="alert"><strong>{title || 'Data could not be loaded'}</strong><span>{message || 'Retry the request or contact support if the problem continues.'}</span><div><button>Retry</button><button className="ghostBtn">Contact support</button></div></div>; }
function LoadingRows({ columns }){ const safeColumns = asArray(columns); return <tbody aria-busy="true">{[0,1,2].map(i => <tr className="skeletonRow" key={i}>{safeColumns.map((c,j)=><td key={c || j}><span className="skeletonLine" /></td>)}</tr>)}</tbody>; }
function Table({ columns, rows, loading=false, error=false, emptyTitle, emptyMessage, selectedIndex=-1, actions=true, onRowOpen=null }){
  const safeColumns = asArray(columns);
  const safeRows = asArray(rows);
  if (error) return <ErrorState title="Failed data loading" message="Opriva could not load this table. Retry or open support with the current workspace context." />;
  if (!loading && safeRows.length === 0) return <EmptyState title={emptyTitle || 'No records yet'} message={emptyMessage || 'This module has no matching records for the current filters.'} action="Create record" />;
  return <div className="tableWrap"><table><thead><tr>{safeColumns.map(c => <th key={c}>{safeText(c)}</th>)}{actions && <th aria-label="Row actions">Actions</th>}</tr></thead>{loading ? <LoadingRows columns={[...safeColumns,'Actions']} /> : <tbody>{safeRows.map((row, i) => { const safeRow = asArray(row); return <tr key={i} className={i===selectedIndex?'selectedRow':''} aria-selected={i===selectedIndex}>{safeColumns.map((column, j) => { const cell = safeText(safeRow[j]); return <td key={column || j} data-label={column || ''}>{j === safeColumns.length - 1 || /risk|status|priority|severity/i.test(column || '') ? <Badge>{cell}</Badge> : cell}</td>; })}{actions && <td data-label="Actions" className="actionCell"><button className="rowAction" aria-label={`Open ${safeText(safeRow[0], 'record')}`} onClick={() => { if (onRowOpen) onRowOpen(i); }}>Open</button></td>}</tr>; })}</tbody>}</table></div>;
}
function ToastStack({ notices = [] }){
  const safeNotices = Array.isArray(notices) ? notices.filter(Boolean) : [];
  if (!safeNotices.length) return null;
  return <div className="toastStack" aria-live="polite">{safeNotices.slice(0,3).map((notice, index) => <div className={cx('toast', notice.tone === 'error' && 'errorToast')} key={notice.id || notice.message || index}>{notice.message || notice}</div>)}</div>;
}
function ValidationPanel({ workspaceMode = 'MSP / Integrator', issueCounts = { critical: 0, warning: 0, suggestion: 0 }, confirmBlocked = false }){
  const isInternalIT = workspaceMode === 'Internal IT';
  const duplicateMessage = isInternalIT
    ? 'Duplicate prevention is checking brands, providers and departments before import confirmation.'
    : 'Duplicate prevention is checking clients, products and distributors before import confirmation.';
  return <div className="validationPanel" role="group" aria-label="Import validation severity states"><div><strong>Critical errors: {issueCounts.critical || 0}</strong><span>Must be fixed before Confirm Import is enabled.</span></div><div><strong>Warnings: {issueCounts.warning || 0}</strong><span>Can be imported, but should be reviewed first.</span></div><div><strong>Suggestions: {issueCounts.suggestion || 0}</strong><span>Optional cleanup recommendations that do not block import.</span></div><div><strong>Duplicate prevention</strong><span>{duplicateMessage}</span></div><button disabled title={confirmBlocked ? 'Critical errors must be fixed before confirming.' : 'Confirm remains available when only warnings or suggestions exist.'}>{confirmBlocked ? 'Confirm blocked by critical errors' : 'Warnings do not block confirm'}</button></div>;
}

function ScreenHeader({ active, subtitle, eyebrow, title, children }){
  const meta = moduleMeta[active] || ['Opriva Workspace', 'Enterprise operational intelligence.'];
  return <header className="screenHeader"><div><p>{eyebrow || meta[0]}</p><h1>{title || active}</h1><span>{subtitle || meta[1]}</span></div>{children && <div className="headerActions">{children}</div>}</header>;
}

function StatCards({ workspaceMode = 'MSP / Integrator' }){
  const isInternalIt = workspaceMode === 'Internal IT';
  // C10b-2: wire-only. All aggregation/arithmetic lives in dashboardMetrics.js;
  // here we only select metrics.* and format with formatImportMoney. When there
  // are no local/session records, fall back to clearly-labeled sample cards.
  const m = getDashboardMetrics(workspaceMode);
  // Sample IT labels are aligned to the derived labels so switching sample<->local
  // does not move the card slots.
  const sampleCards = isInternalIt ? [
    ['90-day renewal forecast', '$487,000', 'Next-quarter renewal exposure', 'High exposure'],
    ['Annual exposure', '$214,000', 'Total annual IT spend in scope', 'Review'],
    ['Critical systems count', '6', 'Systems at critical risk', 'Urgent'],
    ['Missing owners', '8', 'Records without an owner', 'Needs assignment']
  ] : [
    ['90-day exposure', '$284,000', '47 managed records', 'High exposure'],
    ['30-day critical expirations', '12', '3 above $25,000 impact', 'Urgent'],
    ['Missing owners', '18', '14% of active portfolio', 'Needs assignment'],
    ['Margin at risk', '$18,400', 'Estimated gross margin exposure', 'Review']
  ];
  const derivedCards = isInternalIt ? [
    ['90-day renewal forecast', formatImportMoney(m.exposure90d), m.recordCount + ' records', 'Local'],
    ['Annual exposure', formatImportMoney(m.totalExposure), 'Across local IT records', 'Local'],
    ['Critical systems count', String(m.criticalCount), 'Derived risk: Critical', 'Local'],
    ['Missing owners', String(m.missingOwners), 'Records without an owner', 'Local']
  ] : [
    ['90-day exposure', formatImportMoney(m.exposure90d), m.recordCount + ' managed records', 'Local'],
    ['30-day critical expirations', String(m.expiringSoon30), 'Expiring within 30 days', 'Local'],
    ['Missing owners', String(m.missingOwners), 'Records without an owner', 'Local'],
    ['Margin at risk', formatImportMoney(m.marginAtRisk), 'On renewals within 90 days', 'Local']
  ];
  const cards = m.hasLocalData ? derivedCards : sampleCards;
  const caption = m.hasLocalData ? 'Local session metrics — not persisted.' : 'Sample data — not live metrics.';
  return <><section className="statsGrid" aria-label="Workspace summary">
    {cards.map(([label, value, note, badge]) => <article className="statCard" key={label}><span>{label}</span><strong>{value}</strong><p>{note}</p><Badge tone={badge}>{badge}</Badge></article>)}
  </section><p style={{margin:'2px 0 0',fontSize:11,color:'#94A3B8'}}>{caption}</p></>;
}

function MobileDashboard({ workspaceMode = 'MSP / Integrator' }){
  const [chip, setChip] = React.useState('All');
  const [showLater, setShowLater] = React.useState(false);
  const attentionFeed = [
    { type: 'ai', title: '18 records have no assigned owner', desc: 'AI proposals run on the backend — preview only in this sandbox.', action: 'Show me' },
    { type: 'expiration', severity: 'critical', badge: 'Expired', title: 'Dell R750 Warranty', context: 'Metro Retail · Expired 5 days ago', owner: 'Ana Ríos', ownerInitials: 'AR', action: 'Approve coverage' },
    { type: 'expiration', severity: 'critical', badge: '12 days', title: 'Wildcard SSL Certificate', context: 'Grupo Regency · Needs owner', owner: null, ownerInitials: '?', action: 'Assign owner' },
    { type: 'approval', severity: 'warning', badge: 'Pending', title: 'Microsoft 365 true-up', context: 'Canal Bank · $63K · 480 seats', owner: 'Elena Ruiz', ownerInitials: 'ER', action: 'Approve' },
    { type: 'task', severity: 'warning', badge: 'Overdue 2d', title: 'Send Trend Micro renewal quote', context: 'Banisi · Assigned to you', owner: 'María Chen', ownerInitials: 'MC', action: 'Mark done' }
  ];
  const upcomingFeed = [
    { type: 'expiration', severity: 'high', badge: '28 days', title: 'Trend Micro Vision One', context: 'Banisi · License · $42.8K', owner: 'María Chen', ownerInitials: 'MC', action: 'Review' },
    { type: 'contract', severity: 'medium', badge: 'May 2', title: 'Gold Support Contract', context: 'Banisi · Nextcom · Auto-renew', owner: 'Diego Paredes', ownerInitials: 'DP', action: 'Review' },
    { type: 'expiration', severity: 'medium', badge: 'May 19', title: 'Veeam Backup M365', context: 'Nova Finance · 250 mailboxes', owner: 'Tomás Vega', ownerInitials: 'TV', action: 'Renew' },
    { type: 'task', severity: 'medium', badge: 'Fri', title: 'Schedule QBR with Banisi', context: 'Q2 quarterly business review', owner: 'You', ownerInitials: 'YO', action: 'Schedule' }
  ];
  const browseShortcuts = [
    { label: 'Companies', count: '12 clients' },
    { label: 'Licenses', count: '4 expiring' },
    { label: 'Contracts', count: '23 active' },
    { label: 'Documents', count: '186 files' },
    { label: 'Tasks', count: '17 open' },
    { label: 'Reports', count: '8 scheduled' }
  ];
  const typeMeta = {
    expiration: { label: 'EXPIRATION', color: '#DC2626', bg: '#FEF2F2' },
    task: { label: 'TASK', color: '#D97706', bg: '#FFFBEB' },
    approval: { label: 'APPROVAL', color: '#6D28D9', bg: '#F5F3FF' },
    contract: { label: 'CONTRACT', color: '#1D4ED8', bg: '#EFF6FF' },
    ai: { label: 'Opriva AI · Preview', color: '#0D9488', bg: '#F0FDFA' },
    local: { label: 'LOCAL', color: '#0B1F3A', bg: '#EEF2F7' }
  };
  const renderCard = (item, idx) => {
    const meta = typeMeta[item.type] || typeMeta.expiration;
    const sevClass = item.severity ? `sev-${item.severity}` : '';
    if(item.type === 'ai'){
      return <div className="mdFeedCard mdCardAi" key={idx}>
        <span className="mdTypeChip" style={{color: meta.color, background: meta.bg}}>{meta.label}</span>
        <h3 className="mdCardTitle">{item.title}</h3>
        <p className="mdCardDesc">{item.desc}</p>
        <div className="mdCardFooter mdCardFooterAi">
          <button className="mdAction mdActionAi" type="button" disabled aria-disabled="true" title="Preview only — Opriva AI runs on the backend, not in the sandbox.">{item.action} →</button>
        </div>
      </div>;
    }
    if(item.type === 'local'){
      // C10b-4: derived local-session summary card (built from m.* only).
      // No owner row, no AI claim; action is disabled (Honest Sandbox).
      return <div className="mdFeedCard" key={idx}>
        <div className="mdCardTop">
          <span className="mdTypeChip" style={{color: meta.color, background: meta.bg}}>{meta.label}</span>
          {item.badge && <span className="mdBadge">{item.badge}</span>}
        </div>
        <h3 className="mdCardTitle">{item.title}</h3>
        <p className="mdCardContext">{item.desc}</p>
        {item.action && <div className="mdCardFooter mdCardFooterAi">
          <button className="mdAction" type="button" disabled aria-disabled="true" title="Preview only — local feed actions are not wired yet.">{item.action} →</button>
        </div>}
      </div>;
    }
    return <div className={`mdFeedCard ${sevClass}`} key={idx}>
      <div className="mdCardTop">
        <span className="mdTypeChip" style={{color: meta.color, background: meta.bg}}>{meta.label}</span>
        <span className={`mdBadge ${sevClass}`}>{item.badge}</span>
      </div>
      <h3 className="mdCardTitle">{item.title}</h3>
      <p className="mdCardContext">{item.context}</p>
      <div className="mdCardFooter">
        <div className="mdOwner">
          <div className={`mdAvatar ${item.owner ? '' : 'mdAvatarNoOwner'}`}>{item.ownerInitials}</div>
          <span className="mdOwnerName">{item.owner || 'Unassigned'}</span>
        </div>
        <button type="button" className={`mdAction ${item.severity === 'critical' ? 'mdActionCritical' : ''}`}>{item.action} →</button>
      </div>
    </div>;
  };
  // C10b-3: wire-only mobile hero metrics. Reuses getDashboardMetrics; selects
  // m.* and formats with formatImportMoney/String only (no inline arithmetic).
  // Trend deltas (e.g. "+8% vs last week") are dropped — they need backend history.
  const isInternalIt = workspaceMode === 'Internal IT';
  const m = getDashboardMetrics(workspaceMode);
  const sampleHero = isInternalIt ? [
    ['90-day renewal forecast', '$487,000', 'Next-quarter exposure', 'urgent'],
    ['Annual exposure', '$214,000', 'Total IT spend in scope', ''],
    ['Critical systems count', '6', 'Systems at critical risk', ''],
    ['Missing owners', '8', 'Records without an owner', '']
  ] : [
    ['90-day exposure', '$284,000', '47 managed records', 'urgent'],
    ['30-day critical expirations', '12', 'Expiring within 30 days', ''],
    ['Missing owners', '18', 'Records without an owner', ''],
    ['Margin at risk', '$18,400', 'Gross margin exposure', '']
  ];
  const derivedHero = isInternalIt ? [
    ['90-day renewal forecast', formatImportMoney(m.exposure90d), m.recordCount + ' records', 'urgent'],
    ['Annual exposure', formatImportMoney(m.totalExposure), 'Across local IT records', ''],
    ['Critical systems count', String(m.criticalCount), 'Derived risk: Critical', ''],
    ['Missing owners', String(m.missingOwners), 'Records without an owner', '']
  ] : [
    ['90-day exposure', formatImportMoney(m.exposure90d), m.recordCount + ' managed records', 'urgent'],
    ['30-day critical expirations', String(m.expiringSoon30), 'Expiring within 30 days', 'urgent'],
    ['Missing owners', String(m.missingOwners), 'Records without an owner', ''],
    ['Margin at risk', formatImportMoney(m.marginAtRisk), 'On renewals within 90 days', '']
  ];
  const heroStats = m.hasLocalData ? derivedHero : sampleHero;
  const metricsCaption = m.hasLocalData ? 'Local session metrics — not persisted.' : 'Sample data — not live metrics.';
  // C10b-4: when local records exist, replace the mock feed with a small derived
  // summary built ONLY from m.* (no row[i], no getImported*, no fabricated counts).
  // Mirrors the desktop pattern (local -> derived, else sample). Card actions are
  // disabled (Honest Sandbox); margin is shown for MSP only and only when positive.
  const plural = (n, noun) => n + ' ' + noun + (n === 1 ? '' : 's');
  const localFeed = [];
  if (m.missingOwners > 0) localFeed.push({ type: 'local', badge: 'Owners', title: plural(m.missingOwners, 'record') + ' missing an owner', desc: 'Assign owners to keep renewal accountability clear.', action: 'Assign owners' });
  if (m.expiringSoon30 > 0) localFeed.push({ type: 'local', badge: '30 days', title: plural(m.expiringSoon30, 'record') + ' expiring within 30 days', desc: 'Review upcoming expirations before they lapse.', action: 'Review renewals' });
  if (m.criticalCount > 0) localFeed.push({ type: 'local', badge: 'Critical', title: plural(m.criticalCount, 'record') + ' at critical risk', desc: 'Derived risk: Critical (overdue, ≤7 days, or critical record).', action: 'Review risk' });
  if (m.exposure90d > 0) localFeed.push({ type: 'local', badge: '90 days', title: formatImportMoney(m.exposure90d) + ' exposure in the next 90 days', desc: plural(m.recordCount, 'local record') + ' in scope.', action: 'Review exposure' });
  if (!isInternalIt && m.marginAtRisk > 0) localFeed.push({ type: 'local', badge: 'Margin', title: formatImportMoney(m.marginAtRisk) + ' margin at risk', desc: 'Gross margin exposure on renewals within 90 days.', action: 'Review margin' });
  if (localFeed.length === 0) localFeed.push({ type: 'local', badge: 'Local', title: 'No renewal signals in the next 90 days', desc: 'Local records show no owner gaps, upcoming expirations or critical risk.', action: null });
  const activeFeed = m.hasLocalData ? localFeed : attentionFeed;
  return <main className="content mobileDashboard">
    <div className="mdGreeting">
      <span className="mdSalute">Good morning</span>
      <h1>{m.hasLocalData ? 'Local session feed' : '4 things need you'}</h1>
    </div>
    <div className="mdHeroStats">
      {heroStats.map(([label, value, sub, cls]) => <div className={cx('mdHeroStat', cls)} key={label}>
        <span className="mdStLbl">{label}</span>
        <span className="mdStVal">{value}</span>
        <span className="mdStDelta">{sub}</span>
      </div>)}
    </div>
    <p style={{margin:'-2px 0 2px',fontSize:11,color:'#94A3B8'}}>{metricsCaption}</p>
    <div className="mdChips" role="tablist" aria-label="Filter feed">
      {['All','Mine','Critical','Today','This week'].map(c => (
        <button key={c} type="button" role="tab" aria-selected={chip===c} className={`mdChip ${chip===c?'active':''}`} onClick={()=>setChip(c)}>{c}</button>
      ))}
    </div>
    {!m.hasLocalData && <p style={{margin:'0 0 6px',fontSize:11,color:'#94A3B8'}}>Sample feed — not live items.</p>}
    <div className="mdSectionHeader">
      <span className="mdIndicator" aria-hidden="true"></span>
      <strong>{m.hasLocalData ? 'Local session signals' : 'Needs action now'}</strong>
      <em>{activeFeed.length}</em>
    </div>
    <div className="mdFeedList">{activeFeed.map(renderCard)}</div>
    {!m.hasLocalData && <>
      <div className="mdSectionHeader mdSectionWarning">
        <span className="mdIndicator" aria-hidden="true"></span>
        <strong>Upcoming this week</strong>
        <em>{upcomingFeed.length}</em>
      </div>
      <div className="mdFeedList">{upcomingFeed.map(renderCard)}</div>
      {!showLater && <button type="button" className="mdLaterToggle" onClick={()=>setShowLater(true)}>Show 14 more later this quarter ▾</button>}
    </>}
    <div className="mdBrowseSection">
      <div className="mdSectionHeader mdSectionNeutral">
        <span className="mdIndicator" aria-hidden="true"></span>
        <strong>Browse</strong>
      </div>
      <div className="mdBrowseGrid">
        {browseShortcuts.map(s => (
          <button key={s.label} type="button" className="mdBrowseCard">
            <strong>{s.label}</strong>
            {!m.hasLocalData && <span>{s.count}</span>}
          </button>
        ))}
      </div>
    </div>
  </main>;
}

function Dashboard({ workspaceMode = 'MSP / Integrator', setWorkspaceMode = function(){} }){
  const vp = useViewport();
  if(vp === 'mobile') return <MobileDashboard workspaceMode={workspaceMode} />;
  const isInternalIt = workspaceMode === 'Internal IT';

  const importedPriorityRows = getImportedDashboardPriorityRows(workspaceMode);
  const basePriorityRows = isInternalIt ? [
    ['Oracle POS Support','Support','Oracle','Oracle Direct / Nextcom','Jul 18, 2026','$96,000','Retail Operations','Confirm budget owner'],
    ['Microsoft 365 Enterprise','License','Microsoft','Nextcom','Jun 30, 2026','$142,000','Finance','Prepare CIO approval'],
    ['Kaspersky Endpoint Security','Security License','Kaspersky','Local Security Provider','Jun 22, 2026','$82,000','IT Security','Compare consolidation'],
    ['Fortinet Firewall Warranty','Warranty','Fortinet','Nextcom','Jul 5, 2026','$48,000','Infrastructure','Request renewal quote'],
    ['Cloud Storage Platform','Cloud service','Cloud Storage','Cloud Provider Direct','Aug 10, 2026','$119,000','Operations','Review usage forecast']
  ] : [
    ['Grupo Regency','Microsoft','M365 Enterprise','Licencias Online','Jun 30, 2026','$142,000','$24,000','Ana Ruiz','Prepare renewal'],
    ['Banisi','Trend Micro','Vision One','TD Synnex','May 26, 2026','$42,800','$11,500','Unassigned','Assign owner'],
    ['EYCA','Fortinet','FortiGate','Ingram Micro','Jun 7, 2026','$18,600','$4,200','Luis Mora','Request quote'],
    ['Metro Retail Group','Dell','Server Warranty','Dell Direct','Jul 18, 2026','$22,400','$3,800','María Chen','Validate warranty'],
    ['Multiple Clients','DigiCert','SSL Certs','Intcomex','May 23, 2026','$3,200','$850','Unassigned','Renew certs']
  ];
  const priorityRows = importedPriorityRows.length ? importedPriorityRows : basePriorityRows;
  const priorityColumns = isInternalIt ? ['Record','Type','Brand','Provider','Renewal','Value','Department','Action'] : ['Client','Brand','Product','Distributor','Renewal','Value','Margin','Owner','Action'];
  const dashboardSubtitle = isInternalIt ? 'Control IT assets, provider renewals, budget exposure and operational risk across departments.' : undefined;
  return <main className="content dashboardContent"><ScreenHeader active="Dashboard" eyebrow={isInternalIt ? 'INTERNAL IT COMMAND CENTER' : undefined} subtitle={dashboardSubtitle}><button>Import records</button><button className="primary">Review exposure</button></ScreenHeader><StatCards workspaceMode={workspaceMode}/><section className="dashboardStack"><article className="panel aiRiskPanel">{isInternalIt ? <><div style={{display:'grid', gridTemplateColumns:'minmax(220px, 0.9fr) minmax(320px, 1.6fr) auto', gap:18, alignItems:'center', width:'100%'}}><div style={{display:'grid', gap:5}}><span style={{display:'inline-flex', alignItems:'center', gap:7, color:'#0D9488', fontSize:12, fontWeight:850, letterSpacing:'.04em', textTransform:'uppercase'}}><span style={{width:7, height:7, borderRadius:999, background:'#0D9488', boxShadow:'0 0 0 3px rgba(13,148,136,.10)'}} aria-hidden="true"></span>Opriva AI · Preview</span><strong style={{color:'#0B1F3A', fontSize:19, lineHeight:1.18, letterSpacing:'-.025em'}}>$487K in renewal exposure across 90 days</strong></div><div style={{display:'grid', gap:5, color:'#475569', fontSize:13, lineHeight:1.45}}><span>Finance and Retail Operations carry the largest department impact.</span><span style={{color:'#64748B'}}>Endpoint security and cloud storage show consolidation opportunities for CIO approval.</span></div><div className="compactActions" style={{justifyContent:'flex-end', flexWrap:'wrap'}}><button className="primary" type="button">Review forecast</button><button type="button">Review approvals</button><button type="button">Find consolidation</button></div></div></> : <><div style={{display:'grid', gridTemplateColumns:'minmax(220px, 0.9fr) minmax(320px, 1.6fr) auto', gap:18, alignItems:'center', width:'100%'}}><div style={{display:'grid', gap:5}}><span style={{display:'inline-flex', alignItems:'center', gap:7, color:'#0D9488', fontSize:12, fontWeight:850, letterSpacing:'.04em', textTransform:'uppercase'}}><span style={{width:7, height:7, borderRadius:999, background:'#0D9488', boxShadow:'0 0 0 3px rgba(13,148,136,.10)'}} aria-hidden="true"></span>Opriva AI · Preview</span><strong style={{color:'#0B1F3A', fontSize:19, lineHeight:1.18, letterSpacing:'-.025em'}}>$64K margin at risk across 12 client renewals</strong></div><div style={{display:'grid', gap:5, color:'#475569', fontSize:13, lineHeight:1.45}}><span>Microsoft, Trend Micro and Fortinet drive the highest renewal exposure.</span><span style={{color:'#64748B'}}>Recommended next step: assign owners and request distributor quotes today.</span></div><div className="compactActions" style={{justifyContent:'flex-end', flexWrap:'nowrap'}}><button className="primary" type="button">Review risk</button><button type="button">Create tasks</button></div></div></>}</article><article className="panel priorityQueuePanel"><div className="panelTitle"><h2>Priority action queue</h2><span>{isInternalIt ? 'Internal renewals prioritized by budget impact, brand/provider dependency, department and approval blockers.' : 'Client renewals prioritized by value, margin exposure, distributor dependency and ownership gaps.'}</span></div><div className={cx('tableWrap priorityQueueWrap', !isInternalIt && 'priorityQueueWrapMsp')}><table className={cx('priorityQueueTable', !isInternalIt && 'priorityQueueTableMsp')}><thead><tr>{priorityColumns.map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{priorityRows.map(row=><tr key={row[0]}>{row.map((cell,index)=>{ const ownerIndex = isInternalIt ? 6 : 7; const actionIndex = isInternalIt ? 7 : 8; return <td key={index} className={cx(index===0 && 'recordCell', index===1 && 'compactCell', index===2 && 'compactCell', index===4 && 'compactCell', index===5 && 'compactCell', index===6 && 'compactCell', index===7 && !isInternalIt && 'compactCell', index===actionIndex && 'actionCell')}>{index===ownerIndex && cell==='Unassigned' ? <Badge tone="Warning">Unassigned</Badge> : index===actionIndex ? <button type="button" className="rowAction">{cell}</button> : cell}</td>; })}</tr>)}</tbody></table></div></article></section></main>;
}

function AttentionCenter({ workspaceMode = 'MSP / Integrator' }){
  const isInternalIt = workspaceMode === 'Internal IT';
  // C10c-2: binary swap of the Attention summary stat-grid (sample <-> derived),
  // mirroring C10b-2 StatCards. Derived cards read ONLY existing getDashboardMetrics
  // fields (no inline arithmetic, no dashboardMetrics changes). AI insight bar,
  // workflow rows and issue groups remain sample and are untouched.
  const m = getDashboardMetrics(workspaceMode);
  const sampleSummary = isInternalIt ? [
    ['Critical renewals', '12', '$84,600 exposed in 30 days', 'Urgent'],
    ['Missing owners', '18', '14% of active portfolio', 'Assign'],
    ['Missing evidence', '7', 'Contracts or documents required', 'Evidence needed'],
    ['Pending approvals', '9', 'Budget or CIO approvals waiting', 'Review']
  ] : [
    ['Client renewals at risk', '12', '$84,600 exposed in 30 days', 'Urgent'],
    ['Margin at risk', '$18,400', 'Estimated gross margin exposure', 'Review'],
    ['Unassigned owners', '18', 'Need commercial owner', 'Assign'],
    ['Distributor quote blockers', '7', 'Quotes required before proposal', 'Request quotes']
  ];
  const derivedSummary = isInternalIt ? [
    ['Critical risk', String(m.criticalCount), 'Derived risk: Critical', 'Local'],
    ['Missing owners', String(m.missingOwners), 'Records without an owner', 'Local'],
    ['90-day exposure', formatImportMoney(m.exposure90d), m.recordCount + ' records', 'Local'],
    ['Expiring ≤30d', String(m.expiringSoon30), 'Expiring within 30 days', 'Local']
  ] : [
    ['Renewals at risk', String(m.expiringSoon30), 'Expiring within 30 days', 'Local'],
    ['Margin at risk', formatImportMoney(m.marginAtRisk), 'On renewals within 90 days', 'Local'],
    ['Missing owners', String(m.missingOwners), 'Records without an owner', 'Local'],
    ['90-day exposure', formatImportMoney(m.exposure90d), m.recordCount + ' managed records', 'Local']
  ];
  const attentionSummary = m.hasLocalData ? derivedSummary : sampleSummary;
  const summaryCaption = m.hasLocalData ? 'Local session metrics — not persisted.' : 'Sample data — not live metrics.';
  const aiInsightText = isInternalIt
    ? 'Opriva found 12 critical renewal issues. The fastest risk reduction path is to assign 5 owners, request 7 missing documents and open approval blockers for high-value records.'
    : 'Opriva found 12 client renewals needing commercial action. $64K margin is at risk across owner gaps, missing distributor quotes and overdue client follow-up. Start by assigning owners and requesting distributor quotes for high-value renewals.';
  const aiInsightActions = isInternalIt
    ? ['Assign owners', 'Request documents', 'Open blockers']
    : ['Assign owners', 'Request distributor quotes', 'Prepare client follow-up'];
  const workflowTabs = isInternalIt
    ? ['Critical','Approval blockers','Missing owners','Missing evidence','Escalations']
    : ['Critical','Margin at risk','Missing owners','Distributor quotes','Client follow-up'];
  const workflowFilterPlaceholder = isInternalIt
    ? 'Filter issues by record, brand, provider, department, owner or status…'
    : 'Filter client renewals by client, brand, product, distributor, owner or status...';
  const workflowSavedView = isInternalIt ? 'Saved view: Critical this week' : 'Saved view: Critical renewals this week';
  const workflowFilters = isInternalIt ? ['Severity', 'Owner', 'Bulk actions'] : ['Severity', 'Owner', 'Distributor', 'Bulk actions'];
  const workflowColumns = isInternalIt
    ? ['Issue / Record','Brand','Provider','Impact','Due','Owner','Recommended action','Status']
    : ['Issue / Client Renewal','Client','Brand / Product','Distributor','Value','Margin','Due','Owner','Recommended action','Status'];
  const workflowRows = isInternalIt ? [
    ['Renewal expires in 12 days','Oracle POS Support','Oracle','Oracle Direct / Nextcom','$96,000','Jul 18, 2026','Unassigned','Confirm budget owner','Critical'],
    ['Approval blocker','Microsoft 365 Enterprise','Microsoft','Nextcom','$142,000','Jun 30, 2026','Ana Ruiz','Prepare CIO approval','High'],
    ['Evidence missing','SSL Wildcard Certificate','DigiCert','Nextcom','$3,200','May 23, 2026','Unassigned','Renew certificate','Critical'],
    ['Provider quote required','Fortinet Firewall Warranty','Fortinet','Nextcom','$48,000','Jul 5, 2026','Luis Mora','Request renewal quote','High'],
    ['Consolidation candidate','Kaspersky Endpoint Security','Kaspersky','Local Security Provider','$82,000','Jun 22, 2026','Ana Ruiz','Compare consolidation','High']
  ] : [
    ['Owner missing','Grupo Regency','Microsoft / M365 Enterprise','Licencias Online','$142,000','$24,000','Jun 30, 2026','Unassigned','Assign commercial owner','Critical'],
    ['Distributor quote needed','Banisi','Trend Micro / Vision One','TD Synnex','$42,800','$11,500','May 26, 2026','María Chen','Request distributor quote','High'],
    ['Margin review required','EYCA','Fortinet / FortiGate','Ingram Micro','$18,600','$4,200','Jun 7, 2026','Luis Mora','Validate margin','High'],
    ['Warranty renewal follow-up','Metro Retail Group','Dell / Server Warranty','Dell Direct','$22,400','$3,800','Jul 18, 2026','María Chen','Confirm client approval','Medium'],
    ['Certificate renewal urgent','Multiple Clients','DigiCert / SSL Certs','Intcomex','$3,200','$850','May 23, 2026','Unassigned','Renew certificates','Critical']
  ];
  const issueGroupsHelper = isInternalIt
    ? 'Grouped by approval blockers, provider dependency, evidence gaps and department exposure.'
    : 'Grouped by margin exposure, distributor blockers, owner gaps and client follow-up urgency.';
  const issueGroupsRowsIt = [
    ['Approval blockers for high-value renewals','3','CIO approval delay','Finance','Escalate today'],
    ['Missing contract evidence','7','Audit and renewal risk','IT Operations','Request documents'],
    ['Provider quote dependency','4','Renewal preparation delay','Procurement','Request quotes'],
    ['Endpoint security consolidation','3','Cost optimization opportunity','IT Security','Compare providers']
  ];
  const issueGroupsRowsMsp = [
    ['Unassigned high-value renewals','3','$24,000 margin at risk','Sales Operations','Assign owners','Open'],
    ['Distributor quote blockers','7','Proposal preparation delay','Procurement','Request quotes','Open'],
    ['Margin at risk','4','Gross margin exposure','Commercial Manager','Review margin','Open'],
    ['Client follow-up overdue','5','Renewal delay risk','Account Owners','Prepare follow-up','Open'],
    ['Certificate and warranty urgency','3','Service continuity risk','Sales Operations','Escalate today','Open']
  ];
  return <main className="content attentionContent"><ScreenHeader active="Attention Center" subtitle="Resolve critical renewals, ownership gaps, missing evidence and approval blockers before they become financial or operational risk."><button>Assign owners</button><button className="primary">Create task</button></ScreenHeader><section className="statsGrid attentionSummaryGrid" aria-label="Attention Center summary">{attentionSummary.map(([label, value, note, badge]) => <article className="statCard" key={label}><span>{label}</span><strong>{value}</strong><p>{note}</p><Badge tone={badge}>{badge}</Badge></article>)}</section><p style={{margin:'2px 0 6px',fontSize:11,color:'#94A3B8'}}>{summaryCaption}</p><div className="aiInsightBar attentionInsightBar" aria-label="Attention Center AI insight"><div className="aiInsightBarLeft"><span className="aiInsightBarLabel">AI insight (sample)</span><p className="aiInsightBarText">{aiInsightText}</p></div><div className="aiInsightBarActions">{aiInsightActions.map(action => <button key={action}>{action}</button>)}</div></div><section className="panel"><div className="panelTitle"><h2>Attention workflow</h2><span>Saved views, issue grouping and bulk operations</span></div><div className="tabs">{workflowTabs.map((label, idx) => <button key={label} className={idx === 0 ? 'active' : ''}>{label}</button>)}</div><div className="toolbar"><input placeholder={workflowFilterPlaceholder}/><button>{workflowSavedView}</button>{workflowFilters.map(filter => <button key={filter}>{filter}</button>)}<button>Configure columns</button><button>AI summary</button></div><div className="tableWrap attentionWorkflowWrap"><table className={cx('attentionWorkflowTable', isInternalIt && 'attentionWorkflowTableIt')}><thead><tr>{workflowColumns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{workflowRows.map(row => isInternalIt ? <tr key={row[1]}><td className="issueRecordCell"><span>{row[0]}</span><strong>{row[1]}</strong></td><td className="compactCell">{row[2]}</td><td className="compactCell">{row[3]}</td><td className="compactCell">{row[4]}</td><td className="dateCell">{row[5]}</td><td className="compactCell">{row[6]==='Unassigned' ? <Badge tone="Needs assignment">Unassigned</Badge> : row[6]}</td><td className="actionCell"><button type="button" className="rowAction">{row[7]}</button></td><td className="compactCell"><Badge tone={row[8]}>{row[8]}</Badge></td></tr> : <tr key={`${row[0]}-${row[1]}`}><td className="issueRecordCell"><strong>{row[0]}</strong></td><td className="compactCell">{row[1]}</td><td className="compactCell">{row[2]}</td><td className="compactCell">{row[3]}</td><td className="compactCell">{row[4]}</td><td className="compactCell">{row[5]}</td><td className="dateCell">{row[6]}</td><td className="compactCell">{row[7]==='Unassigned' ? <Badge tone="Needs assignment">Unassigned</Badge> : row[7]}</td><td className="actionCell"><button type="button" className="rowAction">{row[8]}</button></td><td className="compactCell"><Badge tone={row[9]}>{row[9]}</Badge></td></tr>)}</tbody></table></div></section><section className="panel"><div className="panelTitle"><h2>Issue groups</h2><span>{issueGroupsHelper}</span></div>{isInternalIt ? <div className="tableWrap"><table><thead><tr>{['Group','Count','Business impact','Primary owner','Action','Open'].map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{issueGroupsRowsIt.map(row => <tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td className="actionCell"><button type="button" className="rowAction">{row[4]}</button></td><td className="actionCell"><button type="button" className="rowAction" aria-label={`Open ${row[0]}`}>Open</button></td></tr>)}</tbody></table></div> : <Table columns={['Group','Count','Business impact','Primary owner','Action','Status']} rows={issueGroupsRowsMsp}/>}</section></main>;
}

function SearchScreen(){
  const modes = ['All','Records','Clients','Assets & Renewals','Documents','Tasks'];
  const suggestions = ['Critical renewals next 30 days','Records missing owners','Missing renewal documents','Vendors above $25K exposure'];
  const results = [
    ['Contract','Dell Support Contract','Banisi','Critical · May 26, 2026 · $42,800','Unassigned','Assign owner'],
    ['Certificate','SSL Wildcard Certificate','Grupo Regency','Critical · May 23, 2026 · $3,200','Unassigned','Prepare renewal'],
    ['License','Microsoft 365 Renewal','Banisi','High · Jun 1, 2026 · $31,200','Ana Ruiz','Prepare email'],
    ['Warranty','Fortinet Warranty','Metro Retail Group','High · Jun 7, 2026 · $18,600','Luis Mora','Request quote'],
    ['Document','Trend Micro Renewal Quote.pdf','Microsoft 365 Renewal','Linked to renewal','María Chen','Open document'],
    ['Report','Q2 Renewal Exposure Report','All clients','Ready','María Chen','Open report']
  ];
  return <main className="content searchCommandPage"><ScreenHeader active="Search" subtitle="Find anything across the workspace or ask an operational question."/><section className="searchHero searchCommandHero"><label className="commandInputWrap"><input aria-label="Search Opriva" placeholder="Search records, clients, vendors, owners, documents or ask a question..."/><span aria-hidden="true">⌘K</span></label><button className="primary">Search</button></section><section className="searchModesPanel" aria-label="Search modes"><div className="searchModeInline">{modes.map((mode,i)=><button key={mode} className={i===0?'active':''}>{mode}</button>)}</div><div className="suggestedQuestions" aria-label="Suggested questions"><span>Suggested questions</span>{suggestions.map(chip=><button key={chip}>{chip}</button>)}</div></section><section className="panel searchResultsPanel"><div className="panelTitle"><h2>Results</h2><span>Best matches across records, clients, documents and workflow items.</span></div><div className="tableWrap"><table><thead><tr>{['Type','Result','Context','Risk / Status','Owner','Quick action'].map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{results.map(row=><tr key={row[1]}><td>{row[0]}</td><td className="recordCell">{row[1]}</td><td>{row[2]}</td><td><Badge tone={row[3]}>{row[3]}</Badge></td><td>{row[4] === 'Unassigned' ? <Badge tone="Needs assignment">Unassigned</Badge> : row[4]}</td><td className="actionCell"><button type="button" className="rowAction">{row[5]}</button></td></tr>)}</tbody></table></div></section></main>;
}

function CompaniesScreen({ workspaceMode = 'MSP / Integrator' }){
  const isInternalIT = workspaceMode === 'Internal IT';
  const [tab, setTab] = React.useState('Companies');
  const importedClientRows = getImportedClientRows(workspaceMode);
  const companyRecords = [['Trend Micro renewal','Renewal','May 2, 2026','High','María Chen','Open'],['Vision One Credits','License','1,200 credits','High','María Chen','Open'],['Dell Support Contract','Contract','May 26, 2026','Critical','Unassigned','Assign owner'],['Renewal Quote.pdf','Document','Version 2','Linked','María Chen','Open']];
  const departmentRows = [
    ['Retail Operations','Laura Méndez','Oracle, Microsoft, Cloud Storage','18','$156,000','2','High','Confirm owner'],
    ['Finance','Carlos Vega','Microsoft, Broadcom, DigiCert','14','$112,000','1','High','Prepare approval'],
    ['IT Security','Ana Ruiz','Kaspersky, Trellix, Fortinet','21','$98,000','2','High','Review consolidation'],
    ['Infrastructure','Luis Mora','Fortinet, HPE, Dell','16','$74,000','0','Medium','Request quote'],
    ['Digital Channels','María Chen','DigiCert, Cloud Storage, Microsoft','9','$38,000','1','Medium','Renew certificate'],
    ['Logistics','Pedro Santos','Trellix, Oracle','7','$31,000','0','Medium','Validate usage'],
    ['Corporate IT','Miguel Castillo','Microsoft, Adobe, Cloud Storage','22','$89,000','0','Low','Renewal plan'],
    ['Operations','Sofia García','Cloud Storage, Oracle','11','$45,000','1','Medium','Review forecast']
  ];
  const departmentRecords = [
    ['Oracle POS Support','Support','Retail Operations','$96,000','Pending','Confirm budget owner'],
    ['Endpoint security overlap','License','IT Security / Finance / Logistics','$175,800','High','Review consolidation'],
    ['SSL Wildcard Certificate','Certificate','Digital Channels','$3,200','Approval needed','Renew certificate'],
    ['Cloud Storage Platform','Cloud service','Operations','$119,000','Pending','Review usage forecast']
  ];
  if (isInternalIT) {
    const visibleDepartmentRows = importedClientRows.length ? importedClientRows : departmentRows;
    return <main className="content companiesClientsPage departmentsReadabilityPage"><ScreenHeader active="Departments" eyebrow="DEPARTMENT PORTFOLIO" subtitle="Track IT ownership, renewal exposure, brand and provider coverage, and operational risk across business areas."><button>Import departments</button><button>Configure fields</button><button className="primary">New department</button></ScreenHeader><section className="statsGrid" aria-label="Department portfolio summary">{[['Departments tracked',String(8 + importedClientRows.length),'Business areas in IT scope'],['90-day department exposure','$487K','Upcoming renewal exposure'],['Approval blockers','5','Renewals waiting on approval'],['Highest impact area','Retail Operations','Largest exposed department']].map(stat=><article className="statCard" key={stat[0]}><span>{stat[0]}</span><strong>{stat[1]}</strong><p>{stat[2]}</p></article>)}</section><p style={{margin:'2px 0 6px',fontSize:11,color:'#94A3B8'}}>Sample data — not live metrics.</p><div className="tabs" role="tablist" aria-label="Department filters">{['All','High exposure','Approval blockers','Security impact'].map((filter,index)=><button key={filter} className={index===0?'active':''}>{filter}</button>)}</div><section className="panel clientPortfolioPanel"><div className="toolbar"><input placeholder="Filter departments by name, owner, brand, provider, exposure or risk..."/><button>Owner</button><button>Brand / Provider</button><button>Risk</button><button>CIO view</button></div><div className="aiInsightBar assetsInsightBar"><p><strong>AI Insight (sample)</strong> Retail Operations and Finance carry the highest renewal exposure this quarter. Endpoint security brands overlap across departments, creating a provider consolidation opportunity before CIO approval.</p><div className="compactActions"><button>Review department exposure</button><button>Find brand/provider overlap</button><button>Prepare CIO summary</button></div></div><div className="panelTitle"><h2>Department portfolio</h2><span>{importedClientRows.length ? 'Showing local sandbox records. Demo data is used only when no local records exist.' : 'Departments prioritized by budget exposure, renewal pressure, approval blockers and operational risk.'}</span></div><div className="tableWrap departmentsTableScroll"><table><thead><tr>{['Department','Owner','Brands & Providers','Records','90-day exposure','Blockers','Risk','Action'].map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{visibleDepartmentRows.map(row=><tr key={row[0]}><td className="recordCell">{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td>{row[5]}</td><td><Badge tone={row[6]}>{row[6]}</Badge></td><td className="actionCell"><button type="button" className="rowAction">{row[7]}</button></td></tr>)}</tbody></table></div></section><section className="panel selectedClientPanel"><div className="panelTitle"><h2>Selected department overview</h2><span>Secondary detail for the selected business area.</span></div><div className="selectedDepartmentOverview" aria-label="Selected department details"><div className="selectedDepartmentRow">{[['Department name','Retail Operations'],['IT owner','Laura Méndez'],['Renewal exposure','$156,000'],['Open approvals','2']].map(item=><article className="selectedDepartmentItem" key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong></article>)}</div><div className="selectedDepartmentRow selectedDepartmentRowWide">{[['Brands & Providers','Oracle, Microsoft, Cloud Storage'],['Recommended next action','Confirm owner']].map(item=><article className="selectedDepartmentItem" key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong></article>)}</div></div><div className="tableWrap compactClientPreview relatedDepartmentRecords"><table><thead><tr>{['Related record','Type','Department','Renewal exposure','Approval','Recommended next action'].map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{departmentRecords.map(row=><tr key={row[0]}>{row.map((cell,index)=><td key={index} className={cx(index===0 && 'recordCell', index===5 && 'actionCell')}>{index===4 ? <Badge tone={cell}>{cell}</Badge> : index===5 ? <button type="button" className="rowAction subtleRowAction">{cell}</button> : cell}</td>)}</tr>)}</tbody></table></div></section></main>;
  }
  const visibleCompanies = importedClientRows.length ? importedClientRows : companies;
  return <main className="content companiesClientsPage"><ScreenHeader active="Companies / Clients" subtitle="Manage client context, contacts, ownership, renewal exposure and related records from one workspace."><button>Configure columns</button><button className="primary">Add company</button></ScreenHeader><div className="tabs" role="tablist"><button className={tab==='Companies'?'active':''} onClick={()=>setTab('Companies')}>Companies</button><button className={tab==='Contacts'?'active':''} onClick={()=>setTab('Contacts')}>Contacts</button><button>Exposure</button><button>Documents</button></div><section className="panel clientPortfolioPanel"><div className="toolbar"><input placeholder="Search companies, contacts or domains…"/><button>Saved view: High exposure</button><button>Filters</button><button>Columns</button></div>{tab==='Contacts' ? <><div className="panelTitle"><h2>Key contacts</h2><span>Technical, commercial and legal owners per client</span></div><Table columns={['Contact','Company','Role','Email','Contact type','Responsibility']} rows={contacts}/></> : <><div className="panelTitle"><h2>Client portfolio</h2><span>{importedClientRows.length ? 'Showing local sandbox records. Demo data is used only when no local records exist.' : 'Client-level exposure, ownership and upcoming renewal pressure.'}</span></div><Table columns={['Company','Segment','Main contact','Opriva owner','Managed records','Renewal pressure','Exposure','Risk']} rows={visibleCompanies}/></>}</section><section className="panel selectedClientPanel"><div className="panelTitle"><h2>Selected client preview</h2><span>Key records, documents and actions linked to the selected client.</span></div><div className="tableWrap compactClientPreview"><table><thead><tr>{['Record','Type','Detail','Risk / status','Owner','Action'].map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{companyRecords.map(row=><tr key={row[0]}>{row.map((cell,index)=><td key={index} className={cx(index===0 && 'recordCell', index===5 && 'actionCell')}>{index===3 ? <Badge tone={cell}>{cell}</Badge> : index===4 && cell==='Unassigned' ? <Badge tone="Needs assignment">Unassigned</Badge> : index===5 ? <button type="button" className="rowAction subtleRowAction">{cell}</button> : cell}</td>)}</tr>)}</tbody></table></div></section></main>;
}

const MASTER_DATA = {
  companies:        ['Banisi','Canal Bank','Grupo Regency','Nova Finance','Global Logistics','Metro Retail Group','EYCA'],
  departments:      ['Finance','Infrastructure','Retail Operations','Digital Channels','IT Security','Corporate IT'],
  vendors:          ['Microsoft','Trend Micro','Veeam','Fortinet','Dell','HP','Cisco','Apple','Oracle','CrowdStrike','DigiCert'],
  providers:        ['TD Synnex','Ingram Micro','Intcomex','Licencias Online','Dell Direct','Apple Direct','Oracle Direct','Local reseller','Nextcom'],
  users:            ['Maria Chen','Luis Mora','Rafael Soto','Ana Rios','Carlos Vega','Unassigned'],
  products: [
    { id: 'prod-ms365',        name: 'Microsoft 365 Enterprise',          brand: 'Microsoft',   category: 'Productivity / SaaS',  type: 'License',     defaultRenewalType: 'Manual renewal', defaultTerm: '1 year', defaultDistributor: 'Licencias Online', suggestedProviders: ['Licencias Online','TD Synnex','Nextcom'] },
    { id: 'prod-trend-vision', name: 'Trend Micro Vision One',            brand: 'Trend Micro', category: 'Cybersecurity',         type: 'License',     defaultRenewalType: 'Manual renewal', defaultTerm: '1 year', defaultDistributor: 'TD Synnex',        suggestedProviders: ['TD Synnex','Licencias Online','Intcomex'] },
    { id: 'prod-veeam',        name: 'Veeam Backup & Replication',        brand: 'Veeam',       category: 'Backup / Recovery',     type: 'License',     defaultRenewalType: 'Manual renewal', defaultTerm: '1 year', defaultDistributor: 'Ingram Micro',     suggestedProviders: ['Ingram Micro','TD Synnex'] },
    { id: 'prod-fortigate',    name: 'FortiGate Security Bundle',         brand: 'Fortinet',    category: 'Network Security',      type: 'License',     defaultRenewalType: 'Auto-renews',    defaultTerm: '1 year', defaultDistributor: 'Ingram Micro',     suggestedProviders: ['Ingram Micro','Nextcom','Intcomex'] },
    { id: 'prod-dell-r750',    name: 'Dell PowerEdge R750',               brand: 'Dell',        category: 'Hardware / Warranty',   type: 'Warranty',    defaultRenewalType: 'Manual renewal', defaultTerm: '3 years', defaultDistributor: 'Dell Direct',     suggestedProviders: ['Dell Direct','Ingram Micro'] },
    { id: 'prod-hp-dl380',     name: 'HP ProLiant DL380',                 brand: 'HP',          category: 'Hardware / Warranty',   type: 'Warranty',    defaultRenewalType: 'Manual renewal', defaultTerm: '3 years', defaultDistributor: 'Ingram Micro',    suggestedProviders: ['Ingram Micro','TD Synnex'] },
    { id: 'prod-cisco-9300',   name: 'Cisco Catalyst 9300',               brand: 'Cisco',       category: 'Network / Switch',      type: 'License',     defaultRenewalType: 'Auto-renews',    defaultTerm: '1 year', defaultDistributor: 'Ingram Micro',     suggestedProviders: ['Ingram Micro','TD Synnex','Intcomex'] },
    { id: 'prod-digicert-ssl', name: 'DigiCert Wildcard SSL',             brand: 'DigiCert',    category: 'Certificates',          type: 'Certificate', defaultRenewalType: 'Manual renewal', defaultTerm: '1 year', defaultDistributor: 'Intcomex',         suggestedProviders: ['Intcomex','Licencias Online','Nextcom'] },
    { id: 'prod-crowdstrike',  name: 'CrowdStrike Endpoint Protection',   brand: 'CrowdStrike', category: 'Cybersecurity',         type: 'License',     defaultRenewalType: 'Manual renewal', defaultTerm: '1 year', defaultDistributor: 'TD Synnex',        suggestedProviders: ['TD Synnex','Ingram Micro'] },
  ],
  relatedContracts: ['Gold Support Contract','Microsoft Enterprise Agreement','SOC Monitoring MSA','Trend Micro Vision One Renewal','Oracle POS Support'],
  relatedDocuments: ['Signed contract PDF','Vendor quote','License certificate','Warranty document','Purchase order','Invoice','Compliance evidence'],
};

function resolveFieldOptions(source, workspaceMode) {
  if (source === 'clientDepartment') {
    return workspaceMode === 'Internal IT' ? MASTER_DATA.departments : MASTER_DATA.companies;
  }
  if (source === 'products') {
    return MASTER_DATA.products.map(function(p) { return p.name; });
  }
  if (source === 'linkedRecords') {
    // Real cross-module records for the Documents "Linked Record" picker
    // (Licenses / Hardware / Contracts). Documents are excluded to avoid a
    // document linking to itself. Each option keeps the readable record name
    // as its value (what the "Linked record" column stores) and shows a richer
    // "Name · Module · Client" label, so selection round-trips on edit without
    // changing the shared save path.
    return collectLinkedRecordOptions(workspaceMode, 'documents').map(function(o) {
      return { value: o.recordName, label: o.label };
    });
  }
  return MASTER_DATA[source] || [];
}

function getProductByName(name) {
  return MASTER_DATA.products.find(function(p) { return p.name === name; }) || null;
}

function applyLicenseComputedFields(next) {
  var calc = calcMargin(next.contractValue, next.cost);
  next.marginDollar = calc.marginDollar;
  next.margin = calc.margin;
  var expirationState = calcExpirationState(next.renewalDate, next.alertPolicy, next.customReminderDays);
  next.systemStatus = expirationState.systemStatus;
  next.daysToExpiration = expirationState.daysToExpiration;
  // riskLevel is derived (never manual), mirroring systemStatus / margin.
  next.riskLevel = calcRiskLevel(next.renewalDate, next.alertPolicy, next.customReminderDays, next.businessCriticality);
  return next;
}

// Returns the workspace-correct mock rows for any module.
// Used to pre-seed RECORD_STORE when a module has never been visited.
function getModuleMockRows(moduleKey, workspaceMode) {
  var isIT = workspaceMode === 'Internal IT';
  if (moduleKey === 'licenses')  return isIT ? licensesInternalIT  : licensesMsp;
  if (moduleKey === 'hardware')  return isIT ? hardwareInternalIT  : hardwareMsp;
  if (moduleKey === 'contracts') return isIT ? contractsInternalIT : contractsMsp;
  if (moduleKey === 'documents') return isIT ? documentsInternalIT : documentsMsp;
  return [];
}

// Ensures RECORD_STORE[moduleKey] is populated (loads mock rows if empty).
// Called before any linked-record lookup to avoid false misses.
function ensureModuleRecordsLoaded(moduleKey, workspaceMode) {
  if (Array.isArray(RECORD_STORE[moduleKey]) && RECORD_STORE[moduleKey].length > 0) return;
  var rows = getModuleMockRows(moduleKey, workspaceMode);
  if (rows.length > 0) RECORD_STORE[moduleKey] = toRecords(rows, moduleKey, { workspaceMode: workspaceMode });
}

// Cross-module real-record options for "Linked Record" pickers (Tasks New Task
// modal and Documents Upload form). Each option is a { value: rec.id, label,
// moduleKey, recordName, clientOrDept, row, columns, meta } object. Pass
// excludeModuleKey to drop a module (e.g. 'documents' so a document cannot link
// to itself). Module-level so both TasksScreen and OperationalList can use it.
function collectLinkedRecordOptions(workspaceMode, excludeModuleKey) {
  var modules = ['licenses', 'hardware', 'contracts', 'documents'];
  var opts = [];
  modules.forEach(function(mk) {
    if (excludeModuleKey && mk === excludeModuleKey) return;
    ensureModuleRecordsLoaded(mk, workspaceMode);
    var cols = getModuleColumns(mk, workspaceMode);
    var cdIdx = getModuleClientDeptIndex(mk, workspaceMode);
    var recs = RECORD_STORE[mk] || [];
    recs.forEach(function(rec) {
      var name = (rec.row && rec.row[0]) || '';
      if (!name || name === '-') return;
      var clientOrDept = (cdIdx >= 0 && rec.row && rec.row[cdIdx]) || '';
      if (clientOrDept === '-') clientOrDept = '';
      var label = name
        + ' · ' + (mk.charAt(0).toUpperCase() + mk.slice(1))
        + (clientOrDept ? ' · ' + clientOrDept : '');
      opts.push({ value: rec.id, label: label, moduleKey: mk, recordName: name, clientOrDept: clientOrDept, row: rec.row, columns: cols, meta: rec.meta || null });
    });
  });
  return opts;
}

function summarizeImportedRecordValue(records) {
  var total = records.reduce(function(sum, record) {
    var raw = record && record.meta ? (record.meta.commercialValue || record.meta.vendorCost || '') : '';
    var amount = parseFloat(importMoney(raw));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  return total > 0 ? formatImportMoney(total) : '-';
}

function ensureImportedClientRecords(records, workspaceMode) {
  if (!Array.isArray(RECORD_STORE.clients)) RECORD_STORE.clients = [];
  var isIT = workspaceMode === 'Internal IT';
  var existingByName = new Map();
  RECORD_STORE.clients.forEach(function(clientRecord) {
    if (clientRecord && clientRecord.meta && clientRecord.meta.name) existingByName.set(normalizeImportText(clientRecord.meta.name), clientRecord);
  });
  var grouped = new Map();
  records.forEach(function(record) {
    var name = record && record.meta && record.meta.clientDepartment ? record.meta.clientDepartment : '';
    if (!name || name.indexOf('Unassigned') === 0) return;
    var key = normalizeImportText(name);
    if (!grouped.has(key)) grouped.set(key, { name: name, records: [] });
    grouped.get(key).records.push(record);
  });
  var created = 0;
  var matched = 0;
  grouped.forEach(function(group, key) {
    var clientRecord = existingByName.get(key);
    if (clientRecord) {
      matched += 1;
    } else {
      clientRecord = {
        id: createRecordId('clients'),
        row: isIT
          ? [group.name, 'Unassigned', '-', String(group.records.length), summarizeImportedRecordValue(group.records), '0', 'Review', 'Review import']
          : [group.name, 'Imported', 'Imported contact', 'Unassigned', String(group.records.length) + ' imported records', 'Imported session', summarizeImportedRecordValue(group.records), 'Review'],
        meta: {
          source: 'importSandbox',
          moduleKey: 'clients',
          type: isIT ? 'department' : 'client',
          name: group.name,
          workspaceMode: workspaceMode,
          importedAt: new Date().toISOString(),
          importFileName: group.records[0] && group.records[0].meta ? group.records[0].meta.importFileName : '',
          recordCount: group.records.length,
          exposure: summarizeImportedRecordValue(group.records)
        }
      };
      RECORD_STORE.clients.unshift(clientRecord);
      existingByName.set(key, clientRecord);
      created += 1;
    }
    group.records.forEach(function(record) {
      record.meta = Object.assign({}, record.meta || {}, { clientRecordId: clientRecord.id, clientRecordName: group.name });
    });
  });
  return { created: created, matched: matched };
}

function normalizeEntityMatchKey(value) {
  return normalizeImportText(value).replace(/\s+/g, ' ');
}

function addEntityKey(set, value) {
  var key = normalizeEntityMatchKey(value);
  if (!key || key.indexOf('unassigned') === 0 || key === '-') return;
  set.add(key);
}

function countEntityMatches(values, existingValues) {
  var existing = new Set();
  (existingValues || []).forEach(function(value) { addEntityKey(existing, value); });
  var total = values.size;
  var matched = 0;
  values.forEach(function(key) { if (existing.has(key)) matched += 1; });
  return { total: total, matched: matched, toCreate: Math.max(total - matched, 0) };
}

function buildImportEntitySummary(records, workspaceMode) {
  var allRecords = []
    .concat(records.licenses || [])
    .concat(records.hardware || [])
    .concat(records.contracts || []);
  var clients = new Set();
  var contacts = new Set();
  var brands = new Set();
  var products = new Set();
  var providers = new Set();
  var relationships = 0;

  allRecords.forEach(function(record) {
    var meta = record.meta || {};
    addEntityKey(clients, meta.clientDepartment);
    addEntityKey(brands, meta.brandManufacturer);
    addEntityKey(products, meta.productLicenseName || meta.displayName);
    addEntityKey(providers, meta.providerDistributor);
    if (meta.importContactContext) {
      addEntityKey(contacts, meta.importContactContext.contactEmail || meta.importContactContext.contactName || meta.importContactContext.contactRole);
    }
    if (meta.clientDepartment) relationships += 1;
    if (meta.brandManufacturer || meta.productLicenseName) relationships += 1;
    if (meta.providerDistributor) relationships += 1;
    if (meta.contractNumber && meta.moduleKey !== 'contracts') relationships += 1;
    if (meta.importContactContext) relationships += 1;
    if (meta.importTarget === 'Renewal Package / Bundle') relationships += 1;
  });

  var clientSeed = workspaceMode === 'Internal IT' ? MASTER_DATA.departments : MASTER_DATA.companies;
  var localClients = (RECORD_STORE.clients || []).map(function(record) {
    return record && record.meta ? record.meta.name : (record && record.row ? record.row[0] : '');
  });

  return {
    clients: countEntityMatches(clients, clientSeed.concat(localClients)),
    contacts: { total: contacts.size, review: contacts.size },
    brands: countEntityMatches(brands, MASTER_DATA.vendors),
    products: countEntityMatches(products, MASTER_DATA.products.map(function(product) { return product.name; })),
    providers: countEntityMatches(providers, MASTER_DATA.providers.concat(MASTER_DATA.vendors)),
    recordsToCreate: allRecords.length,
    relationshipsToCreate: relationships
  };
}

const NEW_RECORD_FIELDS = {
  Licenses: [
    { key: 'name',          label: 'License / Product',      required: true,  type: 'select', source: 'products' },
    { key: 'client',        label: 'Client / Department',    required: true,  type: 'select', source: 'clientDepartment' },
    { key: 'seats',         label: 'Quantity / Seats',       required: true,  type: 'number' },
    { key: 'owner',         label: 'Renewal Owner',          required: true,  type: 'select', source: 'users' },
    { key: 'renewalDate',   label: 'Expiration / Renewal Date', required: true, type: 'date' },
    { key: 'systemStatus',  label: 'System Status',          type: 'computed' },
    { key: 'daysToExpiration', label: 'Days to Expiration',  type: 'computed' },
    { key: 'alertPolicy',   label: 'Alert Policy',           type: 'select', options: ['Workspace default','90 / 60 / 30 days','60 / 30 / 7 days','30 / 7 / 1 days','Custom'] },
    { key: 'customReminderDays', label: 'Custom Reminder Days' },
    { key: 'renewalStage',  label: 'Renewal Stage',          type: 'select', options: ['Not started','In review','Quote requested','Proposal sent','Waiting for client','Approved','Renewed','Cancelled'] },
    { key: 'startDate',     label: 'Start Date',             type: 'date' },
    { key: 'licenseTerm',   label: 'License Term',           type: 'select',  options: ['1 year','2 years','3 years','5 years','Custom'] },
    { key: 'brand',         label: 'Brand',                  type: 'select',  source: 'vendors' },
    { key: 'distributor',   label: 'Distributor / Provider', type: 'select',  source: 'providers' },
    { key: 'contractValue', label: 'Annual Value',           type: 'number' },
    { key: 'cost',          label: 'Cost',                   type: 'number' },
    { key: 'marginDollar',  label: 'Margin $',               type: 'computed' },
    { key: 'margin',        label: 'Margin %',               type: 'computed' },
    { key: 'riskLevel',     label: 'Risk Level',             type: 'computed' },
    { key: 'notes',         label: 'Notes',                  multi: true },
  ],
  // F1b/Core-4b: Documents is built by getDocumentFields(context); this key is
  // kept so getFormFields' `NEW_RECORD_FIELDS[module]` lookup still resolves the
  // standalone Documents form. The Licenses entry above is getFormFields'
  // defensive fallback for unknown modules; the former Hardware and Contracts
  // entries here were dead code and removed.
  Documents: getDocumentFields('standalone'),
};

// Core-4b: context-aware Document field spec. Both Document surfaces create the
// same entity, so they share one conceptual spec:
//   'standalone' (Upload / New Document) — the user can choose the Linked
//     Record, Client / Department and Provider / Vendor.
//   'linked' (Attach Document from a record drawer) — the parent record is
//     implicit in selectedRecord, so Linked Record / Client / Provedor are
//     omitted (handleAttachDocSave fills linkedModule/linkedRecordId/Name from
//     selectedRecord; save behavior is unchanged).
// "Uploaded by" is the unified label in both. Uploaded by is a SearchableSelect
// (renderers honor the flag); Document Type stays a native select.
function getDocumentFields(context) {
  var ctx = context || 'standalone';
  var fields = [
    { key: 'filePick',   label: 'Attach file',          required: true, type: 'file' },
    { key: 'name',       label: 'Document Name',         required: true },
    { key: 'type',       label: 'Document Type',         required: true, type: 'select', options: DOC_TYPE_OPTIONS },
    { key: 'uploadedBy', label: 'Uploaded by',           required: true, type: 'select', source: 'users', useSearchableSelect: true, placeholder: 'Search user...' },
  ];
  if (ctx === 'standalone') {
    fields.push(
      { key: 'relatedRecord', label: 'Linked Record',    type: 'select', source: 'linkedRecords', useSearchableSelect: true, placeholder: 'Search record...' },
      { key: 'client',     label: 'Client / Department',  type: 'select', source: 'clientDepartment', useSearchableSelect: true, placeholder: 'Search client / department...' },
      { key: 'vendor',     label: 'Provider / Vendor',    type: 'select', source: 'vendors', useSearchableSelect: true, placeholder: 'Search provider / vendor...' }
    );
  }
  fields.push({ key: 'notes', label: 'Notes', multi: true });
  return fields;
}


function getFormFields(module, workspaceMode) {
  if (module === 'Hardware') {
    if (workspaceMode === 'Internal IT') {
      return [
        { key: 'name',                label: 'Asset Name',                required: true },
        { key: 'type',                label: 'Type',                      required: true, type: 'select', options: ['Server','Firewall','Switch','Laptop','Desktop','UPS','Storage','Printer','Other'] },
        { key: 'client',              label: 'Department',                required: true, type: 'select', source: 'clientDepartment', useSearchableSelect: true, placeholder: 'Search department...' },
        { key: 'brand',               label: 'Brand / Manufacturer',      required: true, type: 'select', source: 'vendors', useSearchableSelect: true, placeholder: 'Search brand...' },
        { key: 'serial',              label: 'Serial Number / Asset ID',  required: true },
        { key: 'warrantyEnd',         label: 'Warranty End',              required: true, type: 'date' },
        { key: 'owner',               label: 'Owner / Custodian',         required: true, type: 'select', source: 'users', useSearchableSelect: true, placeholder: 'Search owner...' },
        { key: 'model',               label: 'Model' },
        { key: 'provider',            label: 'Provider',                  type: 'select', source: 'providers', useSearchableSelect: true, placeholder: 'Search provider...' },
        { key: 'location',            label: 'Location' },
        { key: 'costCenter',          label: 'Cost Center' },
        { key: 'purchaseDate',        label: 'Purchase Date',             type: 'date' },
        { key: 'assetValue',          label: 'Asset Value / Annual Cost', type: 'number' },
        { key: 'approvalStatus',      label: 'Approval Status',           type: 'select', options: ['Approved','Pending','Blocked','Not required'] },
        { key: 'businessCriticality', label: 'Business Criticality',      type: 'select', options: ['Low','Medium','High','Critical'] },
        { key: 'alertPolicy',         label: 'Alert Policy',              type: 'select', options: LICENSE_ALERT_POLICY_OPTIONS },
        { key: 'notes',               label: 'Notes',                     multi: true },
      ];
    }
    return [
      { key: 'name',        label: 'Asset Name',              required: true },
      { key: 'type',        label: 'Type',                    required: true, type: 'select', options: ['Server','Firewall','Switch','Laptop','Desktop','UPS','Storage','Printer','Other'] },
      { key: 'client',      label: 'Client',                  required: true, type: 'select', source: 'clientDepartment', useSearchableSelect: true, placeholder: 'Search client...' },
      { key: 'brand',       label: 'Brand / Manufacturer',    required: true, type: 'select', source: 'vendors', useSearchableSelect: true, placeholder: 'Search brand...' },
      { key: 'serial',      label: 'Serial Number / Asset ID', required: true },
      { key: 'warrantyEnd', label: 'Warranty End',            required: true, type: 'date' },
      { key: 'owner',       label: 'Owner',                   required: true, type: 'select', source: 'users', useSearchableSelect: true, placeholder: 'Search owner...' },
      { key: 'model',       label: 'Model' },
      { key: 'provider',    label: 'Provider / Distributor',  type: 'select', source: 'providers', useSearchableSelect: true, placeholder: 'Search distributor / provider...' },
      { key: 'location',    label: 'Location' },
      { key: 'purchaseDate', label: 'Purchase Date',          type: 'date' },
      { key: 'assetValue',  label: 'Asset Value',             type: 'number' },
      { key: 'alertPolicy', label: 'Alert Policy',            type: 'select', options: LICENSE_ALERT_POLICY_OPTIONS },
      { key: 'notes',       label: 'Notes',                   multi: true },
    ];
  }
  if (module === 'Contracts') {
    if (workspaceMode === 'Internal IT') {
      return [
        { key: 'name',           label: 'Contract Name',      required: true },
        { key: 'type',           label: 'Contract Type',      required: true, type: 'select', options: ['License','Service','Hardware','SaaS','Support','Maintenance','MSA','NDA','Other'] },
        { key: 'client',         label: 'Department',         required: true, type: 'select', source: 'clientDepartment', useSearchableSelect: true, placeholder: 'Search department...' },
        { key: 'provider',       label: 'Provider',           required: true, type: 'select', source: 'providers', useSearchableSelect: true, placeholder: 'Search provider...' },
        { key: 'owner',          label: 'Owner',              required: true, type: 'select', source: 'users', useSearchableSelect: true, placeholder: 'Search owner...' },
        { key: 'renewalDate',    label: 'Renewal / End Date', required: true, type: 'date' },
        { key: 'noticePeriod',   label: 'Notice Period',      type: 'select', options: ['30 days','60 days','90 days','120 days','None'] },
        { key: 'annualCost',     label: 'Annual Cost',        type: 'number' },
        { key: 'costCenter',     label: 'Cost Center' },
        { key: 'approvalStatus', label: 'Approval Status',    type: 'select', options: ['Approved','Pending','Blocked','Not required'] },
        { key: 'alertPolicy',    label: 'Alert Policy',       type: 'select', options: LICENSE_ALERT_POLICY_OPTIONS },
        { key: 'notes',          label: 'Notes',              multi: true },
      ];
    }
    return [
      { key: 'name',         label: 'Contract Name',          required: true },
      { key: 'type',         label: 'Contract Type',          required: true, type: 'select', options: ['License','Service','Hardware','SaaS','Support','Maintenance','MSA','NDA','Other'] },
      { key: 'client',       label: 'Client',                 required: true, type: 'select', source: 'clientDepartment', useSearchableSelect: true, placeholder: 'Search client...' },
      { key: 'provider',     label: 'Provider / Distributor', required: true, type: 'select', source: 'providers', useSearchableSelect: true, placeholder: 'Search distributor / provider...' },
      { key: 'owner',        label: 'Owner',                  required: true, type: 'select', source: 'users', useSearchableSelect: true, placeholder: 'Search owner...' },
      { key: 'renewalDate',  label: 'Renewal / End Date',     required: true, type: 'date' },
      { key: 'noticePeriod', label: 'Notice Period',          type: 'select', options: ['30 days','60 days','90 days','120 days','None'] },
      { key: 'contractValue', label: 'Contract Value',        type: 'number' },
      { key: 'cost',         label: 'Vendor Cost',            type: 'number' },
      { key: 'alertPolicy',  label: 'Alert Policy',           type: 'select', options: LICENSE_ALERT_POLICY_OPTIONS },
      { key: 'notes',        label: 'Notes',                  multi: true },
    ];
  }
  if (module !== 'Licenses') return NEW_RECORD_FIELDS[module] || NEW_RECORD_FIELDS.Licenses;
  if (workspaceMode === 'Internal IT') {
    return [
      // S1b + S1c — License / Product, Department, Owner and Provider all
      // migrated to SearchableSelect in the New Record modal renderer.
      // useSearchableSelect flag is opt-in; Edit record drawer and import
      // preview drawer still use native <select>. allowCreate=false stays
      // wired by default in renderF so users cannot inject off-catalog values.
      { key: 'name',          label: 'License / Product',      required: true,  type: 'select', source: 'products',         useSearchableSelect: true, placeholder: 'Search license / product...' },
      { key: 'client',        label: 'Department',             required: true,  type: 'select', source: 'clientDepartment', useSearchableSelect: true, placeholder: 'Search department...' },
      { key: 'renewalDate',   label: 'Expiration / Renewal Date', required: true, type: 'date' },
      { key: 'owner',         label: 'IT Owner / Budget Owner', required: true, type: 'select', source: 'users',            useSearchableSelect: true, placeholder: 'Search owner...' },
      { key: 'seats',         label: 'Quantity / Seats',       required: true, type: 'number' },
      { key: 'brand',         label: 'Brand / Manufacturer',   type: 'select', source: 'vendors',          useSearchableSelect: true, placeholder: 'Search brand...' },
      { key: 'provider',      label: 'Provider',               required: true, type: 'select', source: 'providers',        useSearchableSelect: true, placeholder: 'Search distributor / provider...' },
      { key: 'annualCost',    label: 'Annual Cost',            required: true, type: 'number' },
      { key: 'costCenter',    label: 'Cost Center',            required: true },
      { key: 'approvalStatus', label: 'Approval Status',       required: true, type: 'select', options: ['Approved','Pending','Blocked','Not required'] },
      { key: 'businessCriticality', label: 'Business Criticality', required: true, type: 'select', options: ['Low','Medium','High','Critical'] },
      { key: 'alertPolicy',   label: 'Alert Policy',           required: true, type: 'select', options: LICENSE_ALERT_POLICY_OPTIONS },
      { key: 'customReminderDays', label: 'Custom Reminder Days' },
      { key: 'startDate',     label: 'Start Date',             type: 'date' },
      { key: 'licenseTerm',   label: 'License Term',           type: 'select', options: LICENSE_TERM_OPTIONS },
      { key: 'notes',         label: 'Notes',                  multi: true },
    ];
  }
  return [
    // S1b + S1c — see comment on the Internal IT branch above.
    { key: 'name',          label: 'License / Product',      required: true,  type: 'select', source: 'products',         useSearchableSelect: true, placeholder: 'Search license / product...' },
    { key: 'client',        label: 'Client',                 required: true,  type: 'select', source: 'clientDepartment', useSearchableSelect: true, placeholder: 'Search client...' },
    { key: 'renewalDate',   label: 'Expiration / Renewal Date', required: true, type: 'date' },
    { key: 'owner',         label: 'Renewal Owner',          required: true,  type: 'select', source: 'users',            useSearchableSelect: true, placeholder: 'Search owner...' },
    { key: 'alertPolicy',   label: 'Alert Policy',           required: true,  type: 'select', options: LICENSE_ALERT_POLICY_OPTIONS },
    { key: 'seats',         label: 'Quantity / Seats',       required: true, type: 'number' },
    { key: 'brand',         label: 'Brand / Manufacturer',   type: 'select', source: 'vendors',          useSearchableSelect: true, placeholder: 'Search brand...' },
    { key: 'provider',      label: 'Distributor / Provider', required: true, type: 'select', source: 'providers',        useSearchableSelect: true, placeholder: 'Search distributor / provider...' },
    { key: 'contractValue', label: 'Sale Price / Annual Value', required: true, type: 'number' },
    { key: 'cost',          label: 'Vendor Cost',            required: true, type: 'number' },
    { key: 'startDate',     label: 'Start Date',             type: 'date' },
    { key: 'licenseTerm',   label: 'License Term',           type: 'select', options: LICENSE_TERM_OPTIONS },
    { key: 'notes',         label: 'Notes',                  multi: true },
  ];
}

function buildNewRow(form, safeColumns) {
  const v = form;
  // Risk is derived from expiration + business criticality (never the old
  // manual select). calcRiskLevel returns 'Low'|'Medium'|'High'|'Critical';
  // the visible column keeps the existing "<level> risk" format.
  const risk = calcRiskLevel(v.renewalDate, v.alertPolicy, v.customReminderDays, v.businessCriticality) + ' risk';
  const fmtValue = (n) => n ? ('$' + Number(n).toLocaleString()) : '-';
  const fmtMarginPct = (n) => n ? (n + '%') : '-';
  const fmtMarginDollar = (n) => n ? ('$' + parseFloat(n).toLocaleString()) : '-';
  const marginCalc = calcMargin(v.contractValue, v.cost);
  const marginDollar = v.marginDollar || marginCalc.marginDollar;
  const margin = v.margin || marginCalc.margin;
  const marginDisplay = marginDollar ? fmtMarginDollar(marginDollar) : fmtMarginPct(margin);
  const valueDisplay = fmtValue(v.contractValue || v.annualCost);
  const expirationState = calcExpirationState(v.renewalDate, v.alertPolicy, v.customReminderDays);
  const hasLicenseStatus = Object.prototype.hasOwnProperty.call(v, 'systemStatus');
  const systemStatus = hasLicenseStatus ? expirationState.systemStatus : v.status;
  const daysToExpiration = hasLicenseStatus ? expirationState.daysToExpiration : '';
  const action = v.renewalStage || v.nextAction || 'Review';
  const map = {
    'License / Product':      v.name,
    'Asset':                  v.name,
    'Contract':               v.name,
    'Contract Name':          v.name,
    'Document':               v.documentStatus || v.name,
    'Document Name':          v.name,
    'Name':                   v.name,
    'Client':                 v.client,
    'Department':             v.client,
    'Client / Department':    v.client,
    'Brand':                  v.brand,
    'Vendor':                 v.brand,
    'Provider':               v.provider,
    'Distributor':            v.provider || v.distributor,
    'Provider / Distributor': v.provider || v.distributor,
    'Type':                   v.type,
    'Model':                  v.model,
    'Serial':                 v.serial,
    'Product':                v.name,
    'Owner':                  v.owner || 'Unassigned',
    'Renewal Owner':          v.owner || 'Unassigned',
    'Uploaded by':            v.uploadedBy,
    'Version':                v.version,
    'Access':                 v.access,
    'Requirement':            v.requirement,
    'File / Document reference': v.fileName || v.fileReference || v.fileRef,
    'File reference':         v.fileName || v.fileReference || v.fileRef,
    'Linked record':          v.relatedRecord,
    'Warranty end':           v.warrantyEnd,
    'Support':                v.support,
    'Location':               v.location,
    'Purchase Date':          v.purchaseDate,
    'Asset Value':            fmtValue(v.assetValue),
    'Asset Value / Annual Cost': fmtValue(v.assetValue),
    'Quantity':               v.seats,
    'Users / Seats':          v.seats,
    'Renewal':                v.renewalDate,
    'Expiration':             v.renewalDate,
    'Expiration / Renewal Date': v.renewalDate,
    'Renewal Type':           v.renewalDate,
    'Notice':                 v.noticePeriod,
    'Value':                  valueDisplay,
    'Sale Price / Annual Value': fmtValue(v.contractValue),
    'Annual Value':           fmtValue(v.contractValue),
    'Annual Cost':            fmtValue(v.annualCost),
    'Vendor Cost':            fmtValue(v.cost),
    'Cost':                   fmtValue(v.cost),
    'Cost Center':            v.costCenter,
    'Margin':                 marginDisplay,
    'Margin $':               fmtMarginDollar(marginDollar),
    'Margin %':               fmtMarginPct(margin),
    'System Status':          systemStatus,
    'Days to Expiration':     daysToExpiration,
    'Alert Policy':           v.alertPolicy,
    'Custom Reminder Days':   v.customReminderDays,
    'Renewal Stage':          v.renewalStage,
    'Business Criticality':   v.businessCriticality,
    'Start Date':             v.startDate,
    'License Term':           v.licenseTerm,
    'Legal status':           v.approvalStatus || 'Pending',
    'Approval Status':        v.approvalStatus || 'Pending',
    'Approval status':        v.approvalStatus || 'Pending',
    'Next action':            action,
    'Status':                 systemStatus || v.status || 'Active',
    'Risk':                   risk,
    'Action':                 action,
    'Notes':                  v.notes || '',
  };
  return safeColumns.map(col => (map[col] !== undefined && map[col] !== '') ? map[col] : '-');
}

// Core-4b: Attach Document (from a record drawer) is the 'linked' context of
// the shared Document spec. Label "Uploaded by" and the SearchableSelect flag
// now match the standalone Upload form.
const ATTACH_DOC_FIELDS = getDocumentFields('linked');

function getTaskTypeOptions(workspaceMode) {
  return workspaceMode === 'Internal IT'
    ? ['Approval follow-up','Budget review','Request provider quote','Validate coverage','Upload evidence','Review renewal','Confirm internal owner','Escalate operational risk','Other']
    : ['Client follow-up','Request vendor quote','Send proposal','Prepare renewal','Confirm purchase order','Upload evidence','Review support coverage','Escalate renewal risk','Other'];
}

// F1c: Create Task modal field spec. The drawer-scoped "Create task" modal
// (aria-label="Create task") now consumes this spec instead of inline JSX, so a
// future SearchableSelect migration only needs a flag here. `group` preserves
// the existing visual layout: primary (1-col), grid (2-col), notes (after the
// Optional divider). Labels, options, required state and save behavior are
// unchanged. Options are resolved at build time to keep the renderer trivial.
//
// Core-4a: context-aware. Both Task surfaces create the same entity, so they
// share one conceptual spec:
//   'standalone' (global New Task modal) — the user picks the parent record, so
//     a Linked Record field is included (SearchableSelect over real records).
//   'linked' (drawer Create Task, default) — the parent is implicit in
//     selectedRecord, so Linked Record is omitted.
// Owner stays a catalog field; Task Type / Priority / Status stay native selects.
// Save behavior is unchanged: handleTaskSave and handleGlobalTaskSave keep their
// own logic; this only unifies the field definition.
function getTaskFields(workspaceMode, context) {
  var ctx = context || 'linked';
  var fields = [
    { key: 'title',    label: 'Task title', required: true,  type: 'text',     group: 'primary', placeholder: 'e.g. Request renewal quote from vendor' },
    { key: 'taskType', label: 'Task type',  required: true,  type: 'select',   group: 'primary', options: getTaskTypeOptions(workspaceMode), emptyLabel: 'Select type...' },
  ];
  if (ctx === 'standalone') {
    // Linked Record uses real cross-module records ({value, label} objects) and
    // is searchable; the global modal supplies the options at render time.
    fields.push({ key: 'linkedRec', label: 'Linked record', required: true, type: 'select', group: 'primary', source: 'linkedRecords', useSearchableSelect: true, placeholder: 'Search record...' });
  }
  fields.push(
    { key: 'owner',    label: 'Owner',      required: true,  type: 'select',   group: 'primary', source: 'users', useSearchableSelect: true, options: resolveFieldOptions('users', workspaceMode), emptyLabel: 'Select owner...' },
    { key: 'dueDate',  label: 'Due date',   required: true,  type: 'date',     group: 'grid' },
    { key: 'priority', label: 'Priority',   required: true,  type: 'select',   group: 'grid', options: TASK_PRIORITY_OPTIONS, emptyLabel: 'Select...' },
    { key: 'status',   label: 'Status',     required: true,  type: 'select',   group: 'grid', options: TASK_STATUS_OPTIONS, emptyLabel: 'Select...' },
    { key: 'notes',    label: 'Notes',      required: false, type: 'textarea', group: 'notes', placeholder: 'Context, links or impact notes…' }
  );
  return fields;
}

function getSupportCoverageFields(workspaceMode) {
  var valueLabel = workspaceMode === 'Internal IT' ? 'Annual Cost' : 'Annual Value';
  return [
    { key: 'name',         label: 'Support / Coverage Name',   required: true,  type: 'select', options: SUPPORT_COVERAGE_NAME_OPTIONS },
    { key: 'coverageType', label: 'Coverage Type',             required: true,  type: 'select', options: SUPPORT_COVERAGE_TYPE_OPTIONS },
    { key: 'provider',     label: 'Provider',                  required: true,  type: 'select', source: 'providers', useSearchableSelect: true, placeholder: 'Search provider / vendor...' },
    { key: 'endDate',      label: 'Coverage End Date',         required: true,  type: 'date' },
    { key: 'owner',        label: 'Coverage Owner',            required: true,  type: 'select', source: 'users', useSearchableSelect: true, placeholder: 'Search owner...' },
    { key: 'alertPolicy',  label: 'Alert Policy',              required: true,  type: 'select', options: SUPPORT_ALERT_POLICY_OPTIONS },
    { key: 'startDate',    label: 'Coverage Start Date',       type: 'date' },
    { key: 'value',        label: valueLabel,                  type: 'number' },
    { key: 'notes',        label: 'Notes',                     multi: true },
  ];
}

const FILTER_SPECS = {
  Licenses: [
    { key: 'vendor',    label: 'Vendor',              cols: ['Vendor', 'Brand', 'Distributor'] },
    { key: 'product',   label: 'Product',             cols: ['License / Product', 'Product'] },
    { key: 'client',    label: 'Client / Department', cols: ['Client', 'Department'] },
    { key: 'expStatus', label: 'Expiration status',   cols: ['Status'] },
    { key: 'owner',     label: 'Renewal owner',       cols: ['Renewal Owner', 'Owner'] },
    { key: 'risk',      label: 'Risk level',          cols: ['Risk'] },
  ],
  Hardware: [
    { key: 'brand',    label: 'Brand',           cols: ['Brand'] },
    { key: 'type',     label: 'Type',            cols: ['Type'] },
    { key: 'owner',    label: 'Owner',           cols: ['Owner'] },
    { key: 'warranty', label: 'Warranty status', cols: ['Status'] },
    { key: 'support',  label: 'Support status',  cols: ['Support'] },
    { key: 'risk',     label: 'Risk level',      cols: ['Risk'] },
  ],
  Contracts: [
    { key: 'provider',  label: 'Provider',        cols: ['Provider'] },
    { key: 'type',      label: 'Contract type',   cols: ['Type'] },
    { key: 'owner',     label: 'Owner',           cols: ['Owner'] },
    { key: 'renewal',   label: 'Renewal type',    cols: ['Renewal Type'] },
    { key: 'approval',  label: 'Approval status', cols: ['Approval Status', 'Approval status'] },
    { key: 'notice',    label: 'Notice period',   cols: ['Notice'] },
  ],
  Documents: [
    { key: 'docType',   label: 'Document type',     cols: ['Type'] },
    { key: 'module',    label: 'Related module',    cols: ['Related Module', 'Module'] },
    { key: 'owner',     label: 'Owner',             cols: ['Owner'] },
    { key: 'expStatus', label: 'Expiration status', cols: ['Status'] },
  ],
};

function getColIndices(colNames, safeColumns) {
  return colNames.reduce((acc, name) => {
    const idx = safeColumns.findIndex(c => c.toLowerCase() === name.toLowerCase());
    if (idx !== -1 && !acc.includes(idx)) acc.push(idx);
    return acc;
  }, []);
}

function getFilterOptions(spec, localRows, safeColumns) {
  const indices = getColIndices(spec.cols, safeColumns);
  const seen = new Set();
  localRows.forEach(row => {
    const r = Array.isArray(row) ? row : [];
    indices.forEach(idx => {
      const val = (r[idx] || '').trim();
      if (val && val !== '-') seen.add(val);
    });
  });
  return Array.from(seen).sort();
}

function rowPassesFilter(row, spec, value, safeColumns) {
  if (!value) return true;
  const indices = getColIndices(spec.cols, safeColumns);
  const r = Array.isArray(row) ? row : [];
  return indices.some(idx => (r[idx] || '').toLowerCase().includes(value.toLowerCase()));
}

function rowPassesSearch(row, search) {
  if (!search.trim()) return true;
  const r = Array.isArray(row) ? row : [];
  const q = search.toLowerCase();
  return r.some(cell => (cell || '').toLowerCase().includes(q));
}

function getDetailField(record, ...names) {
  if (!record) return '';
  const cols = record.columns || [];
  const row  = record.row || [];
  for (const name of names) {
    const idx = cols.findIndex(c => c.toLowerCase() === name.toLowerCase());
    if (idx >= 0 && row[idx] && row[idx] !== '-') return row[idx];
  }
  return '';
}

function normalizeEditDateInput(value) {
  if (!value || value === '-') return '';
  var normalized = normalizeImportDate(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : '';
}

function resolveEditSelectValue(value, fieldSpec, workspaceMode) {
  if (!value || value === '-') return '';
  var options = fieldSpec.source ? resolveFieldOptions(fieldSpec.source, workspaceMode) : (fieldSpec.options || []);
  var match = options.find(function(option) {
    return String(option).toLowerCase() === String(value).toLowerCase();
  });
  return match || value;
}

function buildEditForm(record, fieldSpecs, workspaceMode) {
  const cols = record.columns || [];
  const row  = record.row || [];
  const meta = record.meta || {};
  const get = (...names) => {
    for (const n of names) {
      const idx = cols.findIndex(c => c.toLowerCase() === n.toLowerCase());
      if (idx >= 0 && row[idx] && row[idx] !== '-') return row[idx];
    }
    return '';
  };
  const getMeta = (...names) => {
    for (const n of names) {
      if (meta[n] !== undefined && meta[n] !== null && meta[n] !== '' && meta[n] !== '-') return String(meta[n]);
    }
    return '';
  };
  const stripDollar = v => v ? importMoney(v) : '';
  const stripPct    = v => v ? v.replace(/%/g, '').trim() : '';
  const stripRisk   = v => v ? v.replace(/ risk$/i, '').trim() : '';
  // Forms-fix-1: last-resort cost inference for records with no meta.vendorCost
  // (e.g. demo seed rows). The License Margin column shows margin dollars when
  // present ("$2,000"); cost = value - marginDollar. A percent-form margin
  // ("20%") cannot be inverted to dollars reliably here, so we skip it and
  // leave cost empty (user re-enters), avoiding a wrong number.
  const inferCostFromValueMargin = (valueStr, marginStr) => {
    if (!valueStr || !marginStr) return '';
    if (String(marginStr).indexOf('%') >= 0) return '';
    const value = parseFloat(importMoney(valueStr));
    const marginDollar = parseFloat(importMoney(marginStr));
    if (isNaN(value) || isNaN(marginDollar)) return '';
    const cost = value - marginDollar;
    return cost > 0 ? String(cost) : '';
  };
  const prefill = {};
  fieldSpecs.forEach(f => {
    switch (f.key) {
      case 'name':           prefill[f.key] = getMeta('productLicenseName','displayName') || get('License / Product','Asset','Contract','Contract Name','Document Name','Name','Product'); break;
      case 'client':         prefill[f.key] = getMeta('clientDepartment') || get('Client','Department','Client / Department'); break;
      case 'brand':          prefill[f.key] = getMeta('brandManufacturer') || get('Brand','Vendor'); break;
      case 'provider':       prefill[f.key] = getMeta('providerDistributor') || get('Provider','Provider / Distributor','Distributor'); break;
      case 'distributor':    prefill[f.key] = getMeta('providerDistributor') || get('Distributor','Provider / Distributor','Provider'); break;
      case 'type':           prefill[f.key] = get('Type'); break;
      case 'model':          prefill[f.key] = get('Model'); break;
      case 'serial':         prefill[f.key] = get('Serial'); break;
      case 'owner':          prefill[f.key] = getMeta('owner') || get('Owner','Renewal Owner'); break;
      case 'uploadedBy':     prefill[f.key] = get('Uploaded by'); break;
      case 'version':        prefill[f.key] = get('Version'); break;
      case 'access':         prefill[f.key] = get('Access'); break;
      case 'requirement':    prefill[f.key] = get('Requirement'); break;
      case 'relatedRecord':  prefill[f.key] = get('Linked record'); break;
      case 'warrantyEnd':    prefill[f.key] = get('Warranty end'); break;
      case 'support':        prefill[f.key] = get('Support'); break;
      case 'seats':          prefill[f.key] = getMeta('quantitySeats') || get('Quantity','Users / Seats','Quantity / Seats'); break;
      case 'renewalDate':    prefill[f.key] = normalizeEditDateInput(getMeta('expirationRenewalDate') || get('Expiration / Renewal Date','Expiration','Renewal','Renewal Type')); break;
      case 'noticePeriod':   prefill[f.key] = get('Notice'); break;
      case 'contractValue':  prefill[f.key] = stripDollar(getMeta('commercialValue') || get('Value','Annual Value','Sale Price / Annual Value')); break;
      case 'annualCost':     prefill[f.key] = stripDollar(getMeta('commercialValue') || get('Annual Cost','Value')); break;
      case 'margin':         prefill[f.key] = stripPct(get('Margin')); break;
      case 'systemStatus':   prefill[f.key] = calcExpirationState(getMeta('expirationRenewalDate') || get('Expiration / Renewal Date','Expiration','Renewal','Renewal Type'), getMeta('alertPolicy') || get('Alert Policy'), get('Custom Reminder Days')).systemStatus; break;
      case 'daysToExpiration': prefill[f.key] = calcExpirationState(getMeta('expirationRenewalDate') || get('Expiration / Renewal Date','Expiration','Renewal','Renewal Type'), getMeta('alertPolicy') || get('Alert Policy'), get('Custom Reminder Days')).daysToExpiration; break;
      case 'alertPolicy':    prefill[f.key] = getMeta('alertPolicy') || get('Alert Policy') || 'Workspace default'; break;
      case 'customReminderDays': prefill[f.key] = get('Custom Reminder Days'); break;
      case 'renewalStage':   prefill[f.key] = get('Renewal Stage'); break;
      case 'approvalStatus': prefill[f.key] = get('Legal status','Approval Status','Approval status'); break;
      case 'nextAction':     prefill[f.key] = get('Next action','Action'); break;
      case 'documentStatus': prefill[f.key] = get('Document','Legal status'); break;
      case 'status':         prefill[f.key] = get('Status'); break;
      case 'riskLevel':      prefill[f.key] = stripRisk(get('Risk')); break;
      case 'startDate':      prefill[f.key] = normalizeEditDateInput(getMeta('startDate') || get('Start Date')); break;
      case 'licenseTerm':    prefill[f.key] = getMeta('licenseTerm') || get('License Term'); break;
      case 'cost':           prefill[f.key] = stripDollar(getMeta('vendorCost') || get('Cost','Vendor Cost')) || inferCostFromValueMargin(get('Value','Sale Price / Annual Value','Annual Value'), get('Margin','Margin $')); break;
      case 'marginDollar':   prefill[f.key] = stripDollar(get('Margin $')); break;
      case 'relatedLicense': prefill[f.key] = get('Related License / Product'); break;
      case 'relatedContract':prefill[f.key] = get('Related Contract'); break;
      default:               prefill[f.key] = ''; break;
    }
    if (f.type === 'select') prefill[f.key] = resolveEditSelectValue(prefill[f.key], f, workspaceMode);
  });
  return prefill;
}

function OperationalList({ active, columns, rows, note, tabs=['All','Critical','30 days','Overdue','Missing owner'], ai='Opriva AI can summarize blockers, owners and next actions for this queue.', placeholder='', workspaceMode='MSP / Integrator' }){
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeColumns = Array.isArray(columns) ? columns : [];
  const inputPlaceholder = placeholder || ('Filter ' + active.toLowerCase() + ' by company, owner, vendor or risk...');
  const moduleKey = active.includes('Hardware') ? 'hardware'
    : active.includes('Contract') ? 'contracts'
    : active.includes('Document') ? 'documents'
    : 'licenses';

  const [configOpen, setConfigOpen] = React.useState(false);
  const [visibleSet, setVisibleSet] = React.useState(() => new Set(safeColumns));
  const [newOpen, setNewOpen] = React.useState(false);
  // A11y-1: focus management for the New Record modal only (not Edit drawer /
  // import preview / other dialogs yet).
  const newModalRef = React.useRef(null);
  const newModalKeyDown = useDialogFocus(newModalRef, newOpen, function(){ setNewOpen(false); });
  function normalizeDocumentRecords(records) {
    return (Array.isArray(records) ? records : []).map(function(record) {
      if (record && Array.isArray(record.row)) return record;
      var doc = record || {};
      var docMap = {
        'Document': doc.name,
        'Document Name': doc.name,
        'Type': doc.type,
        'Linked record': doc.linkedRecordName || doc.relatedRecord,
        'Client': doc.client,
        'Department': doc.department,
        'Client / Department': doc.client || doc.department,
        'Uploaded by': doc.uploadedBy,
        'Version': doc.version,
        'Access': doc.access,
        'Requirement': doc.requirement,
        'Status': doc.status,
        'Notes': doc.notes,
      };
      return Object.assign({}, doc, {
        id: doc.id || createRecordId('documents'),
        row: safeColumns.map(function(col) {
          return (docMap[col] !== undefined && docMap[col] !== '') ? docMap[col] : '-';
        })
      });
    });
  }
  function resetRowsFromSource() {
    function localStoreRecords() {
      return getLocalStoreRecords(moduleKey, workspaceMode);
    }
    if (moduleKey === 'documents' && Array.isArray(RECORD_STORE.documents) && RECORD_STORE.documents.length) {
      var existingDocuments = normalizeDocumentRecords(RECORD_STORE.documents);
      RECORD_STORE.documents = existingDocuments;
      return existingDocuments;
    }
    var localRecords = localStoreRecords();
    if (localRecords.length) {
      RECORD_STORE[moduleKey] = localRecords;
      return localRecords;
    }
    if (moduleKey === 'contracts') {
      // Use demo contracts only when there are no local/imported contracts.
      var mockContractRecords = toRecords(safeRows, moduleKey, { workspaceMode: workspaceMode });
      var mergedContracts = mockContractRecords;
      RECORD_STORE.contracts = mergedContracts;
      return mergedContracts;
    }
    var records = toRecords(safeRows, moduleKey, { workspaceMode: workspaceMode });
    RECORD_STORE[moduleKey] = records;
    return records;
  }
  const [localRows, setLocalRows] = React.useState(resetRowsFromSource);
  const [form, setForm] = React.useState({});
  const [errors, setErrors] = React.useState({});
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState({});
  const [search, setSearch] = React.useState('');
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState(null);
  const [editMode, setEditMode] = React.useState(false);
  const [editForm, setEditForm] = React.useState({});
  const [editErrors, setEditErrors] = React.useState({});
  const [activeDetailTab, setActiveDetailTab] = React.useState('Overview');
  // A11y-2: focus management for the record detail / edit drawer only (not the
  // import preview drawer or other dialogs yet). Escape exits edit mode first
  // when editing, otherwise closes the drawer — the safest, least destructive
  // behavior. editModeRef avoids a stale closure inside the Escape handler.
  const detailDrawerRef = React.useRef(null);
  const editModeRef = React.useRef(editMode);
  editModeRef.current = editMode;
  const detailDrawerKeyDown = useDialogFocus(detailDrawerRef, detailOpen, function(){
    if (editModeRef.current) { setEditMode(false); }
    else { setDetailOpen(false); }
  });
  const [attachDocOpen, setAttachDocOpen] = React.useState(false);
  const [attachDocForm, setAttachDocForm] = React.useState({});
  const [attachDocErrors, setAttachDocErrors] = React.useState({});
  const [sessionDocs, setSessionDocs] = React.useState([]);
  const [sessionSupportCoverage, setSessionSupportCoverage] = React.useState([]);
  const [supportOpen, setSupportOpen] = React.useState(false);
  const [supportForm, setSupportForm] = React.useState({});
  const [supportErrors, setSupportErrors] = React.useState({});
  const [sessionTasks, setSessionTasks] = React.useState([]);
  const [taskOpen, setTaskOpen] = React.useState(false);
  const [taskForm, setTaskForm] = React.useState({});
  const [taskErrors, setTaskErrors] = React.useState({});

  const columnsKey = safeColumns.join('|');
  React.useEffect(() => { setVisibleSet(new Set(safeColumns)); }, [columnsKey]);
  React.useEffect(() => {
    var records = resetRowsFromSource();
    setLocalRows(records);
    setSessionDocs([]);
    setSessionSupportCoverage([]);
    setSessionTasks([]);
    setFilters({});
    setSearch('');
  }, [rows]);

  const module = active.includes('Hardware') ? 'Hardware'
    : active.includes('Contract') ? 'Contracts'
    : active.includes('Document') ? 'Documents'
    : 'Licenses';
  const formFields = getFormFields(module, workspaceMode);
  const fieldSpecs = formFields; // Edit Record uses same workspace-aware fields as New Record
  const filterSpecs = FILTER_SPECS[module] || [];
  const filterCount = Object.values(filters).filter(Boolean).length;
  const hasActiveFilter = filterCount > 0 || search.trim().length > 0;

  function clearFilters() { setFilters({}); setSearch(''); }

  const toggleCol = (col) => {
    setVisibleSet(prev => {
      const next = new Set(prev);
      if (next.has(col)) { if (next.size > 1) next.delete(col); }
      else { next.add(col); }
      return next;
    });
  };

  function openNew() {
    const empty = {};
    formFields.forEach(f => { empty[f.key] = ''; });
    if (module === 'Licenses') {
      empty.alertPolicy = 'Workspace default';
      applyLicenseComputedFields(empty);
    }
    if (module === 'Documents') {
      empty.fileName = '';
      empty.fileType = '';
      empty.fileSize = 0;
      empty.fileLastModified = 0;
      empty.uploadedAt = '';
    }
    setForm(empty);
    setErrors({});
    setNewOpen(true);
  }

  function handleSave() {
    const errs = {};
    formFields.forEach(f => {
      if (!f.required) return;
      if (f.type === 'file') { if (!form.fileName) errs[f.key] = 'Required'; }
      else if (!(form[f.key] || '').trim()) errs[f.key] = 'Required';
    });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const savedRow = buildNewRow(form, safeColumns);
    const newRecord = {
      id: createRecordId(moduleKey),
      row: savedRow,
      meta: {
        source: 'userCreated',
        moduleKey: moduleKey,
        type: moduleKey,
        displayName: savedRow[0] || '',
        workspaceMode: workspaceMode,
        createdAt: new Date().toISOString(),
        // Forms-fix-1: persist financial values in meta so the edit form can
        // reconstruct them reliably even when they are not visible table
        // columns (e.g. License MSP shows Value + Margin but not Vendor Cost).
        // meta is the primary source; column/inference are fallbacks.
        commercialValue: form.contractValue || form.annualCost || '',
        vendorCost: form.cost || '',
        marginDollar: form.marginDollar || '',
        margin: form.margin || ''
      }
    };
    // CORE-4c-1: standalone Upload/New Document — resolve the selected Linked
    // Record's real metadata (linkedRecordId / linkedModule / linkedRecordName)
    // so it matches the evidence posture of Attach Document. This is additive to
    // meta only; the row/display (which shows the readable record name) is
    // unchanged. The combobox value is still the record name, so we match by
    // recordName; if there is no match (e.g. a free/legacy value) we skip
    // silently. Local-only until the backend stores a real foreign key.
    if (moduleKey === 'documents' && form.relatedRecord) {
      var linkedOpt = collectLinkedRecordOptions(workspaceMode, 'documents').find(function(o) {
        return o.recordName === form.relatedRecord;
      });
      if (linkedOpt) {
        newRecord.meta.linkedRecordId = linkedOpt.value;
        newRecord.meta.linkedModule = linkedOpt.moduleKey;
        newRecord.meta.linkedRecordName = linkedOpt.recordName;
        // REL-1a: additive standard relationship vocabulary, written alongside
        // the linked* fields (not replacing them). This is local-only prep for
        // a future backend `relationships` table; no consumer enumerates meta,
        // so existing drawer filters and navigation are unaffected.
        newRecord.meta.relationshipType = 'document_evidence';
        newRecord.meta.sourceModule = 'documents';
        newRecord.meta.sourceRecordId = newRecord.id;
        newRecord.meta.sourceRecordName = newRecord.meta.displayName || (newRecord.row && newRecord.row[0]) || '';
        newRecord.meta.targetModule = linkedOpt.moduleKey;
        newRecord.meta.targetRecordId = linkedOpt.value;
        newRecord.meta.targetRecordName = linkedOpt.recordName;
        newRecord.meta.direction = 'source_to_target';
        newRecord.meta.relationshipCreatedAt = newRecord.meta.createdAt || new Date().toISOString();
      }
    }
    setLocalRows(function(prev) {
      const next = [newRecord].concat(prev.filter(function(record) { return isLocalStoreRecord(record, workspaceMode); }));
      RECORD_STORE[moduleKey] = next;
      return next;
    });
    addActivityEvent({
      eventType:        'record_created',
      title:            'Record created',
      description:      (newRecord.row[0] || 'Record') + ' was created.',
      sourceModule:     moduleKey,
      sourceRecordId:   newRecord.id,
      sourceRecordName: newRecord.row[0] || '',
      workspaceMode:    workspaceMode,
    });
    const projectedRow = activeColumns.map(function(col) {
      const ci = safeColumns.indexOf(col);
      return ci >= 0 && newRecord.row[ci] !== undefined ? newRecord.row[ci] : '-';
    });
    setSelectedRecord({id: newRecord.id, moduleKey: moduleKey, columns: activeColumns, row: projectedRow, localRowIndex: 0, isNew: true});
    setActiveDetailTab('Overview');
    setEditMode(false);
    setDetailOpen(true);
    setNewOpen(false);
  }

  function handleEditSave() {
    const errs = {};
    fieldSpecs.forEach(f => {
      if (!f.required || f.type === 'file') return;
      if (!(editForm[f.key] || '').trim()) errs[f.key] = 'Required';
    });
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    const newRow = buildNewRow(editForm, safeColumns);
    setLocalRows(function(prev) {
      const next = prev.map(function(r, i) {
        return i === selectedRecord.localRowIndex ? Object.assign({}, r, {
          row: newRow,
          meta: Object.assign({}, r.meta || {}, {
            source: 'userCreated',
            moduleKey: moduleKey,
            displayName: newRow[0] || '',
            workspaceMode: workspaceMode,
            editedAt: new Date().toISOString(),
            // Forms-fix-1: keep financial values in meta in sync on edit.
            commercialValue: editForm.contractValue || editForm.annualCost || '',
            vendorCost: editForm.cost || '',
            marginDollar: editForm.marginDollar || '',
            margin: editForm.margin || ''
          })
        }) : r;
      }).filter(function(record) { return isLocalStoreRecord(record, workspaceMode); });
      RECORD_STORE[moduleKey] = next;
      return next;
    });
    const newActiveRow = activeColumns.map(col => {
      const ci = safeColumns.indexOf(col);
      return ci >= 0 && newRow[ci] !== undefined ? newRow[ci] : '-';
    });
    setSelectedRecord(prev => ({...prev, row: newActiveRow}));
    addActivityEvent({
      eventType:        'record_edited',
      title:            'Record edited',
      description:      (newRow[0] || selectedRecord.row[0] || 'Record') + ' was updated.',
      sourceModule:     moduleKey,
      sourceRecordId:   selectedRecord.id,
      sourceRecordName: newRow[0] || selectedRecord.row[0] || '',
      workspaceMode:    workspaceMode,
    });
    setEditMode(false);
  }

  function openAttachDoc() {
    var empty = {};
    ATTACH_DOC_FIELDS.forEach(function(f) { empty[f.key] = ''; });
    empty.fileName = '';
    empty.fileType = '';
    empty.fileSize = 0;
    empty.fileLastModified = 0;
    empty.uploadedAt = '';
    setAttachDocForm(empty);
    setAttachDocErrors({});
    setAttachDocOpen(true);
  }

  function handleAttachDocSave() {
    var errs = {};
    ATTACH_DOC_FIELDS.forEach(function(f) {
      if (!f.required) return;
      if (f.type === 'file') { if (!attachDocForm.fileName) errs[f.key] = 'Required'; }
      else if (!(attachDocForm[f.key] || '').trim()) errs[f.key] = 'Required';
    });
    if (Object.keys(errs).length) { setAttachDocErrors(errs); return; }
    var today = new Date().toISOString().slice(0, 10);
    var docId = createRecordId('documents');
    var doc = {
      id:               docId,
      name:             attachDocForm.name,
      type:             attachDocForm.type,
      linkedModule:     selectedRecord.moduleKey,
      linkedRecordId:   selectedRecord.id,
      linkedRecordName: selectedRecord.row[0] || '',
      // REL-1a: additive standard relationship vocabulary, alongside the
      // linked* fields (not replacing them). Local-only prep for a future
      // backend `relationships` table; no consumer enumerates meta, so the
      // drawer filters (which read linked*) and navigation are unaffected.
      relationshipType:     'document_evidence',
      sourceModule:         'documents',
      sourceRecordId:       docId,
      sourceRecordName:     attachDocForm.name || '',
      targetModule:         selectedRecord.moduleKey,
      targetRecordId:       selectedRecord.id,
      targetRecordName:     selectedRecord.row[0] || '',
      direction:            'source_to_target',
      relationshipCreatedAt: today,
      uploadedBy:       attachDocForm.uploadedBy,
      uploadDate:       today,
      fileName:         attachDocForm.fileName || '',
      fileType:         attachDocForm.fileType || '',
      fileSize:         attachDocForm.fileSize || 0,
      uploadedAt:       attachDocForm.uploadedAt || today,
      status:           'Attached',
      requirement:      'Optional',
      access:           'Internal',
      version:          '',
      fileRef:          attachDocForm.fileName || '',
      effectiveDate:    '',
      expirationDate:   '',
      notes:            attachDocForm.notes || '',
    };
    RECORD_STORE.documents.push(doc);
    addActivityEvent({
      eventType:        'document_attached',
      title:            'Document attached',
      description:      (doc.name || 'Document') + ' was attached to ' + (doc.linkedRecordName || 'this record') + '.',
      sourceModule:     doc.linkedModule,
      sourceRecordId:   doc.linkedRecordId,
      sourceRecordName: doc.linkedRecordName,
      relatedModule:    'documents',
      relatedRecordId:  doc.id,
      relatedRecordName: doc.name,
      workspaceMode:    workspaceMode,
    });
    setSessionDocs(function(prev) { return prev.concat(doc); });
    setAttachDocOpen(false);
  }

  function openSupportCoverage() {
    setSupportForm({});
    setSupportErrors({});
    setSupportOpen(true);
  }

  function handleSupportSave() {
    var covFields = getSupportCoverageFields(workspaceMode);
    var isCustomName = supportForm.name === 'Other / Custom';
    var errs = {};
    covFields.forEach(function(f) {
      if (!f.required) return;
      if (!(supportForm[f.key] || '').trim()) errs[f.key] = 'Required';
    });
    if (isCustomName && !(supportForm.customName || '').trim()) errs.customName = 'Required';
    if (Object.keys(errs).length) { setSupportErrors(errs); return; }
    var today = new Date().toISOString().slice(0, 10);
    var resolvedName = isCustomName ? supportForm.customName.trim() : supportForm.name;
    // Derive context fields from the covered record's row for richer metadata.
    // Use workspace-aware column name lists so the correct value is found
    // regardless of whether the covered module uses 'Client' or 'Department'.
    var coveredClientOrDepartment = workspaceMode === 'Internal IT'
      ? getDetailField(selectedRecord, 'Department', 'Business Unit', 'Cost Center', 'Client / Department')
      : getDetailField(selectedRecord, 'Client', 'Company', 'Customer', 'Client / Department');
    var cov = {
      id:                        'sc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      moduleKey:                 'contracts',
      contractType:              'Support Coverage',
      name:                      resolvedName,
      coverageType:              supportForm.coverageType,
      provider:                  supportForm.provider,
      owner:                     supportForm.owner,
      startDate:                 supportForm.startDate || '',
      endDate:                   supportForm.endDate,
      alertPolicy:               supportForm.alertPolicy,
      value:                     supportForm.value || '',
      notes:                     supportForm.notes || '',
      coveredModule:             selectedRecord.moduleKey,
      coveredRecordId:           selectedRecord.id,
      coveredRecordName:         selectedRecord.row[0] || '',
      coveredClientOrDepartment: coveredClientOrDepartment || '',
      coveredBrand:              getDetailField(selectedRecord, 'Brand', 'Vendor', 'Provider / Vendor') || '',
      coveredQuantity:           getDetailField(selectedRecord, 'Quantity / Seats', 'Quantity', 'Seats', 'Users / Seats') || '',
      workspaceMode:             workspaceMode,
      createdAt:                 today,
      source:                    'supportCoverage',
    };
    // REL-1c: additive standard relationship vocabulary. covered* above is legacy
    // (points to the covered record); target* is the standard naming for a future
    // backend `relationships` table. No consumer reads these fields yet.
    cov.relationshipType      = 'coverage_covers_record';
    cov.sourceModule          = 'contracts';
    cov.sourceRecordId        = cov.id;
    cov.sourceRecordName      = resolvedName;
    cov.targetModule          = selectedRecord.moduleKey;
    cov.targetRecordId        = selectedRecord.id;
    cov.targetRecordName      = selectedRecord.row[0] || '';
    cov.direction             = 'source_to_target';
    cov.relationshipCreatedAt = today;
    // Derive a human-readable notice period from the alert policy.
    var noticeFromAlertPolicy = function(ap) {
      if (ap === '90 / 60 / 30 days') return '90 days';
      if (ap === '60 / 30 / 7 days')  return '60 days';
      if (ap === '30 / 7 / 1 days')   return '30 days';
      if (ap === 'Workspace default')  return 'Workspace default';
      if (ap === 'Custom')             return 'Custom';
      return '-';
    };
    // Build the Contracts row with an explicit column→value map so every cell
    // is intentional and the coverage name never bleeds into Document.
    var contractsCols = workspaceMode === 'Internal IT'
      ? ['Contract','Type','Department','Provider','Owner','Document','Renewal','Notice','Approval status','Next action','Risk']
      : ['Contract','Type','Client','Provider / Distributor','Owner','Document','Renewal','Notice','Legal status','Next action','Risk'];
    var colValueMap = workspaceMode === 'Internal IT'
      ? { 'Contract':         cov.name,
          'Type':             'Support Coverage',
          'Department':       cov.coveredClientOrDepartment || '-',
          'Provider':         cov.provider,
          'Owner':            cov.owner,
          'Document':         '-',
          'Renewal':          cov.endDate,
          'Notice':           noticeFromAlertPolicy(cov.alertPolicy),
          'Approval status':  'Pending',
          'Next action':      'Review coverage',
          'Risk':             '-' }
      : { 'Contract':               cov.name,
          'Type':                   'Support Coverage',
          'Client':                 cov.coveredClientOrDepartment || '-',
          'Provider / Distributor': cov.provider,
          'Owner':                  cov.owner,
          'Document':               '-',
          'Renewal':                cov.endDate,
          'Notice':                 noticeFromAlertPolicy(cov.alertPolicy),
          'Legal status':           'Active',
          'Next action':            'Review coverage',
          'Risk':                   '-' };
    var covRow = contractsCols.map(function(col) { return colValueMap[col] !== undefined ? colValueMap[col] : '-'; });
    // Store full coverage object as meta so the Contracts drawer can display
    // the bidirectional "Coverage details" relationship.
    RECORD_STORE.contracts.push({ id: cov.id, row: covRow, meta: cov });
    addActivityEvent({
      eventType:        'support_coverage_added',
      title:            'Support coverage added',
      description:      resolvedName + ' was linked to ' + (cov.coveredRecordName || 'this record') + '.',
      sourceModule:     cov.coveredModule,
      sourceRecordId:   cov.coveredRecordId,
      sourceRecordName: cov.coveredRecordName,
      relatedModule:    'contracts',
      relatedRecordId:  cov.id,
      relatedRecordName: resolvedName,
      workspaceMode:    workspaceMode,
    });
    setSessionSupportCoverage(function(prev) { return prev.concat([cov]); });
    setSupportOpen(false);
    setSupportForm({});
    setSupportErrors({});
  }

  function openCreateTask() {
    var prefillOwner = getDetailField(selectedRecord,
      'Renewal Owner', 'Owner', 'Coverage Owner',
      'IT Owner / Budget Owner', 'IT Owner', 'Budget Owner') || '';
    setTaskForm({ status: 'Open', priority: 'Medium', owner: prefillOwner });
    setTaskErrors({});
    setTaskOpen(true);
  }

  function handleTaskSave() {
    var errs = {};
    if (!(taskForm.title || '').trim())    errs.title    = 'Required';
    if (!(taskForm.taskType || '').trim()) errs.taskType = 'Required';
    if (!(taskForm.owner || '').trim())    errs.owner    = 'Required';
    if (!(taskForm.dueDate || '').trim())  errs.dueDate  = 'Required';
    if (!(taskForm.priority || '').trim()) errs.priority = 'Required';
    if (!(taskForm.status || '').trim())   errs.status   = 'Required';
    if (Object.keys(errs).length) { setTaskErrors(errs); return; }
    var today = new Date().toISOString().slice(0, 10);
    var task = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      moduleKey: 'tasks',
      source: 'userCreated',
      title: taskForm.title.trim(),
      taskType: taskForm.taskType,
      owner: taskForm.owner,
      dueDate: taskForm.dueDate,
      priority: taskForm.priority,
      status: taskForm.status,
      notes: taskForm.notes || '',
      sourceModule: selectedRecord.moduleKey,
      sourceRecordId: selectedRecord.id,
      sourceRecordName: selectedRecord.row[0] || '',
      workspaceMode: workspaceMode,
      createdAt: today,
    };
    var isIT = workspaceMode === 'Internal IT';
    var clientOrDept = isIT
      ? getDetailField(selectedRecord, 'Department', 'Business Unit', 'Cost Center', 'Client / Department')
      : getDetailField(selectedRecord, 'Client', 'Company', 'Customer', 'Client / Department');
    // Map to task table columns:
    // MSP:  ['Task','Client','Record','Source','Impact','Owner','Priority','Due','Status','Action']
    // IT:   ['Task','Department','Record','Source','Impact','Owner','Priority','Due','Status','Action']
    var taskRow = [
      task.title,
      clientOrDept || '-',
      task.sourceRecordName || '-',
      task.sourceModule,
      task.taskType || '-',
      task.owner,
      task.priority,
      task.dueDate,
      task.status,
      'Open task',
    ];
    task.sourceClientOrDepartment = clientOrDept || '';
    // Snapshot the linked record's row + columns so the task drawer can always
    // show the source record's details without relying on RECORD_STORE stability.
    task.linkedRecordSnapshot = {
      name:        task.sourceRecordName,
      moduleKey:   task.sourceModule,
      clientOrDept: task.sourceClientOrDepartment,
      row:         selectedRecord.row,
      columns:     selectedRecord.columns,
    };
    // REL-1b: additive standard relationship vocabulary. source* above is legacy
    // (points to the parent record); target* is the standard naming for a future
    // backend `relationships` table. No consumer reads these fields yet.
    task.relationshipType      = 'task_for_record';
    task.targetModule          = selectedRecord.moduleKey;
    task.targetRecordId        = selectedRecord.id;
    task.targetRecordName      = selectedRecord.row[0] || '';
    task.direction             = 'source_to_target';
    task.relationshipCreatedAt = today;
    RECORD_STORE.tasks.push({ id: task.id, row: taskRow, meta: task });
    addActivityEvent({
      eventType:        'task_created',
      title:            'Task created',
      description:      task.title + ' was created and assigned to ' + task.owner + '.',
      sourceModule:     task.sourceModule,
      sourceRecordId:   task.sourceRecordId,
      sourceRecordName: task.sourceRecordName,
      relatedModule:    'tasks',
      relatedRecordId:  task.id,
      relatedRecordName: task.title,
      workspaceMode:    workspaceMode,
    });
    setSessionTasks(function(prev) { return prev.concat([task]); });
    setTaskOpen(false);
    setTaskForm({});
    setTaskErrors({});
  }

  // Opens any linked record in this same drawer.
  // Tries exact ID match first; falls back to row[0] name match so stale IDs
  // (caused by RECORD_STORE re-initialisation on module mount) still resolve.
  function openLinkedRecord(targetModuleKey, targetRecordId, fallbackName) {
    ensureModuleRecordsLoaded(targetModuleKey, workspaceMode);
    var storeArr = RECORD_STORE[targetModuleKey];
    if (!Array.isArray(storeArr)) return;
    var rec = storeArr.find(function(r) { return r.id === targetRecordId; })
           || (fallbackName ? storeArr.find(function(r) { return r.row && r.row[0] === fallbackName; }) : null);
    if (!rec) return;
    var cols = getModuleColumns(targetModuleKey, workspaceMode);
    setSelectedRecord({ id: rec.id, moduleKey: targetModuleKey, columns: cols, row: rec.row, localRowIndex: -1, meta: rec.meta || null });
    setActiveDetailTab('Overview');
    setDetailOpen(true);
  }

  function handleFormField(key, value) {
    setForm(function(prev) {
      var next = Object.assign({}, prev);
      next[key] = value;
      if (module === 'Licenses') {
        if (key === 'name') {
          var prod = getProductByName(value);
          if (prod) {
            next.brand = prod.brand;
            // Core-2: License uses key `provider` in both MSP and Internal IT.
            if (!prev.provider) next.provider = prod.defaultDistributor || '';
            if (!prev.licenseTerm) next.licenseTerm = prod.defaultTerm || '';
            var suggested = suggestRenewalDate(next.startDate, next.licenseTerm);
            if (suggested && !prev.renewalDate) next.renewalDate = suggested;
          }
        }
        if (key === 'startDate' || key === 'licenseTerm') {
          var sd = key === 'startDate' ? value : next.startDate;
          var lt = key === 'licenseTerm' ? value : next.licenseTerm;
          var renewal = suggestRenewalDate(sd, lt);
          if (renewal && !next.renewalDate) next.renewalDate = renewal;
        }
        applyLicenseComputedFields(next);
      }
      return next;
    });
  }

  function handleEditField(key, value) {
    setEditForm(function(prev) {
      var next = Object.assign({}, prev);
      next[key] = value;
      if (module === 'Licenses') {
        if (key === 'name') {
          var prod = getProductByName(value);
          if (prod) {
            next.brand = prod.brand;
            // Core-2: License uses key `provider` in both MSP and Internal IT.
            if (!prev.provider) next.provider = prod.defaultDistributor || '';
            if (!prev.licenseTerm) next.licenseTerm = prod.defaultTerm || '';
            var suggested = suggestRenewalDate(next.startDate, next.licenseTerm);
            if (suggested && !prev.renewalDate) next.renewalDate = suggested;
          }
        }
        if (key === 'startDate' || key === 'licenseTerm') {
          var sd = key === 'startDate' ? value : next.startDate;
          var lt = key === 'licenseTerm' ? value : next.licenseTerm;
          var renewal = suggestRenewalDate(sd, lt);
          if (renewal && !next.renewalDate) next.renewalDate = renewal;
        }
        applyLicenseComputedFields(next);
      }
      return next;
    });
  }

  const displayRows = localRows.filter(function(record) {
    return rowPassesSearch(record.row, search) &&
      filterSpecs.every(function(spec) { return rowPassesFilter(record.row, spec, filters[spec.key] || '', safeColumns); });
  });

  const activeColumns = safeColumns.filter(c => visibleSet.has(c));
  const activeRows = displayRows.map(function(record) {
    var r = record.row;
    return safeColumns.reduce(function(acc, col, i) { if (visibleSet.has(col)) acc.push(r[i] !== undefined ? r[i] : ''); return acc; }, []);
  });
  const usingLocalStoreRecords = localRows.some(function(record) { return isLocalStoreRecord(record, workspaceMode); });

  const fieldStyle = { width: '100%', border: '1px solid #DDE6F1', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', outline: 0, background: '#FAFCFF', color: '#132033', boxSizing: 'border-box' };
  const errStyle   = { color: '#DC2626', fontSize: 12, marginTop: 4, display: 'block' };
  const closeBtn   = { border: '1px solid #E5E7EB', background: '#F8FAFC', color: '#64748B', fontSize: 16, width: 32, height: 32, borderRadius: 8, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 };
  const modalWrap  = { position: 'fixed', inset: 0, background: 'rgba(11,31,58,.42)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const modalBox   = (w) => ({ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: 24, width: w, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', boxShadow: '0 24px 80px rgba(11,31,58,.22)', display: 'grid', gap: 16 });
  const eyebrow    = { margin: '0 0 4px', color: '#0D9488', textTransform: 'uppercase', fontSize: 11, letterSpacing: '.14em', fontWeight: 900 };
  const modalH2    = { margin: 0, color: '#0B1F3A', fontSize: 20, letterSpacing: '-.03em' };
  const modalFoot       = { display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #EEF2F7' };
  const detailActionBtn = { fontSize: 13, padding: '7px 12px', color: '#64748B', background: '#F8FAFC', borderColor: '#E5E7EB' };
  function formatComputedField(key, value) {
    if (value === undefined || value === null || value === '') return '';
    if (key === 'marginDollar') return '$' + parseFloat(value).toLocaleString();
    if (key === 'margin') return value + '%';
    return value;
  }

  return <main className="content">
    <ScreenHeader active={active} subtitle={note}><button>Bulk actions</button><button onClick={() => setConfigOpen(true)}>Configure columns</button><button className="primary" onClick={openNew}>{module === 'Documents' ? 'Upload document' : 'New record'}</button></ScreenHeader>
    <AiInsightBar active={active}/>

    {configOpen && <div style={modalWrap} onClick={() => setConfigOpen(false)} role="dialog" aria-modal="true" aria-label="Configure columns">
      <div style={modalBox(380)} onClick={e => e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
          <div><p style={eyebrow}>Column visibility</p><h2 style={modalH2}>Configure columns</h2></div>
          <button style={closeBtn} onClick={() => setConfigOpen(false)} aria-label="Close">x</button>
        </div>
        <p style={{margin:0,color:'#64748B',fontSize:13,lineHeight:1.45}}>{activeColumns.length} of {safeColumns.length} columns visible</p>
        <div style={{display:'grid',gap:6}}>
          {safeColumns.map(col => {
            const isOn = visibleSet.has(col);
            const isLast = visibleSet.size === 1 && isOn;
            return <label key={col} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',border:'1px solid',borderColor:isOn?'#DDEFEA':'#E5E7EB',borderRadius:12,background:isOn?'#F6FEFC':'#FAFCFF',cursor:isLast?'not-allowed':'pointer',userSelect:'none',opacity:isLast?.55:1}}>
              <input type="checkbox" checked={isOn} disabled={isLast} onChange={() => toggleCol(col)} style={{accentColor:'#0D9488',width:16,height:16,flexShrink:0,cursor:isLast?'not-allowed':'pointer'}}/>
              <span style={{color:'#132033',fontSize:14,fontWeight:700,flex:1}}>{col}</span>
              {isOn && <span style={{fontSize:11,color:'#0D9488',fontWeight:800,letterSpacing:'.04em'}}>ON</span>}
            </label>;
          })}
        </div>
        <div style={modalFoot}>
          <button onClick={() => setVisibleSet(new Set(safeColumns))} style={{color:'#64748B',background:'#F8FAFC',borderColor:'#E5E7EB'}}>Reset to default</button>
          <button className="primary" onClick={() => setConfigOpen(false)}>Done</button>
        </div>
      </div>
    </div>}

    {newOpen && <div style={modalWrap} onClick={() => setNewOpen(false)} role="dialog" aria-modal="true" aria-label={'New ' + module + ' record'}>
      <div ref={newModalRef} onKeyDown={newModalKeyDown} style={modalBox(520)} onClick={e => e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
          <div>
            <p style={eyebrow}>{module}</p>
            <h2 style={modalH2}>{module === 'Documents' ? 'Upload document' : 'New record'}</h2>
            {module === 'Documents' && <p style={{margin:'4px 0 0',fontSize:12,color:'#64748B',lineHeight:1.45}}>Upload a document to the vault. You can link it to a record now or later.</p>}
          </div>
          <button style={closeBtn} onClick={() => setNewOpen(false)} aria-label="Close">x</button>
        </div>
        {(() => {
          const reqF  = formFields.filter(f => f.required);
          const optF  = formFields.filter(f => !f.required && !f.multi);
          const noteF = formFields.filter(f => f.multi);
          const renderF = (f) => <div key={f.key}>
            <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>
              {f.label}{f.required && <span style={{color:'#DC2626',marginLeft:3}}>*</span>}
              {f.type === 'computed' && <span style={{marginLeft:6,fontSize:11,fontWeight:600,color:'#94A3B8'}}>auto</span>}
            </label>
            {f.multi
              ? <textarea value={form[f.key]||''} onChange={e => handleFormField(f.key, e.target.value)} rows={3} style={{...fieldStyle,resize:'vertical'}}/>
              : f.type === 'computed'
                ? <input type="text" value={formatComputedField(f.key, form[f.key])} readOnly placeholder="Calculated" style={{...fieldStyle,background:'#F0F4F8',color:form[f.key]?'#0F766E':'#94A3B8',cursor:'default'}}/>
                : f.type === 'file'
                  ? <div>
                      <input type="file" id={'fpick-new-'+f.key} style={{display:'none'}} onChange={function(e) {
                        var file = e.target.files && e.target.files[0];
                        if (!file) return;
                        var meta = extractFileMetadata(file);
                        setForm(function(prev) {
                          var next = Object.assign({}, prev, meta);
                          if (!prev.name) next.name = autoFillDocName(file.name);
                          return next;
                        });
                      }}/>
                      <label htmlFor={'fpick-new-'+f.key} style={{...fieldStyle,display:'flex',alignItems:'center',gap:8,cursor:'pointer',background:form.fileName?'#F6FEFC':'#FAFCFF',borderColor:form.fileName?'#99E6DA':'#DDE6F1',userSelect:'none'}}>
                        <span style={{fontSize:16,flexShrink:0}}>📎</span>
                        <span style={{fontSize:13,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:form.fileName?'#132033':'#94A3B8'}}>{form.fileName || 'Choose file...'}</span>
                        {form.fileName && <span style={{fontSize:11,color:'#0F766E',fontWeight:700,flexShrink:0}}>✓</span>}
                      </label>
                      {form.fileName && <div style={{marginTop:5,fontSize:11,color:'#64748B'}}>
                        {[form.fileName.split('.').pop().toUpperCase(), fmtFileSize(form.fileSize)].filter(Boolean).join(' · ')}
                      </div>}
                    </div>
                  : f.useSearchableSelect
                    ? // S1b pilot — License Owner uses SearchableSelect in the
                      // New Record modal. Outer <label> above already shows the
                      // label + required asterisk, so we don't pass `label` or
                      // `required` (avoids double asterisk); we pass ariaLabel
                      // for screen readers and required only via aria.
                      <SearchableSelect
                        value={form[f.key]||''}
                        onChange={v => handleFormField(f.key, v)}
                        options={f.source ? resolveFieldOptions(f.source, workspaceMode) : (f.options||[])}
                        placeholder={f.placeholder || 'Search owner...'}
                        ariaLabel={f.label}
                        required={!!f.required}
                        allowCreate={false}
                      />
                    : f.type === 'select'
                      ? <select value={form[f.key]||''} onChange={e => handleFormField(f.key, e.target.value)} style={{...fieldStyle,cursor:'pointer',color:form[f.key]?'#132033':'#94A3B8'}}>
                          <option value="">Select...</option>
                          {(f.source ? resolveFieldOptions(f.source, workspaceMode) : (f.options||[])).map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      : <input type={f.type||'text'} value={form[f.key]||''} onChange={e => handleFormField(f.key, e.target.value)} placeholder={f.placeholder||''} style={fieldStyle}/>
            }
            {errors[f.key] && <span style={errStyle}>{errors[f.key]}</span>}
          </div>;
          return <>
            {reqF.length > 0 && <div style={{display:'grid',gap:12}}>{reqF.map(renderF)}</div>}
            {optF.length > 0 && <>
              <div style={{display:'flex',alignItems:'center',gap:8,margin:'4px 0 -4px'}}>
                <span style={{fontSize:11,fontWeight:800,color:'#94A3B8',letterSpacing:'.1em',textTransform:'uppercase',flexShrink:0}}>Optional</span>
                <div style={{flex:1,height:1,background:'#EEF2F7'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{optF.map(renderF)}</div>
            </>}
            {noteF.length > 0 && <div style={{display:'grid',gap:12}}>{noteF.map(renderF)}</div>}
          </>;
        })()}
        <div style={{...modalFoot,justifyContent:'flex-end'}}>
          <button onClick={() => setNewOpen(false)}>Cancel</button>
          <button className="primary" onClick={handleSave}>Save record</button>
        </div>
      </div>
    </div>}

    {filterOpen && <div style={modalWrap} onClick={() => setFilterOpen(false)} role="dialog" aria-modal="true" aria-label="Advanced filters">
      <div style={modalBox(480)} onClick={e => e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
          <div>
            <p style={eyebrow}>{module}</p>
            <h2 style={modalH2}>Advanced filters</h2>
            {filterCount > 0 && <p style={{margin:'4px 0 0',color:'#1D4ED8',fontSize:13,fontWeight:700}}>{filterCount} filter{filterCount !== 1 ? 's' : ''} active</p>}
          </div>
          <button style={closeBtn} onClick={() => setFilterOpen(false)} aria-label="Close">x</button>
        </div>
        {filterSpecs.length > 0
          ? <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {filterSpecs.map(spec => {
                const options = getFilterOptions(spec, localRows.map(function(r) { return r.row; }), safeColumns);
                const val = filters[spec.key] || '';
                return <div key={spec.key}>
                  <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>{spec.label}</label>
                  <select value={val} onChange={e => setFilters(p => ({...p,[spec.key]:e.target.value}))} style={{width:'100%',border:'1px solid #DDE6F1',borderRadius:10,padding:'10px 12px',fontSize:14,fontFamily:'inherit',outline:0,background:'#FAFCFF',color:val?'#132033':'#94A3B8',cursor:'pointer'}}>
                    <option value="">All</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>;
              })}
            </div>
          : <p style={{margin:0,color:'#64748B',fontSize:13}}>No filters available for this module.</p>
        }
        <div style={modalFoot}>
          <button onClick={clearFilters} style={{color:'#64748B',background:'#F8FAFC',borderColor:'#E5E7EB'}}>Clear all filters</button>
          <button className="primary" onClick={() => setFilterOpen(false)}>Done</button>
        </div>
      </div>
    </div>}

    {attachDocOpen && selectedRecord && <div style={modalWrap} onClick={() => setAttachDocOpen(false)} role="dialog" aria-modal="true" aria-label="Attach document">
      <div style={modalBox(520)} onClick={e => e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
          <div>
            <p style={eyebrow}>{selectedRecord.moduleKey}</p>
            <h2 style={modalH2}>Attach document</h2>
            <p style={{margin:'4px 0 0',fontSize:12,color:'#64748B',lineHeight:1.4}}>{selectedRecord.row[0] || 'Record'}</p>
          </div>
          <button style={closeBtn} onClick={() => setAttachDocOpen(false)} aria-label="Close">x</button>
        </div>
        {(() => {
          var reqF  = ATTACH_DOC_FIELDS.filter(function(f) { return f.required; });
          var optF  = ATTACH_DOC_FIELDS.filter(function(f) { return !f.required && !f.multi; });
          var noteF = ATTACH_DOC_FIELDS.filter(function(f) { return f.multi; });
          var renderAF = function(f) {
            return <div key={f.key}>
              <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>
                {f.label}{f.required && <span style={{color:'#DC2626',marginLeft:3}}>*</span>}
              </label>
              {f.multi
                ? <textarea value={attachDocForm[f.key]||''} onChange={function(e) { setAttachDocForm(function(p) { return Object.assign({},p,{[f.key]:e.target.value}); }); }} rows={3} style={{...fieldStyle,resize:'vertical'}}/>
                : f.useSearchableSelect
                  ? (function() {
                      // Core-4b — Attach Document honors useSearchableSelect for
                      // Uploaded by, matching the standalone Upload form.
                      var currentValue = attachDocForm[f.key] || '';
                      var baseOptions = f.source ? resolveFieldOptions(f.source, workspaceMode) : (f.options || []);
                      var options = currentValue && !baseOptions.some(function(o) { return String(o) === String(currentValue); })
                        ? [currentValue].concat(baseOptions) : baseOptions;
                      return <SearchableSelect
                        value={currentValue}
                        onChange={function(val) { setAttachDocForm(function(p) { return Object.assign({},p,{[f.key]:val}); }); }}
                        options={options}
                        placeholder={f.placeholder || 'Search...'}
                        ariaLabel={f.label}
                        required={!!f.required}
                        allowCreate={false}
                      />;
                    })()
                : f.type === 'file'
                  ? <div>
                      <input type="file" id={'fpick-af-'+f.key} style={{display:'none'}} onChange={function(e) {
                        var file = e.target.files && e.target.files[0];
                        if (!file) return;
                        var meta = extractFileMetadata(file);
                        setAttachDocForm(function(p) {
                          var next = Object.assign({}, p, meta);
                          if (!p.name) next.name = autoFillDocName(file.name);
                          return next;
                        });
                      }}/>
                      <label htmlFor={'fpick-af-'+f.key} style={{...fieldStyle,display:'flex',alignItems:'center',gap:8,cursor:'pointer',background:attachDocForm.fileName?'#F6FEFC':'#FAFCFF',borderColor:attachDocForm.fileName?'#99E6DA':'#DDE6F1',userSelect:'none'}}>
                        <span style={{fontSize:16,flexShrink:0}}>📎</span>
                        <span style={{fontSize:13,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:attachDocForm.fileName?'#132033':'#94A3B8'}}>{attachDocForm.fileName || 'Choose file...'}</span>
                        {attachDocForm.fileName && <span style={{fontSize:11,color:'#0F766E',fontWeight:700,flexShrink:0}}>✓</span>}
                      </label>
                      {attachDocForm.fileName && <div style={{marginTop:5,fontSize:11,color:'#64748B'}}>
                        {[attachDocForm.fileName.split('.').pop().toUpperCase(), fmtFileSize(attachDocForm.fileSize)].filter(Boolean).join(' · ')}
                      </div>}
                    </div>
                  : f.type === 'select'
                    ? <select value={attachDocForm[f.key]||''} onChange={function(e) { setAttachDocForm(function(p) { return Object.assign({},p,{[f.key]:e.target.value}); }); }} style={{...fieldStyle,cursor:'pointer',color:attachDocForm[f.key]?'#132033':'#94A3B8'}}>
                        <option value="">Select...</option>
                        {(f.source ? resolveFieldOptions(f.source, workspaceMode) : (f.options||[])).map(function(o) { return <option key={o} value={o}>{o}</option>; })}
                      </select>
                    : f.type === 'date'
                    ? <input type="date" value={attachDocForm[f.key]||''} onChange={function(e) { setAttachDocForm(function(p) { return Object.assign({},p,{[f.key]:e.target.value}); }); }} style={fieldStyle}/>
                    : <input type="text" value={attachDocForm[f.key]||''} onChange={function(e) { setAttachDocForm(function(p) { return Object.assign({},p,{[f.key]:e.target.value}); }); }} style={fieldStyle}/>
              }
              {attachDocErrors[f.key] && <span style={errStyle}>{attachDocErrors[f.key]}</span>}
            </div>;
          };
          return <>
            {reqF.length > 0 && <div style={{display:'grid',gap:12}}>{reqF.map(renderAF)}</div>}
            {optF.length > 0 && <>
              <div style={{display:'flex',alignItems:'center',gap:8,margin:'4px 0 -4px'}}>
                <span style={{fontSize:11,fontWeight:800,color:'#94A3B8',letterSpacing:'.1em',textTransform:'uppercase',flexShrink:0}}>Optional</span>
                <div style={{flex:1,height:1,background:'#EEF2F7'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{optF.map(renderAF)}</div>
            </>}
            {noteF.length > 0 && <div style={{display:'grid',gap:12}}>{noteF.map(renderAF)}</div>}
          </>;
        })()}
        <div style={{...modalFoot,justifyContent:'flex-end'}}>
          <button onClick={() => setAttachDocOpen(false)}>Cancel</button>
          <button className="primary" onClick={handleAttachDocSave}>Attach document</button>
        </div>
      </div>
    </div>}

    {taskOpen && selectedRecord && (() => {
      // F1c: render from getTaskFields spec instead of inline JSX. Visual layout
      // is preserved exactly via the `group` buckets (primary 1-col, grid 2-col,
      // notes after the Optional divider). Save behavior and labels unchanged.
      var taskFields = getTaskFields(workspaceMode, 'linked');
      var renderTaskField = function(f) {
        var control;
        if (f.useSearchableSelect) {
          // Core-4a — Create Task drawer honors useSearchableSelect for Owner,
          // matching the global New Task modal. Off-catalog value preserved.
          var currentValue = taskForm[f.key] || '';
          var baseOptions = f.source ? resolveFieldOptions(f.source, workspaceMode) : (f.options || []);
          var options = currentValue && !baseOptions.some(function(o) { return String(o) === String(currentValue); })
            ? [currentValue].concat(baseOptions) : baseOptions;
          control = <SearchableSelect
            value={currentValue}
            onChange={function(val) { setTaskForm(function(p) { return Object.assign({},p,{[f.key]:val}); }); }}
            options={options}
            placeholder={f.placeholder || 'Search...'}
            ariaLabel={f.label}
            required={!!f.required}
            allowCreate={false}
          />;
        } else if (f.type === 'select') {
          control = <select value={taskForm[f.key]||''} onChange={function(e) { setTaskForm(function(p) { return Object.assign({},p,{[f.key]:e.target.value}); }); }} style={{...fieldStyle,cursor:'pointer',color:taskForm[f.key]?'#132033':'#94A3B8'}}>
            <option value="">{f.emptyLabel || 'Select...'}</option>
            {f.options.map(function(o) { return <option key={o} value={o}>{o}</option>; })}
          </select>;
        } else if (f.type === 'date') {
          control = <input type="date" value={taskForm[f.key]||''} onChange={function(e) { setTaskForm(function(p) { return Object.assign({},p,{[f.key]:e.target.value}); }); }} style={fieldStyle}/>;
        } else if (f.type === 'textarea') {
          control = <textarea value={taskForm[f.key]||''} onChange={function(e) { setTaskForm(function(p) { return Object.assign({},p,{[f.key]:e.target.value}); }); }} rows={3} style={{...fieldStyle,resize:'vertical'}} placeholder={f.placeholder||''}/>;
        } else {
          control = <input type="text" value={taskForm[f.key]||''} onChange={function(e) { setTaskForm(function(p) { return Object.assign({},p,{[f.key]:e.target.value}); }); }} style={fieldStyle} placeholder={f.placeholder||''}/>;
        }
        return <div key={f.key}>
          <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>
            {f.label}{f.required && <span style={{color:'#DC2626',marginLeft:3}}>*</span>}
          </label>
          {control}
          {taskErrors[f.key] && <span style={errStyle}>{taskErrors[f.key]}</span>}
        </div>;
      };
      var primaryF = taskFields.filter(function(f) { return f.group === 'primary'; });
      var gridF    = taskFields.filter(function(f) { return f.group === 'grid'; });
      var notesF   = taskFields.filter(function(f) { return f.group === 'notes'; });
      return <div style={modalWrap} onClick={function() { setTaskOpen(false); }} role="dialog" aria-modal="true" aria-label="Create task">
        <div style={modalBox(520)} onClick={function(e) { e.stopPropagation(); }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
            <div>
              <p style={eyebrow}>{selectedRecord.moduleKey} · {selectedRecord.row[0]}</p>
              <h2 style={modalH2}>Create task</h2>
              <p style={{margin:'4px 0 0',fontSize:12,color:'#64748B',lineHeight:1.4}}>Create a follow-up task tied to this record. It will appear in the Tasks module and in this drawer.</p>
            </div>
            <button style={closeBtn} onClick={function() { setTaskOpen(false); }} aria-label="Close">x</button>
          </div>
          <div style={{display:'grid',gap:12}}>{primaryF.map(renderTaskField)}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{gridF.map(renderTaskField)}</div>
          <div style={{display:'flex',alignItems:'center',gap:8,margin:'4px 0 -4px'}}>
            <span style={{fontSize:11,fontWeight:800,color:'#94A3B8',letterSpacing:'.1em',textTransform:'uppercase',flexShrink:0}}>Optional</span>
            <div style={{flex:1,height:1,background:'#EEF2F7'}}/>
          </div>
          <div style={{display:'grid',gap:12}}>{notesF.map(renderTaskField)}</div>
          <div style={{...modalFoot,justifyContent:'flex-end'}}>
            <button onClick={function() { setTaskOpen(false); }}>Cancel</button>
            <button className="primary" onClick={handleTaskSave}>Save task</button>
          </div>
        </div>
      </div>;
    })()}

    {supportOpen && selectedRecord && (() => {
      var covFields = getSupportCoverageFields(workspaceMode);
      var reqF  = covFields.filter(function(f) { return f.required; });
      var optF  = covFields.filter(function(f) { return !f.required && !f.multi; });
      var noteF = covFields.filter(function(f) { return f.multi; });
      var helperText = workspaceMode === 'Internal IT'
        ? 'Track internal support, manufacturer warranty, maintenance or SLA coverage linked to this asset.'
        : 'Create a renewable customer support, vendor support, warranty or SLA coverage record linked to this item.';
      var renderSF = function(f) {
        return <div key={f.key}>
          <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>
            {f.label}{f.required && <span style={{color:'#DC2626',marginLeft:3}}>*</span>}
          </label>
          {f.multi
            ? <textarea value={supportForm[f.key]||''} onChange={function(e) { setSupportForm(function(p) { return Object.assign({},p,{[f.key]:e.target.value}); }); }} rows={3} style={{...fieldStyle,resize:'vertical'}}/>
            : f.useSearchableSelect
              ? (function() {
                  // Core-3 — Support Coverage honors useSearchableSelect for
                  // provider / owner. Preserve the current value as an option
                  // when it is not in the catalog (legacy / imported values).
                  var currentValue = supportForm[f.key] || '';
                  var baseOptions = f.source ? resolveFieldOptions(f.source, workspaceMode) : (f.options || []);
                  var options = currentValue && !baseOptions.some(function(o) { return String(o) === String(currentValue); })
                    ? [currentValue].concat(baseOptions) : baseOptions;
                  return <SearchableSelect
                    value={currentValue}
                    onChange={function(val) { setSupportForm(function(p) { return Object.assign({},p,{[f.key]:val}); }); }}
                    options={options}
                    placeholder={f.placeholder || 'Search...'}
                    ariaLabel={f.label}
                    required={!!f.required}
                    allowCreate={false}
                  />;
                })()
            : f.type === 'select'
              ? <select value={supportForm[f.key]||''} onChange={function(e) { setSupportForm(function(p) { return Object.assign({},p,{[f.key]:e.target.value}); }); }} style={{...fieldStyle,cursor:'pointer',color:supportForm[f.key]?'#132033':'#94A3B8'}}>
                  <option value="">Select...</option>
                  {(f.source ? resolveFieldOptions(f.source, workspaceMode) : (f.options||[])).map(function(o) { return <option key={o} value={o}>{o}</option>; })}
                </select>
              : f.type === 'date'
              ? <input type="date" value={supportForm[f.key]||''} onChange={function(e) { setSupportForm(function(p) { return Object.assign({},p,{[f.key]:e.target.value}); }); }} style={fieldStyle}/>
              : f.type === 'number'
              ? <input type="number" min="0" value={supportForm[f.key]||''} onChange={function(e) { setSupportForm(function(p) { return Object.assign({},p,{[f.key]:e.target.value}); }); }} style={fieldStyle}/>
              : <input type="text" value={supportForm[f.key]||''} onChange={function(e) { setSupportForm(function(p) { return Object.assign({},p,{[f.key]:e.target.value}); }); }} style={fieldStyle}/>
          }
          {supportErrors[f.key] && <span style={errStyle}>{supportErrors[f.key]}</span>}
        </div>;
      };
      return <div style={modalWrap} onClick={function() { setSupportOpen(false); }} role="dialog" aria-modal="true" aria-label="Add support coverage">
        <div style={modalBox(520)} onClick={function(e) { e.stopPropagation(); }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
            <div>
              <p style={eyebrow}>{selectedRecord.moduleKey}</p>
              <h2 style={modalH2}>Add support coverage</h2>
              <p style={{margin:'4px 0 0',fontSize:12,color:'#64748B',lineHeight:1.4}}>{helperText}</p>
            </div>
            <button style={closeBtn} onClick={function() { setSupportOpen(false); }} aria-label="Close">x</button>
          </div>
          {reqF.length > 0 && <div style={{display:'grid',gap:12}}>
            {reqF.map(function(f) {
              return <React.Fragment key={f.key}>
                {renderSF(f)}
                {f.key === 'name' && supportForm.name === 'Other / Custom' && <div>
                  <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>
                    Custom Coverage Name<span style={{color:'#DC2626',marginLeft:3}}>*</span>
                  </label>
                  <input type="text" value={supportForm.customName||''} onChange={function(e) { setSupportForm(function(p) { return Object.assign({},p,{customName:e.target.value}); }); }} style={fieldStyle} placeholder="Enter custom coverage name"/>
                  {supportErrors.customName && <span style={errStyle}>{supportErrors.customName}</span>}
                </div>}
              </React.Fragment>;
            })}
          </div>}
          {optF.length > 0 && <>
            <div style={{display:'flex',alignItems:'center',gap:8,margin:'4px 0 -4px'}}>
              <span style={{fontSize:11,fontWeight:800,color:'#94A3B8',letterSpacing:'.1em',textTransform:'uppercase',flexShrink:0}}>Optional</span>
              <div style={{flex:1,height:1,background:'#EEF2F7'}}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{optF.map(renderSF)}</div>
          </>}
          {noteF.length > 0 && <div style={{display:'grid',gap:12}}>{noteF.map(renderSF)}</div>}
          <div style={{...modalFoot,justifyContent:'flex-end'}}>
            <button onClick={function() { setSupportOpen(false); }}>Cancel</button>
            <button className="primary" onClick={handleSupportSave}>Save coverage</button>
          </div>
        </div>
      </div>;
    })()}

    <section className="panel worklistPanel">
      <div className="tabs">{tabs.map((tab,i)=><button key={tab} className={i===0?'active':''}>{tab}</button>)}</div>
      <div className="toolbar">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={inputPlaceholder}/>
        <button>Saved view: Operational risk</button>
        <button onClick={() => setFilterOpen(true)} style={filterCount > 0 ? {background:'#EFF6FF',borderColor:'#BFDBFE',color:'#1D4ED8'} : {}}>
          Advanced filters
          {filterCount > 0 && <span style={{marginLeft:6,display:'inline-flex',alignItems:'center',justifyContent:'center',background:'#2563EB',color:'#fff',borderRadius:999,width:18,height:18,fontSize:11,fontWeight:800,verticalAlign:'middle',flexShrink:0}}>{filterCount}</span>}
        </button>
        <button>AI summary</button>
        {hasActiveFilter && <button onClick={clearFilters} style={{color:'#64748B',background:'#F8FAFC',borderColor:'#E5E7EB',fontSize:12,padding:'6px 10px'}}>Clear filters</button>}
      </div>
      <div className="panelTitle"><h2>{active} worklist</h2><span>{ai}</span></div>
      {usingLocalStoreRecords && <p style={{margin:'-6px 0 10px',color:'#64748B',fontSize:12,lineHeight:1.45}}>Showing local sandbox records. Demo data is used only when no local records exist.</p>}
      {activeRows.length === 0
        ? <div className="stateBox emptyState" style={{marginTop:8,textAlign:'center',padding:'28px 20px'}}>
            <strong style={{display:'block',color:'#132033',marginBottom:6}}>No records match the current filters.</strong>
            <span style={{color:'#64748B',fontSize:13,display:'block',marginBottom:hasActiveFilter?14:0}}>Adjust or clear your filters to see all records.</span>
            {hasActiveFilter && <button onClick={clearFilters}>Clear all filters</button>}
          </div>
        : <Table columns={activeColumns} rows={activeRows} onRowOpen={(idx) => { const r = activeRows[idx]; const record = displayRows[idx]; if (r && record) { const localIdx = localRows.indexOf(record); setSelectedRecord({id: record.id, moduleKey: moduleKey, columns: activeColumns, row: r, localRowIndex: localIdx, meta: record.meta || null}); setEditMode(false); setActiveDetailTab('Overview'); setDetailOpen(true); } }}/>
      }
    </section>

    {detailOpen && selectedRecord && <>
      <style>{`.agentWrap,.floatingAgentWrap{display:none!important}`}</style>
      <div style={{position:'fixed',inset:0,background:'rgba(11,31,58,.18)',zIndex:48}} onClick={() => { setDetailOpen(false); setEditMode(false); }} aria-hidden="true"/>
      <aside ref={detailDrawerRef} onKeyDown={detailDrawerKeyDown} role="dialog" aria-modal="true" aria-label={editMode ? 'Edit record' : 'Record detail'} style={{position:'fixed',right:0,top:0,bottom:0,width:'min(440px,100vw)',background:'#fff',borderLeft:'1px solid #E5E7EB',boxShadow:'-8px 0 40px rgba(11,31,58,.16)',zIndex:49,display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Drawer header — always visible */}
        {(() => {
          const recordTitle = selectedRecord.row[0] || 'Record';
          const contextParts = [
            getDetailField(selectedRecord, 'Client', 'Department', 'Client / Department'),
            getDetailField(selectedRecord, 'Brand', 'Vendor', 'Provider / Vendor', 'Provider', 'Distributor', 'Provider / Distributor'),
            getDetailField(selectedRecord, 'Quantity / Seats', 'Quantity', 'Seats', 'Users / Seats')
          ].filter(Boolean);
          // For support coverage contracts, append "Covers <record>" so the
          // header makes the covered asset immediately visible.
          if (selectedRecord.meta && selectedRecord.meta.source === 'supportCoverage' && selectedRecord.meta.coveredRecordName) {
            contextParts.push('Covers ' + selectedRecord.meta.coveredRecordName);
          }
          const status = getDetailField(selectedRecord, 'Status', 'System Status', 'Legal status', 'Approval Status', 'Document Status');
          const renewal = getDetailField(selectedRecord, 'Renewal', 'Expiration', 'Expiration / Renewal Date', 'Warranty End', 'Warranty end', 'End Date', 'Renewal Date');
          const owner  = getDetailField(selectedRecord, 'Owner', 'Renewal Owner', 'IT Owner / Budget Owner', 'Uploaded by');
          return <div style={{padding:'12px 16px 10px',borderBottom:'1px solid #EEF2F7',display:'grid',gap:7,flexShrink:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
              <div style={{minWidth:0,flex:1}}>
                <p style={{margin:'0 0 3px',color:'#0D9488',textTransform:'uppercase',fontSize:9.5,letterSpacing:'.14em',fontWeight:900,lineHeight:1}}>{(selectedRecord.moduleKey || module).toUpperCase()}</p>
                <h2 style={{margin:0,color:'#0B1F3A',fontSize:16.5,letterSpacing:'-.015em',lineHeight:1.18,wordBreak:'break-word',fontWeight:800}}>{recordTitle}</h2>
              </div>
              <button style={{...closeBtn,width:26,height:26,borderRadius:7,fontSize:12,background:'#fff',borderColor:'#EEF2F7',color:'#94A3B8',boxShadow:'none'}} onClick={() => { setDetailOpen(false); setEditMode(false); }} aria-label="Close">x</button>
            </div>
            {contextParts.length > 0 && <div style={{color:'#64748B',fontSize:12,lineHeight:1.35,wordBreak:'break-word'}}>{contextParts.join(' · ')}</div>}
            {(status || renewal || owner) && <div style={{display:'flex',flexWrap:'wrap',gap:6,alignItems:'center',color:'#64748B',fontSize:11.5,lineHeight:1.2}}>
              {status && <Badge tone={status}>{status}</Badge>}
              {renewal && <span>Expires {renewal}</span>}
              {owner && <span>Owner: {owner}</span>}
            </div>}
          </div>;
        })()}

        {/* Tab bar — hidden in edit mode */}
        {!editMode && <div style={{display:'flex',borderBottom:'1px solid #EEF2F7',flexShrink:0,overflowX:'auto',padding:'0 12px'}}>
          {['Overview','Relationships','Documents','Tasks','Activity'].map(function(tab) {
            var isActive = activeDetailTab === tab;
            return <button key={tab} onClick={() => setActiveDetailTab(tab)} style={{padding:'7px 8px 6px',fontSize:11,fontWeight:isActive?800:650,color:isActive?'#0D9488':'#64748B',background:'transparent',border:'none',borderBottom:isActive?'2px solid #0D9488':'2px solid transparent',cursor:'pointer',flexShrink:0,fontFamily:'inherit',whiteSpace:'nowrap',marginBottom:-1,lineHeight:1,letterSpacing:0}}>
              {tab}
            </button>;
          })}
        </div>}

        {/* Tab body */}
        {editMode
          ? <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'grid',gap:12,alignContent:'start'}}>
              {(() => {
                const reqF  = fieldSpecs.filter(f => f.required && f.type !== 'file');
                const optF  = fieldSpecs.filter(f => !f.required && !f.multi && f.type !== 'file');
                const noteF = fieldSpecs.filter(f => f.multi);
                const renderEF = (f) => <div key={f.key}>
                  <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>
                    {f.label}{f.required && <span style={{color:'#DC2626',marginLeft:3}}>*</span>}
                    {f.type === 'computed' && <span style={{marginLeft:6,fontSize:11,fontWeight:600,color:'#94A3B8'}}>auto</span>}
                  </label>
                  {f.multi
                    ? <textarea value={editForm[f.key]||''} onChange={e => handleEditField(f.key, e.target.value)} rows={3} style={{...fieldStyle,resize:'vertical'}}/>
                    : f.type === 'computed'
                      ? <input type="text" value={formatComputedField(f.key, editForm[f.key])} readOnly placeholder="Calculated" style={{...fieldStyle,background:'#F0F4F8',color:editForm[f.key]?'#0F766E':'#94A3B8',cursor:'default'}}/>
                    : f.useSearchableSelect
                      ? (() => {
                          // F3a — Edit drawer honors useSearchableSelect for the
                          // same catalog fields migrated in New Record. The current
                          // value is preserved as an option even when it is not in
                          // the catalog (legacy / imported values), so editing an
                          // off-catalog record never drops its value. allowCreate
                          // stays false; the catalog owns the identity (AGENTS §17).
                          const currentValue = editForm[f.key] || '';
                          const baseOptions = f.source ? resolveFieldOptions(f.source, workspaceMode) : (f.options || []);
                          const options = currentValue && !baseOptions.some(o => String(o) === String(currentValue))
                            ? [currentValue].concat(baseOptions)
                            : baseOptions;
                          return <SearchableSelect
                            value={currentValue}
                            onChange={v => handleEditField(f.key, v)}
                            options={options}
                            placeholder={f.placeholder || 'Search...'}
                            ariaLabel={f.label}
                            required={!!f.required}
                            allowCreate={false}
                          />;
                        })()
                    : f.type === 'select'
                      ? (() => {
                          const currentValue = editForm[f.key] || '';
                          const baseOptions = f.source ? resolveFieldOptions(f.source, workspaceMode) : (f.options || []);
                          const selectOptions = currentValue && !baseOptions.some(o => String(o) === String(currentValue))
                            ? [currentValue].concat(baseOptions)
                            : baseOptions;
                          return <select value={currentValue} onChange={e => handleEditField(f.key, e.target.value)} style={{...fieldStyle,cursor:'pointer',color:currentValue?'#132033':'#94A3B8'}}>
                            <option value="">Select...</option>
                            {selectOptions.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>;
                        })()
                      : <input type={f.type||'text'} value={editForm[f.key]||''} onChange={e => handleEditField(f.key, e.target.value)} style={fieldStyle}/>
                  }
                  {editErrors[f.key] && <span style={errStyle}>{editErrors[f.key]}</span>}
                </div>;
                return <>
                  {reqF.length > 0 && <div style={{display:'grid',gap:12}}>{reqF.map(renderEF)}</div>}
                  {optF.length > 0 && <>
                    <div style={{display:'flex',alignItems:'center',gap:8,margin:'4px 0 -4px'}}>
                      <span style={{fontSize:11,fontWeight:800,color:'#94A3B8',letterSpacing:'.1em',textTransform:'uppercase',flexShrink:0}}>Optional</span>
                      <div style={{flex:1,height:1,background:'#EEF2F7'}}/>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{optF.map(renderEF)}</div>
                  </>}
                  {noteF.length > 0 && <div style={{display:'grid',gap:12}}>{noteF.map(renderEF)}</div>}
                </>;
              })()}
            </div>
          : activeDetailTab === 'Overview'
          ? <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'grid',gap:10,alignContent:'start'}}>
              {selectedRecord.isNew && <div style={{background:'#F6FEFC',border:'1px solid #DDEFEA',borderRadius:12,padding:'12px 14px',display:'grid',gap:10}}>
                <div>
                  <strong style={{display:'block',color:'#0B1F3A',fontSize:14,marginBottom:3}}>Record setup</strong>
                  <span style={{color:'#64748B',fontSize:12,lineHeight:1.45}}>Complete this record from the correct tabs.</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[
                    ['Attach document','Documents'],
                    ['Link contract','Relationships'],
                    ...(['licenses','hardware'].includes(selectedRecord.moduleKey) ? [['Add support coverage','Relationships']] : []),
                    ['Create task','Tasks'],
                    ['Add notes','Activity']
                  ].map(function(item) {
                    return <button key={item[0]} type="button" onClick={() => setActiveDetailTab(item[1])} style={{...detailActionBtn,background:'#fff',borderColor:'#DDEFEA',color:'#0F766E',justifyContent:'flex-start'}}>
                      {item[0]}
                    </button>;
                  })}
                </div>
              </div>}
              {(() => {
                const product = getDetailField(selectedRecord, 'License / Product', 'Product', 'Asset', 'Contract', 'Contract Name', 'Document', 'Document Name', 'Name') || selectedRecord.row[0];
                const summaryRows = [
                  ['Client / Department', getDetailField(selectedRecord, 'Client', 'Client / Department', 'Department')],
                  ['Product / Record', product],
                  ['Brand / Vendor', getDetailField(selectedRecord, 'Brand', 'Vendor', 'Provider / Vendor', 'Provider', 'Distributor', 'Provider / Distributor')],
                  ['Quantity / Seats', getDetailField(selectedRecord, 'Quantity / Seats', 'Quantity', 'Seats', 'Users / Seats')]
                ].filter(function(row) { return row[1]; });
                const renewalRows = [
                  ['Expiration / Renewal Date', getDetailField(selectedRecord, 'Renewal', 'Expiration', 'Expiration / Renewal Date', 'Warranty End', 'Warranty end', 'End Date', 'Renewal Date')],
                  ['Status', getDetailField(selectedRecord, 'Status', 'System Status', 'Legal status', 'Approval Status', 'Document Status'), 'badge'],
                  ['Owner', getDetailField(selectedRecord, 'Owner', 'Renewal Owner', 'Uploaded by')],
                  ['Alert Policy', getDetailField(selectedRecord, 'Alert Policy')],
                  ['Action', getDetailField(selectedRecord, 'Action', 'Next action', 'Next Action')]
                ].filter(function(row) { return row[1]; });
                const commercialRows = [
                  ['Sale Price / Value', getDetailField(selectedRecord, 'Value', 'Annual Value', 'Sale Price / Annual Value')],
                  ['Vendor Cost', getDetailField(selectedRecord, 'Cost', 'Vendor Cost', 'Annual Cost')],
                  ['Margin', getDetailField(selectedRecord, 'Margin', 'Margin $', 'Margin %')]
                ].filter(function(row) { return row[1]; });
                const notes = getDetailField(selectedRecord, 'Notes', 'Note', 'Description');
                const sectionStyle = {background:'#fff',border:'1px solid #EEF2F7',borderRadius:12,overflow:'hidden'};
                const sectionTitle = {margin:0,padding:'10px 12px 8px',fontSize:11,fontWeight:900,color:'#64748B',textTransform:'uppercase',letterSpacing:'.08em',background:'#FAFCFF',borderBottom:'1px solid #EEF2F7'};
                const renderRows = function(rows) {
                  return <div>{rows.map(function(row, index) {
                    return <div key={row[0]} style={{display:'grid',gridTemplateColumns:'128px minmax(0,1fr)',gap:12,alignItems:'center',padding:'9px 12px',borderTop:index===0?'none':'1px solid #F1F5F9'}}>
                      <span style={{fontSize:12,color:'#94A3B8',fontWeight:700,lineHeight:1.3}}>{row[0]}</span>
                      <span style={{fontSize:13,color:'#132033',fontWeight:650,lineHeight:1.35,wordBreak:'break-word'}}>{row[2] === 'badge' ? <Badge tone={row[1]}>{row[1]}</Badge> : row[1]}</span>
                    </div>;
                  })}</div>;
                };
                const renderSection = function(title, rows) {
                  if (rows.length === 0) return null;
                  return <section style={sectionStyle}>
                    <h3 style={sectionTitle}>{title}</h3>
                    {renderRows(rows)}
                  </section>;
                };
                return <>
                  {renderSection('Summary', summaryRows)}
                  {renderSection('Renewal / Expiration', renewalRows)}
                  {commercialRows.length > 0 && renderSection('Commercial', commercialRows)}
                  <section style={{...sectionStyle,borderStyle:'dashed'}}>
                    <h3 style={sectionTitle}>Notes</h3>
                    <div style={{padding:'10px 12px',fontSize:13,color:notes?'#132033':'#94A3B8',lineHeight:1.45,wordBreak:'break-word'}}>{notes || 'No notes for this record yet.'}</div>
                  </section>
                </>;
              })()}
            </div>
          : activeDetailTab === 'Relationships'
          ? (() => {
              var mk = selectedRecord.moduleKey;
              var isLicHw    = mk === 'licenses' || mk === 'hardware';
              var isContract = mk === 'contracts';
              var isDocument = mk === 'documents';
              var relHelper  = isContract ? 'Connect this contract to the licenses, hardware, services or packages it covers.'
                             : isDocument ? 'Connect this document to the record, package or items it supports.'
                             : 'Connect this record to the items, contracts or packages that belong to the same renewal or operational context.';
              var relButtons = isContract ? ['Link license','Link hardware','Link package']
                             : isDocument ? ['Link record','Link package','Select covered records']
                             : ['Link contract','Link related record','Link package'];
              var covMeta = (isContract && selectedRecord.meta && selectedRecord.meta.source === 'supportCoverage') ? selectedRecord.meta : null;
              // REL-2a: read-only relationship hub datasets. Reuse the EXACT
              // Documents-tab and Tasks-tab filters (top-level linked* / source*)
              // so the hub counts always match what those tabs show. Summary +
              // navigation only — no new state, no linking, no save behavior.
              var relDocs = sessionDocs.filter(function(d) { return d.linkedRecordId === selectedRecord.id && d.linkedModule === selectedRecord.moduleKey; });
              var relTasks = sessionTasks.filter(function(t) { return t.sourceRecordId === selectedRecord.id; });
              var relHubEmpty = relDocs.length === 0 && relTasks.length === 0 && !isLicHw && !covMeta;
              return <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'grid',gap:12,alignContent:'start'}}>
                {covMeta
                  ? <section style={{background:'#fff',border:'1px solid #EEF2F7',borderRadius:12,overflow:'hidden'}}>
                      <div style={{padding:'10px 12px 8px',fontSize:11,fontWeight:900,color:'#64748B',textTransform:'uppercase',letterSpacing:'.08em',background:'#FAFCFF',borderBottom:'1px solid #EEF2F7'}}>Coverage details</div>
                      <div style={{padding:'12px 14px',display:'grid',gap:10}}>
                        {/* Covered record block */}
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                          <strong style={{fontSize:13,color:'#0B1F3A',fontWeight:700,lineHeight:1.3}}>{covMeta.coveredRecordName || '-'}</strong>
                          <span style={{fontSize:11,fontWeight:700,color:'#0F766E',background:'#F0FDF9',border:'1px solid #CCFBEF',borderRadius:6,padding:'2px 7px',flexShrink:0,whiteSpace:'nowrap',textTransform:'capitalize'}}>{covMeta.coveredModule}</span>
                        </div>
                        {/* Covered record context */}
                        {(covMeta.coveredClientOrDepartment || covMeta.coveredBrand || covMeta.coveredQuantity) && (
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 12px',fontSize:12,color:'#475569',paddingBottom:8,borderBottom:'1px solid #F1F5F9'}}>
                            {covMeta.coveredClientOrDepartment && <span><span style={{color:'#94A3B8',fontWeight:700}}>{covMeta.workspaceMode === 'Internal IT' ? 'Department: ' : 'Client: '}</span>{covMeta.coveredClientOrDepartment}</span>}
                            {covMeta.coveredBrand && <span><span style={{color:'#94A3B8',fontWeight:700}}>Brand: </span>{covMeta.coveredBrand}</span>}
                            {covMeta.coveredQuantity && <span><span style={{color:'#94A3B8',fontWeight:700}}>Quantity: </span>{covMeta.coveredQuantity}</span>}
                          </div>
                        )}
                        {/* Coverage specifics */}
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 12px',fontSize:12,color:'#475569'}}>
                          {covMeta.coverageType && <span><span style={{color:'#94A3B8',fontWeight:700}}>Coverage type: </span>{covMeta.coverageType}</span>}
                          {covMeta.provider && <span><span style={{color:'#94A3B8',fontWeight:700}}>Provider: </span>{covMeta.provider}</span>}
                          {covMeta.startDate && <span><span style={{color:'#94A3B8',fontWeight:700}}>Start: </span>{covMeta.startDate}</span>}
                          {covMeta.endDate && <span><span style={{color:'#94A3B8',fontWeight:700}}>Ends: </span>{covMeta.endDate}</span>}
                          {covMeta.owner && <span><span style={{color:'#94A3B8',fontWeight:700}}>Coverage owner: </span>{covMeta.owner}</span>}
                          {covMeta.alertPolicy && <span><span style={{color:'#94A3B8',fontWeight:700}}>Alert policy: </span>{covMeta.alertPolicy}</span>}
                          {covMeta.value && <span style={{gridColumn:'1 / -1'}}><span style={{color:'#94A3B8',fontWeight:700}}>{covMeta.workspaceMode === 'Internal IT' ? 'Annual cost: ' : 'Annual value: '}</span>{'$' + Number(covMeta.value).toLocaleString()}</span>}
                        </div>
                        {covMeta.coveredModule && covMeta.coveredRecordId && (
                          <div style={{borderTop:'1px solid #F1F5F9',paddingTop:8,marginTop:4}}>
                            <button style={{...detailActionBtn,fontSize:12,padding:'5px 10px'}} onClick={function() { openLinkedRecord(covMeta.coveredModule, covMeta.coveredRecordId, covMeta.coveredRecordName); }}>Open covered record</button>
                          </div>
                        )}
                      </div>
                    </section>
                  : <section style={{background:'#fff',border:'1px solid #EEF2F7',borderRadius:12,overflow:'hidden'}}>
                      <div style={{padding:'12px 14px',borderBottom:'1px solid #EEF2F7',background:'#FAFCFF'}}>
                        <h3 style={{margin:'0 0 4px',fontSize:14,color:'#0B1F3A',letterSpacing:'-.01em'}}>Relationships</h3>
                        <p style={{margin:0,color:'#64748B',fontSize:12,lineHeight:1.45}}>{relHelper}</p>
                        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}>
                          {/* REL-2b: keep these future actions discoverable by keyboard /
                              screen readers (aria-disabled, still focusable) but block the
                              real action with a no-op onClick. No native `disabled` so the
                              control is not skipped in the tab order. Read-only — nothing is
                              created or saved. */}
                          {relButtons.map(function(label) { return <button key={label} type="button" aria-disabled="true" onClick={function(e) { e.preventDefault(); }} title="Available when relationship linking is enabled" style={{...detailActionBtn,opacity:0.55,cursor:'not-allowed'}}>{label}</button>; })}
                        </div>
                        <p style={{margin:'8px 0 0',fontSize:11,color:'#94A3B8',lineHeight:1.4}}>Coming soon: link related records. For now this tab shows existing documents, tasks and coverage.</p>
                      </div>
                    </section>
                }
                {/* REL-2a: general empty state — only when there is nothing to
                    show at all (no docs, no tasks, no coverage section, not a
                    coverage record). Per-section empties cover the other cases. */}
                {relHubEmpty && <section style={{background:'#fff',border:'1px solid #EEF2F7',borderRadius:12,overflow:'hidden'}}>
                  <div style={{padding:'18px 14px',textAlign:'center',display:'grid',gap:4}}>
                    <strong style={{fontSize:13,color:'#132033'}}>No relationships linked yet.</strong>
                    <span style={{color:'#64748B',fontSize:12,lineHeight:1.45}}>This tab shows documents, tasks, support coverage and related records linked to this record.</span>
                  </div>
                </section>}
                {/* REL-2a: read-only Documents summary. Reuses the Documents-tab
                    filter; navigation reuses setActiveDetailTab (no new state). */}
                {!relHubEmpty && <section style={{background:'#fff',border:'1px solid #EEF2F7',borderRadius:12,overflow:'hidden'}}>
                  <div style={{padding:'12px 14px',borderBottom:'1px solid #EEF2F7',background:'#FAFCFF',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
                    <h3 style={{margin:0,fontSize:14,color:'#0B1F3A',letterSpacing:'-.01em'}}>Documents <span style={{fontSize:12,color:'#64748B',fontWeight:400}}>({relDocs.length})</span></h3>
                    {relDocs.length > 0 && <button type="button" style={{...detailActionBtn,fontSize:12,padding:'5px 10px'}} onClick={function() { setActiveDetailTab('Documents'); }}>Open Documents tab</button>}
                  </div>
                  <div style={{padding:'14px',display:'grid',gap:8}}>
                    {relDocs.length === 0
                      ? <span style={{color:'#64748B',fontSize:12,lineHeight:1.45}}>No documents linked yet.</span>
                      : relDocs.map(function(doc) {
                          return <div key={doc.id} style={{border:'1px solid #EEF2F7',borderRadius:10,padding:'10px 12px',background:'#FAFCFF',display:'grid',gap:4}}>
                            <strong style={{fontSize:13,color:'#0B1F3A',fontWeight:700,lineHeight:1.3,wordBreak:'break-word'}}>{doc.name}</strong>
                            <div style={{display:'flex',flexWrap:'wrap',gap:8,fontSize:11,color:'#64748B'}}>
                              {doc.type && <span style={{fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.06em'}}>{doc.type}</span>}
                              {doc.uploadedBy && <span>By {doc.uploadedBy}</span>}
                              {doc.expirationDate && <span>Expires {doc.expirationDate}</span>}
                            </div>
                          </div>;
                        })
                    }
                  </div>
                </section>}
                {/* REL-2a: read-only Tasks summary. Reuses the Tasks-tab filter. */}
                {!relHubEmpty && <section style={{background:'#fff',border:'1px solid #EEF2F7',borderRadius:12,overflow:'hidden'}}>
                  <div style={{padding:'12px 14px',borderBottom:'1px solid #EEF2F7',background:'#FAFCFF',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
                    <h3 style={{margin:0,fontSize:14,color:'#0B1F3A',letterSpacing:'-.01em'}}>Tasks <span style={{fontSize:12,color:'#64748B',fontWeight:400}}>({relTasks.length})</span></h3>
                    {relTasks.length > 0 && <button type="button" style={{...detailActionBtn,fontSize:12,padding:'5px 10px'}} onClick={function() { setActiveDetailTab('Tasks'); }}>Open Tasks tab</button>}
                  </div>
                  <div style={{padding:'14px',display:'grid',gap:8}}>
                    {relTasks.length === 0
                      ? <span style={{color:'#64748B',fontSize:12,lineHeight:1.45}}>No tasks linked yet.</span>
                      : relTasks.map(function(task) {
                          return <div key={task.id} style={{border:'1px solid #EEF2F7',borderRadius:10,padding:'10px 12px',background:'#FAFCFF',display:'grid',gap:4}}>
                            <strong style={{fontSize:13,color:'#0B1F3A',fontWeight:700,lineHeight:1.3,wordBreak:'break-word'}}>{task.title}</strong>
                            <div style={{display:'flex',flexWrap:'wrap',gap:8,fontSize:11,color:'#64748B'}}>
                              {task.status && <span style={{fontWeight:700,color:'#475569'}}>{task.status}</span>}
                              {task.owner && <span>Owner {task.owner}</span>}
                              {task.dueDate && <span>Due {task.dueDate}</span>}
                            </div>
                          </div>;
                        })
                    }
                  </div>
                </section>}
                {isLicHw && (() => {
                  // Coverage Import C5.1 — read Support Coverage records
                  // directly from RECORD_STORE.contracts (single source of
                  // truth). Both manual coverages from openSupportCoverage
                  // and C5 imported coverages live here with
                  // meta.source === 'supportCoverage', so the same filter
                  // shows both. The legacy sessionSupportCoverage state is
                  // kept inert for now (openSupportCoverage still writes to
                  // it for backward-compat); cleanup is C5.1.1 follow-up.
                  var linkedCoverage = (RECORD_STORE.contracts || [])
                    .filter(function(c) {
                      return c && c.meta
                        && c.meta.source === 'supportCoverage'
                        && c.meta.coveredRecordId === selectedRecord.id
                        && c.meta.coveredModule === selectedRecord.moduleKey;
                    })
                    .map(function(c) { return c.meta; });
                  var kindPalettes = {
                    Warranty:    { bg: '#F0FDFA', border: '#CCFBEF', text: '#0F766E' },
                    Support:     { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
                    Maintenance: { bg: '#FAF5FF', border: '#E9D5FF', text: '#7C3AED' }
                  };
                  var kindBadge = function(kind) {
                    var p = kindPalettes[kind] || { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569' };
                    return { fontSize: 10, fontWeight: 800, color: p.text, background: p.bg, border: '1px solid ' + p.border, borderRadius: 999, padding: '2px 7px', whiteSpace: 'nowrap' };
                  };
                  var typePillStyle = { fontSize: 11, fontWeight: 700, color: '#0F766E', background: '#F0FDF9', border: '1px solid #CCFBEF', borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap' };
                  var importedBadgeStyle = { fontSize: 10, fontWeight: 700, color: '#475569', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 999, padding: '2px 7px', whiteSpace: 'nowrap' };
                  var suggestedBadgeStyle = { fontSize: 10, fontWeight: 700, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 999, padding: '2px 7px', whiteSpace: 'nowrap' };
                  var fromFileBadgeStyle = { fontSize: 10, fontWeight: 700, color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 999, padding: '2px 7px', whiteSpace: 'nowrap' };
                  return <section style={{background:'#fff',border:'1px solid #EEF2F7',borderRadius:12,overflow:'hidden'}}>
                    <div style={{padding:'12px 14px',borderBottom:'1px solid #EEF2F7',background:'#FAFCFF'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                        <div style={{minWidth:0}}>
                          <h3 style={{margin:'0 0 4px',fontSize:14,color:'#0B1F3A',letterSpacing:'-.01em'}}>Support coverage</h3>
                          <p style={{margin:0,color:'#64748B',fontSize:12,lineHeight:1.45}}>Track support, warranty, maintenance or SLA coverage linked to this record.</p>
                        </div>
                        <button style={{...detailActionBtn,flexShrink:0}} onClick={openSupportCoverage}>Add support coverage</button>
                      </div>
                    </div>
                    <div style={{padding:'14px',display:'grid',gap:10}}>
                      {linkedCoverage.length === 0
                        ? <span style={{color:'#64748B',fontSize:12,lineHeight:1.45}}>No support coverage record linked yet.</span>
                        : linkedCoverage.map(function(cov) {
                            var isImported = cov.importedFrom === 'importSandbox';
                            var hasBasis = !!cov.suggestionBasis;
                            return <div key={cov.id} style={{border:'1px solid #EEF2F7',borderRadius:10,padding:'12px 14px',background:'#FAFCFF',display:'grid',gap:6}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,flexWrap:'wrap'}}>
                                <strong style={{fontSize:13,color:'#0B1F3A',fontWeight:700,lineHeight:1.3,minWidth:0,flex:'1 1 auto'}}>{cov.name}</strong>
                                <div style={{display:'flex',gap:4,flexWrap:'wrap',flexShrink:0,alignItems:'center'}}>
                                  {cov.coverageKind && <span style={kindBadge(cov.coverageKind)}>{cov.coverageKind}</span>}
                                  {cov.coverageType && <span style={typePillStyle}>{cov.coverageType}</span>}
                                  {isImported && <span style={importedBadgeStyle} title="Created via Data Import">Imported</span>}
                                  {hasBasis && cov.suggestionBasis === 'file' && <span style={fromFileBadgeStyle} title="Value came from the source file">From file</span>}
                                  {hasBasis && cov.suggestionBasis !== 'file' && <span style={suggestedBadgeStyle} title={'Inferred at import (' + cov.suggestionBasis + ')'}>Suggested</span>}
                                </div>
                              </div>
                              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 12px',fontSize:12,color:'#475569'}}>
                                {cov.provider && <span><span style={{color:'#94A3B8',fontWeight:700}}>Provider: </span>{cov.provider}</span>}
                                {cov.startDate && <span><span style={{color:'#94A3B8',fontWeight:700}}>Start: </span>{cov.startDate}</span>}
                                {cov.endDate && <span><span style={{color:'#94A3B8',fontWeight:700}}>Ends: </span>{cov.endDate}</span>}
                                {cov.owner && <span><span style={{color:'#94A3B8',fontWeight:700}}>Coverage Owner: </span>{cov.owner}</span>}
                                {cov.supportLevel && <span><span style={{color:'#94A3B8',fontWeight:700}}>Level: </span>{cov.supportLevel}</span>}
                                {cov.reference && <span><span style={{color:'#94A3B8',fontWeight:700}}>Ref: </span>{cov.reference}</span>}
                                {cov.alertPolicy && <span><span style={{color:'#94A3B8',fontWeight:700}}>Alerts: </span>{cov.alertPolicy}</span>}
                                {cov.value && <span style={{gridColumn:'1 / -1'}}><span style={{color:'#94A3B8',fontWeight:700}}>{workspaceMode === 'Internal IT' ? 'Annual Cost: ' : 'Annual Value: '}</span>{'$' + Number(cov.value).toLocaleString()}</span>}
                              </div>
                              <div style={{borderTop:'1px solid #F1F5F9',paddingTop:8,marginTop:2}}>
                                <button style={{...detailActionBtn,fontSize:12,padding:'5px 10px'}} onClick={function() { openLinkedRecord('contracts', cov.id, cov.name); }}>Open contract</button>
                              </div>
                            </div>;
                          })
                      }
                    </div>
                  </section>;
                })()}
              </div>;
            })()
          : activeDetailTab === 'Documents'
          ? (() => {
              var linkedDocs = sessionDocs.filter(function(d) {
                return d.linkedRecordId === selectedRecord.id && d.linkedModule === selectedRecord.moduleKey;
              });
              if (linkedDocs.length === 0) {
                return <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'grid',gap:12,alignContent:'start'}}>
                  <section style={{background:'#fff',border:'1px solid #EEF2F7',borderRadius:12,overflow:'hidden'}}>
                    <div style={{padding:'12px 14px',borderBottom:'1px solid #EEF2F7',background:'#FAFCFF'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                        <div style={{minWidth:0}}>
                          <h3 style={{margin:'0 0 4px',fontSize:14,color:'#0B1F3A',letterSpacing:'-.01em'}}>Documents</h3>
                          <p style={{margin:0,color:'#64748B',fontSize:12,lineHeight:1.45}}>Attach quotes, invoices, purchase orders, license certificates, entitlement documents and evidence related to this record.</p>
                        </div>
                        <button style={{...detailActionBtn,borderColor:'#0D9488',color:'#0D9488',flexShrink:0}} onClick={openAttachDoc}>Attach document</button>
                      </div>
                    </div>
                    <div style={{padding:'14px',display:'grid',gap:8}}>
                      <strong style={{display:'block',color:'#132033',fontSize:13}}>No documents attached to this record yet.</strong>
                      <span style={{color:'#64748B',fontSize:12,lineHeight:1.45}}>Attach signed contracts, quotes, warranties, certificates and approval evidence directly to this record.</span>
                    </div>
                  </section>
                </div>;
              }
              return <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column'}}>
                <div style={{padding:'16px 20px 8px',display:'grid',gap:10,flexShrink:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                    <div style={{minWidth:0}}>
                      <h3 style={{margin:'0 0 4px',fontSize:14,color:'#0B1F3A',letterSpacing:'-.01em'}}>Documents</h3>
                      <p style={{margin:0,color:'#64748B',fontSize:12,lineHeight:1.45}}>Attach quotes, invoices, purchase orders, license certificates, entitlement documents and evidence related to this record.</p>
                    </div>
                    <button style={{...detailActionBtn,fontSize:12,padding:'6px 10px',borderColor:'#0D9488',color:'#0D9488',flexShrink:0}} onClick={openAttachDoc}>+ Attach</button>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:'#64748B'}}>{linkedDocs.length} document{linkedDocs.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{padding:'0 20px 16px',display:'flex',flexDirection:'column',gap:8}}>
                  {linkedDocs.map(function(doc) {
                    var ext = doc.fileName ? doc.fileName.split('.').pop().toUpperCase() : '';
                    var metaParts = [ext, fmtFileSize(doc.fileSize)].filter(Boolean);
                    var dateLabel = doc.uploadedAt ? ('Uploaded ' + fmtUploadedAt(doc.uploadedAt)) : (doc.uploadDate ? ('Uploaded ' + doc.uploadDate) : '');
                    if (dateLabel) metaParts.push(dateLabel);
                    return <div key={doc.id} style={{border:'1px solid #EEF2F7',borderRadius:12,padding:'12px 14px',background:'#FAFCFF'}}>
                      <div style={{marginBottom:4}}>
                        <strong style={{fontSize:13,color:'#132033',lineHeight:1.3,wordBreak:'break-word',display:'block'}}>{doc.name}</strong>
                      </div>
                      {doc.fileName && <div style={{fontSize:11,color:'#0F766E',fontWeight:600,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={doc.fileName}>📎 {doc.fileName}</div>}
                      <div style={{display:'flex',flexWrap:'wrap',gap:6,alignItems:'center',marginBottom:4}}>
                        {doc.type && <span style={{fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.06em'}}>{doc.type}</span>}
                        {metaParts.length > 0 && <span style={{fontSize:11,color:'#64748B'}}>{metaParts.join(' · ')}</span>}
                      </div>
                      <div style={{display:'flex',gap:12,fontSize:11,color:'#94A3B8'}}>
                        {doc.uploadedBy && <span>By {doc.uploadedBy}</span>}
                        {doc.expirationDate && <span>Expires {doc.expirationDate}</span>}
                      </div>
                    </div>;
                  })}
                </div>
              </div>;
            })()
          : activeDetailTab === 'Tasks'
          ? (() => {
              var recordTasks = sessionTasks.filter(function(t) { return t.sourceRecordId === selectedRecord.id; });
              var priorityColor = function(p) {
                if (p === 'Critical') return '#DC2626';
                if (p === 'High') return '#D97706';
                if (p === 'Medium') return '#2563EB';
                return '#64748B';
              };
              var statusColor = function(s) {
                if (s === 'Done') return '#0D9488';
                if (s === 'In progress') return '#2563EB';
                if (s === 'Waiting') return '#D97706';
                return '#64748B';
              };
              return <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'grid',gap:12,alignContent:'start'}}>
                <section style={{background:'#fff',border:'1px solid #EEF2F7',borderRadius:12,overflow:'hidden'}}>
                  <div style={{padding:'12px 14px',borderBottom:'1px solid #EEF2F7',background:'#FAFCFF'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                      <div style={{minWidth:0}}>
                        <h3 style={{margin:'0 0 4px',fontSize:14,color:'#0B1F3A',letterSpacing:'-.01em'}}>Tasks <span style={{fontSize:12,color:'#64748B',fontWeight:400}}>({recordTasks.length})</span></h3>
                        <p style={{margin:0,color:'#64748B',fontSize:12,lineHeight:1.45}}>Track follow-ups, approvals and renewal actions related to this record.</p>
                      </div>
                      <button style={{...detailActionBtn,borderColor:'#0D9488',color:'#0D9488',flexShrink:0}} onClick={openCreateTask}>Create task</button>
                    </div>
                  </div>
                  <div style={{padding:'14px',display:'grid',gap:8}}>
                    {recordTasks.length === 0
                      ? <>
                          <strong style={{display:'block',color:'#132033',fontSize:13}}>No tasks linked to this record yet.</strong>
                          <span style={{color:'#64748B',fontSize:12,lineHeight:1.45}}>Create tasks for renewal follow-up, owner assignments, quote requests and approval submissions tied to this record.</span>
                        </>
                      : recordTasks.map(function(t) {
                          return <div key={t.id} style={{border:'1px solid #EEF2F7',borderRadius:10,padding:'11px 13px',background:'#FAFCFF'}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:4}}>
                              <strong style={{fontSize:13,color:'#132033',lineHeight:1.3,wordBreak:'break-word'}}>{t.title}</strong>
                              <span style={{fontSize:11,fontWeight:700,color:priorityColor(t.priority),flexShrink:0,textTransform:'uppercase',letterSpacing:'.05em'}}>{t.priority}</span>
                            </div>
                            <div style={{display:'flex',flexWrap:'wrap',gap:8,fontSize:11,color:'#64748B',marginBottom:t.notes?6:0}}>
                              <span style={{color:statusColor(t.status),fontWeight:600}}>{t.status}</span>
                              {t.taskType && <span>· {t.taskType}</span>}
                              {t.owner && <span>· {t.owner}</span>}
                              {t.dueDate && <span>· Due {t.dueDate}</span>}
                            </div>
                            {t.notes && <p style={{margin:0,fontSize:12,color:'#64748B',lineHeight:1.4}}>{t.notes}</p>}
                          </div>;
                        })
                    }
                  </div>
                </section>
              </div>;
            })()
          : <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'grid',gap:12,alignContent:'start'}}>
              {(() => {
                var actEvents = Array.isArray(RECORD_STORE.activity)
                  ? RECORD_STORE.activity.filter(function(ev) {
                      return ev.sourceRecordId === selectedRecord.id
                          || ev.relatedRecordId === selectedRecord.id;
                    }).slice().reverse()
                  : [];
                var evBadge = function(et) {
                  if (et === 'record_created')         return {bg:'#F0FDF4',border:'#BBF7D0',color:'#15803D'};
                  if (et === 'record_edited')           return {bg:'#EFF6FF',border:'#BFDBFE',color:'#1D4ED8'};
                  if (et === 'document_attached')       return {bg:'#EEF2FF',border:'#C7D2FE',color:'#4338CA'};
                  if (et === 'support_coverage_added')  return {bg:'#F0FDFA',border:'#99F6E4',color:'#0F766E'};
                  if (et === 'task_created')            return {bg:'#FFF7ED',border:'#FED7AA',color:'#C2410C'};
                  return {bg:'#F8FAFC',border:'#E2E8F0',color:'#64748B'};
                };
                var fmtTime = function(iso) {
                  if (!iso) return '';
                  try {
                    var d = new Date(iso);
                    return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
                      + ' ' + d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
                  } catch(e) { return iso.slice(0,10); }
                };
                return <section style={{background:'#fff',border:'1px solid #EEF2F7',borderRadius:12,overflow:'hidden'}}>
                  <div style={{padding:'12px 14px',borderBottom:'1px solid #EEF2F7',background:'#FAFCFF',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                    <div>
                      <h3 style={{margin:'0 0 2px',fontSize:14,color:'#0B1F3A',letterSpacing:'-.01em'}}>Activity</h3>
                      <p style={{margin:0,color:'#64748B',fontSize:12,lineHeight:1.4}}>Session activity (sandbox) for this record.</p>
                    </div>
                    {actEvents.length > 0 && <span style={{fontSize:11,fontWeight:800,background:'#EFF6FF',color:'#1D4ED8',border:'1px solid #BFDBFE',borderRadius:999,padding:'2px 8px',flexShrink:0}}>{actEvents.length}</span>}
                  </div>
                  {actEvents.length === 0
                    ? <div style={{padding:'14px',display:'grid',gap:6}}>
                        <strong style={{display:'block',color:'#132033',fontSize:13}}>No activity yet.</strong>
                        <span style={{color:'#64748B',fontSize:12,lineHeight:1.45}}>Changes, document uploads, owner assignments and workflow events will appear here.</span>
                      </div>
                    : <div style={{padding:'4px 14px 10px',display:'grid',gap:0}}>
                        {actEvents.map(function(ev, i) {
                          var bc = evBadge(ev.eventType);
                          return <div key={ev.id} style={{padding:'10px 0',borderBottom:i < actEvents.length-1 ? '1px solid #F1F5F9' : 'none',display:'grid',gap:4}}>
                            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
                              <strong style={{fontSize:13,color:'#0B1F3A',lineHeight:1.3,flex:1}}>{ev.title}</strong>
                              <span style={{fontSize:10,fontWeight:800,background:bc.bg,border:'1px solid '+bc.border,color:bc.color,borderRadius:999,padding:'2px 7px',letterSpacing:'.02em',whiteSpace:'nowrap',flexShrink:0}}>{ev.eventType.replace(/_/g,' ')}</span>
                            </div>
                            {ev.description && <p style={{margin:0,fontSize:12.5,color:'#334155',lineHeight:1.45}}>{ev.description}</p>}
                            <div style={{display:'flex',gap:6,flexWrap:'wrap',fontSize:11,color:'#94A3B8',alignItems:'center'}}>
                              <span>{ev.actor || 'Current user'}</span>
                              {ev.createdAt && <><span>·</span><span>{fmtTime(ev.createdAt)}</span></>}
                            </div>
                          </div>;
                        })}
                      </div>
                  }
                </section>;
              })()}
            </div>
        }

        {/* Footer */}
        {(editMode || activeDetailTab === 'Overview') && <div style={{padding:'14px 20px',borderTop:'1px solid #EEF2F7',display:'flex',gap:8,flexWrap:'wrap',flexShrink:0,background:'#FAFCFF'}}>
          {editMode
            ? <>
                <button className="primary" onClick={handleEditSave}>Save changes</button>
                <button onClick={() => setEditMode(false)}>Cancel</button>
              </>
            : <>
                {selectedRecord.moduleKey === moduleKey && (
                  <button style={{...detailActionBtn,borderColor:'#0D9488',color:'#0D9488'}} onClick={() => { setEditForm(buildEditForm(selectedRecord, fieldSpecs, workspaceMode)); setEditErrors({}); setEditMode(true); }}>Edit record</button>
                )}
                <button style={detailActionBtn} title="Assign owner - coming next">Assign owner</button>
              </>
          }
        </div>}
      </aside>
    </>}
  </main>;
}

function HardwareScreen({ workspaceMode = 'MSP / Integrator' }){
  const isInternalIT = workspaceMode === 'Internal IT';
  const hardwareNote = isInternalIT
    ? 'Track IT hardware assets, warranty end dates, support contracts, department ownership and approval status.'
    : workspaceMode === 'MSP / Integrator'
    ? 'Track client hardware assets, warranty dates, support contracts and renewal obligations across your portfolio.'
    : 'Track hardware assets, warranty dates, support coverage and ownership across the workspace.';
  const hardwareTabs = isInternalIT
    ? ['All','Warranty expiring','Missing support','High risk','CIO approval needed']
    : ['All','Warranty expiring','Missing support','High risk','Unassigned'];
  const hardwareColumns = isInternalIT
    ? ['Asset','Type','Brand','Model','Serial','Department','Provider','Warranty end','Approval status','Owner','Status','Risk','Action']
    : ['Asset','Type','Client','Brand','Model','Serial','Warranty end','Support','Owner','Status','Risk','Action'];
  const hardwareAi = isInternalIT
    ? 'Opriva AI can surface hardware assets with expiring warranties, missing support coverage and approval blockers across IT departments.'
    : 'Opriva AI can identify hardware assets with expiring warranties, missing support contracts and unassigned ownership across your client portfolio.';
  const hardwarePlaceholder = isInternalIT
    ? 'Filter hardware by brand, department, provider, owner or warranty status…'
    : 'Filter hardware by client, brand, model, owner or warranty status…';
  const hardwareRows = isInternalIT ? hardwareInternalIT : hardwareMsp;
  return <OperationalList active="Hardware" note={hardwareNote} tabs={hardwareTabs} columns={hardwareColumns} ai={hardwareAi} placeholder={hardwarePlaceholder} rows={hardwareRows} workspaceMode={workspaceMode}/>;
}

function ContractsScreen({ workspaceMode = 'MSP / Integrator' }){
  const isInternalIT = workspaceMode === 'Internal IT';
  const contractsNote = isInternalIT
    ? 'Track provider contracts, department exposure, notice periods, approval blockers and required evidence.'
    : workspaceMode === 'MSP / Integrator'
    ? 'Track client contract obligations, notice periods, legal evidence and renewal actions across your portfolio.'
    : 'Track contracts, obligations, notice periods, documents and renewal actions across the workspace.';
  const contractsTabs = isInternalIT
    ? ['All','CIO approval needed','Notice period','Auto-renewal','Missing evidence','Support coverage']
    : ['All','High risk','Notice period','Auto-renewal','Missing document','Support coverage'];
  const contractsColumns = isInternalIT
    ? ['Contract','Type','Department','Provider','Owner','Document','Renewal','Notice','Approval status','Next action','Risk']
    : ['Contract','Type','Client','Provider / Distributor','Owner','Document','Renewal','Notice','Legal status','Next action','Risk'];
  const contractsAi = isInternalIT
    ? 'Opriva AI can surface approval blockers, provider dependency risks and missing evidence across IT contracts.'
    : 'Opriva AI can identify auto-renewal risks, notice period gaps and missing contract evidence across your client portfolio.';
  const contractsPlaceholder = isInternalIT
    ? 'Filter contracts by department, provider, owner or approval status…'
    : 'Filter contracts by client, provider, owner or risk…';
  const contractsRows = isInternalIT ? contractsInternalIT : contractsMsp;
  return <OperationalList active="Contracts" note={contractsNote} tabs={contractsTabs} columns={contractsColumns} ai={contractsAi} placeholder={contractsPlaceholder} rows={contractsRows} workspaceMode={workspaceMode}/>;
}

function DocumentsScreen({ workspaceMode = 'MSP / Integrator' }){
  const isInternalIT = workspaceMode === 'Internal IT';
  const documentsNote = isInternalIT
    ? 'Govern approval evidence, support documents, signed contracts, budget authorizations and required document gaps across IT departments.'
    : workspaceMode === 'MSP / Integrator'
    ? 'Govern client evidence, signed contracts, distributor quotes, warranties and required document gaps.'
    : 'Govern evidence, versions, access and required document gaps.';
  const documentsTabs = isInternalIT
    ? ['All','Required missing','Restricted','Pending approval','Linked records']
    : ['All','Required missing','Restricted','Pending review','Linked records'];
  const documentsColumns = isInternalIT
    ? ['Document','Type','Linked record','Department','Uploaded by','Version','Access','Requirement','Status']
    : ['Document','Type','Linked record','Client','Uploaded by','Version','Access','Requirement','Status'];
  const documentsAi = isInternalIT
    ? 'Opriva AI can surface missing approval documents, unsigned contracts and evidence gaps across IT departments.'
    : 'Opriva AI can identify missing contract evidence, unsigned documents and access gaps across your client portfolio.';
  const documentsPlaceholder = isInternalIT
    ? 'Filter documents by department, record, type or status…'
    : 'Filter documents by client, record, type or status…';
  const documentsRows = isInternalIT ? documentsInternalIT : documentsMsp;
  return <OperationalList active="Documents" note={documentsNote} tabs={documentsTabs} columns={documentsColumns} ai={documentsAi} placeholder={documentsPlaceholder} rows={documentsRows} workspaceMode={workspaceMode}/>;
}

function TasksScreen({ workspaceMode = 'MSP / Integrator' }){
  const isInternalIT = workspaceMode === 'Internal IT';

  // ── Linked-record options for global New Task modal ──────────────────────
  // Built from RECORD_STORE across all four modules (pre-seeded from mock rows
  // if a module hasn't been visited yet).  Each option carries enough data to
  // populate the full task meta without relying on RECORD_STORE stability later.
  // Delegates to the module-level collector (all four modules; no exclusion)
  // so the global New Task modal keeps its existing behavior unchanged.
  function buildLinkedRecordOptions() {
    return collectLinkedRecordOptions(workspaceMode);
  }

  // ── Global New Task state ─────────────────────────────────────────────────
  const [newTaskOpen, setNewTaskOpen] = React.useState(false);
  const [newTaskForm, setNewTaskForm] = React.useState({});
  const [newTaskErrors, setNewTaskErrors] = React.useState({});
  const [linkedRecordOptions, setLinkedRecordOptions] = React.useState([]);

  function openNewTaskModal() {
    var opts = buildLinkedRecordOptions();
    setLinkedRecordOptions(opts);
    setNewTaskForm({ status: 'Open', priority: 'Medium' });
    setNewTaskErrors({});
    setNewTaskOpen(true);
  }

  function handleGlobalTaskSave() {
    var errs = {};
    if (!(newTaskForm.title      || '').trim()) errs.title      = 'Required';
    if (!(newTaskForm.taskType   || '').trim()) errs.taskType   = 'Required';
    if (!(newTaskForm.linkedRec  || '').trim()) errs.linkedRec  = 'Required';
    if (!(newTaskForm.owner      || '').trim()) errs.owner      = 'Required';
    if (!(newTaskForm.dueDate    || '').trim()) errs.dueDate    = 'Required';
    if (!(newTaskForm.priority   || '').trim()) errs.priority   = 'Required';
    if (!(newTaskForm.status     || '').trim()) errs.status     = 'Required';
    if (Object.keys(errs).length) { setNewTaskErrors(errs); return; }

    var opt = linkedRecordOptions.find(function(o) { return o.value === newTaskForm.linkedRec; });
    if (!opt) { setNewTaskErrors({ linkedRec: 'Please select a linked record' }); return; }

    var today = new Date().toISOString().slice(0, 10);
    var task = {
      id:                   'task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      moduleKey:            'tasks',
      source:               'userCreated',
      title:                newTaskForm.title.trim(),
      taskType:             newTaskForm.taskType,
      owner:                newTaskForm.owner,
      dueDate:              newTaskForm.dueDate,
      priority:             newTaskForm.priority,
      status:               newTaskForm.status,
      notes:                newTaskForm.notes || '',
      sourceModule:         opt.moduleKey,
      sourceRecordId:       opt.value,
      sourceRecordName:     opt.recordName,
      sourceClientOrDepartment: opt.clientOrDept || '',
      workspaceMode:        workspaceMode,
      createdAt:            today,
    };
    // Snapshot the linked record so the task drawer can always render it,
    // even if RECORD_STORE is reinitialised later.
    task.linkedRecordSnapshot = {
      name:        opt.recordName,
      moduleKey:   opt.moduleKey,
      clientOrDept: opt.clientOrDept || '',
      row:         opt.row,
      columns:     opt.columns,
    };
    // REL-1b: additive standard relationship vocabulary. source* above is legacy
    // (points to the parent record); target* is the standard naming for a future
    // backend `relationships` table. No consumer reads these fields yet.
    task.relationshipType      = 'task_for_record';
    task.targetModule          = opt.moduleKey;
    task.targetRecordId        = opt.value;
    task.targetRecordName      = opt.recordName;
    task.direction             = 'source_to_target';
    task.relationshipCreatedAt = today;

    var taskRow = [
      task.title,
      task.sourceClientOrDepartment || '-',
      task.sourceRecordName || '-',
      task.sourceModule,
      task.taskType || '-',
      task.owner,
      task.priority,
      task.dueDate,
      task.status,
      'Open task',
    ];
    RECORD_STORE.tasks.push({ id: task.id, row: taskRow, meta: task });
    addActivityEvent({
      eventType:        'task_created',
      title:            'Task created',
      description:      task.title + ' was created and linked to ' + task.sourceRecordName + '.',
      sourceModule:     task.sourceModule,
      sourceRecordId:   task.sourceRecordId,
      sourceRecordName: task.sourceRecordName,
      relatedModule:    'tasks',
      relatedRecordId:  task.id,
      relatedRecordName: task.title,
      workspaceMode:    workspaceMode,
    });
    setNewTaskOpen(false);
    setNewTaskForm({});
    setNewTaskErrors({});
  }

  // ── Linked-record detail overlay (from task Relationships tab) ────────────
  const [lrOverlayOpen, setLrOverlayOpen] = React.useState(false);
  const [lrOverlayData, setLrOverlayData] = React.useState(null); // { row, columns, name, moduleKey, clientOrDept }

  function openLinkedRecordOverlay(meta) {
    if (!meta) return;
    var snap = meta.linkedRecordSnapshot || null;
    if (snap && snap.row && snap.columns) {
      setLrOverlayData(snap);
      setLrOverlayOpen(true);
      return;
    }
    // Fallback: try RECORD_STORE lookup
    var mk = meta.sourceModule;
    if (!mk) return;
    ensureModuleRecordsLoaded(mk, workspaceMode);
    var recs = RECORD_STORE[mk] || [];
    var rec = recs.find(function(r) { return r.id === meta.sourceRecordId; })
           || recs.find(function(r) { return r.row && r.row[0] === meta.sourceRecordName; });
    var cols = getModuleColumns(mk, workspaceMode);
    setLrOverlayData({
      name:        meta.sourceRecordName || '-',
      moduleKey:   mk,
      clientOrDept: meta.sourceClientOrDepartment || '',
      row:         rec ? rec.row : [],
      columns:     cols,
    });
    setLrOverlayOpen(true);
  }

  const taskSubtitle = isInternalIT
    ? 'Manage renewal approvals, department ownership gaps, budget reviews and evidence requests across IT operations.'
    : workspaceMode === 'MSP / Integrator'
    ? 'Manage renewal follow-up, client approvals, quote requests and ownership assignments across your client portfolio.'
    : 'Manage renewal work, owner assignments and operational follow-up across the workspace.';
  const taskColumns = isInternalIT
    ? ['Task','Department','Record','Source','Impact','Owner','Priority','Due','Status','Action']
    : workspaceMode === 'MSP / Integrator'
    ? ['Task','Client','Record','Source','Impact','Owner','Priority','Due','Status','Action']
    : ['Task','Company','Record','Source','Impact','Owner','Priority','Due','Status','Action'];
  const taskPlaceholder = isInternalIT
    ? 'Filter tasks by owner, department, record or status…'
    : workspaceMode === 'MSP / Integrator'
    ? 'Filter tasks by owner, client, record or status…'
    : 'Filter tasks by owner, company, record or status…';

  // Sync full records (with meta) from RECORD_STORE.tasks every 500ms
  const [sessionRecords, setSessionRecords] = React.useState(function() {
    return Array.isArray(RECORD_STORE.tasks)
      ? RECORD_STORE.tasks.filter(function(r) { return r.id && r.id.indexOf('task-') === 0; })
      : [];
  });
  React.useEffect(function() {
    function syncTasks() {
      var stored = Array.isArray(RECORD_STORE.tasks)
        ? RECORD_STORE.tasks.filter(function(r) { return r.id && r.id.indexOf('task-') === 0; })
        : [];
      setSessionRecords(stored);
    }
    var interval = setInterval(syncTasks, 500);
    return function() { clearInterval(interval); };
  }, []);

  // Build unified display list: mock rows wrapped as lightweight records, then
  // session records carrying full meta. Index === onRowOpen callback index.
  var mockTaskRows = isInternalIT ? tasksInternalIT : tasksMsp;
  var allRecords = mockTaskRows.map(function(row, i) {
    return { id: 'mock-task-' + i, row: row, meta: null };
  }).concat(sessionRecords);
  var taskRows = allRecords.map(function(r) { return r.row; });

  // Drawer state
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('Overview');

  function openTask(idx) {
    var rec = allRecords[idx];
    if (!rec) return;
    setSelectedTask(rec);
    setActiveTab('Overview');
    setDetailOpen(true);
  }

  // Style constants — local copies matching OperationalList values
  var tCloseBtn = { border: '1px solid #EEF2F7', background: '#fff', color: '#94A3B8', fontSize: 12, width: 26, height: 26, borderRadius: 7, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: 'none' };

  function tPriorityColor(p) {
    if (p === 'Critical') return '#DC2626';
    if (p === 'High')     return '#D97706';
    if (p === 'Medium')   return '#2563EB';
    return '#64748B';
  }

  // Renders a label / value row inside the details card
  function tField(label, value) {
    if (!value || value === '-') return null;
    return <div key={label} style={{display:'grid',gridTemplateColumns:'130px 1fr',gap:8,alignItems:'start',padding:'8px 0',borderBottom:'1px solid #F1F5F9'}}>
      <span style={{fontSize:12,color:'#94A3B8',fontWeight:700,lineHeight:1.4,textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</span>
      <span style={{fontSize:13,color:'#132033',lineHeight:1.4,wordBreak:'break-word'}}>{value}</span>
    </div>;
  }

  const boardMsp = [['To do','Request signed Trend Micro quote','Banisi','High','$11,500 margin · Proposal pending'],['In progress','Assign SSL certificate owner','Grupo Regency','Critical','Owner gap · Renewal at risk'],['Blocked','Legal approval for support contract','Banisi','Medium','$3,800 margin · Legal blocker']];
  const boardInternalIT = [['To do','Request Fortinet renewal quote','Infrastructure','Medium','Service continuity risk'],['In progress','Review endpoint security consolidation','IT Security','High','CIO approval blocked'],['Blocked','Submit CIO approval for Microsoft 365','Finance','High','$142,000 exposure']];
  const board = isInternalIT ? boardInternalIT : boardMsp;

  // ── Shared style tokens ───────────────────────────────────────────────────
  var tActionBtn  = { fontSize: 13, padding: '7px 12px', color: '#64748B', background: '#F8FAFC', borderColor: '#E5E7EB', cursor: 'pointer' };
  var tFieldStyle = { width: '100%', border: '1px solid #DDE6F1', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', outline: 0, background: '#FAFCFF', color: '#132033', boxSizing: 'border-box' };
  var tErrStyle   = { color: '#DC2626', fontSize: 12, marginTop: 4, display: 'block' };
  var tModalWrap  = { position: 'fixed', inset: 0, background: 'rgba(11,31,58,.42)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  var tModalBox   = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: 24, width: 540, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', boxShadow: '0 24px 80px rgba(11,31,58,.22)', display: 'grid', gap: 16 };
  var tModalFoot  = { display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #EEF2F7' };
  var tEyebrow    = { margin: '0 0 4px', color: '#0D9488', textTransform: 'uppercase', fontSize: 11, letterSpacing: '.14em', fontWeight: 900 };

  var typeOpts = getTaskTypeOptions(workspaceMode);
  var userOpts = resolveFieldOptions('users', workspaceMode);

  return <>
    <main className="content">
      <ScreenHeader active="Tasks" subtitle={taskSubtitle}><button>Saved view</button><button className="primary" onClick={openNewTaskModal}>New task</button></ScreenHeader>
      <section className="panel">
        <div className="tabs"><button className="active">List view</button><button>Board view</button><button>My tasks</button><button>Overdue</button></div>
        <div className="toolbar"><input placeholder={taskPlaceholder}/><button>Bulk update</button><button>Group by owner</button><button>Configure columns</button><button>Advanced filters</button><button>AI summary</button></div>
        <Table columns={taskColumns} rows={taskRows} onRowOpen={openTask}/>
      </section>
      <section className="panel"><div className="panelTitle"><h2>Kanban board snapshot</h2><span>Board view for execution without losing list precision</span></div><div className="kanban">{['To do','In progress','Blocked'].map(status=><div className="kanbanCol" key={status}><h3>{status}</h3>{board.filter(card=>card[0]===status).map(card=><article className="taskCard" key={card[1]}><strong>{card[1]}</strong><span>{card[2]} · {card[4]}</span><Badge tone={card[3]}>{card[3]}</Badge></article>)}</div>)}</div></section>
    </main>

    {detailOpen && selectedTask && <>
      <style>{`.agentWrap,.floatingAgentWrap{display:none!important}`}</style>
      <div style={{position:'fixed',inset:0,background:'rgba(11,31,58,.18)',zIndex:48}} onClick={function() { setDetailOpen(false); }} aria-hidden="true"/>
      <aside role="dialog" aria-modal="true" aria-label="Task detail" style={{position:'fixed',right:0,top:0,bottom:0,width:'min(440px,100vw)',background:'#fff',borderLeft:'1px solid #E5E7EB',boxShadow:'-8px 0 40px rgba(11,31,58,.16)',zIndex:49,display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* ── Header ── */}
        {(() => {
          var meta         = selectedTask.meta;
          var row          = selectedTask.row;
          var title        = (meta && meta.title)                    || row[0] || 'Task';
          var clientOrDept = (meta && meta.sourceClientOrDepartment) || row[1] || '';
          var sourceRec    = (meta && meta.sourceRecordName)         || row[2] || '';
          var priority     = (meta && meta.priority) || row[6] || '';
          var dueDate      = (meta && meta.dueDate)  || row[7] || '';
          var owner        = (meta && meta.owner)    || row[5] || '';
          var status       = (meta && meta.status)   || row[8] || '';
          // Context line: "Banisi · Linked to Trend Micro Vision One"
          var ctxParts = [clientOrDept, sourceRec ? 'Linked to ' + sourceRec : ''].filter(Boolean);
          return <div style={{padding:'12px 16px 10px',borderBottom:'1px solid #EEF2F7',display:'grid',gap:6,flexShrink:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
              <div style={{minWidth:0,flex:1}}>
                <p style={{margin:'0 0 3px',color:'#0D9488',textTransform:'uppercase',fontSize:9.5,letterSpacing:'.14em',fontWeight:900,lineHeight:1}}>TASK</p>
                <h2 style={{margin:0,color:'#0B1F3A',fontSize:16.5,letterSpacing:'-.015em',lineHeight:1.18,wordBreak:'break-word',fontWeight:800}}>{title}</h2>
              </div>
              <button style={tCloseBtn} onClick={function() { setDetailOpen(false); }} aria-label="Close">x</button>
            </div>
            {ctxParts.length > 0 && (
              <div style={{color:'#64748B',fontSize:12,lineHeight:1.35,wordBreak:'break-word'}}>{ctxParts.join(' · ')}</div>
            )}
            <div style={{display:'flex',flexWrap:'wrap',gap:6,alignItems:'center',color:'#64748B',fontSize:11.5,lineHeight:1.2}}>
              {status   && <Badge tone={status}>{status}</Badge>}
              {priority && <span style={{fontSize:11,fontWeight:700,color:tPriorityColor(priority),textTransform:'uppercase',letterSpacing:'.05em'}}>{priority}</span>}
              {dueDate  && <span>Due {dueDate}</span>}
              {owner    && <span>· {owner}</span>}
            </div>
          </div>;
        })()}

        {/* ── Tab bar ── */}
        <div style={{display:'flex',borderBottom:'1px solid #EEF2F7',flexShrink:0,overflowX:'auto',padding:'0 12px'}}>
          {['Overview','Relationships','Documents','Activity'].map(function(tab) {
            var isA = activeTab === tab;
            return <button key={tab} onClick={function() { setActiveTab(tab); }} style={{padding:'7px 8px 6px',fontSize:11,fontWeight:isA?800:600,color:isA?'#0D9488':'#64748B',background:'transparent',border:'none',borderBottom:isA?'2px solid #0D9488':'2px solid transparent',cursor:'pointer',flexShrink:0,fontFamily:'inherit',whiteSpace:'nowrap',marginBottom:-1,lineHeight:1,letterSpacing:0}}>
              {tab}
            </button>;
          })}
        </div>

        {/* ── Tab body ── */}
        <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'grid',gap:12,alignContent:'start'}}>

          {activeTab === 'Overview' && (() => {
            var meta         = selectedTask.meta;
            var row          = selectedTask.row;
            var taskType     = (meta && meta.taskType)                 || row[4] || '-';
            var status       = (meta && meta.status)                   || row[8] || '-';
            var priority     = (meta && meta.priority)                 || row[6] || '-';
            var dueDate      = (meta && meta.dueDate)                  || row[7] || '-';
            var owner        = (meta && meta.owner)                    || row[5] || '-';
            var sourceRec    = (meta && meta.sourceRecordName)         || row[2] || '-';
            var sourceModule = (meta && meta.sourceModule)             || '-';
            var clientOrDept = (meta && meta.sourceClientOrDepartment) || row[1] || '-';
            var notes        = (meta && meta.notes)                    || '';
            var clientLabel  = isInternalIT ? 'Department' : 'Client';
            return <section style={{background:'#fff',border:'1px solid #EEF2F7',borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'12px 14px',borderBottom:'1px solid #EEF2F7',background:'#FAFCFF'}}>
                <h3 style={{margin:0,fontSize:14,color:'#0B1F3A',letterSpacing:'-.01em'}}>Task details</h3>
              </div>
              <div style={{padding:'4px 14px 12px'}}>
                {tField('Task type', taskType)}
                {tField('Status', status)}
                {tField('Priority', priority)}
                {tField('Due date', dueDate)}
                {tField('Owner', owner)}
                {tField('Linked record', sourceRec)}
                {sourceModule !== '-' && tField('Source module', sourceModule)}
                {clientOrDept !== '-' && tField(clientLabel, clientOrDept)}
                {notes && tField('Notes', notes)}
              </div>
            </section>;
          })()}

          {activeTab === 'Relationships' && (() => {
            var meta         = selectedTask.meta;
            var row          = selectedTask.row;
            // For session tasks use meta; for mock tasks fall back to row columns
            var sourceRec    = (meta && meta.sourceRecordName)         || row[2] || null;
            var sourceModule = (meta && meta.sourceModule)             || null;
            var clientOrDept = (meta && meta.sourceClientOrDepartment) || row[1] || null;
            // Capitalise the module name for display (licenses → Licenses)
            var moduleLabel  = sourceModule
              ? (sourceModule.charAt(0).toUpperCase() + sourceModule.slice(1))
              : null;
            return <section style={{background:'#fff',border:'1px solid #EEF2F7',borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'12px 14px',borderBottom:'1px solid #EEF2F7',background:'#FAFCFF'}}>
                <h3 style={{margin:'0 0 2px',fontSize:14,color:'#0B1F3A',letterSpacing:'-.01em'}}>Linked record</h3>
                <p style={{margin:0,color:'#64748B',fontSize:12,lineHeight:1.45}}>The record this task was created from.</p>
              </div>
              <div style={{padding:'14px'}}>
                {sourceRec
                  ? <div style={{border:'1px solid #EEF2F7',borderRadius:10,padding:'12px 14px',background:'#FAFCFF',display:'grid',gap:8}}>
                      <strong style={{fontSize:13,color:'#132033',lineHeight:1.3,wordBreak:'break-word'}}>{sourceRec}</strong>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}}>
                        {moduleLabel && <Badge tone={moduleLabel}>{moduleLabel}</Badge>}
                        {clientOrDept && <span style={{fontSize:12,color:'#64748B'}}>{clientOrDept}</span>}
                      </div>
                      {meta && (meta.linkedRecordSnapshot || meta.sourceModule) && (
                        <div style={{borderTop:'1px solid #F1F5F9',paddingTop:8,marginTop:2}}>
                          <button style={{...tActionBtn,fontSize:12,padding:'5px 10px'}} onClick={function() { openLinkedRecordOverlay(meta); }}>Open linked record</button>
                        </div>
                      )}
                    </div>
                  : <div style={{padding:'4px 0'}}>
                      <span style={{fontSize:12,color:'#64748B'}}>No linked record information available for this task.</span>
                    </div>
                }
              </div>
            </section>;
          })()}

          {activeTab === 'Documents' && (
            <section style={{background:'#fff',border:'1px solid #EEF2F7',borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'12px 14px',borderBottom:'1px solid #EEF2F7',background:'#FAFCFF'}}>
                <h3 style={{margin:0,fontSize:14,color:'#0B1F3A',letterSpacing:'-.01em'}}>Documents</h3>
              </div>
              <div style={{padding:'14px',display:'grid',gap:8}}>
                <strong style={{display:'block',color:'#132033',fontSize:13}}>No documents attached.</strong>
                <span style={{color:'#64748B',fontSize:12,lineHeight:1.45}}>Document attachments for tasks are a future feature.</span>
              </div>
            </section>
          )}

          {activeTab === 'Activity' && (
            <div style={{display:'grid',gap:12,alignContent:'start'}}>
              {(() => {
                var taskId = selectedTask.id;
                var actEvents = Array.isArray(RECORD_STORE.activity)
                  ? RECORD_STORE.activity.filter(function(ev) {
                      return ev.relatedRecordId === taskId
                          || ev.sourceRecordId === taskId;
                    }).slice().reverse()
                  : [];
                var evBadge = function(et) {
                  if (et === 'record_created')        return {bg:'#F0FDF4',border:'#BBF7D0',color:'#15803D'};
                  if (et === 'record_edited')          return {bg:'#EFF6FF',border:'#BFDBFE',color:'#1D4ED8'};
                  if (et === 'document_attached')      return {bg:'#EEF2FF',border:'#C7D2FE',color:'#4338CA'};
                  if (et === 'support_coverage_added') return {bg:'#F0FDFA',border:'#99F6E4',color:'#0F766E'};
                  if (et === 'task_created')           return {bg:'#FFF7ED',border:'#FED7AA',color:'#C2410C'};
                  return {bg:'#F8FAFC',border:'#E2E8F0',color:'#64748B'};
                };
                var fmtTime = function(iso) {
                  if (!iso) return '';
                  try {
                    var d = new Date(iso);
                    return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
                      + ' ' + d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
                  } catch(e) { return iso.slice(0,10); }
                };
                return <section style={{background:'#fff',border:'1px solid #EEF2F7',borderRadius:12,overflow:'hidden'}}>
                  <div style={{padding:'12px 14px',borderBottom:'1px solid #EEF2F7',background:'#FAFCFF',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                    <div>
                      <h3 style={{margin:'0 0 2px',fontSize:14,color:'#0B1F3A',letterSpacing:'-.01em'}}>Activity</h3>
                      <p style={{margin:0,color:'#64748B',fontSize:12,lineHeight:1.4}}>Session activity (sandbox) for this task.</p>
                    </div>
                    {actEvents.length > 0 && <span style={{fontSize:11,fontWeight:800,background:'#EFF6FF',color:'#1D4ED8',border:'1px solid #BFDBFE',borderRadius:999,padding:'2px 8px',flexShrink:0}}>{actEvents.length}</span>}
                  </div>
                  {actEvents.length === 0
                    ? <div style={{padding:'14px',display:'grid',gap:6}}>
                        <strong style={{display:'block',color:'#132033',fontSize:13}}>No activity yet.</strong>
                        <span style={{color:'#64748B',fontSize:12,lineHeight:1.45}}>Owner assignments, status updates and workflow events will appear here.</span>
                      </div>
                    : <div style={{padding:'4px 14px 10px',display:'grid',gap:0}}>
                        {actEvents.map(function(ev, i) {
                          var bc = evBadge(ev.eventType);
                          return <div key={ev.id} style={{padding:'10px 0',borderBottom:i < actEvents.length-1 ? '1px solid #F1F5F9' : 'none',display:'grid',gap:4}}>
                            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
                              <strong style={{fontSize:13,color:'#0B1F3A',lineHeight:1.3,flex:1}}>{ev.title}</strong>
                              <span style={{fontSize:10,fontWeight:800,background:bc.bg,border:'1px solid '+bc.border,color:bc.color,borderRadius:999,padding:'2px 7px',letterSpacing:'.02em',whiteSpace:'nowrap',flexShrink:0}}>{ev.eventType.replace(/_/g,' ')}</span>
                            </div>
                            {ev.description && <p style={{margin:0,fontSize:12.5,color:'#334155',lineHeight:1.45}}>{ev.description}</p>}
                            <div style={{display:'flex',gap:6,flexWrap:'wrap',fontSize:11,color:'#94A3B8',alignItems:'center'}}>
                              <span>{ev.actor || 'Current user'}</span>
                              {ev.createdAt && <><span>·</span><span>{fmtTime(ev.createdAt)}</span></>}
                            </div>
                          </div>;
                        })}
                      </div>
                  }
                </section>;
              })()}
            </div>
          )}

        </div>
      </aside>
    </>}

    {/* ── Linked-record detail overlay (opened from Relationships tab) ── */}
    {lrOverlayOpen && lrOverlayData && (
      <div style={{...tModalWrap, zIndex: 70}} onClick={function() { setLrOverlayOpen(false); }} role="dialog" aria-modal="true" aria-label="Linked record detail">
        <div style={{...tModalBox, width: 500}} onClick={function(e) { e.stopPropagation(); }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
            <div>
              <p style={tEyebrow}>{lrOverlayData.moduleKey}</p>
              <h2 style={{margin:0,color:'#0B1F3A',fontSize:20,letterSpacing:'-.03em'}}>{lrOverlayData.name}</h2>
              {lrOverlayData.clientOrDept && <p style={{margin:'4px 0 0',fontSize:12,color:'#64748B'}}>{lrOverlayData.clientOrDept}</p>}
            </div>
            <button style={tCloseBtn} onClick={function() { setLrOverlayOpen(false); }} aria-label="Close">x</button>
          </div>
          <div style={{display:'grid',gap:0,borderTop:'1px solid #F1F5F9',marginTop:4}}>
            {(lrOverlayData.columns || []).map(function(col, i) {
              var val = lrOverlayData.row && lrOverlayData.row[i] !== undefined ? lrOverlayData.row[i] : '';
              if (!val || val === '-') return null;
              return <div key={col} style={{display:'grid',gridTemplateColumns:'140px 1fr',gap:8,alignItems:'start',padding:'8px 0',borderBottom:'1px solid #F8FAFC'}}>
                <span style={{fontSize:12,color:'#94A3B8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',lineHeight:1.4}}>{col}</span>
                <span style={{fontSize:13,color:'#132033',lineHeight:1.4,wordBreak:'break-word'}}>{val}</span>
              </div>;
            })}
            {(!lrOverlayData.row || lrOverlayData.row.length === 0) && (
              <p style={{color:'#64748B',fontSize:13,margin:'12px 0 0'}}>No additional field data available for this record.</p>
            )}
          </div>
          <div style={tModalFoot}>
            <button onClick={function() { setLrOverlayOpen(false); }}>Close</button>
          </div>
        </div>
      </div>
    )}

    {/* ── Global New Task modal ── */}
    {newTaskOpen && (
      <div style={tModalWrap} onClick={function() { setNewTaskOpen(false); }} role="dialog" aria-modal="true" aria-label="Create task">
        <div style={tModalBox} onClick={function(e) { e.stopPropagation(); }}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
            <div>
              <p style={tEyebrow}>Tasks</p>
              <h2 style={{margin:0,color:'#0B1F3A',fontSize:20,letterSpacing:'-.03em'}}>New task</h2>
              <p style={{margin:'4px 0 0',fontSize:12,color:'#64748B',lineHeight:1.4}}>Create a task linked to a specific record. Tasks without a linked record cannot be tracked against renewal or operational context.</p>
            </div>
            <button style={tCloseBtn} onClick={function() { setNewTaskOpen(false); }} aria-label="Close">x</button>
          </div>

          {/* Required fields */}
          <div style={{display:'grid',gap:12}}>
            {[
              { key:'title',    label:'Task title',  type:'text',   placeholder:'e.g. Request renewal quote from vendor' },
            ].map(function(f) {
              return <div key={f.key}>
                <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>{f.label}<span style={{color:'#DC2626',marginLeft:3}}>*</span></label>
                <input type="text" value={newTaskForm[f.key]||''} onChange={function(e) { setNewTaskForm(function(p) { return Object.assign({},p,{[f.key]:e.target.value}); }); }} style={tFieldStyle} placeholder={f.placeholder}/>
                {newTaskErrors[f.key] && <span style={tErrStyle}>{newTaskErrors[f.key]}</span>}
              </div>;
            })}

            <div>
              <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>Task type<span style={{color:'#DC2626',marginLeft:3}}>*</span></label>
              <select value={newTaskForm.taskType||''} onChange={function(e) { setNewTaskForm(function(p) { return Object.assign({},p,{taskType:e.target.value}); }); }} style={{...tFieldStyle,cursor:'pointer',color:newTaskForm.taskType?'#132033':'#94A3B8'}}>
                <option value="">Select type...</option>
                {typeOpts.map(function(o) { return <option key={o} value={o}>{o}</option>; })}
              </select>
              {newTaskErrors.taskType && <span style={tErrStyle}>{newTaskErrors.taskType}</span>}
            </div>

            <div>
              <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>Linked record<span style={{color:'#DC2626',marginLeft:3}}>*</span></label>
              {/* SearchableSelect: linkedRecordOptions are {value: rec.id, label}
                  objects; the component returns opt.value (the record id) on
                  change, so handleGlobalTaskSave's lookup is unchanged.
                  allowCreate=false — you can only link existing records. */}
              <SearchableSelect
                value={newTaskForm.linkedRec||''}
                onChange={function(v) { setNewTaskForm(function(p) { return Object.assign({},p,{linkedRec:v}); }); }}
                options={linkedRecordOptions}
                placeholder="Search record..."
                ariaLabel="Linked record"
                required={true}
                allowCreate={false}
              />
              {newTaskErrors.linkedRec && <span style={tErrStyle}>{newTaskErrors.linkedRec}</span>}
            </div>

            <div>
              <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>Owner<span style={{color:'#DC2626',marginLeft:3}}>*</span></label>
              <SearchableSelect
                value={newTaskForm.owner||''}
                onChange={function(v) { setNewTaskForm(function(p) { return Object.assign({},p,{owner:v}); }); }}
                options={userOpts}
                placeholder="Search owner..."
                ariaLabel="Owner"
                required={true}
                allowCreate={false}
              />
              {newTaskErrors.owner && <span style={tErrStyle}>{newTaskErrors.owner}</span>}
            </div>
          </div>

          {/* Second row: Due date, Priority, Status */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>Due date<span style={{color:'#DC2626',marginLeft:3}}>*</span></label>
              <input type="date" value={newTaskForm.dueDate||''} onChange={function(e) { setNewTaskForm(function(p) { return Object.assign({},p,{dueDate:e.target.value}); }); }} style={tFieldStyle}/>
              {newTaskErrors.dueDate && <span style={tErrStyle}>{newTaskErrors.dueDate}</span>}
            </div>
            <div>
              <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>Priority<span style={{color:'#DC2626',marginLeft:3}}>*</span></label>
              <select value={newTaskForm.priority||''} onChange={function(e) { setNewTaskForm(function(p) { return Object.assign({},p,{priority:e.target.value}); }); }} style={{...tFieldStyle,cursor:'pointer',color:newTaskForm.priority?'#132033':'#94A3B8'}}>
                <option value="">Select...</option>
                {TASK_PRIORITY_OPTIONS.map(function(o) { return <option key={o} value={o}>{o}</option>; })}
              </select>
              {newTaskErrors.priority && <span style={tErrStyle}>{newTaskErrors.priority}</span>}
            </div>
            <div>
              <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>Status<span style={{color:'#DC2626',marginLeft:3}}>*</span></label>
              <select value={newTaskForm.status||''} onChange={function(e) { setNewTaskForm(function(p) { return Object.assign({},p,{status:e.target.value}); }); }} style={{...tFieldStyle,cursor:'pointer',color:newTaskForm.status?'#132033':'#94A3B8'}}>
                <option value="">Select...</option>
                {TASK_STATUS_OPTIONS.map(function(o) { return <option key={o} value={o}>{o}</option>; })}
              </select>
              {newTaskErrors.status && <span style={tErrStyle}>{newTaskErrors.status}</span>}
            </div>
          </div>

          {/* Optional: Notes */}
          <div style={{display:'flex',alignItems:'center',gap:8,margin:'0 0 -8px'}}>
            <span style={{fontSize:11,fontWeight:800,color:'#94A3B8',letterSpacing:'.1em',textTransform:'uppercase',flexShrink:0}}>Optional</span>
            <div style={{flex:1,height:1,background:'#EEF2F7'}}/>
          </div>
          <div>
            <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>Notes</label>
            <textarea value={newTaskForm.notes||''} onChange={function(e) { setNewTaskForm(function(p) { return Object.assign({},p,{notes:e.target.value}); }); }} rows={3} style={{...tFieldStyle,resize:'vertical'}} placeholder="Context, links or impact notes…"/>
          </div>

          <div style={tModalFoot}>
            <button onClick={function() { setNewTaskOpen(false); }}>Cancel</button>
            <button className="primary" onClick={handleGlobalTaskSave}>Save task</button>
          </div>
        </div>
      </div>
    )}
  </>;
}

function ReportsScreen({ workspaceMode = 'MSP / Integrator' }){
  const isInternalIT = workspaceMode === 'Internal IT';
  const importedReportCount = getLocalStoreRecords('licenses', workspaceMode).length + getLocalStoreRecords('hardware', workspaceMode).length + getLocalStoreRecords('contracts', workspaceMode).length;
  const reportsSubtitle = isInternalIT
    ? 'Executive and operational reporting across IT budget, approvals and renewal risk.'
    : workspaceMode === 'MSP / Integrator'
    ? 'Executive and operational reporting across your client renewal portfolio.'
    : 'Reports center for templates, schedules, generated reports, governance and exports.';
  const reportRows = importedReportCount > 0 ? [['Imported Session Records', 'Sandbox validation', 'Operators', 'Current user', 'Session', importedReportCount + ' records ready']] : (isInternalIT ? reportsInternalIT : reportsMsp);
  const exportButtons = isInternalIT
    ? ['Department renewal exposure CSV', 'CIO renewal brief', 'Governance evidence export']
    : ['Client renewal exposure CSV', 'Executive renewal brief', 'Governance evidence export'];
  const scheduledRows = isInternalIT
    ? [['Monthly renewal budget exposure','Monthly','May 1, 2026','Finance, IT Leadership','Jun 1, 2026','Approved'],['CIO risk brief','Weekly','May 6, 2026','CIO, Executive team','May 13, 2026','Draft ready'],['Audit evidence package','On demand','Apr 28, 2026','Compliance','Not scheduled','Export logged']]
    : [['Monthly client renewal exposure','Monthly','May 1, 2026','Finance, Account management','Jun 1, 2026','Approved'],['Board risk brief','Weekly','May 6, 2026','Executive team','May 13, 2026','Draft ready'],['Audit evidence package','On demand','Apr 28, 2026','Compliance','Not scheduled','Export logged']];
  return <main className="content"><ScreenHeader active="Reports" subtitle={reportsSubtitle}><button type="button" disabled aria-disabled="true" title="Coming soon — requires backend reporting" style={{opacity:0.55,cursor:'not-allowed'}}>Schedule report</button><button type="button" className="primary" disabled aria-disabled="true" title="Coming soon — requires backend reporting" style={{opacity:0.55,cursor:'not-allowed'}}>Generate report</button></ScreenHeader><section className="split"><article className="panel wide"><div className="panelTitle"><h2>Report templates</h2><span>{importedReportCount > 0 ? 'Showing local sandbox records. Demo data is used only when no local records exist.' : 'Operational, executive and governance-ready templates'}</span></div><Table columns={['Template','Type','Audience','Owner','Cadence','Status']} rows={reportRows}/><p style={{margin:'8px 0 0',fontSize:11,color:'#94A3B8'}}>Sample data — not live reports.</p></article><aside className="panel"><div className="panelTitle"><h2>Export center</h2><span>Export layout reference — backend required</span></div><div className="actionStack">{exportButtons.map(label=><button key={label} type="button" disabled aria-disabled="true" title="Coming soon — requires backend reporting" style={{opacity:0.55,cursor:'not-allowed'}}>{label}</button>)}<button type="button" disabled aria-disabled="true" title="Coming soon — requires backend reporting" style={{opacity:0.55,cursor:'not-allowed'}}>Export selected rows</button></div><p style={{margin:'10px 0 0',fontSize:12,color:'#92400E',background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:8,padding:'8px 10px',lineHeight:1.4}}>Report generation, scheduling and export run on the backend reporting engine (backend required).</p></aside></section><section className="panel"><div className="panelTitle"><h2>Scheduled and generated reports</h2><span>Recurring packs and recent outputs</span></div><Table columns={['Report','Schedule','Last generated','Recipients','Next run','Governance status']} rows={scheduledRows}/><p style={{margin:'8px 0 0',fontSize:11,color:'#94A3B8'}}>Sample data — not live reports.</p></section></main>;
}

function inferBrandFromProduct(product, fallbackBrand) {
  if (fallbackBrand) return fallbackBrand;
  var catalog = getProductByName(product);
  if (catalog && catalog.brand) return catalog.brand;
  var p = String(product || '');
  var known = MASTER_DATA.vendors.find(function(vendor) {
    return p.toLowerCase().indexOf(vendor.toLowerCase()) >= 0;
  });
  return known || '-';
}

function getMappedReviewImportValue(rowObj, mappings, targetFields) {
  var fields = Array.isArray(targetFields) ? targetFields : [targetFields];
  for (var i = 0; i < fields.length; i += 1) {
    var match = (mappings || []).find(function(mapping) {
      return mapping.action === 'Review' && mapping.suggestedField === fields[i] && rowObj[mapping.sourceColumn];
    });
    if (match) return rowObj[match.sourceColumn] || '';
  }
  return '';
}

function getImportContactContext(rowObj, mappings, edit) {
  var next = {
    contactName: edit && edit.contactName ? edit.contactName : getMappedReviewImportValue(rowObj, mappings, ['License Contact','Related Contact','Contact Name']),
    contactEmail: edit && edit.contactEmail ? edit.contactEmail : getMappedReviewImportValue(rowObj, mappings, 'Contact Email'),
    contactRole: edit && edit.contactRole ? edit.contactRole : ''
  };
  if (!next.contactRole && next.contactName) next.contactRole = 'License Contact';
  if (!next.contactRole && next.contactEmail) next.contactRole = 'Related Contact';
  return next.contactName || next.contactEmail || next.contactRole ? next : null;
}

function getImportContextClientDepartment(importContext, workspaceMode) {
  if (!importContext) return '';
  return workspaceMode === 'Internal IT'
    ? (importContext.departmentBusinessUnit || '')
    : (importContext.clientAccount || '');
}

function resolveImportClientDepartment(rowObj, mappings, edit, workspaceMode, importContext) {
  var isIT = workspaceMode === 'Internal IT';
  var fileValue = getMappedImportValue(rowObj, mappings, 'Client / Department');
  // Precedence (W1.5): manual drawer edit → file value → scope fallback
  // (only in single scope) → Unassigned sentinel (which W3 promotes to a
  // critical issue). In multi scope we intentionally do NOT use the import
  // context scope as a fallback because the file is multi-entity; assigning
  // unresolved rows to a single client/department would be a data-integrity
  // hazard. Unresolved rows must surface as Critical / Blocked.
  if (edit && edit.clientDepartment) return edit.clientDepartment;
  if (fileValue) return fileValue;
  var scopeMode = (importContext && importContext.scopeMode) || 'single';
  if (scopeMode === 'multi') {
    return isIT ? 'Unassigned department' : 'Unassigned client';
  }
  return getImportContextClientDepartment(importContext, workspaceMode) || (isIT ? 'Unassigned department' : 'Unassigned client');
}

// Session-only import batch history. Module-level mutable so the history
// survives navigation between Data Import and other modules within the same
// page session, but not a page reload. This matches the existing RECORD_STORE
// pattern and is intentional for sandbox MVP.
//
// TODO backend: replace with persistent import jobs that store the original
// uploaded file, approved mappings, validation results, created/updated
// records, severity counts, who performed the import and when. Backend must
// also support rollback / re-run, secure original-file storage, an audit
// trail per import, and user/workspace permissions for who can import into
// which client or department.
var IMPORT_BATCH_STORE = [];

function createImportBatchId() {
  return 'batch-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
}

function recordImportBatch(batch) {
  if (!batch) return;
  IMPORT_BATCH_STORE.unshift(batch);
}

function getImportBatches() {
  return IMPORT_BATCH_STORE.slice();
}

function filterImportPreviewItem(item, filterKey) {
  if (!item) return false;
  if (filterKey === 'all') return true;
  if (filterKey === 'blocked') return item.status === 'Blocked';
  if (filterKey === 'needsReview') return item.status === 'Needs review';
  if (filterKey === 'readyWithSuggestions') return item.status === 'Ready with suggestions';
  if (filterKey === 'ready') return item.status === 'Ready';
  if (filterKey === 'critical') return (item.criticalIssues || []).length > 0;
  if (filterKey === 'warnings') return (item.warningIssues || []).length > 0;
  if (filterKey === 'suggestions') return (item.suggestionIssues || []).length > 0;
  return true;
}

// TODO backend: move severity validation rules into the import job validation engine before corporate MVP.
function createImportIssue(severity, code, message, field) {
  return {
    severity: severity || 'warning',
    code: code || 'import_issue',
    message: message || 'Review import row.',
    field: field || ''
  };
}

function normalizeImportIssue(issue) {
  if (!issue) return null;
  if (typeof issue === 'string') return createImportIssue('warning', 'legacy_warning', issue);
  return createImportIssue(issue.severity, issue.code, issue.message, issue.field);
}

function buildImportIssueViews(issues) {
  var normalized = (issues || []).map(normalizeImportIssue).filter(Boolean);
  var criticalIssues = normalized.filter(function(issue) { return issue.severity === 'critical'; });
  var warningIssues = normalized.filter(function(issue) { return issue.severity === 'warning'; });
  var suggestionIssues = normalized.filter(function(issue) { return issue.severity === 'suggestion'; });
  return {
    issues: normalized,
    criticalIssues: criticalIssues,
    warningIssues: warningIssues,
    suggestionIssues: suggestionIssues,
    issueMessages: normalized.map(function(issue) { return issue.message; }),
    hasCriticalIssues: criticalIssues.length > 0
  };
}

function getImportRowStatus(issueViews) {
  if (issueViews.hasCriticalIssues) return 'Blocked';
  if (issueViews.warningIssues.length > 0) return 'Needs review';
  if (issueViews.suggestionIssues.length > 0) return 'Ready with suggestions';
  return 'Ready';
}

function addImportRowStatus(stats, issueViews) {
  if (issueViews.hasCriticalIssues || issueViews.warningIssues.length > 0) stats.review += 1;
  else stats.ready += 1;
}

function isUnassignedImportScope(value) {
  return !value || String(value).toLowerCase().indexOf('unassigned ') === 0;
}

function rawImportValuePresent(value) {
  return value !== undefined && value !== null && String(value).trim() !== '' && String(value).trim() !== '-';
}

function catalogContainsValue(values, value) {
  if (!rawImportValuePresent(value)) return false;
  var normalized = String(value).trim().toLowerCase();
  return (values || []).some(function(item) { return String(item).trim().toLowerCase() === normalized; });
}

function getImportSeverityCounts(previewItems) {
  return (previewItems || []).reduce(function(counts, item) {
    (item.criticalIssues || []).forEach(function() { counts.critical += 1; });
    (item.warningIssues || []).forEach(function() { counts.warning += 1; });
    (item.suggestionIssues || []).forEach(function() { counts.suggestion += 1; });
    return counts;
  }, { critical: 0, warning: 0, suggestion: 0 });
}

function buildImportLicenseRecord(rowObj, mappings, workspaceMode, sourceType, rowIndex, importContext) {
  var isIT = workspaceMode === 'Internal IT';
  var edit = (importContext && importContext.recordEdits && importContext.recordEdits[rowIndex + 2]) || {};
  var product = edit.productLicenseName || getMappedImportValueAny(rowObj, mappings, ['Product / License Name','License / Product']) || 'Imported license';
  var client = resolveImportClientDepartment(rowObj, mappings, edit, workspaceMode, importContext);
  var brand = edit.brandManufacturer || inferBrandFromProduct(product, getMappedImportValueAny(rowObj, mappings, ['Brand / Manufacturer','Brand']));
  var provider = edit.providerDistributor || getMappedImportValue(rowObj, mappings, 'Provider / Distributor') || '-';
  var resellerPartner = edit.resellerPartner || getMappedImportValue(rowObj, mappings, 'Reseller / Partner');
  var quantity = edit.quantitySeats || getMappedImportValueAny(rowObj, mappings, ['Quantity / Seats','Quantity']) || '-';
  var startDate = normalizeImportDate(edit.startDate || getMappedImportValue(rowObj, mappings, 'Start Date'));
  var renewalDate = normalizeImportDate(edit.expirationRenewalDate || getMappedImportValue(rowObj, mappings, 'Expiration / Renewal Date'));
  var licenseTerm = edit.licenseTerm
    || getMappedImportValue(rowObj, mappings, 'License Term')
    || (startDate && renewalDate ? inferLicenseTerm(startDate, renewalDate) : '');
  var contractNumber = edit.contractNumber || getMappedImportValue(rowObj, mappings, 'Contract Number');
  var orderReference = edit.orderReference || getMappedImportValue(rowObj, mappings, 'PO / Order Reference');
  var invoiceDate = normalizeImportDate(edit.invoiceDate || getMappedImportValue(rowObj, mappings, 'Invoice Date'));
  var invoiceReference = edit.invoiceReference || getMappedImportValue(rowObj, mappings, 'Invoice / Billing Reference');
  var annualValue = importMoney(edit.commercialValue || getMappedImportValueAny(rowObj, mappings, ['Sale Price / Annual Value','Annual Value / Annual Cost']));
  var vendorCost = importMoney(edit.vendorCost || getMappedImportValue(rowObj, mappings, 'Vendor Cost'));
  var importContactContext = getImportContactContext(rowObj, mappings, edit);
  var owner = edit.owner || 'Unassigned';
  var alertPolicy = edit.alertPolicy || 'Workspace default';
  var calc = calcMargin(annualValue, vendorCost);
  var status = calcExpirationState(renewalDate, alertPolicy, '').systemStatus;
  var columns = getModuleColumns('licenses', workspaceMode);
  var valueDisplay = formatImportMoney(annualValue);
  var marginDisplay = calc.marginDollar ? formatImportMoney(calc.marginDollar) : '-';
  var sourceStatus = getMappedImportValue(rowObj, mappings, 'Source Status / Vendor Status');
  var note = getMappedImportValue(rowObj, mappings, 'Notes') || ('Imported from ' + sourceType + ' row ' + (rowIndex + 2) + '.');
  var map = isIT
    ? {
        'License / Product': product,
        'Brand': brand,
        'Provider': provider,
        'Department': client,
        'Quantity': quantity,
        'Renewal': renewalDate || '-',
        'Value': valueDisplay,
        'Approval status': sourceStatus || 'Pending review',
        'Owner': owner,
        'Status': status,
        'Action': 'Review import'
      }
    : {
        'License / Product': product,
        'Client': client,
        'Brand': brand,
        'Distributor': provider,
        'Quantity': quantity,
        'Renewal': renewalDate || '-',
        'Value': valueDisplay,
        'Margin': marginDisplay,
        'Owner': owner,
        'Status': status,
        'Action': 'Review import'
      };
  var displayName = buildImportLicenseDisplayName(brand, product, client);
  var record = {
    id: createRecordId('licenses'),
    row: columns.map(function(col) { return map[col] !== undefined && map[col] !== '' ? map[col] : '-'; }),
    meta: {
      source: 'importSandbox',
      sourceType: sourceType,
      rowNumber: rowIndex + 2,
      notes: note,
      alertPolicy: alertPolicy,
      sourceStatus: sourceStatus,
      sourceReference: orderReference || contractNumber || invoiceReference || '',
      contractNumber: contractNumber,
      orderReference: orderReference,
      invoiceDate: invoiceDate,
      invoiceReference: invoiceReference,
      resellerPartner: resellerPartner,
      startDate: startDate,
      licenseTerm: licenseTerm,
      importContactContext: importContactContext
    }
  };
  return withImportRecordMeta(record, 'licenses', {
    displayName: displayName,
    clientDepartment: client,
    brandManufacturer: brand,
    productLicenseName: product,
    providerDistributor: provider,
    expirationRenewalDate: renewalDate,
    quantitySeats: quantity,
    commercialValue: annualValue,
    vendorCost: vendorCost,
    owner: owner,
    alertPolicy: alertPolicy,
    startDate: startDate,
    licenseTerm: licenseTerm,
    contractNumber: contractNumber,
    orderReference: orderReference
  }, importContext || {});
}

function buildImportHardwareRecord(rowObj, mappings, workspaceMode, sourceType, rowIndex, importContext) {
  var isIT = workspaceMode === 'Internal IT';
  var edit = (importContext && importContext.recordEdits && importContext.recordEdits[rowIndex + 2]) || {};
  var assetName = edit.productLicenseName || getMappedImportValue(rowObj, mappings, 'Asset Name') || getMappedImportValueAny(rowObj, mappings, ['Product / License Name','License / Product']) || 'Imported hardware asset';
  var client = resolveImportClientDepartment(rowObj, mappings, edit, workspaceMode, importContext);
  var brand = edit.brandManufacturer || inferBrandFromProduct(assetName, getMappedImportValueAny(rowObj, mappings, ['Brand / Manufacturer','Brand']));
  var provider = edit.providerDistributor || getMappedImportValue(rowObj, mappings, 'Provider / Distributor') || '-';
  var serial = edit.serialNumber || getMappedImportValue(rowObj, mappings, 'Serial Number') || '-';
  var warrantyEnd = normalizeImportDate(edit.expirationRenewalDate || getMappedImportValue(rowObj, mappings, 'Warranty End Date') || getMappedImportValue(rowObj, mappings, 'Expiration / Renewal Date'));
  var owner = edit.owner || 'Unassigned';
  var alertPolicy = edit.alertPolicy || 'Workspace default';
  var sourceStatus = getMappedImportValue(rowObj, mappings, 'Source Status / Vendor Status');
  var columns = getModuleColumns('hardware', workspaceMode);
  var map = isIT
    ? {
        'Asset': assetName,
        'Type': 'Hardware',
        'Brand': brand,
        'Model': assetName,
        'Serial': serial,
        'Department': client,
        'Provider': provider,
        'Warranty end': warrantyEnd || '-',
        'Approval status': sourceStatus || 'Pending review',
        'Owner': owner,
        'Status': warrantyEnd ? calcExpirationState(warrantyEnd, alertPolicy, '').systemStatus : 'Pending date',
        'Risk': '-',
        'Action': 'Review import'
      }
    : {
        'Asset': assetName,
        'Type': 'Hardware',
        'Client': client,
        'Brand': brand,
        'Model': assetName,
        'Serial': serial,
        'Warranty end': warrantyEnd || '-',
        'Support': getMappedImportValue(rowObj, mappings, 'Support') || '-',
        'Owner': owner,
        'Status': warrantyEnd ? calcExpirationState(warrantyEnd, alertPolicy, '').systemStatus : 'Pending date',
        'Risk': '-',
        'Action': 'Review import'
      };
  var record = {
    id: createRecordId('hardware'),
    row: columns.map(function(col) { return map[col] !== undefined && map[col] !== '' ? map[col] : '-'; }),
    meta: {
      source: 'importSandbox',
      sourceType: sourceType,
      rowNumber: rowIndex + 2,
      serialNumber: serial !== '-' ? serial : '',
      orderReference: getMappedImportValue(rowObj, mappings, 'PO / Order Reference'),
      purchaseDate: normalizeImportDate(getMappedImportValue(rowObj, mappings, 'Purchase Date')),
      notes: getMappedImportValue(rowObj, mappings, 'Notes') || ('Imported from ' + sourceType + ' row ' + (rowIndex + 2) + '.')
    }
  };
  return withImportRecordMeta(record, 'hardware', {
    displayName: assetName,
    clientDepartment: client,
    brandManufacturer: brand,
    productLicenseName: assetName,
    providerDistributor: provider,
    expirationRenewalDate: warrantyEnd,
    quantitySeats: '',
    commercialValue: '',
    vendorCost: '',
    owner: owner,
    alertPolicy: alertPolicy,
    contractNumber: '',
    orderReference: ''
  }, importContext || {});
}

function buildImportContractRecord(rowObj, mappings, workspaceMode, sourceType, rowIndex, importContext) {
  var edit = (importContext && importContext.recordEdits && importContext.recordEdits[rowIndex + 2]) || {};
  var contractNumber = edit.contractNumber || getMappedImportValue(rowObj, mappings, 'Contract Number');
  var renewalDate = normalizeImportDate(edit.expirationRenewalDate || getMappedImportValue(rowObj, mappings, 'Expiration / Renewal Date'));
  if (!contractNumber || !renewalDate) return null;
  var isIT = workspaceMode === 'Internal IT';
  var client = resolveImportClientDepartment(rowObj, mappings, edit, workspaceMode, importContext);
  var provider = edit.providerDistributor || getMappedImportValue(rowObj, mappings, 'Provider / Distributor') || '-';
  var support = edit.productLicenseName || getMappedImportValue(rowObj, mappings, 'Support') || 'Support coverage';
  var owner = edit.owner || 'Unassigned';
  var alertPolicy = edit.alertPolicy || 'Workspace default';
  var columns = getModuleColumns('contracts', workspaceMode);
  var sourceStatus = getMappedImportValue(rowObj, mappings, 'Source Status / Vendor Status');
  var map = isIT
    ? {
        'Contract': contractNumber,
        'Type': support,
        'Department': client,
        'Provider': provider,
        'Owner': owner,
        'Document': 'Not attached',
        'Renewal': renewalDate,
        'Notice': 'Workspace default',
        'Approval status': sourceStatus || 'Pending review',
        'Next action': 'Review import',
        'Risk': '-'
      }
    : {
        'Contract': contractNumber,
        'Type': support,
        'Client': client,
        'Provider / Distributor': provider,
        'Owner': owner,
        'Document': 'Not attached',
        'Renewal': renewalDate,
        'Notice': 'Workspace default',
        'Legal status': sourceStatus || 'Pending review',
        'Next action': 'Review import',
        'Risk': '-'
      };
  var record = {
    id: createRecordId('contracts'),
    row: columns.map(function(col) { return map[col] !== undefined && map[col] !== '' ? map[col] : '-'; }),
    meta: { source: 'importSandbox', sourceType: sourceType, rowNumber: rowIndex + 2, importContactContext: getImportContactContext(rowObj, mappings, edit) }
  };
  return withImportRecordMeta(record, 'contracts', {
    displayName: contractNumber,
    clientDepartment: client,
    brandManufacturer: '',
    productLicenseName: support,
    providerDistributor: provider,
    expirationRenewalDate: renewalDate,
    quantitySeats: '',
    commercialValue: '',
    vendorCost: '',
    owner: owner,
    alertPolicy: alertPolicy,
    contractNumber: contractNumber,
    orderReference: ''
  }, importContext || {});
}

function buildImportPreview(rowObjects, mappings, sourceType, workspaceMode, importTarget, importContext) {
  var preview = [];
  var records = { licenses: [], hardware: [], contracts: [] };
  var stats = { processed: rowObjects.length, ready: 0, licenses: 0, hardware: 0, contracts: 0, skipped: 0, review: 0, duplicates: 0, missingBrandProduct: 0 };
  var generalWarnings = [];
  var seenImportKeys = new Set();
  var skippedColumns = mappings.filter(function(mapping) { return mapping.action === 'Skip' || !mapping.suggestedField; }).map(function(mapping) { return mapping.sourceColumn; });
  rowObjects.forEach(function(rowObj, index) {
    var target = detectImportTarget(rowObj, mappings, sourceType, importTarget);
    var issues = [];
    // Coverage Import C3a — per-row Coverage suggestion array. Populated for
    // license and hardware targets only; contracts and other targets
    // remain [] so consumers (preview row badge, drawer details) can
    // safely read .length without optional chaining.
    var rowSuggestedCoverages = [];
    function pushIssue(severity, code, message, field) {
      issues.push(createImportIssue(severity, code, message, field));
    }
    if (target.warning) {
      pushIssue(target.moduleKey === 'review' ? 'critical' : 'warning', target.moduleKey === 'review' ? 'target_unidentified' : 'target_review', target.warning, 'target');
    }
    if (skippedColumns.length > 0) {
      pushIssue('suggestion', 'skipped_columns', 'Some source columns are skipped or unmapped; review mapping if they contain useful context.', 'mapping');
    }
    if ((mappings || []).some(function(mapping) { return mapping.confidence === 'Low' && mapping.action !== 'Skip'; })) {
      pushIssue('suggestion', 'low_mapping_confidence', 'One or more mapped columns have low confidence and may benefit from review.', 'mapping');
    }
    if (target.moduleKey === 'package') {
      if (generalWarnings.indexOf('Renewal Package / Bundle import is partially supported in this sandbox. Opriva will create the best available underlying license, hardware or contract records where possible. Full package modeling will require backend support.') < 0) {
        generalWarnings.push('Renewal Package / Bundle import is partially supported in this sandbox. Opriva will create the best available underlying license, hardware or contract records where possible. Full package modeling will require backend support.');
      }
      var packageHasHardware = getMappedImportValue(rowObj, mappings, 'Serial Number') || getMappedImportValue(rowObj, mappings, 'Warranty End Date');
      var packageHasProduct = getMappedImportValueAny(rowObj, mappings, ['Product / License Name','License / Product']);
      var packageHasContract = getMappedImportValue(rowObj, mappings, 'Contract Number') && getMappedImportValue(rowObj, mappings, 'Expiration / Renewal Date');
      target = packageHasHardware
        ? { moduleKey: 'hardware', label: 'Hardware / Warranty' }
        : packageHasProduct
        ? { moduleKey: 'licenses', label: 'License' }
        : packageHasContract
        ? { moduleKey: 'contracts', label: 'Contract / Support Coverage' }
        : { moduleKey: 'licenses', label: 'License' };
    }
    var quantitySources = mappings.filter(function(mapping) {
      return mapping.action === 'Import' && (mapping.suggestedField === 'Quantity' || mapping.suggestedField === 'Quantity / Seats') && rowObj[mapping.sourceColumn];
    });
    if (quantitySources.length > 1) pushIssue('warning', 'ambiguous_quantity', 'Multiple quantity columns are mapped; review quantity before import.', 'Quantity / Seats');
    var record = null;
    if (target.moduleKey === 'licenses') {
      var edit = (importContext && importContext.recordEdits && importContext.recordEdits[index + 2]) || {};
      var previewProduct = edit.productLicenseName || getMappedImportValueAny(rowObj, mappings, ['Product / License Name','License / Product']);
      var previewBrand = edit.brandManufacturer || inferBrandFromProduct(previewProduct, getMappedImportValueAny(rowObj, mappings, ['Brand / Manufacturer','Brand']));
      var previewClient = resolveImportClientDepartment(rowObj, mappings, edit, workspaceMode, importContext);
      var previewProvider = edit.providerDistributor || getMappedImportValue(rowObj, mappings, 'Provider / Distributor');
      var previewReseller = edit.resellerPartner || getMappedImportValue(rowObj, mappings, 'Reseller / Partner');
      var previewQuantity = edit.quantitySeats || getMappedImportValueAny(rowObj, mappings, ['Quantity / Seats','Quantity']);
      var previewRenewalRaw = edit.expirationRenewalDate || getMappedImportValue(rowObj, mappings, 'Expiration / Renewal Date');
      var previewRenewal = normalizeImportDate(previewRenewalRaw);
      var previewStartRaw = edit.startDate || getMappedImportValue(rowObj, mappings, 'Start Date');
      var previewStart = normalizeImportDate(previewStartRaw);
      var previewLicenseTerm = edit.licenseTerm
        || getMappedImportValue(rowObj, mappings, 'License Term')
        || (previewStart && previewRenewal ? inferLicenseTerm(previewStart, previewRenewal) : '');
      var previewContract = edit.contractNumber || getMappedImportValue(rowObj, mappings, 'Contract Number');
      var previewOrderRef = edit.orderReference || getMappedImportValue(rowObj, mappings, 'PO / Order Reference');
      var previewValue = edit.commercialValue || getMappedImportValueAny(rowObj, mappings, ['Sale Price / Annual Value','Annual Value / Annual Cost']);
      var previewCost = edit.vendorCost || getMappedImportValue(rowObj, mappings, 'Vendor Cost');
      var previewContactContext = getImportContactContext(rowObj, mappings, edit);
      var previewOwner = edit.owner || 'Unassigned';
      var previewAlertPolicy = edit.alertPolicy || 'Workspace default';
      var previewInvoice = edit.invoiceReference || getMappedImportValue(rowObj, mappings, 'Invoice / Billing Reference') || edit.invoiceDate || getMappedImportValue(rowObj, mappings, 'Invoice Date');
      if (!previewProduct) pushIssue('critical', 'missing_product', 'Missing required product or license name.', 'Product / License Name');
      if (previewProduct && !catalogContainsValue(MASTER_DATA.products.map(function(product) { return product.name; }), previewProduct)) pushIssue('warning', 'new_product_catalog_value', 'Product/license is not in the catalog and should be staged for review.', 'Product / License Name');
      if (!previewBrand || previewBrand === '-') pushIssue('warning', 'unknown_brand', 'Unknown brand/manufacturer; stage catalog value for review.', 'Brand / Manufacturer');
      else if (!catalogContainsValue(MASTER_DATA.vendors, previewBrand)) pushIssue('warning', 'new_brand_catalog_value', 'Brand/manufacturer is not in the catalog and should be staged for review.', 'Brand / Manufacturer');
      if (!previewProduct || !previewBrand || previewBrand === '-') stats.missingBrandProduct += 1;
      if (isUnassignedImportScope(previewClient)) pushIssue('critical', 'missing_client_department', 'Missing required client/department after file and import context fallback.', 'Client / Department');
      if (rawImportValuePresent(previewRenewalRaw) && !previewRenewal) pushIssue('critical', 'invalid_expiration_date', 'Invalid expiration/renewal date prevents expiration logic.', 'Expiration / Renewal Date');
      else if (!previewRenewal) pushIssue('critical', 'missing_expiration_date', 'Missing required expiration/renewal date.', 'Expiration / Renewal Date');
      if (rawImportValuePresent(previewStartRaw) && !previewStart) pushIssue('suggestion', 'invalid_start_date', 'Start date could not be parsed and should be cleaned up.', 'Start Date');
      if (!previewProvider || previewProvider === '-') pushIssue('warning', 'unknown_provider', 'Missing or unknown provider/distributor; stage catalog value for review.', 'Provider / Distributor');
      else if (!catalogContainsValue(MASTER_DATA.providers, previewProvider) && !catalogContainsValue(MASTER_DATA.vendors, previewProvider)) pushIssue('warning', 'new_provider_catalog_value', 'Provider/distributor is not in the catalog and should be staged for review.', 'Provider / Distributor');
      if (!previewOwner || previewOwner === 'Unassigned') pushIssue('warning', 'missing_owner', 'Missing owner; assign before relying on renewal workflow ownership.', 'Owner');
      if (!previewAlertPolicy) pushIssue('warning', 'missing_alert_policy', 'Missing alert policy; workspace default will be used.', 'Alert Policy');
      if (previewContactContext) pushIssue('warning', 'sensitive_contact', 'Sensitive contact field. Review before creating or linking contact.', 'Contact');
      record = buildImportLicenseRecord(rowObj, mappings, workspaceMode, sourceType, index, importContext || {});
      var licenseDuplicateKeys = (record.meta && record.meta.duplicateKeys) || [];
      var duplicateRisk = isDuplicateByKeys(licenseDuplicateKeys, seenImportKeys)
        || (Array.isArray(RECORD_STORE.licenses) && RECORD_STORE.licenses.some(function(existing) { return matchesExistingRecord(record.meta, existing); }));
      if (duplicateRisk) {
        pushIssue('warning', 'duplicate_risk', 'Duplicate risk detected against this import session or existing records.', 'duplicate');
        stats.duplicates += 1;
      }
      addKeysToSet(licenseDuplicateKeys, seenImportKeys);
      records.licenses.push(record);
      stats.licenses += 1;
      var licenseIssueViews = buildImportIssueViews(issues);
      addImportRowStatus(stats, licenseIssueViews);
      // Coverage Import C3a — compute Suggested Coverage records (Support /
      // Maintenance) for this license row using mapped C1 canonical fields.
      // Data layer only — Coverage records are NOT created here; later
      // phases (C4 approve/edit/skip, C5 confirm-time creation) consume
      // this array. Suggestions never become issues and never affect
      // severity counts or confirm gating.
      var licenseSuggestedCoverages = buildSuggestedCoveragesForLicense({
        coverageType: getMappedImportValue(rowObj, mappings, 'Coverage Type'),
        coverageReference: getMappedImportValue(rowObj, mappings, 'Coverage Reference'),
        supportProvider: getMappedImportValue(rowObj, mappings, 'Support Provider'),
        supportLevel: getMappedImportValue(rowObj, mappings, 'Support Level'),
        supportReference: getMappedImportValue(rowObj, mappings, 'Support Reference'),
        supportStartDate: getMappedImportValue(rowObj, mappings, 'Support Start Date'),
        supportEndDate: getMappedImportValue(rowObj, mappings, 'Support End Date'),
        supportTerm: getMappedImportValue(rowObj, mappings, 'Support Term'),
        supportIncluded: getMappedImportValue(rowObj, mappings, 'Support Included') || getMappedImportValue(rowObj, mappings, 'Support'),
        maintenanceStartDate: getMappedImportValue(rowObj, mappings, 'Maintenance Start Date'),
        maintenanceEndDate: getMappedImportValue(rowObj, mappings, 'Maintenance End Date'),
        maintenanceTerm: getMappedImportValue(rowObj, mappings, 'Maintenance Term'),
        licenseStartDate: previewStart,
        licenseEndDate: previewRenewal,
        parentBrand: previewBrand && previewBrand !== '-' ? previewBrand : ''
      });
      preview.push({
        rowNumber: index + 2,
        moduleLabel: target.label,
        name: buildImportLicenseDisplayName(previewBrand, previewProduct, previewClient),
        clientDepartment: previewClient || '-',
        brandProduct: [previewBrand && previewBrand !== '-' ? previewBrand : '', previewProduct].filter(Boolean).join(' / ') || '-',
        expiration: previewRenewal || '-',
        suggestedCoverages: licenseSuggestedCoverages,
        createdRecords: ['License'].concat(previewContract ? ['Contract reference'] : []).concat(importTarget === 'Renewal Package' || importTarget === 'Renewal Package / Bundle' ? ['Renewal Package / Bundle context'] : []),
        canonical: {
          brandManufacturer: previewBrand && previewBrand !== '-' ? previewBrand : '',
          productLicenseName: previewProduct || '',
          clientDepartment: previewClient || '',
          providerDistributor: previewProvider || '',
          resellerPartner: previewReseller || '',
          quantitySeats: previewQuantity || '',
          expirationRenewalDate: previewRenewal || '',
          contractNumber: previewContract || '',
          orderReference: previewOrderRef || '',
          commercialValue: previewValue || '',
          vendorCost: previewCost || '',
          owner: previewOwner || 'Unassigned',
          alertPolicy: previewAlertPolicy,
          invoiceReference: previewInvoice || '',
          startDate: previewStart || '',
          licenseTerm: previewLicenseTerm || '',
          contactName: previewContactContext ? previewContactContext.contactName : '',
          contactEmail: previewContactContext ? previewContactContext.contactEmail : '',
          contactRole: previewContactContext ? previewContactContext.contactRole : ''
        },
        issues: licenseIssueViews.issues,
        criticalIssues: licenseIssueViews.criticalIssues,
        warningIssues: licenseIssueViews.warningIssues,
        suggestionIssues: licenseIssueViews.suggestionIssues,
        issueMessages: licenseIssueViews.issueMessages,
        hasCriticalIssues: licenseIssueViews.hasCriticalIssues,
        status: getImportRowStatus(licenseIssueViews)
      });
      return;
    } else if (target.moduleKey === 'hardware') {
      var hardwareEdit = (importContext && importContext.recordEdits && importContext.recordEdits[index + 2]) || {};
      var hardwareNameRaw = hardwareEdit.productLicenseName || getMappedImportValue(rowObj, mappings, 'Asset Name') || getMappedImportValueAny(rowObj, mappings, ['Product / License Name','License / Product']);
      var hardwareClient = resolveImportClientDepartment(rowObj, mappings, hardwareEdit, workspaceMode, importContext);
      var hardwareBrand = hardwareEdit.brandManufacturer || inferBrandFromProduct(hardwareNameRaw, getMappedImportValueAny(rowObj, mappings, ['Brand / Manufacturer','Brand']));
      var hardwareProvider = hardwareEdit.providerDistributor || getMappedImportValue(rowObj, mappings, 'Provider / Distributor');
      var hardwareOwner = hardwareEdit.owner || 'Unassigned';
      var hardwareWarrantyRaw = hardwareEdit.expirationRenewalDate || getMappedImportValue(rowObj, mappings, 'Warranty End Date') || getMappedImportValue(rowObj, mappings, 'Expiration / Renewal Date');
      var hardwareWarrantyEnd = normalizeImportDate(hardwareWarrantyRaw);
      if (!hardwareNameRaw) pushIssue('critical', 'missing_hardware_name', 'Missing required hardware asset name.', 'Asset Name');
      if (isUnassignedImportScope(hardwareClient)) pushIssue('critical', 'missing_client_department', 'Missing required client/department after file and import context fallback.', 'Client / Department');
      if (rawImportValuePresent(hardwareWarrantyRaw) && !hardwareWarrantyEnd) pushIssue('critical', 'invalid_warranty_date', 'Invalid warranty/renewal date prevents expiration logic.', 'Warranty End Date');
      else if (String(target.label || '').indexOf('Warranty') >= 0 && !hardwareWarrantyEnd) pushIssue('critical', 'missing_warranty_date', 'Missing required warranty/renewal date for hardware warranty import.', 'Warranty End Date');
      if (!getMappedImportValue(rowObj, mappings, 'Serial Number')) pushIssue('warning', 'missing_serial', 'Missing serial number; review if this asset needs unique hardware identification.', 'Serial Number');
      if (!hardwareBrand || hardwareBrand === '-') pushIssue('warning', 'unknown_brand', 'Unknown brand/manufacturer; stage catalog value for review.', 'Brand / Manufacturer');
      else if (!catalogContainsValue(MASTER_DATA.vendors, hardwareBrand)) pushIssue('warning', 'new_brand_catalog_value', 'Brand/manufacturer is not in the catalog and should be staged for review.', 'Brand / Manufacturer');
      if (!hardwareProvider || hardwareProvider === '-') pushIssue('warning', 'unknown_provider', 'Missing or unknown provider/distributor; stage catalog value for review.', 'Provider / Distributor');
      else if (!catalogContainsValue(MASTER_DATA.providers, hardwareProvider) && !catalogContainsValue(MASTER_DATA.vendors, hardwareProvider)) pushIssue('warning', 'new_provider_catalog_value', 'Provider/distributor is not in the catalog and should be staged for review.', 'Provider / Distributor');
      if (!hardwareOwner || hardwareOwner === 'Unassigned') pushIssue('warning', 'missing_owner', 'Missing owner; assign before relying on renewal workflow ownership.', 'Owner');
      record = buildImportHardwareRecord(rowObj, mappings, workspaceMode, sourceType, index, importContext || {});
      var hardwareDuplicateKeys = (record.meta && record.meta.duplicateKeys) || [];
      var hardwareDuplicate = isDuplicateByKeys(hardwareDuplicateKeys, seenImportKeys)
        || (Array.isArray(RECORD_STORE.hardware) && RECORD_STORE.hardware.some(function(existing) { return matchesExistingRecord(record.meta, existing); }));
      if (hardwareDuplicate) {
        pushIssue('warning', 'duplicate_risk', 'Duplicate risk detected against this import session or existing records.', 'duplicate');
        stats.duplicates += 1;
      }
      addKeysToSet(hardwareDuplicateKeys, seenImportKeys);
      records.hardware.push(record);
      stats.hardware += 1;
      // Coverage Import C3a — compute Suggested Coverage records (Warranty +
      // optional file-provided Support + Maintenance) for this hardware
      // row. Data-layer only; assigned to a local var consumed by the
      // general preview.push() below.
      var hardwareSuggestedCoverages = buildSuggestedCoveragesForHardware({
        coverageType: getMappedImportValue(rowObj, mappings, 'Coverage Type'),
        coverageReference: getMappedImportValue(rowObj, mappings, 'Coverage Reference'),
        warrantyProvider: getMappedImportValue(rowObj, mappings, 'Warranty Provider'),
        warrantyStartDate: getMappedImportValue(rowObj, mappings, 'Warranty Start Date'),
        warrantyEndDate: hardwareWarrantyEnd || getMappedImportValue(rowObj, mappings, 'Warranty End Date'),
        warrantyTerm: getMappedImportValue(rowObj, mappings, 'Warranty Term'),
        supportProvider: getMappedImportValue(rowObj, mappings, 'Support Provider'),
        supportLevel: getMappedImportValue(rowObj, mappings, 'Support Level'),
        supportReference: getMappedImportValue(rowObj, mappings, 'Support Reference'),
        supportStartDate: getMappedImportValue(rowObj, mappings, 'Support Start Date'),
        supportEndDate: getMappedImportValue(rowObj, mappings, 'Support End Date'),
        maintenanceStartDate: getMappedImportValue(rowObj, mappings, 'Maintenance Start Date'),
        maintenanceEndDate: getMappedImportValue(rowObj, mappings, 'Maintenance End Date'),
        maintenanceTerm: getMappedImportValue(rowObj, mappings, 'Maintenance Term'),
        purchaseDate: normalizeImportDate(getMappedImportValue(rowObj, mappings, 'Purchase Date')),
        parentBrand: hardwareBrand && hardwareBrand !== '-' ? hardwareBrand : ''
      });
      rowSuggestedCoverages = hardwareSuggestedCoverages;
    } else if (target.moduleKey === 'contracts') {
      var contractEdit = (importContext && importContext.recordEdits && importContext.recordEdits[index + 2]) || {};
      var previewContractNumber = contractEdit.contractNumber || getMappedImportValue(rowObj, mappings, 'Contract Number');
      var contractRenewalRaw = contractEdit.expirationRenewalDate || getMappedImportValue(rowObj, mappings, 'Expiration / Renewal Date');
      var contractRenewalDate = normalizeImportDate(contractRenewalRaw);
      var contractClient = resolveImportClientDepartment(rowObj, mappings, contractEdit, workspaceMode, importContext);
      var contractProvider = contractEdit.providerDistributor || getMappedImportValue(rowObj, mappings, 'Provider / Distributor');
      var contractOwner = contractEdit.owner || 'Unassigned';
      if (!previewContractNumber) pushIssue('critical', 'missing_contract_number', 'Missing required contract number.', 'Contract Number');
      if (isUnassignedImportScope(contractClient)) pushIssue('critical', 'missing_client_department', 'Missing required client/department after file and import context fallback.', 'Client / Department');
      if (rawImportValuePresent(contractRenewalRaw) && !contractRenewalDate) pushIssue('critical', 'invalid_contract_renewal_date', 'Invalid contract renewal date prevents expiration logic.', 'Expiration / Renewal Date');
      else if (!contractRenewalDate) pushIssue('critical', 'missing_contract_renewal_date', 'Missing required contract renewal date.', 'Expiration / Renewal Date');
      if (!contractProvider || contractProvider === '-') pushIssue('warning', 'unknown_provider', 'Missing or unknown provider/distributor; stage catalog value for review.', 'Provider / Distributor');
      else if (!catalogContainsValue(MASTER_DATA.providers, contractProvider) && !catalogContainsValue(MASTER_DATA.vendors, contractProvider)) pushIssue('warning', 'new_provider_catalog_value', 'Provider/distributor is not in the catalog and should be staged for review.', 'Provider / Distributor');
      if (!contractOwner || contractOwner === 'Unassigned') pushIssue('warning', 'missing_owner', 'Missing owner; assign before relying on renewal workflow ownership.', 'Owner');
      record = buildImportContractRecord(rowObj, mappings, workspaceMode, sourceType, index, importContext || {});
      if (record) {
        if (record.meta && record.meta.importContactContext) pushIssue('warning', 'sensitive_contact', 'Sensitive contact field. Review before creating or linking contact.', 'Contact');
        var contractDuplicateKeys = (record.meta && record.meta.duplicateKeys) || [];
        var contractDuplicate = isDuplicateByKeys(contractDuplicateKeys, seenImportKeys)
          || (Array.isArray(RECORD_STORE.contracts) && RECORD_STORE.contracts.some(function(existing) { return matchesExistingRecord(record.meta, existing); }));
        if (contractDuplicate) {
          pushIssue('warning', 'duplicate_risk', 'Duplicate risk detected against this import session or existing records.', 'duplicate');
          stats.duplicates += 1;
        }
        addKeysToSet(contractDuplicateKeys, seenImportKeys);
        records.contracts.push(record);
        stats.contracts += 1;
      } else {
        stats.skipped += 1;
        pushIssue('critical', 'review_required', 'Review required before Opriva can create this record.', 'target');
      }
    }
    var issueViews = buildImportIssueViews(issues);
    addImportRowStatus(stats, issueViews);
    if (!record && target.moduleKey !== 'review' && target.moduleKey !== 'package') stats.skipped += 1;
    preview.push({
      rowNumber: index + 2,
      moduleLabel: target.label,
      name: record && record.row ? record.row[0] : (getMappedImportValueAny(rowObj, mappings, ['Product / License Name','License / Product']) || getMappedImportValue(rowObj, mappings, 'Asset Name') || 'Needs review'),
      clientDepartment: record && record.meta ? (record.meta.clientDepartment || '-') : '-',
      brandProduct: record && record.meta ? ([record.meta.brandManufacturer, record.meta.productLicenseName].filter(Boolean).join(' / ') || '-') : '-',
      expiration: record && record.meta ? (record.meta.expirationRenewalDate || '-') : '-',
      suggestedCoverages: rowSuggestedCoverages,
      createdRecords: [target.label],
      canonical: record && record.meta ? {
        brandManufacturer: record.meta.brandManufacturer || '',
        productLicenseName: record.meta.productLicenseName || '',
        clientDepartment: record.meta.clientDepartment || '',
        providerDistributor: record.meta.providerDistributor || '',
        quantitySeats: record.meta.quantitySeats || '',
        expirationRenewalDate: record.meta.expirationRenewalDate || '',
        contractNumber: record.meta.contractNumber || '',
        orderReference: record.meta.orderReference || '',
        commercialValue: record.meta.commercialValue || '',
        vendorCost: record.meta.vendorCost || '',
        owner: record.meta.owner || 'Unassigned',
        alertPolicy: record.meta.alertPolicy || 'Workspace default',
        serialNumber: record.meta.serialNumber || '',
        purchaseDate: record.meta.purchaseDate || '',
        startDate: record.meta.startDate || '',
        licenseTerm: record.meta.licenseTerm || ''
      } : {},
      issues: issueViews.issues,
      criticalIssues: issueViews.criticalIssues,
      warningIssues: issueViews.warningIssues,
      suggestionIssues: issueViews.suggestionIssues,
      issueMessages: issueViews.issueMessages,
      hasCriticalIssues: issueViews.hasCriticalIssues,
      status: getImportRowStatus(issueViews)
    });
  });
  stats.skipped += preview.filter(function(item) { return item.moduleLabel === 'Renewal Package' || item.moduleLabel === 'Related Component' || item.moduleLabel === 'Review needed'; }).length;
  return { preview: preview, records: records, stats: stats, generalWarnings: generalWarnings, entitySummary: buildImportEntitySummary(records, workspaceMode) };
}

function DataImportScreen({ workspaceMode = 'MSP / Integrator' }){
  const isInternalIT = workspaceMode === 'Internal IT';
  const templateHref = isInternalIT
    ? '/templates/OPRIVA_IMPORT_TEMPLATE_INTERNAL_IT.xlsx'
    : '/templates/OPRIVA_IMPORT_TEMPLATE_MSP.xlsx';
  const templateDownloadName = isInternalIT
    ? 'OPRIVA_IMPORT_TEMPLATE_INTERNAL_IT.xlsx'
    : 'OPRIVA_IMPORT_TEMPLATE_MSP.xlsx';
  const templateButtonLabel = isInternalIT
    ? 'Download Internal IT Template'
    : 'Download MSP Template';
  const canonicalTemplateHref = '/templates/OPRIVA_IMPORT_TEMPLATE_CANONICAL.xlsx';
  const canonicalTemplateDownloadName = 'OPRIVA_IMPORT_TEMPLATE_CANONICAL.xlsx';
  const historyRows = isInternalIT ? importRows.internalIT : importRows.mspIntegrator;
  const [workbook, setWorkbook] = React.useState(null);
  const [fileName, setFileName] = React.useState('');
  const [sheetNames, setSheetNames] = React.useState([]);
  const [selectedSheet, setSelectedSheet] = React.useState('');
  const [headers, setHeaders] = React.useState([]);
  const [rowObjects, setRowObjects] = React.useState([]);
  const [mappings, setMappings] = React.useState([]);
  const [sourceType, setSourceType] = React.useState('No file loaded');
  const [suggestedImportTarget, setSuggestedImportTarget] = React.useState('Mixed / Let Opriva classify rows');
  const [importTarget, setImportTarget] = React.useState('Mixed / Let Opriva classify rows');
  const [importError, setImportError] = React.useState('');
  const [importResult, setImportResult] = React.useState(null);
  const [recordEdits, setRecordEdits] = React.useState({});
  const [importDefaults, setImportDefaults] = React.useState({
    brandManufacturer: '',
    productLicenseName: '',
    owner: '',
    alertPolicy: 'Workspace default',
    providerDistributor: ''
  });
  // TODO backend: persist import context with the import batch/job, enforce RBAC for
  // client/department import scope, write audit-trail events, and stage detected
  // catalog/entity values for approval before corporate MVP.
  const [importContext, setImportContext] = React.useState({
    workspaceMode: workspaceMode,
    // 'single' = one client/department for the whole file; selected scope value
    // is used as fallback for rows without a file-resolved client/department.
    // 'multi' = file may contain multiple clients/departments; no global
    // fallback, unresolved rows surface as W3 critical issues.
    scopeMode: 'single',
    clientAccount: '',
    departmentBusinessUnit: '',
    purpose: '',
    targetModules: ['Licenses', 'Hardware', 'Contracts / Support Coverage']
  });
  const [previewSelectedRecord, setPreviewSelectedRecord] = React.useState(null);
  const [previewDrawerOpen, setPreviewDrawerOpen] = React.useState(false);
  const [previewEditForm, setPreviewEditForm] = React.useState({});
  const [rawDetailsOpen, setRawDetailsOpen] = React.useState(false);
  const [importPreviewFilter, setImportPreviewFilter] = React.useState('all');
  // Bumped after a successful Confirm Import so the session history panel
  // re-reads IMPORT_BATCH_STORE without needing a global subscription.
  const [importBatchesVersion, setImportBatchesVersion] = React.useState(0);
  const [importStep, setImportStep] = React.useState('context');
  // Coverage Import C4 — per-suggestion decisions (approve / edit / skip).
  // Keyed by `${rowNumber}::${coverageKind}`. Shape per entry:
  //   { status: 'approved' | 'edited' | 'skipped', edits: { coverageType?, startDate?, endDate?, provider?, supportLevel?, reference? } }
  // Missing key = 'pending' (blocks Confirm). 'pending' is the absence of an
  // entry, not a stored status, so undo simply deletes the key.
  // TODO backend: persist decisions to a coverage_approval_event table per
  // import batch with decidedBy / decidedAt. Corporate MVP requires
  // permission gating (who can approve), audit trail and re-import
  // reconciliation when the same source file is re-uploaded.
  const [coverageDecisions, setCoverageDecisions] = React.useState({});
  // Single suggestion being edited at any time in the drawer. Key shape
  // matches coverageDecisions. null when no edit form is open.
  const [editingCoverageKey, setEditingCoverageKey] = React.useState(null);
  // Transient draft for the inline edit form — committed to coverageDecisions
  // on Save, discarded on Cancel.
  const [editCoverageDraft, setEditCoverageDraft] = React.useState({});
  // Reset decisions and any open edit form when the workbook or mappings
  // change. Preview regenerates with potentially different suggestions, so
  // existing keys could point at non-existent rows or coverages. This
  // mirrors the existing `setImportResult(null)` reset pattern used after
  // mapping changes.
  React.useEffect(function() {
    setCoverageDecisions({});
    setEditingCoverageKey(null);
    setEditCoverageDraft({});
  }, [workbook, mappings]);
  const importContextScopeLabel = isInternalIT ? 'Department / Business Unit' : 'Client / Account';
  const importContextScopeValue = isInternalIT ? importContext.departmentBusinessUnit : importContext.clientAccount;
  const importContextScopeOptions = isInternalIT ? MASTER_DATA.departments : MASTER_DATA.companies;
  // TODO W2+: use importContext.targetModules to constrain suggested/allowed import targets. W1 only stores it as context/meta.
  const importContextTargetModules = ['Licenses', 'Hardware', 'Contracts / Support Coverage'];
  const importContextHasTargetModules = Array.isArray(importContext.targetModules) && importContext.targetModules.length > 0;
  // W1.5 scope mode awareness
  const importContextScopeMode = importContext.scopeMode || 'single';
  const isMultiScope = importContextScopeMode === 'multi';
  // Single scope: requires a selected scope value (client/department) AND target modules.
  // Multi scope: requires only target modules; the file's mapped column resolves ownership per row.
  const importContextReady = isMultiScope
    ? importContextHasTargetModules
    : (Boolean(importContextScopeValue) && importContextHasTargetModules);
  const importContextDisabledMessage = isMultiScope
    ? (!importContextHasTargetModules ? 'Select at least one target module before upload.' : '')
    : (!importContextScopeValue
      ? 'Select a ' + (isInternalIT ? 'department or business unit' : 'client or account') + ' before upload.'
      : !importContextHasTargetModules
      ? 'Select at least one target module before upload.'
      : '');
  // Workspace-aware scope option labels surfaced in the Import Context UI.
  const importScopeModeOptions = isInternalIT
    ? [
        { key: 'single', label: 'Single department', description: 'All rows belong to one department. Pick it now.' },
        { key: 'multi', label: 'Multi-department file', description: 'File contains multiple departments. Map Department / Business Unit columns during Mapping.' }
      ]
    : [
        { key: 'single', label: 'Single client', description: 'All rows belong to one client. Pick it now.' },
        { key: 'multi', label: 'Multi-client file', description: 'File contains multiple clients. Map a Client / Account column during Mapping.' }
      ];
  // True when any mapping resolves to Client / Department with Import action.
  // Used by multi-scope to gate Confirm Import and surface a Mapping-step
  // guidance banner when ownership cannot be resolved per row.
  const hasClientDepartmentMapping = (mappings || []).some(function(m) {
    return m.action === 'Import' && m.suggestedField === 'Client / Department';
  });
  const multiScopeMissingColumn = isMultiScope && rowObjects.length > 0 && !hasClientDepartmentMapping;

  // Coverage Import C1 — detection only. When any mapping resolves to a
  // warranty/support/maintenance/coverage canonical field with an active
  // action (Import or Review), surface a small helper banner in the Mapping
  // step so the user knows Opriva detected coverage-related data. No
  // Coverage records are created yet; later phases (C2-C5) will materialise
  // them via inference, preview suggestions, approval and creation.
  const COVERAGE_RELATED_IMPORT_FIELDS = [
    'Support', 'Warranty End Date',
    'Warranty Start Date', 'Warranty Term', 'Warranty Provider',
    'Support Start Date', 'Support End Date', 'Support Term', 'Support Provider',
    'Support Level', 'Support Reference',
    'Maintenance Start Date', 'Maintenance End Date', 'Maintenance Term',
    'Coverage Type', 'Coverage Reference', 'Support Included'
  ];
  const hasCoverageRelatedMappings = (mappings || []).some(function(m) {
    return m.action !== 'Skip' && COVERAGE_RELATED_IMPORT_FIELDS.indexOf(m.suggestedField) >= 0;
  });

  function updateImportContext(key, value) {
    setImportContext(function(prev) {
      return Object.assign({}, prev, { [key]: value });
    });
    setImportResult(null);
  }

  function toggleImportTargetModule(moduleName) {
    setImportContext(function(prev) {
      var current = Array.isArray(prev.targetModules) ? prev.targetModules : [];
      var exists = current.indexOf(moduleName) >= 0;
      return Object.assign({}, prev, {
        targetModules: exists ? current.filter(function(item) { return item !== moduleName; }) : current.concat(moduleName)
      });
    });
    setImportResult(null);
  }

  function mergeImportMappingSuggestions(existingMappings, nextMappings) {
    return nextMappings.map(function(mapping, index) {
      var existing = (existingMappings || []).find(function(item) {
        return item.sourceColumn === mapping.sourceColumn;
      }) || (existingMappings || [])[index];
      if (existing && existing.userEdited) {
        return Object.assign({}, existing, {
          index: mapping.index,
          sampleValue: mapping.sampleValue
        });
      }
      return mapping;
    });
  }

  function applySheet(nextWorkbook, nextSheetName) {
    var data = getImportSheetData(nextWorkbook, nextSheetName);
    var detected = detectImportSourceType(data.headers);
    var suggestedTarget = suggestImportTargetFromSource(detected);
    setSelectedSheet(nextSheetName);
    setHeaders(data.headers);
    setRowObjects(data.rowObjects);
    setSourceType(detected);
    setMappings(createImportMappings(data.headers, data.rowObjects, detected, suggestedTarget, workspaceMode));
    setSuggestedImportTarget(suggestedTarget);
    setImportTarget(suggestedTarget);
    setRecordEdits({});
    setImportDefaults({
      brandManufacturer: '',
      productLicenseName: '',
      owner: '',
      alertPolicy: 'Workspace default',
      providerDistributor: ''
    });
    setPreviewDrawerOpen(false);
    setPreviewSelectedRecord(null);
    setImportResult(null);
    setImportStep('mapping');
  }

  async function handleExcelUpload(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    setImportError('');
    if (!importContextReady) {
      setImportError(importContextDisabledMessage || 'Complete import context before uploading a workbook.');
      event.target.value = '';
      return;
    }
    try {
      var buffer = await file.arrayBuffer();
      var parsed = XLSX.read(buffer, { type: 'array' });
      var names = parsed.SheetNames || [];
      setWorkbook(parsed);
      setFileName(file.name);
      setSheetNames(names);
      if (names.length > 0) applySheet(parsed, names[0]);
      else setImportError('No sheets were found in this workbook.');
    } catch (err) {
      setImportError('Opriva could not read this Excel file. Try another .xlsx or .xls workbook.');
    }
  }

  function handleSheetChange(event) {
    var nextSheet = event.target.value;
    if (workbook && nextSheet) applySheet(workbook, nextSheet);
  }

  function updateMapping(index, key, value) {
    setMappings(function(prev) {
      return prev.map(function(mapping, i) {
        return i === index ? Object.assign({}, mapping, { [key]: value, userEdited: true }) : mapping;
      });
    });
    setImportResult(null);
  }

  function handleImportTargetChange(event) {
    var nextTarget = event.target.value;
    setImportTarget(nextTarget);
    if (headers.length > 0) {
      var nextMappings = createImportMappings(headers, rowObjects, sourceType, nextTarget, workspaceMode);
      setMappings(function(prev) {
        return mergeImportMappingSuggestions(prev, nextMappings);
      });
    }
    setImportResult(null);
  }

  React.useEffect(function() {
    if (headers.length === 0) return;
    var nextMappings = createImportMappings(headers, rowObjects, sourceType, importTarget, workspaceMode);
    setMappings(function(prev) {
      return mergeImportMappingSuggestions(prev, nextMappings);
    });
    setImportResult(null);
  }, [workspaceMode]);

  React.useEffect(function() {
    setImportContext(function(prev) {
      return Object.assign({}, prev, {
        workspaceMode: workspaceMode,
        clientAccount: workspaceMode === 'Internal IT' ? '' : prev.clientAccount,
        departmentBusinessUnit: workspaceMode === 'Internal IT' ? prev.departmentBusinessUnit : ''
      });
    });
    setImportResult(null);
  }, [workspaceMode]);

  function updateRecordEdit(rowNumber, key, value) {
    setRecordEdits(function(prev) {
      var next = Object.assign({}, prev);
      next[rowNumber] = Object.assign({}, next[rowNumber] || {}, { [key]: value });
      return next;
    });
    setImportResult(null);
  }

  // Map an edit-form field key (used by buildEditForm / getFormFields) back to
  // the canonical key written into recordEdits so the record builders pick it
  // up on the next preview pass. Returns null for non-canonical / computed
  // fields that should not propagate to recordEdits.
  function previewEditKeyToCanonical(key, moduleKey) {
    if (key === 'name') return moduleKey === 'contracts' ? 'contractNumber' : 'productLicenseName';
    if (key === 'type') return moduleKey === 'contracts' ? 'productLicenseName' : null;
    if (key === 'client') return 'clientDepartment';
    if (key === 'brand') return 'brandManufacturer';
    if (key === 'provider' || key === 'distributor') return 'providerDistributor';
    if (key === 'owner') return 'owner';
    if (key === 'seats') return 'quantitySeats';
    if (key === 'renewalDate' || key === 'warrantyEnd') return 'expirationRenewalDate';
    if (key === 'contractValue' || key === 'annualCost' || key === 'assetValue') return 'commercialValue';
    if (key === 'cost') return 'vendorCost';
    if (key === 'alertPolicy') return 'alertPolicy';
    if (key === 'startDate') return 'startDate';
    if (key === 'licenseTerm') return 'licenseTerm';
    if (key === 'serial') return 'serialNumber';
    if (key === 'purchaseDate') return 'purchaseDate';
    return null;
  }

  function moduleKeyToTitle(moduleKey) {
    if (moduleKey === 'hardware') return 'Hardware';
    if (moduleKey === 'contracts') return 'Contracts';
    return 'Licenses';
  }

  function moduleKeyToDisplay(moduleKey) {
    if (moduleKey === 'hardware') return 'Hardware';
    if (moduleKey === 'contracts') return 'Contracts / Support Coverage';
    return 'Licenses';
  }

  function openImportReviewDrawer(item) {
    if (!item) return;
    var moduleKey = item.moduleLabel === 'Hardware / Warranty' ? 'hardware'
      : item.moduleLabel === 'Contract / Support Coverage' ? 'contracts'
      : 'licenses';
    var record = (importPreview.records[moduleKey] || []).find(function(r) {
      return r && r.meta && r.meta.rowNumber === item.rowNumber;
    });
    if (!record) return;
    var moduleTitle = moduleKeyToTitle(moduleKey);
    var fieldSpecs = getFormFields(moduleTitle, workspaceMode);
    var columns = getModuleColumns(moduleKey, workspaceMode);
    var selected = {
      id: record.id,
      moduleKey: moduleKey,
      columns: columns,
      row: record.row,
      localRowIndex: -1,
      meta: record.meta,
      isImportPreview: true,
      importRowNumber: item.rowNumber,
      // Coverage Import C3c — surface inferred Coverage suggestions inside
      // the existing Review drawer. Read-only; no Approve/Edit/Skip actions
      // in C3. Phase C4 will add per-suggestion approval gating.
      suggestedCoverages: Array.isArray(item.suggestedCoverages) ? item.suggestedCoverages : []
    };
    setPreviewSelectedRecord(selected);
    setPreviewEditForm(buildEditForm(selected, fieldSpecs, workspaceMode));
    setPreviewDrawerOpen(true);
  }

  function closePreviewDrawer() {
    setPreviewDrawerOpen(false);
    setPreviewSelectedRecord(null);
    setPreviewEditForm({});
    // Coverage Import C4 — discard any in-progress edit form on drawer close.
    // The decision state itself (coverageDecisions) persists across drawer
    // open/close so the user does not lose Approve/Skip choices.
    setEditingCoverageKey(null);
    setEditCoverageDraft({});
  }

  // Save preview-mode edits to recordEdits only. Never writes to RECORD_STORE
  // or module rows — Confirm Import remains the only path to canonical
  // record creation.
  function handlePreviewEditSave() {
    if (!previewSelectedRecord || !previewSelectedRecord.isImportPreview) return;
    var moduleKey = previewSelectedRecord.moduleKey;
    var rowNumber = previewSelectedRecord.importRowNumber;
    setRecordEdits(function(prev) {
      var next = Object.assign({}, prev);
      var rowEdit = Object.assign({}, next[rowNumber] || {});
      Object.keys(previewEditForm || {}).forEach(function(key) {
        var canonical = previewEditKeyToCanonical(key, moduleKey);
        if (!canonical) return;
        var value = previewEditForm[key];
        if (value === undefined || value === null) return;
        rowEdit[canonical] = value;
      });
      next[rowNumber] = rowEdit;
      return next;
    });
    setImportResult(null);
    closePreviewDrawer();
  }

  function updateImportDefault(key, value) {
    setImportDefaults(function(prev) {
      return Object.assign({}, prev, { [key]: value });
    });
    setImportResult(null);
  }

  function insertImportedRecords(moduleKey, records) {
    var existing = Array.isArray(RECORD_STORE[moduleKey]) ? RECORD_STORE[moduleKey] : [];
    var knownKeys = new Set();
    var knownImportKeys = new Set();
    existing.forEach(function(record) {
      if (!record || !record.meta) return;
      if (record.meta.duplicateKeys && record.meta.duplicateKeys.length) {
        addKeysToSet(record.meta.duplicateKeys, knownKeys);
      } else if (record.meta.importKey) {
        knownImportKeys.add(record.meta.importKey);
      }
    });
    var created = [];
    var duplicates = 0;
    records.forEach(function(record) {
      var dupKeys = (record && record.meta && record.meta.duplicateKeys) || [];
      var importKey = record && record.meta && record.meta.importKey ? record.meta.importKey : '';
      var isDup = isDuplicateByKeys(dupKeys, knownKeys) || (importKey && knownImportKeys.has(importKey));
      if (isDup) {
        duplicates += 1;
        return;
      }
      if (dupKeys.length) {
        addKeysToSet(dupKeys, knownKeys);
      } else if (importKey) {
        knownImportKeys.add(importKey);
      }
      created.push(record);
    });
    if (created.length) RECORD_STORE[moduleKey] = created.concat(existing);
    return { created: created, duplicates: duplicates };
  }

  const importPreview = React.useMemo(function() {
    return buildImportPreview(rowObjects, mappings, sourceType, workspaceMode, importTarget, {
      fileName: fileName,
      sheetName: selectedSheet,
      importTarget: importTarget,
      sourceType: sourceType,
      workspaceMode: workspaceMode,
      clientAccount: importContext.clientAccount,
      departmentBusinessUnit: importContext.departmentBusinessUnit,
      purpose: importContext.purpose,
      targetModules: importContext.targetModules,
      recordEdits: recordEdits
    });
  }, [rowObjects, mappings, sourceType, workspaceMode, importTarget, fileName, selectedSheet, recordEdits, importContext]);
  const unmappedColumns = mappings.filter(function(mapping) {
    return mapping.action === 'Skip' || !mapping.suggestedField;
  });
  const importSummaryEntity = importPreview.entitySummary || {};
  const importSeverityCounts = getImportSeverityCounts(importPreview.preview);
  const importSummarySensitiveFields = (importPreview.preview || []).filter(function(item) {
    return (item.warningIssues || []).some(function(issue) {
      return issue.code === 'sensitive_contact';
    });
  }).length;
  // Filter chip definitions for the preview table. Counts are recomputed
  // whenever importPreview changes. Filtering only affects the visible
  // preview rows; importPreview, severity totals, confirm gating, parsing,
  // mapping, drawer/review, duplicate detection and RECORD_STORE are not
  // affected.
  const importPreviewFilterDefinitions = React.useMemo(function() {
    var preview = (importPreview && importPreview.preview) || [];
    function countBy(predicateKey) {
      return preview.filter(function(item) { return filterImportPreviewItem(item, predicateKey); }).length;
    }
    return [
      { key: 'all', label: 'All', count: preview.length },
      { key: 'blocked', label: 'Blocked', count: countBy('blocked') },
      { key: 'needsReview', label: 'Needs review', count: countBy('needsReview') },
      { key: 'readyWithSuggestions', label: 'Ready with suggestions', count: countBy('readyWithSuggestions') },
      { key: 'ready', label: 'Ready', count: countBy('ready') },
      { key: 'critical', label: 'Critical errors', count: countBy('critical') },
      { key: 'warnings', label: 'Warnings', count: countBy('warnings') },
      { key: 'suggestions', label: 'Suggestions', count: countBy('suggestions') }
    ];
  }, [importPreview]);
  const activeImportPreviewFilter = importPreviewFilterDefinitions.find(function(filter) { return filter.key === importPreviewFilter; }) || importPreviewFilterDefinitions[0];
  const filteredPreviewItems = React.useMemo(function() {
    return ((importPreview && importPreview.preview) || []).filter(function(item) {
      return filterImportPreviewItem(item, importPreviewFilter);
    });
  }, [importPreview, importPreviewFilter]);
  // Re-reads IMPORT_BATCH_STORE whenever a new batch is recorded so the
  // session history panel updates without a global subscription.
  const sessionImportBatches = React.useMemo(function() {
    return getImportBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importBatchesVersion]);
  const formatEntitySummaryMetric = function(entityKey) {
    if (!rowObjects.length || !importSummaryEntity[entityKey]) return 'Not detected yet';
    var entity = importSummaryEntity[entityKey];
    return String(entity.matched || 0) + ' matched / ' + String(entity.toCreate || entity.review || 0) + ' new or review';
  };
  // The compact 8-item summary bar in the render block consumes the same
  // underlying values directly (sourceType, importTarget, rowObjects.length,
  // importPreview.entitySummary.recordsToCreate, importPreview.stats.ready,
  // importSeverityCounts.critical/warning/suggestion). Workspace mode,
  // Selected sheet, Rows needing review, Sensitive fields, Duplicate risks
  // and Missing brand/product remain queryable on importPreview but are no
  // longer surfaced in the summary; they are covered by the ValidationPanel
  // (W3) and the per-row Issues column.
  const importSummaryEntities = [
    [isInternalIT ? 'Unique departments' : 'Unique clients', formatEntitySummaryMetric('clients')],
    ['Contacts', rowObjects.length && importSummaryEntity.contacts ? String(importSummaryEntity.contacts.review || 0) + ' review required' : 'Not detected yet'],
    ['Unique brands', formatEntitySummaryMetric('brands')],
    ['Unique products', formatEntitySummaryMetric('products')],
    ['Unique providers', formatEntitySummaryMetric('providers')],
    ['Relationships', rowObjects.length ? String(importSummaryEntity.relationshipsToCreate || 0) + ' staged' : 'Not detected yet']
  ];
  const hasWorkbookColumns = Boolean(workbook && headers.length > 0);
  const hasValidationData = rowObjects.length > 0 && importPreview.preview.length > 0;
  const hasImportPreview = importPreview.preview.length > 0;
  const recordsReadyToConfirm =
    ((importPreview.records.licenses || []).length +
    (importPreview.records.hardware || []).length +
    (importPreview.records.contracts || []).length) > 0;
  const hasCriticalImportIssues = (importSeverityCounts.critical || 0) > 0;
  // Coverage Import C4 — derive pending suggestion count across all preview
  // rows. A suggestion is pending when no decision entry exists for its key.
  // Approved / edited / skipped suggestions are NOT pending.
  const pendingCoverageCount = React.useMemo(function() {
    var count = 0;
    ((importPreview && importPreview.preview) || []).forEach(function(item) {
      (item.suggestedCoverages || []).forEach(function(cov) {
        var key = item.rowNumber + '::' + cov.coverageKind;
        var decision = coverageDecisions[key];
        if (!decision || decision.status === 'pending') count += 1;
      });
    });
    return count;
  }, [importPreview, coverageDecisions]);
  const hasPendingCoverageSuggestions = pendingCoverageCount > 0;
  // W1.5: multi scope requires a mapped Client / Department column to resolve
  // ownership per row. Without one, every row would fall back to "Unassigned"
  // and Confirm Import must stay blocked even before per-row severity scans.
  // Coverage Import C4: pending coverage suggestions also gate Confirm.
  const canConfirmImport = recordsReadyToConfirm && !hasCriticalImportIssues && !multiScopeMissingColumn && !hasPendingCoverageSuggestions;
  const multiScopeMissingColumnMessage = multiScopeMissingColumn
    ? (isInternalIT
      ? 'Multi-department mode requires a Department / Business Unit column mapping. Map a source column to Client / Department in the Mapping step.'
      : 'Multi-client mode requires a Client / Account column mapping. Map a source column to Client / Department in the Mapping step.')
    : '';
  // Coverage Import C4 — confirm-blocking copy when pending suggestions are
  // the only blocker.
  const pendingCoverageMessage = hasPendingCoverageSuggestions
    ? pendingCoverageCount + ' coverage suggestion' + (pendingCoverageCount === 1 ? '' : 's') + ' need' + (pendingCoverageCount === 1 ? 's' : '') + ' approval, edit or skip before Confirm Import.'
    : '';
  const confirmBlockedMessage = hasCriticalImportIssues
    ? 'Confirm Import is blocked until ' + importSeverityCounts.critical + ' critical issue' + (importSeverityCounts.critical === 1 ? ' is' : 's are') + ' fixed.'
    : (multiScopeMissingColumn ? multiScopeMissingColumnMessage : (hasPendingCoverageSuggestions ? pendingCoverageMessage : ''));
  const warningContinueMessage = !hasCriticalImportIssues && (importSeverityCounts.warning || 0) > 0
    ? 'Warnings do not block import, but review them before confirming.'
    : '';
  const mappingStepUnlocked = importContextReady && hasWorkbookColumns;
  const validationStepUnlocked = mappingStepUnlocked && hasValidationData;
  const previewStepUnlocked = validationStepUnlocked && hasImportPreview;
  const confirmStepUnlocked = previewStepUnlocked && recordsReadyToConfirm;
  const importStepDefinitions = [
    {
      key: 'context',
      label: 'Context',
      unlocked: true,
      complete: importContextReady,
      helper: importContextReady
        ? (isInternalIT ? 'Department scope is ready.' : 'Client/account scope is ready.')
        : (importContextDisabledMessage || 'Complete import context before upload.')
    },
    {
      key: 'upload',
      label: 'Upload',
      unlocked: importContextReady,
      complete: Boolean(fileName && hasWorkbookColumns),
      helper: importContextReady ? (fileName || 'Upload an Excel workbook.') : importContextDisabledMessage
    },
    {
      key: 'mapping',
      label: 'Mapping',
      unlocked: mappingStepUnlocked,
      complete: mappingStepUnlocked && mappings.length > 0,
      helper: !importContextReady ? importContextDisabledMessage : hasWorkbookColumns ? 'Review target records, sheet and column mappings.' : 'Upload a workbook to unlock mapping.'
    },
    {
      key: 'validation',
      label: 'Validation',
      unlocked: validationStepUnlocked,
      complete: validationStepUnlocked,
      helper: !mappingStepUnlocked ? 'Complete context and mapping before validation.' : hasValidationData ? 'Review entity detection, missing data and duplicate signals.' : 'Mapping data is required before validation.'
    },
    {
      key: 'preview',
      label: 'Preview',
      unlocked: previewStepUnlocked,
      complete: previewStepUnlocked && importPreview.stats.ready > 0,
      helper: !validationStepUnlocked ? 'Validation data is required before preview.' : hasImportPreview ? 'Review and enrich normalized records before creation.' : 'Validation data is required before preview.'
    },
    {
      key: 'confirm',
      label: 'Confirm',
      unlocked: confirmStepUnlocked,
      complete: Boolean(importResult),
      helper: !previewStepUnlocked ? 'Preview records before confirming.' : hasCriticalImportIssues ? confirmBlockedMessage : recordsReadyToConfirm ? 'Confirm session-only record creation when review is complete.' : 'No records are ready to confirm yet.'
    }
  ];
  const currentImportStep = importStepDefinitions.find(function(step) { return step.key === importStep; }) || importStepDefinitions[0];

  function selectImportStep(stepKey) {
    var nextStep = importStepDefinitions.find(function(step) { return step.key === stepKey; });
    if (!nextStep || !nextStep.unlocked) return;
    setImportStep(stepKey);
  }

  function showImportStep(stepKey) {
    return currentImportStep.key === stepKey;
  }

  React.useEffect(function() {
    if (currentImportStep.unlocked) return;
    var fallback = importStepDefinitions.slice().reverse().find(function(step) { return step.unlocked; }) || importStepDefinitions[0];
    if (fallback.key !== importStep) setImportStep(fallback.key);
  }, [importStep, importContextReady, hasWorkbookColumns, hasValidationData, hasImportPreview, recordsReadyToConfirm]);

  function applyImportDefaults(overwrite) {
    var defaultFields = ['brandManufacturer','productLicenseName','owner','alertPolicy','providerDistributor'];
    setRecordEdits(function(prev) {
      var next = Object.assign({}, prev);
      importPreview.preview.forEach(function(item) {
        if (!item || item.moduleLabel === 'Review needed' || item.moduleLabel === 'Related Component') return;
        var rowNumber = item.rowNumber;
        var canonical = item.canonical || {};
        var existingEdit = next[rowNumber] || {};
        var rowEdit = Object.assign({}, existingEdit);
        defaultFields.forEach(function(key) {
          var defaultValue = importDefaults[key];
          if (!defaultValue) return;
          var currentValue = existingEdit[key] || canonical[key] || '';
          if (overwrite || !currentValue) rowEdit[key] = defaultValue;
        });
        next[rowNumber] = rowEdit;
      });
      return next;
    });
    setPreviewDrawerOpen(false);
    setPreviewSelectedRecord(null);
    setImportResult(null);
  }

  function confirmImport() {
    if (hasCriticalImportIssues) {
      setImportResult(null);
      return;
    }
    if (multiScopeMissingColumn) {
      // W1.5 defense-in-depth: even if the button is enabled by mistake,
      // never write multi-scope rows without resolved ownership.
      setImportResult(null);
      return;
    }
    if (hasPendingCoverageSuggestions) {
      // Coverage Import C4 defense-in-depth: never confirm while coverage
      // suggestions are pending. C5 will materialise approved / edited
      // suggestions into Coverage records; until then the gate stays.
      setImportResult(null);
      return;
    }
    var licenses = importPreview.records.licenses;
    var hardware = importPreview.records.hardware;
    var contracts = importPreview.records.contracts;
    if (!licenses.length && !hardware.length && !contracts.length) {
      setImportResult({ processed: rowObjects.length, licenses: 0, hardware: 0, contracts: 0, skipped: rowObjects.length, review: importPreview.stats.review, message: 'No records were ready to create.' });
      return;
    }
    // Coverage Import C5 — generate batch ID up-front so coverage records
    // can reference it (importBatchId in their meta) and the IMPORT_BATCH_STORE
    // snapshot can reuse the same ID. Previously generated inside
    // recordImportBatch() but C5 needs it earlier.
    var batchId = createImportBatchId();
    var licenseInsert = insertImportedRecords('licenses', licenses);
    var hardwareInsert = insertImportedRecords('hardware', hardware);
    var contractInsert = insertImportedRecords('contracts', contracts);
    // Coverage Import C5 — materialise approved / edited coverage decisions
    // into Coverage records linked to the just-created parent License/Hardware
    // records. Skipped + pending decisions produce nothing. Orphans (when
    // parent was dedup-skipped) are also suppressed by the helper. The
    // resulting coverages flow through the same insertImportedRecords pipeline
    // as contracts so cross-source dedup against existing RECORD_STORE.contracts
    // happens for free via meta.duplicateKeys. C4's pending-suggestion gate
    // already prevented confirm if any decision was still pending.
    var coverageRecords = buildCoverageRecordsForBatch({
      previewItems: importPreview.preview,
      decisions: coverageDecisions,
      licenseCreated: licenseInsert.created,
      hardwareCreated: hardwareInsert.created,
      batchId: batchId,
      fileName: fileName || '',
      workspaceMode: workspaceMode
    });
    var coverageInsert = coverageRecords.length
      ? insertImportedRecords('contracts', coverageRecords)
      : { created: [], duplicates: 0 };
    var coverageCount = coverageInsert.created.length;
    var coverageDuplicateCount = coverageInsert.duplicates;
    var createdRecords = licenseInsert.created.concat(hardwareInsert.created).concat(contractInsert.created).concat(coverageInsert.created);
    var duplicateCount = licenseInsert.duplicates + hardwareInsert.duplicates + contractInsert.duplicates + coverageDuplicateCount;
    var clientSync = ensureImportedClientRecords(createdRecords, workspaceMode);
    var coverageDescription = coverageCount > 0
      ? ' (incl ' + coverageCount + ' linked coverage record' + (coverageCount === 1 ? '' : 's') + ')'
      : '';
    addActivityEvent({
      eventType: 'import_completed',
      title: 'Import completed',
      description: fileName + ' created ' + createdRecords.length + ' first-class local Opriva records' + coverageDescription + ' and matched ' + clientSync.matched + ' clients/departments.',
      sourceModule: 'data-import',
      sourceRecordName: fileName,
      source: 'importSandbox',
      workspaceMode: workspaceMode,
    });
    createdRecords.forEach(function(record) {
      addActivityEvent({
        eventType: 'imported',
        title: 'Imported record',
        description: 'Imported from ' + fileName,
        sourceModule: record.meta && record.meta.moduleKey ? record.meta.moduleKey : record.id.split('-')[0],
        sourceRecordId: record.id,
        sourceRecordName: record.meta && record.meta.displayName ? record.meta.displayName : (record.row[0] || ''),
        source: 'importSandbox',
        relatedRecordId: 'data-import',
        workspaceMode: workspaceMode,
      });
    });
    setImportResult({
      processed: rowObjects.length,
      licenses: licenseInsert.created.length,
      hardware: hardwareInsert.created.length,
      contracts: contractInsert.created.length,
      coverages: coverageCount,
      clientsCreated: clientSync.created,
      clientsMatched: clientSync.matched,
      entitySummary: importPreview.entitySummary,
      skipped: importPreview.stats.skipped + duplicateCount,
      review: importPreview.stats.review,
      duplicates: duplicateCount,
      message: 'Imported records were added to the central local Opriva record store for this session. They can now be opened from relevant modules. Backend persistence is still required for corporate MVP. '
        + duplicateCount + ' duplicate-looking record' + (duplicateCount === 1 ? ' was' : 's were') + ' skipped.'
        + (coverageCount > 0 ? ' ' + coverageCount + ' linked coverage record' + (coverageCount === 1 ? ' was' : 's were') + ' created from approved suggestions.' : '')
    });
    // Append a session-only batch to IMPORT_BATCH_STORE for the Import
    // history panel. Backend will replace this with a persistent import job.
    // Reuses the batchId generated at the start so the snapshot matches the
    // importBatchId stamped on every coverage record (C5).
    recordImportBatch({
      batchId: batchId,
      timestamp: new Date().toISOString(),
      fileName: fileName || '',
      workspaceMode: workspaceMode,
      importContext: {
        scopeMode: (importContext && importContext.scopeMode) || 'single',
        clientAccount: (importContext && importContext.clientAccount) || '',
        departmentBusinessUnit: (importContext && importContext.departmentBusinessUnit) || '',
        purpose: (importContext && importContext.purpose) || '',
        targetModules: (importContext && Array.isArray(importContext.targetModules)) ? importContext.targetModules.slice() : []
      },
      totalRows: rowObjects.length,
      importedCount: createdRecords.length,
      coverageCount: coverageCount,
      skippedCount: (importPreview.stats.skipped || 0) + duplicateCount,
      criticalCount: importSeverityCounts.critical || 0,
      warningCount: importSeverityCounts.warning || 0,
      suggestionCount: importSeverityCounts.suggestion || 0,
      createdCount: createdRecords.length,
      duplicatesSkipped: duplicateCount,
      sourceType: sourceType,
      importTarget: importTarget
    });
    setImportBatchesVersion(function(version) { return version + 1; });
  }

  function getImportIssueStyle(severity) {
    if (severity === 'critical') return {border:'1px solid #FECACA',background:'#FEF2F2',color:'#991B1B'};
    if (severity === 'warning') return {border:'1px solid #FDE68A',background:'#FFFBEB',color:'#92400E'};
    return {border:'1px solid #DDE5EF',background:'#F8FAFC',color:'#475569'};
  }

  function getImportIssueLabel(severity) {
    if (severity === 'critical') return 'Critical';
    if (severity === 'warning') return 'Warning';
    return 'Suggestion';
  }

  // Local tone override for the Bulk Import preview status badge so each
  // status reads with the right severity colour:
  //   Blocked                -> critical (red)
  //   Needs review           -> medium   (yellow / warning)
  //   Ready with suggestions -> review   (blue / informational)
  //   Ready                  -> low      (green / ok)
  // Falls back to the row's status string so riskClass can keep handling any
  // future status value. Does not modify shared riskClass, the issue model,
  // hasCriticalIssues, confirm gating, parsing, mapping, preview, drawer or
  // RECORD_STORE behavior.
  function getImportRowStatusTone(status) {
    if (status === 'Blocked') return 'critical';
    if (status === 'Needs review') return 'medium';
    if (status === 'Ready with suggestions') return 'review';
    if (status === 'Ready') return 'low';
    return status;
  }

  function renderImportIssueBadges(item) {
    var rowIssues = item && item.issues ? item.issues : [];
    if (!rowIssues.length) return '-';
    return <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
      {rowIssues.slice(0, 3).map(function(issue, issueIndex) {
        var label = getImportIssueLabel(issue.severity);
        return <span key={(issue.code || 'issue') + issueIndex} style={Object.assign({display:'inline-flex',alignItems:'center',gap:4,borderRadius:999,padding:'4px 7px',fontSize:11,fontWeight:800,lineHeight:1.2}, getImportIssueStyle(issue.severity))} title={label + ': ' + issue.message} aria-label={label + ': ' + issue.message}>
          <strong style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</strong>
          <span>{issue.message}</span>
        </span>;
      })}
      {rowIssues.length > 3 && <span style={{fontSize:11,fontWeight:800,color:'#64748B'}}>+{rowIssues.length - 3} more</span>}
    </div>;
  }

  return <main className="content">
    {/* Suppress Floating AI auto-tooltips in Data Import only; keep the
        circular AI button reachable. Scoped to this screen because the
        agent's persistent text bubble was overlapping Continue buttons
        and table action cells during the bulk import workflow. */}
    <style>{`.agentWrap .agentTip,.floatingAgentWrap .agentNudge{display:none!important}`}</style>
    <ScreenHeader active="Data Import" subtitle="Map vendor exports into canonical Opriva records." />
    <section className="panel" aria-label="Bulk import workflow stepper" style={{display:'grid',gap:12,padding:'14px'}}>
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <span style={{border:'1px solid #E2E8F0',borderRadius:999,padding:'5px 9px',background:'#F8FAFC',fontSize:11,fontWeight:850,color:'#475569'}} aria-live="polite">
          Step {importStepDefinitions.findIndex(function(s) { return s.key === currentImportStep.key; }) + 1} of {importStepDefinitions.length}
        </span>
      </div>
      <div className="wizardSteps" role="list" aria-label="Bulk import steps" style={{gridTemplateColumns:'repeat(6,minmax(132px,1fr))',marginBottom:0}}>
        {importStepDefinitions.map(function(step, index) {
          var active = currentImportStep.key === step.key;
          var status = step.complete ? 'Complete' : step.unlocked ? 'Available' : 'Locked';
          return <button
            key={step.key}
            type="button"
            role="listitem"
            className={cx('wizardStep', step.complete && 'done', active && 'active')}
            disabled={!step.unlocked}
            aria-current={active ? 'step' : undefined}
            aria-describedby="import-step-status"
            title={step.unlocked ? step.helper : 'Locked: ' + step.helper}
            onClick={function() { selectImportStep(step.key); }}
            style={{textAlign:'left',cursor:step.unlocked ? 'pointer' : 'not-allowed',opacity:step.unlocked ? 1 : .58}}
          >
            <strong>{index + 1}</strong>
            <span>{step.label}</span>
            <em style={{fontStyle:'normal',fontSize:11,fontWeight:750,color:active ? '#1D4ED8' : '#64748B'}}>{status}</em>
          </button>;
        })}
      </div>
      <div id="import-step-status" className="miniState" role="status" style={{marginTop:0}}>
        Current step: {currentImportStep.label}. {currentImportStep.helper}
      </div>
    </section>
    {showImportStep('context') && <section className="panel" aria-labelledby="import-context-title" style={{display:'grid',gap:14,borderColor:'#E2E8F0',background:'#fff'}}>
      <div className="panelTitle" style={{margin:0,alignItems:'flex-start'}}>
        <div>
          <h2 id="import-context-title">Import Context</h2>
          <span>{isInternalIT ? 'Set the scope before uploading internal IT renewal data.' : 'Set the scope before uploading MSP or integrator renewal data.'}</span>
        </div>
        <span style={{border:'1px solid #E2E8F0',borderRadius:999,padding:'5px 9px',background:'#F8FAFC',fontSize:11,fontWeight:850,color:'#475569'}}>
          Step 1 · Context
        </span>
      </div>
      <div style={{display:'grid',gap:8}}>
        <span style={{fontSize:11,fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'.06em'}}>Import scope</span>
        <div role="radiogroup" aria-label="Import scope mode" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:10}}>
          {importScopeModeOptions.map(function(opt) {
            var active = importContextScopeMode === opt.key;
            return <label key={opt.key} style={{display:'grid',gap:4,border:'1px solid ' + (active ? '#0D9488' : '#DDE5EF'),borderRadius:12,padding:'12px 14px',background:active ? '#F0FDFA' : '#fff',color:active ? '#0F766E' : '#334155',cursor:'pointer',boxShadow:active ? '0 0 0 2px rgba(13,148,136,0.08)' : 'none'}}>
              <span style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="radio" name="importScopeMode" value={opt.key} checked={active} onChange={function() { updateImportContext('scopeMode', opt.key); }} style={{accentColor:'#0D9488',margin:0}} />
                <strong style={{fontSize:13,fontWeight:800,color:active ? '#0F766E' : '#0B1F3A'}}>{opt.label}</strong>
              </span>
              <span style={{fontSize:12,color:active ? '#0F766E' : '#475569',lineHeight:1.45,marginLeft:24}}>{opt.description}</span>
            </label>;
          })}
        </div>
      </div>
      {isMultiScope
        ? <div style={{display:'grid',gap:12}}>
            <div style={{border:'1px solid #DDE5EF',borderRadius:10,padding:'12px 14px',background:'#F8FAFC',display:'grid',gap:6}}>
              <strong style={{fontSize:12,fontWeight:850,color:'#0B1F3A'}}>{isInternalIT ? 'Departments come from the file' : 'Clients come from the file'}</strong>
              <span style={{fontSize:12,color:'#475569',lineHeight:1.5,maxWidth:760}}>{isInternalIT
                ? 'Departments come from the file. Map Department / Business Unit, Owner or Location columns during Mapping when available. Other catalog columns such as Brand, Product, Provider and PO can also be mapped. Rows that cannot resolve required ownership will be Blocked.'
                : 'Clients come from the file. Map a Client / Account column during Mapping so Opriva can assign each row correctly. Other catalog columns such as Brand, Product, Provider and PO can also be mapped. Rows that cannot resolve a client will be Blocked.'}</span>
            </div>
            <label style={{display:'grid',gap:5,fontSize:11,fontWeight:700,color:'#64748B'}}>
              <span>Purpose <span style={{fontWeight:500,color:'#94A3B8'}}>(optional)</span></span>
              <input
                type="text"
                value={importContext.purpose}
                onChange={function(e) { updateImportContext('purpose', e.target.value); }}
                placeholder={isInternalIT ? 'e.g. Q3 renewal register cleanup' : 'e.g. Client renewal portfolio upload'}
                style={{border:'1px solid #DDE5EF',borderRadius:10,padding:'10px 11px',background:'#fff',color:'#132033',fontWeight:500,fontSize:13}}
              />
            </label>
          </div>
        : <div style={{display:'grid',gridTemplateColumns:'minmax(240px,1.4fr) minmax(220px,1fr)',gap:12,alignItems:'start'}}>
            <label style={{display:'grid',gap:5,fontSize:12,fontWeight:850,color:'#475569'}}>
              <span>{importContextScopeLabel}<abbr title="Required" style={{color:'#B91C1C',textDecoration:'none',marginLeft:2}}>*</abbr></span>
              <select
                aria-required="true"
                value={importContextScopeValue}
                onChange={function(e) { updateImportContext(isInternalIT ? 'departmentBusinessUnit' : 'clientAccount', e.target.value); }}
                style={{border:'1px solid #DDE5EF',borderRadius:10,padding:'10px 11px',background:'#fff',color:importContextScopeValue ? '#132033' : '#64748B',fontWeight:750}}
              >
                <option value="">Select {isInternalIT ? 'department / business unit' : 'client / account'}...</option>
                {importContextScopeOptions.map(function(option) { return <option key={option} value={option}>{option}</option>; })}
              </select>
            </label>
            <label style={{display:'grid',gap:5,fontSize:11,fontWeight:700,color:'#64748B'}}>
              <span>Purpose <span style={{fontWeight:500,color:'#94A3B8'}}>(optional)</span></span>
              <input
                type="text"
                value={importContext.purpose}
                onChange={function(e) { updateImportContext('purpose', e.target.value); }}
                placeholder={isInternalIT ? 'e.g. Q3 renewal register cleanup' : 'e.g. Client renewal portfolio upload'}
                style={{border:'1px solid #DDE5EF',borderRadius:10,padding:'10px 11px',background:'#fff',color:'#132033',fontWeight:500,fontSize:13}}
              />
            </label>
          </div>}
      <div role="group" aria-labelledby="import-target-modules-label" style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
        <span id="import-target-modules-label" style={{fontSize:11,fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'.06em',marginRight:4}}>Records to create</span>
        {importContextTargetModules.map(function(moduleName) {
          var checked = (importContext.targetModules || []).indexOf(moduleName) >= 0;
          return <label key={moduleName} style={{display:'inline-flex',alignItems:'center',gap:5,border:'1px solid ' + (checked ? '#0D9488' : '#E2E8F0'),borderRadius:999,padding:'4px 10px',background:checked ? '#F0FDFA' : '#fff',color:checked ? '#0F766E' : '#475569',fontSize:12,fontWeight:700,cursor:'pointer'}}>
            <input type="checkbox" checked={checked} onChange={function() { toggleImportTargetModule(moduleName); }} style={{accentColor:'#0D9488',margin:0}} />
            <span>{moduleName}</span>
          </label>;
        })}
      </div>
      <div style={{borderTop:'1px solid #EEF2F7',paddingTop:12,display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0,flex:'1 1 auto',flexWrap:'wrap'}}>
          <span role="status" aria-live="polite" style={{border:'1px solid ' + (importContextReady ? '#BBF7D0' : '#FDE68A'),borderRadius:999,padding:'5px 9px',background:importContextReady ? '#F0FDF4' : '#FFFBEB',fontSize:12,fontWeight:800,color:importContextReady ? '#15803D' : '#92400E'}}>
            {importContextReady ? 'Context ready' : 'Context required'}
          </span>
          <span style={{fontSize:12,color:'#64748B',lineHeight:1.45}}>
            {importContextReady
              ? (isMultiScope
                ? (isInternalIT ? 'Multi-department file' : 'Multi-client file')
                : (isInternalIT ? '→ ' + importContext.departmentBusinessUnit : '→ ' + importContext.clientAccount)
              ) + (importContext.purpose ? ' · Purpose: ' + importContext.purpose : '')
              : importContextDisabledMessage}
          </span>
        </div>
        <button type="button" className="primary" disabled={!importContextReady} title={importContextReady ? 'Continue to upload' : importContextDisabledMessage} onClick={function() { selectImportStep('upload'); }}>
          Continue to Upload
        </button>
      </div>
    </section>}
    {showImportStep('upload') && <section className="panel" style={{display:'grid',gap:12,padding:'12px 14px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0,flex:'1 1 320px'}}>
        {fileName
          ? <>
              <span style={{fontSize:11,fontWeight:800,color:'#64748B',textTransform:'uppercase',letterSpacing:'.06em'}}>Workbook</span>
              <strong style={{fontSize:13,color:'#132033',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',minWidth:0,flex:'1 1 auto'}} title={fileName}>{fileName}</strong>
            </>
          : <span style={{fontSize:13,color:'#526174',lineHeight:1.5}}>Upload any vendor, client or internal Excel file — or use the official Opriva template. Opriva maps columns into canonical records and previews them before creation.</span>
        }
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
        <a href={templateHref} download={templateDownloadName} aria-label={templateButtonLabel} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',textDecoration:'none',border:'1px solid var(--border)',background:'#fff',color:'#243247',borderRadius:10,padding:'8px 12px',fontWeight:700,fontSize:12}}>{templateButtonLabel}</a>
        <a href={canonicalTemplateHref} download={canonicalTemplateDownloadName} aria-label="Download advanced canonical template" title="Full canonical model for expert users or Hybrid workspaces" style={{display:'inline-flex',alignItems:'center',textDecoration:'none',color:'#64748B',fontWeight:600,fontSize:11,padding:'4px 6px'}}>Advanced Canonical Template</a>
        <label
          className="primary"
          htmlFor="opriva-import-file-input"
          role="button"
          tabIndex={importContextReady ? 0 : -1}
          aria-disabled={!importContextReady}
          title={importContextReady ? 'Upload Excel workbook' : importContextDisabledMessage}
          onKeyDown={function(e) {
            if (!importContextReady) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              var input = document.getElementById('opriva-import-file-input');
              if (input) input.click();
            }
          }}
          style={{display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:10,padding:'8px 12px',fontWeight:700,fontSize:12,cursor:importContextReady ? 'pointer' : 'not-allowed',opacity:importContextReady ? 1 : .58}}
        >
          {fileName ? 'Replace file' : 'Upload Excel'}
          <input id="opriva-import-file-input" type="file" disabled={!importContextReady} accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleExcelUpload} style={{display:'none'}} />
        </label>
      </div>
      </div>
      {importError && <ErrorState title="Excel import failed" message={importError} />}
      {fileName && <div style={{display:'flex',justifyContent:'flex-end',borderTop:'1px solid #EEF2F7',paddingTop:10}}>
        <button type="button" className="primary" onClick={function() { selectImportStep('mapping'); }}>Continue to Mapping</button>
      </div>}
    </section>}
    {['mapping','validation','preview','confirm'].indexOf(currentImportStep.key) >= 0 && <section className="panel" aria-label="Local import sandbox" style={{display:'grid',gap:14}}>
      {importError && <ErrorState title="Excel import failed" message={importError} />}
      {(showImportStep('validation') || showImportStep('preview') || showImportStep('confirm')) && <div style={{position:'sticky',top:12,zIndex:3,border:'1px solid #CDEDE5',borderRadius:14,background:'#F8FFFD',boxShadow:'0 10px 24px rgba(15, 118, 110, .08)',padding:'14px',display:'grid',gap:12}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
          <div>
            <strong style={{display:'block',fontSize:15,color:'#0B1F3A',marginBottom:3}}>Import Summary</strong>
            <span style={{display:'block',fontSize:12,color:'#64748B',lineHeight:1.45}}>This summary updates as Opriva detects source, mappings, entities and review needs.</span>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}>
            <span style={{border:'1px solid #CDEDE5',borderRadius:999,padding:'5px 9px',background:'#fff',fontSize:11,fontWeight:800,color:'#0F766E'}}>Local sandbox</span>
            <span style={{border:'1px solid #E2E8F0',borderRadius:999,padding:'5px 9px',background:'#fff',fontSize:11,fontWeight:800,color:'#334155'}}>
              {isInternalIT ? 'Importing into: ' + (importContext.departmentBusinessUnit || 'Department not selected') : 'Importing into: ' + (importContext.clientAccount || 'Client not selected')}
            </span>
            {importContext.purpose && <span style={{border:'1px solid #E2E8F0',borderRadius:999,padding:'5px 9px',background:'#fff',fontSize:11,fontWeight:800,color:'#334155'}}>Purpose: {importContext.purpose}</span>}
          </div>
        </div>
        <div role="group" aria-label="Import summary metrics" style={{display:'flex',flexWrap:'wrap',alignItems:'baseline',gap:'8px 22px',border:'1px solid #DDE5EF',borderRadius:10,background:'#fff',padding:'10px 14px'}}>
          {[
            ['Source', sourceType === 'No file loaded' ? '—' : sourceType],
            ['Target', importTarget || '—'],
            ['Rows', String(rowObjects.length)],
            ['Records', String((importPreview.entitySummary && importPreview.entitySummary.recordsToCreate) || 0)],
            ['Ready', String(importPreview.stats.ready || 0)],
            ['Critical', String(importSeverityCounts.critical || 0)],
            ['Warnings', String(importSeverityCounts.warning || 0)],
            ['Suggestions', String(importSeverityCounts.suggestion || 0)]
          ].map(function(item) {
            return <span key={'summary-bar-' + item[0]} style={{display:'inline-flex',alignItems:'baseline',gap:6,minWidth:0,maxWidth:'100%'}}>
              <span style={{fontSize:10,fontWeight:850,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.06em'}}>{item[0]}</span>
              <strong style={{fontSize:13,fontVariantNumeric:'tabular-nums',color:'#132033',lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}} title={String(item[1])}>{item[1]}</strong>
            </span>;
          })}
        </div>
        <details style={{border:'1px solid #DDE5EF',borderRadius:10,background:'#fff'}}>
          <summary style={{cursor:'pointer',padding:'8px 12px',fontSize:12,fontWeight:700,color:'#475569',userSelect:'none'}}>Detected entities</summary>
          <div style={{padding:'8px 12px 10px',borderTop:'1px solid #EEF2F7',display:'flex',gap:8,flexWrap:'wrap'}}>
            {importSummaryEntities.map(function(item) {
              return <span key={'summary-entity-' + item[0]} style={{fontSize:12,fontWeight:750,color:'#475569',border:'1px solid #E2E8F0',background:'#fff',borderRadius:999,padding:'5px 9px'}}>{item[0]}: {item[1]}</span>;
            })}
          </div>
        </details>
      </div>}
      {headers.length > 0 && !importContextReady && <div className="miniState" role="status">
        {importContextDisabledMessage || 'Complete import context before continuing with mapping and preview.'}
      </div>}
      {showImportStep('mapping') && importContextReady && headers.length > 0 && <div style={{border:'1px solid #DDEFEA',borderRadius:12,background:'#F6FEFC',padding:'12px 14px',display:'grid',gap:10}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
          <div style={{minWidth:220,flex:'1 1 320px'}}>
            <strong style={{display:'block',fontSize:14,color:'#0B1F3A',marginBottom:4}}>Records to create</strong>
            <span style={{display:'block',fontSize:12,color:'#64748B',lineHeight:1.45}}>Opriva detected the file type, but you choose what records will be created. Assets & Renewals will include any created record with a renewal, expiration, warranty, support, certificate or contract date.</span>
          </div>
          <div style={{display:'grid',gap:5,flex:'0 1 320px'}}>
            <label style={{fontSize:11,fontWeight:800,color:'#64748B',textTransform:'uppercase',letterSpacing:'.06em'}}>Records to create</label>
            <select value={importTarget} onChange={handleImportTargetChange} style={{border:'1px solid #CDEDE5',borderRadius:10,padding:'9px 10px',fontWeight:750,color:'#132033',background:'#fff'}}>
              {IMPORT_TARGET_OPTIONS.map(function(target) { return <option key={target} value={target}>{target}</option>; })}
            </select>
            <span style={{fontSize:11,color:'#64748B'}}>Detected source is informational: {sourceType}. Suggested records: {suggestedImportTarget}. Workspace mode: {workspaceMode}.</span>
          </div>
        </div>
      </div>}
      {showImportStep('mapping') && importContextReady && sheetNames.length > 1 && <div style={{display:'flex',alignItems:'center',gap:10}}>
        <label style={{fontSize:12,fontWeight:800,color:'#64748B'}}>Choose sheet</label>
        <select value={selectedSheet} onChange={handleSheetChange} style={{border:'1px solid #DDE5EF',borderRadius:10,padding:'8px 10px',fontWeight:700,color:'#132033',background:'#fff'}}>
          {sheetNames.map(function(name) { return <option key={name} value={name}>{name}</option>; })}
        </select>
      </div>}
      {showImportStep('mapping') && importContextReady && multiScopeMissingColumn && <div role="alert" style={{border:'1px solid #FECACA',background:'#FEF2F2',borderRadius:12,padding:'10px 12px',display:'grid',gap:4}}>
        <strong style={{fontSize:13,fontWeight:850,color:'#991B1B'}}>{isInternalIT ? 'Department / Business Unit column required' : 'Client / Account column required'}</strong>
        <span style={{fontSize:12,color:'#7F1D1D',lineHeight:1.45}}>{multiScopeMissingColumnMessage} Confirm Import stays blocked until a column is mapped.</span>
      </div>}
      {showImportStep('mapping') && importContextReady && hasCoverageRelatedMappings && <div role="note" style={{border:'1px solid #FDE68A',background:'#FFFBEB',borderRadius:10,padding:'8px 12px',display:'flex',alignItems:'flex-start',gap:8,fontSize:12,lineHeight:1.45,color:'#92400E'}}>
        <strong style={{fontWeight:850}}>Coverage-related columns detected.</strong>
        <span>Opriva can map warranty/support data for review.</span>
      </div>}
      {showImportStep('mapping') && importContextReady && headers.length > 0 && <div className="tableWrap">
        <table>
          <thead><tr>{['Source Column','Suggested Opriva Field','Action','Sample Value'].map(function(col) { return <th key={col}>{col}</th>; })}</tr></thead>
          <tbody>
            {mappings.map(function(mapping, index) {
              return <tr key={mapping.sourceColumn + index}>
                  <td className="recordCell">{mapping.sourceColumn}<br/><span style={{fontSize:11,color:'#94A3B8',fontWeight:500}}>{mapping.reason}{mapping.confidence ? ' · ' + mapping.confidence + ' confidence' : ''}</span></td>
                <td>
                  <select value={mapping.suggestedField} onChange={function(e) { updateMapping(index, 'suggestedField', e.target.value); }} style={{width:'100%',border:'1px solid #DDE5EF',borderRadius:8,padding:'7px 8px',background:'#fff',fontWeight:650,color:'#132033'}}>
                    <option value="">No target</option>
                    {IMPORT_CANONICAL_FIELDS.map(function(field) { return <option key={field} value={field}>{field}</option>; })}
                  </select>
                </td>
                <td>
                  <select value={mapping.action} onChange={function(e) { updateMapping(index, 'action', e.target.value); }} style={{border:'1px solid #DDE5EF',borderRadius:8,padding:'7px 8px',background:'#fff',fontWeight:650,color:'#132033'}}>
                    {['Import','Skip','Review'].map(function(action) { return <option key={action} value={action}>{action}</option>; })}
                  </select>
                </td>
                <td style={{maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={mapping.sampleValue}>{mapping.sampleValue || '-'}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>}
      {showImportStep('mapping') && importContextReady && unmappedColumns.length > 0 && <details style={{border:'1px solid #F1E3C8',borderRadius:12,background:'#FFFDF7'}}>
        <summary style={{cursor:'pointer',padding:'10px 14px',fontSize:13,fontWeight:700,color:'#7C5A12',userSelect:'none'}}>View unmapped / skipped columns ({unmappedColumns.length})</summary>
        <div style={{padding:'0 14px 12px',display:'grid',gap:10}}>
          <span style={{display:'block',fontSize:12,color:'#64748B',lineHeight:1.45}}>Opriva will not blindly import these columns. Map them to a canonical field, map useful context to Notes, or keep them skipped.</span>
          <div className="tableWrap">
            <table>
              <thead><tr>{['Source Column','Action','Sample Value'].map(function(col) { return <th key={col}>{col}</th>; })}</tr></thead>
              <tbody>
                {unmappedColumns.slice(0, 8).map(function(mapping) {
                  return <tr key={'unmapped-' + mapping.sourceColumn}>
                    <td className="recordCell">{mapping.sourceColumn}</td>
                    <td>{mapping.action === 'Skip' ? 'Skipped' : 'No target'}</td>
                    <td style={{maxWidth:280,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={mapping.sampleValue}>{mapping.sampleValue || '-'}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      </details>}
      {showImportStep('mapping') && hasValidationData && <div style={{display:'flex',justifyContent:'flex-end',borderTop:'1px solid #EEF2F7',paddingTop:10}}>
        <button type="button" className="primary" onClick={function() { selectImportStep('validation'); }}>Continue to Validation</button>
      </div>}
      {showImportStep('validation') && hasValidationData && <div style={{display:'grid',gap:12}}>
        <div className="panelTitle" style={{margin:0}}><h2>Validation checks</h2><span>Review current import signals before moving into row preview.</span></div>
        <ValidationPanel workspaceMode={workspaceMode} issueCounts={importSeverityCounts} confirmBlocked={hasCriticalImportIssues} />
        <div style={{display:'flex',justifyContent:'flex-end',borderTop:'1px solid #EEF2F7',paddingTop:10}}>
          <button type="button" className="primary" onClick={function() { selectImportStep('preview'); }}>Continue to Preview</button>
        </div>
      </div>}
      {(showImportStep('preview') || showImportStep('confirm')) && importContextReady && rowObjects.length > 0 && <div style={{display:'grid',gap:12}}>
        <details style={{border:'1px solid #DDEFEA',borderRadius:12,background:'#F8FFFD'}}>
          <summary style={{cursor:'pointer',padding:'10px 14px',fontSize:13,fontWeight:700,color:'#0F766E',userSelect:'none',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <span>Apply bulk defaults</span>
            <span style={{border:'1px solid #CDEDE5',borderRadius:999,padding:'3px 8px',fontSize:11,fontWeight:800,color:'#0F766E',background:'#fff'}}>Records: {importTarget}</span>
          </summary>
          <div style={{padding:'0 14px 14px',display:'grid',gap:12}}>
            <span style={{display:'block',fontSize:12,color:'#64748B',lineHeight:1.45}}>Use defaults to enrich many imported records at once. You can still review individual rows when something needs correction.</span>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(0,1fr))',gap:10}}>
              {[
                ['brandManufacturer','Brand / Manufacturer'],
                ['productLicenseName','Product / License Name'],
                ['providerDistributor','Distributor / Provider'],
                ['owner','Owner']
              ].map(function(field) {
                return <label key={field[0]} style={{display:'grid',gap:4,fontSize:12,fontWeight:800,color:'#64748B'}}>
                  {field[1]}
                  <input value={importDefaults[field[0]] || ''} onChange={function(e) { updateImportDefault(field[0], e.target.value); }} style={{border:'1px solid #DDE5EF',borderRadius:8,padding:'8px 9px',background:'#fff',color:'#132033',fontWeight:650}} />
                </label>;
              })}
              <label style={{display:'grid',gap:4,fontSize:12,fontWeight:800,color:'#64748B'}}>
                Alert Policy
                <select value={importDefaults.alertPolicy || 'Workspace default'} onChange={function(e) { updateImportDefault('alertPolicy', e.target.value); }} style={{border:'1px solid #DDE5EF',borderRadius:8,padding:'8px 9px',background:'#fff',color:'#132033',fontWeight:650}}>
                  {LICENSE_ALERT_POLICY_OPTIONS.map(function(opt) { return <option key={opt} value={opt}>{opt}</option>; })}
                </select>
              </label>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button type="button" className="primary" onClick={function() { applyImportDefaults(false); }}>Apply defaults to rows missing these values</button>
              <button type="button" onClick={function() { applyImportDefaults(true); }}>Apply defaults to all rows</button>
            </div>
          </div>
        </details>
        <div className="panelTitle" style={{margin:0}}><h2>Review & enrich records</h2><span>Review normalized records before creation. Improve mappings above when brand, product, client or commercial context is missing.</span></div>
        <p style={{margin:0,color:'#64748B',fontSize:13,lineHeight:1.5}}>Review how Opriva will create these records. You can adjust mappings or enrich missing fields before importing.</p>
        {importPreview.generalWarnings.length > 0 && <div style={{border:'1px solid #F1E3C8',background:'#FFFDF7',borderRadius:10,padding:'10px 12px',fontSize:12,color:'#7C5A12',lineHeight:1.45}}>
          {importPreview.generalWarnings[0]}
        </div>}
        <div role="toolbar" aria-label="Filter preview rows by status or severity" style={{display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}}>
          {importPreviewFilterDefinitions.map(function(filter) {
            var isActive = importPreviewFilter === filter.key;
            return <button
              key={filter.key}
              type="button"
              onClick={function() { setImportPreviewFilter(filter.key); }}
              aria-pressed={isActive}
              title={isActive ? filter.label + ' filter active' : 'Filter rows by ' + filter.label}
              style={{
                border: '1px solid ' + (isActive ? '#0D9488' : '#DDE5EF'),
                background: isActive ? '#0D9488' : '#fff',
                color: isActive ? '#fff' : '#475569',
                borderRadius: 999,
                padding: '5px 11px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                lineHeight: 1.2
              }}>
              <span>{filter.label}</span>
              <span style={{marginLeft:5,fontWeight:800,opacity: isActive ? 0.95 : 0.7}}>({filter.count})</span>
            </button>;
          })}
        </div>
        {filteredPreviewItems.length === 0 && (importPreview.preview || []).length > 0 && <div role="status" style={{padding:'12px 14px',background:'#F8FAFC',border:'1px dashed #DDE5EF',borderRadius:10,color:'#64748B',fontSize:13,lineHeight:1.5,display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <span>No rows match the &ldquo;{activeImportPreviewFilter ? activeImportPreviewFilter.label : 'selected'}&rdquo; filter. {(importPreview.preview || []).length} parsed rows are still being processed and exported on Confirm.</span>
          <button type="button" onClick={function() { setImportPreviewFilter('all'); }} style={{border:'1px solid #DDE5EF',background:'#fff',borderRadius:8,padding:'5px 10px',fontSize:12,fontWeight:700,color:'#0F766E',cursor:'pointer'}}>Show all rows</button>
        </div>}
        {filteredPreviewItems.length > 0 && <div className="tableWrap">
          <table>
            <thead><tr>{['Status','Record preview','Client / Department','Brand / Product','Expiration','Target module','Issues','Action'].map(function(col) { return <th key={col}>{col}</th>; })}</tr></thead>
            <tbody>
              {filteredPreviewItems.slice(0, 12).map(function(item) {
                return <tr key={'preview-' + item.rowNumber}>
                  <td><Badge tone={getImportRowStatusTone(item.status)}>{item.status}</Badge></td>
                  <td className="recordCell"><strong>{item.name}</strong><br/><span style={{fontSize:11,color:'#64748B',fontWeight:600}}>{item.createdRecords.join(' + ')}</span></td>
                  <td>{item.clientDepartment || '-'}</td>
                  <td>{item.brandProduct || '-'}</td>
                  <td>{item.expiration || '-'}</td>
                  <td>{item.moduleLabel}</td>
                  <td>
                    {renderImportIssueBadges(item)}
                    {item.suggestedCoverages && item.suggestedCoverages.length > 0 && <span
                      title="Open Review to see warranty/support/maintenance suggestions"
                      aria-label={'Open Review to see ' + item.suggestedCoverages.length + ' coverage suggestion' + (item.suggestedCoverages.length === 1 ? '' : 's')}
                      style={{display:'inline-flex',alignItems:'center',marginLeft:6,border:'1px solid #FDE68A',background:'#FFFBEB',color:'#92400E',borderRadius:999,padding:'2px 8px',fontSize:11,fontWeight:700,lineHeight:1.2,verticalAlign:'middle'}}
                    >+{item.suggestedCoverages.length} coverage{item.suggestedCoverages.length === 1 ? '' : 's'}</span>}
                  </td>
                  <td className="actionCell"><button type="button" className="rowAction" onClick={function() { openImportReviewDrawer(item); }}>Review</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>}
        {filteredPreviewItems.length > 0 && (filteredPreviewItems.length > 12 || importPreviewFilter !== 'all') && <p style={{margin:0,fontSize:12,color:'#64748B',lineHeight:1.45}}>
          {filteredPreviewItems.length > 12
            ? 'Showing first 12 of ' + filteredPreviewItems.length + ' matching rows'
            : 'Showing ' + filteredPreviewItems.length + ' matching row' + (filteredPreviewItems.length === 1 ? '' : 's')}
          {importPreviewFilter !== 'all' ? ' (' + (importPreview.preview || []).length + ' total parsed)' : ''}
          . All {(importPreview.preview || []).length} parsed rows are processed; Confirm Import is not affected by this filter. Open Review on any row to inspect it.
        </p>}
        <button type="button" onClick={function() { setRawDetailsOpen(function(value) { return !value; }); }} style={{justifySelf:'start'}}>View raw row details</button>
        {rawDetailsOpen && <div className="tableWrap">
          <table>
            <thead><tr>{['Row','Source columns','Skipped / unmapped'].map(function(col) { return <th key={col}>{col}</th>; })}</tr></thead>
            <tbody>{importPreview.preview.slice(0, 8).map(function(item, index) {
              return <tr key={'raw-' + item.rowNumber}>
                <td>{item.rowNumber}</td>
                <td style={{maxWidth:420,whiteSpace:'normal'}}>{Object.keys(rowObjects[index] || {}).join(', ')}</td>
                <td style={{maxWidth:320,whiteSpace:'normal'}}>{unmappedColumns.map(function(col) { return col.sourceColumn; }).join(', ') || '-'}</td>
              </tr>;
            })}</tbody>
          </table>
          {importPreview.preview.length > 8 && <p style={{margin:'8px 0 0',fontSize:12,color:'#64748B',lineHeight:1.45}}>Showing first 8 of {importPreview.preview.length} rows.</p>}
        </div>}
        {showImportStep('confirm') && hasCriticalImportIssues && <div className="miniState errorState" role="alert">
          {confirmBlockedMessage} Critical errors include missing required names, client/department scope, or renewal dates that prevent safe record creation.
        </div>}
        {showImportStep('confirm') && !hasCriticalImportIssues && !multiScopeMissingColumn && hasPendingCoverageSuggestions && <div className="miniState errorState" role="alert">
          <strong>Coverage suggestions need review.</strong>{' '}
          <span>{pendingCoverageMessage} Open each Review drawer to Approve, Edit or Skip per suggestion.</span>
        </div>}
        {showImportStep('confirm') && !hasCriticalImportIssues && multiScopeMissingColumn && <div className="miniState errorState" role="alert">
          {multiScopeMissingColumnMessage}
        </div>}
        {showImportStep('confirm') && warningContinueMessage && <div className="miniState" role="status">
          {warningContinueMessage}
        </div>}
        {showImportStep('preview') && recordsReadyToConfirm && <div style={{display:'flex',justifyContent:'flex-end',borderTop:'1px solid #EEF2F7',paddingTop:10}}>
          <button type="button" className="primary" onClick={function() { selectImportStep('confirm'); }}>Continue to Confirm</button>
        </div>}
        {showImportStep('confirm') && <button className="primary" type="button" onClick={confirmImport} disabled={!canConfirmImport} title={canConfirmImport ? 'Create records in the local session' : (confirmBlockedMessage || 'No records are ready to confirm yet')} style={{justifySelf:'start'}}>Confirm import to local session</button>}
        {importResult && <div className="miniState successState" role="status">
          {importResult.message} Records created: {(importResult.licenses || 0) + (importResult.hardware || 0) + (importResult.contracts || 0)}; clients created/matched: {importResult.clientsCreated || 0}/{importResult.clientsMatched || 0}; licenses created: {importResult.licenses}; contracts/support coverage created: {importResult.contracts}; contacts reviewed/not auto-created: {importResult.entitySummary && importResult.entitySummary.contacts ? importResult.entitySummary.contacts.review : 0}; relationships staged: {importResult.entitySummary ? importResult.entitySummary.relationshipsToCreate : 0}; records needing review: {importResult.review}; duplicates skipped: {importResult.duplicates || 0}.
        </div>}
      </div>}
    </section>}
    <details style={{border:'1px solid var(--border)',borderRadius:14,background:'#fff',boxShadow:'0 6px 16px rgba(15,35,65,.025)'}}>
      <summary style={{cursor:'pointer',padding:'12px 16px',fontSize:13,fontWeight:700,color:'#475569',userSelect:'none',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
        <span>Recent imports{sessionImportBatches.length > 0 ? ' (' + sessionImportBatches.length + ' this session)' : ''}</span>
        <span style={{fontSize:11,fontWeight:800,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.06em'}}>{sessionImportBatches.length > 0 ? 'Session data' : 'Sample data'}</span>
      </summary>
      <div style={{padding:'0 16px 14px',display:'grid',gap:10}}>
        {sessionImportBatches.length > 0 ? <div className="tableWrap">
          <table>
            <thead><tr>{['Batch','File','Context','Rows','Imported','Severity','Status','Action'].map(function(col) { return <th key={col}>{col}</th>; })}</tr></thead>
            <tbody>
              {sessionImportBatches.map(function(batch) {
                var batchIsIT = batch.workspaceMode === 'Internal IT';
                var batchScopeMode = (batch.importContext && batch.importContext.scopeMode) || 'single';
                var contextScope = batchScopeMode === 'multi'
                  ? (batchIsIT ? 'Multi-department file' : 'Multi-client file')
                  : (batchIsIT
                    ? (batch.importContext && batch.importContext.departmentBusinessUnit ? batch.importContext.departmentBusinessUnit : '-')
                    : (batch.importContext && batch.importContext.clientAccount ? batch.importContext.clientAccount : '-'));
                var purpose = batch.importContext && batch.importContext.purpose ? batch.importContext.purpose : '';
                var batchTime = (function() { try { return new Date(batch.timestamp).toLocaleString(); } catch (err) { return batch.timestamp || ''; } })();
                var statusLabel = (batch.criticalCount || 0) > 0
                  ? 'Confirmed with critical context'
                  : (batch.warningCount || 0) > 0
                    ? 'Confirmed with warnings'
                    : 'Confirmed';
                var statusTone = (batch.criticalCount || 0) > 0
                  ? 'high'
                  : (batch.warningCount || 0) > 0
                    ? 'medium'
                    : 'low';
                return <tr key={batch.batchId}>
                  <td className="recordCell">
                    <strong>{batchTime}</strong>
                    <br/>
                    <span style={{fontSize:11,color:'#64748B',fontWeight:600}}>
                      {batch.batchId}
                      {batch.sourceType && batch.sourceType !== 'No file loaded' ? ' · ' + batch.sourceType : ''}
                      {batch.importTarget ? ' · ' + batch.importTarget : ''}
                    </span>
                  </td>
                  <td>{batch.fileName || '-'}</td>
                  <td>
                    {contextScope}
                    {purpose ? <><br/><span style={{fontSize:11,color:'#64748B',fontWeight:600}}>{purpose}</span></> : null}
                  </td>
                  <td>{batch.totalRows || 0}</td>
                  <td>{(batch.importedCount || 0) + ' created · ' + (batch.skippedCount || 0) + ' skipped' + ((batch.coverageCount || 0) > 0 ? ' · +' + batch.coverageCount + ' coverage' + (batch.coverageCount === 1 ? '' : 's') : '')}</td>
                  <td>
                    <span style={{fontSize:11,fontWeight:800,color:'#475569'}}>
                      {(batch.criticalCount || 0)} critical · {(batch.warningCount || 0)} warn · {(batch.suggestionCount || 0)} sugg
                    </span>
                  </td>
                  <td><Badge tone={statusTone}>{statusLabel}</Badge></td>
                  <td className="actionCell"><button type="button" className="rowAction" disabled aria-disabled="true" title="Rollback requires backend import jobs (persistent jobs, audit trail, secure original-file storage, workspace permissions).">Rollback (backend)</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div> : <>
          <span style={{fontSize:12,color:'#64748B',lineHeight:1.45}}>Demo entries shown for layout reference. Real session batches will appear here after you Confirm an import.</span>
          <Table columns={['Import','File','Rows','Duplicate prevention','Status']} rows={historyRows}/>
        </>}
        <p style={{margin:0,fontSize:11,color:'#94A3B8',lineHeight:1.5}}>
          Session-only history. Backend will add persistent import jobs, full audit trail, rollback / re-run, secure original-file storage, and user/workspace permissions for who can import into which client or department.
        </p>
      </div>
    </details>

    {previewDrawerOpen && previewSelectedRecord && (() => {
      var moduleKey = previewSelectedRecord.moduleKey;
      var moduleTitle = moduleKeyToTitle(moduleKey);
      var fieldSpecs = getFormFields(moduleTitle, workspaceMode);
      var moduleDisplay = moduleKeyToDisplay(moduleKey);
      var recordTitle = (previewSelectedRecord.row && previewSelectedRecord.row[0]) || 'Import preview row';
      var fieldStyle = {border:'1px solid #DDE5EF',borderRadius:8,padding:'8px 10px',background:'#fff',color:'#132033',fontSize:13,width:'100%',fontFamily:'inherit',boxSizing:'border-box'};
      var setField = function(key, value) {
        setPreviewEditForm(function(prev) { return Object.assign({}, prev, { [key]: value }); });
      };
      return <>
        <style>{`.agentWrap,.floatingAgentWrap{display:none!important}`}</style>
        <div style={{position:'fixed',inset:0,background:'rgba(11,31,58,.18)',zIndex:48}} onClick={closePreviewDrawer} aria-hidden="true"/>
        <aside role="dialog" aria-modal="true" aria-label="Import preview record" style={{position:'fixed',right:0,top:0,bottom:0,width:'min(440px,100vw)',background:'#fff',borderLeft:'1px solid #E5E7EB',boxShadow:'-8px 0 40px rgba(11,31,58,.16)',zIndex:49,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'12px 16px 10px',borderBottom:'1px solid #EEF2F7',display:'grid',gap:7,flexShrink:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
              <div style={{minWidth:0,flex:1}}>
                <p style={{margin:'0 0 3px',color:'#0D9488',textTransform:'uppercase',fontSize:9.5,letterSpacing:'.14em',fontWeight:900,lineHeight:1}}>{moduleDisplay.toUpperCase()} · IMPORT PREVIEW</p>
                <h2 style={{margin:0,color:'#0B1F3A',fontSize:16.5,letterSpacing:'-.015em',lineHeight:1.18,wordBreak:'break-word',fontWeight:800}}>{recordTitle}</h2>
              </div>
              <button type="button" style={{width:26,height:26,borderRadius:7,fontSize:14,background:'#fff',border:'1px solid #EEF2F7',color:'#94A3B8',cursor:'pointer',lineHeight:1,padding:0}} onClick={closePreviewDrawer} aria-label="Close">×</button>
            </div>
            <div style={{color:'#64748B',fontSize:12,lineHeight:1.35}}>Row {previewSelectedRecord.importRowNumber}{fileName ? ' · ' + fileName : ''}</div>
          </div>
          <div style={{padding:'10px 16px',borderBottom:'1px solid #F1E3C8',background:'#FFFDF7',color:'#7C5A12',fontSize:12,lineHeight:1.45,flexShrink:0}}>
            Not yet created. Confirm Import to add this record to {moduleDisplay}. Relationships, Documents, Tasks and Activity become available after the record is created.
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'grid',gap:12,alignContent:'start'}}>
            {(function() {
              var renderField = function(f) {
                var labelEl = <label style={{display:'block',marginBottom:5,fontSize:13,fontWeight:700,color:'#334155'}}>
                  {f.label}{f.required && <span style={{color:'#DC2626',marginLeft:3}}>*</span>}
                  {f.type === 'computed' && <span style={{marginLeft:6,fontSize:11,fontWeight:600,color:'#94A3B8'}}>auto</span>}
                </label>;
                if (f.type === 'computed') {
                  return <div key={f.key}>{labelEl}<input type="text" value={previewEditForm[f.key] || ''} readOnly placeholder="Calculated" style={Object.assign({}, fieldStyle, {background:'#F0F4F8',color:previewEditForm[f.key] ? '#0F766E' : '#94A3B8',cursor:'default'})}/></div>;
                }
                if (f.multi) {
                  return <div key={f.key}>{labelEl}<textarea value={previewEditForm[f.key] || ''} onChange={function(e) { setField(f.key, e.target.value); }} rows={3} style={Object.assign({}, fieldStyle, {resize:'vertical'})}/></div>;
                }
                if (f.type === 'select') {
                  var baseOptions = f.source ? resolveFieldOptions(f.source, workspaceMode) : (f.options || []);
                  var currentVal = previewEditForm[f.key] || '';
                  var selectOptions = currentVal && !baseOptions.some(function(o) { return String(o) === String(currentVal); })
                    ? [currentVal].concat(baseOptions) : baseOptions;
                  return <div key={f.key}>{labelEl}<select value={currentVal} onChange={function(e) { setField(f.key, e.target.value); }} style={Object.assign({}, fieldStyle, {cursor:'pointer',color:currentVal ? '#132033' : '#94A3B8'})}>
                    <option value="">Select...</option>
                    {selectOptions.map(function(o) { return <option key={o} value={o}>{o}</option>; })}
                  </select></div>;
                }
                return <div key={f.key}>{labelEl}<input type={f.type || 'text'} value={previewEditForm[f.key] || ''} onChange={function(e) { setField(f.key, e.target.value); }} style={fieldStyle}/></div>;
              };
              var reqF  = fieldSpecs.filter(function(f) { return f.required && f.type !== 'file'; });
              var optF  = fieldSpecs.filter(function(f) { return !f.required && !f.multi && f.type !== 'file'; });
              var noteF = fieldSpecs.filter(function(f) { return f.multi; });
              return <>
                {reqF.length > 0 && <div style={{display:'grid',gap:12}}>{reqF.map(renderField)}</div>}
                {optF.length > 0 && <>
                  <div style={{display:'flex',alignItems:'center',gap:8,margin:'4px 0 -4px'}}>
                    <span style={{fontSize:11,fontWeight:800,color:'#94A3B8',letterSpacing:'.1em',textTransform:'uppercase',flexShrink:0}}>Optional</span>
                    <div style={{flex:1,height:1,background:'#EEF2F7'}}/>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{optF.map(renderField)}</div>
                </>}
                {noteF.length > 0 && <div style={{display:'grid',gap:12}}>{noteF.map(renderField)}</div>}
              </>;
            })()}
            {/* Coverage Import C4 — Suggested Coverage Records with
                per-suggestion Approve / Edit / Skip / Undo. Native <details>
                collapsed by default per AGENTS.md §16 (Progressive Guidance).
                Decisions are captured in coverageDecisions session state and
                block Confirm Import while any suggestion remains pending.
                Records are NOT yet created — C5 will materialise approved /
                edited suggestions into Coverage records in RECORD_STORE. */}
            {previewSelectedRecord.suggestedCoverages && previewSelectedRecord.suggestedCoverages.length > 0 && (function() {
              var covs = previewSelectedRecord.suggestedCoverages;
              var rowNumber = previewSelectedRecord.importRowNumber;
              var parentBlocked = !!(previewSelectedRecord && previewSelectedRecord.meta && previewSelectedRecord.meta.rowNumber && /* if parent row had critical issues we leave Approve allowed; W3 critical already blocks confirm at the row level */ false);
              // Catalogs (local — Coverage Type expanded to spec v2.0 §16.4;
              // Support Level new in v2.0). Closed enums per the Controlled
              // Catalog rule (AGENTS.md §17): simple <select> is acceptable
              // because the lists do not grow per workspace. SearchableSelect
              // (Phase S1) will replace them when high-cardinality entity
              // fields like Provider migrate.
              var COVERAGE_TYPE_DROPDOWN = ['Manufacturer Warranty','Extended Warranty','Care Pack','SmartNet','Vendor Support','Managed Support','Subscription Support','Software Assurance','SLA Coverage','Maintenance Agreement','Other'];
              var SUPPORT_LEVEL_DROPDOWN = ['Bronze','Silver','Gold','Platinum','Standard','Premium','Mission Critical','Other'];
              var kindBg = { Warranty: '#F0FDFA', Support: '#EFF6FF', Maintenance: '#FAF5FF' };
              var kindBorder = { Warranty: '#CCFBEF', Support: '#BFDBFE', Maintenance: '#E9D5FF' };
              var kindText = { Warranty: '#0F766E', Support: '#1D4ED8', Maintenance: '#7C3AED' };
              function decisionKey(kind) { return rowNumber + '::' + kind; }
              function effectiveCov(cov) {
                var dec = coverageDecisions[decisionKey(cov.coverageKind)];
                if (dec && dec.status === 'edited' && dec.edits) return Object.assign({}, cov, dec.edits);
                return cov;
              }
              function applyDecision(kind, status, edits) {
                setCoverageDecisions(function(prev) {
                  var next = Object.assign({}, prev);
                  var k = rowNumber + '::' + kind;
                  if (status === 'pending') { delete next[k]; }
                  else { next[k] = { status: status, edits: edits || (prev[k] && prev[k].edits) || {} }; }
                  return next;
                });
              }
              function startEdit(cov) {
                var eff = effectiveCov(cov);
                setEditCoverageDraft({
                  coverageType: eff.coverageType || '',
                  startDate: eff.startDate || '',
                  endDate: eff.endDate || '',
                  provider: eff.provider || '',
                  supportLevel: eff.supportLevel || '',
                  reference: eff.reference || ''
                });
                setEditingCoverageKey(decisionKey(cov.coverageKind));
              }
              function saveEdit(kind) {
                applyDecision(kind, 'edited', Object.assign({}, editCoverageDraft));
                setEditingCoverageKey(null);
                setEditCoverageDraft({});
              }
              function cancelEdit() {
                setEditingCoverageKey(null);
                setEditCoverageDraft({});
              }
              var statusTone = {
                pending:  { label: 'Pending review', bg: '#FEF3C7', border: '#FDE68A', text: '#92400E' },
                approved: { label: 'Approved',       bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
                edited:   { label: 'Edited',         bg: '#ECFEFF', border: '#A5F3FC', text: '#0E7490' },
                skipped:  { label: 'Won’t be created', bg: '#F1F5F9', border: '#CBD5E1', text: '#64748B' }
              };
              var fileTone = { label: 'From file', bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' };
              var smallBtn = {border:'1px solid #DDE5EF',background:'#fff',color:'#243247',borderRadius:6,padding:'4px 8px',fontSize:11,fontWeight:700,cursor:'pointer',lineHeight:1.2};
              var primaryBtn = {border:'1px solid #0D9488',background:'#0D9488',color:'#fff',borderRadius:6,padding:'4px 8px',fontSize:11,fontWeight:700,cursor:'pointer',lineHeight:1.2};
              var skipBtn = {border:'1px solid #E2E8F0',background:'#fff',color:'#64748B',borderRadius:6,padding:'4px 8px',fontSize:11,fontWeight:700,cursor:'pointer',lineHeight:1.2};
              var undoBtn = {border:'none',background:'transparent',color:'#0D9488',fontSize:11,fontWeight:700,cursor:'pointer',padding:'2px 6px',textDecoration:'underline'};
              var editFieldStyle = {border:'1px solid #DDE5EF',borderRadius:6,padding:'5px 7px',fontSize:11,width:'100%',fontFamily:'inherit',boxSizing:'border-box',background:'#fff',color:'#132033'};
              var editLabelStyle = {display:'block',marginBottom:3,fontSize:10,fontWeight:800,color:'#64748B',textTransform:'uppercase',letterSpacing:'.06em'};
              return <details style={{border:'1px solid #FDE68A',borderRadius:10,background:'#FFFBEB',padding:'4px 12px',marginTop:4}}>
                <summary style={{cursor:'pointer',padding:'6px 0',fontSize:12,fontWeight:800,color:'#92400E',listStyle:'revert'}}>
                  Suggested coverage records ({covs.length})
                </summary>
                <ul role="list" style={{listStyle:'none',padding:0,margin:'6px 0 8px',display:'grid',gap:8}}>
                  {covs.map(function(cov, idx) {
                    var dKey = decisionKey(cov.coverageKind);
                    var decision = coverageDecisions[dKey] || { status: 'pending', edits: {} };
                    var status = decision.status || 'pending';
                    var eff = effectiveCov(cov);
                    var isEditing = editingCoverageKey === dKey;
                    var sTone = statusTone[status] || statusTone.pending;
                    var basisIsFile = cov.suggestionBasis === 'file';
                    var statusBadge = status === 'pending' && basisIsFile ? fileTone : sTone;
                    var statusLabel = status === 'pending' && basisIsFile ? 'From file' : sTone.label;
                    var rowDimmed = status === 'skipped' ? { opacity: 0.65 } : {};
                    return <li key={'cov-' + idx} role="listitem" style={Object.assign({border:'1px solid #FEF3C7',background:'#fff',borderRadius:8,padding:'8px 10px',display:'grid',gap:6,fontSize:12,lineHeight:1.45}, rowDimmed)}>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                        <span style={{display:'inline-flex',alignItems:'center',border:'1px solid ' + (kindBorder[cov.coverageKind] || '#E2E8F0'),background:kindBg[cov.coverageKind] || '#F8FAFC',color:kindText[cov.coverageKind] || '#475569',borderRadius:999,padding:'2px 8px',fontSize:11,fontWeight:800}}>{cov.coverageKind}</span>
                        <strong style={{color:'#0B1F3A',fontWeight:800}}>{eff.coverageType || '-'}</strong>
                        <span role="status" aria-live="polite" aria-label={'Coverage suggestion status: ' + statusLabel} style={{display:'inline-flex',alignItems:'center',border:'1px solid ' + statusBadge.border,background:statusBadge.bg,color:statusBadge.text,borderRadius:999,padding:'2px 8px',fontSize:10,fontWeight:700,marginLeft:'auto'}}>{statusLabel}</span>
                      </div>
                      {!isEditing && <>
                        <div style={{color:'#475569',fontSize:11.5}}>
                          <span style={{color:'#94A3B8'}}>Start </span>{eff.startDate || '—'}
                          <span style={{margin:'0 6px',color:'#CBD5E1'}}>·</span>
                          <span style={{color:'#94A3B8'}}>End </span><strong style={{color:'#0B1F3A',fontWeight:700}}>{eff.endDate || '—'}</strong>
                        </div>
                        {(eff.provider || eff.supportLevel || eff.reference) && <div style={{color:'#64748B',fontSize:11,display:'flex',gap:10,flexWrap:'wrap'}}>
                          {eff.provider && <span><span style={{color:'#94A3B8'}}>Provider </span>{eff.provider}</span>}
                          {eff.supportLevel && <span><span style={{color:'#94A3B8'}}>Level </span>{eff.supportLevel}</span>}
                          {eff.reference && <span><span style={{color:'#94A3B8'}}>Ref </span>{eff.reference}</span>}
                        </div>}
                        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',marginTop:2}}>
                          {status === 'pending' && <>
                            <button type="button" style={primaryBtn} aria-label={'Approve ' + cov.coverageKind + ' coverage for row ' + rowNumber} onClick={function() { applyDecision(cov.coverageKind, 'approved'); }}>Approve</button>
                            <button type="button" style={smallBtn} aria-label={'Edit ' + cov.coverageKind + ' coverage for row ' + rowNumber} onClick={function() { startEdit(cov); }}>Edit</button>
                            <button type="button" style={skipBtn} aria-label={'Skip ' + cov.coverageKind + ' coverage for row ' + rowNumber + ' so it will not be created'} onClick={function() { applyDecision(cov.coverageKind, 'skipped'); }}>Skip</button>
                          </>}
                          {status === 'approved' && <>
                            <button type="button" style={smallBtn} aria-label={'Edit ' + cov.coverageKind + ' coverage for row ' + rowNumber} onClick={function() { startEdit(cov); }}>Edit</button>
                            <button type="button" style={undoBtn} aria-label={'Undo approval of ' + cov.coverageKind + ' coverage for row ' + rowNumber} onClick={function() { applyDecision(cov.coverageKind, 'pending'); }}>Undo</button>
                          </>}
                          {status === 'edited' && <>
                            <button type="button" style={smallBtn} aria-label={'Re-edit ' + cov.coverageKind + ' coverage for row ' + rowNumber} onClick={function() { startEdit(cov); }}>Edit</button>
                            <button type="button" style={undoBtn} aria-label={'Undo edit of ' + cov.coverageKind + ' coverage for row ' + rowNumber} onClick={function() { applyDecision(cov.coverageKind, 'pending'); }}>Undo</button>
                          </>}
                          {status === 'skipped' && <>
                            <button type="button" style={undoBtn} aria-label={'Undo skip of ' + cov.coverageKind + ' coverage for row ' + rowNumber} onClick={function() { applyDecision(cov.coverageKind, 'pending'); }}>Undo</button>
                          </>}
                        </div>
                      </>}
                      {isEditing && <div style={{display:'grid',gap:8,background:'#F8FAFC',border:'1px solid #DDE5EF',borderRadius:8,padding:'8px 10px'}}>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                          <div>
                            <label style={editLabelStyle} htmlFor={'cov-type-' + idx}>Coverage Type</label>
                            <select id={'cov-type-' + idx} style={editFieldStyle} value={editCoverageDraft.coverageType || ''} onChange={function(e) { setEditCoverageDraft(function(p) { return Object.assign({}, p, { coverageType: e.target.value }); }); }}>
                              <option value="">Select...</option>
                              {COVERAGE_TYPE_DROPDOWN.map(function(o) { return <option key={o} value={o}>{o}</option>; })}
                            </select>
                          </div>
                          <div>
                            <label style={editLabelStyle} htmlFor={'cov-level-' + idx}>Support Level</label>
                            <select id={'cov-level-' + idx} style={editFieldStyle} value={editCoverageDraft.supportLevel || ''} onChange={function(e) { setEditCoverageDraft(function(p) { return Object.assign({}, p, { supportLevel: e.target.value }); }); }}>
                              <option value="">Select...</option>
                              {SUPPORT_LEVEL_DROPDOWN.map(function(o) { return <option key={o} value={o}>{o}</option>; })}
                            </select>
                          </div>
                          <div>
                            <label style={editLabelStyle} htmlFor={'cov-start-' + idx}>Start Date</label>
                            <input id={'cov-start-' + idx} type="date" style={editFieldStyle} value={editCoverageDraft.startDate || ''} onChange={function(e) { setEditCoverageDraft(function(p) { return Object.assign({}, p, { startDate: e.target.value }); }); }}/>
                          </div>
                          <div>
                            <label style={editLabelStyle} htmlFor={'cov-end-' + idx}>End Date</label>
                            <input id={'cov-end-' + idx} type="date" style={editFieldStyle} value={editCoverageDraft.endDate || ''} onChange={function(e) { setEditCoverageDraft(function(p) { return Object.assign({}, p, { endDate: e.target.value }); }); }}/>
                          </div>
                          <div>
                            <label style={editLabelStyle} htmlFor={'cov-provider-' + idx}>Provider</label>
                            {/* TODO Phase S1-S2: SearchableSelect with provider catalog when SearchableSelect primitive lands. */}
                            <input id={'cov-provider-' + idx} type="text" style={editFieldStyle} value={editCoverageDraft.provider || ''} onChange={function(e) { setEditCoverageDraft(function(p) { return Object.assign({}, p, { provider: e.target.value }); }); }} placeholder="Free text in MVP"/>
                          </div>
                          <div>
                            <label style={editLabelStyle} htmlFor={'cov-ref-' + idx}>Reference</label>
                            <input id={'cov-ref-' + idx} type="text" style={editFieldStyle} value={editCoverageDraft.reference || ''} onChange={function(e) { setEditCoverageDraft(function(p) { return Object.assign({}, p, { reference: e.target.value }); }); }} placeholder="Contract / PO / SKU"/>
                          </div>
                        </div>
                        <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                          <button type="button" style={smallBtn} onClick={cancelEdit} aria-label="Cancel coverage edit">Cancel</button>
                          <button type="button" style={primaryBtn} onClick={function() { saveEdit(cov.coverageKind); }} aria-label={'Save edited ' + cov.coverageKind + ' coverage for row ' + rowNumber}>Save changes</button>
                        </div>
                      </div>}
                    </li>;
                  })}
                </ul>
                <p style={{margin:'4px 0 6px',fontSize:11,lineHeight:1.4,color:'#92400E'}}>Approved or edited suggestions become Coverage records when import is confirmed. Skipped suggestions will not be created.</p>
              </details>;
            })()}
          </div>
          <div style={{padding:'10px 16px',borderTop:'1px solid #EEF2F7',display:'flex',justifyContent:'flex-end',gap:8,flexShrink:0,background:'#fff'}}>
            <button type="button" onClick={closePreviewDrawer} style={{border:'1px solid #DDE5EF',borderRadius:8,padding:'8px 12px',background:'#fff',color:'#243247',fontWeight:700,fontSize:12,cursor:'pointer'}}>Cancel</button>
            <button type="button" className="primary" onClick={handlePreviewEditSave} style={{borderRadius:8,padding:'8px 12px',fontWeight:700,fontSize:12,cursor:'pointer'}}>Save preview</button>
          </div>
        </aside>
      </>;
    })()}
  </main>;
}

function Settings({ workspaceMode = 'MSP / Integrator', setWorkspaceMode = function(){} }){
  const [query, setQuery] = React.useState('');
  const [openedGroupId, setOpenedGroupId] = React.useState(null);
  const [modules, setModules] = React.useState({
    'Assets & Renewals': true, 'Licenses': true, 'Contracts': true,
    'Documents': true, 'Tasks': true, 'Reports': true,
    'Data Import': true, 'Providers & Distributors': true, 'Assets / Hardware': false
  });
  const toggleModule = function(name){ setModules(function(prev){ var next = {}; Object.keys(prev).forEach(function(k){ next[k] = prev[k]; }); next[name] = !prev[name]; return next; }); };
  const normalized = query.trim().toLowerCase();
  const overviewDescriptions = {
    company: 'Configure workspace identity, custom branding and regional defaults — including workspace profile, theme assets, logo and locale settings like currency and timezone.',
    access: 'Manage who has access and what they can do — users and invites, custom roles and permission levels, security policies, and enterprise SSO with MFA enforcement.',
    data: 'Define the catalogs, taxonomies and record structures used across managed assets — categories, custom fields, vendors and providers, brands, products and SKUs, and tags.',
    automation: 'Rules that turn dates, risk and missing data into accountable action — notification rules, escalation policies, approval workflows and default alert thresholds.',
    'ai-operator': 'Configure when and how the AI operates inside the workspace — assistant availability, action permissions, approval requirements and operator behavior preferences.',
    governance: 'Auditability and data lifecycle controls — full audit log, import history with reversibility, data retention policies and controlled export approvals.',
    integrations: 'Connect Opriva to external systems — generate API keys, configure outbound webhooks, set up email connectors and link third-party data sources.'
  };
  const filteredGroups = settingsAdminGroups.map(function(group){
    var overviewDescription = overviewDescriptions[group.id] || group.description;
    var subItems = (group.items || []).map(function(it){ return it[0]; });
    return { id: group.id, label: group.label, description: overviewDescription, subItems: subItems };
  }).filter(function(group){
    if(!normalized) return true;
    var combined = (group.label + ' ' + group.description + ' ' + group.subItems.join(' ')).toLowerCase();
    return combined.includes(normalized);
  });
  var foundationIds = { company: true, access: true, data: true, integrations: true };
  var topRow = filteredGroups.filter(function(g){ return foundationIds[g.id]; });
  var bottomRow = filteredGroups.filter(function(g){ return !foundationIds[g.id]; });
  const openedGroup = openedGroupId ? settingsAdminGroups.find(function(g){ return g.id === openedGroupId; }) : null;
  const renderHubSection = function(group){
    return <div className="settingsHubSection" key={group.id}>
      <button type="button" className="settingsHubSectionTitleBtn" onClick={function(){ setOpenedGroupId(group.id); }}>{group.label}</button>
      <p className="settingsHubSectionDesc">{group.description}</p>
    </div>;
  };

  return <main className="content settingsPage settingsDirectoryPage">
    {!openedGroup && <div className="settingsHubDirectory">
      <div className="settingsHubDirectoryHeader">
        <p className="settingsHubDirectoryEyebrow">Workspace administration</p>
        <h1 className="settingsHubDirectoryTitle">Settings</h1>
        <p className="settingsHubDirectorySubtitle">Manage workspace, access, data, automation, AI and governance.</p>
      </div>
      <div className="settingsHubDirectorySearchBlock">
        <p className="settingsHubDirectorySearchLabel">Search settings</p>
        <input
          type="text"
          className="settingsHubDirectorySearchInput"
          value={query}
          onChange={function(e){ setQuery(e.target.value); }}
          placeholder="Search settings..."
          aria-label="Search settings"
        />
      </div>
      <hr className="settingsHubDirectoryDivider" />
      {filteredGroups.length === 0
        ? <p className="settingsNoResults">No matching settings found.</p>
        : <React.Fragment>
            {topRow.length > 0 && <div className="settingsHubDirectoryRow">{topRow.map(renderHubSection)}</div>}
            {topRow.length > 0 && bottomRow.length > 0 && <hr className="settingsHubDirectoryDivider" />}
            {bottomRow.length > 0 && <div className="settingsHubDirectoryRow">{bottomRow.map(renderHubSection)}</div>}
          </React.Fragment>
      }
    </div>}
    {openedGroup && <div className="settingsDetailWorkspace" aria-live="polite">
      <ScreenHeader active="Settings" subtitle="Manage workspace, access, data, automation, AI and governance." />
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
  var terminologyPreview = {
    'MSP / Integrator': [
      ['Commercial model', 'Client + Brand + Product + Distributor + Value + Margin + Owner + Action'],
      ['Client label', 'Companies / Clients'],
      ['Contact label', 'Contacts'],
      ['Owner label', 'Account Owner / Opriva Owner'],
      ['Distributor label', 'Distributor'],
      ['Records label', 'Assets & Renewals']
    ],
    'Internal IT': [
      ['Commercial model', 'Brand + Provider + Department + Budget / Approval / Risk'],
      ['Organization label', 'Organization / Business Unit'],
      ['Department label', 'Department'],
      ['Provider label', 'Provider'],
      ['Budget label', 'Budget'],
      ['Owner label', 'Department Owner'],
      ['Records label', 'Renewals Forecast / Assets & Renewals']
    ],
    Hybrid: [
      ['Commercial model', 'Organizations + People + Owner + Scope + Value + Risk'],
      ['Organization label', 'Organizations'],
      ['People label', 'People / Contacts'],
      ['Owner label', 'Owner'],
      ['Scope label', 'Internal + External obligations'],
      ['Records label', 'Assets & Renewals']
    ]
  };
    terminologyPreview.Custom = [
      ['Commercial model', 'Configurable'],
      ['Entity labels', 'Configurable'],
      ['Ownership model', 'Configurable'],
      ['Records model', 'Configurable'],
      ['Import fields', 'Configurable']
    ];
  var operatingLogic = {
    'MSP / Integrator': { view: 'Client renewal operations', rel: 'Client → Brand → Product → Distributor → Margin → Account owner' },
    'Internal IT': { view: 'Department-based IT renewal management', rel: 'Brand → Provider → Department → Budget owner → Approval status' },
    Hybrid: { view: 'Mixed internal and client renewal operations', rel: 'Organization → Scope → Owner → Value → Risk' },
    Custom: { view: 'Configurable operating structure', rel: 'Defined by workspace administrator' }
  };
  var navigationPreview = {
    'MSP / Integrator': ['Dashboard', 'Attention Center', 'Companies / Clients', 'Assets & Renewals', 'Licenses', 'Contracts', 'Documents', 'Tasks', 'Reports', 'Data Import', 'Settings'],
    'Internal IT': ['Dashboard', 'Attention Center', 'Departments', 'Renewals Forecast', 'Licenses', 'Contracts', 'Documents', 'Tasks', 'Reports', 'Data Import', 'Settings'],
    Hybrid: ['Dashboard', 'Attention Center', 'Organizations', 'People / Contacts', 'Assets & Renewals', 'Departments', 'Tasks', 'Reports', 'Data Import', 'Settings']
  };
    navigationPreview.Custom = ['Configurable navigation based on enabled modules'];
  var importTemplatePreview = {
    'MSP / Integrator': ['Client', 'Contact', 'Brand', 'Product', 'Distributor', 'Renewal date', 'Value', 'Margin', 'Account owner'],
    'Internal IT': ['Department', 'Brand', 'Provider', 'Renewal date', 'Value', 'Budget owner', 'Approval status', 'Risk'],
    Hybrid: ['Organization', 'Scope', 'Person / Contact', 'Owner', 'Renewal date', 'Value', 'Risk']
  };
    importTemplatePreview.Custom = ['Configurable fields defined in Data settings'];
  var activeMode = terminologyPreview[workspaceMode] ? workspaceMode : 'MSP / Integrator';
  var selectedModeExplanation = {
    'MSP / Integrator': 'Designed for service providers and integrators managing renewals across multiple clients, technology brands, products, distributors, margin exposure and commercial owners.',
    'Internal IT': 'Designed for enterprises managing their own IT renewals across brands, providers, departments, budgets, approvals and operational risk.',
    Hybrid: 'Designed for teams managing both internal IT obligations and external client renewal operations in the same workspace.'
  };
    selectedModeExplanation.Custom = 'Designed for organizations that need to configure Opriva around their own categories, terminology, ownership and renewal workflows.';
  return <div className="settingsDetailPanel settingsFocusedPanel">
    <div className="settingsDetailHeader">
      <span className="eyebrow">{isCompany ? 'Workspace setup' : group.label}</span>
      <h2>{isCompany ? 'Workspace configuration' : group.label}</h2>
      <p>{isCompany ? 'Define workspace mode, branding, localization and enabled modules.' : group.description}</p>
    </div>
    {isCompany && <div className="settingsDetailSection workspaceModeSection">
      <p className="settingsSectionLabel">Operating Model</p>
      <p className="settingsWorkspaceModeDesc">Operating Model defines how this workspace was configured during onboarding. It controls terminology, navigation, import templates, dashboards and reporting logic. Workspace administrators can review or adjust this configuration here.</p>
      <div className="workspaceModeSegment" role="group" aria-label="Select workspace mode">
        {['MSP / Integrator', 'Internal IT', 'Hybrid', 'Custom'].map(function(mode){
          return <button key={mode} type="button"
            className={workspaceMode === mode ? 'active' : ''}
            onClick={function(){ setWorkspaceMode(mode); }}
          >{mode}</button>;
        })}
      </div>
      <p className="modeSelectedSummary">{selectedModeExplanation[activeMode]}</p>
      <section className="modePreviewUnified" aria-label="Workspace mode preview">
        <div className="modePreviewUnifiedHeader">
          <h3>Workspace preview</h3>
          <p>See how this operating model changes the workspace logic, sidebar navigation and import structure.</p>
        </div>
        <div className="modePreviewColumns">
          <div className="modePreviewColumn">
            <h4>Operating logic</h4>
            <div className="modeLabelList">
              <div className="modeLabelLine"><span>Primary view</span><strong>{operatingLogic[activeMode].view}</strong></div>
              <div className="modeLabelLine"><span>Key relationship</span><strong>{operatingLogic[activeMode].rel}</strong></div>
            </div>
          </div>
          <div className="modePreviewColumn">
            <h4>Sidebar navigation</h4>
            <p className="modePreviewText">{navigationPreview[activeMode].join(' · ')}</p>
          </div>
          <div className="modePreviewColumn">
            <h4>Import template</h4>
            <p className="modePreviewText">{importTemplatePreview[activeMode].join(' · ')}</p>
          </div>
        </div>
      </section>
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
      <p className="settingsWorkspaceModeDesc">Enable or disable modules for this workspace. Disabled modules are hidden from navigation but existing records are not deleted.</p>
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
    { text: "I can help you prioritize today's alerts.", action: 'Prioritize' },
    { text: 'Want me to summarize what needs attention?', action: 'Summarize' },
    { text: 'I found records missing owners. Want to review them?', action: 'Review' }
  ],
  'Data Import': [
    { text: 'Want me to guide you through uploading a spreadsheet?', action: 'Guide me' },
    { text: 'I can map columns and detect duplicates for you.', action: 'Map columns' },
    { text: "Upload your Excel and I'll help organize the data.", action: 'Start import' }
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
    { text: "Need a quick plan for today's blockers?", action: 'Plan' }
  ],
  Hardware: [
    { text: 'I can find assets with warranties expiring soon.', action: 'Find expiring' },
    { text: 'Want me to surface hardware without an assigned owner?', action: 'Find unassigned' },
    { text: 'I can identify assets missing support coverage.', action: 'Find gaps' }
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
      <span className="aiInsightBarLabel">AI insight (sample)</span>
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
      <p>Preview of the Opriva AI assistant and operator controls.</p>
      <div className="aiSafetyNote"><strong>Preview</strong><span>These AI controls are not enforced in this sandbox. Real approval, permissions and audit require backend.</span></div>
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
        <div><span className="eyebrow">AI Insight</span><p>"Your workspace is configured safely. License and certificate categories should require owner, renewal date and evidence before records become active."</p></div>
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

function SidebarNavIcon({ item }){
  const common = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' };
  const icons = {
    'Dashboard': <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    'Attention Center': <svg {...common}><path d="M12 3v4"/><path d="M12 17v4"/><path d="M4.9 4.9l2.8 2.8"/><path d="M16.3 16.3l2.8 2.8"/><path d="M3 12h4"/><path d="M17 12h4"/><circle cx="12" cy="12" r="3"/></svg>,
    'Companies / Clients': <svg {...common}><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01M9 13h.01M9 17h.01"/></svg>,
    'Vendors': <svg {...common}><circle cx="6" cy="7" r="3"/><circle cx="18" cy="7" r="3"/><circle cx="12" cy="17" r="3"/><path d="M8.6 9.4l2 4.2M15.4 9.4l-2 4.2"/></svg>,
    'Expirations': <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 15h5"/></svg>,
    'Licenses': <svg {...common}><circle cx="7.5" cy="14.5" r="3.5"/><path d="M10 12l9-9"/><path d="M15 3h4v4"/></svg>,
    'Hardware': <svg {...common}><rect x="2" y="3" width="20" height="5" rx="1.5"/><rect x="2" y="10" width="20" height="5" rx="1.5"/><rect x="2" y="17" width="20" height="4" rx="1.5"/><circle cx="18" cy="5.5" r="1"/><circle cx="18" cy="12.5" r="1"/></svg>,
    'Contracts': <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>,
    'Documents': <svg {...common}><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
    'Tasks': <svg {...common}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    'Reports': <svg {...common}><path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="11" width="3" height="5" rx="1"/><rect x="12" y="8" width="3" height="8" rx="1"/><rect x="17" y="5" width="3" height="11" rx="1"/></svg>,
    'Data Import': <svg {...common}><path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 21h14"/><path d="M5 17v4M19 17v4"/></svg>,
    'Settings': <svg {...common}><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05a2 2 0 0 1-2.83 2.83l-.05-.05A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 0 1-4 0v-.08A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.05.05a2 2 0 0 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.08A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.05-.05a2 2 0 0 1 2.83-2.83l.05.05A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 0 1 4 0v.08A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.05-.05a2 2 0 0 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.4 9c.1.39.36.74.7.96.24.16.5.24.8.24H21a2 2 0 0 1 0 4h-.08a1.7 1.7 0 0 0-1.52.8z"/></svg>
  };
  return icons[item] || <svg {...common}><circle cx="12" cy="12" r="8"/></svg>;
}


function SidebarShell({ active, onSelect, open=false, onClose, workspaceMode = 'MSP / Integrator', collapsed = false, onToggleCollapse }){
  const handleSelect = (item) => { onSelect(item); if(onClose) onClose(); };
  const labelOverrides = (modeConfig[workspaceMode] && modeConfig[workspaceMode].sidebarLabels) || {};
  const isCollapsed = collapsed && !open;
  return <aside className={cx('sidebar', open && 'sidebarOpen', isCollapsed && 'sidebarCollapsed')}>
    <button type="button" className="sidebarCloseBtn" onClick={onClose} aria-label="Close menu">×</button>
    <div className="brand" aria-label="Opriva product identity">
      <OprivaProductMark />
      <span className="brandCopy"><strong>Opriva</strong><span>IT Asset & Renewal Intelligence</span></span>
      <button
        type="button"
        className="sidebarCollapseBtn"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={isCollapsed}>
        <span aria-hidden="true">{isCollapsed ? '›' : '‹'}</span>
      </button>
    </div>
    <nav aria-label="Primary navigation">
      {SIDEBAR_GROUPS.map(group => <div className="navGroup" key={group.label}>
        <p>{group.label}</p>
        {group.items.map(item => {
            const displayLabel = labelOverrides[item] || getPageDisplayName(item, workspaceMode);
            return <button
              key={item}
              className={cx(active === item && 'active')}
              onClick={() => handleSelect(item)}
              type="button"
              aria-label={isCollapsed ? displayLabel : undefined}
              title={isCollapsed ? displayLabel : undefined}>
              <span className="navIcon"><SidebarNavIcon item={item} /></span>
              <span className="navLabel">{displayLabel}</span>
              {isCollapsed && <span className="navTooltip" role="tooltip">{displayLabel}</span>}
            </button>;
          })}
      </div>)}
    </nav>
  </aside>;
}

function CommandPalette({ open, onClose, onNavigate, onOpenAi, workspaceMode = 'MSP / Integrator' }){
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      const t = window.setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 30);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const cmdPlaceholder = workspaceMode === 'MSP / Integrator'
    ? 'Search clients, products, owners, distributors, or ask Opriva AI...'
    : workspaceMode === 'Internal IT'
    ? 'Search departments, brands, budgets, approvals, or ask Opriva AI...'
    : workspaceMode === 'Hybrid'
    ? 'Search records, contacts, owners, or ask Opriva AI...'
    : 'Search records, jump to a page, or ask Opriva AI...';

  const pageIds = ['Dashboard', 'Attention Center', 'Companies / Clients', 'Expirations', 'Licenses', 'Contracts', 'Documents', 'Tasks', 'Reports', 'Data Import', 'Settings'];
  const pageDescs = {
    Dashboard: 'Workspace overview and AI risk summary',
    'Attention Center': 'Critical issues, missing owners and pending approvals',
    'Companies / Clients': workspaceMode === 'Internal IT' ? 'Department portfolio and ownership' : 'Client portfolio and ownership',
    Expirations: workspaceMode === 'Internal IT' ? 'Renewal forecast by department and budget impact' : 'Renewal worklist by urgency',
    Licenses: 'Software licenses, quantity and renewals',
    Contracts: 'Active contracts and obligations',
    Documents: 'Quotes, contracts, warranties and evidence',
    Tasks: 'Open work and assignments',
    Reports: 'Saved and scheduled reports',
    'Data Import': 'Import CSV or XLSX files',
    Settings: 'Workspace administration'
  };
  const pages = pageIds.map(function(id){
    return { id: id, label: getPageDisplayName(id, workspaceMode), desc: pageDescs[id] || '' };
  });

  const quickActionsMap = {
    'MSP / Integrator': [
      { label: 'Create renewal record for a client', desc: 'Add a client renewal, contract or license' },
      { label: 'Assign account owner', desc: 'Set ownership on an unowned renewal record' },
      { label: 'Request distributor quote', desc: 'Initiate a quote from the distributor' },
      { label: 'Switch workspace', desc: 'Change active workspace' }
    ],
    'Internal IT': [
      { label: 'Create renewal record for a department', desc: 'Add a renewal, contract or license to a department' },
      { label: 'Assign budget owner', desc: 'Set ownership on an unowned budget item' },
      { label: 'Submit approval request', desc: 'Route a renewal for budget approval' },
      { label: 'Switch workspace', desc: 'Change active workspace' }
    ],
    Hybrid: [
      { label: 'Create renewal record', desc: 'Add a license, contract or asset' },
      { label: 'Assign owner', desc: 'Set ownership on an unowned renewal record' },
      { label: 'Review operational risk', desc: 'Open pending risk items' },
      { label: 'Switch workspace', desc: 'Change active workspace' }
    ],
    Custom: [
      { label: 'Create new record', desc: 'Add a license, contract or asset' },
      { label: 'Assign owners to ownerless records', desc: 'Bulk owner assignment' },
      { label: 'Switch workspace', desc: 'Change active workspace' },
      { label: 'Invite teammate', desc: 'Add a user to the workspace' }
    ]
  };
  const quickActions = quickActionsMap[workspaceMode] || quickActionsMap['Custom'];

  const aiSuggestionsMap = {
    'MSP / Integrator': [
      { label: 'Ask Opriva AI...', desc: 'Open the AI assistant', primary: true },
      { label: 'Find clients with renewals in 30 days', desc: 'AI view of upcoming client renewal exposure' },
      { label: 'Show unowned renewal records', desc: 'AI analysis of ownership gaps' },
      { label: 'Draft distributor outreach', desc: 'AI-generated distributor communication' }
    ],
    'Internal IT': [
      { label: 'Ask Opriva AI...', desc: 'Open the AI assistant', primary: true },
      { label: 'Find departments with approval blockers', desc: 'AI triage of pending approvals by department' },
      { label: 'Show budget exposure by brand', desc: 'AI analysis of brand-level spend risk' },
      { label: 'Find renewal risks without owner', desc: 'AI analysis of unowned renewal exposure' }
    ],
    Hybrid: [
      { label: 'Ask Opriva AI...', desc: 'Open the AI assistant', primary: true },
      { label: 'Summarize critical renewal risk', desc: 'AI brief of urgent renewal exposure' },
      { label: 'Find ownerless high-value records', desc: 'AI analysis of risk exposure' },
      { label: 'Review upcoming exposure', desc: 'AI view of renewal windows in 30–90 days' }
    ],
    Custom: [
      { label: 'Ask Opriva AI...', desc: 'Open the AI assistant', primary: true },
      { label: 'Summarize critical items', desc: 'AI brief of urgent renewal exposure' },
      { label: 'Find ownerless high-value records', desc: 'AI analysis of risk exposure' },
      { label: 'Review upcoming exposure', desc: 'AI view of renewal windows in 30–90 days' }
    ]
  };
  const aiSuggestions = aiSuggestionsMap[workspaceMode] || aiSuggestionsMap['Custom'];

  const norm = query.trim().toLowerCase();
  const matchesQuery = function(item){ return !norm || (item.label + ' ' + (item.desc || '')).toLowerCase().includes(norm); };
  const filteredActions = quickActions.filter(matchesQuery);
  const filteredPages = pages.filter(matchesQuery);
  const filteredAi = aiSuggestions.filter(matchesQuery);
  const noResults = !filteredActions.length && !filteredPages.length && !filteredAi.length;

  // Build flat list for keyboard navigation
  const flatList = [];
  filteredActions.forEach(function(a){ flatList.push({ kind: 'action', item: a }); });
  filteredPages.forEach(function(p){ flatList.push({ kind: 'page', item: p }); });
  filteredAi.forEach(function(a){ flatList.push({ kind: 'ai', item: a }); });

  const runItem = function(entry){
    if (!entry) return;
    if (entry.kind === 'page' && onNavigate) onNavigate(entry.item.id);
    else if (entry.kind === 'ai' && onOpenAi) onOpenAi();
    onClose();
  };

  React.useEffect(() => {
    if (!open) return;
    const handler = function(e){
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(function(i){ return Math.min(flatList.length - 1, i + 1); }); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(function(i){ return Math.max(0, i - 1); }); return; }
      if (e.key === 'Enter') { e.preventDefault(); runItem(flatList[selectedIndex]); return; }
    };
    document.addEventListener('keydown', handler);
    return function(){ document.removeEventListener('keydown', handler); };
  }, [open, flatList.length, selectedIndex]);

  React.useEffect(() => { setSelectedIndex(0); }, [norm]);

  if (!open) return null;

  let runningIndex = -1;
  const renderItem = function(entry, iconNode, accentClass){
    runningIndex += 1;
    const idx = runningIndex;
    const isSelected = idx === selectedIndex;
    return <button
      key={entry.kind + '_' + (entry.item.id || entry.item.label)}
      type="button"
      className={cx('cmdItem', accentClass, isSelected && 'cmdItemSelected')}
      onClick={function(){ runItem(entry); }}
      onMouseEnter={function(){ setSelectedIndex(idx); }}>
      <span className="cmdItemIcon">{iconNode}</span>
      <span className="cmdItemText">
        <strong>{entry.item.label}</strong>
        <span>{entry.item.desc}</span>
      </span>
      {isSelected && <span className="cmdItemEnter" aria-hidden="true">↵</span>}
    </button>;
  };

  return <div className="cmdBackdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Command palette">
    <div className="cmdPalette" onClick={function(e){ e.stopPropagation(); }}>
      <div className="cmdInputWrap">
        <svg className="cmdInputIcon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          ref={inputRef}
          className="cmdInput"
          value={query}
          onChange={function(e){ setQuery(e.target.value); }}
          placeholder={cmdPlaceholder}
          aria-label="Command palette search"
          spellCheck="false"
          autoComplete="off"
        />
        <kbd className="cmdEsc" aria-hidden="true">Esc</kbd>
      </div>
      <div className="cmdResults">
        {filteredActions.length > 0 && <div className="cmdGroup">
          <p className="cmdGroupLabel">Quick actions</p>
          {filteredActions.map(function(a){
            return renderItem({ kind: 'action', item: a },
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
              null);
          })}
        </div>}
        {filteredPages.length > 0 && <div className="cmdGroup">
          <p className="cmdGroupLabel">Jump to page</p>
          {filteredPages.map(function(p){
            return renderItem({ kind: 'page', item: p },
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
              null);
          })}
        </div>}
        {filteredAi.length > 0 && <div className="cmdGroup">
          <p className="cmdGroupLabel">Opriva AI</p>
          {filteredAi.map(function(a){
            return renderItem({ kind: 'ai', item: a },
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/></svg>,
              'cmdItemAi');
          })}
        </div>}
        {noResults && <div className="cmdEmpty">
          <strong>No matches</strong>
          <span>Try searching for a record, company or page</span>
        </div>}
      </div>
      <div className="cmdFooter">
        <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
        <span><kbd>↵</kbd> Open</span>
        <span><kbd>Esc</kbd> Close</span>
      </div>
    </div>
  </div>;
}

// Local Sandbox banner — discreet, enterprise, non-alarmist. Renders once below
// the topbar (inside the workspace section, outside modals/drawers). When a real
// backend exists this can be hidden behind a flag (e.g. an OPRIVA_LOCAL_SANDBOX
// env/setting) or removed entirely; it intentionally has no dependencies on
// import logic, backend or templates.
const SHOW_LOCAL_SANDBOX_BANNER = true;
function LocalSandboxBanner(){
  if (!SHOW_LOCAL_SANDBOX_BANNER) return null;
  return <div className="localSandboxBanner" role="status" aria-label="Local sandbox notice">
    <span className="localSandboxDot" aria-hidden="true"></span>
    <span className="localSandboxText">
      <strong>Local Sandbox</strong> — data is stored only in this browser session and may reset on refresh. Do not use real customer data.
    </span>
  </div>;
}

function TopbarShell({ active, onAlerts, onOpenCommand, onMenuToggle, onNavigate, workspaceMode = 'MSP / Integrator', setWorkspaceMode = function(){} }){
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = React.useState(false);
  const [newMenuOpen, setNewMenuOpen] = React.useState(false);
  const workspaceWrapRef = React.useRef(null);
  const newWrapRef = React.useRef(null);

  const workspaceModes = ['MSP / Integrator', 'Internal IT', 'Hybrid', 'Custom'];
  const workspaceLabels = {
    'MSP / Integrator': 'Nextcom MSP Workspace',
    'Internal IT': 'Grupo Regency Workspace',
    Hybrid: 'Hybrid Operations Workspace',
    Custom: 'Custom Operating Model'
  };
  const workspaceLabel = workspaceLabels[workspaceMode] || workspaceLabels['MSP / Integrator'];

  React.useEffect(() => {
    const onDocClick = (e) => {
      if (workspaceWrapRef.current && !workspaceWrapRef.current.contains(e.target)) setWorkspaceMenuOpen(false);
      if (newWrapRef.current && !newWrapRef.current.contains(e.target)) setNewMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') { setWorkspaceMenuOpen(false); setNewMenuOpen(false); } };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onKey); };
  }, []);

  const toggleWorkspace = () => { setNewMenuOpen(false); setWorkspaceMenuOpen(o => !o); };
  const toggleNew = () => { setWorkspaceMenuOpen(false); setNewMenuOpen(o => !o); };
  const goTo = (id) => { if (onNavigate) onNavigate(id); setNewMenuOpen(false); };

  return <header className="topbar">
    <button className="mobileHamburger" type="button" onClick={onMenuToggle} aria-label="Open menu">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>

    <div className="tenantLockupWrap" ref={workspaceWrapRef}>
      <button className={cx('tenantLockup', workspaceMenuOpen && 'tenantLockupOpen')} type="button" onClick={toggleWorkspace} aria-expanded={workspaceMenuOpen} aria-haspopup="menu">
        <span className="tenantLogo">B</span>
        <span className="tenantName">{workspaceLabel}</span>
        <svg className="tenantChevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {workspaceMenuOpen && <div className="topMenu workspaceMenu" role="menu">
        <div className="topMenuHeader">
          <strong>{workspaceLabel}</strong>
          <small>{workspaceMode} mode</small>
        </div>
        <button type="button" className="topMenuItem" onClick={() => { setWorkspaceMenuOpen(false); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c2.5-2.5 4-5.5 4-9m-4 9c-2.5-2.5-4-5.5-4-9m4-9c2.5 2.5 4 5.5 4 9m-4-9c-2.5 2.5-4 5.5-4 9"/></svg>
          Switch workspace
        </button>
        <button type="button" className="topMenuItem" onClick={() => { setWorkspaceMenuOpen(false); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg>
          Manage workspaces
        </button>
        <button type="button" className="topMenuItem" onClick={() => { setWorkspaceMenuOpen(false); goTo('Settings'); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Workspace settings
        </button>
      </div>}
    </div>


      <label
        className="workspaceModePill"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 999, background: '#FFFFFF', color: '#64748B', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(15,35,65,.03)' }}
        aria-label="Temporary workspace mode selector"
        title="Temporary design preview. In production, workspace mode is selected during onboarding and managed in Settings → Operating Model."
      >
        <span style={{ color: '#94A3B8', fontWeight: 700 }}>Mode:</span>
        <select
          value={workspaceMode}
          onChange={(event) => setWorkspaceMode(event.target.value)}
          style={{ border: 0, outline: 'none', background: 'transparent', color: '#475569', font: 'inherit', fontSize: 12, fontWeight: 750, padding: 0, maxWidth: 128, cursor: 'pointer' }}
        >
          {workspaceModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
        </select>
      </label>

    <div className="topSpacer" aria-hidden="true"></div>

    <button type="button" className="topSearchTrigger" onClick={onOpenCommand} aria-label="Open command palette">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <span className="topSearchTriggerLabel">Search</span>
      <kbd className="topSearchTriggerKbd" aria-hidden="true">⌘K</kbd>
    </button>

    <button className="mobileSearchIcon" type="button" onClick={onOpenCommand} aria-label="Search">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    </button>

    <div className="topMenuWrap" ref={newWrapRef}>
      <button type="button" className={cx('topActionNew', newMenuOpen && 'topActionNewOpen')} onClick={toggleNew} aria-expanded={newMenuOpen} aria-haspopup="menu">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        <span className="topActionNewLabel">New</span>
        <svg className="topActionNewChev" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {newMenuOpen && <div className="topMenu newMenu" role="menu">
        <div className="topMenuHeader">
          <strong>Create new</strong>
          <small>Quick create from any page</small>
        </div>
        <button type="button" className="topMenuItem" onClick={() => goTo('Expirations')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
          Record / Expiration
        </button>
        <button type="button" className="topMenuItem" onClick={() => goTo('Licenses')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          License
        </button>
        <button type="button" className="topMenuItem" onClick={() => goTo('Contracts')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/></svg>
          Contract
        </button>
        <button type="button" className="topMenuItem" onClick={() => goTo('Documents')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          Upload document
        </button>
        <button type="button" className="topMenuItem" onClick={() => goTo('Tasks')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          Task
        </button>
        <button type="button" className="topMenuItem" onClick={() => goTo('Companies / Clients')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/></svg>
          Company / Client
        </button>
      </div>}
    </div>

    <button type="button" className="topActionBtn topActionAlerts" onClick={onAlerts} aria-label="9 alerts">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
      <span className="topActionAlertsBadge" aria-hidden="true">9</span>
    </button>

    <span className="topRightDivider" aria-hidden="true"></span>

    <button type="button" className="avatar" aria-label="Account menu">MC</button>
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
    <span className={cx('agentTip', idleNudgeVisible && 'isVisible')} role="status">Opriva AI preview — sample guidance for this sandbox.</span>
    <button className="agentButton" onClick={onClick} aria-label="Open Opriva AI Assistant" title="Open Opriva AI" type="button">
      <OprivaAgentMark open={isOpen} eyeFollowsCursor={eyeFollowsCursor} blinkSignal={blinkSignal} />
    </button>
  </div>;
}

function OprivaDrawer({ active, onClose, eyeFollowsCursor, setEyeFollowsCursor }){
  const suggestions = ['What needs attention today?', 'Find missing owners', 'Draft follow-up email'];
  return <aside className="aiDrawer" aria-label="Opriva AI drawer">
    <div className="drawerHeader"><div><h2>Opriva AI <span style={{fontSize:10,fontWeight:800,color:'#92400E',background:'#FEF3C7',border:'1px solid #FDE68A',borderRadius:999,padding:'1px 7px',marginLeft:6,verticalAlign:'middle',textTransform:'uppercase',letterSpacing:'.04em'}}>Preview</span></h2><p>Context: {active}</p></div><button onClick={onClose} type="button" aria-label="Close Opriva AI">×</button></div>
    <p style={{margin:'0 0 4px',fontSize:11,color:'#92400E',background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:8,padding:'6px 9px',lineHeight:1.4}}>Preview: responses are sample/scripted in this sandbox. Real AI actions require backend, permissions and audit trail.</p>
    <p className="drawerText">Ask about renewals, risks, missing data or next actions.</p>
    <input className="drawerInput" placeholder="Ask Opriva AI (preview — coming soon)" aria-label="Ask Opriva AI (preview, disabled)" disabled aria-disabled="true" style={{opacity:0.6,cursor:'not-allowed'}} />
    <div className="suggestions">{suggestions.map(item => <button key={item} type="button" disabled aria-disabled="true" title="Preview — coming soon" style={{opacity:0.6,cursor:'not-allowed'}}>{item}</button>)}</div>
    <div className="agentSettings" aria-label="Opriva AI Operator settings"><label><input type="checkbox" checked={eyeFollowsCursor} onChange={event => setEyeFollowsCursor(event.target.checked)} /><span>Eye follows cursor</span></label></div>
    <p className="meta">418 expirations · 74 open tasks · 41 missing documents</p>
  </aside>;
}


function LicensePortfolioScreen({ workspaceMode = 'MSP / Integrator' }){
  const isInternalIT = workspaceMode === 'Internal IT';
  const licenseNote = isInternalIT
    ? 'Track internal licenses, providers, departments, renewal dates, approval status, budget exposure and ownership.'
    : workspaceMode === 'MSP / Integrator'
    ? 'Track client licenses, renewal dates, distributor relationships, value, margin and commercial ownership.'
    : 'Track licenses, renewal dates, ownership and risk across the workspace.';
  const licenseTabs = isInternalIT
    ? ['All','Expiring soon','CIO approval needed','Missing evidence','Unassigned']
    : ['All','Expiring soon','High margin risk','Missing document','Unassigned'];
  const licenseColumns = isInternalIT
    ? ['License / Product','Brand','Provider','Department','Quantity','Renewal','Value','Approval status','Owner','Status','Action']
    : ['License / Product','Client','Brand','Distributor','Quantity','Renewal','Value','Margin','Owner','Status','Action'];
  const licenseAi = isInternalIT
    ? 'Opriva AI can identify expiring licenses, approval blockers and missing evidence across IT departments.'
    : 'Opriva AI can identify margin risks, expiring client licenses and missing renewal documents across your portfolio.';
  const licensePlaceholder = isInternalIT
    ? 'Filter licenses by brand, provider, department, owner or approval status…'
    : 'Filter licenses by client, brand, distributor, owner or status…';
  const licenseRows = isInternalIT ? licensesInternalIT : licensesMsp;
  const licenseTitle = isInternalIT ? 'Internal License Portfolio' : workspaceMode === 'MSP / Integrator' ? 'Client License Portfolio' : 'License Portfolio';
  return <OperationalList active={licenseTitle} note={licenseNote} tabs={licenseTabs} columns={licenseColumns} ai={licenseAi} placeholder={licensePlaceholder} rows={licenseRows} workspaceMode={workspaceMode}/>;
}

function MspVendorIntelligenceScreen(){
  const rows = [
    { brand: 'Microsoft', category: 'Productivity / SaaS', distributor: 'Licencias Online', clients: 'Grupo Regency, Banisi', records: '18', renewalValue: '$220K', costExposure: '$184K', marginExposure: '$36K', risk: 'Medium', action: 'Prepare renewal' },
    { brand: 'Fortinet', category: 'Network Security', distributor: 'Ingram Micro', clients: 'Banisi, Retail accounts', records: '12', renewalValue: '$96K', costExposure: '$78K', marginExposure: '$18K', risk: 'Medium', action: 'Request quote' },
    { brand: 'Trend Micro', category: 'Cybersecurity', distributor: 'TD Synnex', clients: 'Banisi, Enterprise accounts', records: '9', renewalValue: '$118K', costExposure: '$91K', marginExposure: '$27K', risk: 'High', action: 'Review credits' },
    { brand: 'Dell', category: 'Hardware / Warranty', distributor: 'Dell Direct / Ingram Micro', clients: 'Multiple clients', records: '14', renewalValue: '$145K', costExposure: '$121K', marginExposure: '$24K', risk: 'Medium', action: 'Validate warranty' },
    { brand: 'DigiCert', category: 'Certificates', distributor: 'Intcomex', clients: 'Multiple clients', records: '6', renewalValue: '$18K', costExposure: '$13K', marginExposure: '$5K', risk: 'Critical', action: 'Renew certificates' }
  ];
  return <main className="content assetsRenewalsPage">
    <ScreenHeader active="Vendor Intelligence" eyebrow="MSP / INTEGRATOR VENDORS" subtitle="Track technology brands, upstream distributors, client exposure and margin at risk across managed renewals."><button>Import vendors</button><button>Configure columns</button><button className="primary">New vendor record</button></ScreenHeader>
    <section className="panel renewalWorklistPanel"><div className="panelTitle"><h2>Vendor intelligence</h2><span>MSP view of brands, distributors, client coverage, renewal value, cost exposure and margin exposure.</span></div><div className="tableWrap renewalWorklistWrap"><table className="renewalWorklistTable vendorIntelligenceTable"><thead><tr>{['Brand','Category','Distributor','Clients','Active records','90-day renewal value','Cost exposure','Margin exposure','Risk','Next action'].map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.brand}><td className="renewalRecordCell"><strong>{row.brand}</strong></td><td>{row.category}</td><td>{row.distributor}</td><td>{row.clients}</td><td>{row.records}</td><td className="valueCell">{row.renewalValue}</td><td className="valueCell">{row.costExposure}</td><td className="valueCell">{row.marginExposure}</td><td className="statusCell"><Badge tone={row.risk}>{row.risk}</Badge></td><td className="actionCell"><button type="button" className="rowAction">{row.action}</button></td></tr>)}</tbody></table></div></section>
  </main>;
}


function VendorIntelligenceScreen(){

  const rows = [
    { brand: 'Microsoft', category: 'Productivity / SaaS', provider: 'Nextcom', departments: 'Finance, Corporate IT, Digital Channels', records: '12', exposure: '$142K', renewals: '3', risk: 'Medium', action: 'Prepare renewal' },
    { brand: 'Oracle', category: 'POS / Support', provider: 'Oracle Direct / Nextcom', departments: 'Retail Operations, Operations', records: '8', exposure: '$96K', renewals: '2', risk: 'High', action: 'Review contract' },
    { brand: 'Kaspersky', category: 'Endpoint Security', provider: 'Local Security Provider', departments: 'IT Security', records: '5', exposure: '$82K', renewals: '1', risk: 'High', action: 'Compare consolidation' },
    { brand: 'Broadcom / Symantec', category: 'Endpoint Security', provider: 'Legacy reseller', departments: 'Finance', records: '4', exposure: '$52K', renewals: '1', risk: 'High', action: 'Evaluate overlap' },
    { brand: 'Trellix / McAfee', category: 'Endpoint Security', provider: 'Regional reseller', departments: 'Logistics, IT Security', records: '4', exposure: '$41.8K', renewals: '1', risk: 'High', action: 'Consolidation candidate' },
    { brand: 'Fortinet', category: 'Network Security', provider: 'Nextcom', departments: 'Infrastructure', records: '6', exposure: '$48K', renewals: '2', risk: 'Medium', action: 'Request quote' },
    { brand: 'DigiCert', category: 'Certificates', provider: 'Nextcom', departments: 'Digital Channels, Finance', records: '3', exposure: '$3.2K', renewals: '1', risk: 'Critical', action: 'Renew certificate' },
    { brand: 'Cloud Storage Platform', category: 'Cloud Service', provider: 'Cloud Provider Direct', departments: 'Operations, Corporate IT', records: '7', exposure: '$119K', renewals: '2', risk: 'Medium', action: 'Review usage' }
  ];
  return <main className="content assetsRenewalsPage">
    <ScreenHeader active="Vendor Intelligence" eyebrow="INTERNAL IT VENDORS" subtitle="Separate technology brands from the providers and resellers managing spend, renewals and approvals."><button>Import vendors</button><button>Configure columns</button><button className="primary">New vendor record</button></ScreenHeader>
    <section className="panel aiInsightBar assetsInsightBar"><p><strong>AI Insight (sample)</strong> Opriva separates technology brands from providers. Microsoft may be the brand in use, while Nextcom can be the provider managing the renewal. This helps IT compare spend by brand, provider and department before approval.</p><div className="compactActions"><button>Compare spend</button><button>Review providers</button><button>Prepare approval</button></div></section>
    <section className="panel renewalWorklistPanel"><div className="panelTitle"><h2>Vendor intelligence</h2><span>Internal IT view of brands, providers, department usage, renewal exposure and next actions.</span></div><div className="tableWrap renewalWorklistWrap"><table className="renewalWorklistTable vendorIntelligenceTable"><thead><tr>{['Brand','Category','Provider','Departments','Active records','90-day exposure','Renewals','Risk','Next action'].map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.brand}><td className="renewalRecordCell"><strong>{row.brand}</strong></td><td>{row.category}</td><td>{row.provider}</td><td>{row.departments}</td><td>{row.records}</td><td className="valueCell">{row.exposure}</td><td>{row.renewals}</td><td className="statusCell"><Badge tone={row.risk}>{row.risk}</Badge></td><td className="actionCell"><button type="button" className="rowAction">{row.action}</button></td></tr>)}</tbody></table></div></section>
  </main>;
}

function AssetsRenewalsScreen({ workspaceMode = 'MSP / Integrator' }){
  const isInternalIT = workspaceMode === 'Internal IT';
  const importedRenewalRows = getImportedRenewalRows(workspaceMode);
  const baseRows = isInternalIT ? [
    { record: 'Kaspersky Endpoint Security', type: 'License', brand: 'Kaspersky', provider: 'Local Security Provider', department: 'IT Security', expiry: 'Jun 22, 2026', amount: '$82,000', approval: 'Approval needed', risk: 'High', action: 'Compare consolidation' },
    { record: 'Symantec Endpoint Protection', type: 'License', brand: 'Broadcom / Symantec', provider: 'Legacy reseller', department: 'Finance', expiry: 'Jun 30, 2026', amount: '$52,000', approval: 'Pending', risk: 'High', action: 'Evaluate overlap' },
    { record: 'McAfee Endpoint Security', type: 'License', brand: 'Trellix / McAfee', provider: 'Regional reseller', department: 'Logistics', expiry: 'Jul 5, 2026', amount: '$41,800', approval: 'Approval needed', risk: 'High', action: 'Consolidation candidate' },
    { record: 'Microsoft 365 Enterprise', type: 'SaaS', brand: 'Microsoft', provider: 'Nextcom', department: 'Finance', expiry: 'Jun 30, 2026', amount: '$142,000', approval: 'Pending', risk: 'Medium', action: 'Prepare renewal' },
    { record: 'Oracle POS Support', type: 'Support', brand: 'Oracle', provider: 'Oracle Direct / Nextcom', department: 'Retail Operations', expiry: 'Jul 18, 2026', amount: '$96,000', approval: 'Pending', risk: 'High', action: 'Review contract' },
    { record: 'Fortinet Firewall Warranty', type: 'Warranty', brand: 'Fortinet', provider: 'Nextcom', department: 'Infrastructure', expiry: 'Jul 5, 2026', amount: '$48,000', approval: 'Approved', risk: 'Medium', action: 'Request renewal quote' },
    { record: 'SSL Wildcard Certificate', type: 'Certificate', brand: 'DigiCert', provider: 'Nextcom', department: 'Digital Channels', expiry: 'May 23, 2026', amount: '$3,200', approval: 'Approval needed', risk: 'Critical', action: 'Renew certificate' },
    { record: 'Cloud Storage Platform', type: 'Cloud service', brand: 'Cloud Storage Platform', provider: 'Cloud Provider Direct', department: 'Operations', expiry: 'Aug 10, 2026', amount: '$119,000', approval: 'Pending', risk: 'Medium', action: 'Review usage forecast' }
  ] : [
    { record: 'Dell Support Contract', type: 'Contract', vendor: 'Dell', expiry: 'May 26, 2026', days: '12 days', value: '$42,800', owner: 'Unassigned', status: 'Critical', action: 'Assign owner' },
    { record: 'Microsoft 365 Renewal', type: 'License', vendor: 'Microsoft', expiry: 'Jun 1, 2026', days: '18 days', value: '$31,200', owner: 'Ana Ruiz', status: 'High', action: 'Prepare renewal' },
    { record: 'Fortinet Warranty', type: 'Warranty', vendor: 'Fortinet', expiry: 'Jun 7, 2026', days: '24 days', value: '$18,600', owner: 'Luis Mora', status: 'High', action: 'Request quote' },
    { record: 'SSL Wildcard Certificate', type: 'Certificate', vendor: 'DigiCert', expiry: 'May 23, 2026', days: '9 days', value: '$3,200', owner: 'Unassigned', status: 'Critical', action: 'Prepare renewal' },
    { record: 'Adobe Creative Cloud', type: 'SaaS', vendor: 'Adobe', expiry: 'Jun 11, 2026', days: '28 days', value: '$9,800', owner: 'Carlos Vega', status: 'Medium', action: 'Review usage' },
    { record: 'HPE Server Warranty', type: 'Warranty', vendor: 'HPE', expiry: 'Jul 18, 2026', days: '65 days', value: '$22,400', owner: 'Maria Chen', status: 'Medium', action: 'Schedule review' },
    { record: 'Veeam Backup Renewal', type: 'License', vendor: 'Veeam', expiry: 'Aug 4, 2026', days: '82 days', value: '$14,900', owner: 'Diego Paredes', status: 'Low', action: 'Monitor' }
  ];
  const rows = importedRenewalRows.length ? importedRenewalRows : baseRows;
  const tabs = isInternalIT ? ['All','Approval required','Next 30 days','Next 90 days','By department','Consolidation candidates'] : ['All','Critical','30 days','60 days','Missing owner','Expired'];
  const filters = isInternalIT ? ['Type','Department','Provider','Approval','Saved view: CIO forecast'] : ['Type','Owner','Vendor','Status','Saved view: Operational risk'];
  const stats = isInternalIT ? [
    ['90-day forecast', '$487K', 'Upcoming IT renewal exposure'],
    ['Approval required', '5 renewals', 'Budget or CIO decision pending'],
    ['Departments impacted', '8', 'Business areas in forecast window'],
    ['Consolidation candidates', '3', 'Endpoint security overlap detected']
  ] : null;
  return <main className="content assetsRenewalsPage">
    <ScreenHeader active={isInternalIT ? 'Renewals Forecast' : 'Assets & Renewals'} eyebrow={isInternalIT ? 'RENEWALS FORECAST' : 'RENEWAL WORKLIST'} subtitle={isInternalIT ? 'Forecast upcoming IT renewals, department impact, brand/provider concentration and approval risk before spend becomes urgent.' : 'Manage tracked assets, licenses, contracts, warranties, SaaS subscriptions and certificates by urgency, value and ownership.'}>{isInternalIT ? <><button>Import records</button><button>Configure forecast</button><button className="primary">New renewal</button></> : <><button>Import records</button><button>Configure columns</button><button className="primary">New record</button></>}</ScreenHeader>
    {isInternalIT && <><section className="statsGrid renewalForecastStats">{stats.map(stat => <div className="statCard" key={stat[0]}><span>{stat[0]}</span><strong>{stat[1]}</strong><p>{stat[2]}</p></div>)}</section><p style={{margin:'2px 0 0',fontSize:11,color:'#94A3B8'}}>Sample data — not live metrics.</p></>}
    <div className="tabs assetsTabs" role="tablist" aria-label="Renewal worklist filters">{tabs.map((tab,index)=><button key={tab} className={index===0?'active':''}>{tab}</button>)}</div>
    <section className="panel renewalControlsPanel">
      <div className="toolbar assetsFilterRow"><input aria-label="Filter renewal records" placeholder={isInternalIT ? 'Filter renewals by record, provider, department, approval status or risk...' : 'Filter by record, vendor, owner, type or status...'} />{filters.map(filter=><button key={filter}>{filter}</button>)}</div>
    </section>
    {isInternalIT ? <section className="panel aiInsightBar assetsInsightBar"><p><strong>AI Insight (sample)</strong> Opriva detected $487K in upcoming IT renewals across 8 departments. Endpoint security shows provider overlap across Kaspersky, Symantec and McAfee. Review consolidation candidates before CIO approval.</p><div className="compactActions"><button>Review approvals</button><button>View consolidation</button><button>Prepare CIO report</button></div></section> : <section className="panel aiInsightBar assetsInsightBar"><p><strong>AI Insight (sample)</strong> Opriva found 12 records entering a critical renewal window and 18 records without an assigned owner. Start by assigning owners to high-value records expiring in the next 30 days.</p><div className="compactActions"><button>Assign owners</button><button>Review critical</button><button>Prepare emails</button></div></section>}
    <section className="panel renewalWorklistPanel"><div className="panelTitle"><h2>{isInternalIT ? 'Renewals forecast' : 'Renewal worklist'}</h2><span>{isInternalIT ? 'Internal IT renewals prioritized by budget impact, department, brand/provider concentration and approval blockers.' : 'All tracked records prioritized by expiry date, financial exposure and ownership gaps.'}</span></div>{importedRenewalRows.length > 0 && <p style={{margin:'-6px 0 10px',color:'#64748B',fontSize:12,lineHeight:1.45}}>Showing local sandbox records. Demo data is used only when no local records exist.</p>}<div className="tableWrap renewalWorklistWrap"><table className="renewalWorklistTable"><thead><tr>{(isInternalIT ? ['Record','Type','Brand','Provider','Department','Renewal date','Forecasted amount','Approval','Risk','Recommended action'] : ['Record','Type','Vendor','Expiry date','Days left','Value','Owner','Status','Recommended action']).map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{isInternalIT ? rows.map(row=><tr key={row.record}><td className="renewalRecordCell"><strong>{row.record}</strong></td><td>{row.type}</td><td>{row.brand}</td><td>{row.provider}</td><td>{row.department}</td><td className="dateCell">{row.expiry}</td><td className="valueCell">{row.amount}</td><td className="ownerCell">{row.approval}</td><td className="statusCell"><Badge tone={row.risk}>{row.risk}</Badge></td><td className="actionCell"><button type="button" className="rowAction">{row.action}</button></td></tr>) : rows.map(row=><tr key={row.record}><td className="renewalRecordCell"><strong>{row.record}</strong></td><td>{row.type}</td><td>{row.vendor}</td><td className="dateCell">{row.expiry}</td><td className="daysCell">{row.days}</td><td className="valueCell">{row.value}</td><td className="ownerCell">{row.owner==='Unassigned' ? <Badge tone="Warning">Unassigned</Badge> : row.owner}</td><td className="statusCell"><Badge tone={row.status}>{row.status}</Badge></td><td className="actionCell"><button type="button" className="rowAction">{row.action}</button></td></tr>)}</tbody></table></div></section>
  </main>;
}


const assetsRenewalsStyles = `
.assetsRouteActive .agentWrap{right:12px;bottom:32px}
.assetsRouteActive .navGroup button:not(.active):hover{background:rgba(255,255,255,.025);color:#DDE8F7}
.renewalForecastStats{grid-template-columns:repeat(4,minmax(0,1fr))}.renewalPlanningPanel{display:grid;gap:2px}.renewalPlanningGrid .settingItem{min-height:104px;border-color:#E6ECF3;background:#FFFFFF}.renewalPlanningGrid .settingItem:hover{border-color:#DDEFEA;background:#FCFFFE}.renewalWorklistTable{min-width:1180px}.renewalWorklistTable th,.renewalWorklistTable td{padding:12px 13px}.renewalRecordCell strong{color:#10223B}.assetsInsightBar p{margin:0;line-height:1.55;color:#334155;flex:1;min-width:min(540px,100%)}.assetsTabs{overflow-x:auto}.assetsTabs button{white-space:nowrap}@media(max-width:1180px){.renewalForecastStats{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:720px){.renewalForecastStats{grid-template-columns:1fr}.assetsInsightBar{align-items:flex-start}.assetsInsightBar p{min-width:0}.renewalWorklistTable{min-width:1080px}}
`;


const sidebarCollapseStyles = `
@media (min-width: 1051px){
  .appSidebarCollapsed{grid-template-columns:86px 1fr}
  .sidebar{transition:width .22s ease, padding .22s ease}
  .sidebar .brand{position:relative}
  .sidebarCollapseBtn{appearance:none;position:absolute;right:-8px;top:50%;transform:translateY(-50%);width:24px;height:24px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(11,31,58,.72);color:#BFD3E8;display:inline-flex;align-items:center;justify-content:center;font-size:18px;line-height:1;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(0,0,0,.16);transition:background .16s ease,color .16s ease,border-color .16s ease}
  .sidebarCollapseBtn:hover{background:rgba(13,148,136,.18);color:#E7FFFA;border-color:rgba(45,212,191,.28)}
  .sidebarCollapseBtn:focus-visible{outline:2px solid rgba(45,212,191,.75);outline-offset:2px}
  .sidebarCollapsed{width:86px;padding:18px 12px;overflow:visible}
  .sidebarCollapsed .brand{justify-content:center;margin-bottom:20px;padding-bottom:18px}
  .sidebarCollapsed .brand svg{width:36px;height:36px;flex:0 0 auto}
  .sidebarCollapsed .brandCopy,.sidebarCollapsed .navGroup p,.sidebarCollapsed .navLabel{display:none}
  .sidebarCollapsed nav{display:flex;flex-direction:column;gap:12px;align-items:center}
  .sidebarCollapsed .navGroup{width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;margin:0}
  .sidebarCollapsed .navGroup button{position:relative;width:46px;height:42px;padding:0;border-radius:13px;display:inline-flex;align-items:center;justify-content:center;overflow:visible}
  .navIcon{display:none;align-items:center;justify-content:center;flex:0 0 auto;color:inherit}
  .sidebarCollapsed .navIcon{display:inline-flex}
  .sidebarCollapsed .navGroup button.active{background:rgba(13,148,136,.22);box-shadow:inset 0 0 0 1px rgba(45,212,191,.18);color:#F8FAFC}
  .sidebarCollapsed .navTooltip{position:absolute;left:calc(100% + 12px);top:50%;transform:translateY(-50%) translateX(-4px);opacity:0;pointer-events:none;background:#0B1F3A;color:#F8FAFC;border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:7px 9px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 14px 34px rgba(7,17,31,.22);z-index:40;transition:opacity .14s ease,transform .14s ease}
  .sidebarCollapsed .navGroup button:hover .navTooltip,.sidebarCollapsed .navGroup button:focus-visible .navTooltip{opacity:1;transform:translateY(-50%) translateX(0)}
}
@media (max-width: 1050px){.sidebarCollapseBtn{display:none}.navIcon{display:none}}
`;

function App(){
  const [active, setActive] = React.useState('Dashboard');
  const [aiOpen, setAiOpen] = React.useState(false);
  const [eyeFollowsCursor, setEyeFollowsCursor] = React.useState(true);
  const [workspaceMode, setWorkspaceMode] = React.useState('MSP / Integrator');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const handleSelect = (item) => { setActive(item); setSidebarOpen(false); };
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
  const route = active === 'Search' ? <SearchScreen/> : active === 'Dashboard' ? <Dashboard workspaceMode={workspaceMode} setWorkspaceMode={setWorkspaceMode}/> : active === 'Attention Center' ? <AttentionCenter workspaceMode={workspaceMode}/> : active === 'Companies / Clients' ? <CompaniesScreen workspaceMode={workspaceMode}/> : active === 'Settings' ? <Settings workspaceMode={workspaceMode} setWorkspaceMode={setWorkspaceMode}/> : active === 'Expirations' ? <AssetsRenewalsScreen workspaceMode={workspaceMode}/> : active === 'Licenses' ? <LicensePortfolioScreen workspaceMode={workspaceMode}/> : active === 'Hardware' ? <HardwareScreen workspaceMode={workspaceMode}/> : active === 'Contracts' ? <ContractsScreen workspaceMode={workspaceMode}/> : active === 'Documents' ? <DocumentsScreen workspaceMode={workspaceMode}/> : active === 'Tasks' ? <TasksScreen workspaceMode={workspaceMode}/> : active === 'Reports' ? <ReportsScreen workspaceMode={workspaceMode}/> : active === 'Data Import' ? <DataImportScreen workspaceMode={workspaceMode}/> : <Dashboard workspaceMode={workspaceMode} setWorkspaceMode={setWorkspaceMode}/>;
  return <div className={cx('app', sidebarCollapsed && 'appSidebarCollapsed', active === 'Expirations' && 'assetsRouteActive', active === 'Search' && 'searchRouteActive')}>
    <style>{styles + aiStyles + livingAgentStyles + oprivaUpgradeStyles + assetsRenewalsStyles + sidebarCollapseStyles + aiSettingsFixStyles + settingsAdminOverrideStyles + settingsDirectoryOverrideStyles + settingsHubDirectoryStyles + responsiveStyles + commandPaletteStyles}</style>
    <SidebarShell active={active} onSelect={handleSelect} open={sidebarOpen} onClose={() => setSidebarOpen(false)} workspaceMode={workspaceMode} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(value => !value)} />
    <div className={cx('sidebarBackdrop', sidebarOpen && 'sidebarBackdropOpen')} onClick={() => setSidebarOpen(false)} aria-hidden="true"></div>
    <section className="workspace"><TopbarShell active={active} onAlerts={() => setActive('Attention Center')} onOpenCommand={() => setCommandOpen(true)} onMenuToggle={() => setSidebarOpen(true)} onNavigate={setActive} workspaceMode={workspaceMode} setWorkspaceMode={setWorkspaceMode} /><LocalSandboxBanner />{route}</section>
    <FloatingOprivaAgentButton isOpen={aiOpen} onClick={() => setAiOpen(true)} eyeFollowsCursor={eyeFollowsCursor} />
    {aiOpen && <OprivaDrawer active={active} onClose={() => setAiOpen(false)} eyeFollowsCursor={eyeFollowsCursor} setEyeFollowsCursor={setEyeFollowsCursor} />}
    <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} onNavigate={(id) => setActive(id)} onOpenAi={() => setAiOpen(true)} workspaceMode={workspaceMode} />
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
:root{--accent:var(--ocd-tweak-accent-color,#2563EB);--density:var(--ocd-tweak-panel-density,1);--risk:var(--ocd-tweak-risk-emphasis,1);--navy:#0B1F3A;--bg:#F7F9FC;--card:#FFFFFF;--text:#111827;--muted:#6B7280;--border:#E5E7EB;--teal:#0D9488}*{box-sizing:border-box}body{margin:0;background:var(--bg);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text)}button,input{font:inherit}button{border:1px solid var(--border);background:#fff;color:#243247;border-radius:10px;padding:9px 12px;font-weight:700;cursor:pointer}button:hover{border-color:#D6DEE9;background:#FAFCFF;box-shadow:0 1px 4px rgba(15,35,65,.025)}.app{min-height:100vh;display:grid;grid-template-columns:264px 1fr}.sidebar{background:var(--navy);color:#DDE8F7;padding:18px 14px;display:flex;flex-direction:column;gap:22px}.brand{display:flex;gap:12px;align-items:center;padding:8px 8px 14px;border-bottom:1px solid rgba(255,255,255,.12)}.mark{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#2DD4BF,#2563EB);display:grid;place-items:center;color:white;font-weight:900}.brand strong{display:block;letter-spacing:.14em;font-size:13px}.brand span{display:block;color:#8EA2BC;font-size:12px;margin-top:2px}.navGroup{display:grid;gap:5px;margin-bottom:18px}.navGroup p{margin:0 8px 6px;color:#8EA2BC;font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:850}.navGroup button{width:100%;text-align:left;background:transparent;border-color:transparent;color:#C9D6E6;border-radius:10px;padding:9px 10px;font-size:14px}.navGroup button:hover{background:rgba(255,255,255,.055);color:#F8FAFC;border-color:transparent}.navGroup button.active{background:rgba(255,255,255,.085);color:#fff;border-color:rgba(255,255,255,.055)}.workspace{min-width:0;display:flex;flex-direction:column}.topbar{height:64px;background:rgba(255,255,255,.86);backdrop-filter:blur(14px);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;padding:0 22px;position:sticky;top:0;z-index:10}.topbar div:first-child{margin-right:auto}.topbar span{display:block;color:var(--muted);font-size:12px}.topbar strong{font-size:14px}.topSearch{min-width:260px;text-align:left;color:#6B7280;background:#F8FAFC}.alertBtn{background:#FFF7ED;border-color:#FED7AA;color:#9A3412}.aiBtn{background:#F7FAFF;border-color:#D8E6FB;color:#1E4FB8}.avatar{width:32px;height:32px;border-radius:999px;background:#EAF2FF;color:#1D4ED8;display:inline-grid;place-items:center;font-size:12px;font-weight:900}.content{padding:28px;display:grid;gap:18px}.screenHeader{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.screenHeader p{margin:0 0 6px;color:var(--teal);text-transform:uppercase;font-size:11px;letter-spacing:.14em;font-weight:900}.screenHeader h1{margin:0;color:#0F2138;font-size:clamp(26px,3vw,38px);letter-spacing:-.045em}.screenHeader span{display:block;margin-top:6px;color:#66758A;max-width:720px}.headerActions{display:flex;gap:10px}.primary{background:var(--accent);border-color:var(--accent);color:#fff}.primary:hover{background:#1D4ED8;border-color:#1D4ED8;color:#fff;box-shadow:0 2px 8px rgba(37,99,235,.28)}.statsGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.statCard,.panel,.settingsSearch,.settingsGroup{background:var(--card);border:1px solid var(--border);border-radius:18px;box-shadow:0 12px 30px rgba(15,35,65,.045)}.statCard{padding:18px}.statCard span{color:#66758A;font-size:13px}.statCard strong{display:block;margin:8px 0 3px;font-size:28px;letter-spacing:-.04em;color:#10223B}.statCard p{margin:0;color:#7B8797;font-size:13px}.split{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(280px,.7fr);gap:16px}.panel{padding:calc(var(--density)*18px);min-width:0}.panelTitle{display:flex;justify-content:space-between;gap:16px;align-items:flex-end;margin-bottom:14px}.panelTitle h2{margin:0;color:#132033;font-size:17px}.panelTitle span{color:#75849A;font-size:13px}.tableWrap{overflow:auto;border:1px solid #EEF2F7;border-radius:14px}table{width:100%;border-collapse:collapse;min-width:760px;background:white}th,td{text-align:left;padding:13px 14px;border-bottom:1px solid #EEF2F7;font-size:13.5px;vertical-align:middle}th{background:#FAFCFF;color:#66758A;font-size:11px;text-transform:uppercase;letter-spacing:.1em}tr:last-child td{border-bottom:0}.badge{display:inline-flex;align-items:center;white-space:nowrap;border-radius:999px;padding:4px 8px;font-size:12px;font-weight:800;border:1px solid #DDE6F1;color:#40516A;background:#F8FAFC}.badge.critical{background:#FEF2F2;color:#B91C1C;border-color:#FECACA;box-shadow:0 0 0 calc((var(--risk) - 1)*2px) rgba(220,38,38,.12)}.badge.high{background:#FFF7ED;color:#C2410C;border-color:#FED7AA}.badge.medium{background:#FEFCE8;color:#A16207;border-color:#FDE68A}.badge.review{background:#EFF6FF;color:#1D4ED8;border-color:#BFDBFE}.badge.low{background:#F0FDF4;color:#15803D;border-color:#BBF7D0}.insight{line-height:1.55;color:#40516A}.searchHero,.settingsSearch{display:flex;gap:12px;align-items:center;padding:14px}.searchHero input,.settingsSearch input{width:100%;border:1px solid #DDE6F1;border-radius:12px;padding:12px 13px;outline:0;background:#FAFCFF}.tabs{display:flex;gap:8px;border-bottom:1px solid var(--border);padding-bottom:10px}.tabs button{background:transparent}.tabs .active{background:#F7FAFF;border-color:#D8E6FB;color:#1E4FB8}.settingsPage{gap:20px}.settingsSearch{justify-content:space-between}.settingsSearch strong{display:block;color:#10223B}.settingsSearch span{display:block;color:#66758A;font-size:13px;margin-top:3px}.settingsSearch input{max-width:360px}.settingsLayout{display:grid;grid-template-columns:220px 1fr;gap:18px;align-items:start}.settingsNav{position:sticky;top:84px;background:#fff;border:1px solid var(--border);border-radius:16px;padding:10px;display:grid;gap:4px}.settingsNav a{text-decoration:none;color:#526174;padding:9px 10px;border-radius:10px;font-weight:750;font-size:14px}.settingsNav a:hover{background:#F8FAFC;color:#0F2138}.settingsGroups{display:grid;gap:18px}.settingsGroup{padding:20px}.settingsGroup.important{border-color:#A7F3D0;box-shadow:0 14px 36px rgba(13,148,136,.08)}.settingsGroupHeader{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px}.settingsGroup h2{margin:0;color:#10223B;font-size:20px;letter-spacing:-.025em}.settingsGroup p{margin:5px 0 0;color:#66758A;line-height:1.45}.settingsGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.settingItem{height:auto;min-height:86px;display:flex;justify-content:space-between;align-items:flex-start;gap:14px;text-align:left;border-radius:14px;padding:14px;background:#fff}.settingItem strong{display:block;color:#132033}.settingItem span{display:block;margin-top:5px;color:#66758A;font-weight:500;line-height:1.35}.settingItem em{font-style:normal;color:#526174;background:#F8FAFC;border:1px solid #EEF2F7;border-radius:999px;padding:4px 8px;font-size:12px;white-space:nowrap}.moduleEnablement{margin-top:12px;border:1px dashed #99F6E4;background:#F0FDFA;border-radius:14px;padding:14px;display:flex;justify-content:space-between;gap:16px;align-items:center}.moduleEnablement h3{margin:0;color:#134E4A;font-size:15px}.moduleEnablement p{margin:4px 0 0;color:#0F766E;font-size:13px}.modulePills{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.aiDrawer{position:fixed;right:14px;top:78px;bottom:14px;width:min(380px,calc(100vw - 28px));background:white;border:1px solid #DDE6F1;border-radius:20px;box-shadow:0 24px 80px rgba(11,31,58,.22);z-index:40;padding:18px;display:grid;align-content:start;gap:14px}.aiDrawer header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.aiDrawer header span{font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:900;color:#0D9488}.aiDrawer h2{margin:4px 0 0}.aiDrawer p{margin:0;color:#526174;line-height:1.5}.toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:12px 0 14px}.toolbar input{min-width:min(360px,100%);flex:1;border:1px solid #DDE6F1;border-radius:12px;padding:11px 12px;background:#FAFCFF;outline:0}.actionStack{display:grid;gap:10px}.actionStack button{text-align:left}.kanban{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.kanbanCol{border:1px solid #EEF2F7;background:#FAFCFF;border-radius:16px;padding:12px;display:grid;gap:10px;align-content:start}.kanbanCol h3{margin:0;font-size:13px;color:#526174;text-transform:uppercase;letter-spacing:.08em}.taskCard{background:white;border:1px solid #E7EDF5;border-radius:14px;padding:12px;display:grid;gap:8px}.taskCard strong{font-size:14px;color:#132033}.taskCard span{color:#66758A;font-size:12px}.wizardSteps{display:grid;grid-template-columns:repeat(9,minmax(96px,1fr));gap:8px;overflow:auto;padding-bottom:4px;margin-bottom:14px}.wizardStep{border:1px solid #E7EDF5;background:#fff;border-radius:14px;padding:10px;display:grid;gap:6px;min-height:76px}.wizardStep strong{width:24px;height:24px;border-radius:999px;display:grid;place-items:center;background:#EEF2F7;color:#526174;font-size:12px}.wizardStep span{font-size:12px;font-weight:800;color:#526174}.wizardStep.done strong{background:#DCFCE7;color:#15803D}.wizardStep.active{border-color:#BFDBFE;background:#EFF6FF}.wizardStep.active strong{background:#2563EB;color:white}a:focus-visible,button:focus-visible,input:focus-visible,.settingItem:focus-visible,.wizardStep:focus-visible{outline:2px solid rgba(37,99,235,.18);outline-offset:2px;box-shadow:none}button:active{transform:translateY(1px)}button:disabled,button[aria-disabled="true"]{cursor:not-allowed;opacity:.52;background:#F3F6FA;color:#8A97A8;border-color:#E1E8F0;box-shadow:none;transform:none}.statCard,.panel,.settingItem,.taskCard,.wizardStep,.settingsNav a,.actionStack button{transition:border-color .16s ease,box-shadow .16s ease,background .16s ease,transform .16s ease}.statCard:hover,.panel:hover,.settingItem:hover,.taskCard:hover,.wizardStep:hover,.actionStack button:hover{border-color:#E0E7F0;box-shadow:0 4px 14px rgba(15,35,65,.035);transform:none;background:#fff}tbody tr{transition:background .14s ease}tbody tr:hover td{background:#FAFBFD}.selectedRow td{background:#F8FBFF!important}.selectedRow td:first-child{box-shadow:inset 2px 0 0 #DBEAFE}.rowAction{padding:6px 9px;font-size:12px;border-radius:8px;background:#F8FAFC}.rowAction:hover{background:#F3F6FA;border-color:#E1E8F0;color:#334155}.rowAction:focus-visible{background:#F8FBFF;border-color:#C9D7EA;color:#1E4FB8}.companiesClientsPage{gap:16px}.companiesClientsPage .screenHeader span{max-width:760px}.companiesClientsPage .tabs{padding-bottom:8px}.companiesClientsPage .panel{box-shadow:0 10px 26px rgba(15,35,65,.035)}.companiesClientsPage .panelTitle{margin-bottom:10px}.companiesClientsPage .toolbar{margin:8px 0 12px}.companiesClientsPage th,.companiesClientsPage td{padding:11px 12px}.clientPortfolioPanel table{min-width:1040px}.departmentsReadabilityPage{gap:calc(var(--ocd-tweak-department-spacing, 22) * 1px);padding-right:118px;padding-bottom:calc(var(--ocd-tweak-department-bottom-padding, 168) * 1px)}.departmentsReadabilityPage .tabs{margin-top:2px}.departmentsReadabilityPage .clientPortfolioPanel{padding:calc(var(--ocd-tweak-department-panel-padding, 22) * 1px);display:grid;gap:16px}.departmentsReadabilityPage .toolbar{margin:0 0 2px}.departmentsReadabilityPage .assetsInsightBar{margin-top:2px;padding:13px 15px;gap:12px}.departmentsReadabilityPage .assetsInsightBar p{line-height:1.45;max-width:820px}.departmentsReadabilityPage .compactActions{min-width:0}.departmentsTableScroll{max-width:100%;overflow-x:auto;overflow-y:hidden;padding-bottom:14px}.departmentsTableScroll table{min-width:1120px}.departmentsTableScroll th,.departmentsTableScroll td{padding-top:13px;padding-bottom:13px}.departmentsTableScroll th:last-child,.departmentsTableScroll td:last-child{padding-right:24px;white-space:nowrap}.departmentsTableScroll .rowAction{white-space:nowrap}.selectedClientPanel{padding:18px 20px 20px;background:linear-gradient(180deg,#FFFFFF 0%,#FCFDFE 100%)}.selectedClientPanel .panelTitle{align-items:flex-start;margin-bottom:12px}.selectedClientPanel .panelTitle h2{font-size:16px}.selectedDepartmentOverview{display:grid;gap:10px;margin-bottom:14px}.selectedDepartmentRow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.selectedDepartmentRowWide{grid-template-columns:minmax(0,1.45fr) minmax(0,.95fr)}.selectedDepartmentItem{border:1px solid #EEF2F7;background:#FFFFFF;border-radius:calc(var(--ocd-tweak-selected-preview-softness, 14) * 1px);padding:12px;min-width:0}.selectedDepartmentItem span{display:block;color:#75849A;font-size:11px;text-transform:uppercase;letter-spacing:.1em;font-weight:850}.selectedDepartmentItem strong{display:block;margin-top:5px;color:#10223B;font-size:14px;line-height:1.35;overflow:hidden;text-overflow:ellipsis}.relatedDepartmentRecords{overflow-x:auto}.compactClientPreview{border-color:#EEF2F7}.compactClientPreview table{min-width:760px}.compactClientPreview th,.compactClientPreview td{padding:10px 12px;font-size:13px}.compactClientPreview .recordCell{font-weight:800;color:#10223B}.compactClientPreview .badge{padding:3px 7px;font-size:11.5px}.subtleRowAction{padding:5px 8px;font-size:11.5px;font-weight:750;background:#FBFCFE;color:#475569;border-color:#E6ECF3}.subtleRowAction:hover{background:#F8FAFC;color:#0F766E;border-color:#D6EAE5}.stateBox{border:1px solid #DDE6F1;border-radius:14px;background:#FAFCFF;padding:14px;display:grid;gap:8px;color:#40516A}.stateBox strong{color:#132033}.stateBox span{font-size:13px;line-height:1.45}.emptyState{background:#F8FAFC}.errorState{background:#FFF7F7;border-color:#FECACA}.errorState strong{color:#B91C1C}.errorState div{display:flex;gap:8px;flex-wrap:wrap}.ghostBtn{background:transparent}.skeletonRow td{background:#fff}.skeletonLine{display:block;width:100%;max-width:180px;height:12px;border-radius:999px;background:linear-gradient(90deg,#EEF2F7,#F8FAFC,#EEF2F7);background-size:200% 100%;animation:pulse 1.2s ease-in-out infinite}.miniState{display:flex;align-items:center;gap:9px;border:1px solid #DDE6F1;background:#F8FAFC;border-radius:12px;padding:10px 12px;color:#526174;font-size:13px}.loadingState{border-color:#BFDBFE;background:#EFF6FF;color:#1D4ED8}.spinner{width:14px;height:14px;border-radius:50%;border:2px solid rgba(37,99,235,.24);border-top-color:#2563EB;animation:spin .8s linear infinite}.validationPanel{border:1px solid #FDE68A;background:#FFFBEB;border-radius:16px;padding:14px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.validationPanel div{background:#fff;border:1px solid #FDE68A;border-radius:12px;padding:10px}.validationPanel strong{display:block;color:#92400E;font-size:13px}.validationPanel span{display:block;color:#785E1E;font-size:12px;margin-top:3px}.toastStack{position:fixed;right:24px;bottom:96px;display:grid;gap:8px;z-index:75;pointer-events:none}.toast{background:#0B1F3A;color:white;border:1px solid rgba(255,255,255,.12);box-shadow:0 16px 40px rgba(11,31,58,.22);border-radius:12px;padding:10px 12px;font-size:13px;font-weight:750;animation:toastOut 4s ease forwards}.errorToast{background:#7F1D1D}@keyframes toastOut{0%,78%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(8px)}}@keyframes pulse{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:1050px){.app{grid-template-columns:1fr}.sidebar{position:static}.statsGrid,.split,.settingsLayout,.settingsGrid{grid-template-columns:1fr}.topbar{flex-wrap:wrap;height:auto;padding:12px}.topSearch{min-width:0;flex:1}.content{padding:20px}.settingsNav{position:static}.screenHeader{display:grid}.departmentsReadabilityPage{padding-right:24px}.selectedDepartmentRow{grid-template-columns:repeat(2,minmax(0,1fr))}.selectedDepartmentRowWide{grid-template-columns:1fr}}@media(max-width:720px){.sidebar nav{display:grid;grid-template-columns:1fr 1fr;gap:8px}.navGroup{margin:0}.statsGrid{grid-template-columns:1fr}.settingsSearch,.moduleEnablement{display:grid}.settingsSearch input{max-width:none}table{min-width:680px}.departmentsReadabilityPage{padding-bottom:176px}.selectedDepartmentRow{grid-template-columns:1fr}}
.aiInsightBar{display:flex;align-items:center;gap:16px;background:#F0FDFA;border:1px solid #A7F3D0;border-radius:14px;padding:11px 16px;flex-wrap:wrap;row-gap:8px}
.attentionContent{padding-top:28px;min-width:0;max-width:100%;overflow-x:hidden}
.attentionContent .panel,.attentionContent .aiInsightBar,.attentionContent .tabs,.attentionContent .toolbar{min-width:0;max-width:100%}
.attentionSummaryGrid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));min-width:0;max-width:100%}
.attentionSummaryGrid .statCard{min-width:0}

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
.attentionWorkflowWrap{max-width:100%;overflow-x:auto;overflow-y:hidden}
.attentionWorkflowTable{width:100%;min-width:1040px;table-layout:fixed}
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
.attentionWorkflowTableIt th:nth-child(1){width:22%}
.attentionWorkflowTableIt th:nth-child(2){width:9%}
.attentionWorkflowTableIt th:nth-child(3){width:12%}
.attentionWorkflowTableIt th:nth-child(4){width:9%}
.attentionWorkflowTableIt th:nth-child(5){width:11%}
.attentionWorkflowTableIt th:nth-child(6){width:10%}
.attentionWorkflowTableIt th:nth-child(7){width:17%}
.attentionWorkflowTableIt th:nth-child(8){width:10%}
.attentionWorkflowTableIt{min-width:920px}
/* MSP Dashboard priority queue readability — scoped to workspaceMode !== 'Internal IT' */
.priorityQueueWrapMsp{overflow-x:auto}
.priorityQueueTableMsp{min-width:1160px}
.priorityQueueTableMsp th:nth-child(1){width:16%}
.priorityQueueTableMsp th:nth-child(2){width:9%}
.priorityQueueTableMsp th:nth-child(3){width:13%}
.priorityQueueTableMsp th:nth-child(4){width:11%}
.priorityQueueTableMsp th:nth-child(5){width:9%}
.priorityQueueTableMsp th:nth-child(6){width:8%}
.priorityQueueTableMsp th:nth-child(7){width:8%}
.priorityQueueTableMsp th:nth-child(8){width:10%}
.priorityQueueTableMsp th:nth-child(9){width:16%}
.priorityQueueTableMsp .actionCell{white-space:nowrap;overflow:visible}
.priorityQueueTableMsp .actionCell .rowAction{white-space:nowrap}
`;


const settingsDirectoryOverrideStyles = `
.settingsDirectoryPage{gap:22px;padding-bottom:52px}
.settingsHub{display:grid;gap:28px}
.settingsHubRow{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.modeSelectedSummary{margin:10px 0 0;max-width:760px;color:#334155;font-size:13px;line-height:1.45;background:#F8FAFC;border:1px solid #E8EEF4;border-radius:10px;padding:9px 12px}
.modePreviewUnified{margin-top:12px;border:1px solid #E6EDF4;border-radius:14px;background:#FCFEFF;padding:13px}
.modePreviewUnifiedHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding-bottom:10px;border-bottom:1px solid #EEF2F7}
.modePreviewUnifiedHeader h3{margin:0;color:#0B1F3A;font-size:14px;font-weight:850;letter-spacing:-.02em}
.modePreviewUnifiedHeader p{margin:0;color:#64748B;font-size:12.5px;line-height:1.45;max-width:48ch;text-align:right}
.modePreviewColumns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:stretch;gap:10px;padding-top:10px}
.modePreviewColumn{min-width:0;min-height:100%;border:1px solid #EAF0F6;border-radius:11px;background:#fff;padding:12px;display:flex;flex-direction:column;justify-content:flex-start}
.modePreviewColumn h4{margin:0 0 8px;color:#0B1F3A;font-size:12px;font-weight:850;letter-spacing:-.01em}
.modeLabelList{display:grid;gap:6px}
.modeLabelLine{display:grid;grid-template-columns:96px minmax(0,1fr);gap:8px;align-items:start;color:#64748B;font-size:11.5px;line-height:1.3}
.modeLabelLine strong{min-width:0;color:#0B1F3A;font-size:12px;font-weight:800;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.3}
.modePreviewText{margin:0;color:#475569;font-size:12px;font-weight:650;line-height:1.6}
.modeChipRow{display:flex;flex-wrap:wrap;gap:5px}
.modeChip{display:inline-flex;align-items:center;min-height:21px;border:1px solid #E8EEF4;background:#FCFEFF;border-radius:999px;padding:2px 7px;color:#475569;font-size:11.25px;font-weight:650;line-height:1.2}
.settingsSearchInput{height:36px;border:1px solid #E2E8F0;border-radius:9px;padding:0 13px;outline:0;font:inherit;font-size:14px;color:#1E293B;background:#FAFCFF;width:240px}
.settingsSearchInput:focus{border-color:#0D9488;box-shadow:0 0 0 3px rgba(13,148,136,.1)}
.settingsGroupGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px 48px}
.settingsDirectoryGroup{display:flex;flex-direction:column}
.settingsGroupLabel{margin:0 0 10px;padding-bottom:8px;font-size:11.5px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#0B1F3A;border-bottom:1.5px solid #F1F5F9}
.settingsItemList{margin:0;padding:0;list-style:none;display:flex;flex-direction:column}
.settingsItemLink{width:100%;text-align:left;border:0;background:transparent;box-shadow:none;color:#475569;font-size:13.5px;font-weight:500;padding:5px 0;cursor:pointer;line-height:1.4;border-radius:0}
.settingsItemLink:hover{color:#0D9488;background:transparent;box-shadow:none}
.settingsNoResults{color:#64748B;font-size:13px}
.settingsDetailWorkspace{display:grid;gap:10px;width:min(100%,1040px);max-width:1040px;margin:0 auto}
.settingsBackButton{justify-self:start;border:0;background:transparent;box-shadow:none;color:#64748B;padding:4px 0;font-size:13px;font-weight:700;cursor:pointer}
.settingsBackButton:hover{color:#0B1F3A;background:transparent;box-shadow:none}
.settingsDetailPanel,.settingsFocusedPanel{background:#fff;border:1px solid #E8EEF4;border-radius:18px;padding:22px;box-shadow:0 1px 3px rgba(15,35,65,.045),0 6px 20px rgba(15,35,65,.035);display:grid;gap:0}
.settingsDetailHeader{padding-bottom:14px;border-bottom:1px solid #F1F5F9}
.settingsDetailHeader h2{margin:4px 0 0;color:#0B1F3A;font-size:20px;font-weight:800;letter-spacing:-.02em}
.settingsDetailHeader p{margin:5px 0 0;color:#64748B;font-size:13px;line-height:1.5;max-width:58ch}
.settingsDetailSection{padding-top:18px}
.settingsSectionLabel{margin:0 0 9px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#94A3B8;display:block}
.settingsWorkspaceModeDesc{margin:0 0 10px;font-size:13px;color:#64748B;line-height:1.45}
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
.searchCommandPage .screenHeader{margin-bottom:8px}.searchCommandPage .eyebrow{letter-spacing:.09em}.searchCommandHero{border:0;background:transparent;box-shadow:none;padding:4px 0 8px}.commandInputWrap{min-width:0;flex:1;display:flex;align-items:center;gap:10px;border:1px solid #D8E2EF;border-radius:14px;background:#fff;padding:0 13px;box-shadow:0 10px 28px rgba(11,31,58,.07)}.commandInputWrap:focus-within{border-color:#0D9488;box-shadow:0 0 0 3px rgba(13,148,136,.10),0 12px 30px rgba(11,31,58,.08)}.commandInputWrap input{border:0;background:transparent;box-shadow:none;padding:0;min-height:54px;font-size:15.5px}.commandInputWrap input:focus{outline:0;box-shadow:none}.commandInputWrap span{flex-shrink:0;border:1px solid #E2E8F0;background:#F8FAFC;color:#64748B;border-radius:7px;padding:2px 7px;font-size:11px;font-weight:750;letter-spacing:.02em}.searchCommandHero .primary{min-height:42px;padding:0 18px}.searchModesPanel{display:grid;gap:8px;margin-top:-2px;margin-bottom:2px}.searchModeInline{display:flex;flex-wrap:wrap;align-items:center;gap:5px;color:#64748B}.searchModeInline button{border:1px solid #E6EEF2;background:#FAFCFF;color:#486274;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:600;box-shadow:none;cursor:pointer}.searchModeInline button.active{background:#F0FDFA;border-color:#BFE7E1;color:#0F766E}.suggestedQuestions{display:flex;flex-wrap:wrap;align-items:center;gap:5px;padding-top:2px;color:#64748B}.suggestedQuestions span{font-size:10.5px;font-weight:750;text-transform:uppercase;letter-spacing:.08em;margin-right:2px}.suggestedQuestions button{border:1px solid #E6EEF2;background:#fff;color:#39566A;border-radius:999px;padding:3px 7px;font-size:11px;font-weight:520;box-shadow:none;cursor:pointer}.suggestedQuestions button:hover{border-color:#CDEDE5;background:#F8FFFD;color:#0F766E}.searchResultsPanel{margin-top:4px;box-shadow:0 8px 22px rgba(15,35,65,.035)}.searchResultsPanel .panelTitle{margin-bottom:4px}.searchResultsPanel .panelTitle h2{font-size:17px}.searchResultsPanel .panelTitle span{font-size:12px;color:#718096}.searchResultsPanel th,.searchResultsPanel td{padding:10px 12px}.searchResultsPanel .badge{padding:2px 6px;font-size:10.75px;line-height:1.15;font-weight:700;white-space:nowrap}.searchResultsPanel .rowAction{padding:4px 8px;font-size:11px;font-weight:650;border-radius:999px;color:#0B5D56;background:#F7FCFB;border-color:#D8EDEA;box-shadow:none}.searchResultsPanel .rowAction:hover{background:#EAF7F5;border-color:#BCE1DC}.searchRouteActive .agentWrap{right:12px;bottom:56px}

`;


const oprivaUpgradeStyles = `
.app{min-height:100vh;display:flex;flex-direction:row;align-items:stretch}.sidebar{width:264px;flex-shrink:0;background:linear-gradient(180deg,#0B1F3A,#07111F);color:#EAF4F7;padding:24px 18px;position:sticky;top:0;height:100vh;overflow:auto}.workspace{flex:1;min-width:0;display:flex;flex-direction:column}.appSidebarCollapsed .sidebar{width:86px}.appSidebarCollapsed .workspace{flex:1}.brand{height:62px;display:flex;align-items:center;gap:12px;margin-bottom:18px;padding:0;border-bottom:0}.brandMark{width:36px;height:36px;display:grid;place-items:center;flex:0 0 auto}.brandMark svg{width:36px;height:36px;overflow:visible}.oprivaOpenContour,.agentContour{fill:none;stroke:#24BFA6;stroke-width:2.35;stroke-linecap:round;stroke-linejoin:round}.oprivaFocusDot,.agentFocusDot{fill:#0B7D63;filter:drop-shadow(0 2px 7px rgba(13,148,136,.28))}.brandCopy{display:flex;flex-direction:column;line-height:1.05}.brandCopy strong{font-size:19px;font-weight:650;letter-spacing:.01em;color:#fff}.brandCopy span{margin-top:5px;color:#94A3B8;font-size:11px;letter-spacing:.06em;text-transform:uppercase}.navGroup{margin-top:20px}.navGroup p{margin:0 0 8px 8px;color:#8BA4BD;font-size:11px;text-transform:uppercase;letter-spacing:.1em}.navGroup button{width:100%;border:0;background:transparent;color:#C8D7E5;text-align:left;padding:10px 12px;border-radius:12px;cursor:pointer}.navGroup button:hover,.navGroup button.active{background:rgba(255,255,255,.08);color:#fff}.topbar{height:60px;background:#fff;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;padding:0 20px;position:sticky;top:0;z-index:5}.tenantLockupWrap{position:relative;flex:0 0 auto}.tenantLockup{display:inline-flex;align-items:center;gap:10px;border:0;background:transparent;text-align:left;padding:6px 10px 6px 6px;border-radius:10px;box-shadow:none;cursor:pointer;font-family:inherit;flex:0 0 auto;transition:background .14s ease}.tenantLockup:hover,.tenantLockupOpen{background:#F7F9FC;box-shadow:none;border-color:transparent}.tenantLockup:focus-visible{outline:2px solid rgba(13,148,136,.3);outline-offset:2px}.tenantLogo{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#0B1F3A 0%,#1E3A5F 100%);color:#fff;font-weight:800;font-size:13px;display:inline-flex !important;align-items:center !important;justify-content:center !important;text-align:center !important;line-height:1 !important;letter-spacing:-.01em;flex:0 0 auto;box-shadow:0 1px 2px rgba(11,31,58,.18),inset 0 1px 0 rgba(255,255,255,.08)}.tenantName{font-size:14px;font-weight:700;color:#0F2138;letter-spacing:-.012em;white-space:nowrap;line-height:1}.tenantChevron{color:#94A3B8;flex:0 0 auto;margin-left:1px;transition:transform .16s ease}.tenantLockupOpen .tenantChevron{transform:rotate(180deg)}.topSpacer{flex:1;min-width:0}.topSearchTrigger{appearance:none;display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 8px 0 12px;border:1px solid var(--border);border-radius:10px;background:#F8FAFC;color:#64748B;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;flex:0 0 auto;transition:background .14s ease,border-color .14s ease,color .14s ease;box-shadow:none;line-height:1}.topSearchTrigger:hover{background:#F1F5F9;border-color:#CBD5E1;color:#0F2138}.topSearchTrigger:focus-visible{outline:2px solid rgba(13,148,136,.3);outline-offset:2px}.topSearchTrigger svg{color:#94A3B8;flex:0 0 auto;transition:color .14s ease}.topSearchTrigger:hover svg{color:#475569}.topSearchTriggerLabel{display:inline;line-height:1}.topSearchTriggerKbd{display:inline-flex;align-items:center;height:20px;padding:0 6px;border-radius:5px;background:#fff;border:1px solid #E2E8F0;color:#64748B;font-size:10.5px;font-weight:700;font-family:inherit;flex-shrink:0;box-shadow:0 1px 0 rgba(15,35,65,.04);line-height:1;margin-left:4px}.topMenuWrap{position:relative;flex:0 0 auto}.topActionNew{appearance:none;display:inline-flex;align-items:center;gap:5px;height:36px;padding:0 10px 0 11px;border:1px solid var(--border);border-radius:10px;background:#fff;color:#0F2138;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;flex:0 0 auto;transition:background .14s ease,border-color .14s ease;box-shadow:none;line-height:1}.topActionNew:hover,.topActionNewOpen{background:#F8FAFC;border-color:#CBD5E1}.topActionNew:focus-visible{outline:2px solid rgba(13,148,136,.3);outline-offset:2px}.topActionNew svg{flex-shrink:0}.topActionNewLabel{display:inline;line-height:1}.topActionNewChev{color:#94A3B8;transition:transform .16s ease}.topActionNewOpen .topActionNewChev{transform:rotate(180deg)}.topMenu{position:absolute;top:calc(100% + 6px);background:#fff;border:1px solid var(--border);border-radius:12px;box-shadow:0 18px 40px rgba(11,31,58,.18),0 2px 4px rgba(11,31,58,.04);min-width:240px;padding:6px;z-index:50;animation:topMenuIn .14s ease-out}.workspaceMenu{left:0}.newMenu{right:0}@keyframes topMenuIn{from{opacity:0;transform:translateY(-4px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}.topMenuHeader{padding:8px 10px 10px;border-bottom:1px solid #F1F5F9;margin-bottom:6px;display:flex;flex-direction:column;gap:2px}.topMenuHeader strong{color:#0F2138;font-size:13px;font-weight:800;letter-spacing:-.005em;line-height:1.2}.topMenuHeader small{color:#94A3B8;font-size:11.5px;font-weight:600;line-height:1.2}.topMenuItem{appearance:none;display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border:0;background:transparent;border-radius:8px;color:#475569;font-family:inherit;font-size:13px;font-weight:600;text-align:left;cursor:pointer;transition:background .12s ease,color .12s ease;box-shadow:none;line-height:1.2}.topMenuItem:hover{background:#F1F5F9;color:#0F2138}.topMenuItem svg{color:#94A3B8;flex-shrink:0;transition:color .12s ease}.topMenuItem:hover svg{color:#475569}.topActionBtn{width:36px;height:36px;border-radius:9px;display:grid;place-items:center;position:relative;border:0;background:transparent;color:#475569;cursor:pointer;font-family:inherit;flex:0 0 auto;padding:0;box-shadow:none;transition:background .14s ease,color .14s ease}.topActionBtn:hover{background:#F1F5F9;color:#0F2138;border-color:transparent;box-shadow:none}.topActionBtn:focus-visible{outline:2px solid rgba(13,148,136,.3);outline-offset:2px}.topActionAlertsBadge{position:absolute;top:2px;right:2px;height:15px;min-width:15px;padding:0 4px;border-radius:999px;background:#DC2626;color:#fff;font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff;font-family:inherit;letter-spacing:-.02em;line-height:1}.topRightDivider{width:1px;height:22px;background:var(--border);flex:0 0 auto;margin:0 6px}.avatar{width:34px;height:34px;border-radius:50%;background:#EAF2FF;color:#1D4ED8;font-size:12px;font-weight:800;border:1px solid #DDE6F1;padding:0;display:grid;place-items:center;font-family:inherit;cursor:pointer;flex:0 0 auto;transition:background .14s ease,border-color .14s ease,box-shadow .14s ease}.avatar:hover{background:#DBEAFE;border-color:#BFDBFE;color:#1D4ED8;box-shadow:0 0 0 3px rgba(37,99,235,.08)}.avatar:focus-visible{outline:2px solid rgba(37,99,235,.4);outline-offset:2px}.agentWrap{position:fixed;right:24px;bottom:96px;z-index:90;display:flex;align-items:center;gap:12px}.agentTip{max-width:244px;background:#0F172A;color:#EAF4F7;padding:10px 12px;border-radius:14px;font-size:12px;box-shadow:0 18px 45px rgba(15,23,42,.2);opacity:0;transform:translateX(6px);pointer-events:none;transition:opacity .22s ease,transform .22s ease}.agentTip.isVisible{opacity:.94;transform:translateX(0)}.agentButton{width:62px;height:62px;border:1px solid rgba(13,148,136,.22);border-radius:20px;background:rgba(255,255,255,.92);box-shadow:0 16px 40px rgba(15,23,42,.16);display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(18px);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.agentButton:hover{box-shadow:0 20px 48px rgba(15,23,42,.22),0 0 0 6px rgba(45,212,191,.08);border-color:rgba(13,148,136,.45)}.agentMark{width:38px;height:38px;display:grid;place-items:center}.agentMarkSvg{width:38px;height:38px;overflow:visible}.agentContour{transform-origin:16px 16px}.agentFocusDot{transform-origin:center}.aiDrawer{position:fixed;right:24px;bottom:174px;top:auto;width:min(360px,calc(100vw - 48px));max-height:calc(100vh - 210px);overflow:auto;background:#fff;border:1px solid var(--border);border-radius:22px;box-shadow:0 24px 70px rgba(15,23,42,.2);z-index:88;padding:18px;display:block}.drawerHeader{display:flex;justify-content:space-between;gap:12px;align-items:start}.drawerHeader h2{margin:0;font-size:18px}.drawerHeader p,.drawerText,.meta{color:var(--muted);font-size:13px}.drawerHeader button{border:0;background:#F1F5F9;border-radius:10px;width:30px;height:30px;padding:0}.drawerInput{width:100%;border:1px solid var(--border);border-radius:14px;padding:12px;margin:12px 0}.drawerInput:focus{outline:0;border-color:var(--teal);box-shadow:0 0 0 3px rgba(13,148,136,.12)}.suggestions{display:grid;gap:8px}.suggestions button{border:1px solid var(--border);background:#fff;text-align:left;border-radius:12px;padding:10px}.agentSettings{margin-top:12px;padding-top:12px;border-top:1px solid #EEF2F7}.agentSettings label{display:flex;align-items:center;gap:9px;color:#334155;font-size:13px}
/* Final Settings overview polish */
.settingsOverviewCards{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;max-width:980px}
.settingsOverviewCard{border:1px solid #E6EDF4;background:#fff;border-radius:16px;padding:16px 16px 15px;box-shadow:0 1px 2px rgba(15,35,65,.035);display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:18px}
.settingsOverviewCard:hover{border-color:#D6E2EF;background:#FCFEFF}
.settingsOverviewCard .settingsGroupLabel{margin:0 0 5px;padding:0;border:0;font-size:14px;font-weight:850;text-transform:none;letter-spacing:-.01em;color:#0B1F3A}
.settingsOverviewDescription{margin:0;color:#64748B;font-size:13px;line-height:1.45;max-width:52ch}
.settingsOverviewOpen{border:1px solid #DDE7F1;background:#fff;color:#1F2F46;border-radius:11px;padding:8px 13px;font-weight:800;font-size:12.5px;box-shadow:none}
.settingsOverviewOpen:hover{border-color:#A7F3D0;background:#F0FDFA;color:#0F766E}
.settingsFocusedPanel{max-width:1080px;width:100%;margin:0 auto}
.settingsFocusedPanel .settingsDetailHeader{display:block;text-align:left;padding-bottom:14px}
.settingsFocusedPanel .settingsDetailHeader .eyebrow{display:block;margin-bottom:4px}
.settingsFocusedPanel .settingsDetailHeader h2{margin:0;color:#0B1F3A;font-size:24px;letter-spacing:-.035em}
.settingsFocusedPanel .settingsDetailHeader p{margin:6px 0 0;max-width:620px;color:#64748B}
.modePreviewColumns{grid-template-columns:1.05fr 1fr 1fr}
.modeLabelLine{grid-template-columns:minmax(76px,96px) minmax(0,1fr)}
.modeLabelLine strong{white-space:normal;overflow:visible;text-overflow:clip}
.modePreviewText{font-size:13px;line-height:1.65}
@media(max-width:1050px){.sidebar{position:relative;width:100%;height:auto}.app{display:block}.workspace{margin-left:0}.topbar{grid-template-columns:1fr;gap:10px;height:auto;padding:16px}.agentWrap{right:18px;bottom:84px}}`;

const settingsHubDirectoryStyles = `
.settingsDirectoryPage{padding:32px 28px 80px}
.settingsHubDirectory{display:flex;flex-direction:column;gap:0;padding:0}
.settingsHubDirectoryHeader{margin:0 0 36px;display:block}
.settingsHubDirectoryEyebrow{margin:0 0 14px;color:#0D9488;text-transform:uppercase;font-size:12px;letter-spacing:.18em;font-weight:800}
.settingsHubDirectoryTitle{margin:0;color:#0F2138;font-size:clamp(40px,5vw,64px);letter-spacing:-.045em;font-weight:800;line-height:.95}
.settingsHubDirectorySubtitle{margin:18px 0 0;color:#66758A;font-size:16px;line-height:1.5;max-width:640px;font-weight:400}
.settingsHubDirectorySearchBlock{margin:0 0 44px;max-width:680px}
.settingsHubDirectorySearchLabel{margin:0 0 12px;color:#66758A;text-transform:uppercase;font-size:11px;letter-spacing:.18em;font-weight:800}
.settingsHubDirectorySearchInput{width:100%;height:56px;border:1px solid #E5E7EB;border-radius:14px;background:#fff;padding:0 22px;font-size:16px;color:#0F2138;outline:0;font-family:inherit;box-shadow:0 4px 14px rgba(15,35,65,.035);transition:border-color .16s ease,box-shadow .16s ease}
.settingsHubDirectorySearchInput::placeholder{color:#94A3B8;font-weight:400}
.settingsHubDirectorySearchInput:focus{border-color:#0D9488;box-shadow:0 0 0 4px rgba(13,148,136,.12)}
.settingsHubDirectoryDivider{margin:0 0 36px;height:1px;background:#E8EEF4;border:0}
.settingsHubDirectoryRow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:48px;margin-bottom:36px}
.settingsHubSection{display:flex;flex-direction:column;min-width:0}
.settingsHubSectionTitleBtn{appearance:none;-webkit-appearance:none;background:transparent;border:0;padding:0;margin:0 0 10px;color:#0F2138;font-size:22px;font-weight:800;letter-spacing:-.02em;font-family:inherit;text-align:left;cursor:pointer;transition:color .16s ease;width:fit-content;box-shadow:none}
.settingsHubSectionTitleBtn:hover{color:#0D9488;background:transparent;border-color:transparent;box-shadow:none}
.settingsHubSectionTitleBtn:focus-visible{outline:2px solid rgba(13,148,136,.4);outline-offset:3px;border-radius:4px}
.settingsHubSectionDesc{margin:0;color:#66758A;font-size:14px;line-height:1.6;font-weight:400}
.settingsDirectoryPage .settingsNoResults{color:#94A3B8;font-size:15px;margin:0;padding:24px 0}
@media(max-width:1200px){.settingsHubDirectoryRow{grid-template-columns:repeat(3,minmax(0,1fr));gap:40px}}
@media(max-width:900px){.settingsHubDirectoryRow{grid-template-columns:repeat(2,minmax(0,1fr));gap:36px}}
@media(max-width:600px){.settingsDirectoryPage{padding:24px 20px 56px}.settingsHubDirectoryRow{grid-template-columns:1fr;gap:28px}.settingsHubDirectoryHeader{margin-bottom:28px}.settingsHubDirectorySearchBlock{margin-bottom:32px}}
/* Local Sandbox banner — discreet, enterprise, non-alarmist. One line below the topbar. */
.localSandboxBanner{display:flex;align-items:center;gap:9px;padding:7px 20px;background:#FBFCFE;border-bottom:1px solid #EAEFF5;color:#5A6B82;font-size:12px;line-height:1.4;flex:0 0 auto}
.localSandboxDot{width:7px;height:7px;border-radius:999px;background:#C99A2E;box-shadow:0 0 0 3px rgba(201,154,46,.14);flex:0 0 auto}
.localSandboxText{min-width:0}
.localSandboxText strong{color:#3F4E63;font-weight:750;letter-spacing:-.005em}
@media(max-width:600px){.localSandboxBanner{padding:7px 14px;font-size:11.5px;align-items:flex-start}.localSandboxDot{margin-top:5px}}
`;

const responsiveStyles = `
/* ============================================================
   RESPONSIVE LAYER — desktop (>=1200px) totally untouched.
   All rules are inside media queries.
   ============================================================ */

/* Defaults: new elements are invisible on desktop */
.mobileHamburger{display:none}
.mobileSearchIcon{display:none}
.sidebarBackdrop{display:none}
.sidebarCloseBtn{display:none}
.topActionIcon{display:none}

/* === TABLET + MOBILE (< 1200px) === */
@media (max-width: 1199px){
  /* App layout: drop the grid so sidebar can float as drawer */
  .app{display:block !important;grid-template-columns:none !important}

  /* Sidebar becomes off-canvas drawer */
  .sidebar{position:fixed !important;top:0 !important;left:0 !important;bottom:0 !important;width:300px !important;height:100vh !important;max-height:100vh !important;z-index:200 !important;transform:translateX(-100%) !important;transition:transform .28s cubic-bezier(.32,.72,0,1) !important;box-shadow:0 0 80px rgba(11,31,58,.32) !important;overflow-y:auto !important;padding:18px 14px !important}
  .sidebar.sidebarOpen{transform:translateX(0) !important}

  /* Close button inside sidebar (visible only when drawer mode) */
  .sidebarCloseBtn{display:inline-flex;position:absolute;top:14px;right:12px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.10);border:0;color:#fff;cursor:pointer;align-items:center;justify-content:center;padding:0;font-size:22px;line-height:1;font-weight:400;z-index:1}
  .sidebarCloseBtn:hover{background:rgba(255,255,255,.18)}

  /* Workspace no longer pushed by fixed sidebar */
  .workspace{margin-left:0 !important;width:100% !important;min-width:0 !important}

  /* Backdrop overlay when sidebar open */
  .sidebarBackdrop{display:block;position:fixed;inset:0;background:rgba(11,31,58,.5);z-index:150;opacity:0;pointer-events:none;transition:opacity .22s ease;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
  .sidebarBackdrop.sidebarBackdropOpen{opacity:1;pointer-events:auto}

  /* Show hamburger button */
  .mobileHamburger{display:inline-flex;appearance:none;width:42px;height:42px;border-radius:11px;border:1px solid #E2E8F0;background:#fff;color:#0F2138;cursor:pointer;align-items:center;justify-content:center;flex:0 0 auto;padding:0;margin-right:6px;font-family:inherit}
  .mobileHamburger:hover{background:#F8FAFC;border-color:#CBD5E1}
  .mobileHamburger:active{transform:translateY(1px)}

  /* Touch targets ≥44px on nav items */
  .navGroup button{min-height:44px}

  /* Topbar adjustments */
  .topbar{padding:10px 14px !important;gap:6px !important;height:auto !important;min-height:60px;display:flex !important;flex-wrap:nowrap !important;align-items:center !important}
  .topSpacer{flex:1;min-width:8px}
  .tenantLockup{flex:0 0 auto;min-width:0}
  .tenantName{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}
  .topSearchTriggerKbd{display:none !important}
  .workspaceMenu{left:36px}

  /* AI Drawer adjust */
  .aiDrawer{width:min(380px,calc(100vw - 36px)) !important}
}

/* === MOBILE ONLY (< 768px) === */
@media (max-width: 767px){
  /* Sidebar narrower on phone */
  .sidebar{width:84% !important;max-width:300px !important}

  /* Topbar compaction */
  .topbar{padding:8px 12px !important;gap:6px !important;min-height:56px}
  .topSearchTrigger{display:none !important}
  .mobileSearchIcon{display:inline-flex;appearance:none;width:38px;height:38px;border-radius:9px;border:1px solid #E2E8F0;background:#fff;color:#0F2138;cursor:pointer;align-items:center;justify-content:center;flex:0 0 auto;padding:0;font-family:inherit}
  .mobileSearchIcon:hover{background:#F8FAFC}
  .tenantLockup{padding:4px !important;gap:8px !important}
  .tenantName{font-size:13px !important;max-width:100px}
  .tenantLogo{width:32px !important;height:32px !important;font-size:12px !important;border-radius:9px !important}
  .tenantChevron{display:none}
  .topActionNewLabel,.topActionNewChev{display:none !important}
  .topActionNew{width:38px !important;height:38px !important;padding:0 !important;justify-content:center !important;border-radius:9px !important}
  .topRightDivider{display:none !important}
  .avatar{width:36px !important;height:36px !important;margin-left:2px !important}
  .topMenu{min-width:220px}
  .newMenu{right:0;left:auto}
  .workspaceMenu{left:0;max-width:calc(100vw - 32px)}

  /* Content padding */
  .content{padding:14px !important;gap:12px !important}

  /* Screen header compaction */
  .screenHeader{flex-direction:column;align-items:stretch}
  .screenHeader h1{font-size:24px !important}
  .screenHeader span{max-width:none}
  .headerActions{width:100%;flex-wrap:wrap}
  .headerActions button{flex:1 1 auto;min-height:44px}

  /* Stats grid → 2 cols on phone */
  .statsGrid{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:9px !important}
  .statCard{padding:14px !important}
  .statCard strong{font-size:22px !important}

  /* Split layout stacks */
  .split{grid-template-columns:1fr !important;gap:12px !important}

  /* Panels: tighter */
  .panel{padding:14px !important;border-radius:14px !important}
  .panelTitle{flex-direction:column;align-items:flex-start;gap:4px;margin-bottom:10px !important}

  /* === TABLES → STACKED CARDS === */
  .content .tableWrap,
  .content .priorityQueueWrap,
  .content .renewalWorklistWrap,
  .content .attentionWorkflowWrap{overflow:visible !important;border:0 !important;background:transparent !important;border-radius:0 !important}
  .content table{min-width:0 !important;width:100% !important;display:block !important;background:transparent !important;border:0 !important}
  .content thead{display:none !important}
  .content tbody{display:block !important}
  .content tr{display:block !important;background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:4px 4px;margin-bottom:10px;box-shadow:0 4px 12px rgba(15,35,65,.05)}
  .content tr.selectedRow{border-color:#BFDBFE;background:#F8FBFF !important}
  .content tr.selectedRow td:first-child{box-shadow:none}
  .content td{display:flex !important;justify-content:space-between !important;align-items:center !important;gap:12px !important;padding:10px 12px !important;border-bottom:1px solid #F1F5F9 !important;text-align:right !important;font-size:13px !important;color:#0F2138 !important;font-weight:600 !important;min-width:0}
  .content td:last-child{border-bottom:0 !important}
  .content td::before{content:attr(data-label);color:#94A3B8;font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;font-weight:800;flex:0 0 auto;text-align:left;min-width:88px;white-space:normal}
  .content td:not([data-label])::before,
  .content td[data-label=""]::before{display:none}
  .content td[data-label="Actions"]::before,
  .content td.actionCell::before{display:none}
  .content td.actionCell{justify-content:flex-end}
  .content td.actionCell .rowAction{min-height:36px;padding:8px 14px;font-size:12.5px}

  /* AI Drawer → bottom sheet */
  .aiDrawer{position:fixed !important;left:0 !important;right:0 !important;bottom:0 !important;top:auto !important;width:100% !important;max-height:82vh !important;border-radius:22px 22px 0 0 !important;animation:drawerInBottom .26s cubic-bezier(.32,.72,0,1) !important;box-shadow:0 -18px 48px rgba(15,23,42,.22) !important;border-bottom:0 !important;border-left:0 !important;border-right:0 !important}
  .aiDrawer::before{content:'';display:block;width:36px;height:4px;background:#CBD5E1;border-radius:999px;margin:-4px auto 10px}
  @keyframes drawerInBottom{from{opacity:.5;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}

  /* Floating agent button: respect safe-area, smaller */
  .agentWrap,.floatingAgentWrap{right:14px !important;bottom:14px !important}
  .agentButton,.floatingAgentBtn{width:52px !important;height:52px !important;border-radius:16px !important}

  /* Touch targets */
  .content button:not(.rowAction):not(.ghostBtn):not(.subtleRowAction):not(.hubLink):not(.mdChip):not(.mdAvatar):not(.mdAction):not(.mdLaterToggle):not(.settingsHubLink):not(.settingsHubSectionTitleBtn){min-height:44px}

  /* Wizard scrollable horizontal */
  .wizardSteps{grid-template-columns:repeat(9,minmax(120px,1fr)) !important}

  /* Toolbar: stack inputs and buttons */
  .toolbar{flex-direction:column;align-items:stretch;gap:8px}
  .toolbar input{width:100%;min-width:0}
  .toolbar button{width:100%}

  /* Tabs: horizontal scroll */
  .tabs{overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:8px}
  .tabs::-webkit-scrollbar{display:none}
  .tabs button{flex:0 0 auto;white-space:nowrap}

  /* Kanban becomes stacked */
  .kanban{grid-template-columns:1fr !important}

  /* AI insight bar */
  .aiInsightBar{flex-direction:column;align-items:flex-start;padding:12px}
  .aiInsightBarLeft,.aiInsightBarText{width:100%}
  .aiInsightBarActions,.compactActions{width:100%;flex-wrap:wrap}
  .aiInsightBarActions button,.compactActions button{flex:1 1 auto;min-height:36px}

  /* Toast stack positioning */
  .toastStack{right:14px !important;left:14px !important;bottom:80px !important}
}

/* ============================================================
   MOBILE DASHBOARD — feed unificado
   Only renders on phone (MobileDashboard is only returned by Dashboard
   when viewport is mobile), so these styles only ever apply on mobile.
   ============================================================ */
.mobileDashboard{padding:14px !important;gap:14px !important;display:flex !important;flex-direction:column !important}
.mdGreeting{margin:2px 2px 0}
.mdSalute{display:block;color:#94A3B8;font-size:13px;font-weight:600;margin-bottom:2px}
.mdGreeting h1{margin:0;color:#0F2138;font-size:26px;letter-spacing:-.035em;font-weight:800;line-height:1.1}

.mdHeroStats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.mdHeroStat{background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:14px;box-shadow:0 6px 18px rgba(15,35,65,.04);position:relative;overflow:hidden}
.mdHeroStat.urgent{border-color:#FECACA;background:linear-gradient(180deg,#FFFBFB 0%,#fff 60%)}
.mdStLbl{display:block;color:#64748B;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.mdStVal{display:block;margin:6px 0 1px;font-size:26px;font-weight:800;letter-spacing:-.035em;color:#0F2138;line-height:1.1}
.mdHeroStat.urgent .mdStVal{color:#B91C1C}
.mdStDelta{display:block;color:#94A3B8;font-size:11.5px;font-weight:600}
.mdHeroStat.urgent .mdStDelta{color:#B91C1C;font-weight:700}

.mdChips{display:flex;gap:7px;overflow-x:auto;padding:2px 0;scrollbar-width:none;margin:0 -14px 0;padding:0 14px;-webkit-overflow-scrolling:touch}
.mdChips::-webkit-scrollbar{display:none}
.mdChip{appearance:none;flex:0 0 auto;height:34px;padding:0 13px;border-radius:999px;border:1px solid #E2E8F0;background:#fff;color:#475569;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;box-shadow:none;min-height:34px}
.mdChip:hover{border-color:#CBD5E1;background:#F8FAFC}
.mdChip.active{background:#0F2138;color:#fff;border-color:#0F2138}

.mdSectionHeader{display:flex;align-items:baseline;gap:8px;margin:6px 2px 0}
.mdSectionHeader strong{color:#0F2138;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.1em}
.mdSectionHeader em{font-style:normal;color:#94A3B8;font-size:12px;font-weight:700;margin-left:auto;background:#F1F5F9;padding:2px 9px;border-radius:999px}
.mdIndicator{display:inline-block;width:8px;height:8px;border-radius:50%;background:#DC2626}
.mdSectionWarning .mdIndicator{background:#D97706}
.mdSectionNeutral .mdIndicator{background:#94A3B8}

.mdFeedList{display:grid;gap:9px}
.mdFeedCard{background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:14px;box-shadow:0 4px 12px rgba(15,35,65,.04);display:grid;gap:8px;cursor:pointer;transition:border-color .14s ease,box-shadow .14s ease,transform .12s ease}
.mdFeedCard:hover{border-color:#CBD5E1;box-shadow:0 8px 22px rgba(15,35,65,.07);background:#fff}
.mdFeedCard:active{transform:translateY(1px)}
.mdFeedCard.sev-critical{border-left:3px solid #DC2626;padding-left:13px}
.mdFeedCard.sev-warning{border-left:3px solid #D97706;padding-left:13px}
.mdFeedCard.sev-high{border-left:3px solid #EA580C;padding-left:13px}
.mdCardAi{border-color:#A7F3D0;background:linear-gradient(135deg,#F0FDFA 0%,#fff 60%)}

.mdCardTop{display:flex;align-items:center;justify-content:space-between;gap:10px}
.mdTypeChip{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.mdBadge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:800;border:1px solid #E2E8F0;color:#475569;background:#F8FAFC;white-space:nowrap}
.mdBadge.sev-critical{background:#FEF2F2;color:#B91C1C;border-color:#FECACA}
.mdBadge.sev-warning{background:#FFFBEB;color:#92400E;border-color:#FCD34D}
.mdBadge.sev-high{background:#FFF7ED;color:#C2410C;border-color:#FED7AA}

.mdCardTitle{margin:0;color:#0F2138;font-size:15.5px;font-weight:750;letter-spacing:-.012em;line-height:1.3}
.mdCardContext{margin:0;color:#64748B;font-size:13px;font-weight:600;line-height:1.4}
.mdCardDesc{margin:0;color:#475569;font-size:13px;line-height:1.45}

.mdCardFooter{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:8px;border-top:1px solid #F1F5F9;margin-top:2px}
.mdCardFooterAi{border-top:0;padding-top:0;justify-content:flex-end;margin-top:0}
.mdOwner{display:flex;align-items:center;gap:7px;min-width:0;flex:1}
.mdAvatar{width:24px;height:24px;border-radius:50%;background:#EAF2FF;color:#1D4ED8;display:grid;place-items:center;font-size:10.5px;font-weight:900;flex:0 0 auto}
.mdAvatarNoOwner{background:#FEE9C2;color:#92400E}
.mdOwnerName{color:#475569;font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.mdAction{appearance:none;display:inline-flex;align-items:center;gap:5px;padding:8px 12px;border-radius:9px;background:#0F2138;color:#fff;border:0;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0;min-height:36px;box-shadow:none}
.mdAction:hover{background:#1E293B}
.mdActionCritical{background:#DC2626}
.mdActionCritical:hover{background:#B91C1C}
.mdActionAi{background:#0D9488}
.mdActionAi:hover{background:#0F766E}

.mdLaterToggle{appearance:none;width:100%;padding:12px;background:#fff;border:1px dashed #CBD5E1;border-radius:12px;color:#64748B;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;box-shadow:none}
.mdLaterToggle:hover{background:#F8FAFC;border-color:#94A3B8;color:#0F2138}

.mdBrowseSection{margin-top:6px}
.mdBrowseGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px}
.mdBrowseCard{appearance:none;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:14px;text-align:left;cursor:pointer;font-family:inherit;display:grid;gap:2px;min-height:64px;box-shadow:0 2px 8px rgba(15,35,65,.03);transition:border-color .14s ease,box-shadow .14s ease}
.mdBrowseCard:hover{border-color:#CBD5E1;box-shadow:0 6px 16px rgba(15,35,65,.05);background:#fff}
.mdBrowseCard strong{color:#0F2138;font-size:14px;font-weight:750;letter-spacing:-.012em}
.mdBrowseCard span{color:#94A3B8;font-size:11.5px;font-weight:600}
`;

const commandPaletteStyles = `
/* ============================================================
   COMMAND PALETTE — ⌘K modal
   ============================================================ */
.cmdBackdrop{position:fixed;inset:0;background:rgba(11,31,58,.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:200;display:flex;align-items:flex-start;justify-content:center;padding:120px 20px 20px;animation:cmdFadeIn .14s ease-out}
@keyframes cmdFadeIn{from{opacity:0}to{opacity:1}}

.cmdPalette{width:100%;max-width:640px;background:#fff;border:1px solid var(--border);border-radius:14px;box-shadow:0 32px 90px rgba(11,31,58,.32);overflow:hidden;display:flex;flex-direction:column;max-height:calc(100vh - 160px);animation:cmdSlideIn .18s cubic-bezier(.32,.72,0,1)}
@keyframes cmdSlideIn{from{opacity:0;transform:translateY(-8px) scale(.99)}to{opacity:1;transform:translateY(0) scale(1)}}

.cmdInputWrap{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #EEF2F7;flex-shrink:0}
.cmdInputIcon{color:#94A3B8;flex:0 0 auto}
.cmdInput{flex:1;border:0;outline:0;background:transparent;font-family:inherit;font-size:15px;color:var(--text);min-width:0;padding:0}
.cmdInput::placeholder{color:#94A3B8;font-weight:400}
.cmdEsc{display:inline-flex;align-items:center;height:22px;padding:0 7px;border-radius:6px;background:#F8FAFC;border:1px solid #E2E8F0;color:#64748B;font-size:10.5px;font-weight:700;font-family:inherit;flex-shrink:0;letter-spacing:.02em}

.cmdResults{flex:1;overflow-y:auto;padding:6px 8px;min-height:0}
.cmdGroup{padding:6px 0}
.cmdGroup + .cmdGroup{border-top:1px solid #F1F5F9;margin-top:2px;padding-top:8px}
.cmdGroupLabel{margin:4px 8px 6px;color:#94A3B8;text-transform:uppercase;font-size:10.5px;letter-spacing:.14em;font-weight:800}

.cmdItem{appearance:none;display:flex;align-items:center;gap:11px;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:8px;cursor:pointer;font-family:inherit;color:#475569;transition:background .12s ease,color .12s ease;box-shadow:none}
.cmdItem:hover,.cmdItemSelected{background:#F1F5F9;color:#0F2138}
.cmdItem:focus-visible{outline:none}
.cmdItemIcon{width:28px;height:28px;border-radius:8px;background:#F1F5F9;color:#475569;display:grid;place-items:center;flex:0 0 auto;transition:background .12s ease,color .12s ease}
.cmdItemSelected .cmdItemIcon{background:#fff;color:#0F2138;border:1px solid #E2E8F0}
.cmdItemAi .cmdItemIcon{background:#F0FDFA;color:#0D9488}
.cmdItemAi.cmdItemSelected .cmdItemIcon{background:#fff;color:#0F766E;border-color:#A7F3D0}
.cmdItemText{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}
.cmdItemText strong{font-size:13.5px;font-weight:700;color:#0F2138;letter-spacing:-.005em;line-height:1.3}
.cmdItemText span{font-size:11.5px;color:#64748B;font-weight:500;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cmdItemEnter{font-size:13px;color:#94A3B8;font-weight:700;flex:0 0 auto;margin-left:8px;line-height:1}

.cmdEmpty{display:flex;flex-direction:column;gap:4px;align-items:center;padding:32px 16px;text-align:center}
.cmdEmpty strong{color:#0F2138;font-size:14px;font-weight:700}
.cmdEmpty span{color:#94A3B8;font-size:12.5px;font-weight:500}

.cmdFooter{display:flex;align-items:center;gap:18px;padding:10px 16px;background:#FAFCFF;border-top:1px solid #EEF2F7;flex-shrink:0;color:#64748B;font-size:11.5px;font-weight:600}
.cmdFooter kbd{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;border-radius:4px;background:#fff;border:1px solid #E2E8F0;color:#475569;font-size:10px;font-weight:800;font-family:inherit;letter-spacing:0;margin:0 3px 0 0;line-height:1;box-shadow:0 1px 0 rgba(15,35,65,.04)}
.cmdFooter span{display:inline-flex;align-items:center}

@media(max-width:600px){
  .cmdBackdrop{padding:60px 12px 12px;align-items:stretch}
  .cmdPalette{max-height:calc(100vh - 80px)}
  .cmdInputWrap{padding:12px 14px}
  .cmdInput{font-size:14px}
  .cmdFooter{padding:9px 14px;gap:12px;font-size:11px}
}
`;


ReactDOM.createRoot(document.getElementById('root')).render(<App />);
