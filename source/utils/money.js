export function calcMargin(annualValue, cost) {
  var val = parseFloat(annualValue);
  var cst = parseFloat(cost);
  // A $0 cost with a valid sale value is a legitimate 100%-margin item, so cost
  // is only rejected when actually missing ('' / null / undefined), not when 0.
  if (!annualValue || cost === '' || cost === null || cost === undefined || isNaN(val) || isNaN(cst) || val === 0) return { marginDollar: '', margin: '' };
  var dollar = val - cst;
  var pct = ((dollar / val) * 100).toFixed(1);
  return { marginDollar: dollar.toFixed(2), margin: pct };
}
