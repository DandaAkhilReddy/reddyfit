# ReddyFit Unified Architecture

## Current State Audit (October 2025)

### Existing Components

#### 1. **Website** (Next.js 14 - `/website`)
- **Status**: Deployed to Azure Static Web Apps
- **Features**:
  - Landing page with features, pricing, download sections
  - Smart waitlist with referral system and tier-based positioning
  - Admin dashboard for waitlist management
  - Firebase integration for waitlist data
- **Tech Stack**: Next.js 14, React 18, TypeScript, Tailwind CSS, Firebase SDK
- **API Routes**: `/api/waitlist` only
- **Missing**: Authentication, User dashboard, AI coach integration, Terra API

#### 2. **Agent-SDK** (`/Agent-SDK`)
- **Status**: Complete and functional
- **Features**:
  - 5 AI agent types (Trainer, Nutrition, Progress, Motivation, WHOOP Coach)
  - 17+ specialized fitness tools
  - Terra API integration for 150+ wearables including WHOOP
  - Firebase integration for WHOOP data storage, trends, insights
  - OpenAI and Ollama support
- **Tech Stack**: TypeScript, OpenAI SDK, Firebase Admin SDK, Terra API client
- **Scripts**: Terra connect, WHOOP sync, Firebase setup, data backfill
- **Missing**: Web API wrapper, REST endpoints for external access

#### 3. **iOS App** (`/ios/ReddyFitElite`)
- **Status**: Built, needs deployment
- **Features**:
  - HealthKit integration for steps, workouts, heart rate
  - WHOOP service integration
  - Photo progress tracking with Azure Blob Storage
  - Achievements and gamification
  - Profile and onboarding flows
- **Tech Stack**: SwiftUI, HealthKit, Firebase (basic)
- **Services**: APIService, HealthKitService, WhoopService, PhotoService
- **Missing**: Backend API endpoints, real-time sync, authentication

#### 4. **Backend** (`/reddygo-platform/backend`)
- **Status**: Exists but separate from main ReddyFit project
- **Features**:
  - FastAPI/Python backend
  - WHOOP integration router
  - Photo management
- **Tech Stack**: Python, FastAPI
- **Note**: This seems to be a separate project (ReddyGo), may need consolidation

### Data Flow Issues

**Current**: Each component operates in isolation
- Website → Firebase (waitlist only)
- Agent-SDK → Terra API + Firebase (WHOOP data)
- iOS App → HealthKit + APIService (undefined endpoints)
- No shared authentication
- No unified data model
- No real-time sync between platforms

## Unified Architecture Design

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Users                                │
└─────────┬────────────────────┬────────────────┬─────────────┘
          │                    │                 │
    ┌─────▼──────┐      ┌──────▼────────┐  ┌───▼──────────┐
    │  Web App   │      │   iOS App     │  │  Admin Panel │
    │  (Next.js) │      │  (SwiftUI)    │  │  (Next.js)   │
    └─────┬──────┘      └───────┬───────┘  └───┬──────────┘
          │                     │               │
          └──────────┬──────────┴───────────────┘
                     │
            ┌────────▼─────────┐
            │   API Gateway    │
            │ (Next.js Routes) │
            └────────┬─────────┘
                     │
         ┌───────────┼────────────┐
         │           │            │
    ┌────▼────┐ ┌───▼────┐  ┌───▼──────┐
    │Firebase │ │Agent   │  │  Terra   │
    │Auth +   │ │SDK     │  │  API     │
    │Firestore│ │(AI)    │  │(Wearable)│
    └─────────┘ └────────┘  └──────────┘
```

### Component Responsibilities

#### 1. **Firebase** (Central Data Store)
**Collections:**
- `users` - User profiles, preferences, goals
- `waitlist` - Waitlist entries (existing)
- `whoop_data/{userId}/daily` - Daily WHOOP metrics
- `whoop_data/{userId}/trends` - Computed trends
- `whoop_data/{userId}/insights` - AI insights
- `workouts/{userId}` - Logged workouts
- `meals/{userId}` - Nutrition logs
- `progress/{userId}` - Progress photos, measurements
- `achievements/{userId}` - Gamification data

**Authentication:**
- Firebase Auth with Google, Email/Password
- Custom claims for roles (user, admin, premium)
- Shared across web and iOS

#### 2. **API Layer** (Next.js API Routes)

**New API Routes to Create:**

```
/api/auth
  - POST /login
  - POST /register
  - POST /logout
  - GET /session

/api/user
  - GET /profile
  - PATCH /profile
  - POST /onboarding
  - GET /stats

/api/ai
  - POST /chat              // Chat with any agent
  - POST /workout-plan      // Generate workout
  - POST /meal-plan         // Generate meal plan
  - POST /analyze-recovery  // WHOOP analysis
  - GET /insights           // Get AI insights

/api/wearables
  - POST /connect-terra     // Connect wearable
  - GET /terra-status       // Connection status
  - POST /sync-whoop        // Manual sync
  - GET /recovery-data      // Latest recovery

/api/workouts
  - GET /                   // List workouts
  - POST /                  // Log workout
  - GET /:id                // Get workout
  - DELETE /:id             // Delete workout

/api/nutrition
  - GET /meals              // List meals
  - POST /meals             // Log meal
  - GET /daily-summary      // Day summary

/api/progress
  - GET /                   // Progress timeline
  - POST /photo             // Upload photo
  - GET /trends             // Analytics

/api/admin (existing)
  - GET /waitlist           // Existing
```

#### 3. **Agent-SDK Integration**

**Create Web Wrapper:**
```typescript
// website/lib/agent-client.ts
import { createAgent } from '@reddyfit/agent-sdk';

export class AgentClient {
  // Wrapper for web use
  async chat(agentType, message, context) { }
  async generateWorkout(whoopData) { }
  async analyzeMeal(photo) { }
  // etc.
}
```

**Deployment Options:**
1. **Option A**: Bundle Agent-SDK into Next.js API routes (serverless)
2. **Option B**: Separate microservice on Azure Container Apps
3. **Option C**: Edge functions for low latency

**Recommended**: Option A for MVP, Option B for scale

#### 4. **iOS App Integration**

**Update APIService.swift:**
```swift
// Current: Hardcoded URLs
let baseURL = "TBD"

// New: Environment-based configuration
let baseURL = Environment.apiBaseURL // https://reddyfit.vercel.app/api
```

**New API Methods:**
```swift
- authenticateUser()
- syncHealthKitData()
- fetchWhoopInsights()
- uploadProgressPhoto()
- getAIWorkoutPlan()
```

#### 5. **Authentication Flow**

**Unified Auth:**
```
1. User signs up/logs in on Web OR iOS
2. Firebase Auth creates account
3. Backend creates Firestore user document
4. Generate custom token with claims
5. Client stores token securely (httpOnly cookie for web, Keychain for iOS)
6. All API requests include token
7. Server validates via Firebase Admin SDK
```

**Auth Middleware:**
```typescript
// website/lib/auth-middleware.ts
export async function requireAuth(request) {
  const token = await getTokenFromRequest(request);
  const user = await admin.auth().verifyIdToken(token);
  return user;
}
```

## Implementation Plan

### Phase 1: Foundation (Week 1)
1. ✅ Set up Firebase project with all collections
2. ✅ Implement Firebase Auth on website
3. ✅ Create auth middleware for API routes
4. ✅ Build user profile system
5. ✅ Set up environment variables across all projects

### Phase 2: API Gateway (Week 2)
1. ✅ Create all API route handlers
2. ✅ Integrate Agent-SDK into Next.js
3. ✅ Add Terra API endpoints
4. ✅ Implement request validation and error handling
5. ✅ Add rate limiting and security

### Phase 3: Web Integration (Week 3)
1. ✅ Build user dashboard with AI insights
2. ✅ Add WHOOP connection flow
3. ✅ Create workout and meal logging UI
4. ✅ Build progress tracking page
5. ✅ Add real-time updates

### Phase 4: iOS Integration (Week 4)
1. ✅ Update APIService to use new endpoints
2. ✅ Implement Firebase Auth in iOS
3. ✅ Add data sync between HealthKit and backend
4. ✅ Build WHOOP integration UI
5. ✅ Test end-to-end flow

### Phase 5: Testing & Deployment (Week 5)
1. ✅ End-to-end testing across platforms
2. ✅ Performance optimization
3. ✅ Security audit
4. ✅ Deploy to production
5. ✅ Monitor and iterate

## Technology Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend (Web)** | Next.js 14, React 18, TypeScript | Website & dashboard |
| **Frontend (Mobile)** | SwiftUI, iOS 17+ | Native iOS app |
| **API Gateway** | Next.js API Routes | Unified backend |
| **AI Engine** | Agent-SDK (TypeScript) | AI fitness agents |
| **Authentication** | Firebase Auth | User management |
| **Database** | Cloud Firestore | NoSQL data store |
| **File Storage** | Azure Blob Storage | Progress photos |
| **Wearables** | Terra API | 150+ device integration |
| **AI Models** | OpenAI GPT-4 | Natural language |
| **Deployment** | Vercel/Azure Static Web Apps | Hosting |

## Data Models

### User
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin' | 'premium';
  profile: {
    age: number;
    gender: string;
    height: number;
    weight: number;
    goals: string[];
    activityLevel: string;
  };
  wearables: {
    terra: {
      connected: boolean;
      userId?: string;
      provider?: string; // 'whoop', 'fitbit', etc.
      lastSync?: Date;
    };
  };
  subscription: {
    status: 'free' | 'premium';
    plan?: string;
    expiresAt?: Date;
  };
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### WhoopData (from Agent-SDK)
```typescript
interface WhoopDailyData {
  userId: string;
  date: string;
  recovery: number;
  hrv: number;
  restingHR: number;
  sleep: {
    duration: number;
    quality: number;
    deep: number;
    rem: number;
    awake: number;
  };
  strain: number;
  calories: number;
  // ... (existing structure from Agent-SDK)
}
```

### Workout
```typescript
interface Workout {
  id: string;
  userId: string;
  date: Date;
  type: string;
  duration: number;
  calories?: number;
  exercises: Exercise[];
  notes?: string;
  aiGenerated: boolean;
  source: 'manual' | 'ai' | 'healthkit';
}
```

## Security Considerations

1. **Authentication**: Firebase Auth tokens, httpOnly cookies
2. **Authorization**: Custom claims, row-level security in Firestore
3. **API Keys**: Environment variables, never in client code
4. **Rate Limiting**: 100 req/min per user, 1000/hour
5. **Data Privacy**: HIPAA-ready infrastructure, encryption at rest
6. **Wearable Auth**: OAuth2 via Terra, tokens encrypted
7. **Input Validation**: Zod schemas on all API routes
8. **CORS**: Restricted to known origins only

## Environment Configuration

### Website (.env)
```bash
# Firebase (existing)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
# ... (existing Firebase config)

# Firebase Admin (new)
FIREBASE_SERVICE_ACCOUNT_KEY=

# Terra API (new)
TERRA_API_KEY=
TERRA_DEV_ID=
TERRA_WEBHOOK_SECRET=

# OpenAI (new)
OPENAI_API_KEY=

# Agent-SDK (new)
AGENT_SDK_ENV=production

# Azure (existing)
AZURE_STORAGE_CONNECTION_STRING=

# Email (existing)
RESEND_API_KEY=
```

### iOS App (Configuration.swift)
```swift
enum Environment {
    static let apiBaseURL = "https://reddyfit.vercel.app/api"
    static let firebaseConfig = FirebaseOptions(...)
    static let azureStorageURL = "..."
}
```

## Next Steps

1. **Immediate**: Complete this integration plan
2. **Today**: Set up Firebase collections and auth
3. **This Week**: Build core API routes
4. **Next Week**: Integrate Agent-SDK
5. **Following Week**: Update iOS app
6. **End of Month**: Launch unified platform

## Success Metrics

- ✅ Single sign-on works across web and iOS
- ✅ WHOOP data syncs automatically
- ✅ AI insights appear in both platforms
- ✅ User can log workout on iOS, see on web
- ✅ Real-time updates across devices
- ✅ End-to-end latency < 500ms
- ✅ 99.9% uptime SLA

## Questions to Resolve

1. Should we consolidate reddygo-platform backend or keep separate?
2. What's the subscription/payment model? (Stripe integration needed?)
3. Do we need webhooks from Terra for real-time updates?
4. What's the iOS App Store release timeline?
5. Do we want web push notifications?

---

**Created**: October 10, 2025
**Status**: Planning → Implementation
**Owner**: Akhil Reddy
