# 🏋️ ReddyFit Complete Setup Guide

## 🎯 Quick Reference

**Frontend**: https://delightful-sky-0437f100f.2.azurestaticapps.net
**Backend API**: https://reddyfit-express-api.azurewebsites.net
**Admin Email**: akhilreddyd3@gmail.com
**Database**: reddyfit-sql-server.database.windows.net/reddyfitdb

---

## ✅ What's Working Now

### Backend (Express.js API)
- ✅ Health check endpoint
- ✅ User profile management
- ✅ Onboarding submission and tracking
- ✅ Azure SQL Database connection with pooling
- ✅ CORS configured for frontend
- ✅ Security headers and compression

### Frontend (React + TypeScript)
- ✅ Google authentication with Firebase
- ✅ Landing page
- ✅ Onboarding questionnaire (3 steps)
- ✅ Dashboard (after onboarding)
- ✅ Admin panel (for admin users)
- ✅ Proper routing and state management

### Fixed Issues
- ✅ "Failed to save response" error - FIXED
- ✅ Onboarding form showing repeatedly - FIXED
- ✅ Azure Functions incompatibility - MIGRATED to Express.js
- ✅ Database timeout issues - FIXED with connection pooling
- ✅ State persistence after page refresh - FIXED

---

## 🧪 How to Test the App

### 1. Test API Health
```bash
curl https://reddyfit-express-api.azurewebsites.net/api/health
```
Should return:
```json
{"status":"healthy","database":"connected"}
```

### 2. Test Complete User Flow

**Step 1**: Open frontend
```
https://delightful-sky-0437f100f.2.azurestaticapps.net
```

**Step 2**: Click "Start Your Transformation" and sign in with Google

**Step 3**: Complete the 3-step onboarding form:
- Step 1: Personal info (name, gender, fitness goal, level, frequency, diet)
- Step 2: Motivation and feature interests
- Step 3: How you found us and pricing preferences

**Step 4**: Click "Complete Setup"

**Expected Result**:
- ✅ Form submits successfully
- ✅ You see the Dashboard
- ✅ If you refresh the page, you stay on Dashboard (NOT back to form)

### 3. Test Admin Panel

**Step 1**: Sign in with admin email (akhilreddyd3@gmail.com)

**Step 2**: Navigate to:
```
https://delightful-sky-0437f100f.2.azurestaticapps.net/admin
```

**Expected Result**:
- ✅ You see the Admin Panel
- ✅ You can view all users and their onboarding responses

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "Failed to save response" Error

**Symptoms**: Form submission fails with error alert

**Check**:
1. API is running:
   ```bash
   curl https://reddyfit-express-api.azurewebsites.net/api/health
   ```

2. Database connection:
   ```bash
   az webapp log tail --resource-group sixpack-rg --name reddyfit-express-api
   ```

**Fix**:
- Restart the API:
  ```bash
  az webapp restart --resource-group sixpack-rg --name reddyfit-express-api
  ```

### Issue 2: Onboarding Form Keeps Showing

**Symptoms**: After completing onboarding, form shows again on refresh

**Check**:
1. Database has correct status:
   ```bash
   curl "https://reddyfit-express-api.azurewebsites.net/api/users/profile?email=YOUR_EMAIL"
   ```
   Should show: `"onboarding_completed": true`

**Fix**:
- This should be fixed now with the latest deployment
- Clear browser cache and try again
- Check browser console (F12) for any errors

### Issue 3: Google Sign-In Fails

**Symptoms**: Error about unauthorized domain

**Fix**:
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Authentication → Settings → Authorized Domains
4. Add: `delightful-sky-0437f100f.2.azurestaticapps.net`
5. Save and try again

### Issue 4: API Returns 500 Error

**Symptoms**: All API calls fail with 500 status

**Check Database Connection**:
```bash
az sql server firewall-rule list \
  --resource-group sixpack-rg \
  --server reddyfit-sql-server
```

**Fix**:
- Allow Azure services:
  ```bash
  az sql server firewall-rule create \
    --resource-group sixpack-rg \
    --server reddyfit-sql-server \
    --name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0
  ```

---

## 🚀 Making Changes

### Update Frontend Code

1. **Edit files in**: `C:\users\akhil\ReddyfitWebsiteready\src\`

2. **Test locally** (optional):
   ```bash
   cd C:\users\akhil\ReddyfitWebsiteready
   npm run dev
   ```

3. **Deploy to Azure**:
   ```bash
   cd C:\users\akhil\ReddyfitWebsiteready
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

4. **Wait for deployment** (~2-3 minutes)
   - Check: https://github.com/DandaAkhilReddy/ReddyFitClub_Website/actions

### Update Backend API

1. **Edit files in**: `C:\users\akhil\reddyfit-express-api\`

2. **Test locally**:
   ```bash
   cd C:\users\akhil\reddyfit-express-api
   npm start
   # Test at http://localhost:8080/api/health
   ```

3. **Deploy to Azure**:
   ```bash
   cd C:\users\akhil\reddyfit-express-api
   az webapp up \
     --resource-group sixpack-rg \
     --name reddyfit-express-api \
     --runtime "NODE:20-lts"
   ```

4. **Verify deployment**:
   ```bash
   curl https://reddyfit-express-api.azurewebsites.net/api/health
   ```

---

## 📊 Monitoring & Logs

### View Backend Logs
```bash
# Real-time logs
az webapp log tail \
  --resource-group sixpack-rg \
  --name reddyfit-express-api

# Download logs
az webapp log download \
  --resource-group sixpack-rg \
  --name reddyfit-express-api \
  --log-file logs.zip
```

### Check Frontend Deployment
- GitHub Actions: https://github.com/DandaAkhilReddy/ReddyFitClub_Website/actions
- Azure Portal: https://portal.azure.com → Static Web Apps → delightful-sky-0437f100f

### Check Backend Status
- Azure Portal: https://portal.azure.com → App Services → reddyfit-express-api
- Metrics: CPU usage, memory, requests, errors

### Database Queries
```bash
# Connect to database
az sql db show \
  --resource-group sixpack-rg \
  --server reddyfit-sql-server \
  --name reddyfitdb

# Check connection
curl "https://reddyfit-express-api.azurewebsites.net/api/users/all"
```

---

## 🎓 Understanding the Architecture

### Request Flow

1. **User visits website** → Azure Static Web Apps (React)
2. **User signs in** → Firebase Authentication
3. **Frontend calls API** → Express.js on Azure App Service
4. **API queries database** → Azure SQL Database
5. **Data returned** → Frontend updates UI

### File Structure

```
Frontend (ReddyfitWebsiteready/)
├── src/
│   ├── App.tsx                    # Landing page
│   ├── AppRouter.tsx              # Main routing logic
│   ├── components/
│   │   ├── AuthProvider.tsx       # Firebase auth
│   │   ├── OnboardingQuestionnaire.tsx
│   │   ├── Dashboard.tsx
│   │   └── AdminPanel.tsx
│   └── lib/
│       ├── api.ts                 # API client
│       └── firebase.ts            # Firebase config

Backend (reddyfit-express-api/)
├── server.js                      # Main Express server
├── package.json                   # Dependencies
├── .env.example                   # Environment variables
├── web.config                     # Azure App Service config
└── .github/workflows/
    └── azure-deploy.yml           # CI/CD pipeline
```

### Key Components

**AppRouter.tsx**: Decides what to show
- Not signed in → Landing page
- Signed in + onboarding incomplete → Onboarding form
- Signed in + onboarding complete → Dashboard
- Admin user on `/admin` → Admin panel

**AuthProvider.tsx**: Manages authentication
- Handles Google sign-in
- Creates user profile on first login
- Syncs Firebase data with database

**OnboardingQuestionnaire.tsx**: 3-step form
- Collects user data
- Submits to API
- Verifies database update
- Redirects to dashboard

**server.js**: Express.js API
- All endpoints defined
- Database connection pooling
- Error handling
- CORS and security

---

## 🔐 Security Best Practices

### API Keys & Secrets
- ✅ Stored in Azure App Service environment variables
- ✅ Not in code or Git repository
- ✅ Firebase config in frontend (safe, client-side keys)

### Database
- ✅ Parameterized queries (no SQL injection)
- ✅ Firewall rules configured
- ✅ Encrypted connections (TLS)

### Authentication
- ✅ Firebase handles auth tokens
- ✅ JWT ready for backend validation
- ✅ CORS restricts API access to frontend domain only

---

## 📈 Scaling Checklist

### Current Setup (Good for 100-1000 users)
- ✅ Basic tier App Service
- ✅ Connection pooling (max 10)
- ✅ Compression enabled
- ✅ Single instance

### For 1000-10,000 users
- [ ] Upgrade to Standard tier
- [ ] Enable auto-scaling (2-5 instances)
- [ ] Add Application Insights
- [ ] Add Redis cache
- [ ] Enable CDN for static files

### For 10,000+ users
- [ ] Premium tier with multiple regions
- [ ] Azure Traffic Manager
- [ ] Database read replicas
- [ ] API rate limiting
- [ ] Load testing and optimization

---

## 🎉 Success Metrics

### How to Know It's Working

**Backend**:
```bash
curl https://reddyfit-express-api.azurewebsites.net/api/health
# Should return: {"status":"healthy","database":"connected"}
```

**Frontend**:
- Open: https://delightful-sky-0437f100f.2.azurestaticapps.net
- Should load landing page without errors

**Complete Flow**:
- Sign in → Complete onboarding → See dashboard → Refresh → Still on dashboard ✅

**Database**:
```bash
curl "https://reddyfit-express-api.azurewebsites.net/api/users/all"
# Should return array of users with onboarding data
```

---

## 📞 Quick Commands Reference

### Backend Commands
```bash
# Check health
curl https://reddyfit-express-api.azurewebsites.net/api/health

# View logs
az webapp log tail --resource-group sixpack-rg --name reddyfit-express-api

# Restart app
az webapp restart --resource-group sixpack-rg --name reddyfit-express-api

# Deploy updates
cd C:\users\akhil\reddyfit-express-api
az webapp up --resource-group sixpack-rg --name reddyfit-express-api
```

### Frontend Commands
```bash
# Deploy updates
cd C:\users\akhil\ReddyfitWebsiteready
git add .
git commit -m "Updates"
git push origin main

# Check deployment status
# Visit: https://github.com/DandaAkhilReddy/ReddyFitClub_Website/actions
```

### Database Commands
```bash
# List all users
curl "https://reddyfit-express-api.azurewebsites.net/api/users/all"

# Get specific user
curl "https://reddyfit-express-api.azurewebsites.net/api/users/profile?email=test@example.com"

# Check firewall rules
az sql server firewall-rule list --resource-group sixpack-rg --server reddyfit-sql-server
```

---

## 🎊 You're All Set!

Your ReddyFit platform is now fully operational with:
- ✅ Working backend API
- ✅ Working frontend
- ✅ Proper database integration
- ✅ Fixed onboarding flow
- ✅ Production-ready setup

**Test the complete flow** and you should see everything working smoothly! 🚀

If you encounter any issues, refer to the troubleshooting section above or check the logs.

---

Made with ❤️ for ReddyFit Club
**"Your Fitness Transformation Starts Here"** 🏋️‍♂️💪
