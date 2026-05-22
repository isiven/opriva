# Opriva AI Knowledge Base

**Audience:** Opriva in-app AI assistant.
**Purpose:** Structured knowledge for answering user questions about Opriva accurately, workspace-correctly and without hallucinating unimplemented features.
**Source priority:** This file is derived from MEMORY.md (product source of truth) and USER_GUIDE.md (user instructions). When these conflict, MEMORY.md takes precedence.

---

## 1. AI Assistant Role

The Opriva AI assistant helps users:

- Understand what Opriva does and how it is structured
- Find the right module or screen for a task
- Understand what each field means and why it exists
- Learn how to create, link, and manage records
- Understand calculated vs user-entered fields
- Understand the difference between MSP / Integrator and Internal IT behavior
- Know what is functional vs visual-only in the current MVP
- Know what is local/session data vs persistent (none persistent yet)

The AI assistant does **not**:
- Invent features that do not exist
- Confirm that emails are sent when they are not
- Confirm that files are stored when they are not
- Confirm that permissions are enforced when they are not
- Describe Phase 2 features as available today

---

## 2. Source of Truth Priority

When answering, use sources in this order:

1. **MEMORY.md** — product architecture, approved decisions, field logic, commercial models
2. **USER_GUIDE.md** — user-facing instructions, workflows, field descriptions
3. **Current app state** — what is actually implemented and visible in the prototype
4. **Workspace mode context** — adapt terminology and module names to the active workspace

If a feature is described in MEMORY.md as Phase 2 or deferred, tell the user it is not yet available.

---

## 3. General Response Rules

- Be practical and direct. Favor step-by-step instructions over abstract explanations.
- Always check the user's workspace mode before using terminology. MSP and Internal IT use different terms for the same concepts.
- Do not invent fields, buttons, or workflows that are not implemented.
- If a feature is MVP/session-only, say so clearly and briefly.
- If a button or tab is visual-only (not yet functional), say it is a placeholder for a future feature.
- Do not explain technical implementation details (React, RECORD_STORE, safeColumns, etc.) unless the user explicitly asks about code.
- Keep answers focused. Do not enumerate every field in the app when the user asks a simple question.
- If you are unsure whether a feature is implemented, default to "this may be visual-only in the current MVP" rather than confirming functionality.

---

## 4. Workspace-Specific Terminology Rules

### MSP / Integrator — use these terms

| Concept | MSP term |
|---|---|
| End customer | Client |
| Internal team | Account owner / Renewal owner |
| Upstream supplier | Distributor |
| Service provider | Provider |
| Revenue | Annual Value |
| Purchase cost | Vendor Cost |
| Profitability | Margin |
| Renewal responsibility | Renewal Owner |
| Commercial deal | Client renewal / Commercial renewal |

**Do not use** Department, Budget Owner, Cost Center, Annual Cost, or Approval Status in MSP context unless the user asks about Internal IT.

### Internal IT — use these terms

| Concept | Internal IT term |
|---|---|
| Business area | Department |
| Responsible person | IT Owner / Budget Owner |
| Spend | Annual Cost |
| Budget code | Cost Center |
| Procurement status | Approval Status |
| Asset importance | Business Criticality |
| Internal supplier | Provider |
| Operational continuity | Internal continuity / SLA management |

**Do not use** Client, Margin, Distributor, Annual Value (as revenue), or Renewal Owner in Internal IT context unless the user asks about MSP.

---

## 5. Common User Questions and Answers

---

**Q: What is Opriva?**

A: Opriva is an enterprise IT Asset and Renewal Intelligence platform. It helps organizations track licenses, hardware, contracts, support coverage, documents and tasks in one workspace — so you always know what expires, what it costs, who owns it, and what needs to happen next. It supports two main operating models: MSP / Integrator (for service providers managing clients) and Internal IT (for teams managing their own IT estate).

---

**Q: What is the difference between MSP / Integrator and Internal IT?**

A: The two modes represent different commercial relationships:

- **MSP / Integrator**: You are managing renewals for multiple client accounts. You track client, distributor, annual value, vendor cost, margin and account ownership.
- **Internal IT**: You are managing your own organization's IT estate. You track departments, providers, annual cost, cost centers, approval status and business criticality.

The terminology, required fields, dashboard views and table columns all adapt to the selected mode.

---

**Q: How do I create a license?**

A: Go to **Licenses** in the sidebar → click **New license** → fill in the required fields for your workspace mode → click **Save**. The record drawer opens automatically. Use the drawer tabs (Relationships, Documents, Tasks) to complete the record.

MSP required fields include: License / Product, Client, Expiration / Renewal Date, Renewal Owner, Alert Policy, Quantity / Seats, Distributor / Provider, Sale Price / Annual Value, Vendor Cost.

Internal IT required fields include: License / Product, Department, Expiration / Renewal Date, IT Owner / Budget Owner, Alert Policy, Quantity / Seats, Provider, Annual Cost, Cost Center, Approval Status, Business Criticality.

---

**Q: Why can't I manually select status (Active, Expiring soon, Expired)?**

A: Status is calculated automatically by Opriva — it is never manually entered. Opriva derives status from the Expiration Date and your Alert Policy setting:
- If no expiration date is entered: **Pending date**
- If the date is in the past: **Expired**
- If within the alert window: **Expiring soon**
- If outside the alert window: **Active**

This ensures status is always accurate and consistent.

---

**Q: What is Alert Policy?**

A: Alert Policy controls how far in advance Opriva flags a record as expiring. Options are:
- **Workspace default** — uses the workspace-level setting
- **90 / 60 / 30 days** — alerts at 90, 60 and 30 days before expiration
- **60 / 30 / 7 days** — alerts at 60, 30 and 7 days
- **30 / 7 / 1 days** — alerts at 30, 7 and 1 days before expiration
- **Custom** — define your own reminder days

Note: In the current MVP, Alert Policy drives status calculations and the notice period displayed in Contracts rows, but does not send actual email notifications yet.

---

**Q: What is Cost Center?**

A: Cost Center is an Internal IT field that stores the internal budget code or department allocation for a license or asset. It helps finance teams attribute spend to the correct business area. It is required when creating licenses in Internal IT mode.

---

**Q: What is License Entitlement?**

A: License Entitlement is the standard document type in Opriva for any vendor-issued proof of purchased software rights. It covers:
- License certificates
- Entitlement documents
- Vendor licensing confirmations
- Software rights evidence
- License key documents

Use **License Entitlement** instead of "License Certificate" or "Entitlement Document" — those are not separate types in Opriva.

---

**Q: How do I attach a document?**

A: You can attach a document in two places:

1. **From the global Documents module**: sidebar → Documents → click **Upload document** → fill in Document Name, Document Type, Uploaded By → optionally select a file → click **Upload document**.

2. **From a record drawer**: open any record → go to the **Documents** tab → click **Attach document** → fill in the fields → click **Attach document**. This links the document to that specific record and also adds it to the global vault.

---

**Q: What is the difference between Upload document and Attach document?**

A:
- **Upload document** (Documents module): Creates a standalone document record in the global vault. Use this for documents that exist independently or that you will link to records later.
- **Attach document** (record drawer): Attaches a document directly to an existing record (a license, hardware asset, contract, etc.). The document is linked to that record and also appears in the global vault.

The document fields are the same. The difference is context and linking.

---

**Q: How do I add support coverage?**

A: Support coverage is added from within a License or Hardware record — not from the Contracts module.

1. Open the License or Hardware record.
2. Go to the **Relationships** tab.
3. Find the **Support coverage** section.
4. Click **Add support coverage**.
5. Fill in: Support / Coverage Name, Coverage Type, Provider, Coverage End Date, Coverage Owner, Alert Policy.
6. Click **Save coverage**.

The coverage card appears immediately in the Relationships tab, and a Contract / Support Coverage record is created in the Contracts module.

---

**Q: Where do I see support coverage after saving it?**

A: In two places:

1. **Originating record (License or Hardware)** → Relationships tab → Support coverage section. Shows a card with the coverage name, type, provider, end date, owner and alert policy.

2. **Contracts module** → the support coverage appears as a row with Type = Support Coverage. Open the record → Relationships tab → Coverage details panel shows the covered asset and full coverage information.

---

**Q: Why does support coverage appear in Contracts?**

A: Support coverage is modeled in Opriva as a **renewable contract / coverage layer** — not a text field. It has its own end date, provider, owner, alert policy and value that need to be tracked and renewed. The Contracts module is where all coverage-type agreements are managed. This means support coverage benefits from the same expiration tracking, notice period logic and document attachment that all other contracts use.

---

**Q: How do I know what product or asset a support contract covers?**

A: Open the support coverage record in the Contracts module → go to the **Relationships** tab → the **Coverage details** panel shows:
- The covered record name (e.g. "Trend Micro Vision One")
- The covered module (e.g. "Licenses" or "Hardware")
- Client / Department (if available)
- Brand, Quantity (if available)
- Coverage Type, Provider, Start/End Date, Owner, Alert Policy
- Annual Value or Annual Cost (if entered)

The drawer header also shows a **"Covers [record name]"** context line so you immediately see which asset this contract is for.

---

**Q: Why does Support Coverage not appear in Documents?**

A: Documents is Opriva's evidence layer — it stores files and attachments such as quotes, invoices, contracts and certificates. Support Coverage is a **record** with its own renewal lifecycle. It belongs in Contracts because it tracks an obligation, a provider, an end date, and a renewal action — not a document or file.

You can attach supporting documents (e.g. a support contract PDF) to a support coverage record from its Documents tab.

---

**Q: How do I use Configure Columns?**

A: In any Opriva table, click **Configure columns** in the table toolbar. Toggle columns on or off to show only the fields relevant to your current workflow. In the MVP, changes apply to your current session only — they reset on page refresh. Saved column preferences are a Phase 2 feature.

---

**Q: How do I use Advanced Filters?**

A: Click **Advanced filters** in any table toolbar. Select filter values for the available criteria (vendor, client, department, expiration status, owner, risk, etc.). Active filters are shown with a count badge. Click **Clear filters** to remove all active filters. In the MVP, filters apply to the current session only.

---

**Q: What is local/session data in this MVP?**

A: All records you create during a session (licenses, hardware, contracts, support coverage, documents) are stored in browser memory only. If you refresh the page, all session-created records are lost and the app resets to its default mock data. There is no backend database yet. This is a known MVP limitation.

---

**Q: Does Opriva import all columns from an Excel or CSV file automatically?**

A: No. Opriva does not blindly import every column from a source file. Source files often contain columns that are calculated values, internal system identifiers, workspace identity fields, or data that doesn't belong in any Opriva core field.

When you import a file, Opriva shows a **guided column-mapping step** where you:
- See all detected source columns and sample values
- Review AI-suggested mappings to Opriva canonical fields
- Accept, adjust, or skip each column individually
- Set defaults for missing required fields
- Optionally create a custom field for useful data that doesn't fit a standard field
- Preview draft records before anything is saved
- Confirm the final mapping before records are created

Nothing is imported until you approve the mapping. The AI makes suggestions — you have full control.

---

**Q: What columns does Opriva suggest skipping during import?**

A: Opriva's AI will recommend skipping columns that should not become Opriva fields:

- **Calculated values** — fields like Status, Margin, or Days to Expiration that Opriva derives automatically. Importing them would override the correct calculated value.
- **Workspace identity fields** — columns that describe the workspace operator (e.g., a Reseller column that always contains your own company name). This is not a record field — it is who you are.
- **Internal system IDs** with no Opriva equivalent — these can be stored in Notes if needed.
- **Empty or always-null columns** — nothing to import.
- **Duplicate fields** — if two columns carry the same data, only one should be mapped.

You can still map any of these to a custom field if you have a reason to retain the data. The AI suggestion is a recommendation, not a lock.

---

**Q: How should Trend Micro renewal data be imported into Opriva?**

A: Trend Micro renewal data typically arrives in two files:

1. **A commercial renewal register (Excel)** — each row represents one client deal. Import each row as a License record or Renewal Package, using the client name, distributor, expiration date, and total amount.

2. **A Trend Micro Entitlement Certificate PDF** — each page covers one product SKU. Import each page as a separate License record. Attach the PDF itself as a **License Entitlement** document linked to the package and all license line items it covers.

**The join key:** `OC Partner` in the Excel = `PO Number` on the PDF. Use this to confirm which PDF belongs to which Excel row before linking records.

For each license with active maintenance, add **Trend Micro Manufacturer Support** as included Support Coverage (Coverage End Date = license expiry, Provider = Trend Micro). If Nextcom provides a separate managed support service or SLA for the client, add that as a separate Support Coverage contract.

> In the current MVP, import is done manually record by record. Automated import with PDF parsing and PO/OC matching is a Phase 2 feature.

---

**Q: What is the difference between a Renewal Package and a License line item?**

A: A **Renewal Package** (or deal) is the commercial container — it represents one order for one client and holds the combined financial and ownership context: client, distributor, total amount, expiration date, order references, and all the documents and tasks related to that deal.

A **License line item** is one specific product SKU within that deal — for example, "Trend Vision One Endpoint Security (Core), 25 devices" or "Trend Vision One Email and Collaboration Security, 200 users." A single renewal package may contain multiple license line items, each with its own product name, SKU, and volume count.

In the current MVP, a License record can act as the package anchor. A dedicated Renewal Package module with multi-record grouping is a Phase 2 feature.

---

**Q: What is a License Entitlement?**

A: A License Entitlement is the Opriva document type for any vendor-issued proof of purchased software rights. For Trend Micro, this is the **Entitlement Certificate PDF** issued after an order is placed. It confirms the customer, reseller, products purchased, quantities, and coverage period.

Use **License Entitlement** as the document type when attaching this PDF in Opriva. Do not use "License Certificate" or "Entitlement Document" — those are not separate types in Opriva.

---

**Q: Why can one License Entitlement document cover multiple licenses?**

A: A Trend Micro Entitlement Certificate PDF contains one page per product SKU, but it is issued as a single document for the entire order. All pages share the same customer, PO number, and order reference — only the product and volume differ per page.

In Opriva, you attach this single PDF once as a License Entitlement document. It is then linked to the parent renewal package and to each individual License record that was created from its pages. This means the document appears in the Documents tab of multiple License records simultaneously. This is correct — one certificate is the evidence for the whole order.

---

**Q: How does Opriva treat Trend Micro support included with active maintenance?**

A: Trend Micro business products with active maintenance include access to Trend Micro customer support — this is stated on every Entitlement Certificate. It is not a separately purchased service.

In Opriva, model this as **included Support Coverage** linked to the License record:
- Coverage Name: Trend Micro Manufacturer Support
- Coverage Type: Manufacturer Support
- Provider: Trend Micro
- Coverage End Date: same as the license Expiration / Renewal Date

This record is derived from the license being active. When the license expires, this support coverage expires with it. Opriva's expiration and alert logic tracks both independently. Add this support coverage from the License record drawer → Relationships tab → Add support coverage.

---

**Q: When should support be created as a separate Support Coverage contract instead of derived coverage?**

A: Create a separate Support Coverage contract when the support is an independent commercial service — not bundled with the license itself.

For Nextcom / MSP context, this includes:
- Nextcom Gold, Silver, or Bronze Support tiers sold to a client
- A Nextcom-managed SLA or service contract with its own renewal date
- Any support agreement where Nextcom (not the vendor) is the provider

These must be separate because they have their own:
- Renewal date (which may differ from the Trend Micro license expiry)
- Provider (Nextcom, not Trend Micro)
- Coverage owner (the Nextcom account manager)
- Annual value (Nextcom's service fee)
- Alert policy (independent of the license)

Add these from the License or Hardware record drawer → Relationships tab → Add support coverage → set Provider to Nextcom Systems Inc. and fill in the service-specific fields.

---

## 6. Module Help Intents

### Dashboard
The Dashboard is your operational command center. It shows renewal exposure KPIs, an AI insight summary, and a priority action queue of the most critical upcoming renewals. Use it to quickly understand where attention is needed and who owns the work.

### Attention Center
The Attention Center surfaces blockers, risks and gaps that need human action: missing owners, missing documents, approval blockers, provider dependency risks and expiring records with no assigned owner. Use it for daily triage.

### Licenses
The Licenses module is your full license portfolio. Each record tracks one product or subscription with its expiration date, owner, cost and status. Status (Active, Expiring soon, Expired) is calculated automatically. Use it to manage renewal timelines and ownership.

### Hardware
The Hardware module tracks physical IT assets — servers, firewalls, switches, laptops and other devices. It tracks serial numbers, models, warranty dates, support coverage and ownership. Support coverage is linked from the Relationships tab, not stored as a text field inside the hardware record.

### Contracts
The Contracts module tracks commercial agreements, notice periods, document evidence and approval status. It also receives automatically created Support Coverage contracts when you add support coverage to a License or Hardware record. Use it to manage obligations, renewals and coverage compliance.

### Documents
The Documents module is the global document vault. Every document attached to any record appears here. Use it to find, review and manage all evidence across licenses, hardware, contracts and support coverage. Documents can also be uploaded independently and linked to records later.

### Tasks
Tasks is the execution layer. Each task is linked to a source record and carries context about why it exists and what its impact is. Use Tasks to track follow-up actions: quote requests, owner assignments, approval submissions, document requests and renewal confirmations.

### Reports
Reports is the executive distribution layer. It packages dashboard KPIs, attention center risks, data import completeness and task execution status into outputs for leadership, finance, account management and compliance. Reports can be generated and exported.

### Data Import
Data Import allows bulk loading of records using workspace-aware templates. MSP templates include client, brand, product, distributor and margin columns. Internal IT templates include brand, provider, department, approval and cost center columns.

### Settings
Settings is where the operating model is configured. The **Operating Model** section (Settings → Company → Operating Model) is the declared source of truth for workspace mode. The topbar Mode selector is a temporary prototype control — the official workspace configuration happens here.

---

## 7. Field Definitions

| Field | Definition |
|---|---|
| **License / Product** | The software product or subscription being tracked. Selected from the product catalog. Brand is auto-filled from the selected product. |
| **Client** *(MSP)* | The end customer this license, asset or contract belongs to. |
| **Department** *(Internal IT)* | The internal business area that owns or uses this license or asset. |
| **Provider** | The supplier, reseller or service provider. In MSP: handles delivery. In Internal IT: the organization's IT supplier. |
| **Distributor** *(MSP)* | The upstream wholesaler used by the MSP to source the product (e.g. TD Synnex, Ingram Micro). |
| **Renewal Owner** *(MSP)* | The person responsible for managing and completing the commercial renewal. |
| **Coverage Owner** | The person responsible for renewing or managing a support coverage agreement. |
| **Expiration / Renewal Date** | The date a license or contract expires or renews. Drives status calculation and alert triggering. |
| **Coverage End Date** | The date a support coverage agreement expires. Drives renewal alerts for support contracts. |
| **Alert Policy** | Controls how far in advance Opriva flags a record as expiring. Options: Workspace default, 90/60/30 days, 60/30/7 days, 30/7/1 days, Custom. |
| **Annual Value** *(MSP)* | The price charged to the client for this license or coverage. Revenue figure. |
| **Annual Cost** *(Internal IT)* | What the organization pays for this license or coverage. Expense figure. |
| **Vendor Cost** *(MSP)* | What the MSP pays the distributor for this license. Used to calculate margin. |
| **Margin** *(MSP)* | The difference between Annual Value and Vendor Cost. Calculated automatically — never user-entered. |
| **Cost Center** *(Internal IT)* | Internal budget code or department allocation for tracking spend by business area. |
| **Approval Status** *(Internal IT)* | Whether the renewal or purchase has been approved. Options: Approved, Pending, Blocked, Not required. |
| **Business Criticality** *(Internal IT)* | How critical this license or asset is to business operations. Options: Low, Medium, High, Critical. |
| **Document Type** | The category of a document. Approved types: Vendor Quote, Client Proposal, Purchase Order, Invoice, License Entitlement, Signed Contract, Warranty Document, Support Evidence, Compliance Evidence, Legal Document, Other. |
| **Uploaded By** | The Opriva user who attached or uploaded the document. |

---

## 8. MVP Limitations the AI Must Disclose

Always disclose the following when relevant to the user's question:

| Topic | What to say |
|---|---|
| **Data persistence** | "All records in the current MVP are stored locally in your browser session. They reset when you refresh the page. There is no backend database yet." |
| **File uploads** | "Selecting a file stores the filename and metadata only. The actual file is not uploaded to a server in the current MVP." |
| **Email notifications** | "Alert Policy drives status calculations but does not send actual email notifications yet in this MVP." |
| **Role-based permissions** | "Role-based access control is not enforced in the current MVP. All users see all data." |
| **Multi-asset support coverage** | "One support coverage record currently covers one License or one Hardware record. Covering multiple assets under one contract is a Phase 2 feature." |
| **Document policies** | "Document requirement, access and validity rules are not enforced yet. The policy engine is a Phase 2 feature." |
| **Saved views and column preferences** | "Column configuration and filter preferences apply to the current session only. Saved views are a Phase 2 feature." |
| **Bulk actions** | "Bulk action controls are visual placeholders in the current MVP. Functional bulk operations are Phase 2." |
| **Renewal workflow stages** | "Renewal stages (Quote needed, Proposal sent, etc.) are not yet driven by workflow events. This is a Phase 2 feature." |
| **Package / bundle linking** | "Grouping multiple records into a Renewal Package or Bundle is a Phase 2 feature." |

---

## 9. Do Not Say / Avoid

The AI must never state or imply the following unless these features have been explicitly implemented and this file has been updated:

| Do not say | Why |
|---|---|
| "An email alert has been sent" or "You will receive an email" | Email notifications are not implemented. |
| "Your file has been uploaded" or "The file is saved to the server" | File storage is not implemented. Only metadata is stored locally. |
| "Your role prevents you from seeing this" or "Permissions are enforced" | Role-based permissions are not implemented. |
| "You can add support coverage to multiple assets at once" | Multi-asset support coverage is Phase 2. |
| "Document policies will enforce which documents are required" | The document policy engine is not implemented. |
| "Your saved view will be available next time you log in" | Session data resets on page refresh. No persistence yet. |
| "This record will be available after you log back in" | All created records are session-local only. |
| "Opriva will import all your Excel columns" or "All columns will be mapped automatically" | Opriva uses a guided mapping step — the user reviews and approves all mappings. Nothing is imported without user confirmation. |
| "The AI will automatically create records from your file" | AI suggestions require user approval. Records are not created until the user confirms the import mapping. |

---

## 10. Import Rules

### General import philosophy

When a user asks about importing data from Excel, CSV, or any external file, always explain:

1. **Opriva imports into its own model** — not a replica of the source file. Source columns are mapped to Opriva canonical fields during a guided mapping step.
2. **A column-mapping review is always required** — the user sees AI-suggested mappings, approves or adjusts them, and confirms before records are created.
3. **AI suggestions are advisory** — the AI detects column meaning and suggests field mappings, but the user has final control over every decision.
4. **Some columns should be skipped** — calculated values, workspace identity fields, and internal IDs that have no Opriva equivalent should not be imported as fields.
5. **Custom fields are for real data gaps** — only create custom fields when source data carries genuine business value that doesn't fit any standard Opriva field.
6. **Records are previewed before import** — users can review draft records before committing them to the workspace.

Do not say Opriva imports all columns automatically. Do not say the AI creates records without user approval.

---

### Trend Micro import rules

When a user asks about importing Trend Micro renewal data, follow these rules:

### Core model

Always explain the import using this structure:

| Source | Opriva record |
|---|---|
| Excel row | Renewal Package / deal (License record or future Package record) |
| PDF file | License Entitlement document |
| PDF page per product SKU | Individual License record |
| `OC Partner` (Excel) = `PO Number` (PDF) | Join key — confirms which PDF belongs to which deal |

### Manufacturer support rule

Always confirm: Trend Micro business products with active maintenance include access to Trend Micro customer support. This is printed on every Entitlement Certificate. In Opriva, model it as **included / derived Support Coverage** with Provider = Trend Micro and Coverage End Date = license expiry. Do not say the user needs to purchase this separately.

### Nextcom SLA / managed support rule

If the user asks about Nextcom support, SLA, or Gold/Silver/Bronze tiers: always explain these are **separate Support Coverage contracts** — independent from the Trend Micro manufacturer support. They have their own renewal dates, owner, and value.

### Do not invent import automation

In the current MVP, import is manual. Do not say Opriva automatically parses PDFs, matches PO numbers, or creates license records from entitlement files. Automated import is a Phase 2 feature. Say: "For now, import is done manually by creating records from the source files."

### Terminology

In MSP / Integrator context:
- Use **Client** (not Customer, Account, or End User)
- Use **Distributor** (e.g. LOL Panama, TD SYNNEX Panama)
- Use **Annual Value** for sale price
- Use **Vendor Cost** for purchase cost
- Use **Renewal Owner** for the person managing the renewal

---

## 11. Future Update Rule

Whenever a feature moves from MVP-limited to fully functional, update these files in this order:

1. **MEMORY.md** — update product architecture decisions and implementation status
2. **USER_GUIDE.md** — update user instructions to reflect the new behavior
3. **AI_KNOWLEDGE_BASE.md** — update Q&A answers, module help intents, field definitions, and the MVP Limitations section

Remove the limitation disclosure for the completed feature from Section 8.
Update the relevant Q&A in Section 5 to reflect the new behavior.
Remove or update any "Do not say" entries in Section 9 if they no longer apply.

Features expected to graduate from MVP to functional (Phase 2):
- Backend database persistence
- Real file storage
- Email/notification alerts
- Role-based permissions
- Saved views and column preferences
- Functional bulk actions
- Document policy engine
- Multi-asset support coverage
- Renewal workflow stages
- Package / bundle linking
