export function cx(...values) {
  return values.filter(Boolean).join(' ');
}

export function asArray(data) {
  return Array.isArray(data) ? data : [];
}

export function safeText(value, fallback = 'Not specified') {
  return value || fallback;
}

export function riskClass(value) {
  const v = String(value || '').toLowerCase();
  return v.includes('critical') || v.includes('urgent')
    ? 'critical'
    : v.includes('high') || v.includes('approval') || v.includes('blocked') || v.includes('failed') || v.includes('unassigned') || v.includes('needs assignment')
      ? 'high'
      : v.includes('review')
        ? 'review'
        : v.includes('medium') || v.includes('warning')
          ? 'medium'
          : 'low';
}

export function initials(name) {
  return String(name || 'Opriva')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(x => x[0] || '')
    .join('')
    .toUpperCase() || 'OP';
}
