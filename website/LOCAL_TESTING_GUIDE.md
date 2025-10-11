# 🧪 Local Testing Guide (5 minutes)

## Before You Start
Make sure you've completed:
- ✅ Firebase setup (FIREBASE_SETUP_GUIDE.md)
- ✅ Resend setup (RESEND_SETUP_GUIDE.md)
- ✅ .env.local created (setup-env.md)

---

## Start the Development Server

```bash
cd website

# Start Next.js dev server
npm run dev
```

**Expected output:**
```
▲ Next.js 14.1.0
- Local:        http://localhost:3001

✓ Ready in 1500ms
```

**If it fails:**
- Check `.env.local` exists and has all variables
- Run `npm install` to ensure dependencies are installed
- Check for syntax errors in .env.local

---

## Test Plan: Complete Waitlist Flow

### Test 1: Homepage & Navigation (1 min)

1. **Open homepage**
   - Visit: http://localhost:3001
   - **Expected**: Hero section loads immediately (not blank)
   - **Check**: All animations work smoothly

2. **Navigate to waitlist**
   - Click "Join Waitlist" button in navigation
   - **Expected**: Redirects to http://localhost:3001/waitlist
   - **Check**: Waitlist page loads with tier selection

---

### Test 2: Waitlist Page UI (1 min)

**URL**: http://localhost:3001/waitlist

**Check the following elements load**:
- [ ] ReddyFit logo and title
- [ ] "Join the ReddyFit Waitlist" heading
- [ ] 4 stats cards (Users, AI Agents, Launch, Early Access)
- [ ] 4 tier options (Starter $29, Pro $69, Elite $149, Platinum $299)
- [ ] Tier selection works (click each tier - should highlight)
- [ ] "Early Access Benefits" section with 6 benefits
- [ ] "Join Waitlist with Google" button (white with Google logo)
- [ ] Privacy note at bottom
- [ ] FAQ section with 4 questions

**Animations**:
- [ ] Logo should pop in with spring animation
- [ ] Stats cards fade in sequentially
- [ ] Smooth transitions when selecting tiers

---

### Test 3: Google Sign-In (2 min)

1. **Select a tier**
   - Click one of the 4 pricing tiers
   - **Expected**: Selected tier highlights with gradient background

2. **Click "Join Waitlist with Google"**
   - **Expected**: Google OAuth popup opens
   - **If popup blocked**: Check browser popup settings

3. **Sign in with Google**
   - Use your Google account
   - **Expected**: OAuth completes, popup closes

4. **Check API call**
   - Open browser DevTools (F12) → Network tab
   - **Look for**: POST request to `/api/waitlist`
   - **Status**: Should be 200 (success)

5. **Check email sent**
   - Go to: https://resend.com/emails
   - **Expected**: New email in "Recent Emails"
   - **Status**: "Delivered" (green)
   - **Click to preview**: See your personalized welcome email

6. **Check your inbox**
   - Check the Gmail account you used to sign in
   - **Subject**: "You're on the ReddyFit Waitlist! 🎉"
   - **From**: "ReddyFit <onboarding@resend.dev>"
   - **Body**: Personalized with your name + benefits list

---

### Test 4: Success Page (1 min)

After signing in successfully:

1. **Redirect to success page**
   - **URL**: http://localhost:3001/waitlist/success?name=YourName
   - **Expected**: Confetti animation 🎉
   - **Check**: Green checkmark with sparkles
   - **Check**: "Welcome to the ReddyFit Waitlist!" heading
   - **Check**: Your name appears in "Thanks for joining, [Name]!"

2. **Verify page content**
   - [ ] 3 "What Happens Next" cards
   - [ ] "Your Beta Tester Benefits" list (6 items with checkmarks)
   - [ ] "Stay Connected" buttons (Twitter, Discord)
   - [ ] "Back to Homepage" button
   - [ ] Emoji footer (💪 🎯 🚀 ⚡ 🔥)

3. **Test navigation**
   - Click "Back to Homepage"
   - **Expected**: Returns to http://localhost:3001

---

### Test 5: Admin Dashboard (1 min)

1. **Navigate to admin**
   - Visit: http://localhost:3001/admin/waitlist
   - **Expected**: Admin dashboard loads

2. **Verify your signup appears**
   - [ ] "Waitlist Dashboard" heading
   - [ ] Total count shows "1 user"
   - [ ] Tier stats show your selected tier
   - [ ] User card shows:
     - Your Google profile photo
     - Your name
     - Your email
     - Selected tier
     - Signup date
     - "Notified: Yes" status

3. **Test CSV export**
   - Click "Export CSV" button
   - **Expected**: Downloads `waitlist-YYYY-MM-DD.csv`
   - **Open CSV**: Should contain your signup data

4. **Test refresh**
   - Click "Refresh" button
   - **Expected**: Spinner animation, then data reloads

---

### Test 6: Duplicate Prevention (30 sec)

1. **Go back to waitlist**
   - Visit: http://localhost:3001/waitlist

2. **Try signing up again**
   - Select any tier
   - Click "Join Waitlist with Google"
   - **Expected**: Error message appears
   - **Message**: "You're already on the waitlist!"
   - **Should NOT**: Send another email

**This is correct behavior!** Prevents duplicate signups.

---

## ✅ Testing Checklist

**UI Tests**:
- [ ] Homepage loads and animates correctly
- [ ] Waitlist page shows all tiers and benefits
- [ ] Tier selection works (highlighting)
- [ ] FAQ section expands/collapses

**Functionality Tests**:
- [ ] Google Sign-In popup opens
- [ ] OAuth completes successfully
- [ ] Email sent via Resend
- [ ] Email received in inbox
- [ ] Success page loads with confetti
- [ ] Admin dashboard shows signup
- [ ] CSV export works
- [ ] Duplicate prevention works

**Data Tests**:
- [ ] User data saved to Firestore correctly
- [ ] Correct tier preference saved
- [ ] Signup date recorded
- [ ] Email notification marked as sent

---

## 📊 Check Firestore Data

1. **Go to Firebase Console**
   - Open: https://console.firebase.google.com
   - Select your project

2. **Navigate to Firestore**
   - Click "Firestore Database"
   - You should see a `waitlist` collection

3. **Verify your document**
   - Click `waitlist` collection
   - You should see 1 document (your user ID)
   - **Fields should include**:
     - `name`: Your name from Google
     - `email`: Your email
     - `photoUrl`: Your Google photo URL
     - `tier`: Your selected tier
     - `signupDate`: ISO timestamp
     - `notified`: true

---

## 🐛 Common Issues & Solutions

### Issue: "Google sign-in failed"
**Symptoms**: Error message after clicking Google button

**Solutions**:
1. Check Firebase Auth is enabled
2. Add `localhost` to Firebase authorized domains
3. Check browser console for specific error
4. Try different Google account
5. Clear browser cache and cookies

---

### Issue: "Failed to join waitlist" (API error)
**Symptoms**: Error after Google sign-in completes

**Solutions**:
1. Check browser console for error details
2. Verify Firestore security rules are set correctly
3. Check Firebase project ID in .env.local matches console
4. Restart dev server after changing .env.local

---

### Issue: Email not received
**Symptoms**: Signed up but no email in inbox

**Solutions**:
1. **Check spam folder** (common with test emails)
2. **Check Resend dashboard**: https://resend.com/emails
   - See if email was sent
   - Check for delivery errors
3. **Verify RESEND_API_KEY** in .env.local is correct
4. **Check Resend free tier limit**: 100 emails/day with test domain

---

### Issue: "You're already on the waitlist" (when not true)
**Symptoms**: Can't sign up with same Google account

**Solutions**:
1. This is normal! Each Google account can only sign up once
2. To test again:
   - Use a different Google account
   - OR delete your document from Firestore
   - OR clear Firestore and start fresh

---

### Issue: Admin dashboard empty
**Symptoms**: No users shown in admin dashboard

**Solutions**:
1. Click "Refresh" button
2. Check Firestore Console - is data there?
3. Check browser console for errors
4. Verify Firestore security rules allow reads

---

### Issue: Confetti not showing
**Symptoms**: Success page loads but no confetti animation

**Solutions**:
1. This is a minor cosmetic issue
2. Check browser console for JS errors
3. Verify `canvas-confetti` installed: `npm install canvas-confetti`
4. Confetti may not work in some browsers - try Chrome

---

## 💡 Pro Testing Tips

1. **Test with multiple Google accounts**
   - Personal Gmail
   - Work email
   - Test account

2. **Test on different browsers**
   - Chrome (best support)
   - Firefox
   - Safari
   - Edge

3. **Test mobile responsiveness**
   - Open DevTools (F12)
   - Toggle device toolbar
   - Test iPhone, Android, Tablet views

4. **Monitor Resend dashboard**
   - Keep https://resend.com/emails open
   - Watch emails send in real-time

5. **Monitor Firestore**
   - Keep Firebase Console open
   - Watch documents create in real-time

---

## 🎉 Success Indicators

Your local setup is working perfectly if:
- ✅ Waitlist page loads with all tiers
- ✅ Google Sign-In works
- ✅ Email sent and received
- ✅ Success page shows confetti
- ✅ Admin dashboard shows signup
- ✅ CSV export works
- ✅ Duplicate signup prevented
- ✅ Data visible in Firestore Console

**Estimated testing time**: 5 minutes

**Total time so far**: 15 minutes

---

## 📝 Next Step

Everything working locally? Time to deploy to production!

Continue to **VERCEL_DEPLOYMENT_GUIDE.md** →

---

## 📸 Expected Screenshots

### Waitlist Page
- Gradient background
- 4 tier cards with pricing
- Google button prominent
- Benefits section highlighted

### Success Page
- Green checkmark animation
- Confetti particles
- Personalized welcome message
- Beta benefits list

### Admin Dashboard
- User count and tier stats
- User cards with photos
- Export and refresh buttons
- Clean, organized layout

If your local testing matches these expectations, you're ready for production deployment! 🚀
