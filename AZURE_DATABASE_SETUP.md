# Azure Database Setup Guide

## 🚀 Quick Start - Admin Only Mode

### Default Admin Credentials
```
Email: admin@reddyfit.com
Password: ReddyFit@Admin2025!
```

**⚠️ IMPORTANT: Change these credentials in production!**

---

## 📋 Setup Steps

### 1. Create Azure Cosmos DB Account

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Azure Cosmos DB"
4. Select "Azure Cosmos DB for NoSQL"
5. Configure:
   - **Subscription:** Your subscription
   - **Resource Group:** Create new or use existing
   - **Account Name:** `reddyfit-db` (or your choice)
   - **Location:** Choose nearest region
   - **Capacity mode:** Serverless (cheapest for development)
6. Click "Review + Create"
7. Wait for deployment (2-3 minutes)

### 2. Get Connection Credentials

1. Open your Cosmos DB account
2. Go to "Keys" in the left menu
3. Copy the following:
   - **URI** (endpoint)
   - **PRIMARY KEY**

### 3. Update Environment Variables

Add to your `.env` file:

```env
# Azure Cosmos DB
VITE_AZURE_COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
VITE_AZURE_COSMOS_KEY=your-primary-key-here

# Admin Credentials (CHANGE IN PRODUCTION!)
VITE_ADMIN_EMAIL=admin@reddyfit.com
VITE_ADMIN_PASSWORD=ReddyFit@Admin2025!
```

### 4. Database Initialization

The database and containers will be created automatically on first use:
- **Database:** ReddyFitDB
- **Containers:**
  - `users` (stores user profiles)
  - `mealLogs` (stores meal tracking data)
  - `workoutPlans` (stores generated workout plans)

---

## 🔒 Security Features

### Admin-Only Authentication
- **No public signup** - Only admin can access
- **Session-based** - 8-hour session timeout
- **Hardcoded credentials** - Secure for single-user admin
- **No Firebase** - Complete Azure integration

### Session Management
- Sessions stored in `sessionStorage`
- Auto-logout after 8 hours
- Secure session validation

---

## 💰 Cost Estimation

### Azure Cosmos DB (Serverless)
- **First 1M requests:** FREE
- **Storage (1 GB):** ~$0.25/month
- **Additional 1M requests:** ~$0.25

**Estimated Monthly Cost:** $0-5 for development/personal use

---

## 📊 Database Schema

### Users Collection
```json
{
  "uid": "admin-001",
  "email": "admin@reddyfit.com",
  "displayName": "Admin User",
  "role": "admin",
  "fitnessLevel": "Advanced",
  "goal": "Maintain Fitness",
  "points": 0,
  "createdAt": "2025-01-24T...",
  "updatedAt": "2025-01-24T..."
}
```

### Meal Logs Collection
```json
{
  "id": "meal-1706140800000",
  "userId": "admin-001",
  "imageUrl": "https://...",
  "foodItems": ["chicken", "rice", "broccoli"],
  "nutrition": {
    "calories": 450,
    "protein": 45,
    "carbs": 50,
    "fat": 10
  },
  "createdAt": "2025-01-24T..."
}
```

### Workout Plans Collection
```json
{
  "id": "plan-1706140800000",
  "userId": "admin-001",
  "basedOnEquipment": "dumbbells, barbell",
  "plan": [
    {
      "day": "Day 1",
      "exercises": [...]
    }
  ],
  "createdAt": "2025-01-24T..."
}
```

---

## 🛠️ Migration from Firebase

### What Changed:
- ❌ Firebase Firestore → ✅ Azure Cosmos DB
- ❌ Firebase Auth → ✅ Admin-only authentication
- ❌ Public signup → ✅ Single admin profile
- ❌ Google Sign-in → ✅ Email/password only

### What Stayed:
- ✅ All AI features (Gemini)
- ✅ Meal tracking
- ✅ Workout planning
- ✅ Chat functionality
- ✅ UI/UX

---

## 🔧 Development Mode

If Azure Cosmos DB is not configured, the app will:
- Use hardcoded admin profile
- Store data in memory (temporary)
- Show warning in console
- Still allow login and testing

---

## 📝 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Update `.env` with Azure credentials
3. ✅ Run app: `npm run dev`
4. ✅ Login with admin credentials
5. ✅ Database initializes automatically

---

## ⚠️ Production Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Store credentials in Azure Key Vault
- [ ] Enable Azure Cosmos DB firewall
- [ ] Set up backup policies
- [ ] Configure monitoring and alerts
- [ ] Use managed identity for authentication
- [ ] Encrypt sensitive data
- [ ] Implement rate limiting
- [ ] Add audit logging
- [ ] Set up disaster recovery

---

## 🆘 Troubleshooting

### "Cannot connect to Cosmos DB"
- Check endpoint URL is correct
- Verify primary key is valid
- Ensure firewall allows your IP
- Check resource group exists

### "Unauthorized" errors
- Verify PRIMARY KEY (not secondary)
- Check key hasn't been regenerated
- Ensure proper permissions

### Database not initializing
- Check Azure subscription is active
- Verify Cosmos DB account is running
- Review Azure portal for errors
- Check console for error messages

---

## 📚 Resources

- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [Cosmos DB Pricing](https://azure.microsoft.com/pricing/details/cosmos-db/)
- [NoSQL API Guide](https://docs.microsoft.com/azure/cosmos-db/sql-query-getting-started)
- [Security Best Practices](https://docs.microsoft.com/azure/cosmos-db/database-security)

---

**🎉 Your ReddyFit app is now powered by Azure!**
