export const IMPORT_CANONICAL_FIELDS = [
  'Client / Department',
  'License / Product',
  'Product / License Name',
  'Asset Name',
  'Brand',
  'Brand / Manufacturer',
  'Provider / Distributor',
  'Reseller / Partner',
  'Related Contact',
  'License Contact',
  'Contact Name',
  'Contact Email',
  'Contact Role',
  'Quantity',
  'Quantity / Seats',
  'Entitlement Metric',
  'Start Date',
  'Expiration / Renewal Date',
  'Contract Number',
  'PO / Order Reference',
  'Source Status / Vendor Status',
  'Support',
  'Billing Cycle',
  'License Term',
  'Annual Value / Annual Cost',
  'Sale Price / Annual Value',
  'Vendor Cost',
  'Invoice Date',
  'Invoice / Billing Reference',
  'Serial Number',
  'Warranty End Date',
  'Purchase Date',
  // Coverage Import C1 — detection-only canonical fields.
  // Mapping captures these from source files so the user can see them in the
  // Mapping step UI. Builders do NOT create Coverage records yet; the values
  // currently flow as metadata only. Later phases (C2 inference, C3 preview,
  // C4 approval, C5 creation) will materialise Coverage records.
  'Warranty Start Date',
  'Warranty Term',
  'Warranty Provider',
  'Support Start Date',
  'Support End Date',
  'Support Term',
  'Support Provider',
  'Support Level',
  'Support Reference',
  'Maintenance Start Date',
  'Maintenance End Date',
  'Maintenance Term',
  'Coverage Type',
  'Coverage Reference',
  'Support Included',
  'Notes'
];

export const IMPORT_SKIP_HEADERS = [
  'days before expiration',
  'remaining days',
  'system status',
  'risk',
  'margin',
  'margin $',
  'margin %'
];

export const IMPORT_TARGET_OPTIONS = [
  'Licenses',
  'Hardware / Warranty',
  'Contracts / Support Coverage',
  'Certificates / SSL',
  'Renewal Package / Bundle',
  'Mixed / Let Opriva classify rows'
];
