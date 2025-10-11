# 📧 Resend Setup for ReddyFit Waitlist (3 minutes)

## Why You Need This
Resend sends beautiful welcome emails to everyone who joins your waitlist:
- **Automated welcome emails** - No manual work
- **Professional templates** - HTML emails with your branding
- **Free tier** - 3,000 emails/month at no cost
- **Easy integration** - Just one API key needed

---

## Step-by-Step Setup

### Step 1: Create Resend Account (1 min)

1. **Go to Resend**
   - Open: https://resend.com
   - Click "Get Started" or "Sign Up"

2. **Sign Up**
   - **Option 1**: Sign up with GitHub (fastest)
   - **Option 2**: Sign up with email
   - Complete the signup process

3. **Verify Email**
   - Check your inbox for verification email
   - Click the verification link
   - You'll be redirected to Resend dashboard

---

### Step 2: Get API Key (1 min)

1. **Navigate to API Keys**
   - In Resend dashboard, look for **"API Keys"** in left sidebar
   - Or go directly to: https://resend.com/api-keys

2. **Create API Key**
   - Click **"Create API Key"**
   - **Name**: `ReddyFit Waitlist`
   - **Permission**: Full Access (default)
   - Click "Add"

3. **Copy API Key**
   - You'll see your API key (starts with `re_`)
   - Example: `re_123456789abcdefghijklmnop`
   - **IMPORTANT**: Copy this immediately - you can't see it again!
   - **Save it somewhere safe** - you'll use it in .env.local

---

### Step 3: Test Email Sending (Optional - 1 min)

Before production, Resend gives you a test email address:

- **From**: `onboarding@resend.dev`
- **Limit**: 100 emails/day
- **Use for**: Local testing, development

This works out of the box - no domain verification needed!

---

### Step 4: Verify Your Domain (Optional - Production Only)

**For Development/Testing**: Skip this step - use `onboarding@resend.dev`

**For Production** (when you're ready to go live):

1. **Add Domain**
   - Go to: https://resend.com/domains
   - Click "Add Domain"
   - Enter your domain (e.g., `reddyfit.com` or `mail.reddyfit.com`)

2. **Add DNS Records**
   - Resend will show you 3 DNS records to add
   - Go to your domain provider (Namecheap, GoDaddy, Cloudflare, etc.)
   - Add these DNS records:
     - **SPF record** (TXT)
     - **DKIM record** (TXT)
     - **DMARC record** (TXT)

3. **Verify Domain**
   - Back in Resend, click "Verify"
   - Wait a few minutes for DNS propagation
   - Once verified, you can send from `waitlist@yourdomain.com`

4. **Update Email Code**
   - Edit `website/app/api/waitlist/route.ts`
   - Change line ~50:
   ```typescript
   from: 'ReddyFit <waitlist@yourdomain.com>',  // Use your verified domain
   ```

---

## ✅ Resend Setup Complete!

You now have:
- ✅ Resend account created
- ✅ API key generated and saved
- ✅ Test email address available (`onboarding@resend.dev`)
- ✅ (Optional) Custom domain verified

---

## 🔑 What You Got

| Variable | Example Value | Where to Use |
|----------|---------------|--------------|
| `RESEND_API_KEY` | `re_123456789abcdef...` | .env.local |

---

## 📧 Email Preview

When users join your waitlist, they'll receive:

**Subject**: You're on the ReddyFit Waitlist! 🎉

**Body** (HTML formatted):
- Personalized greeting with their name
- Welcome message
- List of beta benefits:
  - 50% off first month
  - Priority support
  - Beta tester badge
  - AI Agent marketplace access
  - Exclusive Discord channel
  - Feature voting rights
- Social media links
- Professional branding

**Plain text fallback** included for email clients that don't support HTML.

---

## 📊 Resend Free Tier Limits

**What you get for FREE:**
- ✅ 3,000 emails per month
- ✅ Unlimited API keys
- ✅ Custom domains
- ✅ Email tracking
- ✅ Email logs
- ✅ Webhooks

**Perfect for waitlist!**
- 3,000 signups/month = 100/day average
- Track email delivery and opens
- See bounces and complaints

**If you exceed 3,000/month:**
- Upgrade to $20/month for 50,000 emails
- But for waitlist, 3,000 is usually plenty

---

## 🧪 Test Your Setup

After completing setup:

1. **Local Test** (after creating .env.local):
   ```bash
   cd website
   npm run dev
   ```
   - Visit http://localhost:3001/waitlist
   - Sign in with Google
   - Check if email was sent

2. **Check Resend Dashboard**
   - Go to: https://resend.com/emails
   - You'll see your test email delivery status
   - Click to see full email preview

---

## 📝 Next Step

Continue to **setup-env.md** to create your .env.local file!

---

## 🐛 Troubleshooting

### "Missing API key" error
- **Solution**: Make sure you copied the API key correctly
- It should start with `re_`
- Check for extra spaces

### Emails not sending
- **Solution 1**: Check Resend dashboard for error logs
- **Solution 2**: Using test domain? Check 100/day limit
- **Solution 3**: Verify API key is in .env.local

### Emails going to spam
- **For testing**: This is normal with `onboarding@resend.dev`
- **For production**: Verify your custom domain (Step 4)
- Add SPF, DKIM, and DMARC records
- Warm up your domain gradually

### "Domain not verified"
- **Solution**: Check DNS records are correct
- Wait 5-10 minutes for DNS propagation
- Use DNS checker: https://mxtoolbox.com

---

## 💡 Pro Tips

1. **Development**: Use `onboarding@resend.dev` - no setup needed
2. **Production**: Verify custom domain for better deliverability
3. **Monitoring**: Check Resend dashboard daily for issues
4. **Emails**: Test thoroughly before going live
5. **Backups**: Export your API key somewhere safe

---

## 🎉 Success Indicators

You've set up Resend correctly if:
- ✅ You can see API Keys in Resend dashboard
- ✅ You have an API key that starts with `re_`
- ✅ API key is copied and saved

**Estimated time to complete**: 3 minutes

**Total time so far**: 8 minutes (Firebase 5 min + Resend 3 min)

Next: Create .env.local with your credentials →
