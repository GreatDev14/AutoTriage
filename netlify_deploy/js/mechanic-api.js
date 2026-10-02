/**
 * mechanic-api.js — Firebase Firestore Client
 * Rewritten to use Firebase Cloud Database instead of local Node.js endpoints.
 */
(function(global) {
  'use strict';

  // Helper to ensure Firebase is ready
  function getDb() {
    if (!window.FirebaseDB) throw new Error("Firebase DB not initialized. Ensure firebase-config.js is loaded.");
    return window.FirebaseDB;
  }

  // Get current user ID (strict Firebase UID)
  function getUid() {
    return (window.FirebaseAuth && window.FirebaseAuth.currentUser) 
           ? window.FirebaseAuth.currentUser.uid 
           : null;
  }

  const MechAPI = {
    // ------------------------------------
    // Real-time Chat 
    // ------------------------------------
    subscribeToChat(driverId, callback) {
      const db = getDb();
      const uid = getUid();
      if (!uid) return () => {};
      const chatId = [uid, driverId].sort().join('_');
      
      return db.collection("chats").doc(chatId).collection("messages")
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
          const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          callback(msgs);
        });
    },

    async sendChatMessage(driverId, text, senderRole = 'mechanic') {
      const db = getDb();
      const uid = getUid();
      if (!uid) throw new Error("Authentication required to send chat message.");
      const chatId = [uid, driverId].sort().join('_');
      
      return db.collection("chats").doc(chatId).collection("messages").add({
        text,
        senderRole,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    },

    // ------------------------------------
    // Profile / Mechanic Registration
    // ------------------------------------
    async register(data) {
      const db = getDb();
      const uid = getUid();
      
      if (!uid) {
        throw new Error("Authentication required: Please log in or create an account before registering your workshop.");
      }

      const profileData = {
        ...data,
        avail: data.avail || 'open',
        rating: data.rating || '5.0',
        rev: data.rev || 0,
        emoji: data.emoji || '👨🏾‍🔧',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // 1. Save profile to mechanics/{uid} (single source of truth)
      await db.collection('mechanics').doc(uid).set(profileData, { merge: true });

      // 2. Ensure users/{uid} has role: 'mechanic'
      try {
        const user = window.FirebaseAuth.currentUser;
        await db.collection('users').doc(uid).set({
          role: 'mechanic',
          isMechanic: true,
          email: user?.email || data.email || null,
          name: data.owner || data.name || user?.displayName || 'Mechanic',
          phone: data.phone || data.wa || null,
          workshopName: data.workshop || data.name || null,
          specialization: data.specialization || data.spec || null,
          city: data.city || null,
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (userDocErr) {
        console.warn("[AutoTriage MechAPI] Note on updating users collection:", userDocErr.message);
      }

      return { success: true, profile: profileData, token: "firebase" };
    },

    // ------------------------------------
    // Load All Dashboard Data
    // ------------------------------------
    async loadAll() {
      const db = getDb();
      const uid = getUid();

      if (!uid) {
        return { profile: null, appointments: [], leads: [], portfolio: [] };
      }

      const [profileDoc, apptSnap, leadsSnap, portSnap] = await Promise.all([
        db.collection('mechanics').doc(uid).get(),
        db.collection('appointments').where('mechanicId', '==', uid).get(),
        db.collection('leads').where('mechanicId', '==', uid).get(),
        db.collection('mechanics').doc(uid).collection('portfolio').get()
      ]);

      const profile = profileDoc.exists ? profileDoc.data() : null;
      const appointments = apptSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const leads = leadsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const portfolio = portSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      return { profile, appointments, leads, portfolio };
    },

    // ------------------------------------
    // Leads
    // ------------------------------------
    async acceptLead(id) {
      const db = getDb();
      const uid = getUid();
      const leadDoc = await db.collection('leads').doc(id).get();
      if(leadDoc.exists) {
        const leadData = leadDoc.data();
        await db.collection('appointments').add({
          ...leadData,
          mechanicId: uid,
          status: 'confirmed',
          acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('leads').doc(id).delete();
      }
      return { success: true };
    },

    async declineLead(id) {
      const db = getDb();
      await db.collection('leads').doc(id).update({ status: 'declined' });
      return { success: true };
    },

    // ------------------------------------
    // Portfolio
    // ------------------------------------
    async addPortfolio(data) {
      const db = getDb();
      const uid = getUid();
      const docRef = await db.collection('mechanics').doc(uid).collection('portfolio').add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...data };
    },

    async deletePortfolio(id) {
      const db = getDb();
      const uid = getUid();
      await db.collection('mechanics').doc(uid).collection('portfolio').doc(id).delete();
      return { success: true };
    },

    // ------------------------------------
    // Appointments
    // ------------------------------------
    async updateStatus(avail) {
      const db = getDb();
      const uid = getUid();
      await db.collection('mechanics').doc(uid).update({ available: avail });
      return { success: true };
    },

    async markApptDone(id) {
      const db = getDb();
      await db.collection('appointments').doc(id).update({ status: 'completed' });
      return { success: true };
    },

    async cancelAppt(id) {
      const db = getDb();
      await db.collection('appointments').doc(id).update({ status: 'cancelled' });
      return { success: true };
    },

    async updateApptStatus(id, newStatus) {
      const db = getDb();
      await db.collection('appointments').doc(id).update({ status: newStatus });
      return { success: true };
    },

    async confirmAppt(id) {
      const db = getDb();
      await db.collection('appointments').doc(id).update({ status: 'confirmed' });
      return { success: true };
    },

    async isAuthenticated() {
      return window.FirebaseAuth && window.FirebaseAuth.currentUser !== null;
    }
  };

  global.MechAPI = MechAPI;

})(window);
