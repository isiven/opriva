---
version: alpha
name: Opriva Tenant App Design System
---

## Overview
Opriva Tenant App is a premium enterprise SaaS workspace for managing assets, expirations, renewals, licenses, contracts, warranties, services, alerts, tasks, documents, reports and AI assistance. The system supports both internal company mode and integrator/MSP mode without changing the core navigation model.

## Colors
- Primary navy: `#0B1F3A` for sidebar, hierarchy, executive surfaces.
- Primary blue: `#2563EB` for main actions, focus, selected states.
- Opriva teal: `#0D9488` for brand accents on light surfaces.
- Opriva teal light: `#2DD4BF` for logo and accents on dark surfaces.
- Success: `#16A34A`.
- Warning: `#F59E0B`.
- Critical: `#DC2626`.
- Background: `#F7F9FC`.
- Cards: `#FFFFFF`.
- Text primary: `#111827`.
- Text secondary: `#6B7280`.
- Borders: `#E5E7EB`.
- Dark background: `#07111F`.
- Dark cards: `#0F172A`.
- Dark borders: `#1E293B`.
- Dark text primary: `#F8FAFC`.
- Dark text secondary: `#94A3B8`.

## Typography
- Primary font direction: Outfit / Geist / Instrument Sans style, modern SaaS sans.
- Product wordmark: Opriva, medium/semi-bold, clean corporate sans; keep stable and non-animated for product identity surfaces.
- Data-heavy UI uses compact but readable labels, 12–14px metadata, 16px body, 18–24px section headers, 30–52px dashboard headlines.

## Rounded
- Controls: 10–12px.
- Cards: 16–20px.
- Badges: full pill radius.
- Floating AI button: circular.

## Spacing
- App shell padding: 18–20px.
- Card padding: 16–24px.
- Table rows: 10–12px vertical padding.
- Section gaps: 14–20px.
- Dashboard grids use 14px for KPI density and 20px for major sections.

## Components
- Fixed left sidebar with grouped MVP navigation: Overview, Manage, Work and Admin; optional modules are enabled from Settings rather than shown by default.
- Sticky topbar with global search, workspace selector, alerts indicator and profile; topbar identity represents the tenant/company, not the AI agent.
- Official Opriva product identity is stable and corporate: use the Opriva lockup for sidebar brand, app shell, login, reports, emails and workspace branding.
- Opriva AI Agent mark is only for the floating AI assistant: open green circular contour plus green focus dot, recreated inline for dot tracking, hover blink, and inactivity blink with a short contextual nudge message.
- Enterprise cards with light border, subtle shadow, clear headings and action slots.
- Tables include search, advanced filters, saved views, column customization, bulk actions, badges, owner avatars and pagination.
- Detail pages share a header/action pattern, tabs, overview cards and right metadata panel.
- AI assistant access is the fixed floating Opriva AI Agent trigger; do not place an AI entry in the topbar.
- Empty states include a small illustration block, clear explanation, create/import actions and AI setup suggestion.

## Interaction Principles
- Urgency is communicated through risk badges, days remaining, critical color, next action and AI recommendation.
- Every record pattern exposes owner, related company, amount/value, status, next action and alert policy.
- MSP/integrator and internal company use cases share Clients / Companies labels and flexible type fields.
- Dark surfaces are reserved for AI, login visual and premium intelligence panels.

## Enterprise Refinements
- Main Dashboard uses an executive command-center model: 90-day renewal exposure, critical countdowns, unassigned records, overdue tasks, auto-renewal exposure and AI confidence.
- Expirations List is the source-of-truth risk register with saved views, search, risk/type filters, bulk actions, column controls, owner visibility, vendor, exposure and next-action columns.
- Expiration Detail pages prioritize workflow readiness: expiration date, financial exposure, business impact, next milestone, approval steps, evidence timeline, metadata and AI recommendation.
- AI Assistant Panel should show operational sources, confidence, concrete next actions and draftable outputs rather than decorative chat-only prompts.
- High-value tweak controls: accent color, risk emphasis, panel density and AI panel visibility.


## Tenant Configuration Patterns
- Settings uses a lightweight configuration-directory hub with six simple groups: Company, Access, Data, Automation, AI Operator and Governance. The hub shows category links only; detailed rows, statuses and toggles appear after a setting is opened.
- Users tables should expose identity, email, role, department, tenant scope, MFA/SSO status and last activity so admins can manage real access risk.
- Roles are reusable templates with clear module permissions, approval/export boundaries, assigned-user counts and access-risk labels.
- Categories are tenant-specific taxonomy objects that define module behavior, renewal rules, required metadata and protected/default status.
- Custom fields include type, module applicability, validation/required logic and business owner; use structured fields to reduce spreadsheet workflows.
- Notification rules combine record scope, deadline schedule, recipient path, channels, escalation behavior and auditability.


## Clients / Companies List Pattern
- Clients / Companies is a true list-management screen: one purpose, one focal area, and the table as the dominant operational surface.
- The default page uses only the essential sequence: sidebar, topbar, page header, compact KPI strip, toolbar, clients table and one floating AI entry.
- Permanent bottom detail previews, same-page detail panels, saved-view strips, AI cards and extra status bars are not used on the default list screen.
- AI presence is supportive, not architectural: use one quiet floating button that can route to AI assistance, never a permanent right column.
- Visible actions are intentionally limited: Create client/company, Import clients, More, search, filters, saved views, columns and export. Avoid visible row actions unless explicitly needed.
- Meaningful table columns should stay minimal by default: company identity, type, owner, active items, expiring items, value at risk, risk and status. Move country/contact into compact company metadata when space is tight. Keep row actions subtle.


- Clients / Companies uses a compact four-metric KPI strip above the table: total clients, clients at risk, expiring items this month and renewal value at risk; it should read as a strip, not a large card grid.
- List screens should not reserve permanent AI columns or render large AI insight blocks by default.
- Defensive UI rendering is required for enterprise data: names, contacts, owners, statuses, labels and initials must have safe fallbacks and never assume complete tenant data.
## UX Polish Standard

## Hard Redesign Operational Screens
- Dashboard is an operational command center, not a marketing hero. It starts with a compact header, four-metric summary strip, critical action queue, expiring items, open tasks, missing owner/document audit rows, compact AI insight and recent activity.
- Expirations is a serious operational renewal-risk register. It uses only a page header, compact metric strip, small saved-view segmented control, one unified toolbar, one main table and an optional floating AI trigger; duplicated search/filter rows, full-height AI sidebars, large cards and decorative modules are avoided.
- AI is never a permanent full-height right column on operational screens. Use a quiet topbar trigger, floating entry, or compact contextual module only.
- Topbar stays shallow and task-oriented: global search, workspace selector, small create action, notifications, AI trigger and profile. Page titles live inside page headers, not duplicated in the topbar.
- Sidebar uses a calm dark executive surface with compact navigation rhythm, subtle selected state and separated administration shortcuts.
- Tables are the dominant work surface and must remain scannable: compact controls, clear row hierarchy, restrained badges, safe fallbacks and no visible row-action clutter by default.

- The app shell should feel like an enterprise operating system, not a generated dashboard: calm background, precise borders, restrained shadows, and fewer decorative effects.
- Sidebar navigation uses a darker executive surface, compact rhythm, shaped selected state, and visible hierarchy beyond color alone.
- Main surfaces use white cards with subtle blue-gray borders, 18–24px radii, clear section dividers, and stronger typographic contrast for operational scanning.
- Tables prioritize trust: sticky-feeling header treatment, readable row spacing, hover affordance, clear status badges, and horizontally safe enterprise column density.
- The dedicated AI Assistant is a strict five-part contextual copilot, not a stacked-card dashboard: small header, one primary insight, three suggested actions maximum, one prominent clean chat input, and one structured output area.
- AI surfaces reduce visual noise aggressively: avoid long suggestion stacks, bulky source blocks, repeated cards, oversized dark slabs, duplicate controls and explanatory copy that competes with the input.
- Interaction states include focus-visible rings, hover plus press feedback, reduced-motion support, and responsive collapse of the AI panel before the main workflow becomes cramped.



## Global Search Command Center

- Global Search is a focused command-center screen for finding records or asking operational questions; it is not a dashboard or card library.
- The content sequence is: compact page header, command-bar search, compact module modes, subtle AI search option, suggested/recent/saved queries, then grouped result rows.
- The command bar is the main focus but remains restrained: centered, 900–1000px wide, white surface, shortcut hint, and one primary action.
- Mode tabs stay compact: All, Clients, Expirations, Licenses, Contracts, Documents and Tasks. Avoid large chip stacks or duplicated filter/search rows.
- Results are grouped by operational object and rendered as compact rows with record name, type, related company/client, risk/status, relevant date and subtle quick actions.
- Empty/default state should show recent searches, suggested operational questions and recently viewed/saved records only; never show design-system empty-state libraries to end users.
- AI is integrated as a quiet mode or Ask AI action inside rows and suggestions, not as a full assistant page or heavy side panel within search.

## AI Assistant Interaction Model

- Opriva AI is no longer page-first, panel-heavy, or topbar-bound; default access is a fixed bottom-right Opriva Agent button.
- Operational screens open AI in a compact contextual right drawer, not a full-height permanent sidebar, large AI page, or stacked-card dashboard.
- The drawer uses one small header, current screen context, no more than three screen-relevant actions, one compact ask input, subtle metadata, and one restrained output area.
- Screen-level actions must match the module: Dashboard summarizes risk/priorities, Expirations finds critical renewals, Clients summarizes exposure, Documents summarizes files, and Tasks generates follow-up actions.
- Sources checked are hidden or expressed as subtle metadata; never render them as a bulky block by default.
- Dedicated AI Assistant page is a minimal workspace for search/input, recent prompts, saved workflows, and compact results only.
- AI should support action and decision-making without competing with tables, registers, or operational work surfaces.


## Enterprise IA and Workflow Patterns

Corexi modules must share the same shell, typography, buttons, badges, spacing, drawers, filters and table language, but must not reuse one generic page pattern everywhere. Each module is designed around one primary user intention.

### Hard product-screen rules
- One screen has one primary job-to-be-done and one dominant focal area.
- Do not use marketing heroes, empty-state libraries, duplicated toolbars, oversized action buttons, fake empty rows, or permanent detail previews in list screens.
- Secondary information moves to a row drawer or dedicated detail page.
- AI is progressive and contextual: floating Opriva Agent trigger, compact module drawer, and a minimal dedicated AI workspace only if needed.
- Use compact summaries only when they directly help prioritization, exposure, validation or execution.

- Empty states are contextual only: render one module-specific state when that module truly has no records; never show a general Empty State Library or cross-module empty-state gallery in the product UI.


- List and table screens must never use fake filler rows, blank cells, avatar-only rows, or status-badge-only rows. Every row needs business-readable values: named record, related client/company, owner/contact, date or quantity, risk/status, value where relevant, and a clear next action.
- Sample data must feel tenant-realistic and module-specific. Avoid generic companies or placeholder names; rows should reveal the operational situation at a glance, such as renewal exposure, missing owner, expiring warranty, document version, SLA risk, or recommended action.

### Module layout patterns
- Dashboard: attention command center with executive summary, priority list, critical expirations, overdue work, missing data and small AI insight.
- Global Search: centered command bar, compact modes, suggested/recent/saved queries, grouped result rows and restrained row actions.
- Contacts: compact people directory with company, role, contact type and communication actions; no default AI/detail panel.
- Clients / Companies: exposure register with summary strip, risk/status table and row drawer/detail access.
- Expirations: renewal-risk workbench with saved views, one unified toolbar, table, and optional timeline/calendar view.
- Licenses: renewal and usage-risk table with brand/product filters and next-action emphasis.
- Contracts: legal/commercial agreement register with auto-renewal and document-status visibility; AI summaries belong in detail view.
- Warranties: asset coverage table focused on serials, support status, expiration risk and next action.
- Services: recurring service/SLA register with value, status, owner and open-task visibility.
- Documents: document library with filters and preview drawer.
- Tasks: compact kanban/list execution surface with due dates, priority, owner and related record.
- Alerts: severity-led resolution list with recommended action.
- Reports: practical report center with builder entry, templates, recent reports and schedules.
- Data Import: compact stepper, mapping table, validation errors and AI side helper.
- Settings: minimal configuration directory with Company, Access, Data, Automation, AI Operator and Governance groups; never stack every setting detail on the main hub.


## Data Architecture and Dynamic Forms

- Corexi records use a shared Tracked Item / Managed Record base entity for cross-module search, reporting, alerts, ownership, dates, financial exposure, documents, audit history and lifecycle state.
- The app must not use one generic static form for all categories. Category-specific detail entities extend the base record for Licenses, Contracts, Warranties, Services, Hardware Assets, SSL Certificates, SaaS Subscriptions, Certifications, Insurance Policies and Maintenance Agreements.
- Dynamic creation starts with category/type, company/client and product/SKU or template. Only then should the form reveal category-required fields, template defaults, alert policies, document requirements, workflow/status options and tenant custom fields.
- Forms use progressive disclosure with sections for Basic information, Dates & renewal, Vendor/product, Financials, Ownership, Documents, Alerts and Custom fields. Avoid showing all possible fields at once.
- Master data catalogs are first-class product surfaces: Vendors / Providers, Brands / Manufacturers, Products & SKUs, Categories, Subcategories, Service Levels and Templates.
- Inline creation is allowed for vendor, brand, product and category, but Corexi must suggest possible duplicates before creating a new catalog record.
- Custom fields are tenant-scoped and category/module-scoped, with supported types: text, number, date, currency, dropdown, multi-select, checkbox, user, file, URL, email, phone and percentage.
- Enterprise governance belongs to the model: required fields by category, default alert policy by category, category-specific risk scoring, document requirements, workflow/status logic, audit trail and activity history for every change.


## Navigation and Settings IA

- Normal tenant users should not see “Data Architecture” as a main sidebar item. The concept is named “Data Management” and lives inside Settings.
- MVP sidebar groups: Overview contains Dashboard, Attention Center and Search; Manage contains Companies / Clients, Expirations, Licenses, Contracts and Documents; Work contains Tasks and Reports; Admin contains Data Import and Settings.
- Contacts are part of Companies / Clients as a tab. Alerts live in Attention Center and the topbar alert indicator. The floating Opriva Agent is the default AI entry; AI governance lives in Settings, not as a primary module.
- Warranties, Services and Assets are optional modules enabled from Settings > Data Management / module enablement, keeping onboarding less overwhelming.
- Settings rows should use concise descriptions, meaningful status indicators and clear hierarchy; avoid generic repeated “Configure” actions and avoid Export buttons without a specific purpose.


## Operational Depth Principle

Corexi redesign work must preserve functional intent while improving visual clarity. The product should feel cleaner, more premium and easier to scan, but operational screens must not be flattened into summary-only pages.

- Keep the modern shell, typography, spacing, card/table polish and enterprise hierarchy.
- Do not remove important workflow blocks such as filters, saved views, bulk actions, configurable columns, tabs, approvals, missing-data queues, document states, import validation, or contextual AI actions.
- Dashboard remains an operational command center with KPIs, attention queue, quick actions, missing owners/documents/approvals and actionable AI insights.
- Attention Center remains a queue system with tabs, filters, saved views, severity grouping and bulk action support.
- Global Search remains a real search workspace with scope filters, recent searches, suggested questions, grouped results and natural language queries.
- Companies / Clients remains the main relationship workspace; Contacts are a tab/subview inside it, and company detail connects expirations, licenses, contracts, documents and tasks.
- Expirations, Licenses, Contracts and Documents use operational worklists with filters, saved views, bulk actions, configurable columns, meaningful fields and record-detail access.
- Tasks support both list and kanban/board workflows.
- Reports is a reports center with templates, scheduled reports, generated reports, executive reports, governance reports and export history/center.
- Data Import is a complete workflow: landing/history plus upload, module selection, column mapping, validation, duplicate detection, error fixing, AI suggestions, confirmation and summary.
- Settings remains a professional configuration directory. The main hub shows only grouped links; users open a focused detail view for rows, descriptions, status pills, toggles or actions.


## AI Experience

- Corexi AI is a contextual operational copilot, not a generic chatbot or permanent heavy module.
- Default view is simple; expanded view is powerful. The product should show only the AI help needed for the current screen until the user asks for more.
- The floating Opriva Agent is the only default AI entry and opens a compact contextual drawer; screen content remains primary.
- The drawer shows Corexi AI, current context, short helper text, one input, up to three suggested actions, subtle context metadata and one recent result only.
- AI suggestions adapt by route: Dashboard prioritization, Attention triage, natural language Search, client intelligence, renewal risk, license exposure, contract review, document intelligence, task planning, report building, import cleanup and settings configuration.
- AI outputs stay short and action-oriented: summary, key findings, recommended actions, action buttons and muted context source metadata.
- Sensitive AI actions require review before applying, especially task creation, owner assignment, email drafts, imports and report generation.
- Each major module may show one compact AI insight card focused on practical next actions, never long stacked AI cards or visually dominant AI panels.
- Advanced workflows such as 90-day renewal review, missing owner cleanup, missing documents cleanup, client meeting brief, executive report generator, contract review, import mapping assistant and renewal follow-up drafts live under More actions, AI workflows or history by default.
- AI Operator settings live as links on the Settings hub; opening them reveals assistant availability, AI permissions, approval rules, data scope, living operator behavior and activity level controls.


- Floating Opriva Agent must remain the only default AI entry point: no topbar AI button, fixed bottom-right at 24px, accessible label “Open Opriva AI Assistant”, compact right-side drawer, and no default demo toasts covering the trigger.
- Toasts are event-driven only: never visible on load, auto-dismiss after a short duration, and stack above the floating agent without blocking the button.



## Opriva AI Operator Micro-messages

The floating Opriva AI Operator may show one compact contextual micro-message near the bottom-right agent button. Messages are short, action-oriented, dismissible, auto-dismiss after a few seconds, and must never cover tables, forms, buttons, or core content. The system rotates context-specific tips for Dashboard, Data Import, Expirations, Licenses, Contracts, Companies / Clients, Documents, Tasks, Reports, and Settings, and reduces frequency when ignored.

Controls include: Enable living AI Operator, Show contextual tips, Allow soft cursor follow, Activity level (Quiet / Balanced / Proactive), Reduce motion, and Mute assistant for this session. Defaults are living enabled, contextual tips enabled, Balanced activity, soft cursor follow enabled, and reduced-motion respected automatically.

## Living Opriva Agent Behavior

The floating Opriva Agent remains the only AI entry point and must feel premium, observant, and non-invasive. Default behavior is simple; expanded behavior is powerful.

- **Mark concept:** the AI Agent mark is a minimal open circular green contour with a green active focus dot. It is agentic and enterprise-grade, never a cartoon eye or decorative mascot.
- **Idle mode:** the mark rests in its original open circular geometry with subtle breathing only.
- **Curious mode:** after sustained screen attention, may show one small contextual nudge such as “Need help with this?” or “I found something relevant here.”
- **Assistive mode:** for critical expirations, missing owners, missing documents, validation issues, or blocked workflows, may add a restrained glow and one compact suggested action.
- **Eye follow mode:** only the green dot tracks the cursor softly by calculating cursor angle from the fixed icon center, then lerping the dot along a constrained circular/orbital path. The floating button remains fixed and never chases the cursor. The open contour subtly reorients with the dot as an internal SVG motion state, then returns to rest.
- **Blink mode:** optional temporary blink may briefly compress or mask the mark into a narrow closed state, then immediately returns to the original open circular geometry.
- **Working mode:** when Opriva AI is open or processing, shows a focused thinking state.
- **Muted mode:** static launcher, no proactive nudges, no cursor follow.

Configurable controls: Enable living agent, Eye follows cursor, Show proactive suggestions, Reduce motion, and Mute assistant. Reduced motion is respected automatically through `prefers-reduced-motion` and user control.


### Settings administration pattern

Settings uses a two-panel administration layout: a sticky left navigation panel grouped by General, Access & Security, Data Management, Automation, AI & Operator, and Governance, with only the selected section shown in the right panel. Do not stack all settings sections in one long scrolling page. AI & Operator remains a dedicated section with approval-first rows, readable descriptions, contained status pills, right-side controls, and operator behavior controls separated from Governance.
