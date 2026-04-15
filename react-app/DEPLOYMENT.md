# 🚀 Deployment Guide - ReliefMap

## Prerequisites
- GitHub account (already done ✅)
- Vercel account (free)
- Firebase project (already set up ✅)

---

## 📋 Firebase Configuration on Vercel

### Step 1: Configure Google OAuth Consent Screen

**In Firebase Console:**
1. Go to: https://console.firebase.google.com/project/relief-map-dafa2/authentication
2. Click **"Authentication"** → **"Settings"** (gear icon)
3. Ensure **Google Provider** is enabled
4. Go to **"Authorized domains"**
5. Add your Vercel domain: `*.vercel.app`
6. Also add: `relief-map-*.vercel.app`

### Step 2: Firebase Security Rules

**Allow public auth, but restrict Firestore:**

Go to **Firestore Database** → **Rules** tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read/write requests (for now)
    match /requests/{document=**} {
      allow read, write;
    }
    
    // Allow each user to write their own profile
    match /users/{userId} {
      allow read;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

Click **"Publish"** ✅

---

## 🔗 Vercel Deployment Steps

### Step 1: Connect GitHub Repository
1. Sign in to https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Click **"Import Git Repository"**
4. Search and select: `Partha81-star/relief-map`

### Step 2: Configure Project
- **Framework Preset:** Next.js
- **Root Directory:** `react-app`
- **Build Command:** `next build`
- **Output Directory:** `.next`

### Step 3: Add Environment Variables

Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCXl4_cO_F8xXMuHzAghWGG1k_xJfYSvYY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=relief-map-dafa2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=relief-map-dafa2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=relief-map-dafa2.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1088851741935
NEXT_PUBLIC_FIREBASE_APP_ID=1:1088851741935:web:4c4070f1a17d4dc43d9f1a
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-HCF00YJENZ
```

**All must start with `NEXT_PUBLIC_` for client-side access!**

### Step 4: Deploy
Click **"Deploy"** and wait 3-5 minutes ⏳

---

## ✅ After Deployment

1. **Test Sign In:**
   - Visit your Vercel URL
   - Click "Continue with Google"
   - Verify it works

2. **If you get an error:**
   - Check Firebase console logs
   - Verify domain is whitelisted in Firebase
   - Clear browser cache and try again
   - Check Vercel build logs for errors

3. **Update Firebase Domain Whitelist:**
   - Copy your Vercel deployment URL
   - Add to Firebase authorized domains
   - Wait 10 minutes for propagation

---

## 🛠️ Troubleshooting

### "auth/unauthorized-domain" error
**Solution:** Add `.vercel.app` to Firebase authorized domains

### "Firebase initialization error"
**Solution:** Verify all `NEXT_PUBLIC_` env vars are set in Vercel

### Sign-in popup doesn't appear
**Solution:** 
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors
- Verify OAuth redirect URLs in Firebase

### Firestore not syncing
**Solution:**
- Check Firestore security rules (published?)
- Verify user is authenticated
- Check browser console for permission errors

---

## 📱 Live URLs

**Firebase Hosting (old):**
🔗 https://relief-map-dafa2.web.app

**Vercel Deployment (new):**
🔗 https://relief-map-[your-random-id].vercel.app

**GitHub Repository:**
🔗 https://github.com/Partha81-star/relief-map

---

## 🔄 CI/CD Pipeline

Every time you push to GitHub:
1. Vercel automatically triggers build
2. Tests run
3. New version deployed (if successful)

To update:
```bash
git add .
git commit -m "Update: description here"
git push origin main
```

---

## 📊 What's Deployed

✅ Next.js 14 app  
✅ Tailwind CSS + Dark Mode  
✅ Glassmorphism UI  
✅ React-Leaflet Maps  
✅ Firebase Auth & Firestore  
✅ Fully Responsive  
✅ Mobile Optimized  

---

**Need help?** Contact support or check logs on Vercel dashboard!
