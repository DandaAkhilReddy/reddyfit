# Islanders Cricket Team Management Website

A comprehensive cricket team management platform for the **Islanders Cricket Team** from Corpus Christi, Texas. Proudly sponsored by **Dr. Vishnu Reddy & Dr. Veena Reddy** (HHA Medicine).

## Features

### ✅ Completed
- 🏏 **Home Page** with team branding and sponsor recognition
- 👥 **Squad Page** with all 14 players and role filtering
- 🏆 **Leadership Structure** displaying the complete hierarchy
- 🔐 **Authentication System** with Firebase (role-based access)
- 🎨 **Islanders Theme** with Island Blue, Cricket Green, and Texas Gold colors
- 📱 **Fully Responsive** design
- 🌙 **Dark Mode** support
- 🔥 **Firebase Integration** (Auth, Firestore, Storage)

### 🚧 Coming Soon
- Match management and scorecards
- Practice schedule and attendance tracking
- Equipment inventory management
- Budget and expense tracking
- Communications hub with announcements
- Player self-editing capabilities
- Admin dashboard for team management

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Routing:** React Router DOM
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Charts:** Recharts

## Squad

### Leadership
- 🏏 **Principal & Chief Mentor:** Dr. Vishnu Reddy
- 🧔🏻‍♂️ **Manager & Cofounder:** Sai Swaroop Naidu
- 🎯 **Director & Mentor:** Rajasekhar Reddy
- 🏆 **Captain:** Akhil Reddy Danda
- 💪 **Vice Captain:** Faizan Mohammad
- 🤝 **Associate Vice Captain:** Nitish
- ⚙️ **Quality Directors:** Harshith & Dinesh Reddy

### Players (14 Total)
- Vishnu Reddy (Batsman, Right)
- Akhil Reddy Danda (Allrounder, Right) - Captain
- Rajasekhar Reddy (Allrounder)
- Faizan Mohammad (Allrounder, Right) - Vice Captain
- Nitish (Allrounder, Right) - Associate VC
- Dinesh Reddy (Allrounder, Right) - Quality Director
- Charan (Allrounder, Left)
- Sampath Reddy (WK-Batsman, Right)
- Harshith (Allrounder, Left) - Quality Director
- Karthikeya (Allrounder, Right)
- Pushkar (Allrounder, Right)
- Farhan (Allrounder, Right)
- Pardha (Allrounder, Right)
- Shaswath (Bowler, Right)

## Setup Instructions

### 1. Install Dependencies
```bash
cd cricket-team-management
npm install
```

### 2. Configure Firebase
1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Storage
5. Copy your Firebase configuration
6. Update the `.env` file with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Deploy Firebase Security Rules
Deploy the Firestore and Storage rules:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select your project)
firebase init

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 4. Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Build for Production
```bash
npm run build
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment
```bash
npm run build
# Deploy the `dist` folder to your hosting provider
```

## Firebase Setup

### Create Admin User
After setting up Firebase, create an admin user:

```javascript
// Run this in Firebase Console > Authentication
// Or use Firebase Admin SDK
{
  email: "admin@islanders.com",
  password: "your-secure-password",
  displayName: "Admin"
}

// Then in Firestore, create a document in 'users' collection:
{
  uid: "the-auth-uid",
  email: "admin@islanders.com",
  role: "admin",
  displayName: "Admin",
  createdAt: new Date()
}
```

### Create Player Accounts
For each player, create an account and link it to their player profile.

## Project Structure

```
cricket-team-management/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Layout.tsx
│   │   ├── Loader.tsx
│   │   └── Navbar.tsx
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx
│   ├── data/            # Initial data
│   │   ├── players.ts
│   │   └── leadership.ts
│   ├── lib/             # Configuration
│   │   └── firebase.ts
│   ├── pages/           # Page components
│   │   ├── Home.tsx
│   │   ├── Squad.tsx
│   │   ├── Leadership.tsx
│   │   ├── Login.tsx
│   │   └── ... (more pages)
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── firestore.rules      # Firestore security rules
├── storage.rules        # Storage security rules
├── .env                 # Environment variables
├── tailwind.config.js   # Tailwind configuration
└── package.json         # Dependencies
```

## Color Theme

- **Island Blue:** #0066CC - Primary team color
- **Cricket Green:** #228B22 - Secondary color
- **Texas Gold:** #FFB81C - Accent color for sponsors

## Contributing

This is a private team management system. For feature requests or issues, please contact the team administrators.

## License

Private - © 2025 Islanders Cricket Team

## Acknowledgments

Special thanks to our sponsors **Dr. Vishnu Reddy & Dr. Veena Reddy** (HHA Medicine) for making this possible!

---

**Islanders by name, Islanders by spirit** 💙🏏

From the shores of Corpus Christi, Texas
