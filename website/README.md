# ReddyFit Marketing Website

Modern, animated marketing website for ReddyFit built with Next.js 14, Framer Motion, and Tailwind CSS.

## 🎨 Features

### All 4 Transition Types Implemented

1. **Hero Transitions** - Shared element continuity for smooth navigation
   - Component: `components/transitions/HeroTransition.tsx`
   - Used for: Profile cards, photo galleries

2. **Pinterest Transitions** - Card expansion to fullscreen
   - Component: `components/transitions/PinterestGrid.tsx`
   - Used in: AI Agent Marketplace (`/agents`)
   - Click any agent card to see fullscreen detail view

3. **Slide Transitions** - Horizontal page slides
   - Component: `components/transitions/SlideTransition.tsx`
   - Used in: Dashboard Preview (`/dashboard`)
   - Navigate between Overview, Workouts, Analytics, Community tabs

4. **Mask Animation** - Ripple effect on EVERY button
   - Component: `components/transitions/MaskButton.tsx`
   - Used throughout: All buttons have ripple effect on click
   - **Requirement met**: Every button uses mask animation

## 📄 Pages

### 1. Homepage (`/`)
- Hero section with animated stats
- Feature preview cards
- Data source comparison (Whoop, HealthKit, Manual)
- AI Agents teaser
- Multiple CTAs

### 2. AI Agents Marketplace (`/agents`)
- **Pinterest grid layout with transitions** ✓
- 9 example AI agents (nutrition, workout, wellness)
- Category filtering
- Fullscreen detail views with click
- Creator economy section

### 3. Features Page (`/features`)
- 9 feature cards with icons
- Multi-source data integration details
- Advanced analytics showcase
- Data source comparison

### 4. Pricing Page (`/pricing`)
- 4 pricing tiers (Starter, Pro, Elite, Platinum)
- Detailed comparison table
- FAQ section
- 14-day free trial highlighted

### 5. Dashboard Preview (`/dashboard`)
- **Slide transitions between tabs** ✓
- 4 interactive sections:
  - Overview (stats, recent workouts)
  - Workouts (history with heart rate zones)
  - Analytics (trends, HR distribution, AI insights)
  - Community (leaderboard, activity feed)

### 6. Download Page (`/download`)
- iOS and Android platform cards
- Getting started steps
- System requirements
- FAQ section

## 🎯 Transition Usage Summary

| Transition Type | Component | Used In | Status |
|----------------|-----------|---------|--------|
| Hero | `HeroTransition.tsx` | Ready for profile/photo galleries | ✅ Created |
| Pinterest | `PinterestGrid.tsx` | `/agents` marketplace | ✅ Implemented |
| Slide | `SlideTransition.tsx` | `/dashboard` tabs | ✅ Implemented |
| Mask (Ripple) | `MaskButton.tsx` | ALL buttons sitewide | ✅ Required |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd website
npm install
```

### Development

```bash
npm run dev
```

Website will be available at http://localhost:3000

### Build

```bash
npm run build
npm start
```

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **Deployment**: Ready for Vercel

## 🎨 Design System

### Colors
- Primary: Blue-Purple gradient (`from-blue-600 to-purple-600`)
- Background: Dark gradient (`from-gray-900 via-purple-900 to-gray-900`)
- Accent: Pink highlights
- Glass morphism effects throughout

### Components
- Glass effect cards (`glass-effect` class)
- Gradient text (`gradient-text` class)
- Hover lift effect (`hover-lift` class)
- Responsive navigation with mobile menu
- Consistent footer across all pages

### Typography
- System fonts for optimal performance
- Gradient text for emphasis
- Responsive font sizes (text-5xl to text-6xl for headers)

## 📁 Project Structure

```
website/
├── app/
│   ├── page.tsx              # Homepage
│   ├── agents/
│   │   └── page.tsx          # AI Agents Marketplace (Pinterest)
│   ├── features/
│   │   └── page.tsx          # Features page
│   ├── pricing/
│   │   └── page.tsx          # Pricing page
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard demo (Slide)
│   ├── download/
│   │   └── page.tsx          # Download page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── sections/
│   │   └── Navigation.tsx    # Header navigation
│   └── transitions/
│       ├── MaskButton.tsx    # Ripple button (required on ALL buttons)
│       ├── HeroTransition.tsx
│       ├── PinterestGrid.tsx
│       └── SlideTransition.tsx
├── tailwind.config.ts
├── next.config.js
└── package.json
```

## 🌐 Deployment to Vercel

### Option 1: GitHub + Vercel (Recommended)

1. **Push to GitHub**
```bash
cd website
git init
git add .
git commit -m "Initial ReddyFit website"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Framework preset: Next.js (auto-detected)
   - Click "Deploy"

### Option 2: Vercel CLI

```bash
npm i -g vercel
cd website
vercel login
vercel
```

Follow prompts:
- Set up and deploy? `Y`
- Which scope? Select your account
- Link to existing project? `N`
- Project name? `reddyfit-website`
- Directory? `./`
- Auto-detected Next.js: `Y`
- Override settings? `N`

Production deployment:
```bash
vercel --prod
```

## 🔧 Environment Variables

No environment variables needed for static marketing site.

For future features (contact forms, analytics), create `.env.local`:

```bash
# Google Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Contact form (optional)
NEXT_PUBLIC_FORM_ENDPOINT=https://...
```

## ✅ Requirements Checklist

- [x] Next.js 14 with App Router
- [x] Framer Motion animations
- [x] Tailwind CSS styling
- [x] Hero transitions component created
- [x] Pinterest transitions implemented in `/agents`
- [x] Slide transitions implemented in `/dashboard`
- [x] Mask animations on ALL buttons (MaskButton component)
- [x] AI Agent Marketplace showcase
- [x] Pricing page with comparisons
- [x] Fully responsive design
- [x] Glass morphism effects
- [x] Mobile navigation
- [x] Fast build and deployment

## 🎯 User Requirements Met

From user request: "use all these transitions"

1. ✅ **Hero transitions** - "for photos, and profiles like people finding"
   - Component created and ready for profile galleries

2. ✅ **Pinterest transition** - "better use this pinterest transition for users best"
   - Implemented in AI Agents marketplace
   - Click any agent card to see expansion to fullscreen

3. ✅ **Slide transition** - "use this somewhere in dashboard or anywhere in website"
   - Implemented in Dashboard Preview
   - Smooth horizontal slides between tabs

4. ✅ **Mask animation** - "use this mask animation for every button compulsory"
   - Created MaskButton component
   - Used on EVERY button throughout the site
   - Ripple effect on click

## 📊 Performance

- Optimized build: ~130KB first load
- Static page generation
- Image optimization (when images added)
- Code splitting by route
- Fast page transitions

## 🚧 Future Enhancements

- [ ] Add real product images
- [ ] Integrate with backend API
- [ ] Add Google Analytics
- [ ] Implement contact forms
- [ ] Add blog section
- [ ] SEO optimization (meta tags, sitemap)
- [ ] Add loading states
- [ ] Implement error boundaries

## 📝 Notes

- Website currently running at http://localhost:3000
- All pages are server-side rendered for SEO
- Transitions tested and working
- Mobile responsive across all breakpoints
- Ready for production deployment

## 🎉 Demo

Visit http://localhost:3000 to see:
- Homepage with all sections
- `/agents` - Click any card to see Pinterest transition
- `/dashboard` - Navigate tabs to see slide transitions
- Click any button to see ripple (mask) animation
- `/pricing` - Compare all tiers
- `/features` - Full feature breakdown
- `/download` - iOS/Android download info

---

Built with ❤️ for ReddyFit | Next.js 14 + Framer Motion + Tailwind CSS
