export function normalizeImportText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, ' ')
    .trim();
}

export function normalizedIncludes(headers, expected) {
  var set = headers.map(normalizeImportText);
  return set.indexOf(normalizeImportText(expected)) >= 0;
}

export function detectImportSourceType(headers) {
  if (normalizedIncludes(headers, 'Subscription End Date') && normalizedIncludes(headers, 'Offer Name') && normalizedIncludes(headers, 'Customer Domain')) return 'Microsoft CSP';
  if (normalizedIncludes(headers, 'Con. End Date') && normalizedIncludes(headers, 'Support') && normalizedIncludes(headers, 'Contract status')) return 'Veeam Renewal Export';
  if (normalizedIncludes(headers, 'Clase de artículo') && normalizedIncludes(headers, 'Serial') && normalizedIncludes(headers, 'Fecha de la transacción')) return 'Hardware Sales Export';
  if (normalizedIncludes(headers, 'OC Partner') && normalizedIncludes(headers, 'Vencimiento Licencia') && normalizedIncludes(headers, 'Monto Total')) return 'Commercial Renewal Package';
  return 'Unknown source';
}
