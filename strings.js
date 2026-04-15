/**
 * ReliefMap - Master String Keys & English Values
 * This file defines all UI strings as keys with English values.
 * Translations to Hindi and Marathi are generated in translations.json
 */

window.str = {
  // ── AUTH SCREEN ───────────────────────────────────────
  auth: {
    heading: "Sign in to help or get help",
    subheading: "Connect with people within 2 km during local emergencies. Real-time, GPS-based, community-driven.",
    feature1: "Post needs — food, water, shelter, medical",
    feature2: "See active requests within 2 km of you",
    feature3: "Claim and resolve requests in real time",
    feature4: "Works offline, syncs when back online",
    loginBtn: "Continue with Google",
    tagline: "Hyper-local crisis aid hub"
  },

  // ── FILTER CHIPS ──────────────────────────────────────
  filter: {
    all: "All",
    food: "🍱 Food",
    water: "💧 Water",
    medical: "🚑 Medical",
    shelter: "🏠 Shelter",
    charging: "🔋 Charging",
    other: "📦 Other"
  },

  // ── FEED ──────────────────────────────────────────────
  feed: {
    title: "Active nearby",
    count: "{count} posts",
    sorted: "AI Priority Sorted",
    empty: "Getting your location…",
    areaEmpty: "Your area is clear",
    distance: "{km} km away",
    timePrefix: "",
    timeSuffixM: "m ago",
    timeSuffixH: "h ago",
    timeSuffixD: "d ago",
    justNow: "just now",
    by: "by"
  },

  // ── POST FORM ─────────────────────────────────────────
  post: {
    title: "Post a need",
    typeLabel: "Type of need",
    descLabel: "Description",
    descPlaceholder: "Describe what you need as clearly as possible…",
    qtyLabel: "Quantity / details",
    qtyPlaceholder: "e.g. 4 people, 2 days' supply…",
    urgencyLabel: "Urgency",
    urgencyLow: "Low",
    urgencyMedium: "Medium",
    urgencyHigh: "High",
    info: "📍 Your GPS coordinates will be auto-attached to this post. Only people within 2 km will see it.",
    submitBtn: "Post need to nearby helpers",
    submittingBtn: "Posting...",
    successMsg: "Request posted — helpers nearby will see it"
  },

  // ── MY POSTS ──────────────────────────────────────────
  myPosts: {
    title: "My posts & claims",
    empty: "No posts yet"
  },

  // ── MAP / ROUTING ─────────────────────────────────────
  map: {
    navigationTitle: "Navigation",
    safeRoute: "🛡 Safest Route",
    fastRoute: "⚡ Fastest Route",
    safeDesc: "Avoids high-risk zones",
    fastDesc: "Shortest path",
    onTheWay: "is on the way",
    kmAway: "km away",
    minETA: "min",
    arriving: "arriving",
    helperNavigating: "Helper is navigating to you via safest route"
  },

  // ── PROFILE ───────────────────────────────────────────
  profile: {
    roleLabel: "Your role",
    roleHelper: "🤝 Helper",
    helperDesc: "I can offer aid",
    roleSeeker: "🙋 Seeker",
    seekerDesc: "I need help",
    adminLabel: "Admin panel",
    adminEmpty: "Nearby posts management",
    adminRefresh: "Refresh admin view",
    signOut: "Sign out",
    languageLabel: "Language",
    english: "English",
    hindi: "हिन्दी (Hindi)",
    marathi: "मराठी (Marathi)"
  },

  // ── BUTTONS & ACTIONS ────────────────────────────────
  actions: {
    back: "← Back",
    claim: "Claim request",
    resolve: "Mark resolved",
    flag: "Flag post",
    delete: "Delete",
    translate: "Translate",
    showOriginal: "Show Original",
    sos: "SOS"
  },

  // ── STATUS & BADGES ──────────────────────────────────
  status: {
    pending: "pending",
    assigned: "assigned",
    resolved: "resolved",
    flagged: "flagged"
  },

  // ── TOAST MESSAGES ───────────────────────────────────
  toast: {
    loginFailed: "Login failed: {error}",
    needLocation: "Need location access to post",
    needDesc: "Please add a description",
    roleUpdated: "Role updated to {role}",
    claimed: "Claimed! Calculating safest route…",
    resolved: "Marked resolved — great work!",
    flagged: "Post flagged for review",
    deleted: "Post deleted",
    adminResolved: "Admin resolved",
    adminUnflagged: "Post unflagged",
    error: "Error: {message}",
    signOutFailed: "Sign out failed: {error}",
    geoError: "Could not get location — using default",
    locationGetting: "Getting your location…",
    offline: "You're offline — changes will sync when back online"
  },

  // ── EMERGENCY CONTACTS MODAL ──────────────────────────
  emergency: {
    title: "🚨 EMERGENCY CONTACTS",
    universal: "Universal",
    universal_desc: "🆘 Universal Emergency (Police / Fire / Ambulance)",
    police: "Police",
    police_num: "👮 Police",
    fire: "🚒 Fire Brigade",
    medical: "Medical",
    ambulance: "🚑 Ambulance",
    ambulanceAlt: "🚑 Ambulance (alternate)",
    healthHelpline: "🏥 Health Helpline",
    disaster: "Disaster Management",
    disasterResponse: "🌪 Disaster Response",
    stateDM: "🏛 State Disaster Management",
    floodRelief: "🌊 Flood Relief",
    women: "Women & Children",
    womenHelpline: "👩 Women Helpline",
    womenDistress: "👩 Women in Distress (State)",
    childHelpline: "🧒 Child Helpline"
  },

  // ── TABS & NAV ───────────────────────────────────────
  nav: {
    feed: "📡 Feed",
    map: "🗺 Map",
    post: "✚ Post",
    myPosts: "📋 My Posts",
    profile: "👤 Profile"
  },

  // ── MISC ──────────────────────────────────────────────
  misc: {
    relief: "Relief",
    map: "Map",
    appName: "Relief-Map",
    appDesc: "Real-time hyper-local disaster relief coordination within 2km",
    yourLocation: "Your location",
    locating: "Locating…"
  }
};
