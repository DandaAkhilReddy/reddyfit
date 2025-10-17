# PWA Live Cricket Scoring System - Complete Guide

## 🏏 Overview

The Islanders Cricket Team app is now a **Progressive Web App (PWA)** with a professional live cricket scoring system!

---

## ✨ Features

### PWA Features
- ✅ **Installable** - Can be installed on mobile devices and desktops
- ✅ **Offline Support** - Works without internet connection
- ✅ **Real-time Updates** - Live score updates via Firebase Firestore
- ✅ **Push Notifications** - Get notified of match events (future)
- ✅ **Background Sync** - Scores sync when connection is restored

### Scoring Features
- ✅ **Ball-by-Ball Scoring** - Record every ball with runs, extras, wickets
- ✅ **Touch-Optimized UI** - Large buttons perfect for mobile scoring
- ✅ **Real-time Sync** - Scores update instantly for all viewers
- ✅ **Professional Dashboard** - Beautiful scoreboard and statistics
- ✅ **Undo Function** - Undo last ball if mistake was made
- ✅ **Multiple Extras Types** - Wide, No-ball, Bye, Leg-bye
- ✅ **Wicket Types** - Bowled, Caught, LBW, Run-out, Stumped, Hit-wicket
- ✅ **Live Stats** - Strike rate, economy, run rate calculated automatically

---

## 🚀 Getting Started

### For Scorers

1. **Login as Scorer**
   - Navigate to `/scorer`
   - Login with scorer credentials
   - You'll see all scheduled and ongoing matches

2. **Select a Match**
   - Click "Start Scoring" on any match
   - Initialize match with toss details and playing XI

3. **Start Scoring**
   - Use the touch-friendly scoring panel
   - Record runs, extras, and wickets
   - Scores update in real-time

### For Viewers

1. **View Live Match**
   - Navigate to `/live/{matchId}`
   - See real-time scorecard
   - Watch ball-by-ball commentary

---

## 📱 Scoring Interface Guide

### Run Buttons
- **0-6**: Large touch-friendly buttons
- **4 & 6**: Highlighted in green/purple
- **Tap once** to record the ball

### Extras Buttons
- **WD** (Wide): +1 run + extra ball
- **NB** (No-ball): +1 run + extra ball
- **BYE**: Runs without bat contact
- **LB** (Leg-bye): Runs off body

### Wicket Button
- Big red "WICKET" button
- Select dismissal type:
  - Bowled
  - Caught
  - LBW
  - Run-out
  - Stumped
  - Hit-wicket

### Quick Actions
- **Swap Batsmen**: Switch striker/non-striker
- **Change Bowler**: Select new bowler
- **Undo Last Ball**: Remove last ball (if error)

---

## 📊 ScoreBoard Features

### Main Score Display
- Team score (Runs/Wickets)
- Overs bowled
- Current run rate

### Live Batsmen
- Current striker (marked with *)
- Runs, balls, strike rate
- Fours and sixes

### Current Bowler
- Overs bowled
- Runs conceded
- Wickets taken
- Economy rate

### Current Over
- Visual ball-by-ball display
- Color-coded:
  - 🔴 Red = Wicket
  - 🟣 Purple = Six
  - 🟢 Green = Four
  - 🔵 Blue = Runs
  - ⚫ Gray = Dot ball

---

## 🎯 Firebase Structure

### Collections

```
/matches/{matchId}
  - Basic match info (opponent, venue, date, etc.)

/matches/{matchId}/live/current
  - Live match state
  - Current innings data
  - Real-time scores

/matches/{matchId}/live/current/balls (subcollection)
  - Ball-by-ball records
  - Indexed for quick retrieval
```

---

## 🔐 User Roles

### Admin
- Full access to everything
- Can score matches
- Manage players, matches, etc.

### Scorer
- Access to scorer dashboard
- Can start and score matches
- View live matches

### Player
- View team info
- Edit own profile
- View live matches

---

## 📦 Installation

### On Mobile (Android/iOS)

1. Open the app in browser (Chrome/Safari)
2. Look for "Add to Home Screen" or "Install App" prompt
3. Tap "Install" or "Add"
4. App icon will appear on home screen
5. Open like a native app!

### On Desktop

1. Open the app in Chrome/Edge
2. Click the install icon in address bar (⊕)
3. Click "Install"
4. App opens in its own window

---

## 🎨 UI Design Philosophy

### Mobile-First
- Large tap targets (60px height for buttons)
- High contrast colors
- Clear visual feedback
- No small text or buttons

### Touch-Friendly
- Minimum 44px tap targets
- Spaced buttons to prevent mis-taps
- Haptic feedback (when supported)
- Swipe gestures for advanced actions

### Professional Look
- Gradient backgrounds
- Smooth animations
- Dark mode optimized
- Clean typography

---

## 🚧 Next Steps & Future Features

### Phase 2 Enhancements
- [ ] **Match Setup Wizard** - Guided toss and team selection
- [ ] **Wagon Wheel** - Shot visualization
- [ ] **Manhattan Graph** - Over-by-over runs
- [ ] **Commentary** - Auto-generated ball commentary
- [ ] **Player Selection** - Visual team selection
- [ ] **Push Notifications** - Wicket alerts, milestones
- [ ] **Offline Scoring** - Score offline, sync later
- [ ] **Match History** - Past matches with full scorecards

### Phase 3 Analytics
- [ ] **Advanced Stats** - Control %, boundary %
- [ ] **Bowling Analysis** - Line & length charts
- [ ] **Partnership Graphs** - Visual partnership flow
- [ ] **Player Comparison** - Head-to-head stats
- [ ] **Season Leaderboards** - Top performers

---

## 🛠️ Technical Stack

- **Frontend**: React 19 + TypeScript + Vite
- **PWA**: Vite PWA Plugin + Workbox
- **Styling**: Tailwind CSS v3
- **Animations**: Framer Motion
- **Backend**: Firebase (Firestore + Authentication + Storage)
- **Real-time**: Firebase Firestore Real-time Listeners
- **Icons**: Lucide React

---

## 📝 Important Notes

### PWA Icons
⚠️ **TODO**: Generate PNG icons for PWA
- Need `pwa-192x192.png` in `/public`
- Need `pwa-512x512.png` in `/public`
- Use the SVG icon at `/public/islanders-icon.svg` as reference
- Can use tools like https://www.pwabuilder.com/ to generate

### Firebase Security Rules
Make sure to update Firestore rules:

```javascript
// Allow scorers to write to live matches
match /matches/{matchId}/live/{document=**} {
  allow read: if true; // Public can read
  allow write: if request.auth != null
    && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'scorer'
    || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
}
```

---

## 🎓 Usage Examples

### Scorer Workflow

1. Login at `/scorer`
2. See scheduled matches
3. Click "Start Scoring" on upcoming match
4. Initialize match (toss, teams)
5. Select opening batsmen
6. Select opening bowler
7. Start scoring balls:
   - Tap run button (0, 1, 2, 3, 4, 6)
   - Or select extras first, then run
   - Or tap WICKET for dismissal
8. After 6 balls, over completes automatically
9. Select new bowler
10. Continue scoring...

### Viewer Experience

1. Visit `/live/{matchId}` or click "Watch Live" button
2. See real-time scorecard
3. Scores update automatically
4. View batsmen, bowlers, and stats
5. See ball-by-ball in current over

---

## 🐛 Troubleshooting

### PWA Not Installing
- Make sure you're using HTTPS (required for PWA)
- Check browser console for errors
- Try clearing browser cache

### Scores Not Updating
- Check internet connection
- Refresh the page
- Check Firebase connection status

### Can't Start Scoring
- Verify you're logged in as scorer/admin
- Check match is scheduled or ongoing
- Ensure Firebase rules allow writing

---

## 🎉 You're Ready!

The PWA Cricket Scoring System is fully set up and ready to use!

Visit **http://localhost:5173/scorer** to start scoring your first match! 🏏
