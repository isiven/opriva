# Opriva Import Template Specification

**Version:** 2.0 — Three-Template Model + Coverage as Related Entity
**Status:** Approved product decision. Template generation deferred to Phase 2; this document defines the canonical structure for when implementation begins. Supersedes Version 1.0 (single-workbook model).
**Scope:** Defines all sheets, columns, field types, required / optional / suggested / calculated markers, validation rules, controlled catalogs, visual specification and instructions for the three official Opriva Import Template workbooks.

> **File storage:** Real customer files must be stored under `private-samples/` and excluded from Git. Anonymized demo files may be stored under `sample-data/`. Official templates committed under `templates/` must contain only placeholder data.

---

## 1. Purpose

Opriva supports two data import paths.

### Path A — AI-Assisted Guided Mapping (flexible)

The user uploads any Excel, CSV, or PDF file — even a raw vendor export or an unstructured internal spreadsheet. Opriva's AI analyzes the source columns, detects their likely meaning, and suggests how to map each column to an Opriva canonical field. The user reviews, adjusts, and approves the mapping before any records are created.

This path is designed for real-world source files that were never built with Opriva in mind: Trend Micro renewal registers, QNAP hardware sales exports, Veeam license reports, Microsoft CSP / MLS exports, Fortinet entitlements, VMware partner portal exports, Cisco SmartNet reports, Dell warranty extracts, HPE care pack registers, distributor monthly reports (TD Synnex, Ingram Micro, Westcon, SoftwareONE) and any custom format a customer or vendor uses.

See `MEMORY.md §19` and individual `IMPORT_MAPPING_*.md` documents for field mapping details by vendor.

### Path B — Official Opriva Templates (structured)

Opriva ships **three official import templates**. Customers download the template that matches their workspace audience and fill it in Opriva's canonical structure before upload.

| Template | File name | Audience | Sheets |
|---|---|---|---|
| **MSP / Integrator** | `OPRIVA_IMPORT_TEMPLATE_MSP.xlsx` | Account managers, renewal teams, MSP operations | 8 |
| **Internal IT** | `OPRIVA_IMPORT_TEMPLATE_INTERNAL_IT.xlsx` | IT managers, asset custodians, IT procurement | 8 |
| **Canonical / Advanced** | `OPRIVA_IMPORT_TEMPLATE_CANONICAL.xlsx` | Expert users, integration teams, Hybrid workspaces | 11 |

The MSP and Internal IT templates are deliberately simplified — they use workspace-specific terminology and exclude irrelevant fields so users are not overwhelmed. The Canonical / Advanced template reflects the full Opriva model, includes the Custom Fields and Relationships sheets, and is the authoritative reference.

**Templates do not replace Path A.** Both paths coexist. Customers choose the path that best fits their workflow:

| Situation | Recommended path |
|---|---|
| Existing vendor export or internal spreadsheet | Path A — AI-assisted guided mapping |
| Starting fresh with no existing data | Path B — Official template |
| Customer wants to prepare clean data in Opriva's structure | Path B — Official template |
| Complex multi-vendor data with inconsistent columns | Path A — AI-assisted guided mapping |
| Multi-client distributor export (Microsoft CSP, Veeam multi-customer) | Path A — multi-client scope mode |
| Onboarding a new client or department with structured data | Either path |
| Bulk pre-load before corporate go-live | Path B — Canonical template |

When a customer uploads an Official Opriva Template, Opriva should recognize it automatically (template version marker in the Instructions sheet plus expected sheet structure) and bypass the AI mapping step, importing directly into the canonical model with only a preview / confirmation step.

---

## 2. Import Principles

### 2.1 Templates represent Opriva's canonical model

Every column in every sheet maps directly to an Opriva canonical field. There are no extra columns, no calculated values used as input, and no vendor-specific identifiers in primary cells (vendor IDs may be preserved in `Source Reference` columns as metadata). The templates are the cleanest possible expression of Opriva's data model.

### 2.2 Calculated fields are excluded as input

The following fields must not appear as input columns. They are derived by Opriva from other entered values:

| Excluded field | Reason |
|---|---|
| System Status | Derived from Expiration Date + Alert Policy |
| Days to Expiration | Derived from Expiration Date vs. today |
| Alert Status | Derived from Alert Policy threshold |
| Risk signals | Calculated from expiration, coverage, ownership gaps |
| Margin $ | Derived from Sale Price − Vendor Cost (MSP only) |
| Margin % | Derived from Margin $ ÷ Sale Price (MSP only) |
| Validity Status | Derived from document policy + dates |
| Evidence Gap / Missing Evidence | Derived from document policy + attached documents |
| Renewal Stage | Driven by workflow events and user actions |

Users must not be asked to fill these fields. The Canonical / Advanced template may include them as informational columns with `[Calculated]` styling (gray background, `do not fill` annotation), purely for reference.

### 2.3 Three template variants serve distinct workspace audiences

| Variant | Terminology |
|---|---|
| **MSP / Integrator** | Client, Account Owner, Distributor, Reseller / Partner, Vendor Cost, Sale Price / Annual Value, Renewal Package, Quote Reference, Client Proposal, Purchase Order, Invoice |
| **Internal IT** | Department, Business Unit, Cost Center, Location, IT Owner, Budget Owner, Asset Custodian, Provider / Vendor, Annual Cost, Approval Status, Business Criticality, Compliance Evidence |
| **Canonical / Advanced** | Both terminologies with workspace discriminators (`Record Type` column, mode-tagged columns) |

**Workspace terminology must not be mixed within a single MSP or Internal IT template.** MSP users see MSP language only; IT users see IT language only; Canonical users see both clearly distinguished.

### 2.4 Required, Optional, Suggested and Calculated markers

Every column header carries one of four explicit markers in the sub-header (row 2):

| Marker | Behavior | Visual badge |
|---|---|---|
| **[Required]** | Record cannot be imported without this value. Import preview flags missing values as critical. | `REQ` red |
| **[Optional]** | Record can be imported without. Can be completed later in the drawer. | `OPT` gray |
| **[Suggested]** | Opriva infers a value or related coverage record. User reviews and approves in the import preview before confirm. | `SUG` amber |
| **[Calculated]** | Opriva derives this from other values. Appears only in the Canonical template as an informational column with `do not fill` styling. | `CALC` gray italic |
| **[Advanced]** | Canonical only. Expert column not present in MSP / IT templates. | `ADV` violet |

### 2.5 Users may leave optional sheets empty

The templates are multi-sheet workbooks. Customers do not need to fill every sheet. A customer importing only Licenses can leave Hardware, Coverage, Documents and Tasks sheets empty. Opriva imports any non-empty sheets and skips empty ones cleanly.

A sheet is "empty" when only header row + example row are present, with no data rows.

### 2.6 Cross-sheet references connect records

Plain-text reference identifiers link records across sheets. They are user-defined short codes that Opriva resolves during import.

| Reference type | Where defined | Where used |
|---|---|---|
| **Client / Department Name** | Clients / Departments sheet | All other sheets requiring client/department context |
| **Package Reference** | Renewal Packages sheet | Licenses, Hardware, Coverage, Contracts, Documents (Package Reference column) |
| **License Reference** | Licenses sheet | Coverage (Covered Record Reference), Documents/Tasks (Linked Record Reference) |
| **Hardware Reference** | Hardware sheet | Coverage (Covered Record Reference), Documents/Tasks (Linked Record Reference) |
| **Contract Reference** | Contracts sheet | Documents/Tasks (Linked Record Reference) |
| **Coverage Reference** | Coverage sheet | Documents/Tasks (Linked Record Reference) |
| **Suggestion Basis** | Coverage sheet | Origin of an inferred coverage: `file`, `inferred:purchase+term`, `inferred:license-term`, `manual` |

References must be consistent across sheets (exact spelling and case) but are not validated externally. Opriva matches them during import and reports broken references in the import preview.

### 2.7 Coverage is a related entity, not free text

**Warranty, Support and Maintenance must not be stored as free-text notes inside License or Hardware rows.** Each coverage is its own row on the dedicated **Coverage sheet**, linked to its parent License or Hardware record via `Covered Record Reference` and discriminated by `Coverage Kind` (`Warranty`, `Support`, `Maintenance`).

Opriva infers coverage dates when sufficient context exists:
- **Hardware**: `Purchase Date + Warranty Term → Warranty Start = Purchase Date; Warranty End = Purchase Date + Term`
- **License**: `License Start + License Expiration + Support keyword → Support Start = License Start; Support End = License Expiration` (assumes co-term)
- **Maintenance**: never inferred; high ambiguity. Must come from explicit file column or manual entry.

Inferred coverages must be marked `[Suggested]` with `Suggestion Basis = inferred:purchase+term` or `inferred:license-term` and require user approval in the import preview before being created. **File-provided coverage values always take precedence over inferred values.**

Nothing inferred is created silently.

---

## 3. Template Variants and Sheet Structures

### 3.1 MSP / Integrator Template (8 sheets)

| # | Sheet Name | Purpose |
|---|---|---|
| 1 | **Instructions** | Fill order, conventions, badge legend, MSP terminology guide |
| 2 | **Clients** | Client records with Account Owner |
| 3 | **Renewal Packages** | Commercial deal / package groupings |
| 4 | **Licenses** | Software licenses with Sale Price / Annual Value + Vendor Cost |
| 5 | **Hardware** | Physical IT assets |
| 6 | **Coverage** | Warranty / Support / Maintenance / SLA / Software Assurance / Subscription Support / Care Pack / SmartNet / Other coverage linked to License or Hardware |
| 7 | **Contracts** | Commercial agreements (MSA, NDA, SLA, Service Contract, License Agreement) — **not** support coverage |
| 8 | **Documents** | Document metadata (files uploaded separately) |

### 3.2 Internal IT Template (8 sheets)

| # | Sheet Name | Purpose |
|---|---|---|
| 1 | **Instructions** | Fill order, conventions, badge legend, IT terminology guide |
| 2 | **Departments** | Department / Business Unit records with Cost Center, Location, Budget / IT Owner |
| 3 | **Renewal Packages** | (Optional — many IT environments do not group by package) |
| 4 | **Licenses** | Software licenses with Annual Cost, Approval Status, Business Criticality |
| 5 | **Hardware** | Physical IT assets with Asset Custodian, Cost Center, Approval Status |
| 6 | **Coverage** | Warranty / Support / Maintenance / SLA / Software Assurance / Subscription Support / Care Pack / SmartNet / Other coverage linked to License or Hardware |
| 7 | **Contracts** | Commercial agreements (MSA, NDA, SLA, Service Contract, License Agreement) — **not** support coverage |
| 8 | **Documents** | Document metadata; Compliance Evidence prominent |

### 3.3 Canonical / Advanced Template (11 sheets)

| # | Sheet Name | Purpose |
|---|---|---|
| 1 | **Instructions** | Full canonical model overview, advanced conventions |
| 2 | **Clients / Departments** | Combined sheet with `Record Type` discriminator |
| 3 | **Renewal Packages** | All package types |
| 4 | **Licenses** | All License columns with workspace discriminators where they differ |
| 5 | **Hardware** | All Hardware columns with workspace discriminators where they differ |
| 6 | **Coverage** | All coverage types with all dimensions including Suggestion Basis |
| 7 | **Contracts** | Commercial agreements |
| 8 | **Documents** | Document metadata |
| 9 | **Tasks** | Operational follow-ups linked to any record |
| 10 | **Custom Fields** | Workspace-specific custom field values |
| 11 | **Relationships** | Explicit cross-record relationships beyond Package / Covered Record |

### 3.4 Sheet ↔ Module mapping

| Sheet | Module | Notes |
|---|---|---|
| Clients / Departments | `clients` | Record Type discriminator in Canonical |
| Renewal Packages | `packages` | Package modeling deferred to Phase 2 |
| Licenses | `licenses` | |
| Hardware | `hardware` | |
| **Coverage** | `contracts` w/ `meta.source = 'supportCoverage'` + `coverageKind` | New discriminator |
| Contracts | `contracts` w/ `meta.source = 'contract'` | Commercial only |
| Documents | `documents` | Metadata only; files uploaded separately |
| Tasks | `tasks` | Operational follow-ups |
| Custom Fields | record `meta.customFields[]` | Not a separate module |
| Relationships | record cross-links | Canonical only |

Each data sheet uses row 1 (frozen) as the column header row. Row 2 of every data sheet is an **example row** styled in italic light gray with the value `DELETE BEFORE IMPORT` in a visible cell. Data begins on row 3. No merged cells. No formulas.

---

## 4. Instructions Sheet

The Instructions sheet is the first sheet in every workbook. Content varies per template variant but always includes:

### 4.1 Required content

- Opriva logo + workbook name + template version cell A1
- Workspace mode (MSP / Internal IT / Canonical) clearly labeled
- Template version + Opriva version compatibility
- Numbered fill-order guidance
- Required / Optional / Suggested / Calculated / Advanced badge legend
- Date format reminder (`YYYY-MM-DD`)
- Reference convention table
- Calculated fields short reminder
- Pointer to vendor mapping docs for Path A
- Sensitivity warnings (contact emails, vendor cost, business criticality, custom fields)

### 4.2 Date format

All dates must be entered in `YYYY-MM-DD` (ISO 8601). Examples: `2026-05-31`, `2027-01-15`.

Avoid local formats such as `5/31/26`, `31-05-2026`, `May 31 2026`.

### 4.3 How to use references

References are short text identifiers you define that link records across sheets. They must be:

- Consistent across sheets (exact spelling and case)
- Unique within their sheet

### 4.4 Calculated fields reminder

Do not fill columns marked `[Calculated]` or columns in §15 — Opriva overwrites them with the correctly derived value.

---

## 5. Clients / Departments

### 5.1 MSP / Integrator — Clients sheet

| Column | Status | Description |
|---|---|---|
| **Client Reference** | [Required] | Short unique identifier (`CL-001`) |
| **Client Name** | [Required] | Client name — must match exactly in all other sheets |
| **Country** | [Optional] | ISO 3166-1 country code |
| **Account Owner** | [Optional] | Opriva user responsible for the client account |
| **Contact Name** | [Optional] | Primary contact — see §20 sensitivity notes |
| **Contact Email** | [Optional] | Primary contact email — see §20 |
| **Notes** | [Optional] | Free-text notes |

### 5.2 Internal IT — Departments sheet

| Column | Status | Description |
|---|---|---|
| **Department Reference** | [Required] | Short unique identifier (`DPT-001`) |
| **Department Name** | [Required] | Department name — must match exactly in all other sheets |
| **Business Unit** | [Optional] | Higher-level business unit (e.g., Corporate, Operations) |
| **Cost Center** | [Optional] | Cost center code (e.g., `CC-FIN-01`) |
| **Location** | [Optional] | Office / site / region / data center |
| **IT Owner** | [Optional] | Opriva user responsible for IT operations of this department |
| **Budget Owner** | [Optional] | Person responsible for budget / approvals |
| **Notes** | [Optional] | Free-text notes |

### 5.3 Canonical — Clients / Departments combined sheet

| Column | Status | Description |
|---|---|---|
| **Record Type** | [Required] | `Client` (MSP) or `Department` (Internal IT) |
| **Reference** | [Required] | Short unique identifier |
| **Name** | [Required] | Client or department name |
| **Business Unit** | [Optional] | Higher-level business unit |
| **Cost Center** | [Optional] | Cost center code |
| **Country** | [Optional] | ISO 3166-1 |
| **Location** | [Optional] | Office / region / data center |
| **Owner** | [Optional] | Account Owner (Client) or IT Owner (Department) |
| **Budget Owner** | [Optional] | Department only |
| **Contact Name** | [Optional] | Primary contact — see §20 |
| **Contact Email** | [Optional] | Primary contact email — see §20 |
| **Notes** | [Optional] | Free-text |

---

## 6. Renewal Packages

### 6.1 MSP — Renewal Packages sheet

| Column | Status | Description |
|---|---|---|
| **Package Reference** | [Required] | Unique identifier (`PKG-001`) |
| **Package Name** | [Required] | Descriptive name |
| **Client** | [Required] | Must match Clients sheet |
| **Brand / Vendor** | [Optional] | Primary technology brand |
| **Distributor** | [Optional] | Upstream distributor |
| **Reseller / Partner** | [Optional] | Mid-tier partner if any |
| **PO / Order Reference** | [Optional] | |
| **Quote Reference** | [Optional] | Vendor quote ID |
| **Invoice Reference** | [Optional] | |
| **Start Date** | [Optional] | `YYYY-MM-DD` |
| **Expiration / Renewal Date** | [Optional] | `YYYY-MM-DD` |
| **Sale Price / Annual Value** | [Optional] | Sale value to client |
| **Vendor Cost** | [Optional] | Cost from distributor — drives margin |
| **Currency** | [Optional] | `USD`, `EUR`, etc. |
| **Account Owner** | [Optional] | |
| **Alert Policy** | [Optional] | `Workspace default` etc. |
| **Notes** | [Optional] | |

### 6.2 Internal IT — Renewal Packages sheet (optional sheet)

| Column | Status | Description |
|---|---|---|
| **Package Reference** | [Required] | |
| **Package Name** | [Required] | |
| **Department** | [Required] | Must match Departments sheet |
| **Brand / Vendor** | [Optional] | |
| **Provider / Vendor** | [Optional] | Supplier |
| **PO / Order Reference** | [Optional] | |
| **Invoice Reference** | [Optional] | |
| **Start Date** | [Optional] | |
| **Expiration / Renewal Date** | [Optional] | |
| **Annual Cost** | [Optional] | Cost to organization |
| **Currency** | [Optional] | |
| **Budget Owner** | [Optional] | |
| **IT Owner** | [Optional] | |
| **Cost Center** | [Optional] | |
| **Approval Status** | [Optional] | `Pending`, `Approved`, `Rejected`, `In Review` |
| **Alert Policy** | [Optional] | |
| **Notes** | [Optional] | |

### 6.3 Canonical — Renewal Packages sheet

Combines all of the above with `Record Type`-aware columns visible at all times. `Sale Price / Annual Value` and `Vendor Cost` shown alongside `Annual Cost` — users fill what applies.

---

## 7. Licenses

### 7.1 MSP — Licenses sheet

| Column | Status | Description |
|---|---|---|
| **License Reference** | [Required] | `LIC-001` |
| **Package Reference** | [Optional] | Link to Renewal Package |
| **Client** | [Required] | Must match Clients sheet |
| **License / Product** | [Required] | Product or subscription name |
| **Brand** | [Optional] | Technology brand |
| **Distributor** | [Optional] | Upstream distributor |
| **Reseller / Partner** | [Optional] | |
| **Quantity** | [Optional] | Number of licenses / seats / devices |
| **Entitlement Metric** | [Optional] | `Devices`, `Users`, `Cores`, `VMs`, `Mailboxes`, etc. |
| **Start Date** | [Optional] | `YYYY-MM-DD` |
| **Expiration / Renewal Date** | [Required] | `YYYY-MM-DD` — drives status |
| **License Term** | [Optional] | `1 year`, `3 years`, etc. (controlled dropdown) |
| **Billing Cycle** | [Optional] | `Monthly`, `Annual`, `Multi-year`, `One-time` |
| **Alert Policy** | [Optional] | |
| **Renewal Owner** | [Optional] | |
| **Sale Price / Annual Value** | [Optional] | Annual price to client |
| **Vendor Cost** | [Optional] | Annual cost from distributor |
| **Currency** | [Optional] | |
| **PO / Order Reference** | [Optional] | |
| **Invoice Reference** | [Optional] | |
| **Invoice Date** | [Optional] | |
| **Source Reference** | [Optional] | Vendor SKU / order ID preserved as metadata |
| **Source Status** | [Optional] | Vendor source status (not used for Opriva system status) |
| **Notes** | [Optional] | |

### 7.2 Internal IT — Licenses sheet

| Column | Status | Description |
|---|---|---|
| **License Reference** | [Required] | |
| **Package Reference** | [Optional] | |
| **Department** | [Required] | Must match Departments sheet |
| **License / Product** | [Required] | |
| **Brand** | [Optional] | |
| **Provider / Vendor** | [Optional] | Supplier |
| **Quantity** | [Optional] | |
| **Entitlement Metric** | [Optional] | |
| **Start Date** | [Optional] | |
| **Expiration / Renewal Date** | [Required] | |
| **License Term** | [Optional] | |
| **Billing Cycle** | [Optional] | |
| **Alert Policy** | [Optional] | |
| **IT Owner** | [Optional] | |
| **Budget Owner** | [Optional] | |
| **Annual Cost** | [Optional] | Cost to organization |
| **Currency** | [Optional] | |
| **PO / Order Reference** | [Optional] | |
| **Invoice Reference** | [Optional] | |
| **Approval Status** | [Optional] | `Pending`, `Approved`, `Rejected`, `In Review` |
| **Business Criticality** | [Optional] | `Critical`, `High`, `Medium`, `Low` |
| **Cost Center** | [Optional] | |
| **Source Reference** | [Optional] | |
| **Source Status** | [Optional] | |
| **Notes** | [Optional] | |

### 7.3 Canonical — Licenses sheet

Combines MSP and IT columns with workspace markers. `Sale Price / Annual Value` + `Vendor Cost` + `Annual Cost` all present; users fill what applies. Adds `[Calculated]` informational columns `Margin $`, `Margin %`, `Days to Expiration`, `System Status` (do not fill).

---

## 8. Hardware

### 8.1 MSP — Hardware sheet

| Column | Status | Description |
|---|---|---|
| **Hardware Reference** | [Required] | `HW-001` |
| **Package Reference** | [Optional] | |
| **Client** | [Required] | |
| **Asset Name** | [Required] | |
| **Asset Type** | [Optional] | `Server`, `NAS / Storage`, `Firewall`, `Switch`, `Router`, `Laptop`, `Desktop`, `UPS`, `Other` |
| **Brand** | [Optional] | |
| **Model** | [Optional] | |
| **Serial Number** | [Optional] | One per row; for multi-serial assets use multiple rows |
| **Distributor** | [Optional] | |
| **Reseller / Partner** | [Optional] | |
| **Purchase Date** | [Optional] | `YYYY-MM-DD` — used to infer Warranty Start |
| **Warranty Term** | [Optional] | `1 year`, `3 years`, etc. — used to infer Warranty End |
| **Asset Value** | [Optional] | Purchase price or book value |
| **Currency** | [Optional] | |
| **Location** | [Optional] | |
| **Owner** | [Optional] | |
| **Notes** | [Optional] | |

> **Note:** Warranty coverage is modeled on the Coverage sheet. If `Purchase Date` + `Warranty Term` are filled, Opriva suggests a Warranty Coverage row at import. Confirm or override in preview.

### 8.2 Internal IT — Hardware sheet

| Column | Status | Description |
|---|---|---|
| **Hardware Reference** | [Required] | |
| **Package Reference** | [Optional] | |
| **Department** | [Required] | |
| **Asset Name** | [Required] | |
| **Asset Type** | [Optional] | |
| **Brand** | [Optional] | |
| **Model** | [Optional] | |
| **Serial Number** | [Optional] | |
| **Provider / Vendor** | [Optional] | Supplier |
| **Purchase Date** | [Optional] | |
| **Warranty Term** | [Optional] | |
| **Asset Value** | [Optional] | |
| **Currency** | [Optional] | |
| **Location** | [Optional] | |
| **Asset Custodian** | [Optional] | Person physically responsible |
| **Budget Owner** | [Optional] | |
| **Cost Center** | [Optional] | |
| **Approval Status** | [Optional] | |
| **Business Criticality** | [Optional] | |
| **Notes** | [Optional] | |

### 8.3 Canonical — Hardware sheet

Combines columns; `Owner` + `Asset Custodian` + `Budget Owner` all present. Adds `[Calculated]` columns `Days to Warranty End`, `System Status`.

---

## 9. Coverage (NEW — all three templates)

The Coverage sheet models Warranty, Support and Maintenance as related entities linked to a parent License or Hardware record. Coverage records are stored in the `contracts` module with `meta.source = 'supportCoverage'` plus a `coverageKind` discriminator.

### 9.1 Coverage sheet columns (all templates)

| Column | Status | Description |
|---|---|---|
| **Coverage Reference** | [Required] | Short unique identifier (`COV-001`) |
| **Coverage Kind** | [Required] | `Warranty`, `Support`, or `Maintenance` (controlled dropdown) |
| **Covered Record Reference** | [Required] | The `License Reference` or `Hardware Reference` of the covered record. Cross-sheet — must match exactly. |
| **Coverage Type** | [Required] | Specific coverage type (controlled dropdown, see §9.3) |
| **Provider** | [Optional] | Provider / vendor providing the coverage (controlled catalog) |
| **Support Level** | [Optional] | `Bronze`, `Silver`, `Gold`, `Platinum`, `Standard`, `Premium`, `Mission Critical`, `Other` |
| **Start Date** | [Optional] | Coverage start date (`YYYY-MM-DD`). May be inferred. |
| **End Date** | [Required] | Coverage expiration date (`YYYY-MM-DD`) — drives status and alerts |
| **Support Reference** | [Optional] | Contract number, PO, or vendor support reference (e.g., Cisco SmartNet contract ID, HPE Care Pack serial) |
| **Alert Policy** | [Optional] | `Workspace default`, `90/60/30`, `60/30/7`, `30/7/1`, `Custom` |
| **Owner** | [Optional] | Person responsible for renewing or managing this coverage |
| **Annual Value** *(MSP)* / **Annual Cost** *(IT)* | [Optional] | Coverage value or cost |
| **Currency** | [Optional] | |
| **Suggestion Basis** | [Optional] | `file` (default), `inferred:purchase+term`, `inferred:license-term`, `manual` |
| **Notes** | [Optional] | |

### 9.2 Coverage Kind catalog

| Kind | Use for |
|---|---|
| `Warranty` | Hardware manufacturer warranty, extended warranty |
| `Support` | Software / hardware support contracts, SLAs, managed support, Software Assurance, Subscription Support |
| `Maintenance` | Maintenance agreements, scheduled service contracts |

### 9.3 Coverage Type catalog (expanded)

| Coverage Type | Typical Coverage Kind | Vendor examples |
|---|---|---|
| `Manufacturer Warranty` | Warranty | All hardware vendors |
| `Extended Warranty` | Warranty | Dell ProSupport, generic |
| `Care Pack` | Warranty | HPE |
| `SmartNet` | Support | Cisco |
| `Vendor Support` | Support | Most vendors |
| `Managed Support` | Support | MSP / partner-managed |
| `Subscription Support` | Support | Veeam, generic SaaS subscriptions |
| `Software Assurance` | Support | Microsoft |
| `SLA Coverage` | Support / Maintenance | Service-level agreements |
| `Maintenance Agreement` | Maintenance | Hardware / software maintenance contracts |
| `Other` | Any | Catch-all (requires Notes) |

### 9.4 Inference rules

Opriva auto-suggests coverage but **never auto-creates** without user approval. See Appendix C for full inference rules.

| Source data | Inferred coverage |
|---|---|
| Hardware: Purchase Date + Warranty Term | Warranty Coverage with `Suggestion Basis = inferred:purchase+term` |
| License: Start + Expiration + Support keyword | Support Coverage with `Suggestion Basis = inferred:license-term` |
| File provides coverage columns | Use file values; `Suggestion Basis = file` (default) |

**Precedence (file > inferred):** if the file provides Warranty End / Support End / Maintenance End / Coverage End Date, that value wins over any inference. Opriva records the precedence in the import activity event.

### 9.5 Multi-coverage per record

A single License or Hardware record may have multiple coverage rows simultaneously. Example: Cisco hardware typically has Manufacturer Warranty + SmartNet Support; Dell hardware typically has Manufacturer Warranty + ProSupport Extended Warranty.

| Coverage Ref | Kind | Covered Ref | Type | End |
|---|---|---|---|---|
| COV-001 | Warranty | HW-001 | Manufacturer Warranty | 2028-08-15 |
| COV-002 | Support | HW-001 | SmartNet | 2027-08-15 |
| COV-003 | Maintenance | HW-001 | Maintenance Agreement | 2027-08-15 |

### 9.6 Approval flow for suggested coverages

Inferred coverage rows (with `Suggestion Basis ≠ file`) follow the W1.5-style approval flow:

1. Import preview shows the suggested coverage as a sub-block under its parent record
2. User decides per suggestion: **Approve** / **Edit** / **Don't create**
3. `canConfirmImport` extends with `!hasPendingCoverageSuggestions`
4. Confirm materializes only Approved (or Edited-and-Approved) coverage rows
5. Activity event records: file-provided count, inferred-approved count, inferred-rejected count, manual count

---

## 10. Contracts (commercial agreements only)

The Contracts sheet stores commercial agreements only. **Support coverage records belong on the Coverage sheet, not here.**

### 10.1 MSP — Contracts sheet

| Column | Status | Description |
|---|---|---|
| **Contract Reference** | [Required] | `CTR-001` |
| **Package Reference** | [Optional] | |
| **Contract Name** | [Required] | |
| **Contract Type** | [Required] | `MSA`, `NDA`, `SLA`, `Service Contract`, `License Agreement`, `Hardware Contract`, `Other` |
| **Client** | [Required] | |
| **Counterparty** | [Optional] | Vendor / distributor / partner that signs the contract |
| **Start Date** | [Optional] | |
| **End Date** | [Required] | |
| **Owner** | [Optional] | |
| **Alert Policy** | [Optional] | |
| **Annual Value** | [Optional] | |
| **Currency** | [Optional] | |
| **Notice Period** | [Optional] | Days of advance notice for non-renewal |
| **Notes** | [Optional] | |

### 10.2 Internal IT — Contracts sheet

| Column | Status | Description |
|---|---|---|
| **Contract Reference** | [Required] | |
| **Package Reference** | [Optional] | |
| **Contract Name** | [Required] | |
| **Contract Type** | [Required] | (same enum as MSP) |
| **Department** | [Required] | |
| **Counterparty** | [Optional] | |
| **Start Date** | [Optional] | |
| **End Date** | [Required] | |
| **IT Owner** | [Optional] | |
| **Budget Owner** | [Optional] | |
| **Alert Policy** | [Optional] | |
| **Annual Cost** | [Optional] | |
| **Currency** | [Optional] | |
| **Approval Status** | [Optional] | |
| **Notice Period** | [Optional] | |
| **Notes** | [Optional] | |

### 10.3 Canonical — Contracts sheet

Combines all of the above. `Annual Value` + `Annual Cost` both present; users fill what applies.

---

## 11. Documents (metadata only)

The Documents sheet imports document metadata only. **Actual files must be uploaded separately** through the Opriva Documents module or the Documents tab of the linked record drawer after import.

### 11.1 Columns (all templates)

| Column | Status | Description |
|---|---|---|
| **Document Reference** | [Required] | `DOC-001` |
| **Package Reference** | [Optional] | Link to Renewal Package |
| **Linked Record Reference** | [Optional] | `License Reference`, `Hardware Reference`, `Contract Reference`, or `Coverage Reference` |
| **Document Name** | [Required] | |
| **Document Type** | [Required] | See §11.2 |
| **File Name** | [Optional] | Original filename including extension (informational) |
| **Uploaded By** | [Optional] | Person who prepared this document |
| **Notes** | [Optional] | |

### 11.2 Document Type catalog

| Document Type | MSP relevance | IT relevance |
|---|---|---|
| `Vendor Quote` | High | Medium |
| `Client Proposal` | High | n/a |
| `Purchase Order` | High | High |
| `Invoice` | High | High |
| `License Entitlement` | High | High |
| `Signed Contract` | High | High |
| `Warranty Document` | Medium | High |
| `Support Evidence` | High | High |
| `Compliance Evidence` | Low | High |
| `Legal Document` | Medium | Medium |
| `Internal Memo` | Low | Medium |
| `Other` | Catch-all | Catch-all |

> A document can link to both a Package and a specific record. One License Entitlement PDF may cover an entire renewal package and all its individual license records.

---

## 12. Tasks (Canonical only)

The Tasks sheet is included only in the Canonical / Advanced template. Most MSP and IT workflows do not pre-load tasks via import — tasks are created post-import based on Opriva alerts and renewal workflows.

| Column | Status | Description |
|---|---|---|
| **Task Reference** | [Required] | `TSK-001` |
| **Linked Record Reference** | [Optional] | `License Reference`, `Hardware Reference`, `Contract Reference`, or `Coverage Reference` |
| **Task Title** | [Required] | Short description of the action |
| **Task Type** | [Optional] | `Quote Request`, `Document Request`, `Renewal Follow-up`, `Owner Assignment`, `Approval Request`, `Client Follow-up`, `Other` |
| **Owner** | [Optional] | |
| **Due Date** | [Optional] | `YYYY-MM-DD` |
| **Priority** | [Optional] | `Critical`, `High`, `Medium`, `Low` |
| **Status** | [Optional] | `Open`, `In Progress`, `Waiting`, `Done` |
| **Notes** | [Optional] | |

---

## 13. Custom Fields (Canonical only)

The Custom Fields sheet is included only in the Canonical / Advanced template. It allows expert users to import additional field values that do not fit any standard column.

| Column | Status | Description |
|---|---|---|
| **Module** | [Required] | `Licenses`, `Hardware`, `Coverage`, `Contracts`, `Documents`, `Tasks`, `Clients / Departments`, `Renewal Packages` |
| **Record Reference** | [Required] | Reference from the corresponding module sheet |
| **Field Name** | [Required] | Custom field name (e.g., `TM Program Number`) |
| **Field Type** | [Required] | `Text`, `Number`, `Date`, `Dropdown`, `Currency`, `Checkbox`, `URL`, `Long Text` |
| **Value** | [Required] | Field value |
| **Notes** | [Optional] | |

**Security note (see §20):** Do not store passwords, API keys, license activation keys, internal IP addresses, or other sensitive credentials in Custom Fields.

---

## 14. Relationships (Canonical only)

The Relationships sheet allows expert users to define explicit cross-record links beyond the implicit `Package Reference` and `Covered Record Reference` mechanisms.

| Column | Status | Description |
|---|---|---|
| **Source Module** | [Required] | `Licenses`, `Hardware`, `Coverage`, `Contracts`, `Documents`, `Tasks`, `Clients / Departments`, `Renewal Packages` |
| **Source Reference** | [Required] | Reference from the source module |
| **Relationship Type** | [Required] | `Contains`, `Depends On`, `Replaces`, `Bundles With`, `Documents`, `Custom` |
| **Target Module** | [Required] | (same enum as Source Module) |
| **Target Reference** | [Required] | Reference from the target module |
| **Notes** | [Optional] | |

Examples:
- Contract that covers multiple Hardware items not all in the same Package
- License that depends on another License (e.g., bundled SKU)
- Hardware asset that replaces an older asset
- Asset that depends on a custom project

Most workspaces will not need the Relationships sheet.

---

## 15. Fields Opriva Should Not Ask Users to Fill

The following fields are calculated, derived, or generated by Opriva. They must never appear as fillable columns and must never be requested from the user during import.

| Field | Derived from | Where it appears |
|---|---|---|
| **System Status** | Expiration / Renewal Date + Alert Policy | License, Hardware, Coverage, Contract table columns |
| **Days to Expiration** | Expiration Date vs. today | All table views, Dashboard |
| **Risk** | Calculated from expiration proximity, coverage gaps, ownership gaps | Attention Center, Dashboard |
| **Margin $** | Sale Price − Vendor Cost | License table *(MSP only)* |
| **Margin %** | Margin $ ÷ Sale Price | License table *(MSP only)* |
| **Renewal Stage** | Workflow events and user actions | Renewal workflow *(Phase 2)* |
| **Missing Evidence** | Document policy engine + attached documents | Attention Center *(Phase 2)* |
| **Validity Status** | Document policy + document dates | Documents tab *(Phase 2)* |
| **Alert Status** | Alert Policy threshold vs. today | Record drawer, Dashboard |

If any of these values appear in a source file being imported via Path A, Opriva's AI flags them as `Calculated — recommend skip` during the column-mapping step.

---

## 16. Validation Rules

### 16.1 Required field validation

| Module | Required fields |
|---|---|
| **Clients / Departments** | Record Type (Canonical only), Reference, Name |
| **Renewal Packages** | Package Reference, Package Name, Client / Department |
| **Licenses** | License Reference, Client / Department, License / Product, Expiration / Renewal Date |
| **Hardware** | Hardware Reference, Client / Department, Asset Name |
| **Coverage** | Coverage Reference, Coverage Kind, Covered Record Reference, Coverage Type, End Date |
| **Contracts** | Contract Reference, Contract Name, Contract Type, Client / Department, End Date |
| **Documents** | Document Reference, Document Name, Document Type |
| **Tasks** | Task Reference, Task Title |
| **Custom Fields** | Module, Record Reference, Field Name, Field Type, Value |
| **Relationships** | Source Module, Source Reference, Relationship Type, Target Module, Target Reference |

### 16.2 Reference validation

| Validation | Rule |
|---|---|
| **Package Reference must exist** | Any Licenses / Hardware / Coverage / Contracts / Documents row with a Package Reference must match a value in the Renewal Packages sheet |
| **Covered Record Reference must exist** | A Coverage row must reference a valid License Reference or Hardware Reference |
| **Linked Record Reference must exist** | A Documents or Tasks row with a Linked Record Reference must match a reference in Licenses, Hardware, Contracts, or Coverage |
| **Client / Department must exist** | Client / Department values in all sheets must match a Name in the Clients / Departments sheet |
| **Duplicate references** | Two rows in the same sheet must not share the same Reference value |

### 16.3 Date validation

All dates must be in `YYYY-MM-DD` format. Opriva rejects unparseable date values and highlights them in the import preview.

### 16.4 Controlled vocabulary validation

The following columns accept only the listed values (Excel data validation dropdowns enforced via hidden `_Catalogs` sheet):

| Column | Accepted values |
|---|---|
| **Record Type** | `Client`, `Department` |
| **Alert Policy** | `Workspace default`, `90/60/30`, `60/30/7`, `30/7/1`, `Custom` |
| **Document Type** | `Vendor Quote`, `Client Proposal`, `Purchase Order`, `Invoice`, `License Entitlement`, `Signed Contract`, `Warranty Document`, `Support Evidence`, `Compliance Evidence`, `Legal Document`, `Internal Memo`, `Other` |
| **Contract Type** | `MSA`, `NDA`, `SLA`, `Service Contract`, `License Agreement`, `Hardware Contract`, `Other` (excludes `Support Coverage`) |
| **Coverage Kind** | `Warranty`, `Support`, `Maintenance` |
| **Coverage Type** | `Manufacturer Warranty`, `Extended Warranty`, `Care Pack`, `SmartNet`, `Vendor Support`, `Managed Support`, `Subscription Support`, `Software Assurance`, `SLA Coverage`, `Maintenance Agreement`, `Other` |
| **Support Level** | `Bronze`, `Silver`, `Gold`, `Platinum`, `Standard`, `Premium`, `Mission Critical`, `Other` |
| **Suggestion Basis** | `file`, `inferred:purchase+term`, `inferred:license-term`, `manual` |
| **Asset Type** | `Server`, `NAS / Storage`, `Firewall`, `Switch`, `Router`, `Laptop`, `Desktop`, `UPS`, `Other` |
| **Entitlement Metric** | `Devices`, `Users`, `Cores`, `VMs`, `Mailboxes`, `GB Storage`, `Sessions`, `Other` |
| **License Term** | `1 month`, `1 year`, `2 years`, `3 years`, `5 years`, `Perpetual`, `Custom` |
| **Warranty Term** | `1 year`, `2 years`, `3 years`, `5 years`, `Custom` |
| **Billing Cycle** | `Monthly`, `Annual`, `Multi-year`, `One-time`, `Other` |
| **Currency** | `USD`, `EUR`, `GBP`, `MXN`, `BRL`, `CRC`, `PAB`, `Other` |
| **Priority** | `Critical`, `High`, `Medium`, `Low` |
| **Task Status** | `Open`, `In Progress`, `Waiting`, `Done` |
| **Field Type** (Custom Fields) | `Text`, `Number`, `Date`, `Dropdown`, `Currency`, `Checkbox`, `URL`, `Long Text` |
| **Approval Status** (IT) | `Pending`, `Approved`, `Rejected`, `In Review` |
| **Business Criticality** (IT) | `Critical`, `High`, `Medium`, `Low` |
| **Relationship Type** (Canonical) | `Contains`, `Depends On`, `Replaces`, `Bundles With`, `Documents`, `Custom` |

Values not in the accepted list are flagged in the import preview and rejected unless the user maps them to an accepted value.

### 16.5 Coverage suggestion validation

Inferred coverages (with `Suggestion Basis ≠ file`) must be approved by user before confirm. Rows pending approval block import confirmation.

### 16.6 Import preview requirement

Every import — including template uploads — must produce a **preview step** before records are committed. The preview must show:

- Total rows detected per sheet
- Rows that will be created (valid)
- Rows flagged with validation errors (missing required, broken reference, invalid date, unknown controlled value)
- Suggested coverage records per parent row (with approve / edit / skip controls)
- Summary of records to be created per module

Users must confirm the preview before records are written.

---

## 17. Visual / Styling Specification

The official templates must look enterprise-grade. The following ensures consistency across all three templates and future generated workbooks.

### 17.1 Color palette (Opriva)

| Use | Color |
|---|---|
| Primary navy (header bg) | `#0B1F3A` |
| Accent teal (active, success) | `#0D9488` |
| Required red | `#B91C1C` |
| Optional gray | `#64748B` |
| Calculated bg | `#F1F5F9` |
| Suggested amber | `#F59E0B` |
| Advanced violet | `#7C3AED` |
| Header text on navy | `#FFFFFF` |
| Example row text | `#94A3B8` |
| Cell borders | `#E2E8F0` |

### 17.2 Header rows

- Row 1: bg `#0B1F3A`, text `#FFFFFF`, font Calibri / Inter 12pt bold, height 28px, **frozen**
- Row 2 (sub-header with badges): bg `#F1F5F9`, text 10pt italic, contains `[REQ]` / `[OPT]` / `[SUG]` / `[CALC]` / `[ADV]` badges per column
- Bottom border on row 1: 2px solid `#0D9488`

### 17.3 Sheet tab colors

| Sheet category | Tab color |
|---|---|
| Reference (Clients/Departments, Renewal Packages) | Teal `#99F6E4` |
| Records (Licenses, Hardware) | Blue `#BAE6FD` |
| Coverage | Amber `#FEF3C7` |
| Contracts | Violet `#DDD6FE` |
| Documents | Gray `#E2E8F0` |
| Tasks | Rose `#FBCFE8` |
| Custom Fields / Relationships | Pink `#FCE7F3` |

### 17.4 Badge styling

| Badge | Background | Text |
|---|---|---|
| `REQ` | `#FEE2E2` | `#B91C1C` |
| `OPT` | `#E2E8F0` | `#64748B` |
| `SUG` | `#FEF3C7` | `#92400E` |
| `CALC` | `#F1F5F9` | `#94A3B8` italic |
| `ADV` | `#EDE9FE` | `#7C3AED` |

### 17.5 Calculated columns

Calculated informational columns (Canonical only) use:
- Background `#F1F5F9`
- Text gray italic
- Cell-level "Protected" lock
- Tooltip: "System calculated — do not fill"

### 17.6 Freeze panes

Every data sheet has row 1 (header) frozen. Sheets where reference columns matter (especially Coverage) also freeze column A (the Reference column).

### 17.7 Example row

Row 2 of every data sheet (after the badge sub-header, so technically row 3 in workbooks that have a sub-header row) contains an example row marked `DELETE BEFORE IMPORT` in the first cell. Styled italic `#94A3B8`, light bg `#F8FAFC`.

> Implementation note: when generating, place the badge sub-header row as part of merged column-header logic so the visual badge does not occupy a data row.

### 17.8 Hidden `_Catalogs` sheet

Each workbook contains a hidden sheet named `_Catalogs` listing all controlled vocabulary values. All Excel data validation dropdowns reference this sheet. Updating a catalog updates all dropdowns automatically.

### 17.9 Font

Calibri 11pt (default) or Inter 11pt where available. Headers 12pt bold. Notes 10pt italic gray.

### 17.10 Line height and cell padding

Data row height ≥ 22px. Cell vertical alignment middle. Horizontal alignment per data type (text left, numbers right, dates center).

### 17.11 WCAG AA

All text must meet WCAG AA contrast (4.5:1). The combinations in §17.1 are designed to meet this threshold. Color is never the sole indicator of meaning — every status uses color + badge text + cell border style.

---

## 18. Future Excel Template Generation (Phase 2)

### 18.1 Workspace-aware generation

When implemented, Opriva will generate per-workspace templates based on workspace mode, enabled modules, custom fields and workspace-level defaults.

| Mode | Generated template |
|---|---|
| MSP / Integrator | MSP template + workspace Custom Fields |
| Internal IT | Internal IT template + workspace Custom Fields |
| Hybrid | Canonical template + workspace Custom Fields |

### 18.2 Custom field injection

If workspace has defined custom fields, those columns appear in the appropriate sheet after standard columns with `[Custom]` annotation.

### 18.3 Pre-filled defaults

Workspace alert policy, approved document types, approved contract types and other controlled catalogs are pre-filled as Excel data validation dropdowns sourced from the hidden `_Catalogs` sheet.

### 18.4 Instructions personalization

Per-workspace Instructions sheet with workspace name, mode, date format, enabled modules and module-specific guidance.

### 18.5 Download entry points

| Location | Purpose |
|---|---|
| Data Import → "Download Opriva Template" button | Primary download |
| Settings → Company → Import Templates | Admin-level management |

### 18.6 Template recognition on upload

Opriva detects an Official Template by:
- Template version marker in Instructions sheet cell A1 (e.g., `OPRIVA_TEMPLATE_V2.0_MSP`)
- Expected sheet names in order
- Column header structure matching canonical

If recognized, Opriva bypasses AI mapping and goes directly to import preview.

---

## 19. Security and Sensitivity Notes

The templates may contain or relate to sensitive information.

### 19.1 Contact PII

Contact Name and Contact Email columns contain personal data. The Instructions sheet must include:

> "Contact Name and Contact Email are personal data. Avoid uploading templates with real contact information until corporate MVP enables permission-aware Contact handling. In sandbox mode, contact emails are stored in session memory only and are never used to send messages."

### 19.2 Commercial sensitivity

Vendor Cost, Sale Price / Annual Value, Annual Cost and Margin-related calculated columns contain commercial information that may have permission boundaries in corporate MVP. Sandbox mode preserves them in session memory only.

### 19.3 Serial Numbers

Hardware Serial Numbers are asset-sensitive. They must be unique per asset and deduplicated at import. Imported records with duplicate serials must be flagged.

### 19.4 Document File Names

The File Name column preserves the original filename for reference but does not upload the file. Avoid filenames containing sensitive context (`customer_passwords_2026.xlsx`).

### 19.5 Custom Fields safety

The Custom Fields sheet must not be used to store:
- Passwords
- API keys
- License activation keys
- Internal IP addresses
- Tax IDs / SSNs / bank info
- Health / biometric data

The Instructions sheet must include a Custom Fields warning section.

### 19.6 Compliance Evidence (Internal IT)

`Compliance Evidence` Document Type is for audit trails (ISO 27001, SOC 2, etc.) and may have retention / access requirements in corporate MVP. Currently sandbox-only.

### 19.7 Backend boundary

All sensitivity protections described above are partially enforceable in sandbox (session-only memory, no transmission, no AI logging). Corporate MVP requires backend permission-aware handling, encryption-at-rest, audit trail and retention policy.

---

## Appendix A — Reference Naming Convention

| Reference type | Suggested format | Example |
|---|---|---|
| Client Reference (MSP) | `CL-NNN` | `CL-001` |
| Department Reference (IT) | `DPT-NNN` | `DPT-001` |
| Package Reference | `PKG-NNN` or vendor PO number | `PKG-001`, `TRM-STD-966300` |
| License Reference | `LIC-NNN` | `LIC-001` |
| Hardware Reference | `HW-NNN` | `HW-001` |
| Coverage Reference | `COV-NNN` | `COV-001` |
| Contract Reference | `CTR-NNN` | `CTR-001` |
| Document Reference | `DOC-NNN` | `DOC-001` |
| Task Reference | `TSK-NNN` | `TSK-001` |

References are user-defined. They do not need to follow this convention but must be unique within their sheet.

---

## Appendix B — Relationship Between Import Paths

```
Source data
    │
    ├── Arbitrary file (Excel, CSV, PDF, vendor export)
    │       │
    │       └──▶  Path A: AI-Assisted Guided Mapping
    │                   ↓
    │              Detect source columns
    │                   ↓
    │              AI suggests canonical field mappings
    │                   ↓
    │              User reviews, adjusts, approves mapping
    │                   ↓
    │              Import preview (with coverage suggestions)
    │                   ↓
    │              User approves coverage suggestions
    │                   ↓
    │              Records created (main + coverage)
    │
    └── Official Opriva Template (.xlsx — MSP / IT / Canonical)
            │
            └──▶  Path B: Template Import
                        ↓
                   Template recognized automatically
                        ↓
                   Validation against canonical model
                        ↓
                   Import preview (errors + coverage suggestions)
                        ↓
                   User approves coverage suggestions
                        ↓
                   Records created (main + coverage)
```

Both paths produce the same result: Opriva canonical records, including related Coverage records when applicable.

---

## Appendix C — Coverage Inference Rules

### C.1 Hardware → Warranty Coverage

| Source data | Inferred coverage |
|---|---|
| Purchase Date + Warranty Term | Warranty Coverage |
| | Start Date = Purchase Date |
| | End Date = Purchase Date + Term (months) |
| | Coverage Type = `Manufacturer Warranty` |
| | Provider = Hardware brand |
| | Suggestion Basis = `inferred:purchase+term` |

Examples:
- Dell PowerEdge with Purchase Date `2025-08-15` and Warranty Term `3 years` → Warranty End `2028-08-15`
- HPE ProLiant with Purchase Date `2024-12-01` and Warranty Term `5 years` → Warranty End `2029-12-01`

### C.2 License → Support Coverage

| Source data | Inferred coverage |
|---|---|
| License Start + License Expiration + Support keyword (`yes`, `included`, `Software Assurance`, `Subscription Support`) | Support Coverage |
| | Start Date = License Start |
| | End Date = License Expiration |
| | Coverage Type = `Vendor Support` (default) or specific (Software Assurance, Subscription Support, etc.) if keyword detected |
| | Provider = License brand |
| | Suggestion Basis = `inferred:license-term` |

Examples:
- Microsoft 365 E5 with `Support = Software Assurance`, License Start `2026-01-17`, End `2027-01-17` → Support Coverage with Type `Software Assurance`, End `2027-01-17`
- Veeam Backup & Replication with `Support = included` and dates → Subscription Support inferred

### C.3 Maintenance Coverage

Maintenance coverage is never inferred. The ambiguity between Warranty / Maintenance / Support is too high. Maintenance must come from an explicit file column or manual entry.

### C.4 Precedence (file > inferred)

If the file provides Warranty End / Support End / Maintenance End / Coverage End Date columns, those values win over any inference. The inferred row is not created; the file-provided row is used. Opriva records the precedence decision in the import activity event.

### C.5 Approval flow

1. Preview displays Suggested coverages under parent records as sub-blocks
2. User decides per suggestion: **Approve** / **Edit** / **Don't create**
3. `canConfirmImport &&= !hasPendingCoverageSuggestions`
4. Confirm materializes Approved rows only
5. Activity event logs: file-provided count, approved count, rejected count, manual count

### C.6 Backend implications (Phase 2)

- Persistent coverage table with `coverageKind` indexed
- Server-side validation of `Covered Record Reference`
- Audit trail per coverage approval (`approvedBy`, `approvedAt`, `suggestionBasis`)
- RBAC: who can approve coverage suggestions during import
- Renewal workflow tasks auto-generated server-side when coverage approaches expiration
