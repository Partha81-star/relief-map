# Relief-Map: Hyper-Local Aid Hub

A full-featured, production-ready Progressive Web App for real-time hyper-local disaster relief coordination.

## Features

- **Real-time GPS feed** — see requests within 2 km, live via Firestore onSnapshot
- **Geohash-based proximity queries** — efficient 2 km radius filtering without scanning all docs
- **Google Auth** — secure login, no anonymous posts
- **Claim & resolve flow** — helpers claim pending requests, mark resolved when done
- **Urgency ranking** — time-decay + urgency score sorts the feed automatically
- **Flag/spam control** — users can flag suspicious posts; 3+ flags = marked flagged
- **Interactive Leaflet map** — dark-themed map with color-coded urgency pins + 2 km radius ring
- **Admin panel** — force-resolve or unflag any nearby post
- **Role switching** — Helper or Seeker modes with different action sets
- **PWA + Offline** — service worker caches the shell; Firebase offline persistence queues writes
- **Firestore security rules** — server-enforced access control
- **Composite indexes** — pre-configured for geo + status queries

---

## Setup (15 minutes)

### 1. Create Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `relief-map` → Continue
3. Disable Google Analytics (optional) → **Create project**

### 2. Enable Firebase services

**Authentication:**
- Go to **Build → Authentication → Get started**
- Click **Google** provider → Enable → Save

**Firestore:**
- Go to **Build → Firestore Database → Create database**
- Choose **Start in production mode** → pick a region (e.g. `asia-south1` for India) → Enable

### 3. Get your Firebase config

1. Go to **Project Settings** (gear icon) → **General** tab
2. Scroll to **Your apps** → click **</> Web** → register app
3. Copy the `firebaseConfig` object

### 4. Paste config into index.html

Open `public/index.html` and find this block (~line 35):

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Replace with your actual config values.

### 5. Deploy Firestore rules & indexes

Install Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init  # select Hosting + Firestore, use existing project
```

Deploy rules and indexes:
```bash
firebase deploy --only firestore
```

### 6. Deploy the app

```bash
firebase deploy --only hosting
```

Your app will be live at `https://YOUR_PROJECT.web.app`

---

## Local development

```bash
npm install -g firebase-tools
firebase serve --only hosting
# Open http://localhost:5000
```

---

## Firestore data model

### `users/{userId}`
```
displayName: string
email: string
photoURL: string
role: "helper" | "seeker"
createdAt: timestamp
isVerified: boolean
```

### `requests/{requestId}`
```
type: "food"|"water"|"shelter"|"medical"|"charging"|"other"
desc: string
qty: string
urgency: "low"|"medium"|"high"
lat: number
lng: number
geohash: string          ← 7-char geohash for proximity queries
status: "pending"|"assigned"|"resolved"
createdBy: userId
createdByName: string
createdByPhoto: string
claimedBy: userId | null
claimedByName: string | null
flagged: boolean
flagCount: number
createdAt: timestamp
updatedAt: timestamp
resolvedAt: timestamp | null
```

---

## How the geo query works

1. User's GPS → `lat, lng`
2. Compute geohash bounding box for 2 km radius → `minHash`, `maxHash`
3. Firestore query:
   ```js
   where('geohash', '>=', minHash)
   where('geohash', '<=', maxHash)
   where('status', 'in', ['pending', 'assigned'])
   ```
4. Client-side filter: `haversine(userLat, userLng, postLat, postLng) <= 2.0`
5. Sort by urgency score: `urgency × 100 + age_bonus + status_bonus`

---

## Security rules summary

| Action | Who can do it |
|--------|---------------|
| Read requests | Any signed-in user |
| Create request | Signed-in user, only for themselves |
| Claim request | Any helper, on pending requests not theirs |
| Resolve request | Helper who claimed it |
| Delete request | Owner only |
| Flag request | Any signed-in user |
| Force-resolve / unflag | Admin (via client, upgrade to Admin SDK for prod) |

---

## PWA Install

On mobile Chrome: tap the **3-dot menu → Add to Home Screen**
On iOS Safari: tap **Share → Add to Home Screen**

The service worker caches the app shell. Firebase offline persistence queues writes when offline and syncs automatically when back online.

---

## Production checklist

- [ ] Replace `firebaseConfig` with real values
- [ ] Set Firestore to **Production mode** rules (already in `firestore.rules`)
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`
- [ ] Enable **App Check** in Firebase console for abuse protection
- [ ] Add a real `icon-192.png` and `icon-512.png` for PWA
- [ ] Set up Firebase **Usage alerts** to avoid billing surprises
- [ ] For admin features in prod: implement Firebase Admin SDK in Cloud Functions instead of client-side

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS (no build step needed) |
| Auth | Firebase Authentication (Google) |
| Database | Cloud Firestore (real-time) |
| Maps | Leaflet.js + CartoDB dark tiles |
| Proximity | Custom geohash (no external library needed) |
| Hosting | Firebase Hosting |
| Offline | Service Worker + Firestore offline persistence |
| Fonts | Syne + DM Sans + DM Mono (Google Fonts) |
