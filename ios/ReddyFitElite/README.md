# ReddyFit Elite - iOS App

**Elite fitness tracking with multi-source data integration and AI-powered photo steganography**

## 🎯 Overview

ReddyFit Elite is a premium iOS fitness application that supports three data sources:
- **Whoop** (Elite tier $149/mo) - Most accurate with HRV, Recovery, Strain
- **Apple HealthKit** (Pro tier $69/mo) - Apple Watch integration
- **Manual Entry** (Starter tier $29/mo) - Manual workout logging

### 🌟 Key Innovation: Photo Steganography

Users can embed workout metadata (achievements, stats, recovery) into photos using LSB + EXIF steganography. Anyone can scan these photos to view the embedded data - perfect for social sharing!

---

## 📱 App Structure

### Models (`Models/`)

#### `User.swift`
- User profile with subscription tiers (Starter, Pro, Elite, Platinum)
- Data source management (Whoop, HealthKit, Manual)
- Subscription status and renewals
- User stats (workouts, calories, distance, streak)

#### `Workout.swift`
- Universal workout model supporting all data sources
- Heart rate zones, distance, calories
- Whoop-specific fields (strain, kilojoules)
- Manual entry fields (notes, perceived exertion)

#### `WhoopData.swift`
- `WhoopRecovery`: Recovery score, HRV, resting HR, SpO2
- `WhoopStrain`: Daily strain (0-21), HR data
- `WhoopSleep`: Sleep stages, performance, efficiency
- `WhoopCycle`: 24-hour strain cycles
- `WhoopInsights`: AI recommendations and warnings

#### `NutritionEntry.swift`
- AI photo food tracking
- Macros (protein, carbs, fat, fiber)
- Daily nutrition summaries
- Customizable nutrition goals

### Services (`Services/`)

#### `APIService.swift`
**Connects to FastAPI backend**

Key endpoints:
```swift
// Whoop Integration
initiateWhoopAuth(userId:) -> WhoopAuthResponse
handleWhoopCallback(userId:code:state:) -> WhoopTokenResponse
syncWhoopData(userId:) -> WhoopSyncResponse
getWhoopInsights(userId:) -> WhoopInsights

// Photo Steganography
embedWorkoutMetadata(userId:workoutId:photo:) -> PhotoEmbedResponse
extractWorkoutMetadata(photo:) -> PhotoExtractResponse

// Nutrition
analyzeFood(photo:mealType:) -> NutritionAnalysisResponse
```

#### `WhoopService.swift`
**Whoop OAuth and data sync**

Features:
- ASWebAuthenticationSession for OAuth flow
- Secure token exchange via backend
- Real-time data syncing (recovery, strain, sleep)
- AI insights generation

#### `PhotoService.swift`
**Photo capture and steganography**

Features:
- Camera and photo library permissions
- Metadata embedding in workout photos
- Photo scanning to extract achievements
- Social sharing integration
- Default background generation

### ViewModels (`ViewModels/`)

#### `AuthViewModel.swift`
**Authentication state management**

Features:
- Firebase Authentication
- Email/password sign in/up
- Apple Sign In (coming soon)
- Google Sign In (coming soon)
- Password reset
- Auto token refresh

#### `UserViewModel.swift`
**User profile and subscription management**

Features:
- Real-time Firestore sync
- Subscription tier management
- Whoop connection status
- HealthKit enablement
- Stats tracking

### Views (`Views/`)

#### `ContentView.swift`
**Root navigation**

Flow:
- Not authenticated → `LoginView`
- Authenticated but not onboarded → `OnboardingView`
- Ready → `MainTabView` (Dashboard, Workouts, Nutrition, Achievements, Profile)

#### `LoginView.swift`
**Authentication screen**

Features:
- Email/password login
- Sign up flow
- Social auth buttons
- Custom gradient background
- Error handling

#### `OnboardingView.swift`
**Onboarding flow (5 steps)**

Steps:
1. Welcome screen
2. Select data source (Whoop/HealthKit/Manual)
3. Choose subscription tier
4. Profile setup (age, weight, gender)
5. Complete setup

#### `DashboardView.swift`
**Main dashboard with data-source specific content**

**Whoop Dashboard:**
- Recovery ring with HRV and resting HR
- Target strain recommendations
- Sleep quality breakdown
- AI recommendations and warnings

**HealthKit Dashboard:**
- Coming soon - Apple Watch integration

**Manual Dashboard:**
- Quick workout logging CTA
- Recent activity

#### `WorkoutsView.swift`
**Workout history and logging**

Features:
- Weekly stats (workouts, minutes, calories)
- Workout list
- Manual workout entry form
- Sport type selection

#### `NutritionView.swift`
**Nutrition tracking with AI**

Features:
- Daily calorie progress
- Macros breakdown (protein, carbs, fat)
- Photo food tracking with Gemini Vision AI
- Meal type selection
- Meal history

#### `AchievementsView.swift`
**Achievements and photo steganography showcase**

Features:
- Achievement stats overview
- Photo scanner CTA
- Achievements grid with unlock status
- Scanned metadata viewer
- Verification badge for authentic photos

#### `ProfileView.swift`
**User profile and settings**

Features:
- Profile header with subscription tier
- Subscription management
- Integrations (Whoop, HealthKit)
- Settings (notifications, privacy, support)
- Sign out

---

## 🔧 Setup Instructions

### Prerequisites
- Xcode 15+ (macOS required)
- iOS 17+ deployment target
- Firebase project configured
- ReddyFit backend API running

### 1. Create Xcode Project

```bash
# Open Xcode
# File → New → Project
# iOS → App
# Product Name: ReddyFitElite
# Interface: SwiftUI
# Language: Swift
```

### 2. Add Dependencies

**Via Swift Package Manager:**

```
Firebase (https://github.com/firebase/firebase-ios-sdk)
- FirebaseAuth
- FirebaseFirestore
- FirebaseStorage
```

### 3. Configure Firebase

1. Download `GoogleService-Info.plist` from Firebase Console
2. Add to Xcode project root
3. Initialize in `ReddyFitEliteApp.swift`:

```swift
import Firebase

@main
struct ReddyFitEliteApp: App {
    init() {
        FirebaseApp.configure()
    }
}
```

### 4. Set Backend URL

Create `Config.xcconfig`:

```
API_BASE_URL = https://reddyfit-api.azurewebsites.net
```

Or set environment variable in Xcode scheme.

### 5. Add Capabilities

**Xcode → Target → Signing & Capabilities:**

- ✅ HealthKit
- ✅ Background Modes (Background fetch)
- ✅ Push Notifications

### 6. Update Info.plist

```xml
<key>NSCameraUsageDescription</key>
<string>Take photos of meals and workouts</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Save workout achievement photos</string>

<key>NSHealthShareUsageDescription</key>
<string>Read workout data from Apple Health</string>

<key>NSHealthUpdateUsageDescription</key>
<string>Write workout data to Apple Health</string>

<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>reddyfit</string>
        </array>
    </dict>
</array>
```

### 7. Copy Swift Files

Copy all files from this repository into your Xcode project:

```
ReddyFitElite/
├── ReddyFitEliteApp.swift
├── Models/
│   ├── User.swift
│   ├── Workout.swift
│   ├── WhoopData.swift
│   └── NutritionEntry.swift
├── Views/
│   ├── ContentView.swift
│   ├── LoginView.swift
│   ├── OnboardingView.swift
│   ├── DashboardView.swift
│   ├── WorkoutsView.swift
│   ├── NutritionView.swift
│   ├── AchievementsView.swift
│   └── ProfileView.swift
├── ViewModels/
│   ├── AuthViewModel.swift
│   └── UserViewModel.swift
└── Services/
    ├── APIService.swift
    ├── WhoopService.swift
    └── PhotoService.swift
```

### 8. Build and Run

```
⌘ + R (Run in simulator)
⌘ + Shift + K (Clean build folder if errors)
```

---

## 🔐 Whoop OAuth Setup

### 1. Register with Whoop

1. Go to [Whoop Developers](https://developer.whoop.com)
2. Create application
3. Set redirect URI: `reddyfit://whoop-callback`
4. Get Client ID and Client Secret

### 2. Configure Backend

Update `backend/.env`:

```bash
WHOOP_CLIENT_ID=your_client_id
WHOOP_CLIENT_SECRET=your_client_secret
WHOOP_REDIRECT_URI=reddyfit://whoop-callback
```

### 3. Test OAuth Flow

1. Sign in to app
2. Navigate to Profile → Integrations
3. Tap "Connect Whoop"
4. Complete OAuth flow in browser
5. App receives callback and syncs data

---

## 📸 Photo Steganography Flow

### Embedding Metadata

```swift
// User takes workout photo
let photo = UIImage(...)

// Service embeds metadata
let embeddedPhoto = await photoService.embedWorkoutMetadata(
    userId: "user123",
    workoutId: "workout456",
    image: photo
)

// Save or share embedded photo
await photoService.saveToPhotoLibrary(embeddedPhoto)
```

**What's embedded:**
- User name and tier
- Workout type, duration, HR data
- Recovery score, HRV
- Achievements
- Digital signature for verification

### Scanning Photos

```swift
// User uploads photo
let scannedPhoto = UIImage(...)

// Service extracts metadata
let metadata = await photoService.extractMetadata(from: scannedPhoto)

if metadata.found && metadata.verified {
    // Show workout stats and achievements
}
```

---

## 📊 Subscription Tiers

| Tier | Price | Data Source | Features |
|------|-------|-------------|----------|
| **Starter** | $29/mo | Manual | Manual logging, AI food tracking, Basic achievements |
| **Pro** | $69/mo | HealthKit | + Apple Watch sync, Advanced insights, HR zones |
| **Elite** | $149/mo | Whoop | + HRV tracking, Recovery optimization, Photo steganography |
| **Platinum** | $299/mo | All | + Human coach, Unlimited AI, White-glove concierge |

**Cost per user:** ~$11/mo (Supermemory $9 + AI $2)

**Profit margins:** 62% - 96%

---

## 🚀 Next Steps

### Pending Implementation

1. **Apple HealthKit Integration**
   ```swift
   // Services/HealthKitService.swift
   - Request permissions for workouts, HR, sleep
   - Background sync service
   - Transform HealthKit data to ReddyFit models
   ```

2. **Camera Implementation**
   ```swift
   // Views/CameraView.swift
   - AVFoundation camera capture
   - Real-time preview
   - Photo capture with metadata
   ```

3. **Image Picker**
   ```swift
   // Use PHPickerViewController for photo selection
   ```

4. **Stripe Integration**
   ```swift
   // Services/SubscriptionService.swift
   - Subscription checkout
   - Payment management
   - Tier upgrades/downgrades
   ```

5. **Push Notifications**
   ```swift
   // Recovery alerts
   // Workout reminders
   // Achievement unlocks
   ```

6. **Apple Sign In**
   ```swift
   import AuthenticationServices
   // Implement Sign in with Apple
   ```

---

## 🧪 Testing

### Test Users

Create test users with different tiers:

```swift
// Starter user (manual entry)
email: starter@test.com
tier: .starter
dataSource: .manual

// Pro user (HealthKit)
email: pro@test.com
tier: .pro
dataSource: .healthKit

// Elite user (Whoop)
email: elite@test.com
tier: .elite
dataSource: .whoop
```

### Test Photo Steganography

1. Use example workout data from backend
2. Embed in test photo
3. Scan embedded photo
4. Verify metadata matches

---

## 🐛 Troubleshooting

### Build Errors

**"Cannot find 'Firebase' in scope"**
```
Add Firebase via Swift Package Manager
Product → Package Dependencies → +
```

**"GoogleService-Info.plist not found"**
```
Download from Firebase Console
Drag into Xcode project root
Check "Copy items if needed"
```

### Runtime Errors

**"Firebase not configured"**
```swift
// Ensure FirebaseApp.configure() is called in init()
```

**"Network request failed"**
```
Check API_BASE_URL environment variable
Ensure backend is running
```

**"Whoop OAuth failed"**
```
Verify redirect URI matches Whoop Developer Portal
Check client ID and secret in backend .env
```

---

## 📝 Code Quality

### Architecture

- **MVVM Pattern**: ViewModels handle business logic, Views display UI
- **ObservableObject**: Reactive state management with @Published
- **Async/Await**: Modern concurrency for API calls
- **Combine**: Reactive data streams

### Best Practices

- ✅ Error handling with try/catch
- ✅ Loading states for async operations
- ✅ Type-safe API responses with Codable
- ✅ Secure token storage (Keychain coming soon)
- ✅ Real-time Firestore listeners

---

## 📱 Features Checklist

### ✅ Completed
- [x] User authentication (Firebase)
- [x] Multi-tier subscriptions
- [x] Whoop OAuth integration
- [x] **Apple HealthKit integration** ⭐ NEW!
- [x] Photo steganography (embed/extract)
- [x] AI food tracking (backend ready)
- [x] Dashboard with insights
- [x] Workout logging
- [x] Achievements system
- [x] Profile management
- [x] Activity rings visualization
- [x] Background workout sync

### ⏳ Pending
- [ ] Camera capture implementation
- [ ] Stripe payment processing
- [ ] Push notifications
- [ ] Apple Sign In
- [ ] Google Sign In
- [ ] Offline mode
- [ ] Data export

---

## 🎨 Design System

### Colors

```swift
// Background
Color(red: 0.05, green: 0.05, blue: 0.1) // Dark blue-black

// Accents
.blue // Primary actions
.purple // Secondary actions
.green // Success, recovery green
.yellow // Recovery yellow, achievements
.red // Recovery red, errors
```

### Typography

```swift
.title // 34pt bold
.title2 // 28pt bold
.headline // 17pt semibold
.body // 17pt regular
.caption // 12pt regular
```

### Components

- `PrimaryButtonStyle`: Gradient blue-purple
- `SecondaryButtonStyle`: Outlined white
- `ReddyFitTextFieldStyle`: White background with border

---

## 📄 License

Proprietary - ReddyFit Platform 2025

---

## 👥 Credits

- **Backend**: FastAPI + Firebase + Whoop API
- **Frontend**: SwiftUI + Firebase iOS SDK
- **AI**: OpenAI GPT-4o (insights), Gemini Vision (food tracking)
- **Steganography**: Pillow + piexif (backend), UIKit (iOS)

---

## 🔗 Related Documentation

- [Backend API Documentation](../backend/README.md)
- [Whoop API Reference](https://developer.whoop.com/docs)
- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
