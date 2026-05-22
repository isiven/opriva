# Opriva User Guide

> This guide covers the current MVP prototype. Some features are local/session-only and do not persist between page refreshes. See [Section 11 — Current MVP Limitations](#11-current-mvp-limitations) for a full list.

---

## Table of Contents

1. [What is Opriva?](#1-what-is-opriva)
2. [Workspace Modes](#2-workspace-modes)
3. [Navigation Overview](#3-navigation-overview)
4. [Record Drawer](#4-record-drawer)
5. [Licenses](#5-licenses)
6. [Hardware](#6-hardware)
7. [Contracts](#7-contracts)
8. [Documents](#8-documents)
   - [Trend Micro Renewal Import Example](#trend-micro-renewal-import-example)
9. [Support Coverage](#9-support-coverage)
10. [Configure Columns and Advanced Filters](#10-configure-columns-and-advanced-filters)
11. [Current MVP Limitations](#11-current-mvp-limitations)
12. [Glossary](#12-glossary)

---

## 1. What is Opriva?

Opriva is an enterprise IT Asset and Renewal Intelligence platform. It helps organizations understand:

- what IT assets and licenses they have
- what expires, when, and at what cost
- who owns the renewal or approval
- which support and warranty coverage is active or lapsing
- what evidence and documentation exists
- what actions need to happen next

Opriva tracks **licenses**, **hardware**, **contracts**, **support coverage**, **documents**, and **tasks** in one operational workspace. It is designed for repeated daily use by IT managers, operations teams, account managers, and finance.

Opriva supports two primary operating models:

- **MSP / Integrator** — for managed service providers and technology integrators managing client accounts
- **Internal IT** — for IT teams managing a company's own internal technology estate

---

## 2. Workspace Modes

### MSP / Integrator

Use this mode if you are a managed service provider, technology integrator, or reseller managing renewals and assets on behalf of multiple client accounts.

**Key concepts in MSP mode:**
- **Client** — the end customer you are managing
- **Brand** — the technology brand or manufacturer
- **Distributor** — your upstream supplier or wholesaler (e.g. TD Synnex, Ingram Micro)
- **Provider** — the implementer or reseller handling delivery
- **Annual Value** — the price charged to the client
- **Vendor Cost** — your cost from the distributor
- **Margin** — the difference between Annual Value and Vendor Cost (calculated automatically)
- **Renewal Owner** — the person responsible for the commercial renewal

In MSP mode, Opriva helps you track client-level renewal pressure, margin exposure, distributor dependencies, and account ownership gaps.

### Internal IT

Use this mode if you are an internal IT team managing your organization's own technology estate.

**Key concepts in Internal IT mode:**
- **Department** — the internal business area that owns or uses the asset
- **Brand** — the technology brand or manufacturer
- **Provider** — your supplier, reseller, or service provider
- **Annual Cost** — what the organization pays for the asset
- **Cost Center** — the internal budget code or department allocation
- **IT Owner / Budget Owner** — the person responsible for the renewal, approval, or spend
- **Approval Status** — whether the renewal or purchase has been approved
- **Business Criticality** — how critical the asset is to business operations

In Internal IT mode, Opriva helps you track department-level renewal exposure, approval blockers, provider dependency, support coverage gaps, and budget impact.

### Switching Workspace Mode

Use the **Mode selector** in the top bar to switch between workspace modes during this MVP prototype phase. The final workspace mode is configured in **Settings → Operating Model**.

---

## 3. Navigation Overview

The sidebar provides access to all major modules. Navigation items adapt to your selected workspace mode.

| Module | Purpose |
|---|---|
| **Dashboard** | Operational command center. Summarizes renewal exposure, risk, AI insights, and priority action queue. |
| **Attention Center** | Triage surface for blockers, missing owners, missing documents, expiring records and approval gaps. |
| **Companies / Clients** *(MSP)* | Manage client portfolio, contacts, ownership, renewal pressure and related records. |
| **Departments** *(Internal IT)* | Track IT ownership, renewal exposure, brand/provider coverage and operational risk by department. |
| **Assets & Renewals / Renewals Forecast** | Worklist of upcoming renewals prioritized by urgency, risk and value. |
| **Licenses** | Full license portfolio across products, clients/departments, expiration dates, owners and values. |
| **Hardware** | Physical IT assets including servers, firewalls, laptops and networking equipment. Tracks warranties, support coverage and ownership. |
| **Contracts** | Commercial agreements, notice periods, document evidence, approval status and support coverage contracts. |
| **Documents** | Global document vault for all evidence — quotes, invoices, contracts, license entitlements, warranties and compliance documents. |
| **Tasks** | Execution layer. Tracks assigned follow-up actions tied to renewals, approvals, quotes and escalations. |
| **Reports** | Executive distribution layer. Packages KPIs, risks, renewal exposure and task status for leadership and finance. |
| **Data Import** | Import records in bulk using workspace-aware templates. |
| **Settings** | Configure workspace mode, company information, operating model and preferences. |

---

## 4. Record Drawer

When you open any record from a table, a **Record Drawer** slides in from the right side. The drawer is the central hub for managing all context related to a record after it has been created.

### Drawer Tabs

#### Overview
Displays a summary of the record including key fields, renewal/expiration details, commercial context, and notes. For newly created records, an **Record setup** guidance block appears to help you complete the record immediately.

#### Relationships
Connect this record to related items such as contracts, licenses, hardware or support coverage. For License and Hardware records, this tab includes an **Add support coverage** action. See [Section 9 — Support Coverage](#9-support-coverage) for details.

#### Documents
Attach and view documents linked to this specific record. Documents attached here are also added to the global Documents vault. Use this tab to attach quotes, invoices, purchase orders, license certificates, warranty documents and compliance evidence relevant to this record.

#### Tasks
Create and track follow-up actions for this record. Tasks created here are linked to the record and appear in the global Tasks module.

#### Activity
View the generated history of events, workflow actions and changes for this record. Activity is generated automatically — you do not enter it manually.

---

## 5. Licenses

The Licenses module tracks your full license portfolio — one record per product or subscription.

### Creating a License

1. Click **New license** from the Licenses screen header.
2. Fill in the required fields for your workspace mode.
3. Click **Save**.
4. The record drawer opens automatically. Use the drawer tabs to complete the record (attach documents, add support coverage, create tasks).

### MSP / Integrator — Required Fields

| Field | Description |
|---|---|
| License / Product | Select the product from the catalog |
| Client | The customer this license belongs to |
| Expiration / Renewal Date | When the license expires |
| Renewal Owner | The person responsible for renewing it |
| Alert Policy | How far in advance alerts should trigger |
| Quantity / Seats | Number of licenses or users |
| Distributor / Provider | Where the license is sourced from |
| Sale Price / Annual Value | What the client pays |
| Vendor Cost | Your cost from the distributor |

Optional: Start Date, License Term, Notes.

### Internal IT — Required Fields

| Field | Description |
|---|---|
| License / Product | Select the product from the catalog |
| Department | The department that owns or uses this license |
| Expiration / Renewal Date | When the license expires |
| IT Owner / Budget Owner | The person responsible for the renewal |
| Alert Policy | How far in advance alerts should trigger |
| Quantity / Seats | Number of licenses or users |
| Provider | Where the license is sourced from |
| Annual Cost | What the organization pays |
| Cost Center | Internal budget code or allocation |
| Approval Status | Current approval state |
| Business Criticality | How critical this license is |

Optional: Notes.

### Calculated Fields (Not Manually Entered)

Opriva calculates the following automatically — you should not and cannot enter these manually:

| Field | How it is calculated |
|---|---|
| System Status | Derived from Expiration Date + Alert Policy |
| Days to Expiration | Today's date vs Expiration Date |
| Margin $ *(MSP only)* | Sale Price − Vendor Cost |
| Margin % *(MSP only)* | Margin $ ÷ Sale Price |
| Brand | Auto-filled from the selected product |

### Expiration Status

| Condition | Status shown |
|---|---|
| No expiration date entered | Pending date |
| Expiration date is in the past | Expired |
| Within the alert window | Expiring soon |
| Outside the alert window | Active |

### Adding Documents to a License

Open the license record → go to the **Documents** tab → click **Attach document**.

### Adding Support Coverage to a License

Open the license record → go to the **Relationships** tab → click **Add support coverage**. See [Section 9](#9-support-coverage).

---

## 6. Hardware

The Hardware module tracks physical IT assets such as servers, firewalls, switches, laptops, desktops, UPS units and storage.

### Creating a Hardware Record

1. Click **New hardware** from the Hardware screen header.
2. Fill in the required fields for your workspace mode.
3. Click **Save**.
4. The record drawer opens. Use the drawer tabs to complete the record.

### Key Hardware Fields

| Field | Description |
|---|---|
| Asset Name | Descriptive name for the asset |
| Type | Category: Server, Firewall, Switch, Laptop, etc. |
| Brand | Manufacturer (e.g. Dell, HP, Cisco) |
| Model | Specific model name or number |
| Serial Number / Asset ID | Unique identifier for the physical asset |
| Client / Department | Who owns or uses this asset |
| Provider | Supplier or service provider |
| Owner | The person responsible for this asset |
| Warranty End | When the hardware warranty expires |
| Alert Policy | When expiration alerts should trigger |

### Support Coverage on Hardware

Support coverage for a hardware asset (manufacturer warranty extensions, managed support contracts, SLA agreements) is **not** a text field inside the Hardware record. It is a separate linked contract.

To add support coverage: open the hardware record → **Relationships** tab → **Add support coverage**. See [Section 9](#9-support-coverage).

---

## 7. Contracts

The Contracts module tracks commercial agreements, obligations, notice periods, document evidence and approval status.

### Contract Fields

| Field | Description |
|---|---|
| Contract Name | Name of the agreement |
| Contract Type | License, Service, Hardware, SaaS, Support, MSA, NDA, etc. |
| Client / Department | The party this contract relates to |
| Provider / Distributor | The counterparty providing the service or product |
| Owner | Person responsible for managing this contract |
| Renewal / End Date | When the contract expires or auto-renews |
| Notice Period | Days required for non-renewal notice |
| Approval Status | Current approval state |
| Alert Policy | When expiration alerts should trigger |

### Support Coverage Contracts

When you add support coverage to a License or Hardware record, Opriva automatically creates a **Contract / Support Coverage** record and adds it to the Contracts module.

You will see these records in the Contracts table with:
- **Type** = Support Coverage
- **Contract** = the coverage name you entered
- **Provider** = the provider you selected
- **Renewal** = the Coverage End Date you entered
- **Next Action** = Review coverage

### Viewing the Covered Record

When you open a Support Coverage contract in the Contracts module:

1. Open the record drawer
2. Go to the **Relationships** tab
3. You will see a **Coverage details** section showing:
   - The covered License or Hardware record name
   - Client / Department (if available)
   - Brand (if available)
   - Coverage Type, Provider, Start/End Date, Owner, Alert Policy
   - Annual Value or Annual Cost (if entered)

---

## 8. Documents

### Two Document Contexts

Opriva has two distinct document surfaces:

| Surface | Purpose |
|---|---|
| **Documents module** (sidebar) | The global document vault — all documents across all records |
| **Documents tab** (record drawer) | Documents attached to one specific record |

When you attach a document from a record drawer, it is automatically added to the global Documents vault as well.

### Uploading a Document (Documents Module)

1. Navigate to **Documents** in the sidebar.
2. Click **Upload document**.
3. Fill in the required fields: Document Name, Document Type, Uploaded By.
4. Select a file from your computer (optional in MVP — metadata is stored locally).
5. Click **Upload document** to save.

### Attaching a Document to a Record (Record Drawer)

1. Open any record (License, Hardware, Contract, etc.).
2. Go to the **Documents** tab.
3. Click **Attach document**.
4. Fill in Document Name, Document Type, Uploaded By.
5. Select a file (optional in MVP).
6. Click **Attach document** to save.

The document appears in both the record's Documents tab and the global Documents vault.

### Document Types

| Type | Description |
|---|---|
| Vendor Quote | Quote received from a vendor or distributor |
| Client Proposal | Proposal sent to a client |
| Purchase Order | Issued purchase order |
| Invoice | Billing document |
| License Entitlement | Vendor-issued license proof: certificates, entitlement documents, licensing confirmations, software rights evidence |
| Signed Contract | Executed contract document |
| Warranty Document | Hardware warranty certificate or evidence |
| Support Evidence | Support agreement or SLA evidence |
| Compliance Evidence | Audit or compliance certification |
| Legal Document | Legal agreements, NDAs, legal correspondence |
| Other | Documents that do not fit the above categories |

> **Note:** Use **License Entitlement** for any vendor-issued proof of purchased software rights. Do not use separate types for "License Certificate" or "Entitlement Document".

### File Uploads in MVP

In the current MVP, selecting a file stores the filename and metadata locally in your browser session. The file itself is not permanently stored on a server. File metadata (name, size, type, upload date) is displayed in the document card.

---

### Trend Micro Renewal Import Example

This example explains how a real Trend Micro renewal from Nextcom maps into Opriva. The same logic applies to any vendor renewal that combines a commercial order record with a vendor-issued entitlement document.

#### The two source files

**The Excel file (commercial renewal register)**

The Nextcom renewal register (`Datos.xlsx`) contains one row per client deal. Each row represents the commercial details of a renewal or purchase — client name, distributor, total license count, expiration date, invoice date, and total amount. This row is the **renewal package or deal record** in Opriva.

**The Trend Micro Entitlement Certificate PDF**

The PDF contains one page per product SKU purchased in the order. All pages share the same customer, reseller, order reference, and dates — only the product name and volume differ per page. This PDF is the **License Entitlement document** in Opriva.

#### How Opriva links them

The reliable link between the Excel row and the PDF is the **PO Number**:

- In the Excel: the `OC Partner` column contains the Trend Micro PO reference (e.g. `TRM-STD-966300`).
- In the PDF: the `PO Number` field on every page contains the same value.

When importing, match `OC Partner` (Excel) to `PO Number` (PDF) to confirm they belong to the same deal.

#### How records are structured in Opriva

| Source | Opriva record |
|---|---|
| Excel row | License record (or Renewal Package) representing the deal |
| PDF file | License Entitlement document attached to the package and all line items |
| Each PDF page / product SKU | Individual License record for that product |

**Example — Banisi order TRM-STD-966300:**

The Excel row shows: Client = Banisi, Distributor = LOL Panama, 2,135 licenses, expires 2026-05-29, total $12,857.51.

The PDF contains 6 product pages (Trend Vision One Credits, Email & Collaboration Security, Cyber Risk Exposure Management, Endpoint Security Core, Endpoint Security Pro, CREM Core). Each page becomes a separate License record in Opriva. The PDF is attached as a single License Entitlement document linked to all 6 license records.

#### One entitlement document, multiple licenses

A single Trend Micro Entitlement Certificate PDF is vendor-issued proof of the entire order. It covers all products purchased in that deal. In Opriva you attach the PDF once as a **License Entitlement** document. It should be linked to the parent package record and to each individual license line item it covers.

This means one License Entitlement document will appear in the Documents tab of multiple License records simultaneously. This is correct — the document is the evidence for the whole order.

#### Manufacturer support included with active maintenance

Trend Micro business products with active maintenance include access to Trend Micro customer support. This is confirmed on every Entitlement Certificate page.

In Opriva, model this as **included Support Coverage** linked to the License record:
- Provider: Trend Micro
- Coverage Type: Manufacturer Support
- Coverage End Date: same as the license expiration date
- Note: Included with active Trend Micro maintenance

This coverage does not require a separate purchase — it is derived from the license being active.

#### Nextcom managed support or SLA — separate Support Coverage

If Nextcom provides its own managed support service, SLA, or a Gold/Silver/Bronze support tier for a client, this is a **separate and independent service** from Trend Micro's included manufacturer support. It must be modeled as a separate Support Coverage contract in Opriva:

- Provider: Nextcom Systems Inc.
- Coverage End Date: per Nextcom's service agreement (may differ from the Trend Micro license expiry)
- Coverage Owner: the Nextcom account manager responsible for the service
- Annual Value: Nextcom's service charge for this coverage

This record appears in the Contracts module as a Support Coverage contract and in the license's Relationships tab alongside the Trend Micro manufacturer support record.

#### Manual import steps (MVP)

For MVP, import is done manually:

1. Create a License record for the deal (using the Excel row data).
2. Create individual License records for each product SKU from the PDF.
3. Attach the PDF as a **License Entitlement** document to the deal record and each license line item.
4. Add **Trend Micro Manufacturer Support** as Support Coverage on each license (end date = license expiry).
5. Add **Nextcom SLA / Managed Support** as a separate Support Coverage contract if applicable.
6. Create tasks for renewal follow-up (quote request, PO confirmation, document upload).

> **MVP limitation:** Grouping all line items into a formal Renewal Package with automated linking is a Phase 2 feature. For now, use the License record itself as the package anchor and link line items and documents to it manually.

---

## 9. Support Coverage

### What is Support Coverage?

Support Coverage in Opriva is a **renewable contract or coverage layer** linked to a specific License or Hardware record. It is not a simple text label — it is a full record with its own renewal date, provider, owner, alert policy and value.

Support Coverage represents:
- manufacturer warranties
- extended warranty programs
- vendor support contracts
- managed support agreements
- SLA (Service Level Agreement) contracts
- maintenance agreements

### MSP / Integrator — Support Coverage

In MSP mode, Support Coverage typically represents support sold to or managed for a client, or vendor support agreements that protect the MSP's service delivery. Examples include:
- Nextcom Gold Support for Banisi's Cisco switches
- Dell ProSupport for a client's server fleet
- Vendor-managed SLA for a client's firewall

### Internal IT — Support Coverage

In Internal IT mode, Support Coverage represents internal coverage for organizational assets. Examples include:
- Manufacturer warranty on a server
- Extended warranty on network infrastructure
- SLA agreement with the organization's main IT provider
- Maintenance agreement for specialized software

### How to Add Support Coverage

Support coverage is added from within a **License or Hardware** record — not from the Contracts module directly.

1. Open a License or Hardware record.
2. Go to the **Relationships** tab.
3. Find the **Support coverage** section.
4. Click **Add support coverage**.
5. Fill in the required fields:

| Field | Description |
|---|---|
| Support / Coverage Name | Select from the list, or choose Other / Custom to enter a name |
| Coverage Type | The type of support (e.g. Manufacturer Warranty, SLA, Managed Support) |
| Provider | Who provides the support |
| Coverage End Date | When the coverage expires — drives renewal alerts |
| Coverage Owner | The person responsible for renewing this coverage |
| Alert Policy | How far in advance alerts should trigger |

Optional fields: Coverage Start Date, Annual Value / Annual Cost, Notes.

6. Click **Save coverage**.

### What Happens After Saving

- The support coverage card appears immediately in the **Relationships tab** of the originating record.
- A new **Contract / Support Coverage** record is created and appears in the **Contracts module**.
- The Contracts row shows the coverage name, type, provider, renewal date and owner.

### Viewing Coverage from the Contracts Module

Navigate to **Contracts** → find the Support Coverage row → open the record drawer → go to **Relationships**. You will see a **Coverage details** panel showing the covered product, client/department, brand, and all coverage specifics.

### Support Coverage Name Options

The default name list includes:
- Nextcom Gold Support
- Nextcom Silver Support
- Nextcom Bronze Support
- Vendor Support
- Manufacturer Warranty
- Extended Warranty
- Managed Support
- SLA Coverage
- Other / Custom *(reveals a free-text field)*

---

## 10. Configure Columns and Advanced Filters

### Configure Columns

Every major Opriva table supports column configuration. Click **Configure columns** (or the columns icon) in the table toolbar to show or hide columns. This lets you adapt the table to the information most relevant to your role or current workflow.

> In the MVP, column visibility changes apply to your current session only. Saved views with persistent column preferences are a Phase 2 feature.

### Advanced Filters

Click **Advanced filters** in the table toolbar to filter records by specific values such as vendor, client, department, expiration status, owner or risk level.

Active filters are shown with a count badge on the filter button. Click **Clear filters** to remove all active filters.

> In the MVP, filters apply to the current session only. Saved filter views are a Phase 2 feature.

---

## 11. Current MVP Limitations

The current Opriva release is a functional prototype. The following limitations apply:

| Limitation | Details |
|---|---|
| **Local/session data only** | All records created during your session are stored in browser memory. Refreshing the page resets all session data to the mock defaults. |
| **No backend database** | There is no server-side storage. Data is not saved between sessions. |
| **File upload is metadata only** | Selecting a file stores the filename, size and type. The actual file is not uploaded to a server. |
| **No real email alerts** | Alert Policy drives status calculations but does not send actual email notifications yet. |
| **No role-based permissions** | All users see all data. Role permissions are not enforced yet. |
| **Some table actions are visual-only** | Buttons like Bulk actions, Saved view, and some tab filters are visual placeholders. Functional behavior is Phase 2. |
| **No multi-asset support coverage** | One support coverage record can be linked to one License or one Hardware record. Covering multiple assets under one contract is Phase 2. |
| **No document policy engine** | Requirement, Access and Validity rules are not enforced. Documents are attached without policy validation. |
| **No renewal workflow automation** | Renewal stages are not driven by workflow events yet. |
| **No package / bundle linking** | Grouping multiple records into a Renewal Package is Phase 2. |

---

## 12. Glossary

| Term | Definition |
|---|---|
| **Workspace** | The operating environment configured for your organization. Determines terminology, navigation, field sets and commercial model. |
| **MSP / Integrator** | A workspace mode for managed service providers and technology integrators managing multiple client accounts. |
| **Internal IT** | A workspace mode for IT teams managing their own organization's technology estate. |
| **License** | A software subscription or entitlement record tracking the product, expiration, owner, cost and renewal context. |
| **Hardware** | A physical IT asset record tracking the device, serial, model, warranty, support coverage and owner. |
| **Contract** | A commercial agreement record tracking parties, obligations, notice periods, document evidence and approval status. |
| **Support Coverage** | A renewable contract/coverage layer linked to a License or Hardware record. Represents warranties, SLAs, maintenance agreements or managed support. |
| **Coverage Owner** | The person responsible for renewing or managing a support coverage agreement. |
| **Document Vault** | The global Documents module that stores all evidence across all records in the workspace. |
| **License Entitlement** | A vendor-issued document proving purchased software rights. Includes license certificates, entitlement documents, licensing confirmations and software rights evidence. |
| **Alert Policy** | A setting that controls how far in advance Opriva flags an expiring record. Options include 90/60/30 days, 60/30/7 days, 30/7/1 days, Custom or Workspace default. |
| **Cost Center** | An internal budget code or department allocation used by Internal IT to track spending by business area. |
| **Renewal Package / Bundle** | A grouping of multiple licenses, contracts, hardware assets and documents under a single renewal or commercial deal. Phase 2 feature. |
| **Local session data** | Data stored in browser memory during the current session only. Lost on page refresh. Applies to all records created in the current MVP. |
