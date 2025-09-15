# Databricks Connect, SQL CLI & Azure CLI Setup Guide

## 1. Databricks Connect Setup (Python Development)

### Prerequisites
- Python 3.8-3.11 (check compatibility)
- pip or conda
- Databricks workspace URL and access token

### Installation
```bash
# Create virtual environment
python -m venv databricks-env
source databricks-env/bin/activate  # Windows: databricks-env\Scripts\activate

# Install Databricks Connect
pip install databricks-connect==13.3.*  # Match your Databricks runtime version

# Verify installation
databricks-connect --version
```

### Configuration
```bash
# Configure Databricks Connect
databricks-connect configure

# You'll be prompted for:
# - Databricks workspace URL: https://adb-xxxxx.azuredatabricks.net
# - Access token: dapi********************************
# - Cluster ID: 0925-xxxxxx-xxxxxx
# - Org ID: 0 (for Azure Databricks)
# - Port: 15001 (default)
```

### Test Connection
```python
# test_connection.py
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("AdvancedMD-Test").getOrCreate()

# Test query
df = spark.sql("SELECT COUNT(*) as row_count FROM hha.silver.advmd_claims")
df.show()

spark.stop()
```

### Python Script for Data Operations
```python
# advmd_data_loader.py
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from datetime import datetime

class AdvancedMDLoader:
    def __init__(self):
        self.spark = SparkSession.builder \
            .appName("AdvancedMD-DataLoader") \
            .config("spark.sql.adaptive.enabled", "true") \
            .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
            .getOrCreate()
    
    def load_claims(self, source_path):
        """Load claims data with deduplication"""
        df = self.spark.read \
            .option("header", "true") \
            .option("inferSchema", "true") \
            .csv(source_path)
        
        # Add claim_line_key if not present
        if "claim_line_key" not in df.columns:
            df = df.withColumn("claim_line_key", 
                concat_ws("-", col("claim_id"), col("line_number")))
        
        # Add load timestamp
        df = df.withColumn("load_ts", current_timestamp())
        
        # Deduplicate
        df = df.dropDuplicates(["claim_line_key"])
        
        # Write to silver layer
        df.write \
            .mode("overwrite") \
            .option("mergeSchema", "true") \
            .saveAsTable("hha.silver.advmd_claims")
        
        return df.count()
    
    def update_claim_status(self, status_updates):
        """Merge claim status updates"""
        status_df = self.spark.createDataFrame(status_updates)
        
        # Merge into existing table
        self.spark.sql("""
            MERGE INTO hha.silver.advmd_claim_status target
            USING status_updates source
            ON target.claim_line_key = source.claim_line_key 
               AND target.status_ts = source.status_ts
            WHEN NOT MATCHED THEN
                INSERT *
        """)
    
    def generate_dashboard_metrics(self, date_filter=None):
        """Generate dashboard metrics"""
        query = """
            SELECT 
                dt,
                facility_code,
                SUM(total_charges) as total_charges,
                SUM(paid_amount) as paid_amount,
                AVG(denial_rate) as avg_denial_rate,
                AVG(collection_rate) as avg_collection_rate
            FROM hha.gold.vw_dashboard_full
        """
        
        if date_filter:
            query += f" WHERE dt >= '{date_filter}'"
        
        query += " GROUP BY dt, facility_code ORDER BY dt DESC"
        
        return self.spark.sql(query)
    
    def close(self):
        self.spark.stop()

# Usage example
if __name__ == "__main__":
    loader = AdvancedMDLoader()
    
    # Load claims
    count = loader.load_claims("/mnt/advancedmd/claims_export.csv")
    print(f"Loaded {count} claim records")
    
    # Get metrics
    metrics = loader.generate_dashboard_metrics("2024-01-01")
    metrics.show(20)
    
    loader.close()
```

---

## 2. Databricks SQL CLI Setup

### Installation
```bash
# Install Databricks CLI
pip install databricks-cli

# Configure authentication
databricks configure --token

# Enter:
# Databricks Host: https://adb-xxxxx.azuredatabricks.net
# Token: dapi********************************
```

### Create SQL Scripts Directory
```bash
mkdir -p databricks_sql/advancedmd
cd databricks_sql/advancedmd
```

### SQL Execution Script
```bash
# execute_sql.sh
#!/bin/bash

# Set variables
DATABRICKS_HOST="https://adb-xxxxx.azuredatabricks.net"
DATABRICKS_TOKEN="dapi********************************"
SQL_WAREHOUSE_ID="abcd1234efgh5678"

# Function to execute SQL file
execute_sql_file() {
    local sql_file=$1
    echo "Executing: $sql_file"
    
    databricks sql execute \
        --warehouse-id $SQL_WAREHOUSE_ID \
        --file $sql_file
}

# Execute all SQL files in order
execute_sql_file "01_create_silver_tables.sql"
execute_sql_file "02_create_gold_layer.sql"
execute_sql_file "03_create_views.sql"
execute_sql_file "04_run_tests.sql"
```

### SQL Files Examples

#### 01_create_silver_tables.sql
```sql
-- Switch to correct catalog
USE CATALOG hha;
USE SCHEMA silver;

-- Create claims table with optimizations
CREATE OR REPLACE TABLE advmd_claims (
  claim_line_key      STRING   NOT NULL,
  claim_id            STRING,
  encounter_key       STRING,
  patient_id          STRING,
  provider_npi        STRING,
  facility_code       STRING,
  payer_name          STRING,
  cpt_code            STRING,
  dx_code             STRING,
  service_date        DATE,
  billed_amount       DECIMAL(18,2),
  allowed_amount      DECIMAL(18,2),
  total_charge        DECIMAL(18,2),
  load_ts             TIMESTAMP
)
USING DELTA
PARTITIONED BY (service_date)
TBLPROPERTIES (
  'delta.autoOptimize.optimizeWrite' = 'true',
  'delta.autoOptimize.autoCompact' = 'true'
);

-- Add constraint
ALTER TABLE advmd_claims ADD CONSTRAINT pk_claim_line PRIMARY KEY(claim_line_key);
```

#### 04_run_tests.sql
```sql
-- Data quality tests
USE CATALOG hha;
USE SCHEMA silver;

-- Test results table
CREATE OR REPLACE TEMPORARY VIEW test_results AS
WITH tests AS (
  -- Test 1: Unique claim keys
  SELECT 
    'Unique claim_line_key' as test_name,
    CASE 
      WHEN COUNT(*) = COUNT(DISTINCT claim_line_key) 
      THEN 'PASS' 
      ELSE 'FAIL' 
    END as status,
    COUNT(*) as total_rows,
    COUNT(DISTINCT claim_line_key) as unique_keys
  FROM advmd_claims
  
  UNION ALL
  
  -- Test 2: Service date coverage
  SELECT 
    'Service date coverage' as test_name,
    CASE 
      WHEN SUM(CASE WHEN service_date IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*) >= 99
      THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    COUNT(*) as total_rows,
    SUM(CASE WHEN service_date IS NOT NULL THEN 1 ELSE 0 END) as rows_with_date
  FROM advmd_claims
)
SELECT * FROM tests;

-- Display results
SELECT * FROM test_results;
```

### Using Databricks SQL CLI Commands
```bash
# List warehouses
databricks sql-warehouses list

# Get warehouse details
databricks sql-warehouses get --id $SQL_WAREHOUSE_ID

# Execute single query
databricks sql execute \
  --warehouse-id $SQL_WAREHOUSE_ID \
  --query "SELECT COUNT(*) FROM hha.gold.fct_claim_line"

# Execute query with output format
databricks sql execute \
  --warehouse-id $SQL_WAREHOUSE_ID \
  --query "SELECT * FROM hha.gold.vw_dashboard_full LIMIT 10" \
  --output json > dashboard_sample.json
```

---

## 3. Azure CLI with Databricks Integration

### Install Azure CLI
```bash
# Windows
winget install Microsoft.AzureCLI

# Mac
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Login and Configure
```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Your-Subscription-Name"

# Install Databricks extension
az extension add --name databricks
```

### Databricks Workspace Management
```bash
# List Databricks workspaces
az databricks workspace list --resource-group hha-analytics-rg

# Get workspace details
az databricks workspace show \
  --resource-group hha-analytics-rg \
  --name hha-databricks-workspace

# Create PAT token via Azure CLI
export DATABRICKS_AAD_TOKEN=$(az account get-access-token \
  --resource 2ff814a6-3304-4ab8-85cb-cd0e6f879c1d \
  --query accessToken -o tsv)
```

### Automated Deployment Script
```bash
#!/bin/bash
# deploy_databricks_tables.sh

# Azure and Databricks configuration
RESOURCE_GROUP="hha-analytics-rg"
WORKSPACE_NAME="hha-databricks-workspace"
CLUSTER_NAME="advancedmd-cluster"

# Get Databricks workspace URL
WORKSPACE_URL=$(az databricks workspace show \
  --resource-group $RESOURCE_GROUP \
  --name $WORKSPACE_NAME \
  --query workspaceUrl -o tsv)

echo "Workspace URL: https://${WORKSPACE_URL}"

# Get AAD token
export DATABRICKS_TOKEN=$(az account get-access-token \
  --resource 2ff814a6-3304-4ab8-85cb-cd0e6f879c1d \
  --query accessToken -o tsv)

# Configure Databricks CLI with AAD token
echo "{
  \"host\": \"https://${WORKSPACE_URL}\",
  \"token\": \"${DATABRICKS_TOKEN}\"
}" > ~/.databrickscfg

# Create cluster if not exists
CLUSTER_ID=$(databricks clusters list --output json | \
  jq -r ".clusters[] | select(.cluster_name==\"${CLUSTER_NAME}\") | .cluster_id")

if [ -z "$CLUSTER_ID" ]; then
  echo "Creating cluster..."
  CLUSTER_ID=$(databricks clusters create --json-file cluster_config.json | \
    jq -r '.cluster_id')
fi

# Start cluster
databricks clusters start --cluster-id $CLUSTER_ID

# Wait for cluster to start
echo "Waiting for cluster to start..."
sleep 60

# Execute SQL scripts
for script in sql/*.sql; do
  echo "Executing $script..."
  databricks sql execute \
    --warehouse-id $SQL_WAREHOUSE_ID \
    --file $script
done
```

### cluster_config.json
```json
{
  "cluster_name": "advancedmd-cluster",
  "spark_version": "13.3.x-scala2.12",
  "node_type_id": "Standard_DS3_v2",
  "num_workers": 2,
  "autotermination_minutes": 60,
  "spark_conf": {
    "spark.sql.adaptive.enabled": "true",
    "spark.sql.adaptive.coalescePartitions.enabled": "true"
  },
  "azure_attributes": {
    "availability": "ON_DEMAND_AZURE",
    "first_on_demand": 1,
    "spot_bid_price_percent": -1
  }
}
```

### Monitoring Script
```bash
#!/bin/bash
# monitor_pipeline.sh

# Check table row counts
echo "=== Table Row Counts ==="
databricks sql execute \
  --warehouse-id $SQL_WAREHOUSE_ID \
  --query "
    SELECT 
      'claims' as table_name, COUNT(*) as row_count 
    FROM hha.silver.advmd_claims
    UNION ALL
    SELECT 
      'claim_status', COUNT(*) 
    FROM hha.silver.advmd_claim_status
    UNION ALL
    SELECT 
      'payments', COUNT(*) 
    FROM hha.silver.advmd_payments
    UNION ALL
    SELECT 
      'patients', COUNT(*) 
    FROM hha.silver.patients
  "

# Check data freshness
echo -e "\n=== Data Freshness ==="
databricks sql execute \
  --warehouse-id $SQL_WAREHOUSE_ID \
  --query "
    SELECT 
      'claims' as table_name,
      MAX(load_ts) as last_updated,
      CURRENT_TIMESTAMP() - MAX(load_ts) as hours_old
    FROM hha.silver.advmd_claims
  "

# Check dashboard metrics
echo -e "\n=== Today's Dashboard Metrics ==="
databricks sql execute \
  --warehouse-id $SQL_WAREHOUSE_ID \
  --query "
    SELECT 
      SUM(total_charges) as total_charges,
      SUM(paid_amount) as total_paid,
      AVG(denial_rate) as avg_denial_rate,
      AVG(collection_rate) as avg_collection_rate
    FROM hha.gold.vw_dashboard_full
    WHERE dt = CURRENT_DATE()
  "
```

---

## 4. VS Code Integration

### Install Extensions
1. Databricks extension for VS Code
2. Azure Account extension
3. Python extension

### .vscode/settings.json
```json
{
  "databricks.python.envFile": "${workspaceFolder}/.env",
  "python.defaultInterpreterPath": "${workspaceFolder}/databricks-env/bin/python",
  "databricks.experiments.optInto": ["databricks-connect"],
  "databricks.connect.configProfile": "DEFAULT"
}
```

### .env file
```bash
DATABRICKS_HOST=https://adb-xxxxx.azuredatabricks.net
DATABRICKS_TOKEN=dapi********************************
DATABRICKS_CLUSTER_ID=0925-xxxxxx-xxxxxx
SQL_WAREHOUSE_ID=abcd1234efgh5678
```

---

## 5. CI/CD Pipeline (Azure DevOps)

### azure-pipelines.yml
```yaml
trigger:
  branches:
    include:
    - main
  paths:
    include:
    - databricks_sql/*

pool:
  vmImage: 'ubuntu-latest'

variables:
  DATABRICKS_HOST: $(databricks-host)
  DATABRICKS_TOKEN: $(databricks-token)
  SQL_WAREHOUSE_ID: $(sql-warehouse-id)

stages:
- stage: Test
  jobs:
  - job: ValidateSQL
    steps:
    - task: UsePythonVersion@0
      inputs:
        versionSpec: '3.9'
    
    - script: |
        pip install databricks-cli sqlfluff
        # Lint SQL files
        sqlfluff lint databricks_sql/*.sql
      displayName: 'Lint SQL Files'

- stage: Deploy
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - job: DeployToDatabricks
    steps:
    - task: AzureCLI@2
      inputs:
        azureSubscription: 'HHA-Databricks-Connection'
        scriptType: 'bash'
        scriptLocation: 'inlineScript'
        inlineScript: |
          # Configure Databricks CLI
          databricks configure --token <<EOF
          $(DATABRICKS_HOST)
          $(DATABRICKS_TOKEN)
          EOF
          
          # Execute SQL scripts
          for file in databricks_sql/*.sql; do
            echo "Deploying $file"
            databricks sql execute \
              --warehouse-id $(SQL_WAREHOUSE_ID) \
              --file $file
          done
      displayName: 'Deploy SQL to Databricks'
```

---

## Quick Reference Commands

```bash
# Databricks Connect
databricks-connect test
python -c "from pyspark.sql import SparkSession; print('Connected')"

# Databricks CLI
databricks sql-warehouses list
databricks sql execute --warehouse-id $ID --query "SELECT 1"

# Azure CLI
az databricks workspace list
az account get-access-token --resource 2ff814a6-3304-4ab8-85cb-cd0e6f879c1d

# Combined workflow
export DATABRICKS_TOKEN=$(az account get-access-token \
  --resource 2ff814a6-3304-4ab8-85cb-cd0e6f879c1d \
  --query accessToken -o tsv)

databricks sql execute \
  --warehouse-id $SQL_WAREHOUSE_ID \
  --query "SELECT COUNT(*) FROM hha.gold.fct_claim_line"
```