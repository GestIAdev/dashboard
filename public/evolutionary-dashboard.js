// 🧬 SELENE SYNERGY ENGINE - EVOLUTIONARY DASHBOARD
// "Where evolution meets beauty through intelligent feedback"

class EvolutionaryDashboard {
  constructor() {
    this.socket = null;
    this.currentSuggestions = [];
    this.systemVitals = {};
    this.quotaStatus = {};
    this.safetyStatus = {};
    this.evolutionaryMetrics = {};
    this.optimizationMode = 'hybrid';

    this.init();
  }

  /**
   * Initialize dashboard
   */
  async init() {
    console.log('🧬 Initializing Evolutionary Dashboard...');

    try {
      // Setup Socket.IO connection
      this.connectSocket();

      // Setup UI event handlers
      this.setupEventHandlers();

      // Load initial data
      await this.loadInitialData();

      console.log('✅ Dashboard initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing dashboard:', error);
      this.showNotification('Error initializing dashboard', 'error');
    }
  }

  /**
   * Connect to Socket.IO server
   */
  connectSocket() {
    console.log('🔌 Connecting to Socket.IO server...');

    this.socket = io('http://localhost:3004');

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      this.updateConnectionStatus(true);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
      this.updateConnectionStatus(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      this.updateConnectionStatus(false);
    });

    // Data events
    this.socket.on('metrics_update', (data) => {
      console.log('📊 Metrics update received:', data);
      this.handleMetricsUpdate(data.data);
    });

    this.socket.on('optimization_mode_update', (data) => {
      console.log('🎛️ Mode update received:', data);
      this.handleModeUpdate(data.data);
    });

    // Evolution-specific events
    this.socket.on('evolution:suggestions', (data) => {
      console.log('🧬 Evolutionary suggestions received:', data);
      this.handleEvolutionSuggestions(data);
    });

    this.socket.on('evolution:quota', (data) => {
      console.log('🎯 Quota update received:', data);
      this.handleQuotaUpdate(data);
    });

    this.socket.on('evolution:safety', (data) => {
      console.log('🛡️ Safety update received:', data);
      this.handleSafetyUpdate(data);
    });

    this.socket.on('evolution:metrics', (data) => {
      console.log('📈 Evolution metrics received:', data);
      this.handleEvolutionMetrics(data);
    });

    // 🔀 THE SWITCH - Mode change listener
    this.socket.on('evolution:mode_change', (data) => {
      console.log('🔀 Mode change broadcast received:', data);
      this.updateModeUI(data.mode, data.config);
      this.showNotification(`🔀 Mode changed to ${data.mode.toUpperCase()}`, 'info');
    });
  }

  /**
   * Setup UI event handlers
   */
  setupEventHandlers() {
    // Metrics toggle
    const metricsToggle = document.getElementById('metrics-toggle');
    if (metricsToggle) {
      metricsToggle.addEventListener('click', () => {
        this.toggleMetricsSection();
      });
    }

    // 🔀 THE SWITCH - Mode button handlers
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.switchMode(mode);
      });
    });
  }

  /**
   * Load initial data from API
   */
  async loadInitialData() {
    try {
      console.log('📊 Loading initial data...');

      // Load system vitals
      const vitalsResponse = await fetch('/api/metrics');
      if (vitalsResponse.ok) {
        const vitalsData = await vitalsResponse.json();
        if (vitalsData.success) {
          this.handleMetricsUpdate({ metrics: vitalsData.data });
        }
      }

      // Load optimization mode
      const modeResponse = await fetch('/api/optimization/mode');
      if (modeResponse.ok) {
        const modeData = await modeResponse.json();
        if (modeData.success) {
          this.handleModeUpdate({ mode: modeData.data.mode });
        }
      }

      // Load pending suggestions
      const suggestionsResponse = await fetch('/api/evolution/suggestions');
      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json();
        if (suggestionsData.success && suggestionsData.data.length > 0) {
          this.handleEvolutionSuggestions(suggestionsData.data);
        }
      }

      // Load quota status
      const quotaResponse = await fetch('/api/evolution/quota');
      if (quotaResponse.ok) {
        const quotaData = await quotaResponse.json();
        if (quotaData.success) {
          this.handleQuotaUpdate(quotaData.data);
        }
      }

      // Load safety status
      const safetyResponse = await fetch('/api/evolution/safety');
      if (safetyResponse.ok) {
        const safetyData = await safetyResponse.json();
        if (safetyData.success) {
          this.handleSafetyUpdate(safetyData.data);
        }
      }

      // 🛡️ FASE 4.3: Load security deep dive status
      const securityResponse = await fetch('/api/evolution/security/status');
      if (securityResponse.ok) {
        const securityData = await securityResponse.json();
        if (securityData.success) {
          this.handleSecurityDeepDive(securityData.data);
        }
      }

      // Load evolutionary metrics
      const metricsResponse = await fetch('/api/evolution/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        if (metricsData.success) {
          this.handleEvolutionMetrics(metricsData.data);
        }
      }

      // 📊 FASE 4.4: Load metrics history
      const historyResponse = await fetch('/api/evolution/metrics/history?range=1h&limit=50');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        if (historyData.success) {
          this.handleMetricsHistory(historyData.data);
        }
      }

      console.log('✅ Initial data loaded');
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
    }
  }

  /**
   * Handle metrics update
   */
  handleMetricsUpdate(data) {
    this.systemVitals = data.metrics || data;
    this.updateVitalsDisplay();
  }

  /**
   * Handle mode update
   */
  handleModeUpdate(data) {
    this.optimizationMode = data.mode || data;
    this.updateModeDisplay();
  }

  /**
   * Handle evolutionary suggestions
   */
  handleEvolutionSuggestions(suggestions) {
    // Convert single suggestion to array, or use existing array
    if (Array.isArray(suggestions)) {
      this.currentSuggestions = suggestions;
    } else if (suggestions.suggestions) {
      // Batch format: {suggestions: [...]}
      this.currentSuggestions = suggestions.suggestions;
    } else if (suggestions.optimizationId || suggestions.id) {
      // Single suggestion object - ADD to existing array instead of replacing
      if (!this.currentSuggestions) this.currentSuggestions = [];
      
      console.log('🔍 Raw suggestion received:', suggestions);
      
      // Flatten evolutionaryType fields to root level for easier access
      if (suggestions.evolutionaryType) {
        const type = suggestions.evolutionaryType;
        suggestions.name = type.name || suggestions.name;
        suggestions.typeId = type.typeId || suggestions.typeId;
        suggestions.zodiacAffinity = type.zodiacAffinity || suggestions.zodiacAffinity;
        suggestions.fibonacciSignature = type.fibonacciSignature?.join('-') || suggestions.fibonacciSignature || 'φ';
        suggestions.musicalHarmony = type.musicalHarmony !== undefined ? type.musicalHarmony : suggestions.musicalHarmony;
        suggestions.musicalKey = type.musicalKey || suggestions.musicalKey;
        suggestions.creativityScore = type.expectedCreativity !== undefined ? type.expectedCreativity : suggestions.creativityScore;
      }
      
      console.log('✅ Flattened suggestion:', {
        name: suggestions.name,
        typeId: suggestions.typeId,
        creativity: suggestions.creativityScore,
        harmony: suggestions.musicalHarmony,
        novelty: suggestions.noveltyIndex
      });
      
      this.currentSuggestions.push(suggestions);
      // Keep only last 10 suggestions
      if (this.currentSuggestions.length > 10) {
        this.currentSuggestions = this.currentSuggestions.slice(-10);
      }
    } else {
      this.currentSuggestions = [];
    }
    
    console.log('📦 Processed suggestions:', this.currentSuggestions.length, 'total');
    this.renderSuggestions();
  }

  /**
   * Handle quota update
   */
  handleQuotaUpdate(data) {
    this.quotaStatus = data;
    this.updateQuotaDisplay();
  }

  /**
   * Handle safety update
   */
  handleSafetyUpdate(data) {
    this.safetyStatus = data;
    this.updateSafetyDisplay();
  }

  /**
   * Handle evolution metrics
   */
  handleEvolutionMetrics(data) {
    this.evolutionaryMetrics = data;
    this.updateMetricsDisplay();
  }

  /**
   * Render suggestions
   */
  renderSuggestions() {
    const container = document.getElementById('suggestions-container');
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    if (this.currentSuggestions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🌙</div>
          <div class="empty-title">Waiting for Evolution...</div>
          <div class="empty-description">
            Evolutionary suggestions will appear here when generated by the Synergy Engine
          </div>
        </div>
      `;
      return;
    }

    // Render each suggestion
    this.currentSuggestions.forEach((suggestion, index) => {
      const card = this.createSuggestionCard(suggestion, index);
      container.appendChild(card);
    });
  }

  /**
   * Create suggestion card HTML element
   */
  createSuggestionCard(suggestion, index) {
    const card = document.createElement('div');
    card.className = 'suggestion-card';
    card.dataset.suggestionId = suggestion.suggestionId || `suggestion-${index}`;

    // Determine risk level class from numeric riskLevel (0-1)
    const riskValue = suggestion.riskLevel || 0;
    let riskClass, riskLabel;
    if (riskValue < 0.3) {
      riskClass = 'low';
      riskLabel = 'LOW';
    } else if (riskValue < 0.6) {
      riskClass = 'medium';
      riskLabel = 'MEDIUM';
    } else {
      riskClass = 'high';
      riskLabel = 'HIGH';
    }
    
    // Format metrics
    const creativity = (suggestion.creativityScore || 0).toFixed(2);
    const novelty = (suggestion.noveltyIndex || 0).toFixed(2);
    const harmony = (suggestion.musicalHarmony || 0).toFixed(2);
    const riskPercent = (riskValue * 100).toFixed(1);

    card.innerHTML = `
      <div class="suggestion-header">
        <div>
          <div class="suggestion-title">${suggestion.name || 'Evolutionary Suggestion'}</div>
          <div class="suggestion-type">${suggestion.typeId || 'unknown-type'}</div>
        </div>
        <div class="risk-badge ${riskClass}">
          ${riskLabel} RISK (${riskPercent}%)
        </div>
      </div>

      <div class="suggestion-description">
        <div class="description-section">
          <div class="description-label">📜 POETIC DESCRIPTION</div>
          <div class="description-text poetic">
            ${suggestion.poeticDescription || 'A symphony of data, dancing in harmony...'}
          </div>
        </div>

        <div class="description-section">
          <div class="description-label">⚙️ TECHNICAL DESCRIPTION</div>
          <div class="description-text">
            ${suggestion.technicalDescription || 'Optimizes system performance through advanced algorithms.'}
          </div>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-label">⭐ Creativity</div>
          <div class="metric-value">${creativity}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">🚀 Novelty</div>
          <div class="metric-value">${novelty}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">🎵 Harmony</div>
          <div class="metric-value">${harmony}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">♓ Zodiac</div>
          <div class="metric-value">${suggestion.zodiacAffinity || 'N/A'}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">🔢 Fibonacci</div>
          <div class="metric-value">${suggestion.fibonacciSignature || 'φ'}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">⚡ Impact</div>
          <div class="metric-value">${suggestion.impact || 'MEDIUM'}</div>
        </div>
      </div>

      <div class="feedback-panel">
        <div class="feedback-title">💬 FEEDBACK PANEL</div>
        
        <div class="slider-container">
          <div class="slider-label">
            <span>Quality Rating:</span>
            <span id="quality-value-${index}">5</span>
          </div>
          <input 
            type="range" 
            class="quality-slider" 
            id="quality-slider-${index}"
            min="1" 
            max="10" 
            value="5"
            data-index="${index}"
          />
        </div>

        <textarea 
          class="feedback-textarea" 
          id="feedback-text-${index}"
          placeholder="Optional comments about this suggestion..."
        ></textarea>

        <div class="action-buttons">
          <button 
            class="btn btn-approve" 
            data-index="${index}"
            data-action="approve"
          >
            ✅ APPROVE
          </button>
          <button 
            class="btn btn-reject" 
            data-index="${index}"
            data-action="reject"
          >
            ❌ REJECT
          </button>
          <button 
            class="btn btn-defer" 
            data-index="${index}"
            data-action="defer"
          >
            ⏸️ DEFER
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    const slider = card.querySelector(`#quality-slider-${index}`);
    const valueDisplay = card.querySelector(`#quality-value-${index}`);
    
    if (slider && valueDisplay) {
      slider.addEventListener('input', (e) => {
        valueDisplay.textContent = e.target.value;
      });
    }

    // Add button event listeners
    const buttons = card.querySelectorAll('.btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const action = e.target.dataset.action;
        this.handleFeedbackAction(index, action);
      });
    });

    return card;
  }

  /**
   * Handle feedback action (approve/reject/defer)
   */
  async handleFeedbackAction(index, action) {
    const suggestion = this.currentSuggestions[index];
    if (!suggestion) {
      console.error('Suggestion not found at index:', index);
      return;
    }

    // Get feedback values
    const qualitySlider = document.getElementById(`quality-slider-${index}`);
    const feedbackText = document.getElementById(`feedback-text-${index}`);

    const quality = qualitySlider ? parseInt(qualitySlider.value) : 5;
    const comments = feedbackText ? feedbackText.value.trim() : '';

    // Create feedback entry
    const feedbackEntry = {
      suggestionId: suggestion.suggestionId || `suggestion-${index}`,
      decisionTypeId: suggestion.typeId,
      action: action, // 'approve', 'reject', or 'defer'
      humanRating: quality,
      comments: comments,
      timestamp: Date.now()
    };

    console.log('📤 Sending feedback:', feedbackEntry);

    try {
      // Send feedback via Socket.IO
      this.socket.emit('evolution:feedback', feedbackEntry);

      // Also send via HTTP for persistence
      const response = await fetch('/api/evolution/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackEntry)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.showNotification(`Feedback submitted: ${action.toUpperCase()}`, 'success');
          
          // Remove suggestion from list
          this.currentSuggestions.splice(index, 1);
          this.renderSuggestions();
        } else {
          throw new Error(result.error || 'Failed to submit feedback');
        }
      } else {
        throw new Error('HTTP request failed');
      }
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      this.showNotification('Error submitting feedback: ' + error.message, 'error');
    }
  }

  /**
   * Update connection status indicator
   */
  updateConnectionStatus(connected) {
    const indicator = document.getElementById('status-indicator');
    if (indicator) {
      if (connected) {
        indicator.className = 'status-indicator connected';
        indicator.textContent = '● CONNECTED';
      } else {
        indicator.className = 'status-indicator disconnected';
        indicator.textContent = '● DISCONNECTED';
      }
    }
  }

  /**
   * Update mode badge
   */
  updateModeDisplay() {
    const badge = document.getElementById('mode-badge');
    if (badge) {
      badge.className = `mode-badge ${this.optimizationMode}`;
      badge.textContent = `● ${this.optimizationMode.toUpperCase()} MODE`;
    }
  }

  /**
   * Update vitals display
   */
  updateVitalsDisplay() {
    // Consensus
    const consensus = Math.round((this.systemVitals.consensus_quality || 0) * 100);
    this.updateVitalElement('vital-consensus', `${consensus}%`);
    this.updateVitalBar('vital-consensus-bar', consensus);

    // Memory
    const memory = Math.round(this.systemVitals.memory_mb || 0);
    this.updateVitalElement('vital-memory', `${memory} MB`);
    this.updateVitalBar('vital-memory-bar', Math.min(memory, 100));

    // CPU
    const cpu = Math.round(this.systemVitals.cpu_percent || 0);
    this.updateVitalElement('vital-cpu', `${cpu}%`);
    this.updateVitalBar('vital-cpu-bar', cpu);

    // Nodes
    const onlineNodes = this.systemVitals.online_nodes || 0;
    const totalNodes = this.systemVitals.total_nodes || 0;
    this.updateVitalElement('vital-nodes', `${onlineNodes}/${totalNodes} ONLINE`);
  }

  /**
   * Update vital element
   */
  updateVitalElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  /**
   * Update vital bar
   */
  updateVitalBar(id, percentage) {
    const bar = document.getElementById(id);
    if (bar) {
      bar.style.width = `${Math.min(percentage, 100)}%`;
    }
  }

  /**
   * Update quota display
   */
  updateQuotaDisplay() {
    const used = this.quotaStatus.usedToday || 0;
    const limit = this.quotaStatus.quotaLimit || 5;
    const percentage = (used / limit) * 100;

    // Update text
    const usedElement = document.getElementById('quota-used');
    const limitElement = document.getElementById('quota-limit');
    if (usedElement) usedElement.textContent = used;
    if (limitElement) limitElement.textContent = limit;

    // Update bar
    const fill = document.getElementById('quota-fill');
    if (fill) {
      fill.style.width = `${percentage}%`;
    }
  }

  /**
   * Update safety display
   */
  updateSafetyDisplay() {
    this.updateSafetyElement('safety-containment', this.safetyStatus.containmentLevel || '--');
    this.updateSafetyElement('safety-sanity', this.safetyStatus.sanityScore || '--');
    this.updateSafetyElement('safety-quarantine', this.safetyStatus.quarantineCount || '0');
    this.updateSafetyElement('safety-rollback', this.safetyStatus.rollbackReady ? '✅' : '❌');
  }

  /**
   * Update safety element
   */
  updateSafetyElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  /**
   * 🛡️ FASE 4.3: Handle Security Deep Dive data
   */
  handleSecurityDeepDive(data) {
    console.log('🛡️🔒 Security Deep Dive data received:', data);
    
    // Update security score circle
    const scoreValue = document.getElementById('security-score-value');
    if (scoreValue) {
      scoreValue.textContent = data.securityScore ? data.securityScore.toFixed(2) : '--';
    }

    // Update alert badge
    const alertBadge = document.getElementById('alert-badge');
    const alertText = document.getElementById('alert-level-text');
    if (alertBadge && alertText) {
      // Remove old classes
      alertBadge.className = 'alert-badge';
      // Add new class based on alert level
      alertBadge.classList.add(data.alertLevel || 'safe');
      alertText.textContent = (data.alertLevel || 'safe').toUpperCase();
    }

    // Update sanity bar and percentage
    if (data.sanity) {
      const sanityFill = document.getElementById('sanity-fill');
      const sanityPercentage = document.getElementById('sanity-percentage');
      const sanityLevel = Math.round(data.sanity.sanityLevel * 100);
      
      if (sanityFill) {
        sanityFill.style.width = `${sanityLevel}%`;
      }
      if (sanityPercentage) {
        sanityPercentage.textContent = `${sanityLevel}%`;
      }

      // Update concerns
      const concernsContainer = document.getElementById('sanity-concerns');
      if (concernsContainer) {
        if (data.sanity.concerns && data.sanity.concerns.length > 0) {
          concernsContainer.innerHTML = data.sanity.concerns
            .map(concern => `<div class="concern-item">⚠️ ${concern}</div>`)
            .join('');
        } else {
          concernsContainer.innerHTML = '<div style="color: var(--cyber-green); font-size: 0.9em;">✅ No concerns detected</div>';
        }
      }
    }

    // Update rollback stats
    if (data.rollbackStats) {
      const rs = data.rollbackStats;
      this.updateElement('rollback-registered', rs.totalRegistered || 0);
      this.updateElement('rollback-executed', rs.totalExecuted || 0);
      this.updateElement('rollback-success', rs.successRate ? `${rs.successRate}%` : '100%');
      this.updateElement('rollback-recovery', rs.avgRecoveryTime ? `${rs.avgRecoveryTime}ms` : '0ms');
    }

    // Update containment levels
    if (data.containment) {
      const containmentContainer = document.getElementById('containment-levels');
      if (containmentContainer) {
        const levels = data.containment.containmentLevels || {};
        containmentContainer.innerHTML = Object.entries(levels)
          .map(([level, count]) => `
            <div class="containment-level-item">
              <span class="containment-label">${level.toUpperCase()}</span>
              <span class="containment-count">${count}</span>
            </div>
          `)
          .join('');
      }

      // Update quarantine count
      this.updateElement('quarantine-count', data.containment.quarantinedPatterns || 0);
    }

    // Update incidents list
    if (data.incidents) {
      const incidentsList = document.getElementById('incidents-list');
      if (incidentsList) {
        if (data.incidents.length === 0) {
          incidentsList.innerHTML = '<div class="no-incidents">✅ No incidents detected</div>';
        } else {
          incidentsList.innerHTML = data.incidents
            .map(incident => `
              <div class="incident-item">
                <div class="incident-time">${new Date(incident.timestamp).toLocaleString()}</div>
                <div class="incident-description">${incident.description}</div>
              </div>
            `)
            .join('');
        }
      }
    }
  }

  /**
   * 📊 FASE 4.4: Handle Metrics History data
   */
  handleMetricsHistory(data) {
    console.log('📊📈 Metrics History data received:', data);
    
    // Store timeline data for chart rendering
    this.metricsTimeline = data.timeline || [];
    this.metricsAggregates = data.aggregates || {};
    this.zodiacDistribution = data.zodiacDistribution || {};
    this.metricsTrends = data.trends || {};

    // Render all evolutionary charts
    this.renderEvolutionaryCharts();
    
    console.log('📈 Aggregates:', this.metricsAggregates);
    console.log('⭐ Zodiac Distribution:', this.zodiacDistribution);
    console.log('📊 Trends:', this.metricsTrends);
  }

  /**
   * 📊 FASE 4.4: Render Evolutionary Charts
   */
  renderEvolutionaryCharts() {
    // Destroy existing charts if any
    if (this.charts) {
      Object.values(this.charts).forEach(chart => chart.destroy());
    }
    this.charts = {};

    // 1. Creativity & Novelty Timeline Chart
    this.renderCreativityNoveltyChart();

    // 2. Harmony & Risk Balance Chart
    this.renderHarmonyRiskChart();

    // 3. Zodiac Distribution Chart
    this.renderZodiacChart();

    // 4. Fibonacci Pattern Evolution Chart
    this.renderFibonacciChart();

    console.log('✅ All evolutionary charts rendered');
  }

  /**
   * 🎨 Creativity & Novelty Timeline Chart
   */
  renderCreativityNoveltyChart() {
    const ctx = document.getElementById('creativity-chart');
    if (!ctx || this.metricsTimeline.length === 0) return;

    const labels = this.metricsTimeline.map(entry => 
      new Date(entry.timestamp).toLocaleTimeString()
    );
    const creativityData = this.metricsTimeline.map(entry => entry.creativity || 0);
    const noveltyData = this.metricsTimeline.map(entry => entry.novelty || 0);

    this.charts.creativity = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '🎨 Creativity',
            data: creativityData,
            borderColor: '#00ff88',
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          },
          {
            label: '✨ Novelty',
            data: noveltyData,
            borderColor: '#9d4edd',
            backgroundColor: 'rgba(157, 78, 221, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: this.getChartOptions('Creativity & Novelty')
    });
  }

  /**
   * 🎵 Harmony & Risk Balance Chart
   */
  renderHarmonyRiskChart() {
    const ctx = document.getElementById('harmony-risk-chart');
    if (!ctx || this.metricsTimeline.length === 0) return;

    const labels = this.metricsTimeline.map(entry => 
      new Date(entry.timestamp).toLocaleTimeString()
    );
    const harmonyData = this.metricsTimeline.map(entry => entry.harmony || 0);
    const riskData = this.metricsTimeline.map(entry => entry.riskLevel || 0);

    this.charts.harmony = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '🎵 Musical Harmony',
            data: harmonyData,
            borderColor: '#00aaff',
            backgroundColor: 'rgba(0, 170, 255, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          },
          {
            label: '⚠️ Risk Level',
            data: riskData,
            borderColor: '#ff0066',
            backgroundColor: 'rgba(255, 0, 102, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: this.getChartOptions('Harmony vs Risk')
    });
  }

  /**
   * ⭐ Zodiac Distribution Chart
   */
  renderZodiacChart() {
    const ctx = document.getElementById('zodiac-chart');
    if (!ctx || Object.keys(this.zodiacDistribution).length === 0) return;

    const zodiacSigns = Object.keys(this.zodiacDistribution);
    const zodiacCounts = Object.values(this.zodiacDistribution);

    // Cyberpunk color palette for zodiac signs
    const zodiacColors = [
      '#00ff88', '#00aaff', '#9d4edd', '#ffd700', 
      '#ff0088', '#00ffff', '#ff6600', '#00ff00',
      '#ff00ff', '#ffaa00', '#00aaaa', '#aa00ff'
    ];

    this.charts.zodiac = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: zodiacSigns,
        datasets: [{
          data: zodiacCounts,
          backgroundColor: zodiacColors.slice(0, zodiacSigns.length),
          borderColor: '#0a0a0a',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#ffffff',
              font: { size: 12 }
            }
          },
          title: {
            display: false
          }
        }
      }
    });
  }

  /**
   * 🌀 Fibonacci Pattern Evolution Chart
   */
  renderFibonacciChart() {
    const ctx = document.getElementById('fibonacci-chart');
    if (!ctx || this.metricsTimeline.length === 0) return;

    // Extract fibonacci data from timeline
    const labels = this.metricsTimeline.map(entry => 
      new Date(entry.timestamp).toLocaleTimeString()
    );
    
    // Calculate fibonacci convergence ratio (approximation)
    const fibonacciData = this.metricsTimeline.map(entry => {
      // Use creativity as proxy for fibonacci pattern strength
      return (entry.creativity || 0) * (entry.harmony || 0);
    });

    this.charts.fibonacci = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '🌀 Fibonacci Pattern Strength',
          data: fibonacciData,
          backgroundColor: 'rgba(255, 215, 0, 0.3)',
          borderColor: '#ffd700',
          borderWidth: 2
        }]
      },
      options: this.getChartOptions('Fibonacci Patterns')
    });
  }

  /**
   * Get default chart options with cyberpunk theme
   */
  getChartOptions(title) {
    return {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#ffffff',
            font: { size: 12 }
          }
        },
        title: {
          display: false
        }
      },
      scales: {
        x: {
          ticks: { 
            color: '#ffffff', 
            maxRotation: 45,
            minRotation: 45,
            font: { size: 10 }
          },
          grid: { 
            color: 'rgba(255, 255, 255, 0.1)' 
          }
        },
        y: {
          ticks: { 
            color: '#ffffff',
            font: { size: 10 }
          },
          grid: { 
            color: 'rgba(255, 255, 255, 0.1)' 
          },
          beginAtZero: true,
          max: 1
        }
      }
    };
  }

  /**
   * Helper: Update element text content
   */
  updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  /**
   * Update evolutionary metrics display
   */
  updateMetricsDisplay() {
    this.updateMetricStat('stat-patterns', this.evolutionaryMetrics.patternsGenerated || '--');
    this.updateMetricStat('stat-harmony', this.evolutionaryMetrics.avgHarmony || '--');
    this.updateMetricStat('stat-novelty', this.evolutionaryMetrics.avgNovelty || '--');
    this.updateMetricStat('stat-security', this.evolutionaryMetrics.safePercentage || '--');
    this.updateMetricStat('stat-feedback', this.evolutionaryMetrics.approvalRate || '--');
  }

  /**
   * Update metric stat
   */
  updateMetricStat(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  /**
   * Toggle metrics section
   */
  toggleMetricsSection() {
    const content = document.getElementById('metrics-content');
    const icon = document.getElementById('metrics-toggle-icon');
    
    if (content && icon) {
      content.classList.toggle('expanded');
      icon.textContent = content.classList.contains('expanded') ? '▲' : '▼';
    }
  }

  /**
   * 🔀 THE SWITCH - Switch evolutionary mode
   */
  async switchMode(mode) {
    console.log(`🔀 Switching to ${mode.toUpperCase()} mode...`);

    try {
      // Send mode change to backend
      const response = await fetch('/api/evolution/mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.updateModeUI(mode, data.config);
          this.showNotification(`✅ Switched to ${mode.toUpperCase()} mode!`, 'success');
        } else {
          this.showNotification(`❌ Failed to switch mode: ${data.error}`, 'error');
        }
      } else {
        this.showNotification('❌ Failed to switch mode', 'error');
      }
    } catch (error) {
      console.error('❌ Error switching mode:', error);
      this.showNotification('❌ Error switching mode', 'error');
    }
  }

  /**
   * 🔀 Update Mode UI
   */
  updateModeUI(mode, config) {
    // Update active button
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(`btn-${mode}`)?.classList.add('active');

    // Update mode info
    document.getElementById('current-mode').textContent = mode.toUpperCase();
    document.getElementById('current-entropy').textContent = `${config?.entropyFactor || 0}%`;
    document.getElementById('current-risk').textContent = config?.riskThreshold || 0;
    document.getElementById('current-punk').textContent = `${config?.punkProbability || 0}%`;

    // Update header badge
    const badge = document.getElementById('mode-badge');
    if (badge) {
      badge.textContent = `● ${mode.toUpperCase()} MODE`;
      badge.className = `mode-badge ${mode}`;
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'success' ? 'var(--cyber-green)' : 'var(--risk-high)'};
      color: ${type === 'success' ? '#000' : '#fff'};
      border-radius: 10px;
      font-weight: bold;
      z-index: 2000;
      box-shadow: 0 0 20px currentColor;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.evolutionaryDashboard = new EvolutionaryDashboard();
});
