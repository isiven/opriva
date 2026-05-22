# Opriva Project Memory

## 1. Project Overview

Opriva is an enterprise SaaS platform for IT Asset & Renewal Intelligence. It helps teams understand what expires, what it costs not to act, who owns the work, and which renewals or approvals need attention.

The main app currently lives in `source/App.jsx`.

## 2. Current State

The app is a single-file React prototype that is compatible with the current runtime. `source/App.jsx` contains the application shell, workspace mode behavior, screens, mock data, component definitions, and injected styles.

The root entrypoint is `index.html`, which loads `source/main.jsx`. `source/main.jsx` exposes `React` and `ReactDOM` on `window`, then dynamically imports `source/App.jsx`.

## 3. Design Direction

Opriva should feel like a focused enterprise SaaS operations tool: dense, clear, quiet, and built for repeated use. The design should prioritize readable tables, accountable actions, risk triage, workspace context, and executive-ready renewal intelligence.

Do not redesign the product surface without a separate design decision.

## 4. Product Decisions

- Keep the app as a single-file prototype for now.
- Keep the current runtime compatibility model.
- Keep `source/App.jsx` as the main app surface until a planned component split is approved.
- Keep workspace mode as the core product switch.
- Keep sidebar label overrides visual only.
- Do not change internal routing ids as part of label cleanup.

## 5. Workspace Modes

Supported workspace modes:

- `MSP / Integrator`
- `Internal IT`
- `Hybrid`
- `Custom`

The Topbar includes a temporary Mode selector. Internal IT uses `Grupo Regency Workspace`. MSP / Integrator uses `Nextcom MSP Workspace`.

## 6. Internal IT Model

Internal IT represents a company managing its own IT estate. Its commercial model is:

`Brand + Provider + Department + Budget / Approval / Risk`

Use this model for Internal IT dashboards, renewal forecasts, vendor intelligence, attention workflows, and department views.

## 7. MSP / Integrator Model

MSP / Integrator represents a provider managing multiple client accounts and renewals. Its commercial model is:

`Client + Brand + Product + Distributor + Value + Margin + Owner + Action`

Use this model for MSP dashboards, vendor intelligence, renewal worklists, and client-facing operational queues.

## 8. Sidebar Collapse Decision

The sidebar has expanded and collapsed modes. Collapsed mode uses icons and tooltips. The main layout adjusts when the sidebar is collapsed.

Do not break:

- `sidebarCollapsed`
- `.appSidebarCollapsed`
- sidebar icon visibility
- collapsed tooltips
- workspace margin adjustment

## 9. Dashboard MSP Decision

The MSP dashboard already uses:

`Client / Brand / Product / Distributor / Renewal / Value / Margin / Owner / Action`

This structure is correct and should remain the reference for MSP renewal intelligence.

## 10. Dashboard Internal IT Decision

The Internal IT dashboard already distinguishes Brand and Provider. It also tracks department impact and approval-oriented actions.

Internal IT dashboard language should remain tied to internal budget exposure, department impact, provider dependency, approval blockers, and risk.

## 11. Attention Center Internal IT Decision

The Internal IT Attention Center was refined for:

- Brand / Provider separation
- approval blockers
- missing evidence
- missing owners
- provider dependency
- department exposure

This is the expected direction for Internal IT triage.

## 12. Brand / Provider / Distributor Commercial Relationship Model

Do not mix Brand, Provider, Distributor, Client, and Department.

- Brand: the technology brand or manufacturer in use or sold.
- Provider: the supplier, reseller, service provider, or implementer serving an Internal IT organization.
- Distributor: the upstream distributor or wholesaler used by an MSP / Integrator.
- Client: the end customer served by an MSP / Integrator.
- Department: the internal business area in an Internal IT organization.

Internal IT Vendors use Brand / Provider.
MSP Vendors use Brand / Distributor.

## 13. Runtime Compatibility Facts

- `source/main.jsx` imports React and ReactDOM Client.
- `source/main.jsx` assigns `window.React` and `window.ReactDOM`.
- `source/main.jsx` uses dynamic `import('./App.jsx')` so those globals exist before `App.jsx` executes.
- `source/App.jsx` mounts itself with `ReactDOM.createRoot(document.getElementById('root')).render(<App />);`.
- `index.html` provides `<div id="root"></div>`.

Do not change the runtime for now.

## 14. What Not To Touch

Do not touch without an explicit implementation phase:

- `source/App.jsx`
- runtime boot order
- `ReactDOM.createRoot(...)`
- `workspaceMode`
- sidebar collapse behavior
- Floating Opriva AI
- internal route ids
- Topbar Mode selector — **temporary design control, do not remove without explicit approval. Final workspaceMode configuration lives in Settings → Company → Operating Model.**
- Dashboard MSP column model
- Dashboard Internal IT Brand / Provider model

## 14a. Tasks as Execution Layer

Tasks is the execution layer for Opriva. Attention Center identifies blockers and risks; Tasks tracks assigned work to resolve them. MSP tasks focus on client follow-up, distributor quotes and commercial ownership. Internal IT tasks focus on department owners, approvals, budget reviews, provider quotes and evidence requests.

Each task should clearly communicate why it exists (Source), what impact it carries (Impact) and what action should happen next (Action). Tasks columns include Source and Impact so the list view functions as an operational queue, not just a to-do list.

## 14b. Settings → Operating Model Source of Truth

`Settings → Company → Operating Model` is the declared source of truth for `workspaceMode`. Workspace Mode is selected during onboarding/registration as part of workspace setup. Settings → Operating Model is the administrative surface for reviewing or adjusting that configuration. The topbar Mode selector remains a temporary design preview control and must not be treated as the production workflow.

The following structures inside `SettingsGroupPanel` must be kept in sync with the commercial model:

- `terminologyPreview` — entity labels per workspace mode
- `navigationPreview` — navigation items per workspace mode
- `importTemplatePreview` — import field order per workspace mode
- `selectedModeExplanation` — mode description per workspace mode

Hooks must remain before any conditional returns in React components. React error #300 must not appear. The app must not show a white screen.

## 14c. Reports as Distribution Layer

Reports is Opriva's executive distribution layer. It packages Dashboard KPIs, Attention Center risks, Data Import completeness and Tasks execution status into outputs for leadership, finance, account management and compliance.

## 14e. Documents as Evidence Layer

Documents is Opriva's evidence layer. It tracks required documents, signed contracts, quotes, warranty proof, approval forms, versions and access status. Missing required evidence feeds Attention Center, Tasks and Reports.

## 14h. Enterprise Table Rule

Every major Opriva table must be configurable by the user. Users should be able to show/hide columns, reorder columns, apply filters, save views, perform bulk actions and export data. In the MVP, this behavior can be represented visually through controls such as Configure columns, Saved view, Filters and Bulk actions. Full persistence and advanced table customization are Phase 2.

Columns should not be considered fixed forever. The default table view should be optimized for the selected workspace mode, but users should eventually be able to adapt the table to their operational needs.

Applies to: Dashboard queues, Attention Center, Departments, Renewals Forecast, Licenses, Hardware, Contracts, Documents, Tasks, Reports, Data Import validation tables.

## 14g. Hardware as Physical Asset Layer

Hardware is Opriva's physical asset layer. Warranties live inside Hardware as warranty end date, support coverage and renewal status. Contracts can link to hardware or licenses. Warranties as a standalone module remain Phase 2.

Hardware detail views, asset lifecycle history, location/rack fields and bidirectional links to Contracts/Documents are Phase 2. Brand Intelligence / Provider Intelligence also remains a Phase 2 analytics candidate.

## 14f. Licenses — Per-Record License Portfolio

Licenses must represent per-record license/product inventory. Brand / Provider / Distributor Intelligence is valuable but should become a Phase 2 analytics or portfolio intelligence view, not the primary Licenses screen.

`MspVendorIntelligenceScreen` and `VendorIntelligenceScreen` are preserved in code as Phase 2 candidates for a future Brand Intelligence / Portfolio Intelligence / Analytics view. They are not connected to any active route.

## 14d. Contracts as Obligation and Evidence Layer

Contracts tracks counterparty obligations, notice periods, document evidence and approval blockers. In MSP / Integrator it surfaces client/provider contract risk and commercial renewal actions. In Internal IT it surfaces department/provider exposure, approval gaps and evidence requirements.

## 15. Core Record + Related Tabs + Workspace Policies Model

This section documents the approved product architecture for record creation, related-tab management, document handling, license logic, renewal workflows, and the document policy model. Do not implement these decisions unless explicitly requested. This section is the authoritative product reference.

---

### 15.1 Core Record Creation

Opriva follows a **core-record + related-tabs model**.

Creation forms should remain minimal. They should only capture the required information needed to create the base record.

The initial creation form must **not** include:
- computed fields
- analytics fields
- relationship fields
- document workflow fields
- task fields
- activity / history fields
- renewal workflow stages
- manually selected expiration statuses

Relationships, documents, tasks, and activity should be managed **after record creation** through the record drawer tabs.

The record drawer must include these tabs:
1. **Overview** — summary, renewal/expiration, commercial fields, notes, record setup guidance
2. **Relationships** — link contracts, licenses, hardware, support agreements
3. **Documents** — attach and view evidence linked to this record
4. **Tasks** — create and track follow-up actions for this record
5. **Activity** — generated history, workflow events, audit trail

---

### 15.2 Fields That Should Not Be Manually Entered

Opriva must not ask users to manually enter values that can be calculated, inherited, derived from policy, or generated from workflow actions.

**Fields that must be calculated or derived — never user-entered:**

| Field | Derived from |
|---|---|
| System Status | Expiration Date + Alert Policy |
| Days to Expiration | Expiration Date vs today |
| Alert Status | Alert Policy threshold |
| Margin $ | Sale Price − Vendor Cost |
| Margin % | Margin $ ÷ Sale Price |
| Validity Status | Document policy + dates |
| Evidence Gap | Document policy + attached docs |
| Renewal Stage | Workflow events and actions |
| Risk signals | Calculated — unless a clear override model is approved |

These values should be calculated in the background and surfaced in:
- tables
- record drawer insights
- dashboards
- reports
- Attention Center
- AI summaries

---

### 15.3 License Record Logic

A **License record** is not the same as a Renewal Opportunity or Renewal Workflow. The base License form tracks what is being managed, not how it will be renewed.

**MSP / Integrator license creation form fields:**

Required:
- License / Product
- Client
- Expiration / Renewal Date
- Renewal Owner
- Alert Policy
- Quantity / Seats
- Distributor / Provider
- Sale Price / Annual Value
- Vendor Cost

Optional:
- Start Date
- License Term
- Notes

**System calculates (never user-entered):**
- Brand — from selected product
- System Status — from Expiration Date + Alert Policy
- Days to Expiration — from Expiration Date vs today
- Margin $ — from Sale Price − Vendor Cost
- Margin % — from Margin $ ÷ Sale Price

**Internal IT license creation form fields:**

Required:
- License / Product
- Department
- Expiration / Renewal Date
- IT Owner / Budget Owner
- Alert Policy
- Quantity / Seats
- Provider
- Annual Cost
- Cost Center
- Approval Status
- Business Criticality

Optional:
- Notes

**Internal IT must not show commercial resale margin fields:**
- Sale Price (as a resale price)
- Vendor Cost (as a resale cost)
- Margin $
- Margin %

---

### 15.4 Expiration Status Logic

Expiration-related status must **not** be manually selected by the user.

**User enters:**
- Expiration / Renewal Date
- Alert Policy

**Opriva calculates:**

| Condition | Status |
|---|---|
| No expiration date entered | Pending date |
| Expiration date is in the past | Expired |
| Inside alert window | Expiring soon |
| Outside alert window | Active |

---

### 15.5 Renewal Workflow Logic

**Renewal Stage must not appear in the initial License creation form.**

Renewal Stage belongs to a future renewal workflow that is generated when the item enters its alert / renewal window.

**Potential renewal workflow stages (future, not yet implemented):**
- Not started
- Quote needed
- Quote requested
- Proposal sent
- Waiting for client
- Approved
- Renewed
- Cancelled / Lost

These stages must be driven by actions, tasks, documents, and workflow events — not manually selected during initial license creation.

---

### 15.6 Record Creation Flow

The creation form should stay simple. The **post-creation flow** should allow users to complete the record immediately without restarting from scratch.

**Approved flow:**
1. Fill in core creation form
2. Save record
3. Automatically open the record drawer
4. Show a **Record Setup / Complete Setup** section in the Overview tab
5. Guide the user to complete the record through the correct tabs:
   - Attach document → Documents tab
   - Link contract / license / hardware / support → Relationships tab
   - Create follow-up task → Tasks tab
   - View generated history → Activity tab

Contracts, documents, tasks, and workflow history must not be placed inside the initial creation form.

---

### 15.7 Document Management Model

Opriva must not use one generic document status for all documents.

Document logic must be governed by workspace-level policies, module policies, and document type policies.

**A document may be:**
- attached to one specific record
- attached to a package / renewal bundle
- linked to multiple specific records inside a package

**Documents work in two contexts simultaneously:**
- as global records in the **Documents module**
- as attached evidence inside the **Documents tab** of any record drawer

When a document is attached from a record drawer, it should eventually:
- create a document record in the Documents module
- link to `selectedRecord.moduleKey`
- link to `selectedRecord.id`
- store `linkedRecordName`
- appear in the record's Documents tab
- appear in the global Documents module

---

### 15.8 Attach Document MVP Form

The MVP Attach Document form should be simple.

**Required fields:**
- Document Name
- Document Type
- Uploaded By

**Optional fields (currently visible):**
- File Name / Reference
- Requirement
- Access
- Version
- Effective Date
- Expiration Date
- Notes

> **Note:** The approved minimal form (per product decision) should eventually show only the three required fields plus Notes in the basic view. The remaining optional fields (File Name / Reference, Requirement, Access, Version, Effective Date, Expiration Date) are candidates for an "Advanced / More options" section once the policy engine is in place. The current form exposes them while policies are not yet implemented.

**Do not show in the basic Attach Document form:**
- Status (generic)
- Review Status
- Signature Status
- Validity Status
- Missing Evidence

These concepts must be handled by policies, inherited values, role permissions, document history, or future advanced settings.

**Internal behavior:**
- When a document is attached, `status` is set internally to `'Attached'`
- This value is never shown in the form
- Document state beyond "Attached" derives from policies and workflow, not manual selection

---

### 15.9 Document Type Taxonomy

Vendor-issued license proof must be standardized under one document type:

**`License Entitlement`**

License Entitlement includes:
- license certificates
- entitlement documents
- vendor licensing confirmations
- software rights evidence
- license keys / rights documents
- similar vendor-issued proof of purchased software rights

**Do not use separate selectable types for:**
- License Certificate
- Entitlement Document

**Approved MVP document type list:**
- Vendor Quote
- Client Proposal
- Purchase Order
- Invoice
- License Entitlement
- Signed Contract
- Warranty Document
- Support Evidence
- Compliance Evidence
- Legal Document
- Other

> **Note:** Current implementation uses `Quote` and `Purchase Order`. `Vendor Quote` and `Client Proposal` are the approved direction and should replace `Quote` when the form is next updated.

---

### 15.10 Requirement Logic

Requirement must **not** be manually selected every time a user attaches a document.

Requirement must be determined by **document policies**, not manual user input.

**Example policy for MSP / Renewal Package:**

| Document Type | Requirement |
|---|---|
| Vendor Quote | Required |
| Client Proposal | Required |
| Purchase Order | Requested |
| License Entitlement | Required |
| Invoice | Optional |

A document is only considered **missing** if:
- a policy says it is Required, **and**
- no document matching that requirement exists for the record

If a document type is not required by policy, it must not be treated as missing.

---

### 15.11 Access Logic

Access must **not** be manually selected in the basic Attach Document form.

Document visibility must be controlled centrally by roles, permissions, workspace policies, and document type policies.

**Default access by document type (reference):**

| Document Type | Default visibility |
|---|---|
| Invoice | Finance / Admin |
| Signed Contract | Legal / Admin / Manager |
| Client Proposal | Sales / Manager |
| License Entitlement | Sales / Support / Admin |
| Compliance Evidence | Compliance / Security / Admin |

Per-document access overrides are Phase 2 / admin-only advanced settings.

---

### 15.12 Version Logic

Version must **not** be a standard visible field in the MVP Attach Document form.

Opriva is not primarily a CRM-style document versioning system. The attached document generally represents the latest / current relevant version.

If version tracking is needed, it must be handled through:
- Activity
- Document History
- Advanced Document Management (Phase 2)

---

### 15.13 Document Date / Validity Logic

Effective Date and Expiration Date must **not** appear as generic required fields in the basic Attach Document form.

Document validity must be policy-driven.

**A document may derive validity from:**

| Document Type | Validity source |
|---|---|
| License Entitlement | Inherits from linked license record |
| Warranty Document | Inherits from linked hardware warranty / support end date |
| Signed Contract | Inherits or exposes contract start / end dates |
| Vendor Quote | Own "Valid Until" date |
| Invoice | No validity date needed |
| Purchase Order | No validity date needed |
| Compliance Evidence | Own expiration date |

Only document types with independent validity should expose date fields, and only based on workspace-level document policy configuration.

---

### 15.14 Document Policies

Opriva must support a **Document Policy engine** governing:
- workspace
- module
- document type
- record type
- package type
- role

**A Document Policy should eventually define:**
- Required? (yes / no / conditional)
- Review required?
- Approval required?
- Signature required?
- Has own validity date?
- Inherits validity from linked record?
- Default access level?
- Applies to: record, package, or multiple records?

This policy engine does not need to be implemented immediately. This section defines the correct product direction.

---

### 15.15 Package / Renewal Bundle Model

Opriva must support the reality that many business transactions contain **multiple licenses, products, contracts, and documents**.

Real deals frequently include multiple licenses or products under one proposal or renewal package. Vendors may issue one entitlement / licensing document with multiple pages or line items covering different licenses.

**Opriva must support a parent grouping concept such as:**
- Deal
- Renewal Package
- Bundle

**A package can group:**
- multiple licenses
- hardware assets
- support agreements
- contracts
- documents (quotes, invoices, purchase orders, entitlements)
- tasks
- activity events

**Documents must be attachable to:**
1. One specific record
2. An entire package / renewal group
3. Multiple selected records inside the same package

Package / multi-record linking UI is Phase 2. The concept must be defined now so that the data model and document linking architecture does not need to be reconstructed later.

---

### 15.16 Custom Fields Roadmap

Controlled custom fields are part of the **MVP roadmap**, but must be implemented only after core workspace-specific forms are stabilized.

**MVP custom fields must allow admins to add fields per module with controlled types:**
- text
- number
- date
- dropdown
- currency
- checkbox
- URL
- long text

**Custom fields must extend core modules but must not replace:**
- required core fields
- calculated fields
- expiration logic
- alert policies
- relationship models
- document policy logic

**Phase 2 custom field capabilities:**
- formulas
- conditional fields
- field-level permissions
- workflow automation
- AI interpretation of custom fields

---

### 15.17 Implementation Guidance

Do not implement the decisions in this section immediately unless explicitly requested.

These decisions document the **approved architecture and product direction**. Implementation happens in controlled phases with explicit approval per step.

---

### 15.18 Support Coverage / Support Contracts

Support Coverage must be modeled as a **renewable contract / coverage layer**, not as free text inside a License or Hardware record.

#### Core decision

When adding a License or Hardware item, the user should be able to optionally add or enable support coverage. If enabled, Opriva should create or link a related Contract / Support Coverage record automatically and connect it to the covered License or Hardware through a relationship.

Do not model support as a simple text field called "Support Coverage" inside Hardware or Licenses.

#### What Support Coverage may cover

- one license
- one hardware asset
- multiple licenses
- multiple hardware assets
- a renewal package / bundle

#### Support Coverage record fields

A Support Coverage record should have its own:

| Field | Notes |
|---|---|
| Name | descriptive name of the support agreement |
| Type | e.g. Support Contract, Maintenance Agreement, SLA, Care Pack |
| Provider | the support provider or vendor |
| Start Date | coverage start |
| End / Expiration Date | coverage end — drives alert and renewal logic |
| Owner | assigned owner responsible for renewal |
| Alert Policy | drives expiration warnings |
| Value / Cost | annual or total cost of support |
| Documents | linked evidence (e.g. support contract PDF, SLA document) |
| Tasks | follow-up actions for renewal or escalation |
| Activity History | generated history of changes, renewals, and events |

#### How support is added

The License and Hardware creation forms must remain simple. Support coverage should be added through:

1. An optional **"Add support coverage"** action during record setup (post-save Complete Setup flow)
2. The **Relationships tab** of the record drawer
3. Or the **post-save Complete Setup** guided flow

#### Where support contracts appear

Support contracts must appear in the **Contracts module** and must be linked to covered assets using a relationship model equivalent to `asset_contracts`:

| Relationship field | Description |
|---|---|
| Contract / support record | the support contract |
| Covered asset record | the linked license or hardware item |
| Coverage type | e.g. Full support, Limited, SLA-only |
| Coverage dates | start and end dates |
| Notes | any coverage-specific notes |

---

## 16. Next Steps

Safe Phase 1 candidates:

- Normalize visible terminology only.
- Replace old or generic copy that conflicts with Opriva.
- Align Internal IT wording around Brand / Provider / Department / Budget / Approval / Risk.
- Align MSP wording around Client / Brand / Product / Distributor / Value / Margin / Owner / Action.
- Add `data-label` support to custom responsive tables in a controlled pass.

Medium-risk Phase 2 candidates:

- Separate workspace mock data.
- ~~Improve Command Palette labels by workspace while preserving route ids.~~ **Completed 2026-05-19.**
- Consolidate duplicated style layers after visual regression checks.
- Departments currently groups Brands & Providers in one column. Phase 2 should separate Brand and Provider into structured fields once mock data is normalized.

Later:

- Plan a component split only after the current single-file prototype is stable and validated.

---

### MVP Roadmap (approved product decisions, not yet fully implemented)

The following items are architecturally approved and should be implemented only when explicitly requested:

- Core record + related-tabs model (Overview, Relationships, Documents, Tasks, Activity)
- Workspace-specific creation forms (MSP vs Internal IT field sets per module)
- Simple Attach Document form (Document Name, Document Type, Uploaded By + optional fields only)
- License Entitlement document type standardization (replaces License Certificate + Entitlement Document)
- RECORD_STORE / record identity foundation (module-level mutable store for cross-tab linking)
- Package / Bundle / Renewal Bundle concept defined and documented
- Support Coverage creation/linking from License and Hardware drawer setup
- Controlled custom fields per module — after core workspace-specific forms stabilize

### Phase 2 Roadmap (deferred, do not implement yet)

- Full document policy engine (workspace → module → document type → record type → role)
- Package / multi-record linking UI (attach documents to bundles or multiple records)
- Document review / approval / signature workflow states
- Advanced per-document access overrides
- Document version history and activity-driven document audit trail
- Activity-driven renewal workflow stages (Quote needed → Proposal sent → Approved → Renewed)
- Custom field formulas, conditional fields, field-level permissions and workflow automation
- Advanced custom logic and AI interpretation of custom fields
- Multi-asset support coverage management (one contract covering multiple assets)
- Support coverage renewal workflows
- Support coverage compliance and SLA tracking

## 18. Trend Micro Import Model

This section documents the approved data model for importing Trend Micro renewal data into Opriva. It is derived from real Nextcom commercial records (`Datos.xlsx`) and a Trend Micro Entitlement Certificate PDF (`TM LICENSE -MI0008223.pdf`). Detailed field mapping lives in `IMPORT_MAPPING_TREND_MICRO.md`.

---

### 18.1 Excel Row → Renewal Package / Deal

Each row in the Nextcom commercial renewal register (`Datos.xlsx`) represents one commercial deal — a single order for one end client covering one renewal or purchase cycle. In Opriva, each Excel row maps to a **Renewal Package / Deal**.

Key Excel columns and their Opriva equivalents:

| Excel Column | Opriva Field |
|---|---|
| `# Registro` | Package reference / internal record ID |
| `# OC` | Nextcom order number |
| `OC Partner` | **Trend Micro PO Number** (primary join key to PDF) |
| `Cliente` | Client |
| `# Legal de Fac.` | Distributor invoice number (reference field) |
| `Reventa` | Reseller (workspace identity — not a separate field) |
| `Distribuidor` | Distributor |
| `Licencias` | Quantity / Seats (base platform license count) |
| `Vencimiento Licencia` | Expiration / Renewal Date |
| `Fecha factura` | Invoice Date (metadata / notes field) |
| `Monto Total` | Annual Value / Sale Price |

---

### 18.2 PDF File → License Entitlement Document

A Trend Micro Entitlement Certificate PDF represents vendor-issued proof of purchased software rights for all products in one order. In Opriva it is stored as a single **License Entitlement** document and linked to the parent Renewal Package and to each License record created from the PDF pages.

One License Entitlement document may cover multiple License records. This is correct behavior — the document is the source of truth for the entire order.

---

### 18.3 PDF Page → License Line Item

Each page of a Trend Micro Entitlement Certificate PDF covers one product SKU. All pages in a PDF share the same Customer, Reseller, TM Program Number, TM Reference Number, PO Number, Order Type, Start Date, and End Date. Only the product name, SKU, and volume differ per page.

In Opriva, each PDF page maps to one **License record** linked to the parent Renewal Package.

Key PDF fields and their Opriva equivalents:

| PDF Field | Opriva Field |
|---|---|
| Product Name (page header) | License / Product |
| `Customer Name` | Client |
| `Customer No.` | Client Reference (metadata) |
| `SKU` | SKU / Part Number (reference field) |
| `TM Program Number` | TM Program Reference (metadata) |
| `TM Reference Number` | TM Order Reference (metadata) |
| `PO Number` | Trend Micro PO Number (**join key to Excel `OC Partner`**) |
| `Order Type` | Order Type (metadata) |
| `Volume` | Quantity / Seats |
| `Start Date` | License Start Date (metadata) |
| `End Date` | Expiration / Renewal Date |

---

### 18.4 Join Key

The reliable join key between the Excel commercial record and the PDF entitlement certificate is:

**`OC Partner` (Excel) = `PO Number` (PDF)**

Example: Banisi row in Excel (`OC Partner = TRM-STD-966300`) matches all 6 pages of the Banisi entitlement PDF (`PO Number = TRM-STD-966300`).

For MSP-cycle rows (e.g., `OC Partner = MSP 2026-04`), no external entitlement PDF exists. These represent Nextcom's own managed service seat pool.

---

### 18.5 Package Contents

A Renewal Package in Opriva may contain:

- Multiple License line items (one per product SKU)
- One or more License Entitlement documents
- Vendor Quote
- Client Proposal
- Purchase Order
- Invoice
- Support Coverage records
- Tasks
- Activity

---

### 18.6 Trend Micro Support Logic

#### Manufacturer support included with active maintenance

Trend Micro business products with active maintenance include access to Trend Micro customer support. This is stated on every Entitlement Certificate page and is not a separate contract.

In Opriva, this should be represented as an **included / derived Support Coverage** record tied to the license validity:
- Provider: Trend Micro
- Coverage End Date: same as the license Expiration / Renewal Date
- Coverage Type: Manufacturer Support
- Note: Included with active maintenance — not a separately purchased service

This coverage expires when the license expires. Its status is driven automatically by Opriva's expiration logic.

#### Nextcom-managed support and SLA

If Nextcom provides its own managed support service, SLA, Gold/Silver/Bronze support tier, or other service coverage for a client, this must be modeled as a **separate Support Coverage contract** in Opriva with its own:
- Renewal date (independent from the Trend Micro license expiry)
- Provider: Nextcom Systems Inc.
- Coverage owner: the Nextcom account manager
- Annual value: Nextcom's service charge
- Alert policy: independent renewal timeline

This record appears in the Contracts module as a Support Coverage contract and in the originating record's Relationships tab.

---

### 18.7 MVP Import Approach

For MVP, import remains manual or mapping-based:

1. Create a Renewal Package / License record from the Excel row.
2. Create individual License records for each PDF page / SKU.
3. Attach the PDF as a License Entitlement document linked to the package and each line item.
4. Add Trend Micro manufacturer support as derived Support Coverage on each license.
5. Add Nextcom SLA / managed support as a separate Support Coverage contract if applicable.
6. Create follow-up tasks (quote request, renewal confirmation, document upload).

---

### 18.8 Phase 2 Import Automation

Phase 2 should include:

- Automatic PDF parsing (extract all fields from each Entitlement Certificate page)
- Match PO Number (PDF) to OC Partner (Excel) to link entitlements to packages automatically
- Auto-create License line items from matched PDF pages
- Detect missing entitlements (License records with no attached License Entitlement document)
- Detect volume mismatches between Excel `Licencias` and PDF volumes
- Detect upcoming renewals and apply alert policies at import time
- Suggest a default task set per package based on Order Type and days to expiration

---

## 17. Recent History

- Repository cloned and inspected on branch `audit/opriva-healthcheck`.
- `MEMORY.md` and `DESIGN.md` were not present before this documentation phase.
- Audit confirmed `source/App.jsx` contains `workspaceMode`, `sidebarCollapsed`, `Internal IT`, `MSP / Integrator`, and the current `ReactDOM.createRoot(...)` mount.
- Audit confirmed the current branch is intended for healthcheck and documentation work.
- 2026-05-19: Fase 1A terminology cleanup applied: legacy Corexi AI copy replaced with Opriva AI, Internal IT supplier/vendor terminology normalized toward Provider where safe, and MSP import template terminology aligned toward Distributor. No layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI changes.
- 2026-05-19: Fase 1B cleanup removed confirmed unused mocks/components without changing runtime, layout, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Fase 1C Data Import workspace-aware copy and mock data applied. Data Import now distinguishes MSP client/brand/product/distributor/margin import language from Internal IT brand/provider/department/approval language without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: MSP Attention Center refined into a commercial renewal operations view for MSP / Integrator. MSP now uses client, brand/product, distributor, value, margin, owner, quote blocker and follow-up terminology while preserving Internal IT behavior and shell/runtime stability.
- 2026-05-19: Search / Command Palette made workspace-aware. Placeholder, quick actions, AI suggestions and page labels now adapt to MSP / Integrator, Internal IT, Hybrid and Custom without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Settings → Operating Model refined as the declared workspaceMode source of truth. Terminology, navigation and import previews now reflect MSP / Integrator, Internal IT, Hybrid and Custom commercial models without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Settings Operating Model preview clarified for real user comprehension. The preview now explains operating logic, sidebar navigation and import template structure per workspace mode instead of showing abstract label mappings.
- 2026-05-19: Departments Internal IT terminology refined. Ambiguous Vendor wording was replaced with Brands & Providers in the Internal IT Departments screen across subtitle, toolbar, AI Insight, table headers and detail cards without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Tasks made workspace-aware. Column labels, subtitle, toolbar placeholder, mock task rows and kanban cards now adapt to MSP / Integrator and Internal IT without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Tasks execution context improved. Tasks now include Source, Impact and task-specific Action columns so MSP and Internal IT work queues better reflect Opriva's operational execution layer. Kanban secondary lines now show impact context instead of priority label. No layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI changes.
- 2026-05-19: MSP Tasks execution copy refined. Source, impact and kanban context were tightened to make client renewal tasks more operational without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Reports made workspace-aware. Report templates, export center labels and scheduled/generated report rows now adapt to MSP / Integrator and Internal IT without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Contracts made workspace-aware. Contract columns, tabs, AI Insight, toolbar copy and mock rows now adapt to MSP / Integrator and Internal IT without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Documents made workspace-aware. Document columns, tabs, AI Insight, toolbar copy and mock rows now adapt to MSP / Integrator and Internal IT without changing layout, runtime, routing, sidebar, topbar, workspaceMode or Floating AI.
- 2026-05-19: Enterprise Table Rule added. All major Opriva tables should support configurable columns, filters, saved views, bulk actions and export behavior. MVP may represent these controls visually while full persistence is deferred to Phase 2.
- 2026-05-19: Hardware module added as a first-class sidebar route. Hardware tracks physical IT assets, serials, models, warranty end dates, support coverage, ownership, approval status and renewal actions across MSP / Integrator and Internal IT workspaces without changing runtime, layout, topbar, Floating AI or existing routes.
- 2026-05-19: Licenses route corrected to render a true workspace-aware License Portfolio. MSP / Integrator now shows client license records with brand, distributor, value, margin and owner context. Internal IT now shows internal license records with brand, provider, department, approval status and owner context. Previous Brand Intelligence screens were preserved in code as Phase 2 candidates but disconnected from the Licenses route.
- 2026-05-21: Tabbed record drawer implemented. RECORD_STORE established as module-level mutable store. Licenses creation form improved. Attach Document feature added to drawer Documents tab with sessionDocs state dual-written to RECORD_STORE.documents. normalizeDocumentRecords guard prevents document overwrite on DocumentsScreen mount. handleEditField, formatComputedField, and computed-field read-only guard added. Floating AI suppression injected when drawer is open.
- 2026-05-21: Document type taxonomy standardized. "License Certificate" replaced by "License Entitlement" in ATTACH_DOC_FIELDS. License Entitlement covers vendor-issued license proof including certificates, entitlement docs, licensing confirmations, and software rights evidence.
- 2026-05-21: Attach Document form simplified per approved document policy decision. Generic required "Status" field removed. Internal status defaults to 'Attached' on save. Two new optional date fields added: Effective Date and Expiration Date. Document card in drawer no longer shows a status Badge (always 'Attached' = no signal); expiration date is shown if entered.
- 2026-05-21: Master BRIEF updated. Section 15 "Core Record + Related Tabs + Workspace Policies Model" added to MEMORY.md documenting 17 approved product architecture decisions covering: core record creation model, fields that must not be manually entered, License record logic (MSP vs Internal IT), expiration status logic, renewal workflow logic, record creation flow, document management model, Attach Document MVP form, document type taxonomy, requirement logic, access logic, version logic, document date/validity logic, document policy engine direction, package/renewal bundle model, custom fields roadmap, and implementation guidance. MVP and Phase 2 roadmap sections added to Next Steps. No application code modified.
- 2026-05-21: Attach Document form simplified to MVP minimum per MEMORY.md §15.8. Visible fields reduced to Document Name (req), Document Type (req), Uploaded By (req), Notes (optional). Removed from visible form: File Name / Reference, Requirement, Access, Version, Effective Date, Expiration Date. Internal defaults set on save: status='Attached', requirement='Optional', access='Internal'. OPTIONAL section divider removed. Document object shape and RECORD_STORE.documents write unchanged.
- 2026-05-21: MEMORY.md updated. §15.18 "Support Coverage / Support Contracts" added under Section 15. Decision: Support Coverage must be modeled as a renewable contract/coverage layer — not free text inside License or Hardware. Defines Support Coverage record fields, what it may cover, how it is added (drawer setup / Relationships tab / Complete Setup flow), and relationship model to covered assets via Contracts module. MVP roadmap updated: Support Coverage creation/linking from License and Hardware drawer setup. Phase 2 roadmap updated: multi-asset support coverage management, support coverage renewal workflows, support coverage compliance and SLA tracking. No application code modified.
- 2026-05-22: IMPORT_MAPPING_TREND_MICRO.md created. Defines how Nextcom's Trend Micro renewal data (Datos.xlsx + TM LICENSE PDF) maps to Opriva records. Covers Excel-to-package mapping, PDF-to-license-line-item mapping, License Entitlement document model, package structure, support coverage logic (manufacturer vs. Nextcom SLA), MVP manual import steps, and Phase 2 automation roadmap. No application code modified.
- 2026-05-22: MEMORY.md §18 "Trend Micro Import Model" added. Documents approved import model: Excel row = Renewal Package, PDF page = License line item, PDF file = License Entitlement document, OC Partner/PO Number join key, manufacturer support as derived coverage, Nextcom SLA as separate Support Coverage contract, MVP manual approach, Phase 2 automation targets. MEMORY.md, USER_GUIDE.md, and AI_KNOWLEDGE_BASE.md updated. No application code modified.
