// Firebase V10 / V9 Compat Initialization for AutoTriage
(function() {
  'use strict';

  const firebaseConfig = {
    apiKey: "AIzaSyCbEL3DWwACb7RqigjeaizKRFaMVdEdEK0",
    authDomain: "autotriageapp.firebaseapp.com",
    projectId: "autotriageapp",
    storageBucket: "autotriageapp.firebasestorage.app",
    messagingSenderId: "766078254409",
    appId: "1:766078254409:web:93cd3c072aea95b14d2e98",
    measurementId: "G-T6HDDM4JGN"
  };

  function initFirebase() {
    const fb = window.firebase;
    if (!fb) {
      console.warn('[Firebase] SDK scripts not loaded yet.');
      return;
    }

    try {
      let app;
      if (!fb.apps || !fb.apps.length) {
        app = fb.initializeApp(firebaseConfig);
      } else {
        app = fb.app();
      }

      window.FirebaseAuth = fb.auth();
      window.FirebaseDB = fb.firestore();
      window.firebase = fb;

      console.log('🔥 [Firebase Engine] Initialized successfully with authDomain:', firebaseConfig.authDomain);
    } catch (err) {
      console.error('[Firebase Engine] Initialization error:', err);
    }
  }

  // Run initialization immediately if SDK is ready, or on window load
  if (window.firebase) {
    initFirebase();
  } else {
    window.addEventListener('DOMContentLoaded', initFirebase);
    window.addEventListener('load', initFirebase);
  }
})();