export function calcMargin(annualValue, cost) {
  var val = parseFloat(annualValue);
  var cst = parseFloat(cost);
  if (!annualValue || !cost || isNaN(val) || isNaN(cst) || val === 0) return { marginDollar: '', margin: '' };
  var dollar = val - cst;
  var pct = ((dollar / val) * 100).toFixed(1);
  return { marginDollar: dollar.toFixed(2), margin: pct };
}
