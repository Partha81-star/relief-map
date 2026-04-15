# 🗺️ ReliefMap - Modern Next.js Dashboard

A modern, high-contrast relief network dashboard built with **Next.js 14**, **Tailwind CSS**, **shadcn/ui**, and **React-Leaflet** featuring a glassmorphism aesthetic.

## 🎨 Features

- ✨ **Glassmorphism Design** - Modern frosted glass UI with backdrop blur effects
- 🗺️ **Interactive Map** - React-Leaflet integration with custom markers and animations
- 📍 **Real-time Geolocation** - Live location tracking with 2km radius visualization
- 🎯 **Pulsing Animations** - Smooth animations for user location and interactions
- 🌙 **Dark Mode** - Premium dark theme with Slate-950 & Cyan-500 palette
- 📱 **Fully Responsive** - Mobile-first design with adaptive layouts
- 🔥 **Firebase Integration** - Real-time data sync with Firestore
- 👤 **User Profiles** - Floating header with profile dropdown
- 📋 **Sidebar Navigation** - Filterable helpers/seekers list
- ⚡ **Server Components** - Optimized with Next.js 14 App Router

## 📁 Folder Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main entry point
│   └── globals.css         # Global styles & Tailwind directives
├── components/
│   ├── Dashboard.tsx       # Main dashboard container
│   ├── Header.tsx          # Floating navbar with profile dropdown
│   ├── Sidebar.tsx         # Helper/seeker list sidebar
│   ├── MapComponent.tsx    # React-Leaflet map with overlays
│   └── ui/                 # shadcn/ui components
│       ├── button.tsx      # Custom button component
│       ├── badge.tsx       # Status badge component
│       ├── avatar.tsx      # User avatar component
│       └── dropdown-menu.tsx # Profile dropdown menu
├── lib/
│   ├── firebase.ts         # Firebase configuration
│   └── utils.ts            # Utility functions (cn, etc.)
└── hooks/
    └── (custom hooks here)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (with npm or yarn)
- Firebase account & project

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Setup**
Create `.env.local` with your Firebase credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

3. **Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## 🎯 Key Components

### Dashboard.tsx
The main container component that orchestrates:
- Firebase authentication
- Real-time geolocation tracking
- Firestore data subscriptions
- Sidebar and map synchronization

### MapComponent.tsx
Features:
- Custom user location marker with pulse animation
- 2km radius circle visualization
- Request markers with color-coded urgency levels
- Interactive popups
- Dark-themed Leaflet controls

### Header.tsx
Floating navigation bar with:
- Animated glassmorphism effect
- Location badge (hidden on mobile)
- User avatar & profile dropdown
- SOS emergency button

### Sidebar.tsx
Features:
- Filterable tabs (All, Helpers, Seekers)
- Responsive mobile drawer
- Distance calculations
- Status indicators
- Action buttons

## 🎨 Design System

### Colors
```
Primary: Slate-950 (#03070e)
Accent: Cyan-500 (#06b6d4)
Secondary: Cyan-400 (#22d3ee)
```

### Glassmorphism Effects
- `bg-glass`: Primary glass background
- `bg-glass-light`: Lighter variant for elevated elements
- `backdrop-blur-md`: 20px blur effect
- `border-glass`: Semi-transparent cyan border

### Animations
- `animate-pulse-glow`: Pulsing location marker
- `animate-float`: Floating elements
- `animate-glassmorphism`: Entrance effect

## 🔄 State Management

Uses React hooks with Firebase real-time listeners:
- `useEffect` - Location tracking & Firestore subscriptions
- `useState` - UI state (sidebar, selected item, etc.)
- Firebase Auth - User authentication
- Firestore - Real-time data sync

## 📡 Firebase Integration

### Collections Used
- `requests` - Relief requests with geolocation
- `users` - User profiles and roles

### Real-time Features
- Live request updates within 2km radius
- Automatic distance calculations
- Status tracking (pending, assigned, resolved)

## 🌐 Responsive Design

- **Mobile (< 768px)**: Full-screen map, drawer sidebar
- **Tablet (768px - 1024px)**: Sidebar visible, optimized layout
- **Desktop (> 1024px)**: Full-featured layout with all panels

## ⚙️ Configuration Files

### `next.config.js`
- React strict mode enabled
- minification with SWC
- Console removal in production

### `tailwind.config.ts`
- Dark mode enabled
- Custom animations and keyframes
- Glassmorphism utilities
- Extended color palette

### `tsconfig.json`
- Path alias: `@/*` → `./src/*`
- Strict type checking
- ES2020 target

## 🚀 Building for Production

1. **Build**
```bash
npm run build
```

2. **Start**
```bash
npm start
```

3. **Deploy to Firebase Hosting**
```bash
firebase deploy --only hosting
```

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🎯 Future Enhancements

- [ ] Push notifications
- [ ] Route optimization (OSRM integration)
- [ ] User roles & permissions
- [ ] Request history & analytics
- [ ] Media uploads (photos/videos)
- [ ] Peer-to-peer messaging
- [ ] Dark/Light theme toggle
- [ ] Internationalization (i18n)

## 📄 License

MIT

## 💡 Tips

- **CSS**: All styling uses Tailwind classes + custom animations
- **UI**: Use provided components from `@/components/ui`
- **Firebase**: Import from `@/lib/firebase`
- **Utils**: Use `cn()` helper for className merging

---

**Built with ❤️ for disaster relief**
