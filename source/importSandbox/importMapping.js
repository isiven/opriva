import { IMPORT_SKIP_HEADERS } from './importConstants.js';
import { normalizeImportText } from './importText.js';

function profileRule(target, action, reason, patterns) {
  return { target: target, action: action, reason: reason, patterns: patterns.map(normalizeImportText) };
}

function contactSuggestion(normalizedHeader) {
  var hasEmail = normalizedHeader.indexOf('email') >= 0
    || normalizedHeader.indexOf('e mail') >= 0
    || normalizedHeader.indexOf('correo') >= 0
    || normalizedHeader === 'mail';
  var hasContact = normalizedHeader.indexOf('contact') >= 0
    || normalizedHeader.indexOf('contacto') >= 0;
  if (hasEmail) {
    return { target: 'Contact Email', action: 'Review', reason: 'Sensitive contact data; candidate related contact' };
  }
  if (hasContact) {
    if (normalizedHeader.indexOf('lic') >= 0 || normalizedHeader.indexOf('license') >= 0 || normalizedHeader.indexOf('licencia') >= 0) {
      return { target: 'License Contact', action: 'Review', reason: 'Sensitive contact data; candidate license contact' };
    }
    return { target: 'Related Contact', action: 'Review', reason: 'Sensitive contact data; candidate related contact' };
  }
  return null;
}

const PROFILE_MAPPING_RULES = {
  'Microsoft CSP': [
    profileRule('Client / Department', 'Import', 'CSP customer context', ['customer name', 'customer domain']),
    profileRule('Product / License Name', 'Import', 'CSP offer/product context', ['offer name', 'offer friendly name', 'renewal offer name']),
    profileRule('Quantity / Seats', 'Import', 'CSP subscription quantity', ['quantity', 'renewal quantity']),
    profileRule('Start Date', 'Import', 'CSP subscription start date', ['subscription start date']),
    profileRule('Expiration / Renewal Date', 'Import', 'CSP subscription end date', ['subscription end date']),
    profileRule('PO / Order Reference', 'Import', 'CSP order reference', ['order id']),
    profileRule('Billing Cycle', 'Import', 'CSP billing cycle context', ['billing cycle type', 'renewal billing cycle type', 'renewal billingcycletype']),
    profileRule('License Term', 'Import', 'CSP lifecycle context', ['term duration', 'termduration']),
    profileRule('Source Status / Vendor Status', 'Import', 'CSP source status', ['subscription status']),
    profileRule('', 'Skip', 'Calculated by Opriva', ['remaining days']),
    profileRule('', 'Review', 'Source identifier; review before importing', ['mpn id', 'producttype']),
  ],
  'Veeam Renewal Export': [
    profileRule('Client / Department', 'Import', 'Veeam customer context', ['customer']),
    profileRule('Product / License Name', 'Import', 'Veeam product context', ['product']),
    profileRule('Provider / Distributor', 'Import', 'Veeam distributor context', ['distributor']),
    profileRule('PO / Order Reference', 'Import', 'Veeam PO reference', ['po number']),
    profileRule('Contract Number', 'Import', 'Veeam contract reference', ['con number', 'contract number']),
    profileRule('Start Date', 'Import', 'Veeam contract start date', ['con start date']),
    profileRule('Expiration / Renewal Date', 'Import', 'Veeam contract end date', ['con end date']),
    profileRule('Support', 'Import', 'Veeam support coverage context', ['support']),
    profileRule('Source Status / Vendor Status', 'Import', 'Veeam contract status', ['contract status']),
    profileRule('Quantity / Seats', 'Import', 'Veeam entitlement quantity', ['sockets #', 'vms #', 'servers #', 'workstations #', 'licenses #', 'users #']),
    profileRule('License Term', 'Import', 'Veeam licensing terms', ['licensing terms']),
    profileRule('Sale Price / Annual Value', 'Review', 'Commercial amount requires user review', ['incumbent total']),
    profileRule('', 'Skip', 'Calculated by Opriva', ['days before expiration']),
    profileRule('Contact Email', 'Review', 'Sensitive contact data; candidate related contact', ['lic contact e mail', 'contact e mail', 'email', 'e mail']),
    profileRule('License Contact', 'Review', 'Sensitive contact data; candidate license contact', ['lic contact', 'license contact']),
    profileRule('Related Contact', 'Review', 'Sensitive contact data; candidate related contact', ['contact']),
  ],
  'Hardware Sales Export': [
    profileRule('Client / Department', 'Import', 'Hardware client context', ['cliente', 'client', 'customer']),
    profileRule('Notes', 'Review', 'Hardware class context; review before importing', ['clase de articulo', 'clase de artículo']),
    profileRule('Purchase Date', 'Import', 'Hardware transaction date', ['fecha de la transaccion', 'fecha de la transacción', 'transaction date']),
    profileRule('PO / Order Reference', 'Import', 'Hardware source reference', ['numero', 'número', 'number']),
    profileRule('Asset Name', 'Import', 'Hardware product/service name', ['nombre completo del producto servicio', 'product service name', 'full product service name']),
    profileRule('Notes', 'Review', 'Hardware description context', ['nota descripcion', 'nota descripción', 'description']),
    profileRule('Quantity / Seats', 'Import', 'Hardware quantity', ['cantidad', 'quantity']),
    profileRule('Serial Number', 'Import', 'Hardware serial number', ['serial', 'serie']),
    profileRule('Notes', 'Review', 'Received-by value may be owner or evidence context', ['recibido por']),
    profileRule('Notes', 'Review', 'Hardware lifecycle context; review before importing', ['ano aproximado de lanzamiento', 'año aproximado de lanzamiento', 'launch year']),
  ],
  'Commercial Renewal Package': [
    profileRule('Contract Number', 'Import', 'Commercial registration/reference', ['# registro', 'registro']),
    profileRule('PO / Order Reference', 'Import', 'Commercial order reference', ['# oc', 'oc partner', 'order reference']),
    profileRule('Client / Department', 'Import', 'Commercial client context', ['cliente', 'client', 'customer']),
    profileRule('Invoice / Billing Reference', 'Import', 'Commercial billing reference', ['# legal de fac', 'legal de fac', 'invoice reference']),
    profileRule('Reseller / Partner', 'Import', 'Commercial reseller context', ['reventa', 'reseller']),
    profileRule('Provider / Distributor', 'Import', 'Commercial distributor context', ['distribuidor', 'distributor']),
    profileRule('Product / License Name', 'Review', 'Ambiguous license column; may be product name or quantity', ['licencias', 'license']),
    profileRule('Expiration / Renewal Date', 'Import', 'License expiration date', ['vencimiento licencia', 'expiration date', 'renewal date']),
    profileRule('Invoice Date', 'Import', 'Invoice date metadata', ['fecha factura', 'invoice date']),
    profileRule('Sale Price / Annual Value', 'Review', 'Commercial amount requires user review', ['monto total', 'total amount']),
  ]
};

const TARGET_MAPPING_RULES = {
  licenses: [
    profileRule('Product / License Name', 'Import', 'License target: product/license context', ['product', 'offer name', 'offer friendly name', 'nombre completo del producto/servicio', 'nombre completo del producto servicio', 'license', 'licencia', 'licencias']),
    profileRule('Client / Department', 'Import', 'License target: client or department context', ['customer', 'customer name', 'customer domain', 'cliente', 'client', 'department', 'departamento']),
    profileRule('Quantity / Seats', 'Import', 'License target: entitlement quantity', ['quantity', 'cantidad', 'licenses #', 'users #', 'sockets #', 'vms #', 'servers #', 'workstations #', 'volume', 'qty', 'seats']),
    profileRule('Expiration / Renewal Date', 'Import', 'License target: renewal or expiration date', ['subscription end date', 'con end date', 'end date', 'vencimiento licencia', 'expiration date', 'renewal date', 'fecha vencimiento']),
    profileRule('Start Date', 'Import', 'License target: license or subscription start date', ['subscription start date', 'con start date', 'start date', 'fecha inicio']),
    profileRule('Brand / Manufacturer', 'Import', 'License target: brand/manufacturer context', ['brand', 'marca', 'manufacturer', 'fabricante']),
    profileRule('Provider / Distributor', 'Import', 'License target: provider/distributor context', ['distributor', 'distribuidor', 'provider', 'vendor', 'supplier', 'proveedor', 'partner']),
    profileRule('Reseller / Partner', 'Import', 'License target: reseller/partner context', ['reseller', 'reventa', 'reseller partner', 'partner reseller', 'partner name']),
    profileRule('PO / Order Reference', 'Import', 'License target: order or PO reference', ['po number', 'order id', '# oc', 'oc partner', 'numero', 'número', 'order reference']),
    profileRule('Contract Number', 'Import', 'License target: contract/reference context', ['con number', 'contract number', 'contrato', '# registro', 'registro']),
    profileRule('Support', 'Review', 'Support coverage may need a related contract/coverage record', ['support', 'soporte']),
    // Coverage Import C1 — license-side support / maintenance / coverage detection.
    // Builders do not yet create Coverage records; values flow through Mapping
    // only so the user can see coverage-related columns. Later phases (C2-C5)
    // will materialise the relationship to a Coverage entity.
    profileRule('Support Start Date', 'Import', 'License target: support start date', ['support start', 'support start date', 'fecha inicio soporte', 'soporte inicio', 'sa start', 'software assurance start', 'subscription support start']),
    profileRule('Support End Date', 'Import', 'License target: support end/expiration date', ['support end', 'support end date', 'support expiration', 'fecha fin soporte', 'soporte fin', 'sa end', 'software assurance end', 'subscription support end', 'veeam support end', 'vmware support end']),
    profileRule('Support Term', 'Import', 'License target: support term/duration', ['support term', 'support duration', 'plazo soporte', 'soporte plazo']),
    profileRule('Support Provider', 'Import', 'License target: support provider', ['support provider', 'proveedor soporte']),
    profileRule('Support Level', 'Import', 'License target: support level / SLA tier', ['support level', 'sla', 'sla level', 'service level', 'nivel soporte', 'nivel servicio']),
    profileRule('Support Reference', 'Import', 'License target: support contract reference', ['support reference', 'support contract', 'support contract number', 'support id']),
    profileRule('Maintenance Start Date', 'Import', 'License target: maintenance start date', ['maintenance start', 'maintenance start date', 'fecha inicio mantenimiento', 'mantenimiento inicio']),
    profileRule('Maintenance End Date', 'Import', 'License target: maintenance end date', ['maintenance end', 'maintenance end date', 'maintenance expiration', 'fecha fin mantenimiento', 'mantenimiento fin']),
    profileRule('Maintenance Term', 'Import', 'License target: maintenance term/duration', ['maintenance term', 'maintenance duration', 'plazo mantenimiento']),
    profileRule('Coverage Type', 'Import', 'License target: coverage type', ['coverage type', 'tipo cobertura', 'tipo de cobertura', 'software assurance', 'subscription support', 'vendor support', 'managed support', 'veeam support', 'vmware support', 'vmware support and subscription']),
    profileRule('Coverage Reference', 'Import', 'License target: coverage reference', ['coverage reference', 'coverage id', 'coverage ref', 'cobertura referencia', 'referencia cobertura']),
    profileRule('Support Included', 'Import', 'License target: support inclusion flag', ['support included', 'soporte incluido', 'with support', 'includes support', 'support yes no']),
    profileRule('Sale Price / Annual Value', 'Review', 'Commercial value requires user review', ['annual value', 'monto total', 'value', 'amount', 'importe', 'sale price', 'precio venta', 'incumbent total']),
    profileRule('Vendor Cost', 'Review', 'Vendor cost requires user review', ['vendor cost', 'cost', 'costo', 'purchase cost']),
  ],
  contracts: [
    profileRule('Contract Number', 'Import', 'Contract target: contract or registration reference', ['con number', 'contract number', 'contrato', '# registro', 'registro']),
    profileRule('Start Date', 'Import', 'Contract target: contract start date', ['con start date', 'contract start date', 'start date', 'fecha inicio']),
    profileRule('Expiration / Renewal Date', 'Import', 'Contract target: contract end or renewal date', ['con end date', 'contract end date', 'end date', 'expiration date', 'renewal date', 'vencimiento licencia', 'fecha vencimiento']),
    profileRule('Support', 'Import', 'Contract target: support coverage context', ['support', 'soporte', 'support coverage']),
    profileRule('Client / Department', 'Import', 'Contract target: covered client or department', ['customer', 'customer name', 'cliente', 'client', 'department', 'departamento']),
    profileRule('Provider / Distributor', 'Import', 'Contract target: provider/distributor context', ['distributor', 'distribuidor', 'provider', 'vendor', 'supplier', 'proveedor', 'partner']),
    profileRule('Product / License Name', 'Review', 'Covered product context; review before treating as primary contract data', ['product', 'offer name', 'offer friendly name', 'nombre completo del producto/servicio', 'nombre completo del producto servicio', 'license', 'licencia', 'licencias']),
    profileRule('PO / Order Reference', 'Import', 'Contract target: PO/order reference', ['po number', 'order id', '# oc', 'oc partner', 'numero', 'número', 'order reference']),
    profileRule('Source Status / Vendor Status', 'Import', 'Contract target: source contract status', ['contract status', 'status', 'estado']),
    profileRule('Sale Price / Annual Value', 'Review', 'Contract commercial amount requires user review', ['annual value', 'monto total', 'value', 'amount', 'importe', 'sale price', 'precio venta', 'incumbent total']),
  ],
  hardware: [
    profileRule('Asset Name', 'Import', 'Hardware target: asset or hardware name', ['asset', 'asset name', 'equipo', 'hardware', 'nombre equipo', 'product', 'nombre completo del producto/servicio', 'nombre completo del producto servicio', 'full product service name']),
    profileRule('Serial Number', 'Import', 'Hardware target: serial number', ['serial', 'serial number', 'serie']),
    profileRule('Client / Department', 'Import', 'Hardware target: client or department context', ['customer', 'customer name', 'cliente', 'client', 'department', 'departamento']),
    profileRule('Quantity / Seats', 'Import', 'Hardware target: asset quantity', ['quantity', 'cantidad', 'qty']),
    profileRule('Purchase Date', 'Import', 'Hardware target: purchase or transaction date', ['purchase date', 'fecha de la transaccion', 'fecha de la transacción', 'transaction date']),
    profileRule('Warranty End Date', 'Import', 'Hardware target: warranty end date', ['warranty end', 'warranty end date', 'warranty expiration', 'fecha fin garantia', 'fecha fin garantía', 'garantia fin', 'garantía fin', 'fecha vencimiento garantia', 'fecha vencimiento garantía']),
    // Coverage Import C1 — warranty / support / maintenance / coverage detection.
    // Captured here so the Mapping step can surface coverage-related columns;
    // builders do not yet promote these into Coverage records (later phases).
    profileRule('Warranty Start Date', 'Import', 'Hardware target: warranty start date', ['warranty start', 'warranty start date', 'fecha inicio garantia', 'fecha inicio garantía', 'garantia inicio', 'garantía inicio']),
    profileRule('Warranty Term', 'Import', 'Hardware target: warranty term/duration', ['warranty term', 'warranty period', 'warranty duration', 'plazo garantia', 'plazo garantía', 'periodo garantia', 'periodo garantía', 'duracion garantia', 'duración garantía']),
    profileRule('Warranty Provider', 'Import', 'Hardware target: warranty provider', ['warranty provider', 'proveedor garantia', 'proveedor garantía']),
    profileRule('Support Start Date', 'Import', 'Hardware target: support start date', ['support start', 'support start date', 'fecha inicio soporte', 'soporte inicio', 'forticare start', 'smartnet start']),
    profileRule('Support End Date', 'Import', 'Hardware target: support end/expiration date', ['support end', 'support end date', 'support expiration', 'fecha fin soporte', 'soporte fin', 'forticare end', 'smartnet end', 'fortiguard end', 'care pack end']),
    profileRule('Support Term', 'Import', 'Hardware target: support term/duration', ['support term', 'support duration', 'plazo soporte', 'soporte plazo']),
    profileRule('Support Provider', 'Import', 'Hardware target: support provider', ['support provider', 'proveedor soporte']),
    profileRule('Support Level', 'Import', 'Hardware target: support level / SLA tier', ['support level', 'sla', 'sla level', 'service level', 'nivel soporte', 'nivel servicio']),
    profileRule('Support Reference', 'Import', 'Hardware target: support contract reference', ['support reference', 'support contract', 'support contract number', 'support id', 'smartnet', 'forticare', 'fortiguard', 'care pack', 'smartnet contract']),
    profileRule('Maintenance Start Date', 'Import', 'Hardware target: maintenance start date', ['maintenance start', 'maintenance start date', 'fecha inicio mantenimiento', 'mantenimiento inicio']),
    profileRule('Maintenance End Date', 'Import', 'Hardware target: maintenance end date', ['maintenance end', 'maintenance end date', 'maintenance expiration', 'fecha fin mantenimiento', 'mantenimiento fin']),
    profileRule('Maintenance Term', 'Import', 'Hardware target: maintenance term/duration', ['maintenance term', 'maintenance duration', 'plazo mantenimiento']),
    profileRule('Coverage Type', 'Import', 'Hardware target: coverage type', ['coverage type', 'tipo cobertura', 'tipo de cobertura', 'manufacturer warranty', 'extended warranty', 'care pack type', 'smartnet type']),
    profileRule('Coverage Reference', 'Import', 'Hardware target: coverage reference', ['coverage reference', 'coverage id', 'coverage ref', 'cobertura referencia', 'referencia cobertura']),
    profileRule('Expiration / Renewal Date', 'Review', 'Hardware target: review whether this is warranty, support or renewal date', ['end date', 'expiration date', 'renewal date', 'vencimiento licencia', 'fecha vencimiento']),
    profileRule('Provider / Distributor', 'Import', 'Hardware target: provider/distributor context', ['distributor', 'distribuidor', 'provider', 'vendor', 'supplier', 'proveedor', 'partner']),
    profileRule('Brand / Manufacturer', 'Import', 'Hardware target: brand/manufacturer context', ['brand', 'marca', 'manufacturer', 'fabricante']),
    profileRule('Notes', 'Review', 'Hardware classification context; review before importing', ['clase de articulo', 'clase de artículo', 'description', 'nota descripcion', 'nota descripción']),
  ],
  certificates: [
    profileRule('Product / License Name', 'Import', 'Certificate target: certificate/domain/common-name context', ['certificate', 'certificado', 'ssl', 'domain', 'dominio', 'common name', 'cn', 'subject']),
    profileRule('Expiration / Renewal Date', 'Import', 'Certificate target: certificate expiration date', ['expiration date', 'expiry date', 'expires', 'end date', 'renewal date', 'vencimiento', 'fecha vencimiento']),
    profileRule('Client / Department', 'Import', 'Certificate target: client or department context', ['customer', 'customer name', 'cliente', 'client', 'department', 'departamento']),
    profileRule('Provider / Distributor', 'Import', 'Certificate target: certificate authority/provider context', ['ca', 'certificate authority', 'issuer', 'provider', 'vendor', 'supplier', 'proveedor']),
    profileRule('Quantity / Seats', 'Review', 'Certificate quantity is optional context', ['quantity', 'cantidad', 'qty']),
    profileRule('PO / Order Reference', 'Import', 'Certificate target: order or PO reference', ['po number', 'order id', '# oc', 'oc partner', 'numero', 'número', 'order reference']),
  ],
  package: [
    profileRule('Client / Department', 'Import', 'Package target: package client or department context', ['customer', 'customer name', 'cliente', 'client', 'department', 'departamento']),
    profileRule('PO / Order Reference', 'Import', 'Package target: PO/order reference', ['po number', 'order id', '# oc', 'oc partner', 'numero', 'número', 'order reference']),
    profileRule('Contract Number', 'Import', 'Package target: contract/registration/reference context', ['con number', 'contract number', 'contrato', '# registro', 'registro']),
    profileRule('Product / License Name', 'Import', 'Package target: covered product/license context for underlying records', ['product', 'offer name', 'offer friendly name', 'nombre completo del producto/servicio', 'nombre completo del producto servicio', 'license', 'licencia', 'licencias']),
    profileRule('Expiration / Renewal Date', 'Import', 'Package target: renewal/expiration date', ['subscription end date', 'con end date', 'end date', 'vencimiento licencia', 'expiration date', 'renewal date', 'fecha vencimiento']),
    profileRule('Sale Price / Annual Value', 'Review', 'Package commercial amount requires user review', ['annual value', 'monto total', 'value', 'amount', 'importe', 'sale price', 'precio venta', 'incumbent total']),
    profileRule('Provider / Distributor', 'Import', 'Package target: provider/distributor context', ['distributor', 'distribuidor', 'provider', 'vendor', 'supplier', 'proveedor', 'partner']),
    profileRule('Reseller / Partner', 'Import', 'Package target: reseller/partner context', ['reseller', 'reventa', 'reseller partner', 'partner reseller', 'partner name']),
    profileRule('Support', 'Review', 'Package target: support coverage may create an underlying contract record', ['support', 'soporte']),
    profileRule('Serial Number', 'Import', 'Package target: hardware serial may create an underlying hardware record', ['serial', 'serial number', 'serie']),
  ]
};

function profileMatch(normalizedHeader, sourceType) {
  var rules = PROFILE_MAPPING_RULES[sourceType] || [];
  for (var i = 0; i < rules.length; i += 1) {
    var rule = rules[i];
    var matched = rule.patterns.some(function(pattern) {
      return normalizedHeader === pattern || normalizedHeader.indexOf(pattern) >= 0;
    });
    if (matched) return { target: rule.target, action: rule.action, reason: rule.reason };
  }
  return null;
}

function importTargetKey(importTarget) {
  if (importTarget === 'Licenses') return 'licenses';
  if (importTarget === 'Hardware' || importTarget === 'Hardware / Warranty') return 'hardware';
  if (importTarget === 'Contracts / Support Coverage') return 'contracts';
  if (importTarget === 'Certificates / SSL') return 'certificates';
  if (importTarget === 'Renewal Package' || importTarget === 'Renewal Package / Bundle') return 'package';
  return 'mixed';
}

function ruleMatch(normalizedHeader, rules) {
  for (var i = 0; i < rules.length; i += 1) {
    var rule = rules[i];
    var matched = rule.patterns.some(function(pattern) {
      return normalizedHeader === pattern || normalizedHeader.indexOf(pattern) >= 0;
    });
    if (matched) return { target: rule.target, action: rule.action, reason: rule.reason };
  }
  return null;
}

function targetProfileMatch(normalizedHeader, importTarget) {
  var targetKey = importTargetKey(importTarget);
  if (targetKey === 'mixed') return null;
  return ruleMatch(normalizedHeader, TARGET_MAPPING_RULES[targetKey] || []);
}

function workspaceContextSuggestion(suggestion, normalizedHeader, workspaceMode) {
  var next = Object.assign({}, suggestion);
  var isInternalIT = workspaceMode === 'Internal IT';
  var isCommercialAmount = normalizedHeader.indexOf('amount') >= 0
    || normalizedHeader.indexOf('monto') >= 0
    || normalizedHeader.indexOf('value') >= 0
    || normalizedHeader.indexOf('importe') >= 0
    || normalizedHeader.indexOf('sale price') >= 0
    || normalizedHeader.indexOf('precio venta') >= 0
    || normalizedHeader.indexOf('annual cost') >= 0;
  if (isInternalIT && next.target === 'Sale Price / Annual Value' && isCommercialAmount) {
    next.target = 'Annual Value / Annual Cost';
    next.action = next.action === 'Skip' ? 'Review' : next.action;
    next.reason = 'Internal IT workspace: treat amount as budget/cost exposure';
  }
  if (isInternalIT && next.target === 'Reseller / Partner') {
    next.action = 'Review';
    next.reason = 'Internal IT workspace: reseller/partner context is optional and should be reviewed';
  }
  if (!isInternalIT && next.target === 'Annual Value / Annual Cost') {
    next.target = 'Sale Price / Annual Value';
    next.reason = 'MSP / Integrator workspace: commercial value context';
  }
  return next;
}

function withConfidence(suggestion, confidence) {
  return Object.assign({ confidence: confidence || 'Medium' }, suggestion);
}

export function suggestImportField(header, sourceType, importTarget, workspaceMode) {
  var normalized = normalizeImportText(header);
  if (!normalized) return withConfidence({ target: '', action: 'Skip', reason: 'Empty source column' }, 'Low');
  if (IMPORT_SKIP_HEADERS.indexOf(normalized) >= 0 || normalized.indexOf('days before expiration') >= 0 || normalized.indexOf('remaining days') >= 0) {
    return withConfidence({ target: '', action: 'Skip', reason: 'Calculated by Opriva' }, 'High');
  }
  var contact = contactSuggestion(normalized);
  if (contact) return withConfidence(contact, 'High');
  var targetSuggestion = targetProfileMatch(normalized, importTarget);
  if (targetSuggestion) return withConfidence(workspaceContextSuggestion(targetSuggestion, normalized, workspaceMode), 'High');
  var profileSuggestion = profileMatch(normalized, sourceType);
  if (profileSuggestion) return withConfidence(workspaceContextSuggestion(profileSuggestion, normalized, workspaceMode), 'High');
  var direct = [
    [['customer','customer name','cliente','client','department','departamento','customer domain'], 'Client / Department'],
    [['product','offer name','offer friendly name','nombre completo del producto servicio','license','licencia','item','description'], 'Product / License Name'],
    [['asset','asset name','equipo','hardware','nombre equipo'], 'Asset Name'],
    [['brand','marca','manufacturer','fabricante'], 'Brand / Manufacturer'],
    [['distributor','distribuidor','provider','partner','supplier','proveedor'], 'Provider / Distributor'],
    [['reseller','reventa','reseller partner','partner reseller','partner name'], 'Reseller / Partner'],
    [['quantity','cantidad','licenses #','users #','sockets #','vms #','servers #','workstations #','volume','qty','seats'], 'Quantity / Seats'],
    [['entitlement metric','metric','metrica'], 'Entitlement Metric'],
    [['con start date','subscription start date','start date','fecha inicio'], 'Start Date'],
    // Expiration / Renewal Date — direct list uses exact-match against the
    // normalized header. The asymmetry with TARGET_MAPPING_RULES (which uses
    // substring match) was leaving compound headers like
    // "Expiration / Renewal Date" -> "expiration renewal date" stuck on Review
    // in Mixed mode. Patterns below cover EN + ES variants plus the literal
    // canonical name. Order matters: coverage entries below in this same
    // direct list (Warranty End Date, Support End Date, Maintenance End Date)
    // remain the first match for their respective compound headers because
    // their exact patterns (e.g. 'warranty expiration', 'support end date')
    // don't appear here.
    [['con end date','subscription end date','end date','expiration date','renewal date','expiration renewal date','renewal expiration date','vencimiento licencia','fecha vencimiento','fecha de vencimiento','fecha de expiracion','fecha de renovacion','expiracion','renovacion','expiration','renewal','vencimiento'], 'Expiration / Renewal Date'],
    [['con number','contract number','contrato'], 'Contract Number'],
    [['po number','order id','# oc','oc partner','numero','número','order reference'], 'PO / Order Reference'],
    [['contract status','subscription status','status','estado'], 'Source Status / Vendor Status'],
    [['support','soporte'], 'Support'],
    [['billing cycle','ciclo facturacion','billing'], 'Billing Cycle'],
    [['license term','term','periodo','termino'], 'License Term'],
    [['annual value','annual cost','monto total','value','amount','importe','sale price','precio venta'], 'Sale Price / Annual Value'],
    [['vendor cost','cost','costo','purchase cost'], 'Vendor Cost'],
    [['invoice date','fecha factura','billing date','fecha facturacion','fecha facturación'], 'Invoice Date'],
    [['invoice','invoice number','billing reference','billing ref','referencia factura','factura'], 'Invoice / Billing Reference'],
    [['serial','serial number','serie'], 'Serial Number'],
    [['warranty end','warranty end date','warranty expiration','fecha fin garantia','fecha fin garantía','garantia fin','garantía fin'], 'Warranty End Date'],
    [['warranty start','warranty start date','fecha inicio garantia','fecha inicio garantía','garantia inicio','garantía inicio'], 'Warranty Start Date'],
    [['warranty term','warranty period','warranty duration','plazo garantia','plazo garantía','periodo garantia','periodo garantía','duracion garantia','duración garantía'], 'Warranty Term'],
    [['warranty provider','proveedor garantia','proveedor garantía'], 'Warranty Provider'],
    [['support start','support start date','fecha inicio soporte','soporte inicio','sa start','software assurance start','subscription support start','forticare start','smartnet start'], 'Support Start Date'],
    [['support end','support end date','support expiration','fecha fin soporte','soporte fin','sa end','software assurance end','subscription support end','veeam support end','vmware support end','forticare end','smartnet end','fortiguard end','care pack end'], 'Support End Date'],
    [['support term','support duration','plazo soporte','soporte plazo'], 'Support Term'],
    [['support provider','proveedor soporte'], 'Support Provider'],
    [['support level','sla','sla level','service level','nivel soporte','nivel servicio'], 'Support Level'],
    [['support reference','support contract','support contract number','support id','smartnet','forticare','fortiguard','care pack','smartnet contract'], 'Support Reference'],
    [['maintenance start','maintenance start date','mantenimiento inicio','fecha inicio mantenimiento'], 'Maintenance Start Date'],
    [['maintenance end','maintenance end date','maintenance expiration','mantenimiento fin','fecha fin mantenimiento'], 'Maintenance End Date'],
    [['maintenance term','maintenance duration','plazo mantenimiento'], 'Maintenance Term'],
    [['coverage type','tipo cobertura','tipo de cobertura','manufacturer warranty','extended warranty','care pack type','smartnet type','software assurance','subscription support','vendor support','managed support','veeam support','vmware support','vmware support and subscription'], 'Coverage Type'],
    [['coverage reference','coverage id','coverage ref','cobertura referencia','referencia cobertura'], 'Coverage Reference'],
    [['support included','soporte incluido','with support','includes support','support yes no'], 'Support Included'],
    [['purchase date','fecha de la transaccion','fecha de la transacción','transaction date'], 'Purchase Date'],
    [['notes','note','observaciones','comments','comentarios'], 'Notes']
  ];
  for (var i = 0; i < direct.length; i += 1) {
    if (direct[i][0].indexOf(normalized) >= 0) {
      return withConfidence(workspaceContextSuggestion({ target: direct[i][1], action: 'Import', reason: 'Header match' }, normalized, workspaceMode), 'Medium');
    }
  }
  // Expiration / Renewal Date fallback — substring match for date keywords.
  // Coverage-specific compound headers (Warranty End Date, Support End Date,
  // Maintenance End Date, plus the *Expiration variants) match earlier in
  // the direct list above, so we never reach this fallback for them. The
  // substrings here are only triggered by generic date headers that the
  // direct exact-match path missed.
  if (normalized.indexOf('end date') >= 0
      || normalized.indexOf('expiration date') >= 0
      || normalized.indexOf('renewal date') >= 0
      || normalized.indexOf('vencimiento') >= 0
      || normalized.indexOf('expiracion') >= 0
      || normalized.indexOf('renovacion') >= 0) return withConfidence({ target: 'Expiration / Renewal Date', action: 'Import', reason: 'Date keyword match' }, 'Medium');
  if (normalized.indexOf('start date') >= 0 || normalized.indexOf('inicio') >= 0) return withConfidence({ target: 'Start Date', action: 'Import', reason: 'Date keyword match' }, 'Medium');
  if (normalized.indexOf('serial') >= 0) return withConfidence({ target: 'Serial Number', action: 'Import', reason: 'Serial keyword match' }, 'Medium');
  if (normalized.indexOf('support') >= 0 || normalized.indexOf('soporte') >= 0) return withConfidence({ target: 'Support', action: 'Import', reason: 'Support keyword match' }, 'Medium');
  if (normalized.indexOf('margin') >= 0 || normalized.indexOf('margen') >= 0) return withConfidence({ target: '', action: 'Skip', reason: 'Calculated by Opriva' }, 'High');
  return withConfidence({ target: '', action: 'Review', reason: 'Needs user review' }, 'Low');
}

export function createImportMappings(headers, rowObjects, sourceType, importTarget, workspaceMode) {
  return headers.map(function(header, index) {
    var suggestion = suggestImportField(header, sourceType, importTarget, workspaceMode);
    var sampleRow = (rowObjects || []).find(function(row) { return row[header]; }) || {};
    return {
      sourceColumn: header,
      suggestedField: suggestion.target,
      action: suggestion.action,
      sampleValue: sampleRow[header] || '',
      reason: suggestion.reason,
      confidence: suggestion.confidence || 'Medium',
      index: index
    };
  });
}

export function getMappedImportValue(rowObj, mappings, targetField) {
  var match = (mappings || []).find(function(mapping) {
    return mapping.action === 'Import' && mapping.suggestedField === targetField;
  });
  return match ? (rowObj[match.sourceColumn] || '') : '';
}

export function getMappedImportValueAny(rowObj, mappings, targetFields) {
  for (var i = 0; i < targetFields.length; i += 1) {
    var value = getMappedImportValue(rowObj, mappings, targetFields[i]);
    if (value) return value;
  }
  return '';
}
