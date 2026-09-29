/**
 * AUTOTRIAGE ADMINISTRATOR PORTAL - LOGIC ENGINE
 * Handles secure passcode access, data aggregations, and pro mechanic approvals.
 */

// 1. Passcode Guard Verification
function checkAdminPasscode() {
    const passInput = document.getElementById('adminPass');
    const errorDiv = document.getElementById('gatewayError');
    if (!passInput) return;

    const code = passInput.value.trim();
    if (code === 'admin123') {
        sessionStorage.setItem('at_admin_session', 'true');
        document.getElementById('adminGateway').classList.add('hidden');
        document.getElementById('dashboardContent').classList.remove('hidden');
        document.getElementById('dashboardContent').classList.add('flex');
        errorDiv.classList.add('hidden');
        loadDashboardData();
    } else {
        errorDiv.textContent = '❌ ACCESS DENIED: INVALID ADMINISTRATOR PASSCODE';
        errorDiv.classList.remove('hidden');
        passInput.value = '';
        passInput.focus();
    }
}

// 2. Initialize Gateway on load
window.addEventListener('DOMContentLoaded', () => {
    // Dynamically increment global visits count on admin page too
    let visits = parseInt(localStorage.getItem('at_global_visits') || '0');
    visits++;
    localStorage.setItem('at_global_visits', visits.toString());

    if (sessionStorage.getItem('at_admin_session') === 'true') {
        const gateway = document.getElementById('adminGateway');
        const dash = document.getElementById('dashboardContent');
        if (gateway) gateway.classList.add('hidden');
        if (dash) {
            dash.classList.remove('hidden');
            dash.classList.add('flex');
            loadDashboardData();
        }
    }
});

// 3. Load & Render Admin Dashboard Metrics
function loadDashboardData() {
    // Incremented counts
    const visits = localStorage.getItem('at_global_visits') || '142';
    const appLaunches = localStorage.getItem('at_app_launches') || '39';
    const pwaLaunches = localStorage.getItem('at_pwa_launches') || '67';

    // Parse Accounts & Registrants from Local Storage
    const accounts = JSON.parse(localStorage.getItem('at_user_accounts') || '[]');
    const mechanicsRegistry = JSON.parse(localStorage.getItem('at_mechanic_registry') || '[]');
    
    const driverAccountsCount = accounts.filter(u => u.role === 'driver').length;
    const mechanicsCount = mechanicsRegistry.length;

    // Render Stats
    document.getElementById('statVisits').textContent = Number(visits).toLocaleString();
    document.getElementById('statLaunches').textContent = `${appLaunches} / ${pwaLaunches}`;
    document.getElementById('statRegistrants').textContent = `${mechanicsRegistry.filter(m => m.verified).length} / ${mechanicsCount}`;

    // Render Mechanics Application Table
    renderMechanicApplications(mechanicsRegistry);

    // Sync Telemetry Logs HUD
    syncTelemetryLogs();
}

function syncTelemetryLogs() {
    if (typeof ATTelemetry === 'undefined') return;
    
    // 1. Render the live log lines into our dedicated console feed
    ATTelemetry.renderConsole('telemetryConsoleFeed');
    
    // 2. Fetch specific performance and error metrics
    const logs = JSON.parse(localStorage.getItem('at_telemetry_logs') || '[]');
    const perf = JSON.parse(localStorage.getItem('at_telemetry_perf') || '{"scans": [], "avg_duration": 0}');
    const errors = JSON.parse(localStorage.getItem('at_telemetry_errors') || '[]');
    
    // Update performance average duration
    const durationVal = document.getElementById('perfDurationVal');
    const durationBar = document.getElementById('perfDurationBar');
    if (durationVal && durationBar) {
        const ms = perf.avg_duration || 0;
        durationVal.textContent = ms > 0 ? `${ms} ms` : 'N/A';
        // Map 0-3000ms to 0-100% width
        const pct = Math.min(100, Math.round((ms / 3000) * 100));
        durationBar.style.width = `${pct}%`;
        durationBar.className = `h-full rounded-full transition-all duration-500 ${ms > 2000 ? 'bg-red-500' : ms > 1000 ? 'bg-yellow-500' : 'bg-blue-500'}`;
    }
    
    // Update Scan Auditing counter
    const totalScansText = document.getElementById('totalScansText');
    if (totalScansText) {
        const scanCount = logs.filter(l => l.event.includes('AI Diagnosis')).length;
        totalScansText.textContent = scanCount;
    }
    
    // Update Captured Errors count
    const capturedErrorsText = document.getElementById('capturedErrorsText');
    if (capturedErrorsText) {
        capturedErrorsText.textContent = errors.length;
    }

    // Rate Limit Security Health Score
    const limitHealthVal = document.getElementById('rateLimitHealthVal');
    const limitHealthBar = document.getElementById('rateLimitHealthBar');
    if (limitHealthVal && limitHealthBar) {
        const hasExceeded = logs.some(l => l.details && l.details.includes('Rate Limit Exceeded'));
        if (hasExceeded) {
            limitHealthVal.textContent = 'Attack Blocked';
            limitHealthVal.style.color = '#ffaa00';
            limitHealthBar.style.width = '75%';
            limitHealthBar.className = 'h-full bg-yellow-500 rounded-full transition-all duration-500';
        } else {
            limitHealthVal.textContent = '100% Secure';
            limitHealthVal.style.color = '#00d084';
            limitHealthBar.style.width = '100%';
            limitHealthBar.className = 'h-full bg-[#00d084] rounded-full transition-all duration-500';
        }
    }
}

function clearTelemetryLogs() {
    if (typeof ATTelemetry !== 'undefined') {
        ATTelemetry.clear();
        syncTelemetryLogs();
    }
}

function simulateTelemetryLog() {
    if (typeof ATTelemetry !== 'undefined') {
        const events = [
            'System Port Sync: Handshake',
            'GPS Telemetry Lock-on',
            'Database Sync Check',
            'Security Token Refresh',
            'Carrier Network Ping'
        ];
        const statusList = ['INFO', 'SUCCESS', 'WARNING'];
        const chosenEvent = events[Math.floor(Math.random() * events.length)];
        const chosenStatus = statusList[Math.floor(Math.random() * statusList.length)];
        
        ATTelemetry.log(chosenEvent, chosenStatus, 'Admin Simulated Trace');
        syncTelemetryLogs();
    }
}

// 4. Render Table of Pro Mechanics
function renderMechanicApplications(registry) {
    const tableBody = document.getElementById('mechanicsTableBody');
    const emptyMsg = document.getElementById('noMechanicsMessage');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    // If registry is empty, show empty state
    if (registry.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        return;
    }

    registry.forEach((m, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-white/5 hover:bg-white/[0.02] transition-colors';
        
        const statusBadge = m.verified 
            ? `<span class="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">APPROVED PRO</span>`
            : `<span class="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-lg uppercase tracking-wider animate-pulse">PENDING REVIEW</span>`;

        const actionButton = m.verified
            ? `<button onclick="toggleMechanicApproval('${m.email}', false)" class="px-3.5 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 hover:bg-red-500/20 text-[10px] font-bold tracking-wider transition-all uppercase">Revoke License</button>`
            : `<button onclick="toggleMechanicApproval('${m.email}', true)" class="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold tracking-wider transition-all uppercase">Verify Mechanic</button>`;

        tr.innerHTML = `
            <td class="py-4 px-4 flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg">${m.emoji || '🛠️'}</div>
                <div>
                    <div class="font-bold text-white">${m.name}</div>
                    <div class="text-[9.5px] text-[#8e93a0] uppercase tracking-wider mt-0.5">${m.spec}</div>
                </div>
            </td>
            <td class="py-4 px-4 align-middle text-[#8e93a0]">${m.area}</td>
            <td class="py-4 px-4 align-middle text-[#8e93a0]">
                <div>📞 ${m.phone}</div>
                <div class="text-[10px] opacity-70 mt-0.5">✉️ ${m.email}</div>
            </td>
            <td class="py-4 px-4 align-middle text-center">${statusBadge}</td>
            <td class="py-4 px-4 align-middle text-right">${actionButton}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// 5. Toggle Mechanic Verification License Status
function toggleMechanicApproval(email, targetState) {
    // 1. Update in the mechanic registry array
    const registry = JSON.parse(localStorage.getItem('at_mechanic_registry') || '[]');
    const match = registry.find(m => m.email.toLowerCase() === email.toLowerCase());
    if (match) {
        match.verified = targetState;
        if (targetState) {
            match.area = 'Verified Hub Station';
            match.emoji = '👨🏽‍🔧';
        } else {
            match.area = 'Pending Verification Area';
            match.emoji = '🛠️';
        }
        localStorage.setItem('at_mechanic_registry', JSON.stringify(registry));
    }

    // 2. Also update in the login user accounts array so their session works properly
    const accounts = JSON.parse(localStorage.getItem('at_user_accounts') || '[]');
    const userMatch = accounts.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (userMatch) {
        userMatch.verified = targetState;
        localStorage.setItem('at_user_accounts', JSON.stringify(accounts));
    }

    // 3. Update currently logged in session user if it's the approved mechanic
    const session = JSON.parse(localStorage.getItem('autotriage_user') || 'null');
    if (session && session.email.toLowerCase() === email.toLowerCase()) {
        session.verified = targetState;
        localStorage.setItem('autotriage_user', JSON.stringify(session));
    }

    // Reload lists and stats
    loadDashboardData();
    
    // Play alert feedback
    alert(targetState 
        ? `🟢 APPROVED: Pro Mechanic license granted for ${email}! Dashboard features are now fully unlocked.`
        : `🔴 REVOKED: Pro Mechanic license access terminated for ${email}.`
    );
}

// 6. Lock Administrator Portal
function logoutAdmin() {
    sessionStorage.removeItem('at_admin_session');
    location.reload();
}
