// S2a — pure local filter-tab predicate for OperationalList (Licenses / Hardware /
// Contracts / Documents). Maps a filter-tab label to a predicate over a record's
// positional `row`, resolving columns by NAME (never a fixed index) from `columns`.
// No React, no store, no side effects — unit-testable.
//
// Decision A (no-op fallback): if a tab is unknown OR none of the columns it needs
// exist in the current module/workspace, the predicate returns `true`. This never
// hides rows misleadingly (a tab that cannot be evaluated behaves like "All").
// Known weak tabs left as P2 debt (no-op here): Licenses "High margin risk",
// Licenses "Missing document"/"Missing evidence", Hardware-IT "Missing support".
//
// `module` is accepted for context/future disambiguation; current predicates are
// column-driven and workspace-agnostic.

function indicesFor(colNames, columns) {
  var cols = Array.isArray(columns) ? columns : [];
  var out = [];
  colNames.forEach(function (name) {
    var lname = String(name).toLowerCase();
    for (var i = 0; i < cols.length; i++) {
      if (String(cols[i]).toLowerCase() === lname && out.indexOf(i) === -1) out.push(i);
    }
  });
  return out;
}

function anyColExists(colNames, columns) {
  return indicesFor(colNames, columns).length > 0;
}

// Lowercased, space-joined value of the first matching columns for `row`.
function joined(row, colNames, columns) {
  var r = Array.isArray(row) ? row : [];
  return indicesFor(colNames, columns)
    .map(function (i) { return r[i] == null ? '' : String(r[i]); })
    .join(' ')
    .toLowerCase();
}

function includesAny(text, needles) {
  return needles.some(function (n) { return text.indexOf(n) !== -1; });
}

// True when every present cell for those columns is blank/placeholder.
// Returns false when none of the columns exist (caller decides the no-op).
function valueMissing(row, colNames, columns) {
  var r = Array.isArray(row) ? row : [];
  var idxs = indicesFor(colNames, columns);
  if (!idxs.length) return false;
  return idxs.every(function (i) {
    var v = (r[i] == null ? '' : String(r[i])).trim().toLowerCase();
    return v === '' || v === '-' || v === 'none' || v === 'n/a' || v === 'unassigned' || v === 'missing';
  });
}

/**
 * Does `row` match the active filter tab?
 * @param {Array} row      positional cell values
 * @param {string} tab     tab label (e.g. 'Unassigned', 'Expiring soon')
 * @param {string} module  'Licenses' | 'Hardware' | 'Contracts' | 'Documents' (context only)
 * @param {Array<string>} columns  column names aligned to `row`
 * @returns {boolean}
 */
export function rowPassesTab(row, tab, module, columns) {
  if (!tab || tab === 'All') return true;

  // Run `fn` only when at least one of `cols` exists; otherwise no-op (true).
  function need(cols, fn) {
    if (!anyColExists(cols, columns)) return true; // Decision A
    return fn();
  }

  switch (tab) {
    // ── Urgency (derived Status) ──
    case 'Expiring soon':
    case 'Warranty expiring':
    case '30 days':
      return need(['Status'], function () {
        return includesAny(joined(row, ['Status'], columns), ['expir']);
      });
    case 'Overdue':
    case 'Expired':
      return need(['Status'], function () {
        return includesAny(joined(row, ['Status'], columns), ['expired', 'overdue']);
      });

    // ── Risk ──
    case 'Critical':
      return need(['Risk', 'Status'], function () {
        return includesAny(joined(row, ['Risk', 'Status'], columns), ['critical']);
      });
    case 'High risk':
    case 'High margin risk': // weak on Licenses MSP (no Risk col) -> no-op true (P2)
      return need(['Risk'], function () {
        return includesAny(joined(row, ['Risk'], columns), ['high', 'critical']);
      });

    // ── Ownership ──
    case 'Unassigned':
    case 'Missing owner':
      return need(['Owner', 'Renewal Owner'], function () {
        return valueMissing(row, ['Owner', 'Renewal Owner'], columns);
      });

    // ── Approval / review ──
    case 'CIO approval needed':
    case 'Pending approval':
    case 'Pending review':
      return need(['Approval status', 'Approval Status', 'Legal status', 'Status'], function () {
        return includesAny(
          joined(row, ['Approval status', 'Approval Status', 'Legal status', 'Status'], columns),
          ['approval', 'pending', 'needed', 'review']
        );
      });

    // ── Contracts ──
    case 'Notice period':
      return need(['Notice'], function () {
        return !valueMissing(row, ['Notice'], columns);
      });
    case 'Auto-renewal':
      return need(['Renewal Type', 'Renewal', 'Next action', 'Type', 'Notice'], function () {
        return includesAny(
          joined(row, ['Renewal Type', 'Renewal', 'Next action', 'Type', 'Notice'], columns),
          ['auto']
        );
      });
    case 'Support coverage':
      return need(['Type'], function () {
        return includesAny(joined(row, ['Type'], columns), ['support coverage']);
      });

    // ── Evidence / documents ──
    case 'Missing document':
    case 'Missing evidence': // weak on Licenses (no Document col) -> no-op true (P2)
      return need(['Document'], function () {
        return valueMissing(row, ['Document'], columns);
      });
    case 'Restricted':
      return need(['Access'], function () {
        return includesAny(joined(row, ['Access'], columns), ['restricted']);
      });
    case 'Required missing':
      return need(['Requirement', 'Status'], function () {
        var req = joined(row, ['Requirement'], columns);
        var st = joined(row, ['Status'], columns);
        return includesAny(req, ['required']) &&
          includesAny(st, ['missing', 'pending', 'gap', 'review', 'required']);
      });
    case 'Linked records':
      return need(['Linked record', 'Linked Record'], function () {
        return !valueMissing(row, ['Linked record', 'Linked Record'], columns);
      });

    // ── Hardware support ──
    case 'Missing support': // weak on Hardware-IT (no Support col) -> no-op true (P2)
      return need(['Support'], function () {
        return valueMissing(row, ['Support'], columns);
      });

    default:
      return true; // unknown tab -> no-op (never hide everything)
  }
}
