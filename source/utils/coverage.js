/**
 * Coverage inference helpers (Coverage Import C2).
 *
 * Pure functions that infer warranty / support / maintenance coverage dates
 * from import row context. NOT connected to UI, Preview, Confirm,
 * RECORD_STORE or session history in C2 — later phases will consume these
 * helpers:
 *   - C3: surface inferred coverages in the Preview step.
 *   - C4: approve / edit / skip per suggestion + confirm gating.
 *   - C5: actually create Coverage records at confirm.
 *
 * Rules summary
 * - File-provided end dates always take precedence over inference.
 * - Warranty: inferred when Purchase Date + Warranty Term are present and
 *   no Warranty End Date came from the file.
 * - Support (License): inferred when License Start + License Expiration are
 *   present AND supportIncluded is truthy, OR when License Start + Support
 *   Term are present. File-provided Support End Date always wins.
 * - Maintenance: never inferred just from License Term or Purchase Date.
 *   Only returns when Maintenance End Date is in the file, OR when
 *   Maintenance Start Date + Maintenance Term are both explicitly provided.
 *
 * Suggestion basis tags follow OPRIVA_IMPORT_TEMPLATE_SPEC v2.0 §C:
 *   - 'file'                       — value came from the source file
 *   - 'inferred:purchase+term'     — Hardware warranty derived from purchase
 *   - 'inferred:license-term'      — License support co-term with license
 *   - 'inferred:maintenance-term'  — Maintenance derived from explicit term
 *   - 'manual'                     — user-entered in preview edit (caller sets)
 *
 * Every inference helper returns null when there is not enough data; it
 * never throws.
 */

/**
 * Coerce an input value into an ISO 'YYYY-MM-DD' string, or return ''.
 * Accepts 'YYYY-MM-DD', 'YYYY-MM-DDTHH:mm:ssZ', Date objects. Anything
 * else returns ''. Safe against null/undefined.
 *
 * @example
 *   normalizeIsoDate('2026-01-17')              // '2026-01-17'
 *   normalizeIsoDate('2026-01-17T00:00:00Z')    // '2026-01-17'
 *   normalizeIsoDate(new Date('2026-01-17'))    // '2026-01-17'
 *   normalizeIsoDate('')                        // ''
 *   normalizeIsoDate('garbage')                 // ''
 *   normalizeIsoDate(null)                      // ''
 */
export function normalizeIsoDate(value) {
  if (!value) return '';
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    return value.toISOString().slice(0, 10);
  }
  var raw = String(value).trim();
  if (!raw) return '';
  var m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return '';
  var y = parseInt(m[1], 10);
  var mo = parseInt(m[2], 10);
  var d = parseInt(m[3], 10);
  if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) return '';
  return y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

/**
 * Add a number of months to an ISO date. Day clamps to the last day of
 * the target month so Feb 29 + 12 months → Feb 28 in a non-leap year.
 * Timezone-safe: avoids UTC drift by using local Date constructor with
 * explicit Y/M/D and rebuilding ISO from local components.
 *
 * @example
 *   addMonthsToDate('2025-08-15', 36)  // '2028-08-15'
 *   addMonthsToDate('2024-02-29', 12)  // '2025-02-28'
 *   addMonthsToDate('2026-01-31', 1)   // '2026-02-28'
 *   addMonthsToDate('2026-01-17', 0)   // '2026-01-17'
 *   addMonthsToDate('', 12)            // ''
 *   addMonthsToDate('garbage', 12)     // ''
 */
export function addMonthsToDate(isoDate, months) {
  var normalized = normalizeIsoDate(isoDate);
  if (!normalized) return '';
  var parts = normalized.split('-');
  var y = parseInt(parts[0], 10);
  var mo = parseInt(parts[1], 10);
  var d = parseInt(parts[2], 10);
  var m = Number(months);
  if (!Number.isFinite(m)) return '';
  var totalMonths = (mo - 1) + m;
  var targetYear = y + Math.floor(totalMonths / 12);
  var targetMonth = ((totalMonths % 12) + 12) % 12; // 0-indexed
  var daysInTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
  var targetDay = Math.min(d, daysInTarget);
  return String(targetYear).padStart(4, '0')
    + '-' + String(targetMonth + 1).padStart(2, '0')
    + '-' + String(targetDay).padStart(2, '0');
}

/**
 * Parse a coverage term string into { months } or null.
 *
 * Recognised inputs:
 *   - "1 year" / "2 years" / "3 years" / "5 years"
 *   - "12 months" / "24 months" / "36 months" / "60 months"
 *   - "1 año" / "2 años" / "3 años" / "5 años"
 *   - "12 meses" / "24 meses" / "36 meses" / "60 meses"
 *   - "1y" / "2y" / "3y" / "5y"
 *   - "12m" / "24m" / "36m" / "60m"
 *   - Also tolerates: yr / yrs / mo / mos and any positive integer count.
 *   - Case-insensitive; trailing whitespace, period or extra text after a
 *     unit boundary is tolerated ("3 years extended", "1 year.").
 *
 * Returns null on:
 *   - empty / null / undefined
 *   - unknown unit
 *   - zero or negative count
 *   - bare number with no unit (ambiguous — caller must add a unit)
 *
 * @example
 *   parseCoverageTerm('3 years')   // { months: 36 }
 *   parseCoverageTerm('36 months') // { months: 36 }
 *   parseCoverageTerm('3 años')    // { months: 36 }
 *   parseCoverageTerm('36 meses')  // { months: 36 }
 *   parseCoverageTerm('3y')        // { months: 36 }
 *   parseCoverageTerm('36m')       // { months: 36 }
 *   parseCoverageTerm('1 mes')     // { months: 1 }
 *   parseCoverageTerm('garbage')   // null
 *   parseCoverageTerm('0 years')   // null
 *   parseCoverageTerm('3')         // null (no unit; ambiguous)
 *   parseCoverageTerm('')          // null
 */
export function parseCoverageTerm(value) {
  if (value === null || value === undefined) return null;
  var raw = String(value).trim().toLowerCase();
  if (!raw) return null;
  // Short form: 1y, 1 y, 36m, 36 m, 5y., 12m extended
  var shortMatch = raw.match(/^(\d+)\s*([ym])(?:\s|\.|$)/);
  if (shortMatch) {
    var nShort = parseInt(shortMatch[1], 10);
    if (nShort > 0) {
      return { months: shortMatch[2] === 'y' ? nShort * 12 : nShort };
    }
  }
  // Long form: 1 year, 2 years, 1 yr, 1 yrs, 1 año, 2 años,
  // 1 month, 12 months, 1 mo, 12 mos, 1 mes, 12 meses.
  // Note: `mes(?:es)?` matches Spanish "mes" / "meses" (singular vs plural).
  var longMatch = raw.match(/^(\d+)\s*(years?|yrs?|años?|months?|mes(?:es)?|mos?)(?:\s|\.|$)/);
  if (longMatch) {
    var nLong = parseInt(longMatch[1], 10);
    if (nLong > 0) {
      var unit = longMatch[2];
      var isYear = /^(year|years|yr|yrs|año|años)$/.test(unit);
      return { months: isYear ? nLong * 12 : nLong };
    }
  }
  return null;
}

/**
 * Parse a support-included flag into a boolean.
 *
 * Truthy values (case-insensitive after trim):
 *   yes, y, true, 1, on, x, checked, included, incluido, incluida,
 *   sí, si, support included, soporte incluido, with support, includes support
 *
 * Anything else (including 'Software Assurance', 'no', empty, vendor SKUs)
 * returns false. Coverage Type with a non-boolean string should be mapped
 * via Coverage Type column, not via supportIncluded.
 *
 * @example
 *   parseSupportIncluded('yes')                 // true
 *   parseSupportIncluded('Sí')                  // true
 *   parseSupportIncluded('included')            // true
 *   parseSupportIncluded(true)                  // true
 *   parseSupportIncluded('Software Assurance')  // false
 *   parseSupportIncluded('no')                  // false
 *   parseSupportIncluded('')                    // false
 *   parseSupportIncluded(null)                  // false
 */
export function parseSupportIncluded(value) {
  if (value === true) return true;
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  var raw = String(value).trim().toLowerCase();
  if (!raw) return false;
  var truthy = [
    'yes', 'y', 'true', '1', 'on', 'x', 'checked',
    'included', 'incluido', 'incluida',
    'sí', 'si',
    'support included', 'soporte incluido',
    'with support', 'includes support'
  ];
  return truthy.indexOf(raw) >= 0;
}

/**
 * Infer a Warranty Coverage row from hardware import context.
 *
 * Precedence:
 *   1. File-provided warrantyEndDate wins. Start = warrantyStartDate ||
 *      purchaseDate || ''. suggestionBasis = 'file'.
 *   2. purchaseDate + warrantyTerm → Start = purchaseDate; End =
 *      purchaseDate + term. suggestionBasis = 'inferred:purchase+term'.
 *   3. Otherwise null.
 *
 * Returns shape:
 *   {
 *     coverageKind: 'Warranty',
 *     startDate: 'YYYY-MM-DD' or '',
 *     endDate: 'YYYY-MM-DD',
 *     suggestionBasis: 'file' | 'inferred:purchase+term'
 *   }
 *
 * @example
 *   inferWarrantyCoverage({ purchaseDate: '2025-08-15', warrantyTerm: '3 years' })
 *   // { coverageKind: 'Warranty', startDate: '2025-08-15',
 *   //   endDate: '2028-08-15', suggestionBasis: 'inferred:purchase+term' }
 *
 *   inferWarrantyCoverage({ warrantyEndDate: '2028-08-15', purchaseDate: '2025-08-15' })
 *   // { coverageKind: 'Warranty', startDate: '2025-08-15',
 *   //   endDate: '2028-08-15', suggestionBasis: 'file' }
 *
 *   inferWarrantyCoverage({ warrantyTerm: '3 years' })       // null (no purchaseDate)
 *   inferWarrantyCoverage({ purchaseDate: '2025-08-15' })    // null (no term)
 *   inferWarrantyCoverage({})                                // null
 */
export function inferWarrantyCoverage(input) {
  var data = input || {};
  var purchaseDate = normalizeIsoDate(data.purchaseDate);
  var warrantyEndDate = normalizeIsoDate(data.warrantyEndDate);
  var warrantyStartDate = normalizeIsoDate(data.warrantyStartDate);
  var warrantyTerm = data.warrantyTerm;

  if (warrantyEndDate) {
    return {
      coverageKind: 'Warranty',
      startDate: warrantyStartDate || purchaseDate || '',
      endDate: warrantyEndDate,
      suggestionBasis: 'file'
    };
  }

  if (purchaseDate && warrantyTerm) {
    var parsed = parseCoverageTerm(warrantyTerm);
    if (parsed && parsed.months > 0) {
      return {
        coverageKind: 'Warranty',
        startDate: purchaseDate,
        endDate: addMonthsToDate(purchaseDate, parsed.months),
        suggestionBasis: 'inferred:purchase+term'
      };
    }
  }

  return null;
}

/**
 * Infer a Support Coverage row from license import context.
 *
 * Precedence:
 *   1. File-provided supportEndDate wins. Start = supportStartDate ||
 *      licenseStartDate || ''. suggestionBasis = 'file'.
 *   2. supportIncluded truthy + licenseStartDate + licenseEndDate → co-term
 *      with the license. Start = licenseStartDate; End = licenseEndDate.
 *      suggestionBasis = 'inferred:license-term'.
 *   3. supportTerm + licenseStartDate → Start = licenseStartDate; End =
 *      licenseStartDate + term. suggestionBasis = 'inferred:license-term'.
 *   4. Otherwise null.
 *
 * Returns shape:
 *   {
 *     coverageKind: 'Support',
 *     startDate: 'YYYY-MM-DD' or '',
 *     endDate: 'YYYY-MM-DD',
 *     suggestionBasis: 'file' | 'inferred:license-term'
 *   }
 *
 * @example
 *   inferSupportCoverageFromLicense({
 *     licenseStartDate: '2026-01-17',
 *     licenseEndDate: '2027-01-17',
 *     supportIncluded: 'yes'
 *   })
 *   // { coverageKind: 'Support', startDate: '2026-01-17',
 *   //   endDate: '2027-01-17', suggestionBasis: 'inferred:license-term' }
 *
 *   inferSupportCoverageFromLicense({
 *     licenseStartDate: '2026-01-17',
 *     supportTerm: '3 years'
 *   })
 *   // { coverageKind: 'Support', startDate: '2026-01-17',
 *   //   endDate: '2029-01-17', suggestionBasis: 'inferred:license-term' }
 *
 *   inferSupportCoverageFromLicense({ supportEndDate: '2027-03-15' })
 *   // { coverageKind: 'Support', startDate: '', endDate: '2027-03-15',
 *   //   suggestionBasis: 'file' }
 *
 *   inferSupportCoverageFromLicense({ supportIncluded: 'no' })    // null
 *   inferSupportCoverageFromLicense({ licenseStartDate: '...' })  // null (no end / no term / no flag)
 *   inferSupportCoverageFromLicense({})                           // null
 */
export function inferSupportCoverageFromLicense(input) {
  var data = input || {};
  var licenseStartDate = normalizeIsoDate(data.licenseStartDate);
  var licenseEndDate = normalizeIsoDate(data.licenseEndDate);
  var supportEndDate = normalizeIsoDate(data.supportEndDate);
  var supportStartDate = normalizeIsoDate(data.supportStartDate);
  var supportTerm = data.supportTerm;
  var supportIncluded = parseSupportIncluded(data.supportIncluded);

  if (supportEndDate) {
    return {
      coverageKind: 'Support',
      startDate: supportStartDate || licenseStartDate || '',
      endDate: supportEndDate,
      suggestionBasis: 'file'
    };
  }

  if (supportIncluded && licenseStartDate && licenseEndDate) {
    return {
      coverageKind: 'Support',
      startDate: licenseStartDate,
      endDate: licenseEndDate,
      suggestionBasis: 'inferred:license-term'
    };
  }

  if (supportTerm && licenseStartDate) {
    var parsed = parseCoverageTerm(supportTerm);
    if (parsed && parsed.months > 0) {
      return {
        coverageKind: 'Support',
        startDate: licenseStartDate,
        endDate: addMonthsToDate(licenseStartDate, parsed.months),
        suggestionBasis: 'inferred:license-term'
      };
    }
  }

  return null;
}

/**
 * Infer a Maintenance Coverage row.
 *
 * Maintenance is intentionally conservative — it is NEVER inferred from
 * License Term alone or from Purchase Date alone. The semantic overlap
 * between Warranty / Support / Maintenance is too high to guess. Only
 * returns when:
 *
 *   1. File-provided maintenanceEndDate wins. suggestionBasis = 'file'.
 *   2. maintenanceStartDate + explicit maintenanceTerm → Start =
 *      maintenanceStartDate; End = maintenanceStartDate + term.
 *      suggestionBasis = 'inferred:maintenance-term'.
 *   3. Otherwise null.
 *
 * Returns shape:
 *   {
 *     coverageKind: 'Maintenance',
 *     startDate: 'YYYY-MM-DD' or '',
 *     endDate: 'YYYY-MM-DD',
 *     suggestionBasis: 'file' | 'inferred:maintenance-term'
 *   }
 *
 * @example
 *   inferMaintenanceCoverage({ maintenanceEndDate: '2027-08-15' })
 *   // { coverageKind: 'Maintenance', startDate: '',
 *   //   endDate: '2027-08-15', suggestionBasis: 'file' }
 *
 *   inferMaintenanceCoverage({
 *     maintenanceStartDate: '2025-08-15',
 *     maintenanceTerm: '3 years'
 *   })
 *   // { coverageKind: 'Maintenance', startDate: '2025-08-15',
 *   //   endDate: '2028-08-15', suggestionBasis: 'inferred:maintenance-term' }
 *
 *   inferMaintenanceCoverage({ purchaseDate: '2025-08-15' })   // null
 *   inferMaintenanceCoverage({ licenseStartDate: '...' })       // null
 *   inferMaintenanceCoverage({})                                // null
 */
export function inferMaintenanceCoverage(input) {
  var data = input || {};
  var maintenanceEndDate = normalizeIsoDate(data.maintenanceEndDate);
  var maintenanceStartDate = normalizeIsoDate(data.maintenanceStartDate);
  var maintenanceTerm = data.maintenanceTerm;

  if (maintenanceEndDate) {
    return {
      coverageKind: 'Maintenance',
      startDate: maintenanceStartDate || '',
      endDate: maintenanceEndDate,
      suggestionBasis: 'file'
    };
  }

  if (maintenanceStartDate && maintenanceTerm) {
    var parsed = parseCoverageTerm(maintenanceTerm);
    if (parsed && parsed.months > 0) {
      return {
        coverageKind: 'Maintenance',
        startDate: maintenanceStartDate,
        endDate: addMonthsToDate(maintenanceStartDate, parsed.months),
        suggestionBasis: 'inferred:maintenance-term'
      };
    }
  }

  return null;
}

// -------------------------------------------------------------------------
// Coverage Import C3 — preview wrappers (data-layer only)
// -------------------------------------------------------------------------
//
// buildSuggestedCoveragesForLicense and buildSuggestedCoveragesForHardware
// produce a Coverage-suggestion array for a single import preview row.
//
// They call the C2 inference helpers above and enrich each suggestion with
// catalog metadata (Coverage Type, Provider, Support Level, Reference)
// extracted from the row's mapped fields. They do NOT create Coverage
// records — Phase C5 will materialise them at confirm.
//
// The wrappers accept already-extracted raw values from the caller; the
// caller is responsible for reading mappings via getMappedImportValue and
// passing the values in. This keeps the helpers pure and testable.
//
// Output shape per suggestion:
//   {
//     coverageKind: 'Warranty' | 'Support' | 'Maintenance',
//     coverageType: string,         // 'Manufacturer Warranty' | 'Vendor Support' | ...
//     startDate: 'YYYY-MM-DD' | '',
//     endDate: 'YYYY-MM-DD',
//     suggestionBasis: 'file' | 'inferred:purchase+term' | 'inferred:license-term' | 'inferred:maintenance-term',
//     provider: string,             // '' when unknown
//     supportLevel: string,         // '' when unknown
//     reference: string             // '' when unknown
//   }

function enrichCoverageSuggestion(base, extras) {
  if (!base) return null;
  return {
    coverageKind: base.coverageKind,
    coverageType: extras.coverageType || '',
    startDate: base.startDate || '',
    endDate: base.endDate,
    suggestionBasis: base.suggestionBasis,
    provider: extras.provider || '',
    supportLevel: extras.supportLevel || '',
    reference: extras.reference || ''
  };
}

/**
 * Build Coverage suggestions for a license preview row.
 *
 * @param {object} fields - mapped values for the row
 * @param {string} fields.coverageType        - mapped Coverage Type value
 * @param {string} fields.coverageReference   - mapped Coverage Reference value
 * @param {string} fields.supportProvider     - mapped Support Provider value
 * @param {string} fields.supportLevel        - mapped Support Level value
 * @param {string} fields.supportReference    - mapped Support Reference value
 * @param {string} fields.supportStartDate    - mapped Support Start Date value
 * @param {string} fields.supportEndDate      - mapped Support End Date value
 * @param {string} fields.supportTerm         - mapped Support Term value
 * @param {string} fields.supportIncluded     - mapped Support Included value (also accepts legacy 'Support' text)
 * @param {string} fields.maintenanceStartDate - mapped Maintenance Start Date value
 * @param {string} fields.maintenanceEndDate  - mapped Maintenance End Date value
 * @param {string} fields.maintenanceTerm     - mapped Maintenance Term value
 * @param {string} fields.licenseStartDate    - already-normalized License Start (precomputed by buildImportPreview)
 * @param {string} fields.licenseEndDate      - already-normalized License Expiration (precomputed by buildImportPreview)
 * @param {string} fields.parentBrand         - the license's resolved Brand (used as provider fallback)
 *
 * @returns {Array} 0-2 Coverage suggestions (Support + Maintenance).
 */
export function buildSuggestedCoveragesForLicense(fields) {
  var data = fields || {};
  var suggestions = [];

  var support = inferSupportCoverageFromLicense({
    licenseStartDate: data.licenseStartDate,
    licenseEndDate: data.licenseEndDate,
    supportStartDate: data.supportStartDate,
    supportEndDate: data.supportEndDate,
    supportTerm: data.supportTerm,
    supportIncluded: data.supportIncluded
  });
  if (support) {
    suggestions.push(enrichCoverageSuggestion(support, {
      coverageType: data.coverageType || 'Vendor Support',
      provider: data.supportProvider || data.parentBrand || '',
      supportLevel: data.supportLevel || '',
      reference: data.supportReference || data.coverageReference || ''
    }));
  }

  var maintenance = inferMaintenanceCoverage({
    maintenanceStartDate: data.maintenanceStartDate,
    maintenanceEndDate: data.maintenanceEndDate,
    maintenanceTerm: data.maintenanceTerm
  });
  if (maintenance) {
    suggestions.push(enrichCoverageSuggestion(maintenance, {
      coverageType: data.coverageType || 'Maintenance Agreement',
      provider: data.supportProvider || data.parentBrand || '',
      supportLevel: '',
      reference: data.coverageReference || ''
    }));
  }

  return suggestions;
}

/**
 * Build Coverage suggestions for a hardware preview row.
 *
 * Hardware can produce up to three suggestions (Warranty + Support +
 * Maintenance). Hardware Support is only surfaced when an explicit Support
 * End Date is present in the file — there is no Hardware-anchored Support
 * inference rule in the spec; that path runs through
 * inferSupportCoverageFromLicense with no license dates so only the file
 * branch fires.
 *
 * @param {object} fields - mapped values for the row
 * @param {string} fields.coverageType        - mapped Coverage Type value
 * @param {string} fields.coverageReference   - mapped Coverage Reference value
 * @param {string} fields.warrantyProvider    - mapped Warranty Provider value
 * @param {string} fields.warrantyStartDate   - mapped Warranty Start Date value
 * @param {string} fields.warrantyEndDate     - mapped Warranty End Date (precomputed and normalized)
 * @param {string} fields.warrantyTerm        - mapped Warranty Term value
 * @param {string} fields.supportProvider     - mapped Support Provider value
 * @param {string} fields.supportLevel        - mapped Support Level value
 * @param {string} fields.supportReference    - mapped Support Reference value
 * @param {string} fields.supportStartDate    - mapped Support Start Date value
 * @param {string} fields.supportEndDate      - mapped Support End Date value
 * @param {string} fields.maintenanceStartDate - mapped Maintenance Start Date value
 * @param {string} fields.maintenanceEndDate  - mapped Maintenance End Date value
 * @param {string} fields.maintenanceTerm     - mapped Maintenance Term value
 * @param {string} fields.purchaseDate        - already-normalized Purchase Date
 * @param {string} fields.parentBrand         - the hardware's resolved Brand (used as provider fallback)
 *
 * @returns {Array} 0-3 Coverage suggestions (Warranty + Support + Maintenance).
 */
export function buildSuggestedCoveragesForHardware(fields) {
  var data = fields || {};
  var suggestions = [];

  var warranty = inferWarrantyCoverage({
    purchaseDate: data.purchaseDate,
    warrantyEndDate: data.warrantyEndDate,
    warrantyStartDate: data.warrantyStartDate,
    warrantyTerm: data.warrantyTerm
  });
  if (warranty) {
    suggestions.push(enrichCoverageSuggestion(warranty, {
      coverageType: data.coverageType || 'Manufacturer Warranty',
      provider: data.warrantyProvider || data.parentBrand || '',
      supportLevel: '',
      reference: data.coverageReference || ''
    }));
  }

  // Hardware Support: only surface file-provided end date — no inference path
  // is defined for hardware-anchored Support coverage. Pass no license
  // anchors / no supportIncluded / no supportTerm so only the file branch
  // inside inferSupportCoverageFromLicense fires.
  var support = inferSupportCoverageFromLicense({
    supportEndDate: data.supportEndDate,
    supportStartDate: data.supportStartDate
  });
  if (support) {
    suggestions.push(enrichCoverageSuggestion(support, {
      coverageType: data.coverageType || 'Vendor Support',
      provider: data.supportProvider || data.parentBrand || '',
      supportLevel: data.supportLevel || '',
      reference: data.supportReference || data.coverageReference || ''
    }));
  }

  var maintenance = inferMaintenanceCoverage({
    maintenanceStartDate: data.maintenanceStartDate,
    maintenanceEndDate: data.maintenanceEndDate,
    maintenanceTerm: data.maintenanceTerm
  });
  if (maintenance) {
    suggestions.push(enrichCoverageSuggestion(maintenance, {
      coverageType: data.coverageType || 'Maintenance Agreement',
      provider: data.warrantyProvider || data.supportProvider || data.parentBrand || '',
      supportLevel: '',
      reference: data.coverageReference || ''
    }));
  }

  return suggestions;
}

// -------------------------------------------------------------------------
// Coverage Import C5 — materialise approved / edited suggestions into
// Coverage records at confirm time.
// -------------------------------------------------------------------------
//
// buildCoverageRecordsForBatch consumes the C3 suggestedCoverages on each
// preview item + the C4 coverageDecisions map and produces an array of
// Coverage records ready to be inserted into RECORD_STORE.contracts via the
// existing insertImportedRecords pipeline.
//
// Rules
//   - Only 'approved' or 'edited' decisions produce records. 'pending' and
//     'skipped' produce nothing.
//   - Orphan suppression: if the parent License/Hardware was dedup-skipped at
//     insert time (i.e. not in licenseCreated / hardwareCreated), the
//     coverage is skipped too — no orphans without a parent.
//   - Edited values win over original suggestion values per field.
//   - Duplicate detection key shape:
//       'coverage|<coveredModule>|<coveredRecordId>|<coverageKind>|<endDate>'
//     so re-imports and cross-source duplicates are caught by
//     insertImportedRecords's existing knownKeys dedup logic.
//   - Contracts target rows never produce coverages (C3 producer already
//     enforces this; this builder also guards by parentModule).
//
// TODO backend Phase 2:
//   - Persist to a dedicated coverage_records table (vs reusing contracts).
//   - Emit a coverage_create_event per coverage with decidedBy / decidedAt /
//     suggestionBasis / decisionStatus / editedFields[] for audit trail.
//   - RBAC gate for who can confirm imports that create coverages.
//   - Re-import reconciliation: detect existing coverages by hash and offer
//     merge / replace / duplicate per row.
//   - Manual coverage parity: openSupportCoverage save should set the same
//     duplicateKeys shape so manual + imported coverages dedupe against each
//     other across sources.

function buildCoverageDuplicateKeys(coveredModule, coveredRecordId, coverageKind, endDate) {
  if (!coveredModule || !coveredRecordId || !coverageKind || !endDate) return [];
  return ['coverage|' + coveredModule + '|' + coveredRecordId + '|' + coverageKind + '|' + endDate];
}

function noticeFromAlertPolicy(ap) {
  if (ap === '90 / 60 / 30 days') return '90 days';
  if (ap === '60 / 30 / 7 days')  return '60 days';
  if (ap === '30 / 7 / 1 days')   return '30 days';
  if (ap === 'Workspace default') return 'Workspace default';
  if (ap === 'Custom')            return 'Custom';
  return '-';
}

function buildCoverageContractsRow(cov, workspaceMode) {
  var isIT = workspaceMode === 'Internal IT';
  var cols = isIT
    ? ['Contract','Type','Department','Provider','Owner','Document','Renewal','Notice','Approval status','Next action','Risk']
    : ['Contract','Type','Client','Provider / Distributor','Owner','Document','Renewal','Notice','Legal status','Next action','Risk'];
  var valueMap = isIT
    ? { 'Contract': cov.name, 'Type': 'Support Coverage', 'Department': cov.coveredClientOrDepartment || '-', 'Provider': cov.provider || '-', 'Owner': cov.owner || 'Unassigned', 'Document': '-', 'Renewal': cov.endDate || '-', 'Notice': noticeFromAlertPolicy(cov.alertPolicy), 'Approval status': 'Pending', 'Next action': 'Review coverage', 'Risk': '-' }
    : { 'Contract': cov.name, 'Type': 'Support Coverage', 'Client': cov.coveredClientOrDepartment || '-', 'Provider / Distributor': cov.provider || '-', 'Owner': cov.owner || 'Unassigned', 'Document': '-', 'Renewal': cov.endDate || '-', 'Notice': noticeFromAlertPolicy(cov.alertPolicy), 'Legal status': 'Active', 'Next action': 'Review coverage', 'Risk': '-' };
  return cols.map(function(c) { return valueMap[c] !== undefined ? valueMap[c] : '-'; });
}

function buildOneCoverageRecord(parent, parentModule, effective, decision, rowNumber, idx, params) {
  var coveredRecordName = (parent && parent.meta && parent.meta.displayName) || (parent && parent.row && parent.row[0]) || '';
  var coveredClientOrDepartment = (parent && parent.meta && parent.meta.clientDepartment) || '';
  var coveredBrand = (parent && parent.meta && parent.meta.brandManufacturer) || '';
  var nowISO = new Date().toISOString();
  var id = 'imp-cov-' + nowISO.replace(/[^0-9]/g, '').slice(0, 14) + '-' + rowNumber + '-' + (effective.coverageKind || 'unk') + '-' + idx + '-' + Math.random().toString(36).slice(2, 7);
  var coverageName = (effective.coverageType || 'Support Coverage') + ' — ' + (coveredRecordName || 'Imported record');
  var cov = {
    id: id,
    moduleKey: 'contracts',
    contractType: 'Support Coverage',
    source: 'supportCoverage',
    importedFrom: 'importSandbox',
    name: coverageName,
    coverageKind: effective.coverageKind,
    coverageType: effective.coverageType || '',
    startDate: effective.startDate || '',
    endDate: effective.endDate || '',
    provider: effective.provider || '',
    supportLevel: effective.supportLevel || '',
    reference: effective.reference || '',
    suggestionBasis: effective.suggestionBasis || '',
    decisionStatus: decision.status,
    coveredModule: parentModule,
    coveredRecordId: parent.id,
    coveredRecordName: coveredRecordName,
    coveredClientOrDepartment: coveredClientOrDepartment,
    coveredBrand: coveredBrand,
    importBatchId: params.batchId || '',
    rowNumber: rowNumber,
    importFileName: params.fileName || '',
    workspaceMode: params.workspaceMode || '',
    importedAt: nowISO,
    createdAt: nowISO.slice(0, 10),
    owner: 'Unassigned',
    alertPolicy: 'Workspace default',
    value: '',
    notes: 'Imported from ' + (params.fileName || 'file') + ' row ' + rowNumber + '.',
    duplicateKeys: buildCoverageDuplicateKeys(parentModule, parent.id, effective.coverageKind, effective.endDate || ''),
    // REL-1d: additive standard relationship vocabulary. covered* above is legacy
    // (points to the covered record); target* is the standard naming for a future
    // backend `relationships` table. No consumer reads these fields yet, and they
    // are not part of duplicateKeys / dedup.
    relationshipType:      'coverage_covers_record',
    sourceModule:          'contracts',
    sourceRecordId:        id,
    sourceRecordName:      coverageName,
    targetModule:          parentModule,
    targetRecordId:        parent.id,
    targetRecordName:      coveredRecordName,
    direction:             'source_to_target',
    relationshipCreatedAt: nowISO.slice(0, 10)
  };
  return {
    id: id,
    row: buildCoverageContractsRow(cov, params.workspaceMode || ''),
    meta: cov
  };
}

/**
 * Build all Coverage records for a Confirm Import call.
 *
 * @param {object} params
 * @param {Array} params.previewItems      - importPreview.preview array
 * @param {object} params.decisions        - coverageDecisions state
 * @param {Array} params.licenseCreated    - licenseInsert.created (post-dedup)
 * @param {Array} params.hardwareCreated   - hardwareInsert.created (post-dedup)
 * @param {string} params.batchId          - shared import batch ID for traceability
 * @param {string} params.fileName         - source file name
 * @param {string} params.workspaceMode    - 'MSP / Integrator' | 'Internal IT'
 *
 * @returns {Array} Coverage records (each with id, row, meta) ready for
 *                  insertImportedRecords('contracts', ...).
 */
export function buildCoverageRecordsForBatch(params) {
  var data = params || {};
  var preview = data.previewItems || [];
  var decisions = data.decisions || {};
  var licenseCreated = data.licenseCreated || [];
  var hardwareCreated = data.hardwareCreated || [];
  var coverages = [];
  preview.forEach(function(item) {
    if (!item || !item.suggestedCoverages || !item.suggestedCoverages.length) return;
    // Determine parent module from preview item's moduleLabel. C3 producer
    // only emits suggestedCoverages for license and hardware targets, so
    // contracts / review / package targets are guarded here defensively.
    var parentModule;
    if (item.moduleLabel === 'Hardware / Warranty') parentModule = 'hardware';
    else if (item.moduleLabel === 'License') parentModule = 'licenses';
    else return;
    var pool = parentModule === 'hardware' ? hardwareCreated : licenseCreated;
    var parent = pool.find(function(r) {
      return r && r.meta && r.meta.rowNumber === item.rowNumber;
    });
    if (!parent) return; // parent was dedup-skipped — no orphan coverage
    item.suggestedCoverages.forEach(function(cov, idx) {
      var key = item.rowNumber + '::' + cov.coverageKind;
      var decision = decisions[key];
      if (!decision) return;
      if (decision.status !== 'approved' && decision.status !== 'edited') return;
      var effective = (decision.status === 'edited' && decision.edits)
        ? Object.assign({}, cov, decision.edits)
        : cov;
      if (!effective.endDate) return; // malformed suggestion (no end date) — skip
      coverages.push(buildOneCoverageRecord(parent, parentModule, effective, decision, item.rowNumber, idx, data));
    });
  });
  return coverages;
}
