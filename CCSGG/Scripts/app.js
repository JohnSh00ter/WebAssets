// --- LOG AUTOMATISIERUNG & PAUSE LOGIK ---
let isLogPaused = false;
const logBox = document.getElementById('logBox');
const btnPause = document.getElementById('btnPause');

function setPauseState(paused) {
    isLogPaused = paused;
    if (isLogPaused) {
        btnPause.classList.add('btn-active');
        btnPause.innerHTML = "▶ Fortsetzen";
    } else {
        btnPause.classList.remove('btn-active');
        btnPause.innerHTML = "⏸ Pause";
    }
}

function togglePause() {
    setPauseState(!isLogPaused);
    if (!isLogPaused) logBox.scrollTop = logBox.scrollHeight;
}

logBox.addEventListener('scroll', () => {
    const isAtBottom = (logBox.scrollHeight - logBox.scrollTop - logBox.clientHeight) < 25;
    if (!isAtBottom && !isLogPaused) {
        setPauseState(true);
    } else if (isAtBottom && isLogPaused) {
        setPauseState(false);
    }
});

function appendLog(msg) {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const div = document.createElement('div');
    div.className = 'log-entry';
    if (msg.includes('[CTRL-STATE]') || msg.includes('[CTRL-DRIVE]')) {
        div.classList.add('log-red');   // Rot für Steuerungs-Events & Fehler
    } else if (msg.includes('[CONFIG]') || msg.includes('[MQTT]')) {
        div.classList.add('log-config'); // Türkis für Konfigurationsänderungen
    }
    div.innerHTML = `<span class="log-ts">[${timeStr}]</span> ${msg}`;
    logBox.appendChild(div);
    if (!isLogPaused) {
        logBox.scrollTop = logBox.scrollHeight;
    }
}

function clearLog() {
    logBox.innerHTML = '';
}

// --- CHART PAUSE & AUTO-ZOOM PAUSE LOGIK ---
let isGraphPaused = false;
const btnGraphPause = document.getElementById('btnGraphPause');

function setGraphPauseState(paused) {
    isGraphPaused = paused;
    if (isGraphPaused) {
        btnGraphPause.classList.add('btn-active');
        btnGraphPause.innerHTML = "▶ Fortsetzen";
    } else {
        btnGraphPause.classList.remove('btn-active');
        btnGraphPause.innerHTML = "⏹ Stopp";
    }
}

function toggleGraphPause() {
    setGraphPauseState(!isGraphPaused);
    if (isGraphPaused) {
        appendLog("Graph manuell gestoppt.");
    } else {
        liveChart.resetZoom();
        appendLog("Graph fortgesetzt (Zoom zurückgesetzt).");
    }
}

function checkGraphZoomState(chart) {
    if (chart.isZoomedOrPanned()) {
        if (!isGraphPaused) {
            setGraphPauseState(true);
            appendLog("Auto-Pause: Graph gezoomt/verschoben.");
        }
    } else {
        if (isGraphPaused) {
            setGraphPauseState(false);
            appendLog("Auto-Fortsetzen: Graph im Normalzustand.");
        }
    }
}

const ctx = document.getElementById('liveChart').getContext('2d');
const maxDataPoints = 875;
Chart.defaults.font.family = "'JetBrains Mono', monospace";

let savedChartData = null;
try {
    savedChartData = JSON.parse(localStorage.getItem('ccs_chart_backup'));
    if (savedChartData?.labels && savedChartData.labels.length > maxDataPoints) {
    const excess = savedChartData.labels.length - maxDataPoints;
    savedChartData.labels = savedChartData.labels.slice(excess); // Die ältesten überschüssigen abschneiden
    savedChartData.datasets = savedChartData.datasets.map(ds => ds.slice(excess));
}
} catch(e) {}

function saveChartToLocalStorage() {
    try {
        const backup = {
            labels: liveChart.data.labels,
            datasets: liveChart.data.datasets.map(ds => ds.data)
        };
        localStorage.setItem('ccs_chart_backup', JSON.stringify(backup));
    } catch(e) {}
}        

const initialLabels = savedChartData?.labels || Array(maxDataPoints).fill('');
const initialDatasets = savedChartData?.datasets || [
    Array(maxDataPoints).fill(null),
    Array(maxDataPoints).fill(null),
    Array(maxDataPoints).fill(null),
    Array(maxDataPoints).fill(null),
    Array(maxDataPoints).fill(null),
    Array(maxDataPoints).fill(null),
    Array(maxDataPoints).fill(null),
    Array(maxDataPoints).fill(null),
    Array(maxDataPoints).fill(null),
    Array(maxDataPoints).fill(null)
];

const liveChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: initialLabels,
        datasets: [
            { label: 'Strom L (A)', yAxisID: 'yCurrent', borderColor: '#03dac6', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.2, data: initialDatasets[0] },
            { label: 'Strom R (A)', yAxisID: 'yCurrent', borderColor: '#ff0266', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.2, data: initialDatasets[1] },
            { label: 'PWM L',       yAxisID: 'yPWM',     borderColor: '#00b0ff', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.2, data: initialDatasets[2] },
            { label: 'PWM R',       yAxisID: 'yPWM',     borderColor: '#e040fb', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.2, data: initialDatasets[3] },
            { label: 'Limit L',     yAxisID: 'yCurrent', borderColor: '#03dac6', backgroundColor: 'transparent', borderWidth: 1, borderDash: [5, 5], pointRadius: 0, tension: 0.2, data: initialDatasets[4] },
            { label: 'Limit R',     yAxisID: 'yCurrent', borderColor: '#ff0266', backgroundColor: 'transparent', borderWidth: 1, borderDash: [5, 5], pointRadius: 0, tension: 0.2, data: initialDatasets[5] },
            { label: 'Plateau L',   yAxisID: 'yCurrent', borderColor: '#80cbc4', backgroundColor: 'transparent', borderWidth: 1, borderDash: [2, 2], pointRadius: 0, tension: 0.2, data: initialDatasets[6] },
            { label: 'Plateau R',   yAxisID: 'yCurrent', borderColor: '#f48fb1', backgroundColor: 'transparent', borderWidth: 1, borderDash: [2, 2], pointRadius: 0, tension: 0.2, data: initialDatasets[7] },
            { label: 'Max Plat L',  yAxisID: 'yCurrent', borderColor: '#00796b', backgroundColor: 'transparent', borderWidth: 1, borderDash: [10, 5], pointRadius: 0, tension: 0.2, data: initialDatasets[8] },
            { label: 'Max Plat R',  yAxisID: 'yCurrent', borderColor: '#c2185b', backgroundColor: 'transparent', borderWidth: 1, borderDash: [10, 5], pointRadius: 0, tension: 0.2, data: initialDatasets[9] }                    
        ]
    },
    options: {
        responsive: true, 
        maintainAspectRatio: false, 
        animation: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
            x: { 
                display: window.innerWidth > 1024,
                offset: true,
                ticks: { 
                    color: '#888', 
                    font: { family: 'JetBrains Mono', size: 10 }, 
                    maxTicksLimit: 10,
                    autoSkip: true 
                },
                grid: { color: '#222' }
            },
            yCurrent: { 
                type: 'linear', position: 'left', min: 0, max: 5.0,
                title: { display: true, text: 'Strom (A)', color: '#aaa', font: { family: 'JetBrains Mono' } },
                grid: { color: '#252525' }, ticks: { color: '#aaa', font: { family: 'JetBrains Mono' } }
            },
            yPWM: { 
                type: 'linear', position: 'right', min: 0, max: 260,
                title: { display: true, text: 'PWM', color: '#aaa', font: { family: 'JetBrains Mono' } },
                grid: { drawOnChartArea: false }, ticks: { color: '#aaa', font: { family: 'JetBrains Mono' } } 
            }
        },
        plugins: {
            tooltip: { 
                enabled: window.innerWidth > 1024 
            },                    
            legend: { display: window.innerWidth > 1024, labels: { color: '#fff', boxWidth: 12, font: { family: 'JetBrains Mono' } } },
            zoom: {
                pan: { 
                    enabled: window.innerWidth > 1024, 
                    mode: 'x',
                    onPanComplete: function({chart}) {
                        checkGraphZoomState(chart);
                    }
                },
                zoom: { 
                    wheel: { enabled: true }, 
                    pinch: { enabled: window.innerWidth > 1024 }, // false = kein Zoom auf dem Smartphone!
                    mode: 'x',
                    onZoomComplete: function({chart}) {
                        checkGraphZoomState(chart);
                    }
                }
            }
        }
    }
});

function setStableViewportHeight() { // Berechnet die initiale Höhe einmalig beim Aufruf
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    setPauseState(false); 
    logBox.scrollTop = logBox.scrollHeight;
}

setStableViewportHeight(); // Sofort beim ersten Rendern setzen
document.fonts.ready.then(function () {
    liveChart.update('none');
});

window.addEventListener('orientationchange', () => {
    setTimeout(setStableViewportHeight, 100);
});

window.addEventListener('resize', function() {
    const currentWidth = window.innerWidth;
    const shouldDisplay = currentWidth > 1024;
    if (liveChart.options.plugins.legend.display !== shouldDisplay || 
        liveChart.options.scales.x.display !== shouldDisplay || 
        liveChart.options.plugins.tooltip.enabled !== shouldDisplay) {
        liveChart.options.plugins.legend.display = shouldDisplay;
        liveChart.options.scales.x.display = shouldDisplay;
        liveChart.options.plugins.tooltip.enabled = shouldDisplay;
        liveChart.options.plugins.zoom.pan.enabled = shouldDisplay;
        liveChart.options.plugins.zoom.zoom.pinch = shouldDisplay;
    }
});

function resetGraphZoom() {
    liveChart.resetZoom();
    setGraphPauseState(false);
    appendLog("Zoom zurückgesetzt.");
}

function takeGraphScreenshot() {
    const targetCanvas = liveChart.canvas;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetCanvas.width;
    tempCanvas.height = targetCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = '#141414';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(targetCanvas, 0, 0);
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') + '-' + String(now.getMilliseconds()).padStart(3, '0');
    const link = document.createElement('a');
    link.download = `CCS_GG_Chart_${timeStr}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
    appendLog("Screenshot vom Graph erstellt.");
}

window.addEventListener('resize', () => {
    if (liveChart) liveChart.resize();
});

function clearGraph() {
    liveChart.data.labels = Array(maxDataPoints).fill('');
    liveChart.data.datasets.forEach(dataset => dataset.data = Array(maxDataPoints).fill(null));
    liveChart.update('none');
    localStorage.removeItem('ccs_chart_backup');
    appendLog("Graph wurde geleert.");
    resetGraphZoom();
}

// --- WEBSOCKET SEND LOGIK ---
function sendCmd(obj) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(obj));
    } else {
        appendLog("Fehler: Keine WebSocket Verbindung!");
    }
}

// Zentraler State für alle Konfigurationswerte im Frontend (mit neuen Standardwerten)
const configState = {
    pwmFreq: 20000,
    lampToggleDelay: 5,
    filterAlpha: 0.05,
    maxCurrentOpenL: 1.90,
    maxCurrentCloseL: 1.50,
    maxCurrentOpenR: 1.90,
    maxCurrentCloseR: 1.50,
    maxOpeningTime: 250,
    maxClosingTime: 250,
    cntMax: 3,
    maxPlatOpen: 2.00,
    maxPlatClose: 2.00,
    platSchmalz: 0.150,
    platSchmalz2: 0.080,
    platSchmalz2Max: 0.250,
    cnt0Max: 10,
    endpointNearCnt: 2,
    minDutyDef: 166,
    maxDuty: 255,
    minDutyFault: 190,
    maxDutyFault: 190,
    openDelay: 20,
    closeDelay: 100,
    slowDelay: 85,
    inrush: 0,
    faultTol: 30,
    maxDriveTime: 60000,
    recoveryDelay: 7500
};

// Universelle Funktion für alle Parameter-Änderungen mit exakten Grenzen und Schritten
function changeParam(paramName, delta) {
    if (!(paramName in configState)) return;
    let val = configState[paramName] + delta;
    // Parameter-spezifische Grenzen und Rundungen
    if (paramName === 'pwmFreq') {
        val = Math.max(10000, Math.min(30000, val));
    } else if (paramName === 'lampToggleDelay') {
        val = Math.max(1, Math.min(10, val));
    } else if (paramName === 'filterAlpha') {
        val = Math.max(0.01, Math.min(1.0, Number(val.toFixed(2))));
    } else if (paramName === 'maxCurrentOpenL' || paramName === 'maxCurrentCloseL' || paramName === 'maxCurrentOpenR' || paramName === 'maxCurrentCloseR' || paramName === 'maxPlatOpen' || paramName === 'maxPlatClose') {
        val = Math.max(0.50, Math.min(5.00, Number(val.toFixed(2))));
    } else if (paramName === 'platSchmalz') {
        val = Math.max(0.005, Math.min(0.500, Number(val.toFixed(3))));
    } else if (paramName === 'platSchmalz2' || paramName === 'platSchmalz2Max') {
        val = Math.max(0.005, Math.min(0.500, Number(val.toFixed(3))));
    } else if (paramName === 'cntMax' || paramName === 'cnt0Max' || paramName === 'endpointNearCnt') {
        val = Math.max(0, Math.min(50, val));
    } else if (paramName === 'minDutyDef' || paramName === 'maxDuty' || paramName === 'minDutyFault' || paramName === 'maxDutyFault') {
        val = Math.max(55, Math.min(255, val));
    } else if (paramName === 'openDelay') {
        val = Math.max(5, Math.min(50, val));
    } else if (paramName === 'closeDelay') {
        val = Math.max(50, Math.min(200, val));
    } else if (paramName === 'slowDelay') {
        val = Math.max(50, Math.min(150, val));
    } else if (paramName === 'inrush') {
        val = Math.max(0, Math.min(30, val));
    } else if (paramName === 'maxOpeningTime' || paramName === 'maxClosingTime') {
        val = Math.max(150, Math.min(500, val));
    } else if (paramName === 'faultTol') {
        val = Math.max(10, Math.min(60, val));
    } else if (paramName === 'maxDriveTime') {
        val = Math.max(30000, Math.min(90000, val));
    } else if (paramName === 'recoveryDelay') {
        val = Math.max(2000, Math.min(10000, val));
    } else {
        val = Math.max(0, val);
    }
    configState[paramName] = val;
    const el = document.getElementById('cfg-' + paramName);
    if (el) {
        el.innerText = formatValue(paramName, val);
    }
    sendCmd({ action: "setConfig", param: paramName, val: val });
}

function toggleControl() {
    sendCmd({ action: "toggle" });
}

// --- WEBSOCKET & RECONNECT LOGIK ---
let gateway = `ws://${window.location.hostname}:81`;
let websocket = null;
let reconnectTimer = null;
let countdownTimer = null;
let watchdogTimer = null;
let pingIntervalTimer = null;
let isReconnecting = false;

function updateStatusUI(connected, text) {
    const badge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');
    
    statusText.innerText = text;
    if (connected) {
        badge.classList.add('connected');
    } else {
        badge.classList.remove('connected');
    }
}

function resetWatchdog() {
    if (watchdogTimer) clearTimeout(watchdogTimer);
    watchdogTimer = setTimeout(() => {
        appendLog("Timeout: 5s keine Daten empfangen!");
        cleanupWebSocket();
        startReconnectSequence(false);
    }, 5000);
}

function cleanupWebSocket() {
    if (watchdogTimer) { clearTimeout(watchdogTimer); watchdogTimer = null; }
    if (pingIntervalTimer) { clearInterval(pingIntervalTimer); pingIntervalTimer = null; }
    if (websocket) {
        websocket.onopen = null;
        websocket.onclose = null;
        websocket.onerror = null;
        websocket.onmessage = null;
        try { websocket.close(); } catch(e) {}
        websocket = null;
    }
}

function startReconnectSequence(isLimitError = false) {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (countdownTimer) clearInterval(countdownTimer);
    isReconnecting = true;
    if (isLimitError) {
        updateStatusUI(false, "✗");
        appendLog("Verbindung abgelehnt: Client-Limit erreicht.");
        return;
    }
    let countdown = 20;
    updateStatusUI(false, `${countdown}s`);
    appendLog(`Getrennt. Versuche Reconnect in ${countdown}s...`);
    countdownTimer = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            updateStatusUI(false, `${countdown}s`);
        } else {
            clearInterval(countdownTimer);
        }
    }, 1000);
    reconnectTimer = setTimeout(() => {
        isReconnecting = false;
        initWebSocket();
    }, 20000);
}

function initWebSocket() {
    cleanupWebSocket();
    appendLog("Verbinde mit WebSocket...");
    updateStatusUI(false, "...");

    try {
        websocket = new WebSocket(gateway);
    } catch(e) {
        console.error("WS Init Error", e);
        startReconnectSequence(false);
        return;
    }
    websocket.onopen = () => { 
        updateStatusUI(true, "Live"); //"Verbunden"
        appendLog("WebSocket Verbindung hergestellt.");
        resetWatchdog();

        if (pingIntervalTimer) clearInterval(pingIntervalTimer);
        pingIntervalTimer = setInterval(() => {
            sendCmd({ action: "ping" });
        }, 1000);
    };
    websocket.onclose = (event) => { 
        const isLimit = (event.code === 1008 || event.code === 1013);
        cleanupWebSocket();
        startReconnectSequence(isLimit);
    };
    websocket.onerror = (error) => {
        console.error("WebSocket Fehler:", error);
        cleanupWebSocket();
        startReconnectSequence(false);
    };

    websocket.onmessage = (event) => {
        resetWatchdog();

        try {
            let data = JSON.parse(event.data);

            if (data.type === "ping" || data.type === "pong") return;

            if (data.type === "log") {
                if (typeof data.msg === "string") {
                    data.msg.split('$').forEach(item => appendLog(item.trim()));
                } else {
                    appendLog(data.msg);
                }
                return;
            }                    

            if (data.type === "sync") {
                // Gehe alle empfangenen Parameter im Sync-JSON durch
                for (const key in data) {
                    if (key === "type") continue;
                    if (key in configState) {
                        configState[key] = data[key];
                        const el = document.getElementById('cfg-' + key);
                        if (el) {
                            el.innerText = formatValue(key, data[key]);
                        }                                
                    }
                }
                return;
            }                    

            if (data.type === "configUpdate") {
                const param = data.param;
                const val = data.val;
                // Im lokalen State aktualisieren (ohne changeParam auszulösen, um Endlosschleifen zu verhindern)
                if (param in configState) {
                    configState[param] = val;
                    const el = document.getElementById('cfg-' + param);
                    if (el) {
                        el.innerText = formatValue(param, val);
                    }                            
                }
                return;
            }

            let cachedDoorState = { cstate: "", lstate: "" };

            if (data.type === "badges") {
                if (data.csl !== undefined) document.getElementById('v-cl').innerText = data.csl.toFixed(1).replace('.', ',') + ' A';
                if (data.csr !== undefined) document.getElementById('v-cr').innerText = data.csr.toFixed(1).replace('.', ',') + ' A';
                if (data.psl !== undefined) document.getElementById('v-pl').innerText = data.psl;
                if (data.psr !== undefined) document.getElementById('v-pr').innerText = data.psr;

                // 3. Temperatur- & User-Styling Helper
                const applyTempStyle = (elementId, val) => {
                    if (val === undefined) return; // Nichts tun, wenn das Feld fehlt
                    const el = document.getElementById(elementId);
                    if (!el) return;
                    el.innerText = val;
                    // 1. Fall: Sensor nicht angeschlossen / unbekannt
                    if (val === "Nicht bekannt" || val.includes("Nicht")) {
                        el.style.color = "#ff5252";    // Warnendes Rot
                    } else {
                        // 2. Fall: Gültige Temperatur auf Zahlenwert prüfen
                        const numericVal = parseFloat(val.replace(',', '.'));
                        if (!isNaN(numericVal)) {
                            if (numericVal < 5 || numericVal > 35) {
                                el.style.color = "#ff5252"; // Rot (Zu kalt oder zu heiß!)
                            } else {
                                el.style.color = "#69f0ae"; // Grün (Alles im grünen Bereich)
                            }
                        } else {
                            el.style.color = "";           // Fallback Standardfarbe
                        }
                    }
                };
                applyTempStyle('v-tInt', data.tInt);
                applyTempStyle('v-tExt', data.tExt);
                applyTempStyle('v-usr', data.usr);
                // 4. Fault-Pin Links (nur wenn im Paket vorhanden)
                if (data.fltL !== undefined) {
                    const elL = document.getElementById('v-fltL');
                    const isOkL = (data.fltL === 1);
                    elL.innerText = isOkL ? 'O.K.' : 'Fail';
                    elL.style.color = isOkL ? '#69f0ae' : '#ff5252'; 
                }
                // 5. Fault-Pin Rechts (nur wenn im Paket vorhanden)
                if (data.fltR !== undefined) {
                    const elR = document.getElementById('v-fltR');
                    const isOkR = (data.fltR === 1);
                    elR.innerText = isOkR ? 'O.K.' : 'Fail';
                    elR.style.color = isOkR ? '#69f0ae' : '#ff5252';
                }
                // 6. Door States (cstate / lstate) sicher cachen und rendern
                if (data.cstate !== undefined) cachedDoorState.cstate = data.cstate;
                if (data.lstate !== undefined) cachedDoorState.lstate = data.lstate;
                if (data.cstate !== undefined || data.lstate !== undefined) {
                    const stateEl = document.getElementById('v-state');
                    if (stateEl) {
                        let stateColor = "color: #e0e0e0; font-weight: bold;"; // Standard-Fallback
                        switch (cachedDoorState.cstate) {
                            case "Geschlossen":
                                stateColor = "color: #69f0ae; font-weight: bold;"; // Grün (Sicher)
                                break;
                            case "Geöffnet":
                                stateColor = "color: #03dac6; font-weight: bold;"; // Türkis (Offen)
                                break;
                            case "Wird geöffnet...":
                            case "Wird geschlossen...":
                            case "Öffne Verriegelung...":
                            case "Fehler-Recovery: Fahre zurück...":
                                stateColor = "color: #00b0ff; font-weight: bold;"; // Blau (In Bewegung)
                                break;
                            case "Gestoppt beim Öffnen":
                            case "Gestoppt beim Schließen":
                                stateColor = "color: #ff9800; font-weight: bold;"; // Orange (Gestoppt/Pausiert)
                                break;
                            case "Fehler beim Öffnen":
                            case "Fehler beim Schließen":
                                stateColor = "color: #ff5252; font-weight: bold;"; // Rot / Alarm (Fehler)
                                break;
                            case "Verriegelt":
                            case "Angehängt":
                                stateColor = "color: #e040fb; font-weight: bold;"; // Violett (Spezial)
                                break;
                            default:
                                stateColor = "color: #e0e0e0; font-weight: bold;"; // Weiß/Grau für Unbekanntes
                                break;
                        }
                        stateEl.innerHTML = `<span style="${stateColor}">${cachedDoorState.cstate}</span> <span style="font-size: 0.75rem; color: #888; font-weight: normal;">(letzter Status: ${cachedDoorState.lstate})</span>`;
                    }                            
                }
            }

            if (data.type === "plot") {
                // Paket hinten an die Warteschlange anhängen
                plotQueue.push(data); 
                lastPlotPacketTime = performance.now();
                // Wenn der Ticker noch nicht läuft UND wir genug Puffer haben -> Starten!
                if (!plotInterval && plotQueue.length >= START_BUFFER_SIZE) {
                    startPlotTicker();
                    console.log("Starte smooth Queue-Plotter!");
                }                        
                // Puffer mit den neuesten Daten füllen
                latestPlotData = data; 
                lastPlotPacketTime = performance.now();
                //console.log("ESP32 Plot empfangen:", latestPlotData); 
                if (data.cl !== undefined) document.getElementById('v-cl').innerText = data.cl.toFixed(1).replace('.', ',') + ' A';
                if (data.cr !== undefined) document.getElementById('v-cr').innerText = data.cr.toFixed(1).replace('.', ',') + ' A';
                if (data.pl !== undefined) document.getElementById('v-pl').innerText = data.pl;
                if (data.pr !== undefined) document.getElementById('v-pr').innerText = data.pr;                        
            }      

        } catch(e) { console.error("JSON Error", e); }
    };
}

let plotQueue = []; // Warteschlange statt Einzelwert
let lastPlotPacketTime = 0; 
const RENDER_INTERVAL_MS = 50;
let plotInterval = null;
const PLOT_TIMEOUT_MS = 4000; // 4s Timeout... Mögliche Drosselung auf Smartphones
const START_BUFFER_SIZE = 20; // Erst ab 20 Paketen (~1000ms) starten für absolute Glätte

function startPlotTicker() {
    if (plotInterval) clearInterval(plotInterval); 
    plotInterval = setInterval(() => {
        if (isGraphPaused) return;
        // Timeout-Check
        if (performance.now() - lastPlotPacketTime > PLOT_TIMEOUT_MS) {
            if (plotQueue.length === 0) { // Ohne diese Prüfung kackt der Stream ab! (Handy wohl zu langsam!)
                clearInterval(plotInterval);
                plotInterval = null;
                return;
            }
        }            
        // Wenn Queue leer ist (weil wir schneller getickt haben als Pakete kamen) -> kurz warten
        if (plotQueue.length === 0) return;
        // Nächstes Paket vorne aus der Warteschlange holen!
        const data = plotQueue.shift();
        const now = new Date();
        const ms = String(now.getMilliseconds()).padStart(3, '0').substring(0, 1);
        const timeLabel = now.toTimeString().split(' ')[0] + '.' + ms + 's';
        const ds = liveChart.data.datasets;
        liveChart.data.labels.push(timeLabel);
        const getVal = (val, datasetIndex) => {
            if (val !== undefined) return val;
            const d = ds[datasetIndex].data;
            return d.length > 0 ? d[d.length - 1] : 0;
        };
        ds[0].data.push(getVal(data.cl, 0));       
        ds[1].data.push(getVal(data.cr, 1));       
        ds[2].data.push(getVal(data.pl, 2));       
        ds[3].data.push(getVal(data.pr, 3));       
        ds[4].data.push(getVal(data.limL, 4));     
        ds[5].data.push(getVal(data.limR, 5));     
        ds[6].data.push(getVal(data.platL, 6));    
        ds[7].data.push(getVal(data.platR, 7));    
        ds[8].data.push(getVal(data.maxPlatL, 8)); 
        ds[9].data.push(getVal(data.maxPlatR, 9)); 
        if (liveChart.data.labels.length > maxDataPoints) {
            liveChart.data.labels.shift();
            for(let i = 0; i < ds.length; i++) ds[i].data.shift();
        }

        liveChart.update('none');
    }, RENDER_INTERVAL_MS);
}

// Zentrale Formatierungs-Funktion für absolut einheitliche UI-Darstellung
function formatValue(paramName, val) {
    if (typeof val === 'number') {
        if (paramName.includes('Schmalz')) {
            return val.toFixed(3).replace('.', ','); // Erzwingt immer 3 Stellen (z.B. 0,150)
        } else if (!Number.isInteger(val)) {
            return val.toFixed(2).replace('.', ','); // Erzwingt 2 Stellen für andere Kommazahlen (Alpha, Strom)
        }
    }
    return val; // Für reine Integers (Zähler, Delays etc.)
}

window.addEventListener('load', () => {
    initWebSocket();
    appendLog("CCS GG v0.1.5 gestartet.");
});

window.addEventListener('pagehide', () => {
    saveChartToLocalStorage();
    cleanupWebSocket(); // Hartes Trennen beim Verlassen/Refresh (verhindert Geister-Clients)
});

window.addEventListener('beforeunload', () => {
    saveChartToLocalStorage();
    cleanupWebSocket(); // Hartes Trennen beim Schließen des Tabs
});                

// --- PAGE VISIBILITY & LIFECYCLE API ---
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        // Tab nicht sichtbar / im Hintergrund: Sofort hart trennen und Timer stoppen
        cleanupWebSocket();
        console.log("[WS] Tab im Hintergrund - WebSocket sofort getrennt und Timer pausiert.");
        saveChartToLocalStorage();
    } else {
        console.log("[WS] Tab wieder aktiv. Baue WebSocket sofort frisch auf...");
        
        // Eventuelle alte Reconnect-Wartezeiten verwerfen
        if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
        if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
        isReconnecting = false;
        
        // Sofort ohne Verzögerung neu verbinden
        cleanupWebSocket();
        initWebSocket();
    }
});
