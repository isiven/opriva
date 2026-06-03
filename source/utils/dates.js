export function getAlertThresholdDays(alertPolicy, customReminderDays) {
  if (alertPolicy === '90 / 60 / 30 days') return 90;
  if (alertPolicy === '60 / 30 / 7 days') return 60;
  if (alertPolicy === '30 / 7 / 1 days') return 30;
  if (alertPolicy === 'Custom') {
    var values = String(customReminderDays || '').split(',').map(function(part) {
      return parseInt(part.trim(), 10);
    }).filter(function(n) { return !isNaN(n) && n >= 0; });
    return values.length ? Math.max.apply(null, values) : 30;
  }
  return 30;
}

export function calcExpirationState(expirationDate, alertPolicy, customReminderDays) {
  if (!expirationDate) return { systemStatus: 'Pending date', daysToExpiration: '' };
  var exp = new Date(expirationDate + 'T00:00:00');
  if (isNaN(exp.getTime())) return { systemStatus: 'Pending date', daysToExpiration: '' };
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var days = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
  var threshold = getAlertThresholdDays(alertPolicy, customReminderDays);
  var systemStatus = days < 0 ? 'Expired' : days <= threshold ? 'Expiring soon' : 'Active';
  var daysLabel = days < 0 ? (Math.abs(days) + ' days overdue') : (days + (days === 1 ? ' day' : ' days'));
  return { systemStatus: systemStatus, daysToExpiration: daysLabel };
}

// Derives a Risk Level ('Low' | 'Medium' | 'High' | 'Critical') from existing
// signals — never a manual input. Minimal local rule (backend will later layer
// missing-evidence, coverage gaps, approval blockers, economic value and
// workspace-configurable risk policies on top):
//   Expired, <= 7 days, or businessCriticality 'Critical' -> Critical
//   <= 30 days or businessCriticality 'High'              -> High
//   <= 90 days or businessCriticality 'Medium'            -> Medium
//   otherwise                                             -> Low
// Days are computed from the expiration date the same way calcExpirationState
// does (independent of the alert policy threshold), so Risk reflects real time
// to expiration. With no valid date, risk falls back to businessCriticality
// alone (Low when absent).
export function calcRiskLevel(expirationDate, alertPolicy, customReminderDays, businessCriticality) {
  var crit = String(businessCriticality || '').trim();
  var days = null;
  if (expirationDate) {
    var exp = new Date(expirationDate + 'T00:00:00');
    if (!isNaN(exp.getTime())) {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      days = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
    }
  }
  if ((days !== null && days <= 7) || crit === 'Critical') return 'Critical';
  if ((days !== null && days <= 30) || crit === 'High') return 'High';
  if ((days !== null && days <= 90) || crit === 'Medium') return 'Medium';
  return 'Low';
}

export function suggestRenewalDate(startDate, licenseTerm) {
  if (!startDate || !licenseTerm || licenseTerm === 'Custom') return '';
  var termYears = { '1 year': 1, '2 years': 2, '3 years': 3, '5 years': 5 };
  var yrs = termYears[licenseTerm];
  if (!yrs) return '';
  var d = new Date(startDate);
  if (isNaN(d.getTime())) return '';
  d.setFullYear(d.getFullYear() + yrs);
  return d.toISOString().slice(0, 10);
}

// Inverse of suggestRenewalDate: given a Start Date and an Expiration /
// Renewal Date, return the matching canonical License Term ('1 year',
// '2 years', '3 years', '5 years') when the span is within ±1 month of
// 12 / 24 / 36 / 60 months; 'Custom' when the span is a positive but
// non-standard duration; '' when either date is missing/invalid or the
// expiration is not after the start.
export function inferLicenseTerm(startDate, expirationDate) {
  if (!startDate || !expirationDate) return '';
  var s = new Date(startDate + 'T00:00:00');
  var e = new Date(expirationDate + 'T00:00:00');
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return '';
  if (e.getTime() <= s.getTime()) return '';
  var months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (e.getDate() < s.getDate()) months -= 1;
  if (Math.abs(months - 12) <= 1) return '1 year';
  if (Math.abs(months - 24) <= 1) return '2 years';
  if (Math.abs(months - 36) <= 1) return '3 years';
  if (Math.abs(months - 60) <= 1) return '5 years';
  return 'Custom';
}

// Numeric days from today (local midnight) until expirationDate.
// Returns a number (negative when overdue) or null when the date is
// missing/invalid. Mirrors the day computation in calcExpirationState, exposed
// separately so aggregations (e.g. "expiring within 30 days") can count without
// parsing the human-readable daysToExpiration label.
export function daysUntil(expirationDate) {
  if (!expirationDate) return null;
  var exp = new Date(expirationDate + 'T00:00:00');
  if (isNaN(exp.getTime())) return null;
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / 86400000);
}
