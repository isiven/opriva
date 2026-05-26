import { IMPORT_SKIP_HEADERS } from './importConstants.js';
import { normalizeImportText } from './importText.js';

export function suggestImportField(header) {
  var normalized = normalizeImportText(header);
  if (!normalized) return { target: '', action: 'Skip', reason: 'Empty source column' };
  if (IMPORT_SKIP_HEADERS.indexOf(normalized) >= 0 || normalized.indexOf('days before expiration') >= 0 || normalized.indexOf('remaining days') >= 0) {
    return { target: '', action: 'Skip', reason: 'Calculated by Opriva' };
  }
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

export function createImportMappings(headers, rowObjects) {
  return headers.map(function(header, index) {
    var suggestion = suggestImportField(header);
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
