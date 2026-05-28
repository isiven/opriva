# INTELLIGENT BULK UPLOAD DESIGN - Opriva

## 1. Purpose

Opriva needs intelligent bulk upload because enterprise IT renewal data does not arrive in one clean format. It arrives from vendor portals, distributor exports, CSP subscription reports, hardware sales reports, support coverage lists, commercial renewal workbooks, certificate trackers and internal spreadsheets.

Traditional spreadsheet import is not enough because it assumes the spreadsheet structure is the data model. Opriva must do the opposite: uploaded files should be interpreted, mapped and normalized into Opriva's canonical record model.

The purpose of intelligent bulk upload is to let users import operationally useful records without forcing them to manually rebuild every spreadsheet into the official Opriva template first. The official template remains valuable, but it should not be the only path.

## 2. Product Vision

The ideal Opriva upload experience is:

1. The user uploads one or more files downloaded from vendor, client, distributor, reseller, CSP, hardware, certificate, contract or internal systems.
2. Opriva detects the apparent source and file pattern.
3. Opriva asks the user what canonical records should be created.
4. AI-assisted mapping suggests how source columns map into Opriva fields.
5. The user approves, corrects or skips mappings.
6. Opriva identifies missing context, duplicates, calculated fields, sensitive fields and fields requiring review.
7. The user applies bulk defaults and enrichments instead of fixing every row manually.
8. Opriva previews final records before creation.
9. The user confirms import.
10. Opriva creates first-class canonical records that appear across modules, drawers, relationships, Assets & Renewals, reports, search and AI context.

The import experience should feel like operational data onboarding, not a spreadsheet paste tool.

## 3. Core Principles

- Opriva import is model-driven, not spreadsheet-driven.
- Opriva should not blindly import every Excel column.
- AI can suggest mappings, but the user approves.
- Import must be bulk-first and exception-based.
- Records to create must be separate from detected source.
- Imported records must become first-class canonical records.
- Assets & Renewals is the unified renewal worklist for dated renewal, expiration, warranty, support, certificate and contract records.
- Calculated fields should be calculated by Opriva, not manually imported as source of truth.
- Sensitive files are private and must not be committed.
- `private-samples/` is for real local files only and must remain ignored.
- `sample-data/` may contain demo or anonymized files only.

## 4. Supported Sources And File Patterns

### Commercial Renewal / Order Files

Typical headers may include:

- Registration or reference number
- Purchase order
- Partner order
- Client
- Invoice legal number
- Reseller
- Distributor
- Licenses
- License expiration
- Invoice date
- Total amount

Likely records to create:

- Licenses
- Renewal Package / Bundle
- Mixed / Let Opriva classify rows

Common ambiguities:

- A column named `Licenses` may mean product/license name, entitlement count or commercial line item.
- Order and registration references may overlap with contract, invoice or PO identifiers.
- Amount may represent sale price, vendor cost, total billing amount or renewal package value.

Mapping concerns:

- Client names should map to Client / Department.
- Distributor should map to Distributor / Provider.
- Reseller should map to Reseller / Partner.
- Expiration should map to Expiration / Renewal Date.
- Invoice date should be metadata, not expiration status.
- Reference fields should be used for duplicate detection.

Enrichment needs:

- Brand / Manufacturer
- Product / License Name
- Owner
- Alert Policy
- Whether the amount is Sale Price / Annual Value or Vendor Cost

### CSP Subscription Exports

Typical headers may include:

- Partner
- Subscription status
- Subscription start date
- Subscription end date
- Country
- Customer domain
- Customer name
- Offer name
- Friendly offer name
- Quantity
- Order id
- Billing cycle
- Product type
- Term duration
- Automatic renewal
- Renewal offer
- Renewal quantity

Likely records to create:

- Licenses
- Subscription renewals
- Renewal Package / Bundle if the file groups multiple renewal items

Common ambiguities:

- Offer name and friendly offer name may both represent product context.
- Partner may represent provider, reseller or distributor depending on workspace.
- Renewal offer and renewal quantity may represent future state, not current license state.

Mapping concerns:

- Customer should map to Client / Department.
- Offer or product fields should map to Product / License Name.
- Subscription end date should map to Expiration / Renewal Date.
- Remaining days should be skipped because Opriva calculates it.
- Subscription status should be preserved as Source Status / Vendor Status.

Enrichment needs:

- Brand / Manufacturer
- Product catalog matching
- Alert Policy
- Owner
- Workspace-specific provider/distributor interpretation

### Hardware / Warranty Sales Or Asset Files

Typical headers may include:

- Client
- Item class
- Transaction date
- Transaction type
- Number
- Full product or service name
- Description
- Quantity
- Serial
- Notes
- Received by
- Approximate launch year

Likely records to create:

- Hardware / Warranty
- Mixed / Let Opriva classify rows

Common ambiguities:

- Files may contain hardware, accessories, disks, rails, components and service lines in the same sheet.
- Transaction date may be purchase date, sale date, fulfillment date or received date.
- Warranty end date may be missing entirely.

Mapping concerns:

- Serial should map to Serial Number.
- Product/service name should map to Asset Name or Product / License Name depending on row class.
- Item class should help classify hardware versus accessories/components.
- Transaction date should not be treated as warranty end date without user approval.

Enrichment needs:

- Brand / Manufacturer
- Model
- Warranty term
- Warranty end date
- Owner
- Provider / Distributor
- Whether components should be linked to a parent asset

### Veeam-Style Renewal Exports

Typical headers may include:

- Customer
- Billing country/state/address
- PO number
- Distributor
- Contact
- Product
- Quantity metrics
- Contract number
- Contract start date
- Contract end date
- Days before expiration
- Licensing terms
- Support
- Contract status
- Total or incumbent amount
- Discount

Likely records to create:

- Licenses
- Contracts / Support Coverage
- Renewal Package / Bundle
- Mixed / Let Opriva classify rows

Common ambiguities:

- Multiple quantity columns may be populated or partially populated.
- Support may represent coverage level, support plan, contract context or product metadata.
- Contact and email fields are sensitive and should not be blindly imported.
- Total/incumbent amount may represent renewal value, installed base value or commercial opportunity value.

Mapping concerns:

- Customer should map to Client / Department.
- Distributor should map to Distributor / Provider.
- Product should map to Product / License Name.
- Contract number should map to Contract Number.
- Contract end date should map to Expiration / Renewal Date.
- Days before expiration should be skipped because Opriva calculates it.
- Contract status should map to Source Status / Vendor Status.

Enrichment needs:

- Quantity metric selection
- Brand / Manufacturer
- Owner
- Alert Policy
- Support Coverage interpretation
- Whether to create both License and Contract / Support Coverage records

### Future Vendor / Platform Files

Future import profiles should support:

- Security software renewal exports
- SSL/certificate inventories
- Firewall warranty and subscription exports
- Cloud subscription files
- ERP purchase order files
- Distributor quote exports
- Contract repositories
- Document metadata exports

Each profile should define source detection, field mapping, record creation rules, duplicate logic and enrichment prompts.

## 5. Supported File Types

MVP file types:

- `.xlsx`
- `.xls`
- `.csv`
- Multi-sheet workbooks

Later phases:

- PDF entitlement extraction
- PDF quote extraction
- PDF invoice extraction
- License certificate extraction
- Multi-file matching across spreadsheet and document uploads

PDF parsing should not be part of the first backend MVP unless explicitly scoped. It requires document parsing, secure file handling, audit trail and AI permission boundaries.

## 6. Detected Source vs Records To Create

Detected source is what the file appears to be. Examples:

- Commercial Renewal Package
- CSP Subscription Export
- Hardware Sales Export
- Contract / Support Coverage List
- Certificate Inventory
- Unknown Source

Records to create is the canonical Opriva record type the user wants to create. Options:

- Licenses
- Hardware / Warranty
- Contracts / Support Coverage
- Certificates / SSL
- Renewal Package / Bundle
- Documents Metadata
- Tasks
- Mixed / Let Opriva classify rows

Detected source should never force a single creation model. A detected Renewal Package may create underlying License, Contract / Support Coverage, Hardware / Warranty or Certificate records.

The import screen should clearly communicate:

- Detected source is informational.
- Records to create controls what Opriva will create.
- Mixed mode lets Opriva classify each row, subject to user review.
- Users can override suggested targets before import.

## 7. AI-Assisted Mapping

AI-assisted mapping should produce a structured suggestion for each source column:

- Source column
- Suggested canonical field
- Confidence
- Anonymized sample pattern
- Reason
- Action
- Required or optional status
- Workspace-mode interpretation

Possible actions:

- Import
- Skip
- Review
- Note
- Future custom field

Examples of reasons:

- Header match
- Date pattern
- Amount pattern
- Quantity pattern
- Reference identifier
- Calculated by Opriva
- Sensitive field requiring review
- Ambiguous meaning

The user must approve mapping before records are created.

## 8. Canonical Field Mapping Examples

Common mappings:

- `Cliente` / `Customer` -> Client / Department
- `Distribuidor` / `Distributor` -> Distributor / Provider
- `Reventa` / `Reseller` -> Reseller / Partner
- `Product` / `Offer` / `Producto` -> Product / License Name
- `Marca` -> Brand / Manufacturer
- `Quantity` / `Licenses` / `Seats` -> Quantity / Seats
- `Start Date` -> Start Date
- `End Date` / `Vencimiento` -> Expiration / Renewal Date
- `PO` / `OC` -> PO / Order Reference
- `Contract` / `Registro` / `Con. Number` -> Contract Number / Registration Reference
- `Invoice Date` / `Fecha factura` -> Invoice Date
- `Amount` / `Total` -> Sale Price / Annual Value or Vendor Cost depending on context
- `Lic. Contact` / `License Contact` / `Technical Contact` / `Billing Contact` / `Renewal Contact` / `Legal Contact` -> Related Contact / License Contact, action Review
- `Lic. Contact e-mail` / `Contact email` / `Email` -> Contact Email, action Review
- `Days before expiration` / `Remaining days` -> calculated, skip

Contact mappings are sensitive relationship context. They should be reviewed before creating or linking a Contact record and should not be imported as unrestricted free text on a License, Contract or Renewal Package.

MSP / Integrator interpretation:

- Client is the external customer.
- Distributor / Provider is the upstream commercial source.
- Sale Price / Annual Value is customer-facing value.
- Vendor Cost is upstream cost.
- Margin is calculated by Opriva.
- Owner is the commercial/account owner.

Internal IT interpretation:

- Client / Department should usually map to Department.
- Provider is the company supplying or managing the product/service.
- Annual Cost is internal spend.
- Cost Center, Budget Owner and Approval Status may be required later.
- Margin should not be shown as an Internal IT creation field.

## 9. Bulk Defaults And Enrichment

Import enrichment should be bulk-first and exception-based.

Bulk defaults should allow users to apply:

- Brand / Manufacturer to all missing records
- Product / License Name to selected or all records
- Owner
- Alert Policy
- Warranty term where no warranty end date exists
- Support coverage default
- Workspace mode context
- Provider / Distributor
- Renewal package context

Defaults should apply to missing values by default and should not overwrite row-specific values unless the user explicitly chooses to overwrite.

The user should not have to review every row manually. Row-level review should be reserved for exceptions, ambiguities and high-risk records.

## 10. Review And Exception Handling

The preview should show final Opriva records before creation.

It should show:

- Record preview
- Target module
- Client / Department
- Brand / Product
- Expiration / Renewal Date
- Owner
- Value / cost where applicable
- Issues
- Action

Issues should be concise and actionable:

- Missing brand
- Missing product
- Missing expiration date
- Missing owner
- Missing warranty term
- Ambiguous quantity
- Duplicate risk
- Sensitive contact field. Review before creating or linking contact.
- Sensitive field skipped
- Review required

The preview should also show skipped columns once, not repeat long warnings in every row.

Users should be able to:

- Import ready rows only
- Review exception rows
- Apply bulk defaults
- Adjust mappings
- Skip rows
- Confirm import only after understanding what will be created

## 11. Duplicate Detection

Duplicate detection is record-type specific.

### 11.1 Implemented behavior (commit `1e16a13`)

Record-type-specific duplicate keys are implemented in the local sandbox in `source/importSandbox/importDuplicates.js` and wired into the import flow:

- **`meta.duplicateKeys` is the real source of duplicate detection.** Each imported record carries an array of namespaced, record-type-specific keys. Two records are duplicates when they share any key (intersection).
- **`meta.importKey` remains only as a backward-compatible legacy fallback.** It is still written to every record by `withImportRecordMeta`, but it is no longer the primary signal. It is used only when comparing against an existing stored record that has no `duplicateKeys` (older record shape).
- Keys are built once in `withImportRecordMeta` (as `meta.duplicateKeys`) and consumed by both the preview duplicate check (`buildImportPreview`) and the confirm-time skip (`insertImportedRecords`).

Implemented keys by record type:

| Record type | Primary key | Fallback / variant |
|---|---|---|
| Licenses | client/department + brand/product + expiration date | CSP variant: client + product + end date + order reference |
| Hardware | serial number (when available) | client + model/product + (order reference or purchase date) |
| Contracts | contract number + end date | client + provider + support/contract type + renewal/end date |

Key construction rules:

- **Sparse/weak keys are not emitted.** A key is only produced when its required discriminating fields are all present (e.g. a license needs client + brand-or-product + expiration; a hardware fallback needs client + model + a reference or date). A single shared field such as client alone never produces a key, so it can never trigger a false duplicate.
- **Serial values that are empty or `-` are ignored** for the hardware serial key; such rows fall back to the client + model + reference/date key.
- A record may carry more than one key (e.g. a CSP license carries both the primary license key and the CSP variant). Sharing any one key flags a duplicate. Keys are namespaced by record type, so keys never collide across types.
- Certificates and Renewal Package keys are defined as dormant placeholders and currently produce no keys; they are reserved for when those modules go live.

### 11.2 Option A handling (current)

Duplicate handling follows Option A:

- Opriva **flags duplicate risk in the import preview** (a `Duplicate risk` issue on the affected rows) and reports a duplicate count in the Import Summary.
- **Confirm-time duplicate skip behavior is preserved.** On confirm, records whose keys match an already-created record are skipped and counted as duplicates skipped, exactly as before.
- **Strict flag-only duplicate handling with row-level include/exclude remains a future UX task.** The current behavior continues to skip matched duplicates at confirm time rather than letting the user selectively include or exclude individual flagged rows.

### 11.3 Additional design candidates (future)

The following additional key combinations remain design-level direction and are not all implemented yet:

Licenses:

- product + quantity + provider + renewal date

Hardware:

- asset name + provider + purchase date

Contracts:

- support coverage reference + covered record

Certificates:

- certificate domain + expiration date
- certificate product + client + expiration date
- provider + certificate reference

Renewal Packages:

- package/order reference + client
- PO/order reference + invoice/reference metadata
- grouped client + renewal window + provider/distributor

Duplicate detection should identify risks before import and avoid blindly creating duplicate records.

## 12. Record Creation Logic

Confirmed imports should create first-class canonical records.

Before record creation, Opriva should detect and stage all meaningful entities found in the file. This includes Client / Company, Department, Contact, Contact Email, Brand / Manufacturer, Product / SKU, Vendor / Provider, Distributor, Reseller / Partner, License, Hardware Asset, Contract, Support Coverage, Renewal Package / Bundle, Document Metadata, Task, Relationship and Activity Event.

Detected entities should be matched against existing canonical records or controlled catalogs using normalized matching: case-insensitive comparison, trimmed/collapsed spaces, safe punctuation tolerance and duplicate-risk warnings. New entities should be staged as candidates such as New Client, New Contact, New Brand, New Product, New Provider, New Contract or New Support Coverage. The user approves these creations before final import.

Possible created entities:

- Clients / Departments
- Vendors / Providers
- Brands
- Products
- Licenses
- Hardware
- Contracts
- Support Coverage
- Renewal Packages
- Documents Metadata
- Tasks
- Relationships
- Activity Events

Sandbox mode:

- Records are created in the central local store.
- Entity detection may be represented through preview counts, local metadata and relationship staging.
- Clients/departments may be simulated through local `RECORD_STORE` records.
- Brands, products, providers, distributors and resellers may be staged as controlled catalog values until backend catalogs exist.
- Contacts must remain review-only sensitive relationship context unless explicit contact creation is implemented later.
- Records should appear in relevant modules.
- Imported records should open in the same drawer as manual records.
- Activity events can be local session events.

Backend mode:

- Record creation must be transactional.
- Import history must persist.
- Relationships and activity must persist.
- Entity match/create decisions must persist.
- Contacts, brands, products, providers, distributors, resellers, support coverage and package links must be permission-aware and auditable.
- Failed rows must be auditable and recoverable.
- Permissions must be enforced.

## 13. Assets & Renewals Projection

Assets & Renewals is a projection, not duplicated storage.

Any canonical record with one of the following should appear in Assets & Renewals:

- Expiration date
- Renewal date
- Warranty end date
- Support end date
- Certificate expiration
- Contract renewal date
- Contract end date

The source records remain in their canonical modules:

- Licenses
- Hardware
- Contracts / Support Coverage
- Certificates
- Renewal Packages

Assets & Renewals should summarize the operational renewal worklist across those modules.

## 14. Relationship Creation

Import should support relationship creation over time.

Core relationships:

- License linked to Client / Department
- License linked to Brand / Product
- License linked to Distributor / Provider
- Hardware linked to Client / Department
- Hardware linked to Brand / Product / Serial
- Contract linked to covered records
- Support Coverage linked to License or Hardware
- Renewal Package groups multiple licenses, hardware assets, contracts, documents, POs, invoices and tasks
- Documents link to one or more records
- Tasks link to one or more records

Relationships should be navigable in the UI and backend-backed before corporate MVP.

## 15. Document Handling

Document handling should distinguish metadata from files.

Document metadata import may include:

- Document type
- Linked record reference
- Source system reference
- Date
- Status
- Owner
- Requirement
- Notes

Future backend document handling requires:

- Secure file storage
- Document metadata tables
- Document links
- Role-based access control
- Secure URLs
- Audit events
- Missing evidence policies
- Retention policies
- Virus scanning later

Document references in spreadsheets should not be treated as secure files until backend storage exists.

## 16. Import Job Lifecycle

Import jobs should support these statuses:

- uploaded
- parsed
- detected
- mapped
- reviewed
- enriched
- previewed
- confirmed
- importing
- completed
- completed with warnings
- failed
- canceled

Each status transition should be auditable in the backend MVP.

## 17. Security And Privacy

Rules:

- Real client files belong only in `private-samples/`.
- `private-samples/` must remain ignored.
- Demo/anonymized files may live in `sample-data/`.
- No real client files should be committed to GitHub.
- No real emails, prices, serials, PO numbers, contract numbers, invoice numbers or IDs should be included in documentation.
- Import permissions are required later.
- Secure storage is required later.
- AI permission boundaries are required later.
- Sensitive values should not be exposed in logs, docs, screenshots or public sample files.
- Contact names and emails from imports are sensitive relationship data. Local sandbox may preserve them as `importContactContext`, but corporate MVP requires permissioned Contact records, contact roles, audit history and explicit user approval before linking or creating contacts.

The local sandbox is acceptable for product validation, but it is not enterprise-safe storage.

## 18. UX Flow

Final intelligent bulk upload flow:

1. Upload files.
2. Select sheet.
3. Detect source.
4. Choose records to create.
5. Review AI mapping suggestions.
6. Apply bulk defaults.
7. Review final records.
8. Resolve exceptions.
9. Confirm import.
10. Review import results.
11. Open created records.

The flow should make users confident about what Opriva will create before they confirm.

## 19. Local Sandbox MVP Scope

Current and near-term local sandbox scope:

- Local Excel upload
- Sheet parsing
- Detected source
- Records to create
- Mapping table
- User mapping approval
- Bulk defaults
- Enrichment
- Preview final records
- Create local records in `RECORD_STORE`
- Show records in relevant modules
- Show dated records in Assets & Renewals
- Local activity event
- No backend persistence
- No secure file storage
- No real AI API
- No PDF parsing

This validates product logic and UX, not enterprise readiness.

## 20. Backend MVP Scope

Corporate MVP requires backend support for:

- Import jobs
- Secure file storage
- Database transactions
- Mapping approvals
- Import history
- Duplicate handling
- Rollback and error handling
- Permissions
- Audit trail
- Contact tables, contact roles, record/contact links and permissioned contact access
- Notifications
- AI retrieval with permissions
- Search/indexing
- Reporting data layer

The backend import engine must preserve what file was uploaded, who uploaded it, which mappings were approved, what defaults were applied, which records were created, which rows failed and which duplicates were skipped.

## 21. Vendor-Specific Import Profiles

### Microsoft CSP

Expected focus:

- Subscription exports
- Customer, offer, quantity, billing cycle, term and end date
- License records
- Calculated remaining days skipped

### Veeam Renewals

Expected focus:

- Customer, distributor, product, quantity metrics, contract number, support, contract status and end date
- Licenses plus Contracts / Support Coverage
- Multiple quantity metrics requiring user review

### Trend Micro / Commercial Renewal Package

Expected focus:

- Commercial order, reseller, distributor, client, license, invoice date, renewal date and amount
- Licenses or Renewal Package / Bundle
- Brand/product enrichment required

### QNAP / Hardware Asset Lists

Expected focus:

- Client, item class, transaction date, product/service name, quantity, serial and notes
- Hardware / Warranty
- Component/accessory rows need classification
- Warranty end may need default term enrichment

### Generic Contract / Support Coverage

Expected focus:

- Contract number, provider, client/department, covered record, start/end dates, support level and status
- Contracts / Support Coverage

### SSL Certificates

Expected focus:

- Certificate name/domain, issuer/provider, expiration date, owner and evidence
- Certificates / SSL
- Missing evidence policy later

## 22. Risks And Mitigations

| Risk | Severity | Why it matters | Mitigation |
| --- | --- | --- | --- |
| Spreadsheet columns are interpreted as canonical fields without review | High | Creates bad records and erodes trust | Require mapping approval and preview |
| Renewal package files are treated as one record type only | High | Underlying licenses/contracts may not appear in modules | Separate Detected Source from Records to Create |
| Sensitive columns are imported blindly | High | Privacy and compliance risk | Flag contact/email/reference fields for review |
| Calculated source fields are imported as truth | Medium | Status and days can become stale | Skip calculated fields and calculate in Opriva |
| Multiple quantity columns exist | Medium | Wrong entitlement count can be imported | Require user-selected quantity metric |
| Hardware files lack warranty end dates | Medium | Records may not enter renewal workflow correctly | Allow warranty term defaults and enrichment |
| Duplicate records are created | High | Pollutes renewal worklist and reports | Use record-type duplicate keys |
| Local sandbox is mistaken for production import engine | High | Corporate testing could lose data | Document backend requirement clearly |
| AI suggestions are treated as final truth | Medium | Mapping errors can scale quickly | User approval required |
| Real files are committed accidentally | Critical | Sensitive data exposure | Keep private files in ignored folders only |

## 23. Recommended Implementation Roadmap

### Phase 1: Perfect Local Import UX

- Clarify Detected Source vs Records to Create.
- Improve mapping confidence and reasons.
- Improve bulk defaults.
- Improve preview and exception handling.
- Keep local-only behavior explicit.

### Phase 2: Ensure Central Store Visibility

- Ensure imported licenses appear in Licenses.
- Ensure imported hardware appears in Hardware.
- Ensure imported contracts appear in Contracts.
- Ensure dated imported records appear in Assets & Renewals.
- Ensure drawers, activity and relationships can read imported records.

### Phase 3: Add Vendor-Specific Detection Profiles

- Microsoft CSP
- Veeam renewals
- Trend Micro / commercial renewal package
- QNAP / hardware asset lists
- Generic contract/support coverage
- SSL certificates

### Phase 4: Improve Duplicate Detection And Enrichment

- Add record-type duplicate keys. **Implemented in the local sandbox (commit `1e16a13`) via `meta.duplicateKeys`; see §11.1.**
- Add selected-row bulk defaults.
- Add quantity metric resolution.
- Add warranty term enrichment.
- Add brand/product catalog matching.

### Phase 5: Backend Import Jobs And Audit

- Upload files securely.
- Create import jobs.
- Persist mappings, previews and results.
- Add rollback/error handling.
- Write audit events.

### Phase 6: AI-Assisted Mapping Intelligence

- Add permission-aware AI mapping support.
- Use product and vendor profiles.
- Explain mapping confidence.
- Recommend enrichments.
- Require user approval before write actions.

### Phase 7: Enterprise Hardening

- RBAC.
- Tenant isolation.
- Secure storage.
- Audit trail.
- Notifications.
- Reporting data layer.
- Search/indexing.
- Corporate pilot validation.

## 24. Open Questions

- Should Renewal Package / Bundle become a first-class MVP entity or remain a grouping concept until backend?
- Which quantity metric should be preferred for each vendor profile?
- Should contact/email fields become Contacts, be skipped by default or require explicit permission?
- How should Opriva infer warranty end date when source files only provide transaction date?
- Should amount fields default to Sale Price / Annual Value or require user selection?
- Should Internal IT imports default client-like columns to Department?
- How should Opriva handle accessories/components that belong to a hardware asset?
- Should import profiles be editable by admins?
- What confidence threshold should require mandatory user review?
- How should failed rows be retried in backend MVP?

## 25. Final Recommendation

Opriva should treat intelligent bulk upload as a core product capability, not a side utility. The import experience should help users turn messy vendor and operational exports into canonical, reviewable, first-class Opriva records.

The best path forward is to keep improving the local sandbox until the UX and data model are clear, then move import into a backend-backed job pipeline before corporate MVP testing. The next implementation work should focus on making records-to-create, enrichment, preview, duplicate detection and central-store visibility reliable before adding more advanced AI or PDF parsing.
