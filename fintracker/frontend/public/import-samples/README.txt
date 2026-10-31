FinTrack SQL import files
=========================

Upload these .sql files from Dashboard or Transactions (drag & drop or file picker).

Column order in each INSERT VALUES (...):
  title, amount, type, category, date, payment_method, status, description

Files:
  - fintrack-sample-import.sql  — 12 sample income/expense rows (use for testing)
  - fintrack-import-template.sql — empty template with one example row

Type must be INCOME or EXPENSE. Date format: YYYY-MM-DD (recommended).
