# sample-data/

**This folder contains anonymized sample files used for import testing and demos.**

## Purpose

These files mirror real-world import structures without exposing any real customer data. They are safe to commit to GitHub and use in demos, automated tests, and onboarding documentation.

## Rules

- All files here must be fully anonymized — no real customer names, domains, serial numbers, license keys, financial figures or contract details.
- Use fictional company names (e.g. "Acme Corp", "Demo Ltd", "Sample Industries").
- Use placeholder serials, domains and dates that are obviously synthetic.
- Prefer `.csv` or `.json` formats. Do not place `.xlsx`, `.xls` or `.pdf` files here — those extensions are excluded by `.gitignore` to prevent accidental leakage of real client exports.
- If a specific format requires `.xlsx`, produce it with clearly fake data and force-add it explicitly: `git add --force sample-data/your-file.xlsx`.

## Sample categories

| Category | Import Mapping Reference |
|---|---|
| Trend Micro licenses | `IMPORT_MAPPING_TREND_MICRO.md` |
| Veeam licenses | `IMPORT_MAPPING_VEEAM.md` *(pending)* |
| Microsoft CSP | `IMPORT_MAPPING_MICROSOFT_CSP.md` *(pending)* |
| QNAP Hardware | `IMPORT_MAPPING_QNAP_HARDWARE.md` |

## Suggested structure

```
sample-data/
  trend-micro/
    sample-tm-licenses.csv
  qnap/
    sample-qnap-hardware.csv
  veeam/
    sample-veeam-licenses.csv
  microsoft-csp/
    sample-csp-report.csv
```

## Anonymization checklist

Before placing any file here, confirm:

- [ ] No real company names or trade names
- [ ] No real email addresses or domains
- [ ] No real serial numbers or device IDs
- [ ] No real license keys or activation codes
- [ ] No real financial amounts (use round placeholder values like $0.00 or $999.00)
- [ ] No real dates that could identify a specific contract or renewal cycle
- [ ] File reviewed by at least one person before committing
