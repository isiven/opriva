# Corexi data architecture and dynamic form logic

Corexi should model every managed business record as a **Tracked Item / Managed Record** with a shared base entity, then attach category-specific detail records and form rules. This avoids one generic static form while keeping reporting, search, alerts, audit history and imports consistent across categories.

## 1. Core base entity: `tracked_items`

Common fields used by every category:

- `tenant_id`
- `company_id` / `client_id`
- `category_id`
- `subcategory_id`
- `item_type`
- `name`
- `description`
- `status`
- `priority`
- `risk_level`
- `owner_user_id`
- `technical_owner_id`
- `commercial_owner_id`
- `vendor_id`
- `brand_id`
- `product_id`
- `sku`
- `start_date`
- `expiration_date`
- `renewal_date`
- `amount`
- `currency`
- `quantity`
- `renewal_status`
- `next_action`
- `alert_policy_id`
- `document_required`
- `has_documents`
- `data_completeness_score`
- `created_by`
- `created_at`
- `updated_at`
- `archived_at`

## 2. Category detail entities

Use one detail table per category family. The base item stores cross-platform behavior; detail tables store category-specific attributes.

| Category | Detail entity | Required examples |
|---|---|---|
| Licenses | `license_details` | brand, product, SKU, quantity, seats, license key, console URL |
| Contracts | `contract_details` | contract type, counterparty, auto-renewal, signed document, legal owner |
| Warranties | `warranty_details` | asset, brand, model, serial number, warranty type, coverage level, provider |
| Services | `service_details` | service level, SLA, owner, contract value |
| Hardware Assets | `asset_details` | brand, model, serial number, location, lifecycle status |
| SSL Certificates | `certificate_details` | domain, certificate type, issuer, technical owner |
| SaaS Subscriptions | `saas_subscription_details` | provider, plan, SKU, seats, billing period, renewal date |
| Certifications | `certification_details` | issuing body, holder, issue date, expiration date, evidence document |
| Insurance Policies | `insurance_policy_details` | insurer, policy type, coverage amount, beneficiary, policy document |
| Maintenance Agreements | `maintenance_details` | provider, covered asset/service, coverage level, SLA, owner |

## 3. Master data catalogs

- Vendors / Providers
- Brands / Manufacturers
- Products & SKUs
- Categories
- Subcategories
- Service Levels
- Templates

Catalog records should be tenant-aware, support aliases, and include duplicate detection before inline creation. Product/SKU templates should prefill category, required fields, units, default alert policy, document requirements and workflow/status options.

## 4. Custom fields

Tenants can define custom fields by module/category. Supported types:

`text`, `number`, `date`, `currency`, `dropdown`, `multi-select`, `checkbox`, `user`, `file`, `URL`, `email`, `phone`, `percentage`.

Each custom field should include category scope, validation, required flag, default value, role visibility, import mapping behavior and reporting eligibility.

## 5. Dynamic create flow

1. Select category/type.
2. Select company/client.
3. Select product/SKU or template.
4. Corexi loads base fields, category-required fields, template defaults and tenant custom fields.
5. The form progressively reveals sections: Basic information, Dates & renewal, Vendor/product, Financials, Ownership, Documents, Alerts and Custom fields.
6. Inline creation allows new vendor, brand, product and category without leaving the form.
7. Duplicate checks suggest existing companies, vendors, brands and products before creating new catalog records.
8. Saving creates the base item, the category detail entity, custom field values, alert policy assignments, document requirements and audit trail entries.

## 6. Enterprise behavior

- Required fields are defined by category, subcategory and template.
- Default alert policies are category-specific and can be overridden by tenant policy.
- Risk scoring is category-specific but normalized into `risk_level` for dashboards and reports.
- Document requirements are category/template-driven.
- Workflow/status options are category-specific.
- All changes write to activity history and audit log, including field changes, document uploads, status transitions, alert changes, imports and AI-assisted edits.

This model scales from an MVP with a base item plus a few detail tables into an enterprise platform with tenant-specific catalogs, custom fields, governance, imports, reporting and auditability.
