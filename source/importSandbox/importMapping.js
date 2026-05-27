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

export function suggestImportField(header, sourceType) {
  var normalized = normalizeImportText(header);
  if (!normalized) return { target: '', action: 'Skip', reason: 'Empty source column' };
  if (IMPORT_SKIP_HEADERS.indexOf(normalized) >= 0 || normalized.indexOf('days before expiration') >= 0 || normalized.indexOf('remaining days') >= 0) {
    return { target: '', action: 'Skip', reason: 'Calculated by Opriva' };
  }
  var contact = contactSuggestion(normalized);
  if (contact) return contact;
  var profileSuggestion = profileMatch(normalized, sourceType);
  if (profileSuggestion) return profileSuggestion;
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
    [['con end date','subscription end date','end date','vencimiento licencia','expiration date','renewal date','fecha vencimiento'], 'Expiration / Renewal Date'],
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
    [['warranty end','warranty end date','fecha fin garantia','fecha fin garantía'], 'Warranty End Date'],
    [['purchase date','fecha de la transaccion','fecha de la transacción','transaction date'], 'Purchase Date'],
    [['notes','note','observaciones','comments','comentarios'], 'Notes']
  ];
  for (var i = 0; i < direct.length; i += 1) {
    if (direct[i][0].indexOf(normalized) >= 0) return { target: direct[i][1], action: 'Import', reason: 'Header match' };
  }
  if (normalized.indexOf('end date') >= 0 || normalized.indexOf('vencimiento') >= 0) return { target: 'Expiration / Renewal Date', action: 'Import', reason: 'Date keyword match' };
  if (normalized.indexOf('start date') >= 0 || normalized.indexOf('inicio') >= 0) return { target: 'Start Date', action: 'Import', reason: 'Date keyword match' };
  if (normalized.indexOf('serial') >= 0) return { target: 'Serial Number', action: 'Import', reason: 'Serial keyword match' };
  if (normalized.indexOf('support') >= 0 || normalized.indexOf('soporte') >= 0) return { target: 'Support', action: 'Import', reason: 'Support keyword match' };
  if (normalized.indexOf('margin') >= 0 || normalized.indexOf('margen') >= 0) return { target: '', action: 'Skip', reason: 'Calculated by Opriva' };
  return { target: '', action: 'Review', reason: 'Needs user review' };
}

export function createImportMappings(headers, rowObjects, sourceType) {
  return headers.map(function(header, index) {
    var suggestion = suggestImportField(header, sourceType);
    var sampleRow = (rowObjects || []).find(function(row) { return row[header]; }) || {};
    return {
      sourceColumn: header,
      suggestedField: suggestion.target,
      action: suggestion.action,
      sampleValue: sampleRow[header] || '',
      reason: suggestion.reason,
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
