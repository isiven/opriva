# Trend Micro Import Mapping — Opriva

**Purpose:** Define how Trend Micro renewal data from Nextcom's commercial records should be modeled in Opriva.
**Workspace context:** MSP / Integrator (Nextcom MSP Workspace).
**Source files analyzed:**
- `Datos.xlsx` — Nextcom commercial renewal register (26 deal rows, 11 columns)
- `TM LICENSE -MI0008223.pdf` — Trend Micro Entitlement Certificate for Banisi (6 product pages, single order)

**Scope:** This document covers field mapping, data structure decisions, support modeling, and import recommendations for MVP and Phase 2. It does not define application code or implementation logic.

---

## 1. Excel Row → Renewal Package / Deal

### What each Excel row represents

Each row in `Datos.xlsx` represents one commercial deal: a single order placed by Nextcom on behalf of one end client for one Trend Micro renewal or new purchase cycle. A deal may cover multiple product SKUs, but appears as a single line in the register with a combined license count and total amount.

In Opriva, each Excel row maps to a **Renewal Package** — a commercial container that groups one client's licenses, documents, and tasks under a single order reference.

---

### Column mapping

| Excel Column | Sample Value | Opriva Field | Notes |
|---|---|---|---|
| `# Registro` | `DR-0020718` | **Package ID / Reference** | Nextcom's internal record number. Prefix `NR-` = new/renewal registration; `DR-` = deal registration. Store as a reference field on the package. |
| `# OC` | `0008317` | **Nextcom Order Number** | Nextcom's internal purchase order number. Store as a secondary reference. |
| `OC Partner` | `TRM-STD-966300` | **Trend Micro PO Number** | The Trend Micro-issued PO or program reference. **This is the primary join key to the PDF Entitlement Certificate** (matches the `PO Number` field on every page of the PDF). For MSP-type codes (e.g., `MSP 2026-04`), this represents an internal Nextcom managed service cycle — no external entitlement PDF. |
| `Cliente` | `Banisi` | **Client** | The end customer. Maps directly to the Opriva Client field. |
| `# Legal de Fac.` | *(blank in sample)* | **Distributor Invoice Number** | The legal invoice number issued by the distributor. Blank in current sample — populate when available. Store as a reference field on the package. |
| `Reventa` | `NEXTCOM SYSTEMS INC.` | **Reseller** (implicit) | Always Nextcom — the workspace operator. Not a separate Opriva field; it is the workspace identity. |
| `Distribuidor` | `LOL Panama` | **Distributor** | The upstream wholesaler. Maps to the Opriva Distributor field. Two distributors observed in data: `LOL Panama` and `TD SYNNEX Panama`. |
| `Licencias` | `2135` | **Quantity / Seats** | The primary license count for the deal. For multi-SKU deals, this typically reflects the base platform license count (e.g., Trend Vision One Credits), not the sum of all SKU volumes. See Section 2 note on volume discrepancy. |
| `Vencimiento Licencia` | `2026-05-29` | **Expiration / Renewal Date** | The license expiration date. Drives status calculation and alert triggering in Opriva. |
| `Fecha factura` | `2026-04-24` | **Invoice Date** | The date Nextcom invoiced the client. Not an Opriva renewal field — store as metadata or in a Notes / custom field. |
| `Monto Total` | `12857.51` | **Annual Value (Sale Price)** | Total deal amount in USD charged by Nextcom. Maps to the Opriva Annual Value / Sale Price field. This represents Nextcom's revenue from the client for this renewal cycle. |

---

### Observed data patterns

- **Distributor split:** Most deals route through `LOL Panama`. A subset routes through `TD SYNNEX Panama` (rows with `DR-` prefix, e.g., CELMEC S.A., ASSA first order). Both are valid Distributor values in Opriva.
- **MSP self-renewing rows:** Rows where `Cliente = NEXTCOM SYSTEMS INC` and `OC Partner = MSP 2026-XX` are Nextcom's own managed service seat pool — not external client deals. These should be modeled as internal packages or excluded from client-facing renewal views.
- **`# Legal de Fac.` is empty in all current rows.** This field will be important once distributors issue formal invoices — it should be captured as a reference on the package for audit traceability.
- **Vendor Cost is absent from the Excel.** The `Monto Total` represents the sale price to the client (Annual Value). Vendor cost (what Nextcom paid the distributor) is not present in this data set. Margin cannot be calculated until vendor cost is provided separately.

---

## 2. PDF Pages → License Line Items

### What each PDF page represents

The Trend Micro Entitlement Certificate PDF (`TM LICENSE -MI0008223.pdf`) contains **one certificate page per product SKU purchased** within the same order. All pages in a single PDF share the same customer, reseller, program number, reference number, PO number, order type, start date, and end date. Only the product name, SKU, and volume vary per page.

In Opriva, each PDF page maps to one **License record** linked to the parent Renewal Package.

---

### Observed license line items (Banisi — TRM-STD-966300)

All 6 pages share: Customer = Banisi · Customer No. 55516 · Reseller = NEXTCOM SYSTEMS INC. · TM Program = TM-M00000008286 · TM Reference = MO0008317 · PO = TRM-STD-966300 · Order Type = New Purchase · Start = 05/30/25 · End = 05/29/26

| Page | Product Name | SKU | Volume |
|---|---|---|---|
| 1 | Trend Vision One Credits Normal 1+ Credits New | VONN0000 | 2,135 |
| 2 | Trend Vision One Email and Collaboration Security - Core Normal 1-250 Users New | VONN0186 | 200 |
| 3 | Trend Vision One - Cyber Risk Exposure Management - Cloud Risk Management 1001-1500 Resources New | VONN0305 | 2 |
| 4 | Trend Vision One - Endpoint Security (Core) Normal 251-500 Devices New | VONN0035 | 25 |
| 5 | Trend Vision One - Endpoint Security (Pro) Normal 51-250 Devices New | VONN0052 | 15 |
| 6 | Trend Vision One - Cyber Risk Exposure Management - Core Normal 251-500 New | VONN0161 | 40 |

---

### PDF field mapping to Opriva License record

| PDF Field | Sample Value | Opriva Field | Notes |
|---|---|---|---|
| Product Name (page header) | `Trend Vision One - Endpoint Security (Core) Normal 251-500 Devices New` | **License / Product** | The full Trend Micro product name including tier and volume band. Use as the License name in Opriva. |
| `Customer Name` | `Banisi` | **Client** | Matches the Excel `Cliente` field. Confirms the client association. |
| `Customer No.` | `55516` | **Client Reference** | Trend Micro's internal customer number. Store as a reference field on the license or client record. |
| `Reseller Name` | `NEXTCOM SYSTEMS INC.` | **Reseller** (implicit) | The workspace operator. Not stored as a separate field. |
| `SKU` | `VONN0035` | **SKU / Part Number** | The Trend Micro product SKU. Store as a reference field on the license record. Useful for matching entitlements and identifying duplicates. |
| `TM Program Number` | `TM-M00000008286` | **Program Reference** | Trend Micro's program or agreement identifier. Store as a reference field. May be shared across multiple orders for the same client. |
| `TM Reference Number` | `MO0008317` | **TM Order Reference** | Trend Micro's order reference number. Store as a reference field. |
| `PO Number` | `TRM-STD-966300` | **Trend Micro PO Number** | **Primary join key to Excel `OC Partner`.** This field links the PDF back to the correct Excel deal row. Always use this to associate a PDF to its package. |
| `Order Type` | `New Purchase` | **Order Type** | Indicates whether this is a new purchase or a renewal. Useful for understanding the renewal history and flagging first-purchase deals with no prior expiration. |
| `Volume` | `25` | **Quantity / Seats** | The seat, device, or resource count for this specific SKU. Each license line item has its own volume. |
| `Start Date` | `05/30/25` | **License Start Date** | The date protection/entitlement began. Store as a reference field or activation date. |
| `End Date` | `05/29/26` | **Expiration / Renewal Date** | The date this entitlement expires. Drives status calculation in Opriva. Should match `Vencimiento Licencia` in the Excel. |

---

### Volume discrepancy note

The Excel `Licencias` column for the Banisi row shows **2,135**. The PDF contains 6 SKUs with volumes 2135 + 200 + 2 + 25 + 15 + 40. These are not additive: the 2,135 credits (VONN0000) are the platform-level Trend Vision One credit pool. The other SKUs are product add-ons with independent volume counts. The Excel `Licencias` field reflects the base platform license count, not the total sum of all SKU volumes. Opriva should store each SKU volume individually on its license record, not aggregate them.

---

## 3. PDF File → License Entitlement Document

### One PDF, multiple licenses

A single Trend Micro Entitlement Certificate PDF covers the full scope of one order. In practice, this means one PDF file proves the entitlement for all license line items purchased in that order — regardless of how many products or SKUs are included.

In Opriva, the PDF is stored as a **single License Entitlement document** and linked to:
- The **Renewal Package** that represents the order
- Each **License record** that was extracted from the PDF pages

This means one License Entitlement document may appear in the Documents tab of multiple License records simultaneously. This is intentional and correct — the document is the source of truth for the entire order.

### Document record fields

| Field | Value |
|---|---|
| Document Name | `TM LICENSE -MI0008223` (or the PDF filename) |
| Document Type | **License Entitlement** |
| Linked Record | Renewal Package (e.g., `Banisi — TRM-STD-966300`) |
| Uploaded By | The Nextcom user who imported the file |
| Notes | Reference the TM Program Number and TM Reference Number for traceability |

The document should also be cross-linked to each individual License record created from the PDF pages. In MVP this linking is done manually. In Phase 2 it is automated.

---

## 4. Package Structure

The following hierarchy describes how Trend Micro renewal data maps to Opriva records for a client deal.

```
Client (e.g., Banisi)
└── Renewal Package
    │   # Registro: DR-0020718
    │   # OC: 0008317
    │   OC Partner / TM PO: TRM-STD-966300
    │   Distributor: LOL Panama
    │   Invoice Date: 2026-04-24
    │   Annual Value: $12,857.51
    │   Expiration: 2026-05-29
    │
    ├── License Line Items (one per PDF page / SKU)
    │   ├── Trend Vision One Credits — SKU VONN0000 — 2,135 credits — exp. 2026-05-29
    │   ├── Trend Vision One Email and Collaboration Security - Core — SKU VONN0186 — 200 users — exp. 2026-05-29
    │   ├── Trend Vision One CREM Cloud Risk Management — SKU VONN0305 — 2 resources — exp. 2026-05-29
    │   ├── Trend Vision One Endpoint Security (Core) — SKU VONN0035 — 25 devices — exp. 2026-05-29
    │   ├── Trend Vision One Endpoint Security (Pro) — SKU VONN0052 — 15 devices — exp. 2026-05-29
    │   └── Trend Vision One CREM Core — SKU VONN0161 — 40 users — exp. 2026-05-29
    │
    ├── Documents
    │   └── License Entitlement — TM LICENSE -MI0008223.pdf
    │       └── Linked to: Package + all 6 License records
    │
    ├── Support Coverage (if applicable)
    │   ├── Trend Micro Manufacturer Support — included / derived from active maintenance
    │   └── Nextcom Managed Support / SLA — separate Support Coverage contract (see Section 5)
    │
    ├── Tasks
    │   ├── (e.g.) Request renewal quote from LOL Panama
    │   ├── (e.g.) Confirm client PO before TRM-STD-966300 expiry
    │   └── (e.g.) Upload renewed entitlement certificate after order completion
    │
    └── Activity
        └── (Phase 2) Log of status changes, document uploads, task completions, owner assignments
```

---

## 5. Support Logic for Trend Micro

### Manufacturer support included with active maintenance

Trend Micro business products with active maintenance automatically include access to Trend Micro customer support. This is stated on every Entitlement Certificate page:

> *"Trend Micro business products with active maintenance include access to Trend Micro customer support during regular business hours and after-hours access for critical issues."*

**Opriva modeling decision:**

This included support should be represented as an **included support coverage** record, derived from the license expiration date. It is not a separate contract — it expires when the license expires.

- **Coverage Name:** `Trend Micro Manufacturer Support — [Product Name]`
- **Coverage Type:** Manufacturer Support
- **Provider:** Trend Micro
- **Coverage End Date:** Same as the license Expiration / Renewal Date
- **Notes:** Included with active maintenance. Access via https://success.trendmicro.com/en-US/contactus/

For MVP, this can be entered manually as support coverage linked to each license record via the Relationships tab → Add support coverage. In Phase 2 it can be inferred automatically from the license record's active maintenance status.

---

### Nextcom managed support / SLA (separate coverage)

If Nextcom provides its own managed support service or SLA on top of the Trend Micro entitlement — for example, a Nextcom-branded managed detection and response service, a dedicated support tier, or a service contract with a separate expiry and renewal — this must be modeled as a **separate Support Coverage contract** in Opriva.

Nextcom managed support is **not** the same as Trend Micro manufacturer support. It is an independent commercial obligation between Nextcom and the client, with its own:

- Renewal date (may differ from the Trend Micro license expiry)
- Provider (Nextcom, not Trend Micro)
- Coverage owner (the Nextcom account manager)
- Annual value (Nextcom's service fee)
- Alert policy (independent renewal timeline)

**Opriva modeling decision:**

Model Nextcom managed support as:

- **Coverage Name:** `Nextcom Managed Support — [Client Name]`
- **Coverage Type:** Managed Support / SLA
- **Provider:** Nextcom Systems Inc.
- **Coverage End Date:** Per the Nextcom service agreement
- **Coverage Owner:** The responsible Nextcom account manager
- **Annual Value:** Nextcom's service charge (if applicable)
- **Linked to:** The primary License or Renewal Package for the client

This record will appear in the Contracts module as a Support Coverage contract and in the originating license or package Relationships tab.

---

### Support coverage decision tree

| Scenario | Model as |
|---|---|
| Trend Micro license is active → manufacturer support is included | License-linked Support Coverage: Provider = Trend Micro, End Date = license expiry. Included / derived. |
| Trend Micro license expires → manufacturer support ends | Support Coverage status becomes Expired automatically in Opriva. |
| Nextcom provides a managed support or SLA contract | Separate Support Coverage record: Provider = Nextcom, independent end date and value. |
| Both manufacturer support and Nextcom SLA are active | Two separate Support Coverage records linked to the same license. |

---

## 6. MVP Import Recommendation

For the current MVP, import is manual. The following procedure should be followed per client deal.

### Step 1 — Create the Renewal Package

In Opriva Licenses (or a future Packages module), create a record representing the deal:

1. Go to **Licenses → New license**
2. Set License / Product to the deal name (e.g., `Banisi — TRM-STD-966300 — Trend Vision One`)
3. Set Client to the client name (e.g., `Banisi`)
4. Set Distributor to the upstream wholesaler (e.g., `LOL Panama`)
5. Set Expiration / Renewal Date from `Vencimiento Licencia`
6. Set Annual Value from `Monto Total`
7. Set Quantity / Seats from `Licencias` (base platform count)
8. Save — record drawer opens

In the record drawer notes or a custom field, store:
- `# Registro` (e.g., DR-0020718)
- `# OC` (e.g., 0008317)
- `OC Partner / TM PO` (e.g., TRM-STD-966300)
- `Fecha factura` (invoice date)

### Step 2 — Create individual License line items

For each page of the Entitlement Certificate PDF, create a License record:

1. Go to **Licenses → New license**
2. Set License / Product to the full product name from the PDF page header
3. Set Client to the same client
4. Set Distributor to the same distributor
5. Set Expiration / Renewal Date from `End Date`
6. Set Quantity / Seats from `Volume`
7. In the record drawer, add a note linking this record to the parent package (by `# Registro` or `OC Partner`)

Repeat for each SKU page in the PDF.

### Step 3 — Attach the License Entitlement document

1. From the parent package record drawer → **Documents tab → Attach document**
2. Set Document Name to the PDF filename (e.g., `TM LICENSE -MI0008223`)
3. Set Document Type to **License Entitlement**
4. Set Uploaded By to the responsible Nextcom user
5. Click **Attach document**

Then repeat the attachment for each individual License line item record that the PDF covers.

> **MVP limitation:** File content is stored as metadata only (filename + type). The actual PDF is not uploaded to a server in the current MVP.

### Step 4 — Add Trend Micro manufacturer support coverage

On each License line item:

1. Open the record → **Relationships tab → Add support coverage**
2. Set Support / Coverage Name: `Trend Micro Manufacturer Support`
3. Set Coverage Type: `Manufacturer Support`
4. Set Provider: `Trend Micro`
5. Set Coverage End Date: same as the license Expiration / Renewal Date
6. Set Alert Policy: match the parent license alert policy
7. Save coverage

### Step 5 — Add Nextcom SLA (if applicable)

If a Nextcom managed support contract exists for this client:

1. From the primary package or a relevant license record → Relationships tab → Add support coverage
2. Set provider to Nextcom, end date per Nextcom's agreement, owner to the account manager
3. Save coverage — record appears in Contracts module as a separate Support Coverage entry

### Step 6 — Create tasks

From the package or individual license records → **Tasks tab → New task**:

- Suggested tasks at renewal time:
  - Request renewal quote from distributor
  - Confirm client purchase order before expiry
  - Upload renewed Entitlement Certificate after order is placed
  - Verify new license volume matches previous entitlement

---

## 7. Phase 2 — Automated Import Recommendations

The following capabilities are deferred and should not be implemented in the current MVP.

### Automatic PDF parsing

- Parse each page of a Trend Micro Entitlement Certificate PDF and extract all fields: Customer Name, Customer No., Reseller Name, SKU, TM Program Number, TM Reference Number, PO Number, Order Type, Volume, Start Date, End Date, and product name.
- Generate one draft License record per PDF page.
- Present a confirmation UI before committing records to the workspace.

### Match PDF PO Number to Excel OC Partner

- When a PDF is uploaded and an Excel (or CSV) is imported in the same batch, automatically match `PO Number` (PDF) to `OC Partner` (Excel) to link the entitlement certificate to the correct commercial deal row.
- If a match is found, create or confirm the Renewal Package and attach the PDF as a License Entitlement document linked to both the package and all derived License records.
- If no match is found, flag as an unmatched entitlement in the Attention Center.

### Create License line items automatically

- For each matched PDF page, create a License record pre-filled from the PDF fields.
- Set all shared fields (Client, Distributor, Start Date, End Date, Alert Policy) from the matched Excel row.
- Set per-record fields (Product, SKU, Volume) from the individual PDF page.

### Detect missing entitlements

- After import, cross-check: does every License record in a package have at least one attached License Entitlement document?
- Surface missing entitlements in the Attention Center as a documentation gap.

### Detect volume mismatches

- Compare the Excel `Licencias` value against the sum or primary volume figure from the matched PDF.
- If there is a discrepancy (e.g., Excel shows 2,135 but PDF credits volume is 2,100), flag as a volume mismatch risk.
- Surface in the Attention Center with severity: Medium.

### Detect upcoming renewals

- After import, calculate days-to-expiration for all imported packages.
- Apply the workspace default Alert Policy to any record that does not have an explicit policy set.
- Surface records in the expiring-soon window in the Dashboard and Attention Center.

### Suggest tasks automatically

- After a package is created from import, suggest a default task set appropriate for the deal:
  - If Order Type = New Purchase: suggest activation confirmation task and initial document upload task.
  - If Order Type = Renewal: suggest renewal quote request task and license verification task.
  - If expiry < 60 days from import date: suggest urgent renewal escalation task.
- Present suggested tasks as a review step before committing to the workspace.

---

## 8. Source File Reference Summary

### Datos.xlsx — Nextcom Commercial Renewal Register

| Property | Value |
|---|---|
| File | `Datos.xlsx` |
| Sheet | `Sheet 1` |
| Rows | 26 data rows (1 header) |
| Columns | 11 |
| Primary key | `# Registro` |
| Join key to PDF | `OC Partner` = `PO Number` on PDF |
| Distributor values observed | `LOL Panama`, `TD SYNNEX Panama` |
| Clients observed (sample) | Banisi, MultiBank, ASSA, Credicorp Bank, OMC Group, Petroleos Delta S.A., COOPEVE R.L., JVCKENWOOD Latin America, Cuernavaca Business, Yamaha Music Latin America, and others |

### TM LICENSE -MI0008223.pdf — Trend Micro Entitlement Certificate

| Property | Value |
|---|---|
| File | `TM LICENSE -MI0008223.pdf` |
| Pages | 6 (one per product SKU) |
| Customer | Banisi (Customer No. 55516) |
| Reseller | NEXTCOM SYSTEMS INC. |
| TM Program Number | TM-M00000008286 |
| TM Reference Number | MO0008317 |
| PO Number | TRM-STD-966300 (matches Excel `OC Partner` for Banisi row) |
| Order Type | New Purchase |
| Coverage Period | 05/30/2025 – 05/29/2026 |
| Products covered | 6 SKUs (VONN0000, VONN0186, VONN0305, VONN0035, VONN0052, VONN0161) |

---

*No application code was modified to produce this document.*
*Sources used: MEMORY.md, USER_GUIDE.md, AI_KNOWLEDGE_BASE.md, Datos.xlsx, TM LICENSE -MI0008223.pdf.*
