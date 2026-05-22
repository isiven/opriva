# Opriva Import Template Specification

**Version:** 1.0 — MVP Reference
**Status:** Approved product decision. Template generation not yet implemented. This document defines the canonical structure for when implementation begins.
**Scope:** Defines all sheets, columns, field types, required/optional markers, validation rules, and instructions for the official Opriva Import Template workbook.

> **File storage:** Real customer files should be stored under `private-samples/` and excluded from Git. Anonymized demo files may be stored under `sample-data/`.

---

## 1. Purpose

Opriva supports two data import paths:

### Path A — AI-Assisted Guided Mapping (flexible)

The user uploads any Excel, CSV, or PDF file — even a raw vendor export or an unstructured internal spreadsheet. Opriva's AI analyzes the source columns, detects their likely meaning, and suggests how to map each column to an Opriva canonical field. The user reviews, adjusts, and approves the mapping before any records are created.

This path is designed for real-world source files that were never built with Opriva in mind: Trend Micro renewal registers, QNAP hardware sales exports, Veeam license reports, Microsoft CSP exports, internal tracking spreadsheets, or any custom format a customer or vendor uses.

See `MEMORY.md §19` and individual `IMPORT_MAPPING_*.md` documents for field mapping details by vendor.

### Path B — Official Opriva Template (structured)

The Official Opriva Import Template is a structured workbook that customers can download and fill directly in Opriva's canonical format. Customers who prefer to prepare their data exactly as Opriva expects — before uploading — can use this template to skip the mapping step entirely or to minimize mapping decisions.

**The template is not a replacement for Path A.** Both paths coexist. Customers choose the path that best fits their workflow:

| Situation | Recommended path |
|---|---|
| Existing vendor export or internal spreadsheet | Path A — AI-assisted guided mapping |
| Starting fresh with no existing data | Path B — Official template |
| Customer wants to prepare clean data in Opriva's structure | Path B — Official template |
| Complex multi-vendor data with inconsistent columns | Path A — AI-assisted guided mapping |
| Onboarding a new client with structured data | Either path |

When a customer uploads the Official Opriva Template, Opriva should recognize it automatically (e.g. by a header marker or sheet structure) and bypass the AI mapping step, importing directly into the canonical model with only a preview/confirmation step.

---

## 2. Import Principles

### 2.1 The template represents Opriva's canonical model

Every column in every sheet maps directly to an Opriva canonical field. There are no extra columns, no calculated values, and no vendor-specific identifiers. The template is the cleanest possible expression of Opriva's data model.

### 2.2 Calculated fields are excluded

The following fields must not appear in the template. They are derived by Opriva from other entered values:

| Excluded field | Reason |
|---|---|
| System Status | Derived from Expiration Date + Alert Policy |
| Days to Expiration | Derived from Expiration Date vs. today |
| Alert Status | Derived from Alert Policy threshold |
| Risk signals | Calculated from expiration, coverage, ownership gaps |
| Margin $ | Derived from Sale Price − Vendor Cost |
| Margin % | Derived from Margin $ ÷ Sale Price |
| Validity Status | Derived from document policy + dates |
| Evidence Gap | Derived from document policy + attached documents |
| Renewal Stage | Driven by workflow events and user actions |

Users should not be asked to fill these fields. Entering them manually would produce incorrect or conflicting data.

### 2.3 The template supports both workspace modes

The template includes columns that serve both MSP / Integrator and Internal IT users. Columns that only apply to one mode are marked with **(MSP only)** or **(Internal IT only)**. Customers should leave mode-specific columns blank if they do not apply to their workspace.

| Mode | Entity terminology |
|---|---|
| MSP / Integrator | Client, Distributor, Annual Value, Vendor Cost, Renewal Owner |
| Internal IT | Department, Provider, Annual Cost, Cost Center, IT Owner / Budget Owner |

### 2.4 Required and optional fields are clearly marked

Every column header in the template must be marked as either:
- **[Required]** — the record cannot be imported without this value
- **[Optional]** — the record can be imported without this value; it can be completed later in the record drawer

### 2.5 Users may leave optional sheets empty

The template is a multi-sheet workbook. Customers do not need to fill every sheet. A customer importing only Licenses can leave Hardware, Tasks, and Documents sheets empty. Opriva must import any non-empty sheets and skip empty ones cleanly.

### 2.6 References connect records across sheets

The template uses plain-text reference identifiers to link records across sheets. These are not database IDs — they are user-defined short codes that Opriva uses during import to connect related records.

| Reference type | Description |
|---|---|
| **Package Reference** | Links Licenses, Hardware, Contracts, and Documents to a parent Renewal Package |
| **Linked Record Reference** | Links a Document or Task to a specific record in any module |
| **Contract Reference** | Identifies a specific Contract / Support Coverage record for linking |

References must be consistent across sheets but are not validated externally. Opriva matches them during import and reports any broken references in the import preview.

---

## 3. Workbook Structure

The official template is a multi-sheet Excel workbook (`.xlsx`) with the following sheets in this order:

| # | Sheet Name | Purpose |
|---|---|---|
| 1 | **Instructions** | How to fill the template, date format, field rules |
| 2 | **Clients / Departments** | Client and Department records |
| 3 | **Renewal Packages** | Parent deal / package groupings |
| 4 | **Licenses** | Software license and subscription records |
| 5 | **Hardware** | Physical IT asset records |
| 6 | **Contracts / Support Coverage** | Commercial agreements and support contracts |
| 7 | **Documents** | Document metadata records |
| 8 | **Tasks** | Follow-up action records |
| 9 | **Custom Fields** | Additional field values for any module |

Each data sheet (sheets 2–9) uses the first row as a frozen column header row. Data begins on row 2. No merged cells. No formulas.

---

## 4. Instructions Sheet

The Instructions sheet is the first sheet in the workbook. It must not contain data rows.

### Content

#### How to fill this template

1. Start with the **Clients / Departments** sheet. Enter one row per client (MSP) or department (Internal IT). Use consistent names — the same name must appear exactly in all other sheets that reference this client or department.
2. Fill in **Renewal Packages** (optional). A package groups multiple licenses, hardware, contracts, and documents under one deal or renewal cycle.
3. Fill in **Licenses**, **Hardware**, **Contracts / Support Coverage**, **Documents**, and **Tasks** as applicable. Leave any sheet completely empty if it does not apply.
4. Use the **Custom Fields** sheet only for data that does not fit any standard column.
5. Save the file and upload it to Opriva via **Data Import → Upload Opriva Template**.

#### Date format

All dates must be entered in `YYYY-MM-DD` format (ISO 8601).

Examples: `2026-05-31`, `2027-01-15`

Do not use local date formats such as `5/31/26` or `31-05-2026`.

#### Required fields

Columns marked **[Required]** must have a value for every row on that sheet. Rows with missing required fields will be flagged in the import preview and excluded from the import unless corrected.

#### How to use references

References are short text identifiers you define that link records across sheets. For example, if a Renewal Package has `Package Reference = PKG-001`, then any License row with `Package Reference = PKG-001` will be linked to that package during import.

References can be any value — invoice numbers, short codes, internal IDs — as long as they are:
- Consistent across sheets (exact spelling and case must match)
- Unique within their sheet (no two packages with the same Package Reference)

#### Leaving optional sheets empty

You do not need to fill every sheet. Leave optional sheets blank (with only the header row). Opriva imports only non-empty sheets.

#### Do not enter calculated values

Do not enter the following — Opriva calculates them automatically:

- **System Status** (Active, Expiring soon, Expired) — calculated from Expiration Date + Alert Policy
- **Days to Expiration** — calculated from Expiration Date vs. today
- **Margin** — calculated from Sale Price − Vendor Cost
- **Risk** — calculated from expiration, coverage, and ownership analysis
- **Renewal Stage** — driven by workflow events
- **Validity Status** — driven by document policy
- **Missing Evidence** — driven by document policy

Entering these manually will not work — Opriva ignores or overwrites them with the correct calculated value.

---

## 5. Clients / Departments Sheet

One row per client (MSP / Integrator) or department (Internal IT). The **Name** column is used by all other sheets as a reference.

| Column | Status | Description |
|---|---|---|
| **Record Type** | [Required] | `Client` (MSP) or `Department` (Internal IT) |
| **Name** | [Required] | Client or department name — must match exactly in all other sheets |
| **Country** | [Optional] | Country of the client or department location |
| **Contact Name** | [Optional] | Primary contact person |
| **Contact Email** | [Optional] | Contact email address |
| **Owner** | [Optional] | The Opriva user responsible for this client or department |
| **Notes** | [Optional] | Free-text notes |

**Notes:**
- For MSP / Integrator: use `Record Type = Client` for all rows.
- For Internal IT: use `Record Type = Department` for all rows.
- Mixed workbooks (Hybrid workspace) may include both types.

---

## 6. Renewal Packages Sheet

One row per commercial deal, renewal cycle, or purchase bundle. A package groups related licenses, hardware, contracts, and documents from a single order.

| Column | Status | Description |
|---|---|---|
| **Package Reference** | [Required] | Short unique identifier for this package (e.g. `PKG-001`, `TRM-STD-966300`) — used to link records in other sheets |
| **Package Name** | [Required] | Descriptive name (e.g. "Banisi — Trend Micro 2026 Renewal") |
| **Client / Department** | [Required] | Must match a name from the Clients / Departments sheet exactly |
| **Brand / Vendor** | [Optional] | Primary technology brand or vendor for this deal |
| **Provider / Distributor** | [Optional] | MSP: upstream distributor. Internal IT: supplier or provider |
| **PO / Order Reference** | [Optional] | Internal purchase order or order number |
| **Invoice Reference** | [Optional] | Vendor or distributor invoice number |
| **Start Date** | [Optional] | Package coverage start date (`YYYY-MM-DD`) |
| **Expiration / Renewal Date** | [Optional] | Package-level expiration or renewal date (`YYYY-MM-DD`) |
| **Total Value** | [Optional] | Total commercial value of this package (MSP: sale value; Internal IT: total cost) |
| **Owner** | [Optional] | The Opriva user responsible for this package |
| **Alert Policy** | [Optional] | `Workspace default`, `90/60/30`, `60/30/7`, `30/7/1`, or `Custom` |
| **Notes** | [Optional] | Free-text notes |

**Notes:**
- Renewal Packages are optional. If no packages are defined, License and Hardware records will be imported as standalone records.
- The `Package Reference` in this sheet is the anchor. Any other sheet that includes a `Package Reference` column uses this value to link to the parent package.

---

## 7. Licenses Sheet

One row per software license or subscription. For multi-product deals, enter one row per product SKU.

| Column | Status | Description |
|---|---|---|
| **License Reference** | [Required] | Short unique identifier for this license row (e.g. `LIC-001`) |
| **Package Reference** | [Optional] | Links this license to a parent Renewal Package — must match a value in the Renewal Packages sheet |
| **Client / Department** | [Required] | Must match a name from the Clients / Departments sheet exactly |
| **License / Product** | [Required] | Product or subscription name (e.g. "Trend Vision One Endpoint Security Core") |
| **Brand** | [Optional] | Technology brand or manufacturer (e.g. Trend Micro, Microsoft, Veeam) |
| **Provider / Distributor** | [Optional] | MSP: distributor (e.g. LOL Panama, TD SYNNEX). Internal IT: provider |
| **Quantity** | [Optional] | Number of licenses, seats, or devices |
| **Entitlement Metric** | [Optional] | Unit of the license quantity (e.g. Devices, Users, Cores, VMs, Mailboxes) |
| **Start Date** | [Optional] | License start date (`YYYY-MM-DD`) |
| **Expiration / Renewal Date** | [Required] | License expiration or renewal date (`YYYY-MM-DD`) |
| **Alert Policy** | [Optional] | `Workspace default`, `90/60/30`, `60/30/7`, `30/7/1`, or `Custom` |
| **Owner** | [Optional] | MSP: Renewal Owner. Internal IT: IT Owner / Budget Owner |
| **Annual Value / Annual Cost** | [Optional] | MSP: price to client. Internal IT: cost to organization |
| **Vendor Cost** | [Optional] | **(MSP only)** Cost from the distributor — used to calculate margin |
| **Source Status / Vendor Status** | [Optional] | Status value from the source system (e.g. Active, Expired, Cancelled) — stored as reference metadata, not used for Opriva system status |
| **Source Reference** | [Optional] | Vendor-issued reference number, SKU, or order ID |
| **Notes** | [Optional] | Free-text notes |

**Notes:**
- `Expiration / Renewal Date` is required because it drives System Status, Days to Expiration, and alert logic. Import a row without this date will create a record with status `Pending date`.
- `Vendor Cost` and margin fields are MSP-only. Internal IT customers should leave these blank.
- `Source Status / Vendor Status` preserves the original vendor status for reference but does not override Opriva's calculated System Status.

---

## 8. Hardware Sheet

One row per physical IT asset. For assets sold with components (e.g. a NAS plus individual drives), enter one row per component if individual serial tracking is needed, or consolidate into the parent row with component notes.

| Column | Status | Description |
|---|---|---|
| **Hardware Reference** | [Required] | Short unique identifier for this asset (e.g. `HW-001`) |
| **Package Reference** | [Optional] | Links this asset to a parent Renewal Package — must match a value in the Renewal Packages sheet |
| **Client / Department** | [Required] | Must match a name from the Clients / Departments sheet exactly |
| **Asset Name** | [Required] | Descriptive name for the asset (e.g. "QNAP TS-h1090FU NAS") |
| **Asset Type** | [Optional] | Category: `Server`, `NAS / Storage`, `Firewall`, `Switch`, `Router`, `Laptop`, `Desktop`, `UPS`, `Other` |
| **Brand** | [Optional] | Hardware manufacturer (e.g. QNAP, Dell, Cisco, HPE) |
| **Model** | [Optional] | Specific model name or number |
| **Serial Number** | [Optional] | Device serial number. For multiple serials, separate with a semicolon (`;`) |
| **Provider** | [Optional] | Supplier or service provider (MSP: Nextcom as seller; Internal IT: vendor from whom purchased) |
| **Purchase Date** | [Optional] | Date of purchase (`YYYY-MM-DD`) |
| **Warranty End Date** | [Optional] | Date the hardware warranty expires (`YYYY-MM-DD`) |
| **Owner / Custodian** | [Optional] | Person responsible for this asset |
| **Location** | [Optional] | Physical or logical location (e.g. rack ID, office, data center) |
| **Asset Value** | [Optional] | Purchase price or current book value |
| **Notes** | [Optional] | Free-text notes — use for component descriptions, embedded warranty terms, or asset notes |

**Notes:**
- `Warranty End Date` drives hardware expiration tracking. A hardware record without a Warranty End Date will show status `Pending date`.
- Support Coverage (extended warranties, SLA contracts) should be entered on the **Contracts / Support Coverage** sheet with a `Covered Record Reference` pointing to this asset's Hardware Reference.
- Components with individual serials and tracking value should each have their own row, linked to the parent via the Package Reference and with matching Notes.

---

## 9. Contracts / Support Coverage Sheet

One row per commercial agreement or support coverage contract. This sheet covers both general commercial contracts and support coverage records linked to License or Hardware assets.

| Column | Status | Description |
|---|---|---|
| **Contract Reference** | [Required] | Short unique identifier (e.g. `CTR-001`, `COV-001`) |
| **Package Reference** | [Optional] | Links this contract to a parent Renewal Package — must match a value in the Renewal Packages sheet |
| **Contract / Coverage Name** | [Required] | Name of the contract or coverage (e.g. "Nextcom Gold Support — Banisi", "QNAP 3-Year Warranty Extension") |
| **Contract Type** | [Required] | `Support Coverage`, `Maintenance Agreement`, `SLA`, `MSA`, `NDA`, `Service Contract`, `Hardware Contract`, `License Agreement`, `Other` |
| **Covered Record Reference** | [Optional] | For Support Coverage: the `License Reference` or `Hardware Reference` of the covered record |
| **Client / Department** | [Required] | Must match a name from the Clients / Departments sheet exactly |
| **Provider** | [Optional] | The provider or counterparty for this contract (e.g. Trend Micro, Nextcom Systems Inc., Dell Technologies) |
| **Coverage Type** | [Optional] | For Support Coverage: `Manufacturer Support`, `Manufacturer Warranty`, `Extended Warranty`, `Managed Support`, `SLA Coverage`, `Care Pack`, `Other` |
| **Start Date** | [Optional] | Contract or coverage start date (`YYYY-MM-DD`) |
| **End Date** | [Required] | Contract or coverage expiration date (`YYYY-MM-DD`) — drives status and alert logic |
| **Owner** | [Optional] | Person responsible for managing or renewing this contract |
| **Alert Policy** | [Optional] | `Workspace default`, `90/60/30`, `60/30/7`, `30/7/1`, or `Custom` |
| **Annual Value / Annual Cost** | [Optional] | MSP: annual value of this contract. Internal IT: annual cost |
| **Notes** | [Optional] | Free-text notes |

**Notes:**
- `Covered Record Reference` is the linking field for Support Coverage records. It must match the `License Reference` or `Hardware Reference` value in the corresponding sheet.
- A support coverage row with `Contract Type = Support Coverage` and a valid `Covered Record Reference` will be linked to the covered record in the Relationships tab after import.
- General commercial contracts (MSAs, NDAs, SaaS agreements) do not require a `Covered Record Reference`. Leave it blank for standalone contracts.
- `End Date` is required because it drives expiration tracking for all contracts. A contract without an End Date will have status `Pending date`.

---

## 10. Documents Sheet

One row per document record. This sheet stores metadata about documents — the actual file must be uploaded separately through the Opriva Documents module after import.

| Column | Status | Description |
|---|---|---|
| **Document Reference** | [Required] | Short unique identifier (e.g. `DOC-001`) |
| **Package Reference** | [Optional] | Links this document to a parent Renewal Package — must match a value in the Renewal Packages sheet |
| **Linked Record Reference** | [Optional] | The `License Reference`, `Hardware Reference`, or `Contract Reference` of the specific record this document is attached to |
| **Document Name** | [Required] | Name of the document (e.g. "Banisi TM Entitlement Certificate 2026") |
| **Document Type** | [Required] | One of: `Vendor Quote`, `Client Proposal`, `Purchase Order`, `Invoice`, `License Entitlement`, `Signed Contract`, `Warranty Document`, `Support Evidence`, `Compliance Evidence`, `Legal Document`, `Other` |
| **File Name** | [Optional] | Original filename including extension (e.g. `TM-LICENSE-MI0008223.pdf`) |
| **Uploaded By** | [Optional] | The person who uploaded or prepared this document |
| **Notes** | [Optional] | Free-text notes |

**Notes:**
- The Documents sheet imports document metadata only. The actual files must be uploaded through the Opriva Documents module or the Documents tab of the linked record after import.
- A document can be linked to both a Package (via `Package Reference`) and a specific record (via `Linked Record Reference`) simultaneously. This is correct — one License Entitlement PDF may cover an entire renewal package and all its individual license records.
- `Document Type` must match exactly one of the approved types listed above. Use **License Entitlement** for any vendor-issued proof of purchased software rights (license certificates, entitlement documents, licensing confirmations).

---

## 11. Tasks Sheet

One row per task. Tasks are linked to records in other modules via the `Linked Record Reference` column.

| Column | Status | Description |
|---|---|---|
| **Task Reference** | [Required] | Short unique identifier (e.g. `TSK-001`) |
| **Linked Record Reference** | [Optional] | The `License Reference`, `Hardware Reference`, or `Contract Reference` of the record this task relates to |
| **Task Title** | [Required] | Short description of the action (e.g. "Request renewal quote from LOL Panama") |
| **Task Type** | [Optional] | `Quote Request`, `Document Request`, `Renewal Follow-up`, `Owner Assignment`, `Approval Request`, `Client Follow-up`, `Other` |
| **Owner** | [Optional] | The person responsible for completing this task |
| **Due Date** | [Optional] | Target completion date (`YYYY-MM-DD`) |
| **Priority** | [Optional] | `Critical`, `High`, `Medium`, `Low` |
| **Status** | [Optional] | `Open`, `In Progress`, `Waiting`, `Done` — use only if pre-filling existing task states |
| **Notes** | [Optional] | Free-text notes or context |

**Notes:**
- Tasks linked to records via `Linked Record Reference` will appear in the Tasks tab of that record's drawer after import, in addition to the global Tasks module.
- If `Status` is left blank, Opriva sets the status to `Open` by default.
- Tasks without a `Linked Record Reference` are created as standalone tasks in the Tasks module.

---

## 12. Custom Fields Sheet

The Custom Fields sheet allows customers to import additional field values that do not fit any standard column in the core sheets. Each row defines one custom field value for one record.

| Column | Status | Description |
|---|---|---|
| **Module** | [Required] | The module the record belongs to: `Licenses`, `Hardware`, `Contracts`, `Documents`, `Tasks`, `Clients / Departments`, `Renewal Packages` |
| **Record Reference** | [Required] | The Reference value from the corresponding module sheet (e.g. `LIC-001`) |
| **Field Name** | [Required] | The name of the custom field (e.g. "TM Program Number") |
| **Field Type** | [Required] | `Text`, `Number`, `Date`, `Dropdown`, `Currency`, `Checkbox`, `URL`, `Long Text` |
| **Value** | [Required] | The field value for this record |
| **Notes** | [Optional] | Free-text notes |

**Notes:**
- Custom fields defined here must not duplicate any standard column that already exists in the relevant sheet. For example, do not create a custom field called "Expiration Date" for a License row — use the `Expiration / Renewal Date` column in the Licenses sheet instead.
- Custom fields are imported and stored on the record. They are visible in the record drawer but do not affect System Status, alert logic, expiration calculations, or margin calculations.
- Custom fields must not be used to import calculated values (Status, Margin, Days to Expiration, Risk, etc.).
- Use the Custom Fields sheet for vendor-specific reference IDs (e.g. TM Program Number, TM Reference Number), customer-internal tracking codes, or other business data that does not fit a standard field.

---

## 13. Fields Opriva Should Not Ask Users to Fill

The following fields are **calculated, derived, or generated by Opriva**. They must never appear as fillable columns in the template and must never be requested from the user during import.

| Field | Derived from | Where it appears |
|---|---|---|
| **System Status** | Expiration / Renewal Date + Alert Policy | License, Hardware, Contract table columns |
| **Days to Expiration** | Expiration Date vs. today | License table, Hardware table, Dashboard |
| **Risk** | Calculated from expiration proximity, coverage gaps, ownership gaps | Attention Center, Dashboard |
| **Margin $** | Sale Price (Annual Value) − Vendor Cost | License table *(MSP only)* |
| **Margin %** | Margin $ ÷ Sale Price | License table *(MSP only)* |
| **Renewal Stage** | Workflow events and user actions | Renewal workflow *(Phase 2)* |
| **Missing Evidence** | Document policy engine + attached documents | Attention Center *(Phase 2)* |
| **Validity Status** | Document policy + document dates | Documents tab *(Phase 2)* |
| **Alert Status** | Alert Policy threshold vs. today | Record drawer, Dashboard |

If any of these values appear in a source file being imported via Path A (AI-assisted), Opriva's AI should flag them as `Calculated — recommend skip` during the column-mapping step.

---

## 14. Validation Rules

### 14.1 Required field validation

The following fields are required per module. Import preview must flag rows that are missing required values.

| Module | Required fields |
|---|---|
| **Clients / Departments** | Record Type, Name |
| **Renewal Packages** | Package Reference, Package Name, Client / Department |
| **Licenses** | License Reference, Client / Department, License / Product, Expiration / Renewal Date |
| **Hardware** | Hardware Reference, Client / Department, Asset Name |
| **Contracts / Support Coverage** | Contract Reference, Contract / Coverage Name, Contract Type, Client / Department, End Date |
| **Documents** | Document Reference, Document Name, Document Type |
| **Tasks** | Task Reference, Task Title |
| **Custom Fields** | Module, Record Reference, Field Name, Field Type, Value |

### 14.2 Reference validation

| Validation | Rule |
|---|---|
| **Package Reference must exist** | Any row in Licenses, Hardware, Contracts, or Documents that includes a Package Reference must match a Package Reference defined in the Renewal Packages sheet |
| **Covered Record Reference must exist** | A Contracts / Support Coverage row with a Covered Record Reference must match a License Reference or Hardware Reference defined in the corresponding sheet |
| **Linked Record Reference must exist** | A Documents or Tasks row with a Linked Record Reference must match a reference in Licenses, Hardware, or Contracts |
| **Client / Department must exist** | Client / Department values in all sheets must match a Name defined in the Clients / Departments sheet |
| **Duplicate references** | Two rows in the same sheet must not share the same Reference value |

### 14.3 Date validation

All dates must be in `YYYY-MM-DD` format. Opriva must reject rows with unparseable date values and highlight them in the import preview.

### 14.4 Controlled vocabulary validation

The following columns accept only the listed values:

| Column | Accepted values |
|---|---|
| **Record Type** | `Client`, `Department` |
| **Alert Policy** | `Workspace default`, `90/60/30`, `60/30/7`, `30/7/1`, `Custom` |
| **Document Type** | `Vendor Quote`, `Client Proposal`, `Purchase Order`, `Invoice`, `License Entitlement`, `Signed Contract`, `Warranty Document`, `Support Evidence`, `Compliance Evidence`, `Legal Document`, `Other` |
| **Contract Type** | `Support Coverage`, `Maintenance Agreement`, `SLA`, `MSA`, `NDA`, `Service Contract`, `Hardware Contract`, `License Agreement`, `Other` |
| **Coverage Type** | `Manufacturer Support`, `Manufacturer Warranty`, `Extended Warranty`, `Managed Support`, `SLA Coverage`, `Care Pack`, `Other` |
| **Priority** | `Critical`, `High`, `Medium`, `Low` |
| **Status** *(Tasks)* | `Open`, `In Progress`, `Waiting`, `Done` |
| **Field Type** *(Custom Fields)* | `Text`, `Number`, `Date`, `Dropdown`, `Currency`, `Checkbox`, `URL`, `Long Text` |

Values not in the accepted list must be flagged in the import preview and rejected unless the user maps them to an accepted value.

### 14.5 Import preview requirement

Every import — including template uploads — must produce a **preview step** before records are committed. The preview must show:

- Total rows detected per sheet
- Rows that will be created (valid)
- Rows flagged with validation errors (missing required field, broken reference, invalid date, unknown controlled value)
- A summary of what records will be created in each module

Users must confirm the preview before records are written.

---

## 15. Future Excel Template Generation

When Opriva implements template download (Phase 2), the system should generate a tailored template workbook for each workspace based on:

### 15.1 Workspace mode

| Mode | Template behavior |
|---|---|
| MSP / Integrator | Include Clients sheet. Include Distributor, Annual Value, Vendor Cost columns in Licenses. Exclude Internal IT-only fields (Cost Center, Approval Status, Business Criticality). |
| Internal IT | Include Departments sheet instead of Clients. Include Cost Center, Approval Status, Business Criticality in Licenses. Exclude MSP-only fields (Vendor Cost, Margin). |
| Hybrid | Include all columns with mode annotations. |

### 15.2 Enabled modules

If a workspace has disabled a module (e.g. Hardware is not in use), that sheet should be omitted from the generated template.

### 15.3 Custom fields

If the workspace has defined custom fields for any module, add those columns to the appropriate sheet (after the standard columns) with `[Custom]` annotations in the header.

### 15.4 Pre-filled values

Where possible, the generated template should pre-fill:
- Workspace-level alert policy as the default for all Alert Policy columns
- Approved document types in a dropdown for the Document Type column
- Approved contract types in a dropdown for the Contract Type column
- Controlled vocabulary columns should use Excel data validation dropdowns

### 15.5 Instructions sheet personalization

The Instructions sheet in the generated template should include:
- The workspace name and mode
- The workspace-specific date format setting
- The workspace-specific terminology (Client vs. Department, Annual Value vs. Annual Cost, etc.)
- A section listing all enabled modules and which sheets to fill

### 15.6 Download entry point

Template download should be available from:
1. **Data Import** → "Download Opriva Template" button (primary)
2. **Settings → Company → Import Templates** (admin-level template management)

### 15.7 Template recognition on upload

When a customer uploads a file for import, Opriva should detect whether it is an Official Opriva Template by checking for:
- The presence of the recognized sheet names in the correct order
- A template version marker in the Instructions sheet
- The column header structure matching the canonical template

If recognized as an Official Template, Opriva bypasses the AI column-mapping step and goes directly to the import preview.

---

## Appendix A — Reference Naming Convention

Customers may use any naming scheme for references, but the following conventions are recommended for clarity:

| Reference type | Suggested format | Example |
|---|---|---|
| Package Reference | `PKG-NNN` or vendor PO number | `PKG-001`, `TRM-STD-966300` |
| License Reference | `LIC-NNN` | `LIC-001`, `LIC-002` |
| Hardware Reference | `HW-NNN` | `HW-001` |
| Contract Reference | `CTR-NNN` or `COV-NNN` | `CTR-001`, `COV-001` |
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
    │              Import preview
    │                   ↓
    │              Records created
    │
    └── Official Opriva Template (.xlsx)
            │
            └──▶  Path B: Template Import
                        ↓
                   Template recognized automatically
                        ↓
                   Validation against canonical model
                        ↓
                   Import preview (errors highlighted)
                        ↓
                   Records created
```

Both paths produce the same result: Opriva canonical records. Path B skips the mapping step because the data is already in Opriva's structure.
