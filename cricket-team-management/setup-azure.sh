#!/bin/bash

echo "==================================="
echo "Azure Storage Setup for Islanders Cricket Club"
echo "==================================="
echo ""

# Step 1: Login to Azure
echo "Step 1: Logging into Azure..."
echo "A browser window will open. Please select your Microsoft account."
echo ""
az login

if [ $? -ne 0 ]; then
  echo "❌ Azure login failed. Please try again."
  exit 1
fi

echo "✅ Azure login successful!"
echo ""

# Step 2: Create resource group
echo "Step 2: Creating resource group 'cricket-rg'..."
az group create --name cricket-rg --location centralus --output table

if [ $? -ne 0 ]; then
  echo "⚠️  Resource group may already exist. Continuing..."
fi

echo "✅ Resource group ready!"
echo ""

# Step 3: Create storage account
echo "Step 3: Creating storage account 'islanderscricket'..."
echo "This may take 1-2 minutes..."
az storage account create \
  --name islanderscricket \
  --resource-group cricket-rg \
  --location centralus \
  --sku Standard_LRS \
  --kind StorageV2 \
  --output table

if [ $? -ne 0 ]; then
  echo "⚠️  Storage account may already exist. Continuing..."
fi

echo "✅ Storage account ready!"
echo ""

# Step 4: Create blob container
echo "Step 4: Creating blob container 'islanders-data'..."
az storage container create \
  --name islanders-data \
  --account-name islanderscricket \
  --public-access blob \
  --output table

if [ $? -ne 0 ]; then
  echo "⚠️  Container may already exist. Continuing..."
fi

echo "✅ Blob container ready!"
echo ""

# Step 5: Generate SAS token
echo "Step 5: Generating SAS token (valid for 1 year)..."
SAS_TOKEN=$(az storage container generate-sas \
  --account-name islanderscricket \
  --name islanders-data \
  --permissions racwdl \
  --expiry 2026-10-17 \
  --output tsv)

echo ""
echo "==================================="
echo "✅ Azure Storage Setup Complete!"
echo "==================================="
echo ""
echo "Storage Account: islanderscricket"
echo "Container: islanders-data"
echo "Location: Central US"
echo ""
echo "🔑 Your SAS Token:"
echo "$SAS_TOKEN"
echo ""
echo "==================================="
echo "NEXT STEPS:"
echo "==================================="
echo ""
echo "1. Copy the SAS token above"
echo ""
echo "2. Update your .env file:"
echo "   VITE_AZURE_STORAGE_SAS_TOKEN=$SAS_TOKEN"
echo ""
echo "3. Add to Vercel:"
echo "   vercel env add VITE_AZURE_STORAGE_SAS_TOKEN production"
echo "   (paste the SAS token when prompted)"
echo ""
echo "4. Redeploy to Vercel:"
echo "   vercel --prod"
echo ""
echo "==================================="
