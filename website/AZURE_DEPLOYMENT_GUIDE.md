# 🚀 Deploy to Azure Static Web Apps (14 minutes)

## Before You Deploy
Make sure you've completed:
- ✅ Local testing passed (LOCAL_TESTING_GUIDE.md)
- ✅ Firebase configured
- ✅ Resend configured
- ✅ .env.local working locally
- ✅ Build successful (`npm run build`)

---

## Step 1: Azure CLI Re-authentication (1 min)

Your Azure token has expired. Let's refresh it:

```bash
# Logout from Azure
az logout

# Login again (opens browser)
az login
```

**Follow the browser prompts:**
1. Select your Microsoft account
2. Authorize Azure CLI
3. Close browser when done
4. Return to terminal

**Verify login:**
```bash
# Should show your subscription
az account show
```

---

## Step 2: Create Static Web App (2 min)

### Check Existing Resource Groups

```bash
# List all resource groups
az group list --output table
```

**You likely have one of these:**
- `sixpack-rg`
- `reddyfit-rg`
- Or similar

### Create the Static Web App

```bash
# Set variables (customize as needed)
RESOURCE_GROUP="sixpack-rg"  # Use your existing resource group
APP_NAME="reddyfit-website"
LOCATION="centralus"  # Or your preferred region

# Create Static Web App
az staticwebapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Free
```

**This command:**
- Creates a new Static Web App resource
- Uses the Free tier (100 GB bandwidth/month)
- Sets up global CDN automatically
- Generates a unique URL

**Expected output:**
```json
{
  "defaultHostname": "reddyfit-website-[hash].azurestaticapps.net",
  "id": "/subscriptions/.../reddyfit-website",
  "location": "Central US",
  "name": "reddyfit-website",
  "sku": {
    "name": "Free",
    "tier": "Free"
  }
}
```

**Save your URL!** It will be something like:
```
https://reddyfit-website-abc123.azurestaticapps.net
```

---

## Step 3: Get Deployment Token (1 min)

Azure uses a deployment token to authenticate deployments:

```bash
# Get deployment token
az staticwebapp secrets list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "properties.apiKey" \
  --output tsv
```

**Copy this token!** It's a long string that starts with letters/numbers.

**Save it somewhere safe** - you'll use it in the next step.

---

## Step 4: Configure Static Web App for Next.js (2 min)

Create configuration file for Azure:

```bash
cd website
```

Create `staticwebapp.config.json`:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/admin/*",
      "allowedRoles": ["anonymous"]
    }
  ],
  "platform": {
    "apiRuntime": "node:18"
  },
  "trailingSlash": "auto",
  "globalHeaders": {
    "cache-control": "public, max-age=31536000, immutable"
  }
}
```

---

## Step 5: Add Environment Variables to Azure (3 min)

Azure Static Web Apps uses "Application settings" for environment variables.

### Add Variables via Azure Portal (Recommended)

1. **Open Azure Portal**
   - Go to: https://portal.azure.com
   - Search for "Static Web Apps"
   - Click your app: `reddyfit-website`

2. **Navigate to Configuration**
   - In left sidebar, click **"Configuration"**
   - Click **"Application settings"** tab

3. **Add Each Variable**
   Click "+ Add" for each:

   | Name | Value (from your .env.local) |
   |------|------------------------------|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API key |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Your Firebase auth domain |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase project ID |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Your Firebase storage bucket |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your messaging sender ID |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | Your Firebase app ID |
   | `RESEND_API_KEY` | Your Resend API key |
   | `NEXT_PUBLIC_SITE_URL` | `https://reddyfit-website-[hash].azurestaticapps.net` |

4. **Save Configuration**
   - Click **"Save"** at the top
   - Click "Yes" to confirm

### Alternative: Add Variables via Azure CLI

```bash
# Add each environment variable
az staticwebapp appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --setting-names \
    NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key" \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_domain.firebaseapp.com" \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id" \
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_bucket.appspot.com" \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789" \
    NEXT_PUBLIC_FIREBASE_APP_ID="1:xxx:web:xxx" \
    RESEND_API_KEY="re_your_key" \
    NEXT_PUBLIC_SITE_URL="https://reddyfit-website-abc123.azurestaticapps.net"
```

---

## Step 6: Build for Static Export (2 min)

Next.js needs special configuration for static export to Azure:

### Update next.config.js

Add `output: 'export'` to your Next.js config:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Add this line
  images: {
    unoptimized: true  // Required for static export
  }
}

module.exports = nextConfig
```

### Build the Site

```bash
cd website

# Build for production
npm run build
```

This creates an `out/` directory with your static files.

**Verify build:**
```bash
# Check the out directory exists
ls out/
```

You should see: `index.html`, `_next/`, and other files.

---

## Step 7: Deploy to Azure (2 min)

Now deploy using the Azure Static Web Apps CLI:

### Install SWA CLI (if not installed)

```bash
npm install -g @azure/static-web-apps-cli
```

### Deploy

```bash
cd website

# Deploy to Azure (use your deployment token from Step 3)
swa deploy ./out \
  --deployment-token "your_deployment_token_here" \
  --env production
```

**Replace `your_deployment_token_here`** with the token from Step 3!

**Deployment process:**
```
Deploying front-end...
✔ Deployed to Azure Static Web Apps!
```

**This uploads:**
- All static HTML/CSS/JS files
- Next.js routing configuration
- API routes as Azure Functions

---

## Step 8: Update Firebase Authorized Domains (1 min)

Critical step for Google Sign-In to work!

1. **Go to Firebase Console**
   - Open: https://console.firebase.google.com
   - Select your waitlist project

2. **Navigate to Authentication**
   - Click "Authentication" in sidebar
   - Go to "Settings" tab
   - Scroll to "Authorized domains"

3. **Add Azure Domain**
   - Click "Add domain"
   - Enter: `reddyfit-website-abc123.azurestaticapps.net`
   - (Use YOUR actual domain from Step 2)
   - Click "Add"

**Without this, Google Sign-In will fail with "redirect_uri_mismatch" error!**

---

## ✅ Deployment Complete!

Your website is now live at:
```
https://reddyfit-website-[your-hash].azurestaticapps.net
```

---

## 🎯 What You Get with Azure Static Web Apps

### Free Tier Includes:
- ✅ **100 GB bandwidth/month** - Plenty for waitlist
- ✅ **HTTPS/SSL** - Automatic and free
- ✅ **Global CDN** - Fast loading worldwide
- ✅ **Custom domains** - Add reddyfit.com later
- ✅ **Auto-scaling** - Handles traffic spikes
- ✅ **Preview deployments** - Test before production

### Performance:
- ⚡ First Load: ~130KB
- ⚡ Global CDN reduces latency
- ⚡ Static files = blazing fast

---

## 📋 Post-Deployment Checklist

**Before sharing publicly:**

- [ ] Visit production URL
- [ ] Test homepage loads correctly
- [ ] Navigate to `/waitlist`
- [ ] Test Google Sign-In
- [ ] Verify email is sent (check Resend dashboard)
- [ ] Check success page with confetti
- [ ] Visit `/admin/waitlist` and verify data
- [ ] Test CSV export
- [ ] Test on mobile device
- [ ] Test in different browsers (Chrome, Safari, Firefox)

**See PRODUCTION_TESTING_CHECKLIST.md for detailed tests.**

---

## 🔄 Making Updates

Need to update your website?

```bash
# Make your changes

# Build locally and test
npm run build
npm run dev

# Deploy updated version
cd website
swa deploy ./out \
  --deployment-token "your_token" \
  --env production
```

**Deployment time:** ~1-2 minutes

---

## 🌐 Custom Domain (Optional)

Want `reddyfit.com` instead of `.azurestaticapps.net`?

### Step 1: Add Custom Domain in Azure

```bash
# Add custom domain
az staticwebapp hostname set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname "www.reddyfit.com"
```

### Step 2: Update DNS Records

Azure will provide DNS records. Add to your domain registrar:

**CNAME Record:**
```
Name: www
Value: reddyfit-website-abc123.azurestaticapps.net
TTL: 3600
```

### Step 3: Update Firebase

Add custom domain to Firebase authorized domains:
- Firebase Console → Authentication → Settings
- Add: `www.reddyfit.com` and `reddyfit.com`

### Step 4: Update Environment Variable

```bash
az staticwebapp appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --setting-names NEXT_PUBLIC_SITE_URL="https://www.reddyfit.com"
```

Then redeploy.

---

## 📊 Monitor Your Deployment

### Azure Portal

1. Go to: https://portal.azure.com
2. Search for "Static Web Apps"
3. Click your app: `reddyfit-website`

**View:**
- Deployment history
- Traffic metrics
- Error logs
- Application settings

### Azure CLI

```bash
# Get app details
az staticwebapp show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# View logs
az staticwebapp logs show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP
```

---

## 💰 Cost Breakdown

### Free Tier (Perfect for Waitlist!)
- **Bandwidth**: 100 GB/month
- **Requests**: Unlimited
- **Build minutes**: 400/month
- **Custom domains**: Included
- **SSL certificates**: Included
- **Cost**: **$0/month**

### When to Upgrade to Standard ($9/month)?
- Need >100 GB bandwidth
- Want staging environments
- Require SLA guarantees

**For waitlist**: Free tier is more than enough!

---

## 🔐 Security Checklist

After deployment:

- [ ] Environment variables in Azure (not in code)
- [ ] Firebase authorized domains updated
- [ ] HTTPS enabled (automatic)
- [ ] API routes secured
- [ ] No secrets in client-side code
- [ ] `.env.local` in `.gitignore`

---

## 🐛 Troubleshooting

### Issue: "Deployment failed"

**Solution:**
1. Check deployment token is correct
2. Verify `out/` directory exists after build
3. Check Azure CLI is logged in: `az account show`
4. Try deploying again

### Issue: Build fails with "output: export not recognized"

**Solution:**
- Check Next.js version is 13+
- Update `next.config.js` with `output: 'export'`
- Ensure `images.unoptimized: true`

### Issue: Google Sign-In fails in production

**Solution:**
1. Add Azure domain to Firebase authorized domains
2. Wait 5 minutes for Firebase to update
3. Clear browser cache
4. Try incognito mode

### Issue: API routes not working

**Solution:**
1. Check `staticwebapp.config.json` exists
2. Verify `/api/*` route is configured
3. Redeploy after adding config

### Issue: Emails not sending in production

**Solution:**
1. Verify `RESEND_API_KEY` in Azure app settings
2. Check Resend dashboard for errors
3. Ensure API key has no quotes or spaces
4. Check you haven't hit free tier limit

### Issue: 404 errors on page refresh

**Solution:**
- Add `navigationFallback` to `staticwebapp.config.json`
- This ensures SPA routing works correctly

---

## 🎉 Congratulations!

Your ReddyFit marketing website with waitlist is now LIVE on Azure! 🚀

**Share your waitlist:**
```
https://reddyfit-website-[your-hash].azurestaticapps.net/waitlist
```

**View admin dashboard:**
```
https://reddyfit-website-[your-hash].azurestaticapps.net/admin/waitlist
```

---

## 📝 Next Steps

1. **Test production** → See PRODUCTION_TESTING_CHECKLIST.md
2. **Share waitlist link** → Social media, email, etc.
3. **Monitor signups** → Check `/admin/waitlist` daily
4. **Export data** → Download CSV for email campaigns
5. **Prepare for launch** → Plan launch email to waitlist

---

**Total deployment time**: 14 minutes

**What you accomplished:**
- ✅ Deployed Next.js to Azure Static Web Apps
- ✅ Configured environment variables
- ✅ Set up Firebase integration
- ✅ Enabled Resend email service
- ✅ Waitlist ready to collect signups!

Start promoting and watch those signups come in! 💪

---

## 🔗 Useful Links

- **Azure Portal**: https://portal.azure.com
- **Azure Static Web Apps Docs**: https://docs.microsoft.com/azure/static-web-apps/
- **Firebase Console**: https://console.firebase.google.com
- **Resend Dashboard**: https://resend.com/emails
- **Next.js Static Export**: https://nextjs.org/docs/advanced-features/static-html-export

---

**Having issues?** Check the troubleshooting section above or review your:
- Build output (`npm run build`)
- Azure deployment logs (Azure Portal)
- Firebase console (authorized domains)
- Resend dashboard (email delivery)
