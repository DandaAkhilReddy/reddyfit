# Islanders Cricket Team - Implementation Guide

## 🎉 What's Been Completed

### ✅ Phase 1: Core Features (100% Complete)
- **Google Sign-In Integration** ✅
  - Google OAuth via Firebase
  - One-click login with Google account
  - Automatic user profile creation
  - Profile photo sync from Google
- **Enhanced Authentication** ✅
  - Email/password + Google sign-in
  - Role-based access control (admin/player)
  - Protected routes
  - Session management
- **Admin Panel Foundation** ✅
  - Admin layout with collapsible sidebar
  - Dashboard home with live stats
  - Quick actions for common tasks
  - Protected admin-only routes
- **Beautiful UI** ✅
  - Responsive design
  - Dark mode support
  - Smooth animations
  - Islanders branding

---

## 📂 Project Structure

```
cricket-team-management/
├── src/
│   ├── components/
│   │   ├── AdminLayout.tsx      ✅ NEW - Admin sidebar layout
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Layout.tsx
│   │   ├── Loader.tsx
│   │   └── Navbar.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx      ✅ UPDATED - Added Google Sign-In
│   ├── data/
│   │   ├── players.ts           ✅ All 14 players
│   │   └── leadership.ts        ✅ Leadership hierarchy
│   ├── lib/
│   │   └── firebase.ts
│   ├── pages/
│   │   ├── admin/
│   │   │   └── Dashboard.tsx    ✅ NEW - Admin dashboard home
│   │   ├── Home.tsx
│   │   ├── Squad.tsx
│   │   ├── Leadership.tsx
│   │   ├── Login.tsx            ✅ UPDATED - Google Sign-In button
│   │   ├── Matches.tsx
│   │   ├── Practice.tsx
│   │   ├── Equipment.tsx
│   │   ├── Budget.tsx
│   │   └── Communications.tsx
│   ├── types/
│   │   └── index.ts             ✅ UPDATED - Added photoURL
│   ├── App.tsx                  ✅ UPDATED - Admin routes
│   └── main.tsx
├── .env                          Configure Firebase here
├── firestore.rules               Deploy to Firebase
├── storage.rules                 Deploy to Firebase
└── README.md
```

---

## 🔐 Firebase Setup (CRITICAL STEP)

### 1. Enable Google Sign-In
```bash
# Go to Firebase Console
1. Navigate to Authentication > Sign-in method
2. Click "Google" provider
3. Toggle "Enable"
4. Save changes
```

### 2. Deploy Security Rules
```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Firestore
# - Storage
# - Choose your project
# - Use existing rules files

# Deploy rules
firebase deploy --only firestore:rules,storage:rules
```

### 3. Create Admin Account
```javascript
// Option 1: Firebase Console
1. Go to Firebase Console > Authentication
2. Click "Add user"
3. Email: your-admin@email.com
4. Password: (create strong password)
5. Click "Add user"

// Option 2: Sign up with Google
1. Go to /login on your website
2. Click "Sign in with Google"
3. This creates a player account by default

// Then in Firestore:
1. Go to Firestore Database
2. Find 'users' collection
3. Find your user document
4. Edit the 'role' field to 'admin'
```

---

## 🛠️ Building the Rest of the Admin Panel

### Next Steps (Priority Order):

#### 1. Player Management (HIGH PRIORITY)
Create these files:

**`src/pages/admin/Players.tsx`** - List all players
```typescript
// Features:
- Table view with search
- Filter by role/position/status
- Click player to edit
- Delete player button
- "Add Player" button
```

**`src/pages/admin/PlayerForm.tsx`** - Add/Edit player
```typescript
// Form fields:
- Name, role, batting hand, position
- Bio, contact info
- Photo upload (Firebase Storage)
- Stats (runs, wickets, etc.)
- Equipment assignment
- Active status toggle
```

**Key Firebase Operations:**
```typescript
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

// Add player
const playersRef = collection(db, 'players');
await addDoc(playersRef, playerData);

// Upload photo
const storageRef = ref(storage, `players/${playerId}/photo.jpg`);
await uploadBytes(storageRef, file);
const photoURL = await getDownloadURL(storageRef);

// Update player
await updateDoc(doc(db, 'players', playerId), { photoURL });

// Delete player
await deleteDoc(doc(db, 'players', playerId));
```

#### 2. Match Management (HIGH PRIORITY)

**`src/pages/admin/Matches.tsx`** - List/calendar view
```typescript
// Use react-big-calendar for calendar view
npm install react-big-calendar date-fns

// Features:
- Calendar view + list view toggle
- Filter by status (scheduled/completed)
- Click match to view details
```

**`src/pages/admin/MatchForm.tsx`** - Add/Edit match
```typescript
// Sections:
1. Basic Info: date, time, opponent, location, type
2. Result: won/lost/tied, scores
3. Scorecard Builder:
   - Batting table (player, runs, balls, 4s, 6s)
   - Bowling table (player, overs, wickets, runs)
4. Player of the Match selector
5. Photos gallery uploader
6. Expenses section
```

#### 3. Practice Management (HIGH PRIORITY)

**`src/pages/admin/Practice.tsx`** - Schedule view
```typescript
// Features:
- Calendar interface
- Drag-and-drop to create session
- Click to view/edit
```

**`src/pages/admin/PracticeForm.tsx`**
```typescript
// Form:
- Date, time, duration
- Type (dropdown)
- Location
- Focus areas (tags)
- Attendance checklist (all players)
```

#### 4. Equipment Management (MEDIUM PRIORITY)

**`src/pages/admin/Equipment.tsx`**
```typescript
// Dashboard:
- Category tabs (Bats, Balls, Gear, Kit)
- Grid/list view
- Condition indicators
- Assignment status
```

#### 5. Budget & Finance (MEDIUM PRIORITY)

**`src/pages/admin/Budget.tsx`**
```typescript
// Sections:
- Budget overview (gauges, pie charts)
- Expense table with filters
- Add expense form
- Monthly trends chart
- Export to Excel button
```

#### 6. Communications (MEDIUM PRIORITY)

**`src/pages/admin/Communications.tsx`**
```typescript
// Tabs:
1. Announcements (CRUD)
2. Messages (view/moderate)
3. Documents (upload/organize)
```

#### 7. User Management (LOW PRIORITY)

**`src/pages/admin/Users.tsx`**
```typescript
// Features:
- List all users
- Edit roles
- Create new users
- Send invite emails
- Disable accounts
```

#### 8. Reports & Analytics (LOW PRIORITY)

**`src/pages/admin/Reports.tsx`**
```typescript
// Report types:
- Team performance
- Player statistics
- Financial summaries
- Attendance reports
- Custom date range reports
```

#### 9. Settings (LOW PRIORITY)

**`src/pages/admin/Settings.tsx`**
```typescript
// Settings categories:
- Team profile
- Sponsor management
- Season settings
- Notification preferences
```

---

## 📊 Using Charts (Recharts)

```typescript
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// Example: Budget pie chart
const data = [
  { name: 'Equipment', value: 15000 },
  { name: 'Ground Fees', value: 8000 },
  { name: 'Travel', value: 12000 },
];

<PieChart width={400} height={400}>
  <Pie data={data} dataKey="value" nameKey="name" fill="#0066CC" label />
</PieChart>
```

---

## 📤 File Upload Pattern

```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './lib/firebase';

async function uploadFile(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
}

// Usage:
const photoURL = await uploadFile(file, `players/${playerId}/photo.jpg`);
```

---

## 🎨 Using react-hook-form (Forms)

```typescript
import { useForm } from 'react-hook-form';

function PlayerForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    // Save to Firestore
    await addDoc(collection(db, 'players'), data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name', { required: 'Name is required' })}
        placeholder="Player Name"
      />
      {errors.name && <span>{errors.name.message}</span>}

      <button type="submit">Save</button>
    </form>
  );
}
```

---

## 🔔 Toast Notifications

```typescript
import toast, { Toaster } from 'react-hot-toast';

// Add to App.tsx
<Toaster position="top-right" />

// Usage:
toast.success('Player added successfully!');
toast.error('Failed to save player');
toast.loading('Uploading photo...');
```

---

## 🗄️ Firestore Query Patterns

```typescript
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// Get active players
const q = query(
  collection(db, 'players'),
  where('isActive', '==', true),
  orderBy('name')
);
const snapshot = await getDocs(q);
const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// Get upcoming matches
const matchesQuery = query(
  collection(db, 'matches'),
  where('status', '==', 'scheduled'),
  where('date', '>=', new Date()),
  orderBy('date'),
  limit(10)
);
```

---

## 🔒 Protected Route Pattern

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
}

// Usage in App.tsx:
<Route
  path="/admin/*"
  element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>}
/>
```

---

## 📱 Making it a PWA

**1. Create `public/manifest.json`:**
```json
{
  "name": "Islanders Cricket Team",
  "short_name": "Islanders",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0066CC",
  "background_color": "#ffffff"
}
```

**2. Register service worker in `index.html`:**
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0066CC">
```

---

## 🧪 Testing

```bash
# Install testing libraries
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm run test
```

---

## 🚀 Deployment Checklist

- [ ] Firebase project created
- [ ] Google Sign-In enabled
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Admin user created
- [ ] Environment variables set in Vercel
- [ ] Firebase config added to .env
- [ ] Site deployed to Vercel
- [ ] Custom domain configured (optional)

---

## 🎯 Feature Development Roadmap

### Week 1-2: Core Admin Features
- [ ] Player Management (CRUD)
- [ ] Match Management (basic)
- [ ] Practice Management (basic)

### Week 3-4: Data Management
- [ ] Equipment Inventory
- [ ] Budget & Finance
- [ ] Communications Hub

### Week 5-6: Advanced Features
- [ ] Reports & Analytics
- [ ] User Management
- [ ] Settings Panel

### Week 7+: Enhancements
- [ ] Advanced statistics
- [ ] Photo galleries
- [ ] Email notifications
- [ ] Mobile app (PWA)
- [ ] API integrations

---

## 💡 Pro Tips

1. **Use Firebase Emulator for Testing:**
```bash
firebase emulators:start
```

2. **Batch Operations:**
```typescript
import { writeBatch } from 'firebase/firestore';

const batch = writeBatch(db);
batch.set(doc(db, 'players', 'id1'), data1);
batch.update(doc(db, 'players', 'id2'), data2);
await batch.commit();
```

3. **Real-time Listeners:**
```typescript
import { onSnapshot } from 'firebase/firestore';

onSnapshot(collection(db, 'matches'), (snapshot) => {
  const matches = snapshot.docs.map(doc => doc.data());
  setMatches(matches);
});
```

4. **Pagination:**
```typescript
import { startAfter, limit } from 'firebase/firestore';

const q = query(collection(db, 'players'), limit(25));
const snapshot = await getDocs(q);
const lastDoc = snapshot.docs[snapshot.docs.length - 1];

// Next page
const nextQ = query(
  collection(db, 'players'),
  startAfter(lastDoc),
  limit(25)
);
```

---

## 📞 Need Help?

- **Firebase Docs:** https://firebase.google.com/docs
- **React Hook Form:** https://react-hook-form.com/
- **Recharts:** https://recharts.org/
- **Tailwind CSS:** https://tailwindcss.com/docs

---

**Happy Coding! 🏏💙**

*Islanders by name, Islanders by spirit*