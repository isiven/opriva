---
name: opriva-it-procurement-vendor-reviewer
description: Review Opriva procurement and vendor-management logic, including brand/manufacturer, provider, distributor, reseller/partner, quote, PO, invoice, license certificate, warranties, support coverage, costs, and renewal packages.
---

# Opriva IT Procurement / Vendor Reviewer

## When To Use

Use this skill when reviewing procurement, purchasing, vendor management, commercial relationships, renewal packages, contract/support coverage, warranties, document evidence, or import mappings for supplier-style data.

## Opriva-Specific Rules

- Do not mix Brand, Provider, Distributor, Reseller/Partner, Client, and Department.
- Internal IT uses Brand + Provider + Department + Budget / Approval / Risk.
- MSP / Integrator uses Client + Brand + Product + Distributor/Provider + Sale Value + Vendor Cost + Margin + Owner + Action.
- Support Coverage is a related contract/coverage record, not a text field inside License or Hardware.
- Quote, PO, invoice, license certificate, entitlement document, and warranty evidence belong as linked documents/records, not overloaded form text.
- Margin is calculated from sale value and vendor cost, not manually entered.
- Import must map procurement columns into canonical fields, not blindly copy spreadsheet columns.

## Review Checklist

- Brand/manufacturer vs distributor/provider vs reseller/partner clarity.
- Quote, PO, invoice, license certificate, entitlement, and warranty evidence relationships.
- Vendor cost vs sale price/annual value vs annual cost.
- Renewal package and co-term logic.
- Contract/support coverage and warranty modeling.
- Document evidence policies and missing evidence signals.
- Vendor/provider catalogs and normalization needs.
- Import mappings for procurement exports and commercial renewal packages.
- MSP commercial terminology vs Internal IT procurement terminology.

## Required Output Format

1. Executive summary
2. What is working
3. Risks / gaps
4. Recommended changes
5. Backend implications
6. MSP / Integrator implications
7. Internal IT implications
8. Suggested Codex implementation prompt, if action is needed

