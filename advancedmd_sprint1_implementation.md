# AdvancedMD Data Pipeline Sprint-1 Implementation Guide

## Overview
Build a minimal data model with 4 core tables to enable claims dashboard functionality via ODBC connection to Databricks SQL Warehouse.

## Developer Assignments

### Dev A - Claims & Status (2 tables)
**Tables:** `silver.advmd_claims`, `silver.advmd_claim_status`

### Dev B - Payments & Patients (2 tables)
**Tables:** `silver.advmd_payments`, `silver.patients`

## Sprint Timeline: 1-2 days

---

## JIRA Tickets / Task Breakdown

### Ticket ADVMD-001 (Dev A): Build silver.advmd_claims table
**Story Points:** 3
**Acceptance Criteria:**
- [ ] Create table with unique `claim_line_key` as primary identifier
- [ ] If claim_line_key doesn't exist in source, compose from claim_id + line_number
- [ ] Implement upsert logic using MERGE statement
- [ ] Map all required fields from AdvancedMD export
- [ ] Unit tests:
  - No duplicates on claim_line_key
  - service_date NOT NULL rate ≥ 99%
  - billed_amount > 0 for all records
  - Row count matches source ± 1%

**Deliverables:**
1. DDL script for silver.advmd_claims
2. Upsert/merge procedure
3. Unit test results
4. Sample data validation (10 rows)

---

### Ticket ADVMD-002 (Dev A): Build silver.advmd_claim_status table
**Story Points:** 3
**Acceptance Criteria:**
- [ ] Create status history table with proper timestamps
- [ ] Implement status normalization mapping:
  ```
  Raw Status → status_norm
  -----------------------
  'SUBMITTED', 'SENT' → 'Submitted'
  'ACCEPTED', 'ACKNOWLEDGED' → 'Accepted'
  'DENIED', 'REJECTED' → 'Denied'
  'PAID', 'PAYMENT_RECEIVED' → 'Paid'
  'REWORK', 'RESUBMITTED' → 'Reworked'
  ```
- [ ] Create view for latest status using ROW_NUMBER()
- [ ] Unit tests:
  - Every claim_line_key has at least one status record
  - Latest status = MAX(status_ts) per claim
  - No NULL status_ts values
  - Denial codes populated when status='Denied'

**Deliverables:**
1. DDL script for silver.advmd_claim_status
2. Status normalization logic/mapping table
3. Latest status view
4. Test results showing status distribution

---

### Ticket ADVMD-003 (Dev B): Build silver.advmd_payments table
**Story Points:** 3
**Acceptance Criteria:**
- [ ] Load payment records with proper categorization
- [ ] Implement payment_type classification:
  ```
  'ERA', 'EOB', 'INSURANCE_PAYMENT' → 'insurance'
  'PATIENT_PAYMENT', 'COPAY' → 'patient'
  'ADJUSTMENT', 'WRITEOFF' → 'adjustment'
  'TAKEBACK', 'REFUND' → 'takeback'
  ```
- [ ] Create rollup view aggregating by claim_line_key
- [ ] Unit tests:
  - Payment totals match source system
  - Zero orphan payments (LEFT ANTI JOIN to claims)
  - payment_type NOT NULL for all records
  - Sum of amounts by type = total payments

**Deliverables:**
1. DDL script for silver.advmd_payments
2. Payment rollup view
3. Reconciliation report (totals by payment_type)
4. Orphan check results

---

### Ticket ADVMD-004 (Dev B): Build silver.patients dimension
**Story Points:** 2
**Acceptance Criteria:**
- [ ] Load and deduplicate patients by patient_id
- [ ] Standardize name fields (proper case, trim whitespace)
- [ ] Parse and validate DOB format
- [ ] Unit tests:
  - Unique constraint on patient_id
  - MRN NULL rate < 10%
  - Valid DOB for 95%+ records (between 1900 and current date)
  - No duplicate patient records

**Deliverables:**
1. DDL script for silver.patients
2. Data quality report
3. Deduplication logic documentation
4. Sample patient records (masked PHI)

---

### Ticket ADVMD-005 (Joint Team): Build Gold Layer & ODBC Testing
**Story Points:** 5
**Assigned to:** Both developers collaborate
**Acceptance Criteria:**
- [ ] Create gold.fct_claim_line joining all silver tables
- [ ] Create gold.vw_dashboard_full with all KPIs
- [ ] Configure ODBC connection to Databricks SQL Warehouse
- [ ] Successfully query from external tool (Excel/Power BI)
- [ ] Dashboard shows 5 core metrics:
  1. Total Charges
  2. Total Paid Amount
  3. Denial Rate %
  4. Acceptance Rate %
  5. 30-day Cash Collection Trend
- [ ] Performance: Dashboard view returns in < 5 seconds

**Deliverables:**
1. Gold layer DDL scripts
2. ODBC configuration documentation
3. Screenshot of successful ODBC query
4. Sample dashboard output
5. Performance test results

---

## Unit Test Specifications

### claims table tests
```sql
-- Test 1: Unique claim_line_key
SELECT COUNT(*), COUNT(DISTINCT claim_line_key) 
FROM silver.advmd_claims;
-- PASS if both counts equal

-- Test 2: Service date coverage
SELECT 
  COUNT(*) as total_rows,
  SUM(CASE WHEN service_date IS NOT NULL THEN 1 ELSE 0 END) as with_date,
  SUM(CASE WHEN service_date IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_coverage
FROM silver.advmd_claims;
-- PASS if pct_coverage >= 99

-- Test 3: Positive amounts
SELECT COUNT(*) 
FROM silver.advmd_claims 
WHERE billed_amount <= 0 OR billed_amount IS NULL;
-- PASS if count = 0
```

### claim_status table tests
```sql
-- Test 1: All claims have status
SELECT COUNT(DISTINCT c.claim_line_key)
FROM silver.advmd_claims c
LEFT JOIN silver.advmd_claim_status s ON c.claim_line_key = s.claim_line_key
WHERE s.claim_line_key IS NULL;
-- PASS if count = 0

-- Test 2: Latest status check
WITH latest AS (
  SELECT claim_line_key, MAX(status_ts) as max_ts
  FROM silver.advmd_claim_status
  GROUP BY claim_line_key
)
SELECT COUNT(*)
FROM latest l
JOIN silver.advmd_claim_status s 
  ON l.claim_line_key = s.claim_line_key 
  AND l.max_ts = s.status_ts
WHERE s.status_norm IS NULL;
-- PASS if count = 0
```

### payments table tests
```sql
-- Test 1: Payment reconciliation
SELECT 
  SUM(amount) as total_payments,
  COUNT(*) as payment_count
FROM silver.advmd_payments;
-- Compare with source system totals

-- Test 2: Orphan payments check
SELECT COUNT(*)
FROM silver.advmd_payments p
LEFT JOIN silver.advmd_claims c ON p.claim_line_key = c.claim_line_key
WHERE c.claim_line_key IS NULL;
-- PASS if count = 0

-- Test 3: Payment type distribution
SELECT payment_type, COUNT(*), SUM(amount)
FROM silver.advmd_payments
GROUP BY payment_type
ORDER BY 2 DESC;
-- All types should be mapped correctly
```

### patients table tests
```sql
-- Test 1: Unique patients
SELECT COUNT(*), COUNT(DISTINCT patient_id)
FROM silver.patients;
-- PASS if counts equal

-- Test 2: Data quality metrics
SELECT 
  COUNT(*) as total_patients,
  SUM(CASE WHEN mrn IS NOT NULL THEN 1 ELSE 0 END) as with_mrn,
  SUM(CASE WHEN dob IS NOT NULL AND dob > '1900-01-01' AND dob < CURRENT_DATE THEN 1 ELSE 0 END) as valid_dob
FROM silver.patients;
-- PASS if with_mrn/total > 0.9 AND valid_dob/total > 0.95
```

---

## ODBC Configuration Guide

### 1. Databricks SQL Warehouse Setup
```
1. Navigate to SQL Warehouses in Databricks workspace
2. Create new SQL Warehouse (or use existing)
3. Select "Serverless" for best performance
4. Start the warehouse
5. Copy connection details:
   - Server hostname: adb-xxxxx.azuredatabricks.net
   - HTTP path: /sql/1.0/warehouses/warehouse_id
```

### 2. Create Personal Access Token
```
1. Go to User Settings → Access Tokens
2. Generate new token
3. Set expiration (90 days recommended)
4. Copy and store securely
```

### 3. ODBC Driver Installation
```
1. Download Databricks ODBC driver:
   https://www.databricks.com/spark/odbc-drivers-download
2. Install for your OS (Windows/Mac/Linux)
3. Restart after installation
```

### 4. Configure DSN (Windows Example)
```
1. Open ODBC Data Sources (64-bit)
2. Add new System DSN
3. Select "Simba Spark ODBC Driver"
4. Configuration:
   - Data Source Name: AdvancedMD_Databricks
   - Server: [your-server].azuredatabricks.net
   - Port: 443
   - Database: hha
   - Authentication: Token
   - User: token
   - Password: [your-access-token]
   - HTTP Path: /sql/1.0/warehouses/[warehouse-id]
   - Enable SSL: Yes
```

### 5. Test Queries via ODBC
```sql
-- Test 1: Basic connectivity
SELECT 1 as test;

-- Test 2: Row count
SELECT COUNT(*) FROM hha.gold.fct_claim_line;

-- Test 3: Dashboard view
SELECT * FROM hha.gold.vw_dashboard_full 
WHERE dt >= CURRENT_DATE - 30
LIMIT 100;

-- Test 4: Aggregation performance
SELECT 
  payer_name,
  SUM(total_charges) as charges,
  SUM(paid_amount) as paid,
  AVG(avg_days_to_accept) as avg_lag
FROM hha.gold.vw_dashboard_full
GROUP BY payer_name
ORDER BY charges DESC;
```

---

## Status Normalization Mapping

Create this as a reference table or CASE statement:
```sql
CREATE OR REPLACE VIEW silver.status_mapping AS
SELECT * FROM VALUES
  ('SUBMITTED', 'Submitted'),
  ('SENT', 'Submitted'),
  ('SENT_TO_PAYER', 'Submitted'),
  ('ACCEPTED', 'Accepted'),
  ('ACKNOWLEDGED', 'Accepted'),
  ('IN_PROCESS', 'Accepted'),
  ('DENIED', 'Denied'),
  ('REJECTED', 'Denied'),
  ('PARTIAL_DENIAL', 'Denied'),
  ('PAID', 'Paid'),
  ('PAYMENT_RECEIVED', 'Paid'),
  ('CLOSED', 'Paid'),
  ('REWORK', 'Reworked'),
  ('RESUBMITTED', 'Reworked'),
  ('PENDING_REWORK', 'Reworked')
AS t(status_code, status_norm);
```

---

## Payment Type Mapping

```sql
CREATE OR REPLACE VIEW silver.payment_type_mapping AS
SELECT * FROM VALUES
  ('ERA', 'insurance'),
  ('EOB', 'insurance'),
  ('INSURANCE_PAYMENT', 'insurance'),
  ('INSURANCE', 'insurance'),
  ('PATIENT_PAYMENT', 'patient'),
  ('PATIENT', 'patient'),
  ('COPAY', 'patient'),
  ('COINSURANCE', 'patient'),
  ('DEDUCTIBLE', 'patient'),
  ('ADJUSTMENT', 'adjustment'),
  ('WRITEOFF', 'adjustment'),
  ('CONTRACTUAL', 'adjustment'),
  ('TAKEBACK', 'takeback'),
  ('REFUND', 'takeback'),
  ('OVERPAYMENT_RECOVERY', 'takeback')
AS t(payment_code, payment_type);
```

---

## Definition of Done (Sprint-1)

1. **All 4 silver tables created and loaded** ✓
2. **Gold fact table and dashboard view operational** ✓
3. **ODBC connection tested from external tool** ✓
4. **5 core KPIs displaying correctly** ✓
5. **Unit tests passing for all tables** ✓
6. **Documentation complete** ✓
7. **Code reviewed and merged to main** ✓

---

## Handoff Checklist

- [ ] DDL scripts in Git repo under `/sql/advancedmd/`
- [ ] Unit test results documented
- [ ] ODBC configuration guide shared with BI team
- [ ] Sample dashboard screenshots captured
- [ ] Performance benchmarks recorded
- [ ] Next sprint backlog items identified