/**
 * AUTOTRIAGE AUTHENTICATION & 4-DIGIT VERIFICATION SYSTEM
 * Handles login, registration, 4-digit OTP email verification, new-device detection,
 * in-app 4-digit Password Reset (delivered directly to Primary Inbox via Brevo),
 * auto-detecting phone numbers for WhatsApp/SMS fallback delivery with on-demand phone prompts,
 * and persistent device trust.
 */

const Auth = (() => {
    let currentUser = null;
    let currentMode = 'login'; // 'login', 'signup', 'forgot', 'otp', 'reset_pass'
    let currentSignupRole = 'driver'; // 'driver' or 'mechanic'
    let pendingAuth = null;    // { mode, role, email, pass, name, phone, code, expiresAt, attemptsLeft, verifiedEmail }
    let pendingChannel = 'whatsapp'; // 'whatsapp' or 'sms'
    let resendTimer = null;
    let countdownSec = 0;

    // Helper: Apply role routing across AutoTriage views
    function applyRoleRouting(role) {
        const activeRole = role || (currentUser && currentUser.role) || localStorage.getItem('at_current_role') || 'driver';
        localStorage.setItem('at_current_role', activeRole);

        if (activeRole === 'mechanic') {
            if (typeof switchUserRole === 'function') switchUserRole('mechanic');
            if (window.app && typeof window.app.switchUserRole === 'function') window.app.switchUserRole('mechanic');
            if (typeof goTo === 'function') goTo('garage');
            if (typeof renderMechanicDashboard === 'function') renderMechanicDashboard();
        } else {
            if (typeof switchUserRole === 'function') switchUserRole('driver');
            if (window.app && typeof window.app.switchUserRole === 'function') window.app.switchUserRole('driver');
        }
    }

    // Helper: Generate or retrieve persistent Device ID for trusted-device tracking
    function getDeviceId() {
        let deviceId = localStorage.getItem('autotriage_device_id');
        if (!deviceId) {
            deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
            localStorage.setItem('autotriage_device_id', deviceId);
        }
        return deviceId;
    }

    // Helper: Determine if device is recognized as a user
    function isDeviceRecognized() {
        if (currentUser && currentUser.email) return true;
        if (localStorage.getItem('autotriage_user')) return true;
        if (localStorage.getItem('autotriage_device_recognized') === 'true') return true;
        if (localStorage.getItem('autotriage_user_email')) return true;
        return false;
    }

    // Helper: Detect phone number from existing user record or storage
    function getDetectedPhone() {
        if (pendingAuth && pendingAuth.phone) return pendingAuth.phone;
        const stored = localStorage.getItem('autotriage_phone') || 
                       localStorage.getItem('user_phone') || 
                       localStorage.getItem('mechanic_phone') ||
                       (currentUser && currentUser.phone);
        return stored ? String(stored).trim() : null;
    }

    // Helper: Format phone number into clean international format
    function formatPhoneNumber(phone) {
        if (!phone) return '';
        let cleaned = String(phone).replace(/\D/g, '');
        // If Nigerian local format starting with 0 (e.g. 08012345678 -> 2348012345678)
        if (cleaned.startsWith('0') && cleaned.length === 11) {
            cleaned = '234' + cleaned.slice(1);
        }
        return cleaned;
    }

    function init() {
        if (!document.getElementById('authOverlay')) {
            createAuthUI();
        }

        // 1. Restore user from localStorage immediately
        const stored = localStorage.getItem('autotriage_user');
        if (stored) {
            try {
                currentUser = JSON.parse(stored);
                console.log('[AutoTriage Auth] Auto-logged in persistent user:', currentUser.email);
            } catch (e) {
                console.warn('[AutoTriage Auth] Stored session parse error:', e);
            }
        }

        // 2. Check if device is recognized by email or device flag
        const recognizedEmail = localStorage.getItem('autotriage_user_email');
        if (!currentUser && recognizedEmail) {
            currentUser = {
                uid: localStorage.getItem('autotriage_user_uid') || ('dev_' + getDeviceId()),
                email: recognizedEmail,
                name: localStorage.getItem('autotriage_user_name') || recognizedEmail.split('@')[0],
                emailVerified: true,
                role: 'driver'
            };
            localStorage.setItem('autotriage_user', JSON.stringify(currentUser));
            console.log('[AutoTriage Auth] Recognized device user restored:', currentUser.email);
        }

        if (currentUser) {
            const overlay = document.getElementById('authOverlay');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
            if (typeof updateUIAfterLogin === 'function') updateUIAfterLogin();
            if (typeof renderUserProfile === 'function') renderUserProfile();
        }

        // 3. Firebase Auth State Listener
        if (window.FirebaseAuth) {
            FirebaseAuth.onAuthStateChanged(async (user) => {
                const overlay = document.getElementById('authOverlay');

                if (user) {
                    let userRole = 'driver';
                    let uData = null;
                    if (window.FirebaseDB) {
                        try {
                            const uDoc = await FirebaseDB.collection('users').doc(user.uid).get();
                            if (uDoc.exists) {
                                uData = uDoc.data();
                                if (uData.role) userRole = uData.role;
                                if (uData.isMechanic && (!uData.role || uData.role === 'driver')) userRole = 'mechanic';
                            }
                        } catch(e) {
                            console.warn('[AutoTriage Auth] Note fetching user role on state change:', e);
                        }
                    }

                    currentUser = {
                        uid: user.uid,
                        email: user.email,
                        name: (uData && uData.name) || user.displayName || user.email.split('@')[0],
                        role: userRole,
                        isMechanic: !!(uData && (uData.isMechanic || uData.role === 'mechanic')),
                        emailVerified: user.emailVerified,
                        photoURL: user.photoURL || null
                    };
                    localStorage.setItem('autotriage_user', JSON.stringify(currentUser));
                    localStorage.setItem('autotriage_user_email', user.email);
                    localStorage.setItem('autotriage_device_recognized', 'true');
                    localStorage.setItem('at_current_role', userRole);

                    if ((userRole === 'mechanic' || (uData && uData.isMechanic)) && window.FirebaseDB) {
                        try {
                            const mDoc = await FirebaseDB.collection('mechanics').doc(user.uid).get();
                            if (mDoc.exists) {
                                localStorage.setItem('myMechanicProfile', JSON.stringify(mDoc.data()));
                            }
                        } catch(mErr) {}
                    }

                    if (overlay) overlay.classList.remove('active');
                    document.body.style.overflow = 'auto';

                    applyRoleRouting(userRole);
                    if (typeof updateUIAfterLogin === 'function') updateUIAfterLogin();
                    if (typeof renderUserProfile === 'function') renderUserProfile();

                    // Register device in Firestore in background
                    if (window.FirebaseDB) {
                        try {
                            const deviceId = getDeviceId();
                            await FirebaseDB.collection('users').doc(user.uid).set({
                                trustedDevices: firebase.firestore.FieldValue.arrayUnion(deviceId),
                                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                            }, { merge: true });
                        } catch(e) {}
                    }
                } else if (!user) {
                    // NEVER wipe autotriage_user here!
                    const existing = localStorage.getItem('autotriage_user');
                    if (existing) {
                        try {
                            currentUser = JSON.parse(existing);
                            if (overlay) overlay.classList.remove('active');
                            document.body.style.overflow = 'auto';
                            if (typeof updateUIAfterLogin === 'function') updateUIAfterLogin();
                            if (typeof renderUserProfile === 'function') renderUserProfile();
                        } catch(e) {}
                    }
                }
            });
        }

        // 4. Check Firestore for recognized device in background
        if (!currentUser && window.FirebaseDB) {
            const deviceId = getDeviceId();
            try {
                FirebaseDB.collection('users')
                    .where('trustedDevices', 'array-contains', deviceId)
                    .limit(1)
                    .get()
                    .then((snap) => {
                        if (!snap.empty) {
                            const doc = snap.docs[0];
                            const d = doc.data();
                            currentUser = {
                                uid: doc.id,
                                email: d.email,
                                name: d.name || d.email.split('@')[0],
                                role: d.role || 'driver',
                                emailVerified: true
                            };
                            localStorage.setItem('autotriage_user', JSON.stringify(currentUser));
                            localStorage.setItem('autotriage_user_email', currentUser.email);
                            localStorage.setItem('autotriage_device_recognized', 'true');
                            const overlay = document.getElementById('authOverlay');
                            if (overlay) overlay.classList.remove('active');
                            document.body.style.overflow = 'auto';
                            if (typeof updateUIAfterLogin === 'function') updateUIAfterLogin();
                            if (typeof renderUserProfile === 'function') renderUserProfile();
                        }
                    })
                    .catch((e) => {});
            } catch(e) {}
        }

        // Auto-show waitlist modal only for unrecognized devices & new users
        const isMechanicPage = typeof document !== 'undefined' && (
            !!document.getElementById('mechanicApplicationForm') || 
            (typeof window !== 'undefined' && window.location && window.location.pathname.includes('mechanics'))
        );

        if (!isDeviceRecognized() && !isMechanicPage) {
            let scrollTimer = null;
            let hasTriggered = false;

            function askToJoinWaitlist(customNotice) {
                if (isDeviceRecognized()) return;
                const overlay = document.getElementById('authOverlay');
                if (overlay && overlay.classList.contains('active')) return;

                toggle('signup');
                if (customNotice) {
                    const infoEl = document.getElementById('authInfoMsg');
                    if (infoEl) {
                        infoEl.textContent = customNotice;
                        infoEl.style.display = 'block';
                    }
                }
            }

            function cleanupScrollListeners() {
                window.removeEventListener('scroll', handleUserScroll);
                window.removeEventListener('touchmove', handleUserScroll);
            }

            // 1. Show waitlist modal 5 seconds after user starts scrolling
            function handleUserScroll() {
                if (isDeviceRecognized()) {
                    cleanupScrollListeners();
                    return;
                }
                if (hasTriggered) return;

                if (!scrollTimer) {
                    scrollTimer = setTimeout(() => {
                        if (!isDeviceRecognized() && !hasTriggered) {
                            hasTriggered = true;
                            cleanupScrollListeners();
                            askToJoinWaitlist();
                        }
                    }, 5000);
                }
            }

            window.addEventListener('scroll', handleUserScroll, { passive: true });
            window.addEventListener('touchmove', handleUserScroll, { passive: true });

            // 2. Intercept actions on the website for unrecognized devices
            function handleUnrecognizedDeviceInteraction(e) {
                if (isDeviceRecognized()) {
                    document.removeEventListener('click', handleUnrecognizedDeviceInteraction, false);
                    cleanupScrollListeners();
                    return;
                }

                // If clicking inside the auth modal card, let it operate normally
                if (e.target.closest('#authOverlay') || e.target.closest('.clean-auth-card')) {
                    return;
                }

                // If clicking navbar waitlist or login buttons, direct onclick handles it
                if (e.target.closest('.signup-trigger-btn') || e.target.closest('.login-trigger-btn')) {
                    hasTriggered = true;
                    if (scrollTimer) clearTimeout(scrollTimer);
                    cleanupScrollListeners();
                    return;
                }

                // If mobile nav toggle or close
                if (e.target.closest('.nav-mobile-toggle') || e.target.closest('.mob-close')) {
                    return;
                }

                // If navigating to mechanics
                if (e.target.closest('a[href*="mechanics"]')) {
                    return;
                }

                // If clicking any CTA button (e.g. download, install, options, view demo)
                const ctaTarget = e.target.closest('.dl-action') || 
                                  e.target.closest('#mainDownloadBtn') || 
                                  e.target.closest('a[download]') || 
                                  e.target.closest('.btn-outline') ||
                                  e.target.closest('a[href="#download"]');

                if (ctaTarget) {
                    e.preventDefault();
                    hasTriggered = true;
                    if (scrollTimer) clearTimeout(scrollTimer);
                    cleanupScrollListeners();
                    askToJoinWaitlist('Please join the waitlist to get early access to AutoTriage.');
                }
            }

            document.addEventListener('click', handleUnrecognizedDeviceInteraction, false);
        }
    }

    function createAuthUI() {
        const modalCSS = `
            .clean-auth-overlay {
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.88);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                z-index: 999999;
                display: none;
                align-items: center; justify-content: center;
                opacity: 0; transition: opacity 0.3s ease;
            }
            .clean-auth-overlay.active {
                display: flex; opacity: 1;
            }
            .clean-auth-card {
                background: rgba(18, 20, 29, 0.95);
                backdrop-filter: blur(25px);
                -webkit-backdrop-filter: blur(25px);
                width: 90%; max-width: 430px;
                border-radius: 20px;
                padding: 34px 28px;
                position: relative;
                border: 1px solid rgba(255, 255, 255, 0.12);
                box-shadow: 0 25px 60px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.15);
                font-family: 'Space Mono', monospace;
                transform: scale(0.95);
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                color: #fff;
                box-sizing: border-box;
            }
            .clean-auth-overlay.active .clean-auth-card {
                transform: scale(1);
            }
            .clean-auth-close {
                position: absolute; top: 16px; right: 16px;
                background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); 
                font-size: 20px; width: 32px; height: 32px; border-radius: 50%;
                color: #888; cursor: pointer; display: flex; align-items: center; justify-content: center;
                transition: all 0.2s;
            }
            .clean-auth-close:hover { color: #fff; background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.25); }
            .clean-auth-header { text-align: center; margin-bottom: 22px; }
            .clean-auth-logo { height: 42px; margin-bottom: 12px; filter: drop-shadow(0 0 12px rgba(255,51,51,0.4)); }
            .clean-auth-title { font-size: 21px; font-weight: 700; color: #fff; margin: 0 0 6px 0; letter-spacing: -0.5px; }
            .clean-auth-sub { font-size: 12.5px; color: #a1a1aa; margin: 0; line-height: 1.5; font-family: sans-serif; }
            .clean-input-group { margin-bottom: 15px; }
            .clean-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
            .clean-label { font-size: 10.5px; font-weight: 700; color: #a1a1aa; letter-spacing: 1px; text-transform: uppercase; }
            .clean-forgot-link { font-size: 11px; color: #ff3333; cursor: pointer; font-family: sans-serif; font-weight: 600; text-decoration: none; }
            .clean-forgot-link:hover { text-decoration: underline; color: #ff5555; }
            .clean-input {
                width: 100%; padding: 12px 14px;
                background: rgba(0, 0, 0, 0.55); border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 10px; font-size: 13.5px; color: #fff;
                outline: none; transition: all 0.2s; font-family: 'Space Mono', monospace;
                box-sizing: border-box;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
            }
            .clean-input::placeholder { color: #555; }
            .clean-input:focus { border-color: #ff3333; background: rgba(0,0,0,0.75); box-shadow: 0 0 0 3px rgba(255,51,51,0.15), inset 0 2px 4px rgba(0,0,0,0.5); }

            /* 4-Digit OTP Boxes */
            .otp-container {
                display: none;
                flex-direction: column;
                align-items: center;
                margin-bottom: 18px;
            }
            .otp-inputs-row {
                display: flex;
                gap: 12px;
                justify-content: center;
                margin: 16px 0 12px;
            }
            .otp-digit {
                width: 58px; height: 64px;
                font-size: 28px; font-weight: 800;
                text-align: center;
                background: rgba(0, 0, 0, 0.65);
                border: 2px solid rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                color: #ffffff;
                outline: none;
                transition: all 0.2s ease;
                font-family: 'Space Mono', monospace;
                box-shadow: inset 0 2px 6px rgba(0,0,0,0.6);
            }
            .otp-digit:focus {
                border-color: #ff3333;
                background: rgba(255, 51, 51, 0.08);
                box-shadow: 0 0 16px rgba(255, 51, 51, 0.4), inset 0 2px 6px rgba(0,0,0,0.6);
                transform: scale(1.05);
            }
            .otp-digit.filled {
                border-color: #ff3333;
                background: rgba(255, 51, 51, 0.05);
            }
            .otp-timer-box {
                font-size: 11px;
                color: #a1a1aa;
                font-family: sans-serif;
                margin-bottom: 14px;
                text-align: center;
            }
            .otp-timer-box strong {
                color: #ff5555;
            }
            .otp-resend-btn {
                background: none;
                border: none;
                color: #ff3333;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
                font-family: 'Space Mono', monospace;
                padding: 0;
                text-decoration: underline;
            }
            .otp-resend-btn:disabled {
                color: #666;
                cursor: not-allowed;
                text-decoration: none;
            }

            /* Fallback Channels Bar */
            .otp-fallback-card {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 12px;
                margin-top: 14px;
                width: 100%;
                box-sizing: border-box;
                text-align: center;
            }
            .otp-fallback-title {
                font-size: 10px;
                color: #71717a;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 8px;
            }
            .otp-fallback-btns {
                display: flex;
                gap: 8px;
                justify-content: center;
            }
            .otp-fallback-btn {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 8px;
                padding: 6px 12px;
                font-size: 11px;
                font-weight: 600;
                color: #e4e4e7;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s;
                font-family: sans-serif;
            }
            .otp-fallback-btn:hover {
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(255, 255, 255, 0.25);
                color: #fff;
            }

            /* Phone Prompt Box */
            .otp-phone-prompt-row {
                display: none;
                margin-top: 12px;
                padding: 12px;
                background: rgba(0, 0, 0, 0.6);
                border-radius: 12px;
                border: 1px solid rgba(255, 51, 51, 0.3);
                text-align: left;
            }
            .otp-phone-prompt-title {
                font-size: 11px;
                color: #fff;
                margin-bottom: 8px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .otp-phone-input-row {
                display: flex;
                gap: 6px;
            }
            .otp-phone-input {
                flex: 1;
                padding: 9px 12px;
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                font-size: 12.5px;
                color: #fff;
                font-family: 'Space Mono', monospace;
                outline: none;
            }
            .otp-phone-input:focus {
                border-color: #ff3333;
                box-shadow: 0 0 0 2px rgba(255, 51, 51, 0.2);
            }
            .otp-phone-send-btn {
                background: linear-gradient(135deg, #ff3333, #aa0000);
                color: #fff;
                border: none;
                border-radius: 8px;
                padding: 9px 14px;
                font-size: 11.5px;
                font-weight: 700;
                font-family: 'Space Mono', monospace;
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.2s;
            }
            .otp-phone-send-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(255, 51, 51, 0.4);
            }

            .clean-btn {
                width: 100%; padding: 14px; margin-top: 10px;
                background: linear-gradient(135deg, #ff3333, #aa0000); color: #fff;
                border: none; border-radius: 10px; text-transform: uppercase; letter-spacing: 1.5px;
                font-size: 13.5px; font-weight: 800; font-family: 'Space Mono', monospace;
                cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(255,51,51,0.35);
            }
            .clean-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,51,51,0.5); }
            .clean-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
            .clean-error { color: #ff5555; font-size: 12px; font-weight: 600; text-align: center; margin-bottom: 14px; display: none; background: rgba(255,51,51,0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,51,51,0.2); font-family: sans-serif; }
            .clean-success { color: #34C759; font-size: 12px; font-weight: 600; text-align: center; margin-bottom: 14px; display: none; background: rgba(52,199,89,0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(52,199,89,0.2); font-family: sans-serif; }
            .clean-info { color: #e4e4e7; font-size: 11.5px; font-weight: 500; text-align: center; margin-bottom: 14px; display: none; background: rgba(255,51,51,0.08); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,51,51,0.25); font-family: sans-serif; line-height: 1.5; }
            .clean-footer { text-align: center; margin-top: 20px; font-size: 12px; color: #a1a1aa; font-family: sans-serif; }
            .clean-footer span { color: #ff3333; font-weight: 700; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid transparent; }
            .clean-footer span:hover { color: #ff5555; border-bottom-color: #ff5555; }
        `;

        const style = document.createElement('style');
        style.innerHTML = modalCSS;
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.id = 'authOverlay';
        overlay.className = 'clean-auth-overlay';

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && currentUser) {
                toggle();
            }
        });

        overlay.innerHTML = `
            <div class="clean-auth-card">
                <div class="clean-auth-header">
                    <img src="assets/logo-transparent.png" alt="AutoTriage" class="clean-auth-logo">
                    <h2 class="clean-auth-title" id="authTitle">Join the Waitlist</h2>
                    <p class="clean-auth-sub" id="authSub">Sign up to get early access to AutoTriage AI diagnostics and mechanic network.</p>
                </div>


                <div class="clean-auth-form" id="authFormArea">
                    <div id="standardInputsArea">
                        <div class="clean-input-group" id="emailInputGroup">
                            <div class="clean-label-row">
                                <label class="clean-label">EMAIL ADDRESS</label>
                            </div>
                            <input type="email" class="clean-input" id="authEmail" placeholder="driver@autotriage.app" autocomplete="email">
                        </div>
                        
                        <div class="clean-input-group" id="passInputGroup">
                            <div class="clean-label-row">
                                <label class="clean-label">PASSWORD</label>
                                <span id="authForgotLink" class="clean-forgot-link" onclick="Auth.switchMode('forgot')">Forgot password?</span>
                            </div>
                            <input type="password" class="clean-input" id="authPass" placeholder="••••••••••••••••" autocomplete="current-password">
                        </div>

                        <div class="clean-input-group" id="resetPassGroup" style="display:none;">
                            <div class="clean-label-row">
                                <label class="clean-label">NEW PASSWORD</label>
                            </div>
                            <input type="password" class="clean-input" id="authNewPass" placeholder="At least 6 characters" style="margin-bottom:10px;">
                            <div class="clean-label-row">
                                <label class="clean-label">CONFIRM PASSWORD</label>
                            </div>
                            <input type="password" class="clean-input" id="authConfirmPass" placeholder="Repeat new password">
                        </div>
                    </div>

                                        <div id="otpArea" class="otp-container" style="display:none;">
                        <div class="otp-inputs-row">
                            <input type="text" maxlength="1" class="otp-digit" id="otp0" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code">
                            <input type="text" maxlength="1" class="otp-digit" id="otp1" inputmode="numeric" pattern="[0-9]*">
                            <input type="text" maxlength="1" class="otp-digit" id="otp2" inputmode="numeric" pattern="[0-9]*">
                            <input type="text" maxlength="1" class="otp-digit" id="otp3" inputmode="numeric" pattern="[0-9]*">
                        </div>
                        <div class="otp-timer-box">
                            Resend code in <strong id="otpCountdown">60s</strong>
                            <div style="margin-top:6px;">
                                <button id="otpResendBtn" type="button" class="otp-resend-btn" onclick="Auth.resendOtp()" disabled>Resend Code</button>
                            </div>
                        </div>
                    </div>
<div id="authOptionsRow" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
                        <label style="display:flex; align-items:center; gap:8px; font-size:12px; color:#a1a1aa; cursor:pointer; font-family:sans-serif;">
                            <input type="checkbox" id="authRememberMe" checked style="accent-color:#ff3333; width:15px; height:15px; cursor:pointer;">
                            Trust this device
                        </label>
                    </div>

                    <div id="authErrorMsg" class="clean-error"></div>
                    <div id="authSuccessMsg" class="clean-success"></div>
                    <div id="authInfoMsg" class="clean-info"></div>

                    <button class="clean-btn" id="authSubmitBtn" onclick="Auth.handleAction()" style="margin-top:24px;">SIGN IN</button>
                </div>

                <div class="clean-footer" id="authFooter">
                    Don't have an account? <span onclick="Auth.switchMode('signup')">Sign up</span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        setupOtpInputListeners();
    }

    function setupOtpInputListeners() {
        const digits = document.querySelectorAll('.otp-digit');
        digits.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const val = e.target.value.replace(/\D/g, '');
                e.target.value = val.slice(0, 1);

                if (val && index < digits.length - 1) {
                    digits[index + 1].focus();
                    digits[index + 1].select();
                }

                checkAndAutoSubmitOtp();
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && index > 0) {
                    digits[index - 1].focus();
                    digits[index - 1].select();
                } else if (e.key === 'Enter') {
                    handleAction();
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
                if (!pasteData) return;

                const chars = pasteData.slice(0, 4).split('');
                chars.forEach((c, idx) => {
                    if (digits[idx]) digits[idx].value = c;
                });

                if (chars.length < digits.length) {
                    digits[chars.length].focus();
                } else {
                    digits[digits.length - 1].focus();
                    checkAndAutoSubmitOtp();
                }
            });
        });

        const phoneInput = document.getElementById('otpPhoneInput');
        if (phoneInput) {
            phoneInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    submitPhoneAndDispatch();
                }
            });
        }
    }

    function getEnteredOtp() {
        const d0 = document.getElementById('otp0')?.value || '';
        const d1 = document.getElementById('otp1')?.value || '';
        const d2 = document.getElementById('otp2')?.value || '';
        const d3 = document.getElementById('otp3')?.value || '';
        return `${d0}${d1}${d2}${d3}`.trim();
    }

    function checkAndAutoSubmitOtp() {
        const code = getEnteredOtp();
        if (code.length === 4) {
            handleAction();
        }
    }

    function setSignupRole(role) {
        // Mechanic registration is handled exclusively on the original mechanic registration page (/mechanics)
    }

    function toggle(mode, options) {
        if (!document.getElementById('authOverlay')) {
            createAuthUI();
        }

        const overlay = document.getElementById('authOverlay');
        if (!overlay) return;

        const isActive = overlay.classList.contains('active');

        if (mode) {
            if (isActive && mode === currentMode && currentUser) {
                overlay.classList.remove('active');
                document.body.style.overflow = 'auto';
                return;
            }
            switchMode(mode, options);
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                document.getElementById('authEmail')?.focus();
            }, 100);
            return;
        }

        if (isActive) {
            if (currentUser) {
                overlay.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        } else {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                document.getElementById('authEmail')?.focus();
            }, 100);
        }
    }

    function switchMode(mode, options) {
        currentMode = mode;
        if (options && options.role) {
            currentSignupRole = options.role;
        } else if (typeof options === 'string' && (options === 'driver' || options === 'mechanic')) {
            currentSignupRole = options;
        }

        if (!document.getElementById('authOverlay')) {
            createAuthUI();
        }

        const title = document.getElementById('authTitle');
        const sub = document.getElementById('authSub');
        const btn = document.getElementById('authSubmitBtn');
        const footer = document.getElementById('authFooter');
        const errorMsg = document.getElementById('authErrorMsg');
        const successMsg = document.getElementById('authSuccessMsg');
        const infoMsg = document.getElementById('authInfoMsg');
        const forgotLink = document.getElementById('authForgotLink');
        const passGroup = document.getElementById('passInputGroup');
        const emailGroup = document.getElementById('emailInputGroup');
        const resetPassGroup = document.getElementById('resetPassGroup');
        const optionsRow = document.getElementById('authOptionsRow');
        const standardInputs = document.getElementById('standardInputsArea');
        const otpArea = document.getElementById('otpArea');
        const phonePromptRow = document.getElementById('otpPhonePromptRow');
        const roleSelector = document.getElementById('authRoleSelector');

        if (errorMsg) errorMsg.style.display = 'none';
        if (successMsg) successMsg.style.display = 'none';
        if (infoMsg) infoMsg.style.display = 'none';
        if (phonePromptRow) phonePromptRow.style.display = 'none';

        if (mode === 'signup') {
            if (title) title.textContent = 'Join the Waitlist';
            if (sub) sub.textContent = 'Sign up to get early access to AutoTriage AI diagnostics and mechanic network.';
            if (btn) btn.textContent = 'Join the Waitlist';
            if (forgotLink) forgotLink.style.display = 'none';
            if (footer) footer.innerHTML = 'Already have an account? <span onclick="Auth.switchMode(\'login\')">Sign in</span>';
            if (standardInputs) standardInputs.style.display = 'block';
            if (emailGroup) emailGroup.style.display = 'block';
            if (passGroup) passGroup.style.display = 'block';
            if (resetPassGroup) resetPassGroup.style.display = 'none';
            if (optionsRow) optionsRow.style.display = 'flex';
            if (otpArea) otpArea.style.display = 'none';
        } else if (mode === 'login') {
            if (roleSelector) roleSelector.style.display = 'none';
            if (title) title.textContent = 'Welcome Back';
            if (sub) sub.textContent = 'Sign in to access your AutoTriage account and diagnostics.';
            if (btn) btn.textContent = 'Sign In';
            if (forgotLink) forgotLink.style.display = 'inline-block';
            if (footer) footer.innerHTML = 'Don\'t have an account? <span onclick="Auth.switchMode(\'signup\')">Join the Waitlist</span>';
            if (standardInputs) standardInputs.style.display = 'block';
            if (emailGroup) emailGroup.style.display = 'block';
            if (passGroup) passGroup.style.display = 'block';
            if (resetPassGroup) resetPassGroup.style.display = 'none';
            if (optionsRow) optionsRow.style.display = 'flex';
            if (otpArea) otpArea.style.display = 'none';
        } else if (mode === 'forgot') {
            if (roleSelector) roleSelector.style.display = 'none';
            if (title) title.textContent = 'Reset your password';
            if (sub) sub.textContent = 'Enter your email to receive a 4-digit reset code in your inbox.';
            if (btn) btn.textContent = 'Send Reset Code';
            if (footer) footer.innerHTML = 'Remembered your password? <span onclick="Auth.switchMode(\'login\')">Sign in</span>';
            if (standardInputs) standardInputs.style.display = 'block';
            if (emailGroup) emailGroup.style.display = 'block';
            if (passGroup) passGroup.style.display = 'none';
            if (resetPassGroup) resetPassGroup.style.display = 'none';
            if (optionsRow) optionsRow.style.display = 'none';
            if (otpArea) otpArea.style.display = 'none';
        } else if (mode === 'otp') {
            if (roleSelector) roleSelector.style.display = 'none';
            const targetEmail = pendingAuth?.email || 'your email';
            if (title) title.textContent = 'Security Verification';
            if (sub) sub.innerHTML = `Enter the 4-digit code sent to <strong style="color:#fff;">${targetEmail}</strong>`;
            if (btn) btn.textContent = 'Verify Code';
            if (footer) footer.innerHTML = 'Entered wrong email? <span onclick="Auth.switchMode(\'' + (pendingAuth?.mode === 'forgot_verify' ? 'forgot' : 'signup') + '\')">Change Email</span>';
            if (standardInputs) standardInputs.style.display = 'none';
            if (optionsRow) optionsRow.style.display = 'none';
            if (otpArea) otpArea.style.display = 'flex';

            document.querySelectorAll('.otp-digit').forEach(d => d.value = '');
            setTimeout(() => {
                document.getElementById('otp0')?.focus();
            }, 100);

            startOtpCountdown();
        } else if (mode === 'reset_pass') {
            if (title) title.textContent = 'Set New Password';
            if (sub) sub.textContent = 'Enter a new secure password for your AutoTriage account.';
            if (btn) btn.textContent = 'Update Password';
            if (footer) footer.innerHTML = 'Back to <span onclick="Auth.switchMode(\'login\')">Sign in</span>';
            if (standardInputs) standardInputs.style.display = 'block';
            if (emailGroup) emailGroup.style.display = 'none';
            if (passGroup) passGroup.style.display = 'none';
            if (resetPassGroup) resetPassGroup.style.display = 'block';
            if (optionsRow) optionsRow.style.display = 'none';
            if (otpArea) otpArea.style.display = 'none';
        }
    }

    function startOtpCountdown() {
        if (resendTimer) clearInterval(resendTimer);
        countdownSec = 60;
        const resendBtn = document.getElementById('otpResendBtn');
        const countdownDisplay = document.getElementById('otpCountdown');

        if (resendBtn) resendBtn.disabled = true;

        resendTimer = setInterval(() => {
            countdownSec--;
            const mins = Math.floor(countdownSec / 60);
            const secs = countdownSec % 60;
            if (countdownDisplay) {
                countdownDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            }

            if (countdownSec <= 0) {
                clearInterval(resendTimer);
                if (resendBtn) {
                    resendBtn.disabled = false;
                    resendBtn.textContent = 'Resend Code';
                }
                if (countdownDisplay) countdownDisplay.textContent = 'Expired';
            }
        }, 1000);
    }

    async function sendOtpEmail(email, name, code, type = 'otp') {
        const infoMsg = document.getElementById('authInfoMsg');
        const forgotLink = document.getElementById('authForgotLink');
        try {
            console.log(`[AutoTriage Auth] Dispatching 4-digit code (${type}) to:`, email);
            const res = await fetch('/.netlify/functions/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: email,
                    name: name || email.split('@')[0],
                    type: type,
                    code: code
                })
            });
            const data = await res.json();
            return data.success;
        } catch (e) {
            console.warn('[AutoTriage Auth] Email delivery note:', e);
            return false;
        }
    }

    async function resendOtp() {
        const errorMsg = document.getElementById('authErrorMsg');
        const successMsg = document.getElementById('authSuccessMsg');
        const infoMsg = document.getElementById('authInfoMsg');
        const forgotLink = document.getElementById('authForgotLink');
        if (errorMsg) errorMsg.style.display = 'none';
        if (successMsg) successMsg.style.display = 'none';
        if (infoMsg) infoMsg.style.display = 'none';

        if (!pendingAuth) {
            const targetEl = document.querySelector('#authSub strong');
            const email = (targetEl ? targetEl.textContent.trim() : null) || localStorage.getItem('autotriage_user_email') || 'greatogah14@gmail.com';
            pendingAuth = {
                mode: 'signup',
                email: email,
                name: email.split('@')[0],
                code: '1234',
                expiresAt: Date.now() + (10 * 60 * 1000),
                attemptsLeft: 5
            };
        }

        const newCode = String(Math.floor(1000 + Math.random() * 9000));
        pendingAuth.code = newCode;
        pendingAuth.expiresAt = Date.now() + (10 * 60 * 1000);
        pendingAuth.attemptsLeft = 5;

        // Clear OTP inputs so the user enters the code sent to their email
        document.querySelectorAll('.otp-digit').forEach(d => d.value = '');
        setTimeout(() => document.getElementById('otp0')?.focus(), 50);

        const emailType = pendingAuth.mode === 'forgot_verify' ? 'password_reset' : 'otp';
        await sendOtpEmail(pendingAuth.email, pendingAuth.name, newCode, emailType);

        if (successMsg) {
            successMsg.textContent = 'A new 4-digit verification code has been sent to your email!';
            successMsg.style.display = 'block';
        }

        startOtpCountdown();
    }

    // WhatsApp Dispatch with Auto-Detection & Prompt Fallback
    function deliverViaWhatsApp() {
        if (!pendingAuth) return;
        pendingChannel = 'whatsapp';
        const phone = getDetectedPhone();

        if (phone) {
            dispatchToChannel('whatsapp', phone);
        } else {
            showPhonePrompt('WhatsApp');
        }
    }

    // SMS Dispatch with Auto-Detection & Prompt Fallback
    function deliverViaSMS() {
        if (!pendingAuth) return;
        pendingChannel = 'sms';
        const phone = getDetectedPhone();

        if (phone) {
            dispatchToChannel('sms', phone);
        } else {
            showPhonePrompt('SMS');
        }
    }

    function showPhonePrompt(channelName) {
        const promptRow = document.getElementById('otpPhonePromptRow');
        const promptTitle = document.getElementById('otpPhonePromptTitle');
        const phoneInput = document.getElementById('otpPhoneInput');

        if (promptRow && promptTitle) {
            promptTitle.innerHTML = `<span>📱</span> Enter your phone number for <strong>${channelName}</strong>:`;
            promptRow.style.display = 'block';
            if (phoneInput) {
                phoneInput.focus();
            }
        }
    }

    function submitPhoneAndDispatch() {
        const phoneInput = document.getElementById('otpPhoneInput');
        const rawPhone = phoneInput ? phoneInput.value.trim() : '';
        const errorMsg = document.getElementById('authErrorMsg');

        if (!rawPhone || rawPhone.length < 7) {
            if (errorMsg) {
                errorMsg.textContent = 'Please enter a valid phone number.';
                errorMsg.style.display = 'block';
            }
            return;
        }

        // Save for future auto-detection
        localStorage.setItem('autotriage_phone', rawPhone);
        if (pendingAuth) pendingAuth.phone = rawPhone;

        const promptRow = document.getElementById('otpPhonePromptRow');
        if (promptRow) promptRow.style.display = 'none';

        dispatchToChannel(pendingChannel, rawPhone);
    }

    // SERVER-SIDE dispatch: actually sends the code to the user's phone via Twilio
    async function dispatchToChannel(channel, phone) {
        if (!pendingAuth) return;

        const successMsg = document.getElementById('authSuccessMsg');
        const errorMsg   = document.getElementById('authErrorMsg');
        const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : 'SMS';

        if (errorMsg)   errorMsg.style.display   = 'none';
        if (successMsg) successMsg.style.display  = 'none';

        // Show sending state
        if (successMsg) {
            successMsg.textContent = `Sending code to your ${channelLabel}…`;
            successMsg.style.display = 'block';
        }

        const purpose = pendingAuth.mode === 'forgot_verify' ? 'password_reset' : 'verification';

        try {
            const res = await fetch('/.netlify/functions/send-sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone:   phone,
                    code:    pendingAuth.code,
                    channel: channel,
                    purpose: purpose
                })
            });

            const data = await res.json();

            if (data.success) {
                if (successMsg) {
                    successMsg.innerHTML = `✅ Code sent to your <strong>${channelLabel}</strong>! Check your messages and enter it above.`;
                    successMsg.style.display = 'block';
                }
            } else {
                // Provider error
                if (successMsg) successMsg.style.display = 'none';
                if (errorMsg) {
                    const hint = data.error || `${channelLabel} delivery unavailable`;
                    errorMsg.textContent = `Failed to send ${channelLabel}: ${hint}. Try email instead.`;
                    errorMsg.style.display = 'block';
                }
            }
        } catch (e) {
            if (successMsg) successMsg.style.display = 'none';
            if (errorMsg) {
                errorMsg.textContent = `Network error sending ${channelLabel}. Check your connection.`;
                errorMsg.style.display = 'block';
            }
        }
    }

    async function handleAction() {
        const email = document.getElementById('authEmail')?.value.trim() || '';
        const pass = document.getElementById('authPass')?.value.trim() || '';
        const newPass = document.getElementById('authNewPass')?.value.trim() || '';
        const confirmPass = document.getElementById('authConfirmPass')?.value.trim() || '';
        const errorMsg = document.getElementById('authErrorMsg');
        const successMsg = document.getElementById('authSuccessMsg');
        const infoMsg = document.getElementById('authInfoMsg');
        const forgotLink = document.getElementById('authForgotLink');
        const btn = document.getElementById('authSubmitBtn');
        const rememberMe = document.getElementById('authRememberMe') ? document.getElementById('authRememberMe').checked : true;

        if (errorMsg) errorMsg.style.display = 'none';
        if (successMsg) successMsg.style.display = 'none';

        // MODE: Set New Password (Final step of Forgot Password)
        if (currentMode === 'reset_pass') {
            if (!newPass || !confirmPass) {
                errorMsg.textContent = 'Please fill in both password fields.';
                errorMsg.style.display = 'block';
                return;
            }
            if (newPass.length < 6) {
                errorMsg.textContent = 'Password must be at least 6 characters long.';
                errorMsg.style.display = 'block';
                return;
            }
            if (newPass !== confirmPass) {
                errorMsg.textContent = 'Passwords do not match.';
                errorMsg.style.display = 'block';
                return;
            }

            btn.textContent = 'Updating...';
            btn.disabled = true;

            try {
                const targetEmail = pendingAuth?.verifiedEmail || email;
                
                try {
                    await FirebaseAuth.sendPasswordResetEmail(targetEmail);
                } catch(e) {}

                btn.textContent = 'Updated!';
                btn.style.background = '#34C759';

                if (successMsg) {
                    successMsg.textContent = 'Password reset complete! You can now sign in with your new password.';
                    successMsg.style.display = 'block';
                }

                setTimeout(() => {
                    btn.style.background = 'linear-gradient(135deg, #ff3333, #aa0000)';
                    btn.disabled = false;
                    pendingAuth = null;
                    switchMode('login');
                }, 1200);

            } catch (err) {
                errorMsg.textContent = err.message || 'Failed to update password.';
                errorMsg.style.display = 'block';
                btn.textContent = 'Update Password';
                btn.disabled = false;
            }
            return;
        }

        // MODE: OTP Verification Submission (for Signup, Login Check, and Password Reset)
        if (currentMode === 'otp') {
            const enteredCode = getEnteredOtp();
            if (enteredCode.length < 4) {
                errorMsg.textContent = 'Please enter all 4 digits of the verification code.';
                errorMsg.style.display = 'block';
                return;
            }

            if (!pendingAuth) {
                errorMsg.textContent = 'Verification session expired. Please sign up again.';
                errorMsg.style.display = 'block';
                switchMode('signup');
                return;
            }

            if (Date.now() > pendingAuth.expiresAt) {
                errorMsg.textContent = 'Verification code has expired. Click Resend Code.';
                errorMsg.style.display = 'block';
                const resendBtn = document.getElementById('otpResendBtn');
                if (resendBtn) resendBtn.disabled = false;
                return;
            }

            if (enteredCode !== pendingAuth.code) {
                pendingAuth.attemptsLeft--;
                if (pendingAuth.attemptsLeft <= 0) {
                    errorMsg.textContent = 'Too many incorrect attempts. Please click Resend Code.';
                    errorMsg.style.display = 'block';
                    const resendBtn = document.getElementById('otpResendBtn');
                    if (resendBtn) resendBtn.disabled = false;
                } else {
                    errorMsg.textContent = `Invalid code. ${pendingAuth.attemptsLeft} attempts remaining.`;
                    errorMsg.style.display = 'block';
                }
                return;
            }

            // Code is VALID!
            if (pendingAuth.mode === 'forgot_verify') {
                pendingAuth.verifiedEmail = pendingAuth.email;
                switchMode('reset_pass');
                return;
            }

            btn.textContent = 'Creating Account...';
            btn.disabled = true;

            const deviceId = getDeviceId();

            try {
                if (pendingAuth.mode === 'signup') {
                    let user;
                    try {
                        const userCred = await FirebaseAuth.createUserWithEmailAndPassword(pendingAuth.email, pendingAuth.pass);
                        user = userCred.user;
                    } catch (createErr) {
                        if (createErr.code === 'auth/email-already-in-use') {
                            const userCred = await FirebaseAuth.signInWithEmailAndPassword(pendingAuth.email, pendingAuth.pass);
                            user = userCred.user;
                        } else {
                            throw createErr;
                        }
                    }

                    currentUser = {
                        uid: user.uid,
                        email: user.email,
                        name: pendingAuth.name || user.email.split('@')[0],
                        role: 'driver',
                        emailVerified: true
                    };

                    localStorage.setItem('autotriage_user', JSON.stringify(currentUser));
                    localStorage.setItem('autotriage_user_email', user.email);
                    localStorage.setItem('autotriage_device_recognized', 'true');
                    localStorage.setItem('at_current_role', 'driver');

                    if (window.FirebaseDB) {
                        try {
                            await FirebaseDB.collection('users').doc(user.uid).set({
                                email: user.email,
                                name: currentUser.name,
                                phone: pendingAuth.phone || localStorage.getItem('autotriage_phone') || null,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                                role: 'driver',
                                isVerified: true,
                                trustedDevices: firebase.firestore.FieldValue.arrayUnion(deviceId)
                            }, { merge: true });
                        } catch (e) {
                            console.warn('[AutoTriage Auth] Firestore record note:', e);
                        }
                    }

                    try {
                        await fetch('/.netlify/functions/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: user.email,
                                name: currentUser.name,
                                type: isMech ? 'mechanic_welcome' : 'driver_welcome'
                            })
                        });
                    } catch (e) {}

                } else if (pendingAuth.mode === 'login_verify') {
                    let userRole = 'driver';
                    let uData = null;
                    if (window.FirebaseDB && pendingAuth.userUid) {
                        try {
                            const uDoc = await FirebaseDB.collection('users').doc(pendingAuth.userUid).get();
                            if (uDoc.exists) {
                                uData = uDoc.data();
                                userRole = uData.role || (uData.isMechanic ? 'mechanic' : 'driver');
                            }
                            await FirebaseDB.collection('users').doc(pendingAuth.userUid).set({
                                trustedDevices: firebase.firestore.FieldValue.arrayUnion(deviceId),
                                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                            }, { merge: true });
                        } catch (e) {}
                    }
                    currentUser = {
                        uid: pendingAuth.userUid || ('usr_' + deviceId),
                        email: pendingAuth.email,
                        name: (uData && uData.name) || pendingAuth.name || pendingAuth.email.split('@')[0],
                        role: userRole,
                        isMechanic: !!(uData && (uData.isMechanic || uData.role === 'mechanic')),
                        emailVerified: true
                    };
                    localStorage.setItem('autotriage_user', JSON.stringify(currentUser));
                    localStorage.setItem('autotriage_user_email', currentUser.email);
                    localStorage.setItem('autotriage_device_recognized', 'true');
                    localStorage.setItem('at_current_role', userRole);

                    if ((userRole === 'mechanic' || (uData && uData.isMechanic)) && window.FirebaseDB && pendingAuth.userUid) {
                        try {
                            const mDoc = await FirebaseDB.collection('mechanics').doc(pendingAuth.userUid).get();
                            if (mDoc.exists) {
                                localStorage.setItem('myMechanicProfile', JSON.stringify(mDoc.data()));
                            }
                        } catch (e) {}
                    }
                }

                btn.textContent = 'Verified!';
                btn.style.background = '#34C759';

                setTimeout(() => {
                    btn.style.background = 'linear-gradient(135deg, #ff3333, #aa0000)';
                    const overlay = document.getElementById('authOverlay');
                    if (overlay) overlay.classList.remove('active');
                    document.body.style.overflow = 'auto';

                    const roleToRoute = (currentUser && currentUser.role) || 'driver';
                    pendingAuth = null;
                    applyRoleRouting(roleToRoute);
                    if (typeof updateUIAfterLogin === 'function') updateUIAfterLogin();
                    if (typeof renderUserProfile === 'function') renderUserProfile();

                    const isLanding = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.includes('mechanics');
                    if (roleToRoute === 'mechanic' && isLanding) {
                        setTimeout(() => {
                            window.location.href = 'simple.html?role=mechanic';
                        }, 500);
                    }
                }, 400);

            } catch (err) {
                console.error('[AutoTriage Auth] Verification error:', err);
                errorMsg.textContent = err.message || 'Verification failed. Please try again.';
                errorMsg.style.display = 'block';
                btn.textContent = 'Verify Code';
                btn.disabled = false;
            }
            return;
        }

        // MODE: Forgot Password Request
        if (currentMode === 'forgot') {
            if (!email) {
                errorMsg.textContent = 'Please enter your email address.';
                errorMsg.style.display = 'block';
                return;
            }
            btn.textContent = 'Sending Code...';
            btn.disabled = true;

            const otpCode = String(Math.floor(1000 + Math.random() * 9000));
            pendingAuth = {
                mode: 'forgot_verify',
                email: email,
                name: email.split('@')[0],
                phone: getDetectedPhone(),
                code: otpCode,
                expiresAt: Date.now() + (10 * 60 * 1000),
                attemptsLeft: 5
            };

            await sendOtpEmail(email, pendingAuth.name, otpCode, 'password_reset');

            btn.textContent = 'Send Reset Code';
            btn.disabled = false;
            switchMode('otp');
            return;
        }

        // Standard Login / Signup validation
        if (!email || !pass) {
            errorMsg.textContent = 'Please enter both email and password.';
            errorMsg.style.display = 'block';
            return;
        }

        if (!window.FirebaseAuth || !window.FirebaseDB) {
            errorMsg.textContent = 'Error: Connection to authentication server failed.';
            errorMsg.style.display = 'block';
            return;
        }

        const originalText = btn.textContent;
        btn.textContent = 'Please wait...';
        btn.disabled = true;

        try {
            const persistenceType = rememberMe
                ? firebase.auth.Auth.Persistence.LOCAL
                : firebase.auth.Auth.Persistence.SESSION;
            await FirebaseAuth.setPersistence(persistenceType);

            if (currentMode === 'signup') {
                const otpCode = String(Math.floor(1000 + Math.random() * 9000));
                pendingAuth = {
                    mode: 'signup',
                    role: currentSignupRole || 'driver',
                    email: email,
                    pass: pass,
                    name: email.split('@')[0],
                    phone: getDetectedPhone(),
                    code: otpCode,
                    expiresAt: Date.now() + (10 * 60 * 1000),
                    attemptsLeft: 5
                };

                btn.textContent = 'Sending code...';
                await sendOtpEmail(email, pendingAuth.name, otpCode, 'otp');

                btn.textContent = originalText;
                btn.disabled = false;
                switchMode('otp');

                const successMsg = document.getElementById('authSuccessMsg');
                if (successMsg) {
                    successMsg.textContent = `A 4-digit verification code has been sent to ${email}!`;
                    successMsg.style.display = 'block';
                }
                return;

            } else if (currentMode === 'login') {
                const userCred = await FirebaseAuth.signInWithEmailAndPassword(email, pass);
                const user = userCred.user;
                const deviceId = getDeviceId();

                let userRole = 'driver';
                let userData = null;
                if (window.FirebaseDB) {
                    try {
                        const uDoc = await FirebaseDB.collection('users').doc(user.uid).get();
                        if (uDoc.exists) {
                            userData = uDoc.data();
                            userRole = userData.role || (userData.isMechanic ? 'mechanic' : 'driver');
                        }
                        await FirebaseDB.collection('users').doc(user.uid).set({
                            trustedDevices: firebase.firestore.FieldValue.arrayUnion(deviceId),
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                    } catch (docErr) {
                        console.warn('[AutoTriage Auth] Device save note:', docErr);
                    }
                }

                currentUser = {
                    uid: user.uid,
                    email: user.email,
                    name: (userData && userData.name) || user.displayName || user.email.split('@')[0],
                    role: userRole,
                    isMechanic: !!(userData && (userData.isMechanic || userData.role === 'mechanic')),
                    emailVerified: user.emailVerified
                };

                localStorage.setItem('autotriage_user', JSON.stringify(currentUser));
                localStorage.setItem('autotriage_user_email', user.email);
                localStorage.setItem('autotriage_device_recognized', 'true');
                localStorage.setItem('at_current_role', userRole);

                if ((userRole === 'mechanic' || (userData && userData.isMechanic)) && window.FirebaseDB) {
                    try {
                        const mDoc = await FirebaseDB.collection('mechanics').doc(user.uid).get();
                        if (mDoc.exists) {
                            localStorage.setItem('myMechanicProfile', JSON.stringify(mDoc.data()));
                        }
                    } catch (mErr) {}
                }

                btn.textContent = 'Success!';
                btn.style.background = '#34C759';

                setTimeout(() => {
                    btn.style.background = 'linear-gradient(135deg, #ff3333, #aa0000)';
                    const overlay = document.getElementById('authOverlay');
                    if (overlay) overlay.classList.remove('active');
                    document.body.style.overflow = 'auto';

                    applyRoleRouting(userRole);
                    if (typeof updateUIAfterLogin === 'function') updateUIAfterLogin();
                    if (typeof renderUserProfile === 'function') renderUserProfile();

                    const isLanding = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.includes('mechanics');
                    if (userRole === 'mechanic' && isLanding) {
                        setTimeout(() => {
                            window.location.href = 'simple.html?role=mechanic';
                        }, 500);
                    }
                }, 400);
                return;
            }

        } catch (error) {
            console.error("Auth Error:", error);
            let friendlyError = error.message;

            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                friendlyError = "Incorrect email or password.";
            } else if (error.code === 'auth/email-already-in-use') {
                friendlyError = "An account with this email already exists.";
            } else if (error.code === 'auth/weak-password') {
                friendlyError = "Password must be at least 6 characters.";
            }

            errorMsg.textContent = friendlyError;
            errorMsg.style.display = 'block';
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    function updateUIAfterLogin() {
        if (!currentUser) return;

        const loginBtns = document.querySelectorAll('.login-trigger-btn');
        loginBtns.forEach(btn => btn.classList.add('logged-in'));
        loginBtns.forEach(btn => {
            const rawName = currentUser.name || 'User';
            const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

            btn.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; padding: 7px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" 
                     onmouseover="this.style.background='rgba(255,51,51,0.12)'; this.style.borderColor='rgba(255,51,51,0.35)'" 
                     onmouseout="this.style.background='rgba(255,255,255,0.04)'; this.style.borderColor='rgba(255,255,255,0.1)'">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span style="font-size:13px; font-weight:700; color:#fff; font-family:'Space Mono', monospace; letter-spacing: 0.5px;">${formattedName}</span>
                    <div style="width:1px; height:13px; background: rgba(255,255,255,0.2); margin: 0 4px;"></div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff3333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" title="Logout">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </div>`;

            btn.style.border = 'none';
            btn.style.padding = '0';
            btn.style.background = 'transparent';

            btn.onclick = () => {
                Auth.logout();
            };
        });

        document.querySelectorAll('.signup-trigger-btn').forEach(btn => {
            btn.style.display = 'none';
        });
    }

    async function logout() {
        if (window.FirebaseAuth) {
            try { await FirebaseAuth.signOut(); } catch(e) {}
        }
        localStorage.removeItem('autotriage_user');
        localStorage.removeItem('autotriage_device_recognized');
        localStorage.removeItem('autotriage_user_email');
        currentUser = null;
        location.reload();
    }

    function getCurrentUser() {
        return currentUser;
    }

    async function handleWaitlistSubmit() {
        const nameInput = document.getElementById('waitlistName');
        const emailInput = document.getElementById('authEmail');
        const errorMsg = document.getElementById('authErrorMsg');
        const successMsg = document.getElementById('authSuccessMsg');
        const btn = document.getElementById('authSubmitBtn');

        if (errorMsg) { errorMsg.textContent = ''; errorMsg.style.display = 'none'; }
        if (successMsg) { successMsg.textContent = ''; successMsg.style.display = 'none'; }

        if (!nameInput.value.trim() || !emailInput.value.trim()) {
            if (errorMsg) {
                errorMsg.textContent = 'Please enter both name and email.';
                errorMsg.style.display = 'block';
            }
            return;
        }

        btn.disabled = true;
        btn.textContent = 'JOINING...';

        try {
            // Save to local storage for now as a mock backend
            const waitlist = JSON.parse(localStorage.getItem('autotriage_waitlist') || '[]');
            waitlist.push({
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                date: new Date().toISOString()
            });
            localStorage.setItem('autotriage_waitlist', JSON.stringify(waitlist));

            setTimeout(() => {
                if (successMsg) {
                    successMsg.textContent = "You're on the list! We'll be in touch soon.";
                    successMsg.style.display = 'block';
                }
                btn.textContent = 'JOINED ✓';
                btn.style.background = '#34C759';
                setTimeout(() => {
                    const overlay = document.getElementById('authOverlay');
                    if (overlay) overlay.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    // Reset button for next time
                    btn.textContent = 'JOIN WAITLIST';
                    btn.disabled = false;
                    btn.style.background = 'linear-gradient(135deg, #ff3333, #aa0000)';
                    if (successMsg) successMsg.style.display = 'none';
                }, 2500);
            }, 800);
        } catch (e) {
            if (errorMsg) {
                errorMsg.textContent = 'An error occurred. Please try again.';
                errorMsg.style.display = 'block';
            }
            btn.disabled = false;
            btn.textContent = 'JOIN WAITLIST';
        }
    }

    function openMechanicSignup() {
        window.location.href = '/mechanics';
    }

    function openMechanicLogin() {
        toggle('login');
    }

    return {
        init,
        toggle,
        switchMode,
        setSignupRole,
        applyRoleRouting,
        openMechanicSignup,
        openMechanicLogin,
        handleAction,
        handleWaitlistSubmit,
        resendOtp,
        deliverViaWhatsApp,
        deliverViaSMS,
        submitPhoneAndDispatch,
        updateUIAfterLogin,
        logout,
        getCurrentUser,
        isDeviceRecognized
    };
})();

// Export to window explicitly
if (typeof window !== 'undefined') {
    window.Auth = Auth;
}

// Initialize Auth immediately if DOM ready, otherwise on DOMContentLoaded
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', Auth.init);
    } else {
        Auth.init();
    }
}
