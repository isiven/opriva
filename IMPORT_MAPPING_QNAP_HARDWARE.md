# QNAP Hardware Import Mapping — Opriva

**Purpose:** Define how Nextcom's QNAP hardware sales data maps into Opriva's hardware module and related records.
**Important:** QNAP is a real-world example. The patterns documented here — grouped customers, main asset + component rows, embedded warranty text, multi-serial fields, invoice references — apply to any hardware or equipment sales export regardless of vendor.
**Workspace context:** MSP / Integrator (Nextcom MSP Workspace).
**Source file analyzed:** `Ventas por Clase Qnap 2025-2026.xlsx`
**Detailed universal import philosophy:** `MEMORY.md §19`, `IMPORT_MAPPING_TREND_MICRO.md`

> **File storage:** Real customer files should be stored under `private-samples/` and excluded from Git. Anonymized demo files may be stored under `sample-data/`.

---

## 1. Source File Overview

**File:** `Ventas por Clase Qnap 2025-2026.xlsx`
**Sheet:** `QNAP`
**Rows:** 99 (including 3 report header rows, 13 customer group headers, data rows, and 1 report footer)
**Columns:** 12
**Period:** January 1, 2025 – April 7, 2026
**Issuer:** Nextcom Systems, Inc.

### Detected columns

| Column | Sample value |
|---|---|
| `Cliente` | `Hormigon, S.A.` / `Unigreen Marine, S.A` |
| `Clase de artículo` | `Equipos Qnap` / `Discos` / `Riel` / `Tarjeta de expansion de red` |
| `Fecha de la transacción` | `2026-01-17` |
| `Tipo de transacción` | `Factura` |
| `Número` | `FE-0000001039` |
| `Nombre completo del producto/servicio` | `Qnap:TS-h1887XU-RP-E2336-32G-US` |
| `Nota/descripción` | `QNAP NAS ... Garantía de hardware QNAP 3 años ...` |
| `Cantidad` | `1` / `10` / `16` |
| `Serial` | `QNEX508656W` or multi-line `s75bnl0x731397\ns75bnl0x731412\n...` |
| `Notas` | `Según Orden de Compra No. 4000003626` / `25% para iniciar...` |
| `Recibido Por` | `Alcides Martinez de Sedas` |
| `Año Aproximado de lanzamiento del equipo` | `2021–2022` / `2023` |

### Observed `Clase de artículo` values

| Value | Meaning |
|---|---|
| `Equipos Qnap` | Main QNAP hardware unit (NAS, JBOD expansion, etc.) |
| `Discos` | Hard drives or SSDs installed in the unit |
| `Riel` | Rack rail kit |
| `Tarjeta de expansion de red` | Network expansion card (PCIe) |
| *(blank)* | Accessory or component row with no class assigned |

---

## 2. Source Structure

The file is a Nextcom sales detail report for QNAP equipment, grouped by customer.

### Row types

The spreadsheet contains four distinct row types that must be treated differently during import:

**1. Report header rows (rows 1–3)** — contain the report title, company name, and date range. Not data. Always exclude.

**2. Customer group header rows** — a row where `Cliente` has a value and all other columns are null. This row signals the start of a new customer group. There are 13 customers in the file.

**3. Data rows — main hardware** — `Clase de artículo = 'Equipos Qnap'`. These rows have a transaction date, invoice number, full product name, description, serial, and received-by. These are the primary Hardware records.

**4. Data rows — components and accessories** — `Clase de artículo` is `Discos`, `Riel`, `Tarjeta de expansion de red`, or blank. These rows represent items sold as part of the same invoice as the main hardware unit. They do not have their own transaction date, invoice number, or customer — they inherit these from the most recent main hardware row or customer group header above them.

### Key structural observations

- A single customer may have multiple invoices (e.g., Elektra Noreste has two separate `Equipos Qnap` rows under two different invoice numbers).
- Component rows typically follow their parent hardware row with no customer or invoice of their own — the context must be carried down from the parent.
- Some rows have `Clase de artículo` blank but contain valid product data — they are treated as unnamed components.
- The last row (`Cash Basis Tuesday, 07 April 2026...`) is a QuickBooks report footer. It must be excluded.
- `Notas` often contains payment terms (e.g., `25% para iniciar la compra del equipo, 25% cuando llegue el equipo, 50% al terminar con la implementación`) or formal PO references (e.g., `Según Solped No. 5020037675 y Orden de Compra No. 4000003626`). Payment terms are metadata; PO references are business-relevant.
- `Nota/descripción` often embeds warranty text (e.g., `Garantía de hardware QNAP 3 años`, `Garantía: 3 AÑOS`, `Garantía: 1 Años`). This is the primary warranty signal in the file.

---

## 3. Canonical Opriva Mapping

### Column-to-field mapping

| Source Column | Opriva Field | Decision | Notes |
|---|---|---|---|
| `Cliente` | **Client** | Map → canonical field | Customer group header value; inherited by all rows in the group |
| `Clase de artículo` | **Asset / Component Type** | Map → type classifier | Drives whether row creates a Hardware record or a component |
| `Fecha de la transacción` | **Purchase Date / Invoice Date** | Map → metadata / reference | Not the same as warranty expiration — store as reference field |
| `Tipo de transacción` | **Source Transaction Type** | Map → metadata | Always `Factura` in this file — store as reference, skip if all values are identical |
| `Número` | **Invoice / Source Reference** | Map → reference field | The Nextcom invoice number. Important for document linking. |
| `Nombre completo del producto/servicio` | **Asset Name / Model** | Map → canonical field | Format is `Brand:Model`. Split on `:` to extract Brand and Model separately |
| `Nota/descripción` | **Description + Warranty signal** | Map → Notes; also parse for warranty | Contains specs, PO references, and embedded warranty terms — partially maps to Notes, partially drives Support Coverage creation |
| `Cantidad` | **Quantity** | Map → canonical field | Use to validate against serial count |
| `Serial` | **Serial Number(s)** | Map → Serial Number; flag if multi-value | May contain one serial or multiple separated by `\n` or spaces. See §7. |
| `Notas` | **Notes / Payment Terms / PO Reference** | Map → Notes | Payment terms go to Notes. PO number (Orden de Compra) is business-relevant metadata. |
| `Recibido Por` | **Owner / Received By** | Map → Owner | The Nextcom account manager or delivery recipient. MSP context: this is the renewal/account owner. |
| `Año Aproximado de lanzamiento del equipo` | **Model Year** | Map → optional metadata | Approximate launch year. Useful for lifecycle intelligence. Store as a metadata or custom field. |

### Fields to skip or downgrade

| Column | Reason |
|---|---|
| `Tipo de transacción` | Always `Factura` in this dataset — no mapping value if uniform. Skip or store as a static default. |
| Payment terms portion of `Notas` | Internal payment milestones (25%/25%/50%). Not part of Opriva's asset model. Store in Notes only. |
| Report header rows (rows 1–3) | Title, company, date range. Not data. Exclude. |
| Report footer row | QuickBooks export artifact. Exclude. |

---

## 4. Hardware Record Logic

### Main hardware rows → Hardware records

Rows where `Clase de artículo = 'Equipos Qnap'` should create **Hardware records** in Opriva.

**Fields populated from the main hardware row:**

| Opriva Hardware Field | Source |
|---|---|
| Asset Name | `Nombre completo del producto/servicio` (model portion after `:`) |
| Brand | `Nombre completo del producto/servicio` (brand portion before `:`) — always QNAP for these rows |
| Type | Derived from model: NAS, JBOD expansion enclosure, rackmount server |
| Model | Full `Nombre completo del producto/servicio` |
| Serial Number | `Serial` (single value or primary serial if multiple) |
| Client | `Cliente` (from customer group header) |
| Owner | `Recibido Por` |
| Purchase Date | `Fecha de la transacción` |
| Invoice Reference | `Número` |
| Description / Notes | `Nota/descripción` (specs and context) |
| Model Year | `Año Aproximado de lanzamiento del equipo` |
| PO Reference | PO number extracted from `Notas` |

### Brand and model parsing

The `Nombre completo del producto/servicio` field uses a `Brand:Model` format for QNAP rows (e.g., `Qnap:TS-h1887XU-RP-E2336-32G-US`). During import, split on `:` to populate Brand = `QNAP` and Model = `TS-h1887XU-RP-E2336-32G-US`.

For generic or third-party products (e.g., `Genérica:CT4000MX500SSD1`), use the full value as the product name and flag Brand as unresolved.

---

## 5. Related Components Logic

### Component rows → linked records or grouped items

Rows where `Clase de artículo` is `Discos`, `Riel`, `Tarjeta de expansion de red`, or blank are component rows. They represent items sold as part of the same deal as the main QNAP hardware unit.

A complete QNAP sale may include:

| Component type | Example |
|---|---|
| Main NAS / storage unit | QNAP TS-h1887XU-RP, TS-h1677AXU-RP |
| Hard drives / SSDs | Samsung MZ-77E1T0, Seagate XS3840SE70045, Crucial CT4000MX500SSD1 |
| Rail kit | QNAP RAIL-B02 |
| Network expansion card | QXG-10G2SF-X710, QXP-820S-B3408 |
| SAS cables | QNAP CAB-SAS30M-8644 |
| RAM modules | Memoria Ram DDR4 |
| PCIe expansion cards | QXP-3X8PES |
| Direct-attach cables | CAB-DAC15M-SFPP |

### Grouping rule

All component rows that follow a main hardware row (before the next main hardware row or customer header) belong to the same sale. They should be grouped under the parent hardware asset.

In Opriva, components can be represented as:

1. **Linked Hardware records** — for individually tracked items (drives with individual serials, expansion cards with their own serials). These are separate Hardware records linked to the parent NAS via the Relationships tab.
2. **Notes on the parent record** — for accessories that don't need individual tracking (rail kits, cables). These can be recorded in the parent hardware's Description / Notes field.
3. **A component list in the package** — stored as a text summary if full individual tracking is not needed.

The user should decide during the mapping step which approach to use. Opriva should present the component rows grouped under the parent and ask: "Create as linked hardware records?" or "Add as notes on the parent asset?"

---

## 6. Warranty / Support Logic

### Warranty embedded in `Nota/descripción`

Warranty information is often embedded in the description field rather than stored in a dedicated column. Observed patterns:

| Embedded text | Meaning |
|---|---|
| `Garantía de hardware QNAP 3 años` | 3-year manufacturer warranty on main unit |
| `Garantía de discos duros SSD 1 año` | 1-year warranty on SSDs |
| `Garantía: 3 AÑOS` | 3-year warranty (from Universidad Tecnológica de Panamá row) |
| `Garantía: 1 Años. Observación: para el hardware y tres (03) años para el software` | Split: 1 year hardware, 3 years software maintenance |
| Descriptions with no warranty mention | Warranty unknown — should be flagged |

### MVP approach — warranty as notes

For MVP, if warranty text is detected in `Nota/descripción`, it should be:
1. Preserved in the Hardware record's Description / Notes field
2. Flagged to the user with a suggestion: "Warranty terms detected — would you like to create a Support / Warranty Coverage record?"
3. Left for the user to act on — Opriva does not auto-create coverage without approval

### Opriva warranty coverage model

When the user approves, create a **Support Coverage** record linked to the Hardware record:

| Support Coverage Field | Value |
|---|---|
| Coverage Name | `QNAP Hardware Warranty` or `[Brand] Warranty` |
| Coverage Type | Manufacturer Warranty |
| Provider | QNAP / Samsung / Seagate / etc. |
| Coverage End Date | Purchase Date + warranty period (e.g., Purchase Date + 3 years) |
| Coverage Owner | `Recibido Por` / account manager |
| Alert Policy | Workspace default |

For drives, create a separate Support Coverage record with the drive's warranty period (typically shorter than the main unit).

### Phase 2 — automated warranty extraction

In Phase 2, the AI should:
- Detect warranty text patterns in `Nota/descripción`
- Extract the covered product, warranty duration, and coverage type
- Calculate the Coverage End Date from Purchase Date + warranty period
- Propose Support Coverage records for user review before creation

---

## 7. Serial Number Logic

### The `Serial` field is often multi-valued

The `Serial` column frequently contains multiple serial numbers in a single cell, separated by newlines (`\n`) or spaces. This is especially common for disk and cable rows.

**Examples observed:**

- Single serial: `QNEX508656W` — straightforward
- Multi-line (newlines): `s75bnl0x731397\ns75bnl0x731412\ns75bnl0x731410\n...` — 10 serials for 10 SSDs
- Space-separated: `HWK039NP HWK039C1 HWK039KN HWK03A48 HWK03FSQ HWK03FFJ` — 10 serials
- Mixed: some rows have single serial for multiple units (e.g., 2 NAS units with 1 serial)
- Not available: `N/D`, `N/A` — no serial recorded

### Import rules for serials

1. **Single serial, quantity = 1** — straightforward. Map to Serial Number field.
2. **Multiple serials, quantity = N, serials = N** — split and validate. Offer to create one component record per serial, or store all serials in the Notes field.
3. **Serial count ≠ quantity** — flag for review. Do not auto-resolve. Present the mismatch to the user with options: enter serials manually, store as partial, or skip.
4. **`N/D` or `N/A`** — store as blank or a "Not available" note. Do not import the literal string as a serial number.
5. **Single serial for quantity > 1** — may indicate a batch serial or a data entry gap. Flag for user review.

### Serial validation rule

Before creating individual hardware records from multi-serial rows, Opriva should:
- Count the number of serials detected
- Compare to `Cantidad`
- If match: offer to create N individual records, one per serial
- If mismatch: flag with the discrepancy and ask the user how to proceed

---

## 8. Import Assistant Behavior

When the QNAP file is uploaded, the AI import assistant should:

### Structure detection

- Detect report header rows (rows 1–3) and the report footer row — exclude automatically
- Detect customer group header rows (rows where only `Cliente` is populated) and use them to assign `Client` to all following rows until the next customer header
- Identify main hardware rows (`Clase de artículo = 'Equipos Qnap'`)
- Identify component rows (`Discos`, `Riel`, `Tarjeta de expansion de red`, blank) and group them under the most recent main hardware row

### Column analysis

- Suggest `Brand:Model` splitting for `Nombre completo del producto/servicio`
- Suggest `Número` as the invoice reference / join key for component grouping
- Detect multi-value serials in `Serial` and flag for serial validation
- Detect warranty text in `Nota/descripción` and flag for Support Coverage creation
- Detect PO references in `Notas` and suggest mapping to a reference metadata field
- Suggest skipping payment terms in `Notas` (not an Opriva field)
- Suggest `Tipo de transacción` as a skip (uniform value `Factura` — no mapping value)
- Suggest `Año Aproximado de lanzamiento del equipo` as optional metadata / custom field

### Record type recommendations per row

| Row type | AI recommendation |
|---|---|
| Report header / footer | Exclude |
| Customer group header | Extract as `Client` value — do not create a record |
| `Equipos Qnap` row | Create **Hardware record** |
| `Discos` row | Create linked **Hardware record** (component) or add to parent Notes |
| `Riel` row | Add to parent Hardware record Notes (accessory — typically no individual tracking needed) |
| `Tarjeta de expansion de red` row | Create linked **Hardware record** (if has serial and warrants individual tracking) or add to Notes |
| Blank class row with product data | Treat as component — user decides |
| Warranty text detected in description | Suggest **Support Coverage** record |
| PO reference detected in `Notas` | Store as metadata reference on the package/record |

---

## 9. Fast Mapping UX

The import process must be fast. The AI pre-maps obvious columns so the user spends minimal time on routine fields and only reviews genuinely uncertain decisions.

### Design principles

1. **Pre-mapped with confidence indicators** — columns with clear, unambiguous mappings (e.g., `Cliente` → Client, `Número` → Invoice Reference, `Cantidad` → Quantity) are mapped automatically with high confidence. The user can change them but does not need to act on them.

2. **Review only what is uncertain** — the user's attention is directed to columns where the AI is less certain: `Nota/descripción` (contains mixed data types), `Notas` (mixed payment terms and PO references), `Serial` (multi-value), `Año Aproximado` (optional metadata).

3. **Grouped decisions for component rows** — instead of asking individually about each component row, the AI presents a grouped decision: "X component rows detected. Create as linked hardware records, or add to parent record notes?" One decision covers the group.

4. **Reusable templates** — once a user has approved a mapping for the QNAP report format, the template can be saved and reused for the next import of the same file type. The user only needs to review changes.

5. **Skip is one click** — any column can be skipped with one action. The AI pre-selects skip for columns it is confident are not needed.

6. **Preview before commit** — the user sees draft records before anything is written. Changes can be made before confirming.

---

## 10. MVP Import Recommendation

For MVP, import is manual with AI-assisted mapping guidance.

### Recommended procedure

**Step 1 — Upload the file**
Upload `Ventas por Clase Qnap 2025-2026.xlsx` in the Data Import module. Opriva detects the QNAP sheet.

**Step 2 — AI detects structure**
Opriva identifies customer group headers, main hardware rows, and component rows. It presents the structure for the user to review.

**Step 3 — Column mapping review**
The user reviews AI-suggested mappings. Pre-mapped: Client, Invoice Reference, Quantity, Owner, Purchase Date, Asset Name. Flagged for review: Serial (multi-value), Nota/descripción (mixed data), Notas (mixed content), Año Aproximado (optional).

**Step 4 — Component grouping decision**
For each customer group, the user decides: create individual linked records for disks and expansion cards, or add them as notes on the parent hardware record.

**Step 5 — Serial validation**
For rows where serial count ≠ quantity, the user reviews each mismatch and chooses how to proceed.

**Step 6 — Warranty suggestion review**
For rows where warranty text was detected, the user approves or dismisses suggestions to create Support Coverage records.

**Step 7 — Preview records**
The user sees draft Hardware records (and optional component records) before import.

**Step 8 — Confirm import**
Hardware records are created. Component records are created (if approved). Support Coverage records are created (if approved). The invoice reference is stored as metadata.

---

## 11. Phase 2 Import Automation

The following capabilities are deferred and should not be implemented in the current MVP.

| Capability | Description |
|---|---|
| **Automatic warranty extraction** | Parse warranty duration from `Nota/descripción` using pattern matching. Calculate Coverage End Date from Purchase Date + period. Propose Support Coverage records automatically. |
| **Automatic component grouping** | Detect customer context and invoice context for component rows programmatically. Group without user-guided structure review. |
| **Serial-to-quantity validation** | Automatically split multi-value serial fields and validate count against `Cantidad`. Flag mismatches with severity levels. |
| **Duplicate hardware detection** | Check for existing Hardware records with the same serial number before creating new ones. Warn on potential duplicates. |
| **Invoice document attachment** | If an invoice PDF is uploaded alongside the Excel, match by invoice number (`Número`) and attach as a document to the corresponding Hardware record. |
| **Support/warranty coverage suggestion** | After hardware records are created, AI suggests adding Warranty / Support Coverage records based on detected warranty text and known QNAP warranty periods. |
| **Reusable import templates** | Save approved column mappings as named templates. Apply to future imports of the same source format. |
| **Model year lifecycle intelligence** | Use `Año Aproximado de lanzamiento del equipo` to surface aging assets approaching end-of-support or end-of-life. |

---

## 12. Example Normalized Records

The following examples show how real rows from the file map to Opriva records.

---

### Example A — Hormigon, S.A.

**Source rows:** 1 main hardware row + 1 disk row + 1 rail row (Invoice FE-0000001039)

**Main Hardware record:**

| Field | Value |
|---|---|
| Asset Name | TS-h1887XU-RP-E2336-32G-US |
| Brand | QNAP |
| Type | NAS — 18-Bay 2U Rackmount |
| Model | Qnap:TS-h1887XU-RP-E2336-32G-US |
| Client | Hormigon, S.A. |
| Serial Number | QNEX508656W |
| Purchase Date | 2026-01-17 |
| Invoice Reference | FE-0000001039 |
| Owner | Alcides Martinez de Sedas |
| Model Year | 2021–2022 |
| Notes | QNAP NAS híbrido de 18 bahías 2U para montaje en rack con procesador Intel Xeon, doble 10GbE, Incluye 10 discos SSD de 1TB |

**Suggested Support Coverage:**

| Field | Value |
|---|---|
| Coverage Name | QNAP Hardware Warranty — TS-h1887XU-RP |
| Coverage Type | Manufacturer Warranty |
| Provider | QNAP |
| Coverage End Date | 2029-01-17 (Purchase Date + 3 years) |

**Component — 10x Samsung SSD (linked records or notes):**
- Product: Samsung MZ-77E1T0 (870 EVO 1TB SATA 2.5")
- Quantity: 10
- Serials: s75bnl0x731397, s75bnl0x731412, s75bnl0x731410, s75bnl0x731400, s75bnl0x731408, s75bnl0x731398, s75bnl0x731399, s75bnl0x731432, s75bnl0x731396, s75bnl0x731403

**Component — Rail Kit (notes on parent):**
- Product: QNAP RAIL-B02
- Serial: Q246C04880
- Quantity: 1

---

### Example B — Unigreen Marine, S.A.

**Source rows:** 1 main hardware row + 1 disk row + 1 rail row (Invoice FE-0000001052)

**Main Hardware record:**

| Field | Value |
|---|---|
| Asset Name | TS-h1677AXU-RP-R7-32G-US |
| Brand | QNAP |
| Type | NAS — 3U 16-Bay Rackmount |
| Client | Unigreen Marine, S.A. |
| Serial Number | QPPHC053903 |
| Purchase Date | 2026-01-21 |
| Invoice Reference | FE-0000001052 |
| Owner | Carlos Santamaria |
| Model Year | 2023 |

**Components:** 16x Crucial CT4000MX500SSD1 Enterprise SSDs (16 individual serials) + 1x QNAP RAIL-B02 (serial Q246C05244).

---

### Example C — Elektra Noreste, S.A. (two invoices)

This customer has two separate `Equipos Qnap` rows under two different invoices. Each invoice becomes a separate Hardware record with its own component group.

**Invoice FE-0000001078 — Hardware record:**

| Field | Value |
|---|---|
| Asset Name | TL-R1620Sdc-US |
| Brand | QNAP |
| Type | JBOD Expansion Enclosure — 16-Bay 3U |
| Client | Elektra Noreste, S.A. |
| Serial Number | Q238I05658U |
| Purchase Date | 2025-02-26 |
| Invoice Reference | FE-0000001078 |
| Owner | Jonathan Diaz |
| PO Reference | Solped No. 5020037675 / OC No. 4000003626 |

Components: 12x Seagate XS3840SE70045 SSDs + 4x QNAP CAB-SAS30M-8644 cables + 1x QXP-820S-B3408 expansion card.

**Invoice FE-0000001081 — Second Hardware record (expansion/ampliación):**

| Field | Value |
|---|---|
| Asset Name | TL-R1620Sdc-US (Ampliación) |
| Client | Elektra Noreste, S.A. |
| Serial Number | Q238I05665S |
| Invoice Reference | FE-0000001081 |
| PO Reference | Solped No. 5020038163 / OC No. 4000003620 |

Components: 4x QNAP SAS cables + 8x Seagate SSDs + 1x QXP expansion card.

---

### Example D — Universidad Tecnológica de Panamá

Single NAS with warranty information explicitly stated.

**Main Hardware record:**

| Field | Value |
|---|---|
| Asset Name | TS-673A-8G-US |
| Brand | QNAP |
| Client | Universidad Tecnológica de Panamá |
| Serial Number | QN744052720 |
| Purchase Date | 2025-03-31 |
| Invoice Reference | FE-0000001401 |
| PO Reference | OCOM12025-865 |
| Owner | Betsy L. Espinosa |

**Warranty note:** "Garantía: 1 Año para el hardware y tres (03) años para el software del S.O. de mantenimiento por parte de la casa productora."

**Suggested Support Coverage records (two separate):**

1. QNAP Hardware Warranty — TS-673A: Provider = QNAP, Coverage End = 2026-03-31 (1 year)
2. QNAP Software/OS Maintenance — TS-673A: Provider = QNAP, Coverage End = 2028-03-31 (3 years)

Components: 4x Western Digital WD80EFPX 8TB drives (serials: RD2K1ZHH, RD2LD28H, RD2KP56H, RD2KY7GH)

---

## 13. Customers in Source File

For reference, the 13 clients represented in this file:

| Customer |
|---|
| Hormigon, S.A. |
| Unigreen Marine, S.A. |
| Sucre Arias & Reyes |
| Elektra Noreste, S.A. |
| American Sportswear, S.A. |
| Computación Monrenca Panamá, S.A. (Intcomex) |
| Cía. Internacional de Seguros, S.A. |
| Universidad Tecnológica de Panamá |
| Colón Container Terminal, S.A. |
| Argelia Internacional, S.A. |
| Centro Regional de Innovación en Vacunas y Biofármacos AIP (CRIVB AIP) |
| Autoridad de los Recursos Acuáticos de Panamá (ARAP) |
| Panasonic Latín América, S.A. |

---

*No application code was modified to produce this document.*
*Sources: MEMORY.md, USER_GUIDE.md, AI_KNOWLEDGE_BASE.md, IMPORT_MAPPING_TREND_MICRO.md, Ventas por Clase Qnap 2025-2026.xlsx.*
