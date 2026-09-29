const ATTelemetry = (() => {
  const MAX_LOGS = 50;

  // Initialize data structures in LocalStorage
  function getLogs() {
    return JSON.parse(localStorage.getItem('at_telemetry_logs') || '[]');
  }

  function getPerformance() {
    return JSON.parse(localStorage.getItem('at_telemetry_perf') || '{"scans": [], "avg_duration": 0}');
  }

  // 1. Basic Logging
  function log(event, status = 'INFO', details = '') {
    const logs = getLogs();
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      status, // INFO, WARNING, ERROR, SUCCESS
      details
    };
    
    logs.unshift(entry);
    if (logs.length > MAX_LOGS) logs.pop();
    localStorage.setItem('at_telemetry_logs', JSON.stringify(logs));
    
    // Proactively sync UI console if open
    triggerUIUpdate();
  }

  // 2. Performance Metrics
  function measurePerformance(action, durationMs) {
    const perf = getPerformance();
    perf.scans.push({
      timestamp: new Date().toISOString(),
      duration: durationMs
    });
    
    // Keep last 30 measurements
    if (perf.scans.length > 30) perf.scans.shift();
    
    // Calculate new average duration
    const sum = perf.scans.reduce((acc, curr) => acc + curr.duration, 0);
    perf.avg_duration = Math.round(sum / perf.scans.length);
    
    localStorage.setItem('at_telemetry_perf', JSON.stringify(perf));
    
    log(`Performance Sync: ${action}`, 'SUCCESS', `Duration: ${durationMs}ms (Avg: ${perf.avg_duration}ms)`);
    triggerUIUpdate();
  }

  // 3. Error Tracking with Context
  function trackError(action, errorObject, contextData = {}) {
    const errorMessage = errorObject.message || String(errorObject);
    const errorStack = errorObject.stack || 'No stack trace available';
    
    log(`Error: ${action}`, 'ERROR', `Message: ${errorMessage} | Context: ${JSON.stringify(contextData)}`);
    
    // Maintain error cache
    const errors = JSON.parse(localStorage.getItem('at_telemetry_errors') || '[]');
    errors.unshift({
      timestamp: new Date().toISOString(),
      action,
      message: errorMessage,
      stack: errorStack,
      context: contextData
    });
    
    if (errors.length > 20) errors.pop();
    localStorage.setItem('at_telemetry_errors', JSON.stringify(errors));
    triggerUIUpdate();
  }

  // 4. UI Rendering Support Console
  function renderConsole(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const logs = getLogs();
    const perf = getPerformance();
    const errors = JSON.parse(localStorage.getItem('at_telemetry_errors') || '[]');

    const statusColors = {
      'INFO': '#4da6ff',
      'WARNING': '#ffaa00',
      'ERROR': '#ff3333',
      'SUCCESS': '#00d084'
    };

    let logLinesHTML = logs.map(l => {
      const time = new Date(l.timestamp).toLocaleTimeString();
      return `
        <div style="display:flex;gap:12px;font-family:'Space Mono',monospace;font-size:11px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03);">
          <span style="color:rgba(255,255,255,0.3)">[${time}]</span>
          <span style="color:${statusColors[l.status] || '#fff'};font-weight:bold;">${l.status}</span>
          <span style="color:#fff;flex:1;">${l.event}</span>
          <span style="color:rgba(255,255,255,0.4);font-size:10px;">${l.details ? l.details : ''}</span>
        </div>
      `;
    }).join('');

    if (logs.length === 0) {
      logLinesHTML = `<div style="text-align:center;color:rgba(255,255,255,0.2);padding:24px;font-family:'Space Mono',monospace;font-size:11px;">NO CONSOLE LOGS CAPTURED</div>`;
    }

    container.innerHTML = `
      <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:24px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.05);">
        <!-- HEADER HUD -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px;">
          <div style="background:rgba(0,208,132,0.05);border:1px solid rgba(0,208,132,0.15);border-radius:12px;padding:12px;text-align:center;">
            <div style="font-size:10px;color:#00d084;font-family:'Space Mono',monospace;font-weight:bold;letter-spacing:1px;">SYSTEM STATUS</div>
            <div style="font-family:'Bebas Neue',sans-serif;font-size:24px;color:#fff;margin-top:4px;letter-spacing:1px;">ONLINE</div>
          </div>
          <div style="background:rgba(77,166,255,0.05);border:1px solid rgba(77,166,255,0.15);border-radius:12px;padding:12px;text-align:center;">
            <div style="font-size:10px;color:#4da6ff;font-family:'Space Mono',monospace;font-weight:bold;letter-spacing:1px;">AI RESPONSE AVG</div>
            <div style="font-family:'Bebas Neue',sans-serif;font-size:24px;color:#fff;margin-top:4px;letter-spacing:1px;">${perf.avg_duration ? perf.avg_duration + ' ms' : 'N/A'}</div>
          </div>
          <div style="background:rgba(255,51,51,0.05);border:1px solid rgba(255,51,51,0.15);border-radius:12px;padding:12px;text-align:center;">
            <div style="font-size:10px;color:#ff3333;font-family:'Space Mono',monospace;font-weight:bold;letter-spacing:1px;">ERRORS DEPLOYED</div>
            <div style="font-family:'Bebas Neue',sans-serif;font-size:24px;color:#fff;margin-top:4px;letter-spacing:1px;">${errors.length}</div>
          </div>
        </div>

        <!-- LOG FEED -->
        <div style="display:flex;justify-between;align-items:center;margin-bottom:12px;">
          <div style="font-size:11px;font-family:'Space Mono',monospace;color:#ff8800;font-weight:bold;letter-spacing:1px;">🛡️ ENGINE RUNTIME TELEMETRY LOGS</div>
          <button onclick="ATTelemetry.clear()" style="background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:10px;font-family:'Space Mono',monospace;padding:4px 8px;border-radius:6px;cursor:pointer;margin-left:auto;transition:all 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.5)'">Clear logs</button>
        </div>
        
        <div class="custom-scroll" style="max-height:220px;overflow-y:auto;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.03);border-radius:12px;padding:16px;">
          ${logLinesHTML}
        </div>
      </div>
    `;
  }

  function clear() {
    localStorage.setItem('at_telemetry_logs', '[]');
    localStorage.setItem('at_telemetry_perf', '{"scans": [], "avg_duration": 0}');
    localStorage.setItem('at_telemetry_errors', '[]');
    log('Telemetry Reset Initiated', 'WARNING', 'Log buffers flushed');
  }

  function triggerUIUpdate() {
    // If the diagnostic metrics panel is loaded in viewport, redraw it
    if (document.getElementById('telemetryHUD')) {
      renderConsole('telemetryHUD');
    }
  }

  return {
    log,
    measurePerformance,
    trackError,
    renderConsole,
    clear
  };
})();
