/**
 * FIFA 2026 ArenaOps Command Center - Controller Script
 * Manages UI state, SVG map interactivity, logging, metrics updates, and AI flow.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize AI Engine
  const aiEngine = new window.ArenaOpsAIEngine();
  
  // Dashboard State
  const state = {
    safetyIndex: 98,
    activeIncidentsCount: 0,
    occupancy: 78420,
    gateDelay: 12,
    foodDelay: 8,
    volunteers: {
      active: 150,
      idle: 12,
      stand: 60,
      gate: 25,
      crowd: 15
    },
    incidents: [],
    selectedIncidentId: null,
    selectedMapEntityId: null,
    currentPaLang: 'en',
    mapMode: 'normal', // 'normal', 'heatmap', 'evacuation'
    selectedAiResponse: null
  };

  // Pre-configured simulation scripts
  const SIMULATIONS = {
    rain: {
      text: "Alert: Heavy thunderstorm warning issued. Thunderstorms and lightning strike cells identified within 5 miles. Suspending exterior activations.",
      severity: "High",
      metrics: { safetyChange: -15, occupancy: 78420, gateDelay: 18, foodDelay: 25 },
      volunteers: { active: 150, idle: 0, stand: 45, gate: 15, crowd: 40 },
      pinTarget: "sector-east"
    },
    'gate-failure': {
      text: "System Outage: Local network switch failure at Gate C (East Entry). Automated barcode ticket scanners are currently offline. Backups active.",
      severity: "High",
      metrics: { safetyChange: -8, occupancy: 78420, gateDelay: 42, foodDelay: 8 },
      volunteers: { active: 150, idle: 2, stand: 50, gate: 35, crowd: 15 },
      pinTarget: "gate-c"
    },
    'vip-arrival': {
      text: "Logistics Event: Official VIP head-of-state motorcade approaching South Stand gate in 10 minutes. Implementing standard security lane locks.",
      severity: "Medium",
      metrics: { safetyChange: 2, occupancy: 78420, gateDelay: 15, foodDelay: 8 },
      volunteers: { active: 150, idle: 6, stand: 55, gate: 25, crowd: 20 },
      pinTarget: "transit-south-hub"
    },
    'medical-heat': {
      text: "Medical Emergency: Fan has collapsed in Section 112 (Lower East Stand) showing signs of severe dehydration or heat exhaustion. Dispatching responders.",
      severity: "High",
      metrics: { safetyChange: -5, occupancy: 78420, gateDelay: 12, foodDelay: 8 },
      volunteers: { active: 150, idle: 8, stand: 65, gate: 20, crowd: 15 },
      pinTarget: "sector-east"
    }
  };

  // DOM Elements cache
  const elements = {
    clock: document.getElementById('live-clock'),
    safetyIndex: document.getElementById('header-safety-index'),
    incidentsCount: document.getElementById('header-incidents-count'),
    valOccupancy: document.getElementById('val-occupancy'),
    valGateDelay: document.getElementById('val-gate-delay'),
    subGateDelay: document.getElementById('sub-gate-delay'),
    valFoodDelay: document.getElementById('val-food-delay'),
    volCounts: document.getElementById('vol-counts'),
    progressGateDelay: document.getElementById('progress-gate-delay'),
    volStand: document.querySelector('.volunteer-distribution .bg-emerald'),
    volGate: document.querySelector('.volunteer-distribution .bg-blue'),
    volCrowd: document.querySelector('.volunteer-distribution .bg-amber'),
    
    // Map view buttons
    btnModeNormal: document.getElementById('map-mode-normal'),
    btnModeHeatmap: document.getElementById('map-mode-heatmap'),
    btnModeEvac: document.getElementById('map-mode-evacuation'),
    activeZoneIndicator: document.getElementById('active-zone-indicator'),
    
    // Map layers
    heatmapLayer: document.getElementById('heatmap-layer'),
    evacRoutesLayer: document.getElementById('evacuation-routes'),
    stadiumSvg: document.getElementById('stadium-svg'),
    inspectorDefault: document.getElementById('inspector-default-msg'),
    inspectorPanel: document.getElementById('inspector-data-panel'),
    inspectorName: document.getElementById('inspector-entity-name'),
    inspectorOccupancy: document.getElementById('inspector-occupancy'),
    inspectorStatus: document.getElementById('inspector-status'),
    inspectorDelay: document.getElementById('inspector-delay'),
    btnInspectReport: document.getElementById('btn-inspect-report'),
    
    // Incident Log
    incidentsFeed: document.getElementById('active-incidents-feed'),
    btnClearLog: document.getElementById('btn-clear-log'),
    customSimText: document.getElementById('custom-sim-text'),
    btnCustomSimulate: document.getElementById('btn-custom-simulate'),
    
    // AI Console
    aiEngineStatus: document.getElementById('ai-engine-status'),
    aiSuggestionPanel: document.getElementById('ai-suggestion-panel'),
    aiResponseView: document.getElementById('ai-response-view'),
    aiSeverity: document.getElementById('ai-res-severity'),
    aiCategory: document.getElementById('ai-res-category'),
    aiSummary: document.getElementById('ai-res-summary'),
    aiActions: document.getElementById('ai-res-actions'),
    aiVolunteers: document.getElementById('ai-res-volunteers'),
    aiPaText: document.getElementById('ai-res-pa-text'),
    btnBroadcastPa: document.getElementById('btn-broadcast-pa'),
    btnDeployVolunteers: document.getElementById('btn-deploy-volunteers'),
    
    // Settings
    btnOpenSettings: document.getElementById('btn-open-settings'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    settingsModal: document.getElementById('settings-modal'),
    toggleLiveMode: document.getElementById('toggle-live-mode'),
    inputApiKey: document.getElementById('input-api-key'),
    inputSystemPrompt: document.getElementById('input-system-prompt'),
    btnResetPrompt: document.getElementById('btn-reset-prompt'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    groupApiKey: document.getElementById('group-api-key')
  };

  // Clock Update
  function updateClock() {
    const now = new Date();
    elements.clock.textContent = now.toTimeString().split(' ')[0];
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Load and apply AI configuration from LocalStorage
  function loadSettings() {
    let liveMode = false;
    let apiKey = '';
    let systemPrompt = aiEngine.systemPrompt;

    try {
      if (typeof localStorage !== 'undefined') {
        liveMode = localStorage.getItem('arenaops_live_mode') === 'true';
        apiKey = localStorage.getItem('arenaops_api_key') || '';
        systemPrompt = localStorage.getItem('arenaops_system_prompt') || aiEngine.systemPrompt;
      }
    } catch (e) {
      console.warn("localStorage is not accessible, using runtime memory:", e);
    }

    aiEngine.setLiveMode(liveMode, apiKey);
    aiEngine.setSystemPrompt(systemPrompt);

    elements.toggleLiveMode.checked = liveMode;
    elements.inputApiKey.value = apiKey;
    elements.inputSystemPrompt.value = systemPrompt;
    
    if (liveMode) {
      elements.groupApiKey.style.display = 'flex';
      elements.aiEngineStatus.textContent = "Gemini Cloud API";
      elements.aiEngineStatus.className = "engine-badge bg-purple";
    } else {
      elements.groupApiKey.style.display = 'none';
      elements.aiEngineStatus.textContent = "Local Engine";
      elements.aiEngineStatus.className = "engine-badge bg-blue";
    }
  }

  // Save AI Configuration
  function saveSettings() {
    const liveMode = elements.toggleLiveMode.checked;
    const apiKey = elements.inputApiKey.value.trim();
    const systemPrompt = elements.inputSystemPrompt.value.trim();

    if (liveMode && !apiKey) {
      alert("Please provide a Gemini API Key to enable Cloud Mode.");
      return;
    }

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('arenaops_live_mode', liveMode);
        localStorage.setItem('arenaops_api_key', apiKey);
        localStorage.setItem('arenaops_system_prompt', systemPrompt);
      }
    } catch (e) {
      console.warn("localStorage write failed, saving to memory only:", e);
    }

    aiEngine.setLiveMode(liveMode, apiKey);
    aiEngine.setSystemPrompt(systemPrompt);

    try {
      loadSettings();
    } catch (e) {
      console.error("Error reloading settings:", e);
    }
    
    elements.settingsModal.classList.add('hidden-layer');
    showNotification("AI Settings Updated Successfully!");
  }

  // Modal event listeners
  elements.btnOpenSettings.addEventListener('click', () => {
    elements.settingsModal.classList.remove('hidden-layer');
  });

  elements.btnCloseSettings.addEventListener('click', () => {
    elements.settingsModal.classList.add('hidden-layer');
  });

  elements.toggleLiveMode.addEventListener('change', (e) => {
    elements.groupApiKey.style.display = e.target.checked ? 'flex' : 'none';
  });

  elements.btnResetPrompt.addEventListener('click', () => {
    elements.inputSystemPrompt.value = aiEngine.systemPrompt = DEFAULT_SYSTEM_PROMPT;
  });

  elements.btnSaveSettings.addEventListener('click', saveSettings);

  // Update UI Elements with current metrics state
  function updateMetricsUI() {
    elements.safetyIndex.textContent = `${state.safetyIndex}%`;
    if (state.safetyIndex > 90) {
      elements.safetyIndex.className = "metric-value text-emerald";
    } else if (state.safetyIndex > 70) {
      elements.safetyIndex.className = "metric-value text-amber";
    } else {
      elements.safetyIndex.className = "metric-value text-red pulsing-text";
    }

    // Occupancy
    elements.valOccupancy.textContent = state.occupancy.toLocaleString();
    
    // Ingress / Queue delays
    elements.valGateDelay.textContent = `${state.gateDelay}m`;
    elements.progressGateDelay.style.width = `${Math.min(state.gateDelay * 2.2, 100)}%`;
    if (state.gateDelay > 30) {
      elements.valGateDelay.className = "mini-val text-red";
      elements.progressGateDelay.className = "progress-bar bg-red";
      elements.subGateDelay.textContent = "Critical Bottlenecks";
      elements.subGateDelay.className = "mini-sub text-red";
    } else if (state.gateDelay > 15) {
      elements.valGateDelay.className = "mini-val text-amber";
      elements.progressGateDelay.className = "progress-bar bg-amber";
      elements.subGateDelay.textContent = "High Gate Influx";
      elements.subGateDelay.className = "mini-sub text-amber";
    } else {
      elements.valGateDelay.className = "mini-val text-emerald";
      elements.progressGateDelay.className = "progress-bar bg-emerald";
      elements.subGateDelay.textContent = "Gate C Slowest";
      elements.subGateDelay.className = "mini-sub text-emerald";
    }

    elements.valFoodDelay.textContent = `${state.foodDelay}m`;

    // Active incidents count
    const activeCount = state.incidents.filter(i => i.status === 'active').length;
    state.activeIncidentsCount = activeCount;
    elements.incidentsCount.textContent = `${activeCount} Active`;
    if (activeCount > 0) {
      elements.incidentsCount.className = "metric-value text-red pulsing-text";
    } else {
      elements.incidentsCount.textContent = "None";
      elements.incidentsCount.className = "metric-value text-emerald";
    }

    // Volunteers
    elements.volCounts.textContent = `${state.volunteers.active} Active / ${state.volunteers.idle} idle`;
    elements.volStand.style.width = `${state.volunteers.stand}%`;
    elements.volStand.textContent = `${state.volunteers.stand}% Stand`;
    elements.volStand.title = `${state.volunteers.stand}% In-Stand Support`;
    
    elements.volGate.style.width = `${state.volunteers.gate}%`;
    elements.volGate.textContent = `${state.volunteers.gate}% Gate`;
    elements.volGate.title = `${state.volunteers.gate}% Gate Welcomers`;
    
    elements.volCrowd.style.width = `${state.volunteers.crowd}%`;
    elements.volCrowd.textContent = `${state.volunteers.crowd}% Crowd`;
    elements.volCrowd.title = `${state.volunteers.crowd}% Transit / Crowd Control`;
  }

  // Interactive Map Overlays Controlling
  function setMapMode(mode) {
    state.mapMode = mode;
    elements.btnModeNormal.classList.remove('active');
    elements.btnModeHeatmap.classList.remove('active');
    elements.btnModeEvac.classList.remove('active');

    elements.heatmapLayer.classList.add('hidden-layer');
    elements.evacRoutesLayer.classList.add('hidden-layer');

    if (mode === 'normal') {
      elements.btnModeNormal.classList.add('active');
    } else if (mode === 'heatmap') {
      elements.btnModeHeatmap.classList.add('active');
      elements.heatmapLayer.classList.remove('hidden-layer');
    } else if (mode === 'evacuation') {
      elements.btnModeEvac.classList.add('active');
      elements.evacRoutesLayer.classList.remove('hidden-layer');
    }
  }

  elements.btnModeNormal.addEventListener('click', () => setMapMode('normal'));
  elements.btnModeHeatmap.addEventListener('click', () => setMapMode('heatmap'));
  elements.btnModeEvac.addEventListener('click', () => setMapMode('evacuation'));

  // SVG Element Clicks Inspector Update
  function setupMapInteractivity() {
    const clickableSelectors = '.stadium-sector-block, .map-gate-node, .map-transit-node';
    const svgElements = elements.stadiumSvg.querySelectorAll(clickableSelectors);

    svgElements.forEach(elem => {
      elem.addEventListener('click', (e) => {
        // Deselect previous
        svgElements.forEach(s => s.classList.remove('selected'));
        
        // Select clicked
        elem.classList.add('selected');
        state.selectedMapEntityId = elem.id;

        // Parse dataset
        let name = elem.getAttribute('data-name') || elem.id.replace('-', ' ').replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()));
        let occupancy = elem.getAttribute('data-occupancy') || "94%";
        let delay = elem.getAttribute('data-delay') || "N/A";
        let status = "Normal";
        
        if (elem.classList.contains('gate-warning')) {
          status = "Congested";
          delay = "22 min";
        } else if (elem.classList.contains('gate-error') || elem.id === 'gate-c') {
          status = "Severe Delay";
          delay = "42 min";
        } else if (elem.classList.contains('gate-ok')) {
          status = "Efficient";
          delay = "8 min";
        }

        elements.activeZoneIndicator.textContent = `Focus: ${name}`;

        // Populate Inspector
        elements.inspectorDefault.classList.add('hidden-layer');
        elements.inspectorPanel.classList.remove('hidden-layer');

        elements.inspectorName.textContent = name;
        elements.inspectorOccupancy.textContent = occupancy;
        elements.inspectorStatus.textContent = status;
        
        if (status.includes("Severe") || status.includes("Congested")) {
          elements.inspectorStatus.className = "text-amber";
        } else if (status.includes("Efficient") || status.includes("Normal")) {
          elements.inspectorStatus.className = "text-emerald";
        }
        
        elements.inspectorDelay.textContent = delay;
      });
    });

    // Close Inspector click on background pitch/stadium body
    elements.stadiumSvg.addEventListener('click', (e) => {
      if (e.target.id === 'stadium-svg' || e.target.id === 'pitch-layer' || e.target.tagName === 'rect' && e.target.parentNode.id === 'pitch-layer') {
        svgElements.forEach(s => s.classList.remove('selected'));
        state.selectedMapEntityId = null;
        elements.activeZoneIndicator.textContent = `HQ View (Global)`;
        elements.inspectorDefault.classList.remove('hidden-layer');
        elements.inspectorPanel.classList.add('hidden-layer');
      }
    });

    // Inspector Generate Report click
    elements.btnInspectReport.addEventListener('click', () => {
      if (!state.selectedMapEntityId) return;
      const targetName = elements.inspectorName.textContent;
      const targetDelay = elements.inspectorDelay.textContent;
      const targetStatus = elements.inspectorStatus.textContent;

      let promptStr = `Report query: Inspect status of ${targetName}. Current indicators shows standard occupancy and operational level is [${targetStatus}] with delay [${targetDelay}]. Generate an optimization plan.`;
      
      elements.customSimText.value = promptStr;
      triggerCustomSimulation(promptStr);
    });
  }

  // Add Incident to Live Log Feed
  function logIncident(text, severity, id = null) {
    const incidentId = id || 'inc-' + Date.now();
    const timestamp = new Date().toLocaleTimeString();

    const incident = {
      id: incidentId,
      text: text,
      severity: severity,
      time: timestamp,
      status: 'active'
    };

    state.incidents.unshift(incident); // Add to beginning of array

    // Create DOM element
    const card = document.createElement('div');
    card.className = `incident-feed-card active-alert`;
    card.id = `card-${incidentId}`;
    card.dataset.id = incidentId;
    
    let sevClass = 'severity-medium';
    if (severity === 'Critical') sevClass = 'severity-critical';
    else if (severity === 'High') sevClass = 'severity-high';
    else if (severity === 'Low') sevClass = 'severity-low';

    card.innerHTML = `
      <div class="inc-card-header">
        <span class="inc-tag ${sevClass}">${severity}</span>
        <span class="inc-time">${timestamp}</span>
      </div>
      <p class="inc-body">${text}</p>
      <div class="inc-footer">
        <span>Source: Mobile Feed</span>
        <span class="inc-status-lbl text-red">Awaiting AI Dispatch</span>
      </div>
    `;

    // Click handler to select incident
    card.addEventListener('click', () => selectIncident(incidentId));

    elements.incidentsFeed.insertBefore(card, elements.incidentsFeed.firstChild);
    
    updateMetricsUI();
    return incidentId;
  }

  // Clear or Reset logs
  elements.btnClearLog.addEventListener('click', () => {
    elements.incidentsFeed.innerHTML = '';
    state.incidents = [];
    state.selectedIncidentId = null;
    state.safetyIndex = 98;
    state.gateDelay = 12;
    state.foodDelay = 8;
    state.volunteers = {
      active: 150,
      idle: 12,
      stand: 60,
      gate: 25,
      crowd: 15
    };
    
    // Hide incident markers on map
    hideMapIncidentPins();
    
    // Reset gate C style
    document.getElementById('gate-c').className.baseVal = "map-gate-node gate-ok";

    // Reset AI console
    elements.aiResponseView.classList.add('hidden-layer');
    
    // Empty state show
    const emptyState = elements.aiSuggestionPanel.querySelector('.ai-empty-state');
    if (emptyState) emptyState.classList.remove('hidden-layer');

    updateMetricsUI();
    showNotification("ArenaOps system reset to baseline status.");
  });

  // Hide all pins helper
  function hideMapIncidentPins() {
    document.getElementById('pin-gate-c').classList.add('hidden');
    document.getElementById('pin-gate-c-glow').classList.add('hidden');
    document.getElementById('pin-sector-east').classList.add('hidden');
    document.getElementById('pin-sector-east-glow').classList.add('hidden');
  }

  // Trigger glowing pins on map based on incident content
  function showMapIncidentPin(target) {
    hideMapIncidentPins();

    if (target === 'gate-c') {
      document.getElementById('pin-gate-c').classList.remove('hidden');
      document.getElementById('pin-gate-c-glow').classList.remove('hidden');
      document.getElementById('gate-c').className.baseVal = "map-gate-node gate-error";
    } else if (target === 'sector-east' || target === 'sector-north') {
      document.getElementById('pin-sector-east').classList.remove('hidden');
      document.getElementById('pin-sector-east-glow').classList.remove('hidden');
    }
  }

  // Select Incident and trigger AI Co-pilot
  async function selectIncident(incidentId) {
    // UI highlights
    const cards = elements.incidentsFeed.querySelectorAll('.incident-feed-card');
    cards.forEach(c => c.classList.remove('selected-alert'));
    
    const selectedCard = document.getElementById(`card-${incidentId}`);
    if (selectedCard) selectedCard.classList.add('selected-alert');

    state.selectedIncidentId = incidentId;
    const incident = state.incidents.find(i => i.id === incidentId);
    if (!incident) return;

    // Show loading indicator in AI console
    showAiLoading(true);

    try {
      const result = await aiEngine.analyzeIncident(incident.text);
      displayAiResult(result, incidentId);
    } catch (error) {
      showNotification("Error resolving AI dispatch logic.", "error");
      showAiLoading(false);
    }
  }

  // Show/Hide AI spinner
  function showAiLoading(isLoading) {
    let loader = elements.aiSuggestionPanel.querySelector('.copilot-loading-overlay');
    
    if (isLoading) {
      if (!loader) {
        loader = document.createElement('div');
        loader.className = 'copilot-loading-overlay';
        loader.innerHTML = `
          <div class="spinner"></div>
          <span class="loading-text">GenAI Parsing Operations Data...</span>
        `;
        elements.aiSuggestionPanel.appendChild(loader);
      }
      loader.classList.remove('hidden-layer');
    } else if (loader) {
      loader.classList.add('hidden-layer');
    }
  }

  // Display GenAI Output
  function displayAiResult(result, incidentId) {
    state.selectedAiResponse = result;
    showAiLoading(false);

    // Hide empty state
    const emptyState = elements.aiSuggestionPanel.querySelector('.ai-empty-state');
    if (emptyState) emptyState.classList.add('hidden-layer');

    // Show response container
    elements.aiResponseView.classList.remove('hidden-layer');

    // Set Category / Severity
    elements.aiCategory.textContent = result.category;
    elements.aiSeverity.textContent = result.severity;
    elements.aiSeverity.className = `severity-tag severity-${result.severity.toLowerCase()}`;

    // Summary
    elements.aiSummary.textContent = result.summary;

    // Action Plan checklist
    elements.aiActions.innerHTML = '';
    result.actionPlan.forEach((step, idx) => {
      const li = document.createElement('li');
      li.textContent = step;
      li.addEventListener('click', () => {
        li.classList.toggle('completed-step');
      });
      elements.aiActions.appendChild(li);
    });

    // Volunteer allocation note
    elements.aiVolunteers.textContent = result.volunteerAllocation;

    // PA Announcements default display (English)
    state.currentPaLang = 'en';
    renderPaAnnouncement();

    // Setup PA language tabs click listeners
    const tabBtns = elements.aiResponseView.querySelectorAll('.announcement-tabs .tab-btn');
    tabBtns.forEach(btn => {
      // Remove old listeners by cloning or direct mapping
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', () => {
        const lang = newBtn.getAttribute('data-lang');
        const siblingBtns = newBtn.parentNode.querySelectorAll('.tab-btn');
        siblingBtns.forEach(s => s.classList.remove('active'));
        newBtn.classList.add('active');
        state.currentPaLang = lang;
        renderPaAnnouncement();
      });
    });

    // Update status in incident log card
    const card = document.getElementById(`card-${incidentId}`);
    if (card) {
      const statusLabel = card.querySelector('.inc-status-lbl');
      if (statusLabel) {
        statusLabel.textContent = "AI Analysis Ready";
        statusLabel.className = "inc-status-lbl text-blue";
      }
    }
  }

  // Render language-specific PA Text
  function renderPaAnnouncement() {
    if (!state.selectedAiResponse || !state.selectedAiResponse.paAnnouncement) return;
    const paTexts = state.selectedAiResponse.paAnnouncement;
    elements.aiPaText.textContent = paTexts[state.currentPaLang] || paTexts['en'] || "No announcement text available.";
  }

  // Execute Dispatch Action: Broadcast PA
  elements.btnBroadcastPa.addEventListener('click', () => {
    if (!state.selectedAiResponse || !state.selectedAiResponse.paAnnouncement) return;
    const paText = state.selectedAiResponse.paAnnouncement[state.currentPaLang] || state.selectedAiResponse.paAnnouncement['en'];
    
    // Broadcast notification toast
    showBroadcastAlert(`📡 [PA BROADCAST - ${state.currentPaLang.toUpperCase()}]: "${paText}"`);

    // Add to history log as resolved item or update log card
    const currentCard = document.getElementById(`card-${state.selectedIncidentId}`);
    if (currentCard) {
      const statusLabel = currentCard.querySelector('.inc-status-lbl');
      if (statusLabel) {
        statusLabel.textContent = "Broadcast Active";
        statusLabel.className = "inc-status-lbl text-emerald pulsing-text";
      }
    }
  });

  // Execute Dispatch Action: Deploy Volunteers
  elements.btnDeployVolunteers.addEventListener('click', () => {
    if (!state.selectedAiResponse) return;
    
    showNotification("👥 Volunteer Dispatched. Stadium resources reassigned.");

    // Apply offset impacts to charts/metrics
    const offset = state.selectedAiResponse.metricsImpact;
    if (offset) {
      if (offset.safetyChange) state.safetyIndex = Math.min(Math.max(state.safetyIndex + offset.safetyChange, 10), 100);
      if (offset.queueTimeChange) state.gateDelay = Math.max(state.gateDelay + offset.queueTimeChange, 2);
    }

    // Apply volunteer distributions dynamically
    if (state.selectedAiResponse.category === "Weather") {
      state.volunteers = { active: 150, idle: 0, stand: 45, gate: 15, crowd: 40 };
    } else if (state.selectedAiResponse.category === "Infrastructure") {
      state.volunteers = { active: 150, idle: 2, stand: 50, gate: 35, crowd: 15 };
    } else if (state.selectedAiResponse.category === "Medical") {
      state.volunteers = { active: 150, idle: 4, stand: 68, gate: 18, crowd: 14 };
    } else {
      state.volunteers.idle = Math.max(state.volunteers.idle - 5, 0);
    }

    // Complete all actions checklist items automatically
    const listItems = elements.aiActions.querySelectorAll('li');
    listItems.forEach(li => li.classList.add('completed-step'));

    // Update log card status
    const currentCard = document.getElementById(`card-${state.selectedIncidentId}`);
    if (currentCard) {
      currentCard.className = "incident-feed-card resolved-alert";
      const statusLabel = currentCard.querySelector('.inc-status-lbl');
      if (statusLabel) {
        statusLabel.textContent = "Resolved & Dispatched";
        statusLabel.className = "inc-status-lbl text-emerald";
      }
    }

    // Shift map incident pin to resolved state
    hideMapIncidentPins();

    // Reset Gate status color back to normal
    if (state.selectedAiResponse.category === "Infrastructure") {
      document.getElementById('gate-c').className.baseVal = "map-gate-node gate-ok";
    }

    updateMetricsUI();
  });

  // Simulator Scenario Buttons
  const simBtns = document.querySelectorAll('.btn-simulate');
  simBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const scenarioKey = btn.getAttribute('data-scenario');
      const data = SIMULATIONS[scenarioKey];
      if (!data) return;

      // 1. Log incident
      const incId = logIncident(data.text, data.severity);
      
      // 2. Adjust metrics
      state.safetyIndex = Math.max(state.safetyIndex + data.metrics.safetyChange, 10);
      state.occupancy = data.metrics.occupancy;
      state.gateDelay = data.metrics.gateDelay;
      state.foodDelay = data.metrics.foodDelay;
      state.volunteers = { ...data.volunteers };

      updateMetricsUI();

      // 3. Highlight pin on map
      showMapIncidentPin(data.pinTarget);

      // 4. Select and run AI analysis
      selectIncident(incId);
      
      showNotification(`Simulated scenario [${scenarioKey}] triggered!`);
    });
  });

  // Trigger Custom Simulation
  function triggerCustomSimulation(text) {
    if (!text.trim()) return;

    let severity = "Medium";
    const lower = text.toLowerCase();
    if (lower.includes("critical") || lower.includes("smoke") || lower.includes("fire") || lower.includes("fight")) {
      severity = "Critical";
    } else if (lower.includes("hurt") || lower.includes("collapse") || lower.includes("storm") || lower.includes("lightning") || lower.includes("outage")) {
      severity = "High";
    }

    const incId = logIncident(text, severity);
    
    // Auto map selector logic for pins
    if (lower.includes("gate c") || lower.includes("scanner")) {
      showMapIncidentPin("gate-c");
    } else if (lower.includes("112") || lower.includes("east")) {
      showMapIncidentPin("sector-east");
    }

    selectIncident(incId);
    elements.customSimText.value = '';
  }

  elements.btnCustomSimulate.addEventListener('click', () => {
    triggerCustomSimulation(elements.customSimText.value);
  });

  elements.customSimText.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      triggerCustomSimulation(elements.customSimText.value);
    }
  });

  // Floating notifications helper
  function showNotification(msg, type = "info") {
    const toast = document.createElement('div');
    toast.className = `toast-notif ${type === 'error' ? 'toast-error' : 'toast-info'}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 50);

    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // Custom PA broadcast layout alert
  function showBroadcastAlert(msg) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `toast-broadcast`;
    alertDiv.innerHTML = `
      <div class="bc-indicator pulsing-text">🔊 TRANSMITTING PA SYSTEM ANNOUNCEMENT</div>
      <div class="bc-body">${msg}</div>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      alertDiv.classList.add('toast-show');
    }, 50);

    setTimeout(() => {
      alertDiv.classList.remove('toast-show');
      setTimeout(() => alertDiv.remove(), 400);
    }, 6000);
  }

  // CSS injection helper for Toast notifications
  function injectToastStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
      .toast-notif {
        position: fixed;
        bottom: 24px;
        left: 24px;
        background: rgba(8, 12, 20, 0.95);
        color: #fff;
        border: 1px solid var(--primary-blue);
        box-shadow: 0 4px 20px rgba(14, 165, 233, 0.25);
        padding: 0.8rem 1.2rem;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 500;
        z-index: 9999;
        transform: translateY(100px);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
      }
      .toast-error {
        border-color: var(--alert-red);
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.25);
      }
      .toast-show {
        transform: translateY(0);
        opacity: 1;
      }
      .toast-broadcast {
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translate(-50%, -100px);
        width: 500px;
        max-width: 90vw;
        background: rgba(15, 23, 42, 0.96);
        border: 2px solid #fb7185;
        box-shadow: 0 0 25px rgba(251, 113, 133, 0.4);
        border-radius: 10px;
        padding: 1rem;
        z-index: 10000;
        opacity: 0;
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s;
        color: #f8fafc;
      }
      .toast-broadcast.toast-show {
        transform: translate(-50%, 0);
        opacity: 1;
      }
      .bc-indicator {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 0.7rem;
        font-weight: 800;
        color: #fb7185;
        letter-spacing: 1.5px;
        margin-bottom: 0.4rem;
      }
      .bc-body {
        font-size: 0.8rem;
        line-height: 1.45;
        font-style: italic;
        color: #f1f5f9;
      }
    `;
    document.head.appendChild(style);
  }

  // Set initial seeds
  function seedInitialAlert() {
    // Initial mock warning
    logIncident("Facility Alert: Concession stand food prep warmers in Northeast Sector are drawing elevated current. No outage reported yet.", "Low");
  }

  // Bootstrapping operations
  injectToastStyles();
  loadSettings();
  setupMapInteractivity();
  updateMetricsUI();
  
  // Delay initial alert log slightly for visual load effect
  setTimeout(seedInitialAlert, 1500);
});
