// 🎸 SELENE DASHBOARD - PUNK REVOLUTION
// "La interfaz que observa sin controlar"

class SeleneDashboard {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;

    this.metrics = {};
    this.nodes = [];
    this.optimizationMode = 'hybrid';

    // Nuevas propiedades para PM2 y gráficos
    this.pm2Data = {};
    this.charts = {};
    this.chartsInitialized = false; // Control de inicialización única
    this.particleSystem = null;
    this.lastParticleUpdate = 0; // Control de frecuencia de actualización de partículas
    this.historicalData = {
      consensus: [],
      memory: [],
      cpu: [],
      pm2Memory: [],
      consensusHistory: [],
      memoryHistory: []
    };

    // Nueva propiedad para FORJA 9.0 Intention Panel
    this.currentIntention = {
      profile: null,
      modifiers: {
        templateBias: '',
        elementPreference: '',
        numerologyWeight: 0
      }
    };

    // Nueva propiedad para datos MIDI
    this.midiData = [];

    // Nueva propiedad para datos de poesías
    this.poemsData = [];

    // Flag para prevenir generación duplicada
    this.isGenerating = false;

    // Nueva propiedad para control de Tone.js
    this.toneInitialized = false;
    this.synth = null;

    this.init();
  }

  /**
   * Inicializar panel de intención FORJA 9.0
   */
  initializeIntentionPanel() {
    console.log('🎯 Inicializando panel de intención FORJA 9.0');

    // Los event listeners ya están configurados en el HTML con onclick
    // No necesitamos agregar listeners adicionales para evitar conflictos

    // Verificar que el botón existe después de renderizar
    setTimeout(() => {
      const generateBtn = document.getElementById('generate-with-intention');
      if (generateBtn) {
      } else {
      }
    }, 100);

    // Conectar controles de modificadores (solo para actualizar display)
    const modifierControls = document.querySelectorAll('.modifier-control');
    modifierControls.forEach(control => {
      control.addEventListener('change', (e) => {
        this.updateIntentionModifiers();
      });
      control.addEventListener('input', (e) => {
        this.updateIntentionModifiers();
      });
    });

    console.log('✅ Panel de intención inicializado');
  }

  /**
   * Seleccionar perfil de intención
   */
  selectIntentionProfile(profile) {
    // Configuraciones predefinidas para cada perfil
    const profileConfigs = {
      experimental: {
        templateBias: 'chaotic',
        elementPreference: 'fire',
        numerologyWeight: 0.3
      },
      legendary: {
        templateBias: 'epic',
        elementPreference: 'air',  // Corregido: 'spirit' no es válido, usar 'air' para trascendencia
        numerologyWeight: 0.8
      }
    };

    // Aplicar configuración predefinida del perfil
    const config = profileConfigs[profile] || {
      templateBias: 'chaotic',
      elementPreference: 'fire',
      numerologyWeight: 0.0
    };

    // Actualizar estado de intención
    this.currentIntention.profile = profile;
    this.currentIntention.modifiers = {
      templateBias: config.templateBias,
      elementPreference: config.elementPreference,
      numerologyWeight: config.numerologyWeight
    };

    // Actualizar los controles de la UI con los valores predefinidos
    const templateBiasEl = document.getElementById('template-bias');
    const elementPreferenceEl = document.getElementById('element-preference');
    const numerologyWeightEl = document.getElementById('numerology-weight');

    if (templateBiasEl) templateBiasEl.value = config.templateBias;
    if (elementPreferenceEl) elementPreferenceEl.value = config.elementPreference;
    if (numerologyWeightEl) numerologyWeightEl.value = config.numerologyWeight;

    // Actualizar display
    this.updateCurrentIntentionDisplay();

    this.showNotification(`🎯 Perfil ${profile} seleccionado con configuración predefinida`);
  }

  async init() {
    console.log('🎸 Selene Dashboard inicializando...');

    try {
      console.log('📊 Cargando datos iniciales...');
      // Cargar datos iniciales
      await this.loadInitialData();

      console.log('🔌 Configurando WebSocket...');
      // Configurar WebSocket
      this.connectWebSocket();

      console.log('🎛️ Configurando controles...');
      // Configurar controles
      this.setupControlEventHandlers();

      console.log('📈 Inicializando gráficos...');
      // Inicializar gráficos históricos
      this.initializeCharts();

      console.log('✨ Inicializando sistema de partículas...');
      // Inicializar sistema de partículas
      this.initializeParticleSystem();

      console.log('🔄 Configurando actualización periódica de datos históricos...');
      // Configurar actualización periódica de datos históricos
      this.startHistoricalDataUpdates();

      console.log('✅ Dashboard inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando dashboard:', error);
      this.showError('Error inicializando dashboard: ' + error.message);
    }
  }

  // ============================================
  // 🔌 SOCKET.IO CONNECTION
  // ============================================

  connectWebSocket() {
    try {
      console.log('🔌 Intentando conectar Socket.io a http://localhost:3004...');
      this.ws = io('http://localhost:3004');

      this.ws.on('connect', () => {
        console.log('✅ Socket.io conectado exitosamente');
        this.updateStatusIndicator(true);
      });

      this.ws.on('disconnect', () => {
        console.log('❌ Socket.io desconectado');
        this.updateStatusIndicator(false);
      });

      this.ws.on('connect_error', (error) => {
        console.error('❌ Error en Socket.io:', error);
        this.updateStatusIndicator(false);
      });

      // Manejadores de eventos de métricas
      this.ws.on('metrics_update', (data) => {
        try {
          console.log('📨 Métricas Socket.io recibidas:', data.type, 'con datos:', data);
          this.updateMetrics(data.data.metrics);
          this.updateCharts(data.data.metrics);
          // También actualizar gráficos PM2 con datos más recientes si están disponibles
          if (this.pm2Data && this.pm2Data.processes) {
            this.updatePM2Charts(this.pm2Data);
          }
          this.updateParticleSystem(data.data.metrics);
        } catch (error) {
          console.error('❌ Error procesando métricas Socket.io:', error);
        }
      });

      this.ws.on('pm2', (data) => {
        console.log('🖥️ Recibidos datos PM2 via Socket.io:', data.data);
        this.updatePM2Data(data.data);
        this.updatePM2Charts(data.data);
      });

      this.ws.on('midi_update', (data) => {
        console.log('🎵 MIDI update received via Socket.io:', data.data);
        this.updateMidiData(data.data);
      });

      // NUEVOS: Manejadores de eventos de optimización
      this.ws.on('optimization_suggestions_update', (data) => {
        console.log('💡 Sugerencias de optimización actualizadas via Socket.io:', data);
        this.handleOptimizationSuggestionsUpdate(data.data);
      });

      this.ws.on('optimization_mode_update', (data) => {
        console.log('🎛️ Modo de optimización actualizado via Socket.io:', data);
        this.handleOptimizationModeUpdate(data.data);
      });

    } catch (error) {
      console.error('❌ Error creando conexión Socket.io:', error);
      this.updateStatusIndicator(false);
    }
  }

  attemptReconnect() {
    // Socket.io maneja la reconexión automáticamente
    console.log('🔄 Socket.io intentando reconectar automáticamente...');
  }

  handleOptimizationSuggestionsUpdate(suggestionsData) {
    console.log('💡 Procesando actualización de sugerencias:', suggestionsData);

    // El formato esperado es un array de sugerencias
    if (Array.isArray(suggestionsData)) {
      this.updateSuggestionsList(suggestionsData);
    } else if (suggestionsData.suggestions) {
      this.updateSuggestionsList(suggestionsData.suggestions);
    } else {
      console.warn('⚠️ Formato de sugerencias no reconocido:', suggestionsData);
    }
  }

  handleOptimizationModeUpdate(modeData) {
    console.log('🎛️ Procesando actualización de modo de optimización:', modeData);

    if (modeData && modeData.mode) {
      this.updateOptimizationMode(modeData.mode);
    } else {
      console.warn('⚠️ Formato de modo de optimización no reconocido:', modeData);
    }
  }

  startHistoricalDataUpdates() {
    // Actualizar datos históricos cada 5 minutos (en lugar de 60 segundos)
    this.historicalUpdateInterval = setInterval(async () => {
      try {
        console.log('🔄 Actualizando datos históricos...');
        await this.refreshHistoricalData();
        console.log('✅ Datos históricos actualizados');
      } catch (error) {
        console.error('❌ Error actualizando datos históricos:', error);
      }
    }, 300000); // 5 minutos
  }

  // ============================================
  // 📊 DATA LOADING
  // ============================================

  async loadInitialData() {
    try {
      // Cargar métricas, nodos, modo de optimización y datos PM2 en paralelo
      const [metricsResponse, nodesResponse, pm2Response] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/nodes'),
        fetch('/api/pm2/status')
      ]);

      const [metricsData, nodesData, pm2Data] = await Promise.all([
        metricsResponse.json(),
        nodesResponse.json(),
        pm2Response.json()
      ]);

      if (metricsData.success) {
        this.metrics = metricsData.data;
        console.log('📊 Initial metrics loaded:', this.metrics);
      }

      if (nodesData.success) {
        this.nodes = nodesData.data;
      }

      if (pm2Data.success) {
        this.pm2Data = pm2Data.data;
      }

      // Cargar modo de optimización
      await this.loadOptimizationMode();

      // Cargar datos históricos para gráficos
      await this.loadHistoricalData();

      // Cargar datos MIDI recientes
      await this.loadMidiData();

      // Cargar datos de poesías recientes
      await this.loadPoemsData();

      // Renderizar interfaz PRIMERO
      this.renderDashboard();

      // Inicializar panel de intención FORJA 9.0 DESPUÉS de renderizar
      this.initializeIntentionPanel();

      // Inicializar gráficos UNA SOLA VEZ después de cargar datos históricos
      if (!this.chartsInitialized) {
        this.initializeCharts();
        this.chartsInitialized = true;
      }

      // Luego cargar sugerencias (ahora que el DOM existe)
      await this.loadPendingSuggestions();

      // Cargar estado de quota
      await this.loadQuotaStatus();

    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      throw error;
    }
  }

  async loadQuotaStatus() {
    try {
      const response = await fetch('/api/optimization/quota');
      const data = await response.json();

      if (data.success) {
        this.quotaStatus = data.data;
        this.updateQuotaDisplay();
      }
    } catch (error) {
      console.error('Error cargando estado de quota:', error);
    }
  }

  updateQuotaDisplay() {
    const quotaElement = document.getElementById('quota-status');
    if (quotaElement) {
      const { usedToday, quotaLimit, cooldownRemaining, canGenerate } = this.quotaStatus;
      const cooldownMinutes = Math.ceil(cooldownRemaining / (1000 * 60));

      quotaElement.innerHTML = `
        <div class="quota-info">
          <span class="quota-text">Sugerencias hoy: ${usedToday}/${quotaLimit}</span>
          ${!canGenerate ? `<span class="quota-warning">Próxima sugerencia en ${cooldownMinutes}min</span>` : ''}
        </div>
        <div class="quota-bar">
          <div class="quota-fill" style="width: ${(usedToday / quotaLimit) * 100}%"></div>
        </div>
      `;
    }
  }

  async loadHistoricalData() {
    try {
      const [metricsHistory, pm2History] = await Promise.all([
        fetch('/api/metrics/history?hours=3'),
        fetch('/api/pm2/history?hours=2')
      ]);

      const [metricsHistData, pm2HistData] = await Promise.all([
        metricsHistory.json(),
        pm2History.json()
      ]);

      if (metricsHistData.success && metricsHistData.data) {
        // Cargar datos históricos para consensus y memory
        this.historicalData.consensusHistory = metricsHistData.data.map(d => ({
          timestamp: d.timestamp,
          value: d.metrics.consensus_quality * 100
        }));
        this.historicalData.memoryHistory = metricsHistData.data.map(d => ({
          timestamp: d.timestamp,
          value: d.metrics.memory_mb
        }));

        // También inicializar datos en tiempo real con el último valor histórico
        if (metricsHistData.data.length > 0) {
          const lastMetrics = metricsHistData.data[metricsHistData.data.length - 1].metrics;
          this.historicalData.consensus = [{
            timestamp: Date.now(),
            value: lastMetrics.consensus_quality * 100
          }];
          this.historicalData.memory = [{
            timestamp: Date.now(),
            value: lastMetrics.memory_mb
          }];
        }
      }

      if (pm2HistData.success && pm2HistData.data) {
        // Cargar datos históricos para CPU y PM2 Memory
        this.historicalData.cpu = pm2HistData.data.map(d => ({
          timestamp: d.timestamp,
          value: d.processes ? d.processes.reduce((sum, p) => sum + (p.cpu_percent || 0), 0) : 0
        }));

        this.historicalData.pm2Memory = pm2HistData.data.map(d => ({
          timestamp: d.timestamp,
          value: d.processes ? d.processes.reduce((sum, p) => sum + (p.memory_mb || 0), 0) : 0
        }));
      }

      console.log('📊 Datos históricos cargados:', {
        consensusHistory: this.historicalData.consensusHistory.length,
        memoryHistory: this.historicalData.memoryHistory.length,
        cpu: this.historicalData.cpu.length,
        pm2Memory: this.historicalData.pm2Memory.length
      });
    } catch (error) {
      console.error('Error cargando datos históricos:', error);
    }
  }



  destroyCharts() {
    console.log('�️ Destruyendo gráficos existentes...');
    Object.keys(this.charts).forEach(chartId => {
      if (this.charts[chartId]) {
        console.log(`🗑️ Destruyendo gráfico ${chartId}`);
        this.charts[chartId].destroy();
        this.charts[chartId] = null;
      }
    });
    this.charts = {};
  }

  initializeCharts() {
    console.log('📊 Inicializando gráficos con datos históricos:', this.historicalData);

    // Destruir gráficos existentes antes de crear nuevos
    this.destroyCharts();

    const chartConfigs = [
      {
        id: 'consensus-chart',
        title: 'Consensus Quality',
        historicalData: this.historicalData.consensusHistory || [],
        realtimeData: this.historicalData.consensus,
        color: '#ff6b6b'
      },
      {
        id: 'memory-chart',
        title: 'Memory Usage (MB)',
        historicalData: this.historicalData.memoryHistory || [],
        realtimeData: this.historicalData.memory,
        color: '#4ecdc4'
      },
      { id: 'cpu-chart', title: 'CPU Usage (%)', data: this.historicalData.cpu, color: '#45b7d1' },
      { id: 'pm2-memory-chart', title: 'PM2 Memory (MB)', data: this.historicalData.pm2Memory, color: '#f9ca24' }
    ];

    chartConfigs.forEach(config => {
      const canvas = document.getElementById(config.id);
      console.log(`🎨 Inicializando gráfico ${config.id}, canvas encontrado:`, !!canvas);

      if (canvas) {
        let datasets;

        if (config.historicalData !== undefined) {
          // Gráfico con doble línea (Consensus y Memory)
          datasets = [
            {
              label: 'Histórico',
              data: config.historicalData.map(d => d.value),
              borderColor: '#888888',
              backgroundColor: '#88888820',
              borderDash: [5, 5], // Línea punteada
              fill: false,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 0
            },
            {
              label: 'Tiempo Real',
              data: config.realtimeData.map(d => d.value),
              borderColor: config.color,
              backgroundColor: config.color + '20',
              fill: true,
              tension: 0.4,
              pointRadius: 2,
              pointHoverRadius: 4
            }
          ];
        } else {
          // Gráfico simple (CPU y PM2 Memory)
          datasets = [{
            label: config.title,
            data: config.data.map(d => d.value),
            borderColor: config.color,
            backgroundColor: config.color + '20',
            fill: true,
            tension: 0.4
          }];
        }

        this.charts[config.id] = new Chart(canvas, {
          type: 'line',
          data: {
            labels: config.realtimeData ? config.realtimeData.map(d => new Date(d.timestamp).toLocaleTimeString()) : config.data.map(d => new Date(d.timestamp).toLocaleTimeString()),
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true }
            },
            scales: {
              x: { display: false },
              y: { beginAtZero: true }
            },
            animation: { duration: 0 }
          }
        });
        console.log(`✅ Gráfico ${config.id} creado exitosamente`);
      } else {
        console.error(`❌ Canvas no encontrado para gráfico ${config.id}`);
      }
    });
  }

  updateCharts(newMetrics) {
    console.log('📊 updateCharts called with:', newMetrics);

    // Actualizar datos en tiempo real
    if (newMetrics.consensus_quality !== undefined) {
      console.log('📈 Updating consensus chart with:', newMetrics.consensus_quality * 100);
      // Agregar nuevo punto de tiempo real
      this.historicalData.consensus.push({
        timestamp: Date.now(),
        value: newMetrics.consensus_quality * 100
      });
      // Mantener solo últimos 50 puntos para tiempo real
      if (this.historicalData.consensus.length > 50) {
        this.historicalData.consensus = this.historicalData.consensus.slice(-50);
      }
      // Actualizar gráfico con doble línea
      this.updateChartWithHistoricalData('consensus-chart', this.historicalData.consensusHistory, this.historicalData.consensus);
    }

    if (newMetrics.memory_mb !== undefined) {
      console.log('📈 Updating memory chart with:', newMetrics.memory_mb);
      // Agregar nuevo punto de tiempo real
      this.historicalData.memory.push({
        timestamp: Date.now(),
        value: newMetrics.memory_mb
      });
      // Mantener solo últimos 50 puntos para tiempo real
      if (this.historicalData.memory.length > 50) {
        this.historicalData.memory = this.historicalData.memory.slice(-50);
      }
      // Actualizar gráfico con doble línea
      this.updateChartWithHistoricalData('memory-chart', this.historicalData.memoryHistory, this.historicalData.memory);
    }

    // CPU y PM2 Memory se actualizan en updatePM2Charts
  }

  async refreshHistoricalData() {
    try {
      // Solo actualizar datos históricos de métricas, no PM2 (que se actualiza en tiempo real)
      const metricsHistory = await fetch('/api/metrics/history?hours=3&limit=50');
      const metricsHistData = await metricsHistory.json();

      if (metricsHistData.success && metricsHistData.data) {
        // Actualizar datos históricos para consensus y memory
        this.historicalData.consensusHistory = metricsHistData.data.map(d => ({
          timestamp: d.timestamp,
          value: d.metrics.consensus_quality * 100
        }));
        this.historicalData.memoryHistory = metricsHistData.data.map(d => ({
          timestamp: d.timestamp,
          value: d.metrics.memory_mb
        }));

        // Re-actualizar gráficos con los nuevos datos históricos
        this.updateChartWithHistoricalData('consensus-chart', this.historicalData.consensusHistory, this.historicalData.consensus);
        this.updateChartWithHistoricalData('memory-chart', this.historicalData.memoryHistory, this.historicalData.memory);
      }
    } catch (error) {
      console.error('Error refrescando datos históricos:', error);
    }
  }

  updateChartWithHistoricalData(chartId, historicalData, realtimeData) {
    console.log(`� Actualizando gráfico ${chartId} con doble línea: ${historicalData.length} históricos, ${realtimeData.length} tiempo real`);

    const chart = this.charts[chartId];
    if (chart) {
      // Crear datasets: histórico (punteado) y tiempo real (sólido)
      const historicalLabels = historicalData.map(d => new Date(d.timestamp).toLocaleTimeString());
      const historicalValues = historicalData.map(d => d.value);

      const realtimeLabels = realtimeData.map(d => new Date(d.timestamp).toLocaleTimeString());
      const realtimeValues = realtimeData.map(d => d.value);

      // Combinar labels únicos y ordenados
      const allLabels = [...new Set([...historicalLabels, ...realtimeLabels])].sort();

      // Crear datasets
      const datasets = [
        {
          label: 'Histórico',
          data: historicalValues,
          borderColor: '#888888',
          backgroundColor: '#88888820',
          borderDash: [5, 5], // Línea punteada
          fill: false,
          tension: 0.4,
          pointRadius: 0, // Sin puntos para línea histórica
          pointHoverRadius: 0
        },
        {
          label: 'Tiempo Real',
          data: realtimeValues,
          borderColor: chartId === 'consensus-chart' ? '#ff6b6b' : '#4ecdc4',
          backgroundColor: (chartId === 'consensus-chart' ? '#ff6b6b' : '#4ecdc4') + '20',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4
        }
      ];

      // Para gráficos con doble dataset, necesitamos manejar las labels de manera diferente
      // Usar las labels de tiempo real para consistencia
      chart.data.labels = realtimeLabels;
      chart.data.datasets = datasets;

      chart.update('none');
      console.log(`✅ Gráfico ${chartId} actualizado con doble línea`);
    } else {
      console.error(`❌ Gráfico ${chartId} no encontrado para actualizar con datos históricos`);
    }
  }

  // ============================================
  // ✨ PARTICLE SYSTEM
  // ============================================

  initializeParticleSystem() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    this.particleSystem = new ParticleSystem(canvas);
    this.particleSystem.init();
    this.updateParticleSystem(this.metrics);
  }

  updateParticleSystem(metrics) {
    if (!this.particleSystem) return;

    // Actualizar partículas solo cada minuto (60 segundos)
    const now = Date.now();
    if (!this.lastParticleUpdate || (now - this.lastParticleUpdate) >= 60000) {
      this.lastParticleUpdate = now;

      // Configurar partículas basado en métricas de SELENE
      const config = {
        harmony: metrics.harmony_score || 0,
        memory: metrics.memory_mb || 0,
        consensus: metrics.consensus_quality || 0,
        vitality: (metrics.harmony_score + metrics.consensus_quality) / 2
      };

      this.particleSystem.updateConfig(config);
    }
  }

  // ============================================
  // 🎨 UI RENDERING
  // ============================================

  renderDashboard() {
    console.log('🎨 Renderizando dashboard...');
    console.log('📊 Datos actuales:', this.metrics);

    const content = document.getElementById('content');
    console.log('🔍 Elemento content encontrado:', content);

    if (!content) {
      console.error('❌ ERROR: Elemento #content no encontrado en el DOM');
      return;
    }

    console.log('📝 Asignando innerHTML al elemento content...');
    content.innerHTML = `
      <div class="metrics-grid">
        ${this.renderMetricCard('⚖️', 'Consensus Quality', (this.metrics.consensus_quality * 100).toFixed(1) + '%', 'Calidad del consenso')}
        ${this.renderMetricCard('❤️', 'Harmony Score', (this.metrics.harmony_score * 100).toFixed(1) + '%', 'Harmonía del sistema')}
        ${this.renderMetricCard('🐝', 'Active Nodes', this.metrics.active_nodes, 'Nodos activos en swarm')}
        ${this.renderMetricCard('💾', 'Memory (MB)', this.metrics.memory_mb.toFixed(2), 'Uso de memoria')}
        ${this.renderMetricCard('🧠', 'Meta-Complexity', (this.metrics.meta_complexity * 100).toFixed(1) + '%', 'Complejidad meta-cognitiva')}
        ${this.renderMetricCard('⭐', 'XP Level', this.metrics.xp, 'Experiencia acumulada')}
        ${this.renderMetricCard('🗂️', 'Heap Usage', this.metrics.heap_usage_percent ? this.metrics.heap_usage_percent.toFixed(1) + '%' : 'N/A', 'Uso del heap de Node.js')}
        ${this.renderMetricCard('⏱️', 'Event Loop Latency', this.metrics.event_loop_latency_ms ? this.metrics.event_loop_latency_ms.toFixed(2) + 'ms' : 'N/A', 'Latencia del event loop')}
      </div>

      ${this.renderPM2Monitor()}

      ${this.renderCharts()}

      ${this.renderParticles()}

      ${this.renderPoemsSection()}

      ${this.renderMidiSection()}

      ${this.renderIntentionPanel()}

      <div class="control-panel">
        <h2 class="control-title">🎛️ SELENE CONTROL PANEL</h2>

        <div class="mode-selector">
          <button class="mode-btn" data-mode="manual" id="mode-manual">Manual</button>
          <button class="mode-btn active" data-mode="hybrid" id="mode-hybrid">Hybrid</button>
          <button class="mode-btn" data-mode="auto" id="mode-auto">Auto</button>
        </div>

        <div class="current-mode">
          Current: <span id="current-mode">${this.optimizationMode.toUpperCase()}</span>
        </div>

        <div class="suggestions-section">
          <h3 class="suggestions-title">💡 Pending Suggestions</h3>
          <div id="suggestions-list">
            <p>No hay sugerencias pendientes</p>
          </div>
        </div>
      </div>
    `;

    // Actualizar modo activo
    this.updateOptimizationMode(this.optimizationMode);

    // Los gráficos ya se inicializaron en loadInitialData, no volver a inicializar
    if (!this.particleSystem) {
      this.initializeParticleSystem();
    }
  }

  renderPM2Monitor() {
    if (!this.pm2Data || !this.pm2Data.processes) {
      return `
        <div class="pm2-monitor">
          <h2 class="pm2-title">🔧 PM2 MONITOR</h2>
          <div class="pm2-loading">Cargando datos PM2...</div>
        </div>
      `;
    }

    const processes = this.pm2Data.processes;
    const summary = this.pm2Data.summary || {};

    return `
      <div class="pm2-monitor">
        <h2 class="pm2-title">🔧 PM2 MONITOR</h2>

        <div class="pm2-summary">
          <div class="pm2-summary-item">
            <span class="pm2-label">Procesos Totales:</span>
            <span class="pm2-value">${summary.total || 0}</span>
          </div>
          <div class="pm2-summary-item">
            <span class="pm2-label">En línea:</span>
            <span class="pm2-value">${summary.online || 0}</span>
          </div>
          <div class="pm2-summary-item">
            <span class="pm2-label">Memoria Total:</span>
            <span class="pm2-value">${this.formatBytes(summary.memory || 0)}</span>
          </div>
          <div class="pm2-summary-item">
            <span class="pm2-label">CPU Total:</span>
            <span class="pm2-value">${(summary.cpu || 0).toFixed(1)}%</span>
          </div>
        </div>

        <div class="pm2-processes">
          ${processes.map(process => this.renderPM2Process(process)).join('')}
        </div>
      </div>
    `;
  }

  renderPM2Process(process) {
    const statusClass = process.pm2_env.status === 'online' ? 'online' : 'offline';
    const memoryMB = (process.monit.memory / 1024 / 1024).toFixed(2);
    const cpuPercent = process.monit.cpu.toFixed(1);

    return `
      <div class="pm2-process">
        <div class="pm2-process-header">
          <span class="pm2-process-name">${process.name}</span>
          <span class="pm2-process-status ${statusClass}">${process.pm2_env.status}</span>
        </div>
        <div class="pm2-process-metrics">
          <div class="pm2-metric">
            <span class="pm2-metric-label">PID:</span>
            <span class="pm2-metric-value">${process.pid}</span>
          </div>
          <div class="pm2-metric">
            <span class="pm2-metric-label">Memoria:</span>
            <span class="pm2-metric-value">${memoryMB} MB</span>
          </div>
          <div class="pm2-metric">
            <span class="pm2-metric-label">CPU:</span>
            <span class="pm2-metric-value">${cpuPercent}%</span>
          </div>
          <div class="pm2-metric">
            <span class="pm2-metric-label">Restarts:</span>
            <span class="pm2-metric-value">${process.pm2_env.restart_time}</span>
          </div>
          <div class="pm2-metric">
            <span class="pm2-metric-label">Uptime:</span>
            <span class="pm2-metric-value">${this.formatUptime(process.pm2_env.pm_uptime)}</span>
          </div>
        </div>
        <div class="pm2-process-logs">
          <div class="pm2-logs-header">Últimos logs:</div>
          <div class="pm2-logs-content">
            ${process.logs && process.logs.length > 0 ?
              process.logs.slice(-3).map(log => `<div class="pm2-log-line">${log}</div>`).join('') :
              '<div class="pm2-log-line">No hay logs disponibles</div>'
            }
          </div>
        </div>
      </div>
    `;
  }

  renderCharts() {
    return `
      <div class="charts-section">
        <h2 class="charts-title">📈 HISTORICAL CHARTS</h2>
        <div class="charts-grid">
          <div class="chart-container">
            <h3 class="chart-title">Consensus Quality</h3>
            <canvas id="consensus-chart"></canvas>
          </div>
          <div class="chart-container">
            <h3 class="chart-title">Memory Usage</h3>
            <canvas id="memory-chart"></canvas>
          </div>
          <div class="chart-container">
            <h3 class="chart-title">CPU Usage</h3>
            <canvas id="cpu-chart"></canvas>
          </div>
          <div class="chart-container">
            <h3 class="chart-title">PM2 Memory</h3>
            <canvas id="pm2-memory-chart"></canvas>
          </div>
        </div>
      </div>
    `;
  }

  renderParticles() {
    return `
      <div class="particles-section">
        <h2 class="particles-title">✨ SELENE PARTICLE SYSTEM</h2>
        <div class="particles-container">
          <canvas id="particles-canvas"></canvas>
          <div class="particles-info">
            <div class="particle-metric">
              <span class="particle-label">Harmony:</span>
              <span class="particle-value" id="harmony-value">0%</span>
            </div>
            <div class="particle-metric">
              <span class="particle-label">Vitality:</span>
              <span class="particle-value" id="vitality-value">0%</span>
            </div>
            <div class="particle-metric">
              <span class="particle-label">Memory:</span>
              <span class="particle-value" id="memory-value">0 MB</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderForjaSection() {
    return `
      <div class="forja-section" id="forja-section">
        <h2 class="forja-title">🔥 FORJA 6.0 - 4D ART TAXONOMY</h2>
        <div class="forja-description">
          "Clasificación cuántica de arte generado: Legendary (amarillo), Experimental (cian), Common (púrpura)"
        </div>
        <div class="forja-blocks" id="forja-blocks">
          <!-- Legendary Block -->
          <div class="forja-block legendary" id="legendary-block">
            <div class="forja-block-header">
              <h3 class="forja-block-title">🌟 LEGENDARY</h3>
              <div class="forja-block-count" id="legendary-count">${this.forjaData.legendary.count || 0}</div>
            </div>
            <div class="forja-block-criteria">
              coherence >75% & rarity >80%
            </div>
            <div class="forja-block-reasons" id="legendary-reasons">
              ${this.forjaData.legendary.reasons.map(reason => `
                <div class="forja-reason-item">${reason}</div>
              `).join('')}
            </div>
            <div class="forja-block-preview" id="legendary-preview">
              ${this.forjaData.legendary.items.map((item, index) => `
                <div class="forja-preview-item" onclick="dashboard.showForjaItem('legendary', ${index})">
                  <div class="forja-preview-title">${item.title || `Item ${index + 1}`}</div>
                  <div class="forja-preview-meta">
                    ${item.type || 'Unknown'} • ${new Date(item.timestamp || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Experimental Block -->
          <div class="forja-block experimental" id="experimental-block">
            <div class="forja-block-header">
              <h3 class="forja-block-title">⚡ EXPERIMENTAL</h3>
              <div class="forja-block-count" id="experimental-count">${this.forjaData.experimental.count || 0}</div>
            </div>
            <div class="forja-block-criteria">
              variety >45% & coherence <70%
            </div>
            <div class="forja-block-reasons" id="experimental-reasons">
              ${this.forjaData.experimental.reasons.map(reason => `
                <div class="forja-reason-item">${reason}</div>
              `).join('')}
            </div>
            <div class="forja-block-preview" id="experimental-preview">
              ${this.forjaData.experimental.items.map((item, index) => `
                <div class="forja-preview-item" onclick="dashboard.showForjaItem('experimental', ${index})">
                  <div class="forja-preview-title">${item.title || `Item ${index + 1}`}</div>
                  <div class="forja-preview-meta">
                    ${item.type || 'Unknown'} • ${new Date(item.timestamp || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Common Block -->
          <div class="forja-block common" id="common-block">
            <div class="forja-block-header">
              <h3 class="forja-block-title">📦 COMMON</h3>
              <div class="forja-block-count" id="common-count">${this.forjaData.common.count || 0}</div>
            </div>
            <div class="forja-block-criteria">
              coherence >70% (production log)
            </div>
            <div class="forja-block-reasons" id="common-reasons">
              ${this.forjaData.common.reasons.map(reason => `
                <div class="forja-reason-item">${reason}</div>
              `).join('')}
            </div>
            <div class="forja-block-preview" id="common-preview">
              ${this.forjaData.common.items.map((item, index) => `
                <div class="forja-preview-item" onclick="dashboard.showForjaItem('common', ${index})">
                  <div class="forja-preview-title">${item.title || `Item ${index + 1}`}</div>
                  <div class="forja-preview-meta">
                    ${item.type || 'Unknown'} • ${new Date(item.timestamp || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="forja-controls">
          <button class="forja-btn" onclick="dashboard.refreshForjaData()">🔄 Refresh FORJA Data</button>
          <button class="forja-btn" onclick="dashboard.forceForjaRecalculation()">⚡ Force Recalculation</button>
        </div>
      </div>
    `;
  }

  renderIntentionPanel() {
    // Limpiar cualquier panel de intención existente para evitar duplicación
    const existingPanel = document.getElementById('intention-section');
    if (existingPanel) {
      console.log('🧹 Eliminando panel de intención duplicado');
      existingPanel.remove();
    }

    const html = `
      <div class="intention-section" id="intention-section">
        <h2 class="intention-title">🎯 FORJA 9.0 - PRE-HOC INTENTION DIRECTOR</h2>
        <div class="intention-description">
          "Transforma Selene de post-hoc clasificadora a pre-hoc directora artística"
        </div>

        <div class="profile-buttons">
          <button class="profile-btn experimental" data-profile="experimental" onclick="dashboard.selectIntentionProfile('experimental')">
            <div class="profile-icon">⚡</div>
            <div class="profile-name">EXPERIMENTAL</div>
            <div class="profile-desc">Variedad máxima, innovación radical</div>
          </button>
          <button class="profile-btn legendary" data-profile="legendary" onclick="dashboard.selectIntentionProfile('legendary')">
            <div class="profile-icon">🌟</div>
            <div class="profile-name">LEGENDARY</div>
            <div class="profile-desc">Belleza trascendente, coherencia perfecta</div>
          </button>
        </div>

        <div class="modifier-controls">
          <div class="modifier-group">
            <label for="template-bias">Template Bias:</label>
            <select id="template-bias" class="modifier-control">
              <option value="">None</option>
              <option value="chaotic">Chaotic</option>
              <option value="epic">Epic</option>
            </select>
          </div>

          <div class="modifier-group">
            <label for="element-preference">Element Preference:</label>
            <select id="element-preference" class="modifier-control">
              <option value="">None</option>
              <option value="fire">Fire</option>
              <option value="water">Water</option>
              <option value="earth">Earth</option>
              <option value="air">Air</option>
              <option value="spirit">Spirit</option>
            </select>
          </div>

          <div class="modifier-group">
            <label for="numerology-weight">Numerology Weight: <span id="numerology-value">0.0</span></label>
            <input type="range" id="numerology-weight" class="modifier-control" min="0" max="1" step="0.1" value="0">
          </div>
        </div>

        <div class="intention-status">
          <div class="current-intention" id="current-intention">Sin intención activa</div>
          <button id="generate-with-intention" class="generate-btn" onclick="dashboard.generateWithIntention()">🎨 Generar con Intención</button>
        </div>
      </div>
    `;

    return html;
  }

  renderMetricCard(icon, title, value, description) {
    return `
      <div class="metric-card">
        <div class="metric-title">${icon} ${title}</div>
        <div class="metric-value">${value}</div>
        <div class="metric-description">${description}</div>
      </div>
    `;
  }

  updateMetrics(newMetrics) {
    console.log('🔄 Actualizando métricas:', newMetrics);
    // Actualizar métricas internas
    this.metrics = { ...this.metrics, ...newMetrics };

    // Actualizar UI
    this.updateMetricValue('Consensus Quality', (newMetrics.consensus_quality * 100).toFixed(1) + '%');
    this.updateMetricValue('Harmony Score', (newMetrics.harmony_score * 100).toFixed(1) + '%');
    this.updateMetricValue('Active Nodes', newMetrics.active_nodes);
    this.updateMetricValue('Memory (MB)', newMetrics.memory_mb.toFixed(2));
    this.updateMetricValue('Meta-Complexity', (newMetrics.meta_complexity * 100).toFixed(1) + '%');
    this.updateMetricValue('XP Level', newMetrics.xp);
    this.updateMetricValue('Heap Usage', newMetrics.heap_usage_percent ? newMetrics.heap_usage_percent.toFixed(1) + '%' : 'N/A');
    this.updateMetricValue('Event Loop Latency', newMetrics.event_loop_latency_ms ? newMetrics.event_loop_latency_ms.toFixed(2) + 'ms' : 'N/A');

    // Actualizar info de partículas
    this.updateParticleInfo(newMetrics);
  }

  updatePM2Data(newData) {
    this.pm2Data = newData;
    // Re-renderizar sección PM2
    const pm2Section = document.querySelector('.pm2-monitor');
    if (pm2Section) {
      pm2Section.innerHTML = this.renderPM2Monitor();
    }
  }

  updatePM2Charts(pm2Data) {
    console.log('🖥️ updatePM2Charts called with:', pm2Data);

    // Actualizar CPU chart con datos en tiempo real
    if (pm2Data && pm2Data.summary && pm2Data.summary.cpu !== undefined) {
      console.log('📈 Updating CPU chart with:', pm2Data.summary.cpu);
      this.historicalData.cpu.push({
        timestamp: Date.now(),
        value: pm2Data.summary.cpu
      });
      // Mantener solo últimos 50 puntos
      if (this.historicalData.cpu.length > 50) {
        this.historicalData.cpu = this.historicalData.cpu.slice(-50);
      }
      this.updateChart('cpu-chart', this.historicalData.cpu);
    } else {
      console.log('⚠️ No CPU data available in PM2 data');
    }

    // Actualizar PM2 Memory chart con datos en tiempo real
    if (pm2Data && pm2Data.summary && pm2Data.summary.memory !== undefined) {
      const memoryMB = Math.round((pm2Data.summary.memory || 0) / 1024 / 1024 * 100) / 100;
      console.log('📈 Updating PM2 Memory chart with:', memoryMB);
      this.historicalData.pm2Memory.push({
        timestamp: Date.now(),
        value: memoryMB
      });
      // Mantener solo últimos 50 puntos
      if (this.historicalData.pm2Memory.length > 50) {
        this.historicalData.pm2Memory = this.historicalData.pm2Memory.slice(-50);
      }
      this.updateChart('pm2-memory-chart', this.historicalData.pm2Memory);
    } else {
      console.log('⚠️ No memory data available in PM2 data');
    }
  }

  updateChart(chartId, data) {
    console.log(`📊 Actualizando gráfico simple ${chartId} con ${data.length} puntos`);

    const chart = this.charts[chartId];
    if (chart) {
      // Para gráficos simples, solo actualizar los datos
      chart.data.labels = data.map(d => new Date(d.timestamp).toLocaleTimeString());
      chart.data.datasets[0].data = data.map(d => d.value);
      chart.update('none');
      console.log(`✅ Gráfico ${chartId} actualizado`);
    } else {
      console.error(`❌ Gráfico ${chartId} no encontrado para actualizar`);
    }
  }

  updateChartWithHistoricalData(chartId, historicalData, realtimeData) {
    console.log(`📊 Actualizando gráfico ${chartId} con doble línea: ${historicalData.length} históricos, ${realtimeData.length} tiempo real`);

    const chart = this.charts[chartId];
    if (chart) {
      // Crear datasets: histórico (punteado) y tiempo real (sólido)
      const historicalValues = historicalData.map(d => d.value);
      const realtimeValues = realtimeData.map(d => d.value);

      // Crear datasets
      const datasets = [
        {
          label: 'Histórico',
          data: historicalValues,
          borderColor: '#888888',
          backgroundColor: '#88888820',
          borderDash: [5, 5], // Línea punteada
          fill: false,
          tension: 0.4,
          pointRadius: 0, // Sin puntos para línea histórica
          pointHoverRadius: 0
        },
        {
          label: 'Tiempo Real',
          data: realtimeValues,
          borderColor: chartId === 'consensus-chart' ? '#ff6b6b' : '#4ecdc4',
          backgroundColor: (chartId === 'consensus-chart' ? '#ff6b6b' : '#4ecdc4') + '20',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4
        }
      ];

      // Usar las labels de tiempo real para consistencia
      chart.data.labels = realtimeData.map(d => new Date(d.timestamp).toLocaleTimeString());
      chart.data.datasets = datasets;

      chart.update('none');
      console.log(`✅ Gráfico ${chartId} actualizado con doble línea`);
    } else {
      console.error(`❌ Gráfico ${chartId} no encontrado para actualizar con datos históricos`);
    }
  }

  updateParticleInfo(metrics) {
    const harmonyEl = document.getElementById('harmony-value');
    const vitalityEl = document.getElementById('vitality-value');
    const memoryEl = document.getElementById('memory-value');

    if (harmonyEl) harmonyEl.textContent = `${(metrics.harmony_score * 100).toFixed(1)}%`;
    if (vitalityEl) vitalityEl.textContent = `${((metrics.harmony_score + metrics.consensus_quality) / 2 * 100).toFixed(1)}%`;
    if (memoryEl) memoryEl.textContent = `${metrics.memory_mb.toFixed(2)} MB`;
  }

  updateMetricValue(title, newValue) {
    const cards = document.querySelectorAll('.metric-card');
    cards.forEach(card => {
      const titleEl = card.querySelector('.metric-title');
      const valueEl = card.querySelector('.metric-value');

      if (titleEl && titleEl.textContent.includes(title)) {
        if (valueEl) {
          valueEl.textContent = newValue;
          // Efecto visual de actualización
          card.style.animation = 'none';
          setTimeout(() => {
            card.style.animation = 'pulse 0.5s ease-in-out';
          }, 10);
        }
      }
    });
  }

  updateStatusIndicator(connected) {
    const statusEl = document.getElementById('status-indicator');
    if (statusEl) {
      if (connected) {
        statusEl.className = 'status-connected';
        statusEl.textContent = '🟢 SELENE Online';
      } else {
        statusEl.className = 'status-disconnected';
        statusEl.textContent = '🔴 SELENE Offline';
      }
    }
  }

  showError(message) {
    console.log('❌ Mostrando error:', message);
    const content = document.getElementById('content');
    console.log('🔍 Elemento content en showError:', content);

    if (content) {
      console.log('📝 Asignando error al elemento content...');
      content.innerHTML = `<div class="error">${message}</div>`;
    } else {
      console.error('❌ ERROR: No se pudo encontrar elemento #content para mostrar error');
      // Fallback: mostrar error en consola
      alert('Error: ' + message);
    }
  }

  // ============================================
  // 🎛️ OPTIMIZATION MODE MANAGEMENT
  // ============================================

  async loadOptimizationMode() {
    try {
      const response = await fetch('/api/optimization/mode');
      const data = await response.json();

      if (data.success) {
        this.updateOptimizationMode(data.data.mode);
      }
    } catch (error) {
      console.error('Error cargando modo de optimización:', error);
    }
  }

  updateOptimizationMode(mode) {
    this.optimizationMode = mode;

    // Actualizar botones
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(`mode-${mode}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    // Actualizar texto actual
    const currentModeEl = document.getElementById('current-mode');
    if (currentModeEl) {
      currentModeEl.textContent = mode.toUpperCase();
    }
  }

  async changeOptimizationMode(mode) {
    try {
      const response = await fetch('/api/optimization/mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Modo de optimización cambiado a: ${mode}`);
        this.updateOptimizationMode(mode);
      } else {
        console.error('❌ Error cambiando modo de optimización:', data.error);
        alert('Error cambiando modo de optimización: ' + data.error);
      }
    } catch (error) {
      console.error('Error cambiando modo de optimización:', error);
      alert('Error cambiando modo de optimización');
    }
  }

  // ============================================
  // 💡 SUGGESTIONS MANAGEMENT
  // ============================================

  async loadPendingSuggestions() {
    try {
      const response = await fetch('/api/optimization/suggestions');
      const data = await response.json();

      if (data.success) {
        this.updateSuggestionsList(data.data);
      }
    } catch (error) {
      console.error('Error cargando sugerencias:', error);
      // Solo intentar mostrar error si el elemento existe
      const container = document.getElementById('suggestions-container');
      if (container) {
        container.innerHTML = '<p>❌ Error cargando sugerencias</p>';
      }
    }
  }

  updateSuggestionsList(suggestions) {
    const container = document.getElementById('suggestions-list');

    if (!container) {
      console.warn('Elemento #suggestions-list no encontrado, omitiendo actualización de sugerencias');
      return;
    }

    // Filtrar solo sugerencias pendientes (no aprobadas ni rechazadas)
    const pendingSuggestions = suggestions.filter(s => s.status === 'pending_human');

    if (!pendingSuggestions || pendingSuggestions.length === 0) {
      container.innerHTML = '<p>No hay sugerencias pendientes</p>';
      return;
    }

    const html = pendingSuggestions.map(suggestion => `
      <div class="suggestion-item" data-id="${suggestion.optimizationId}">
        <div class="suggestion-header">
          <span class="suggestion-type">${suggestion.targetComponent}</span>
          <span class="suggestion-risk risk-${suggestion.riskLevel < 0.3 ? 'low' : suggestion.riskLevel < 0.7 ? 'medium' : 'high'}">
            Riesgo: ${suggestion.riskLevel < 0.3 ? 'Bajo' : suggestion.riskLevel < 0.7 ? 'Medio' : 'Alto'}
          </span>
        </div>
        <div class="suggestion-text">
          <strong>${suggestion.technicalDescription}</strong>
        </div>
        <div class="suggestion-poetic">
          ${suggestion.poeticDescription}
        </div>
        <div class="suggestion-details">
          <span>Cambio: ${suggestion.oldValue} → ${suggestion.newValue}</span>
          <span>Mejora esperada: ${(suggestion.expectedImprovement * 100).toFixed(1)}%</span>
        </div>
        <div class="suggestion-actions">
          <button class="suggestion-btn approve" onclick="dashboard.approveSuggestion('${suggestion.optimizationId}')">✅ Aprobar</button>
          <button class="suggestion-btn reject" onclick="dashboard.rejectSuggestion('${suggestion.optimizationId}')">❌ Rechazar</button>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  async approveSuggestion(suggestionId) {
    await this.handleSuggestionAction(suggestionId, 'approve');
  }

  async rejectSuggestion(suggestionId) {
    const reason = prompt('Razón del rechazo (opcional):');
    await this.handleSuggestionAction(suggestionId, 'reject', reason);
  }

  async handleSuggestionAction(suggestionId, action, reason = null) {
    console.log(`🎯 [FRONTEND] Iniciando acción ${action} para sugerencia:`, suggestionId);

    try {
      const payload = { suggestionId, approvedBy: 'dashboard-user' };
      if (action === 'reject' && reason) {
        payload.reason = reason;
      }

      console.log(`📡 [FRONTEND] Enviando request a /api/optimization/suggestions/${suggestionId}/${action}`, payload);

      const response = await fetch(`/api/optimization/suggestions/${suggestionId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log(`📡 [FRONTEND] Response status:`, response.status);

      const data = await response.json();
      console.log(`📡 [FRONTEND] Response data:`, data);

      if (data.success) {
        console.log(`✅ [FRONTEND] Sugerencia ${action}ada exitosamente:`, suggestionId);

        // Mostrar feedback visual
        this.showActionFeedback(action, suggestionId, 'success');

        // Recargar sugerencias después de un pequeño delay
        setTimeout(async () => {
          console.log(`🔄 [FRONTEND] Recargando sugerencias después de ${action}...`);
          await this.loadPendingSuggestions();
          console.log(`✅ [FRONTEND] Sugerencias recargadas`);
        }, 500);

      } else {
        console.error(`❌ [FRONTEND] Error ${action}ando sugerencia:`, data.error);
        this.showActionFeedback(action, suggestionId, 'error', data.error);
        alert(`Error ${action}ando sugerencia: ` + data.error);
      }
    } catch (error) {
      console.error(`❌ [FRONTEND] Error en handleSuggestionAction:`, error);
      this.showActionFeedback(action, suggestionId, 'error', error.message);
      alert(`Error ${action}ando sugerencia: ` + error.message);
    }
  }

  showActionFeedback(action, suggestionId, status, message = '') {
    // Crear feedback visual temporal
    const suggestionElement = document.querySelector(`[data-id="${suggestionId}"]`);
    if (suggestionElement) {
      const feedbackDiv = document.createElement('div');
      feedbackDiv.className = `action-feedback ${status}`;
      feedbackDiv.textContent = status === 'success' ?
        `✅ ${action === 'approve' ? 'Aprobada' : 'Rechazada'}` :
        `❌ Error: ${message}`;

      suggestionElement.appendChild(feedbackDiv);

      // Remover feedback después de 5 segundos
      setTimeout(() => {
        if (feedbackDiv.parentNode) {
          feedbackDiv.parentNode.removeChild(feedbackDiv);
        }
      }, 5000);
    }
  }

  // ============================================
  // 🎛️ EVENT HANDLERS
  // ============================================

  setupControlEventHandlers() {
    // Botones de modo de optimización
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        this.changeOptimizationMode(mode);
      });
    });
  }

  // ============================================
  // 🛠️ UTILITY METHODS
  // ============================================

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(uptimeTimestamp) {
    if (!uptimeTimestamp) return 'N/A';

    const now = Date.now();
    const uptimeMs = now - uptimeTimestamp;

    // Convertir a segundos
    const uptimeSeconds = Math.floor(uptimeMs / 1000);

    if (uptimeSeconds < 60) {
      return `${uptimeSeconds}s`;
    }

    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    if (uptimeMinutes < 60) {
      const seconds = uptimeSeconds % 60;
      return `${uptimeMinutes}m ${seconds}s`;
    }

    const uptimeHours = Math.floor(uptimeMinutes / 60);
    if (uptimeHours < 24) {
      const minutes = uptimeMinutes % 60;
      return `${uptimeHours}h ${minutes}m`;
    }

    const uptimeDays = Math.floor(uptimeHours / 24);
    const hours = uptimeHours % 24;
    return `${uptimeDays}d ${hours}h`;
  }

  showNotification(message) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // ============================================
  // 📜 POEMS VISUALIZATION METHODS
  // ============================================

  async loadPoemsData() {
    try {
      console.log('📜 Loading poems data...');
      const response = await fetch('/api/poems/recent?all=true&limit=10');
      const data = await response.json();

      if (data.success) {
        this.poemsData = data.data || [];
        console.log('📜 Poems data loaded:', this.poemsData.length, 'poems');
      } else {
        console.error('❌ Error loading poems data:', data.error);
        this.poemsData = [];
      }
    } catch (error) {
      console.error('❌ Error loading poems data:', error);
      this.poemsData = [];
    }
  }

  renderPoemsSection() {
    if (!this.poemsData || this.poemsData.length === 0) {
      return `
        <div class="poems-section">
          <h2 class="poems-title">📜 Poesías Recientes</h2>
          <div class="poems-loading">No hay poesías recientes</div>
        </div>
      `;
    }

    return `
      <div class="poems-section">
        <h2 class="poems-title">📜 Poesías Recientes</h2>
        <div class="poems-description">
          "Versos procedimentales generados por SELENE"
        </div>
        <div class="poems-grid">
          ${this.poemsData.map(poem => this.renderPoem(poem)).join('')}
        </div>
        <div class="poems-controls">
          <button class="poems-btn" onclick="dashboard.refreshPoemsData()">🔄 Refresh Poems Data</button>
        </div>
      </div>
    `;
  }

  renderPoem(poem) {
    // Crear vista previa corta del verso (50-60 caracteres)
    const verseText = poem.content || poem.verse || '';
    const shortPreview = verseText.length > 55 ? verseText.substring(0, 55) + '...' : verseText;
    const formattedDate = new Date(poem.timestamp).toLocaleString();

    return `
      <div class="poem-card" onclick="dashboard.showPoemDetails('${poem.id || poem.timestamp}')">
        <div class="poem-preview">"${shortPreview}"</div>
        <div class="poem-meta">
          <div class="poem-meta-item">
            <span class="poem-meta-label">Fecha:</span>
            <span class="poem-meta-value">${formattedDate}</span>
          </div>
        </div>
      </div>
    `;
  }

  showPoemDetails(poemId) {
    console.log('📜 showPoemDetails called with id:', poemId);
    console.log('📜 Current poemsData:', this.poemsData);

    const poem = this.poemsData.find(p => (p.id || p.timestamp) === poemId);
    console.log('📜 Found poem:', poem);

    if (!poem) {
      console.error('❌ Poem not found for id:', poemId);
      this.showNotification('❌ Poesía no encontrada');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'poem-modal';
    modal.innerHTML = `
      <div class="poem-modal-content">
        <div class="poem-modal-header">
          <h3>📜 POESÍA DETALLADA</h3>
          <button class="poem-modal-close" onclick="this.closest('.poem-modal').remove()">✕</button>
        </div>
        <div class="poem-modal-body">
          <div class="poem-details-grid">
            <div class="poem-detail-row">
              <span class="poem-detail-label">ID:</span>
              <span class="poem-detail-value">${poem.id || 'N/A'}</span>
            </div>
            <div class="poem-detail-row">
              <span class="poem-detail-label">Timestamp:</span>
              <span class="poem-detail-value">${new Date(poem.timestamp).toLocaleString()}</span>
            </div>
            <div class="poem-detail-row">
              <span class="poem-detail-label">Tipo:</span>
              <span class="poem-detail-value">${poem.type || 'poem'}</span>
            </div>
          </div>

          <div class="poem-content">
            <h4>📝 VERSO COMPLETO</h4>
            <div class="poem-text">${(poem.content || poem.verse || 'Contenido no disponible').replace(/\n/g, '<br>')}</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async refreshPoemsData() {
    console.log('🔄 Refreshing poems data...');
    await this.loadPoemsData();
    this.renderPoemsSection();
    this.showNotification('📜 Poems data refreshed');
  }

  updatePoemsData(newData) {
    console.log('📜 Updating poems data:', newData);

    if (newData.poems) {
      this.poemsData = newData.poems;
      console.log('📜 Poems updated:', this.poemsData.length, 'poems');
    }

    this.renderPoemsSection();

    this.addPoemsUpdateAnimation();

    if (newData.poems && newData.poems.length > 0) {
      const latestPoem = newData.poems[0];
      this.showNotification(`📜 Nueva poesía generada`);
    }
  }

  addPoemsUpdateAnimation() {
    const poemCards = document.querySelectorAll('.poem-card');
    poemCards.forEach(card => {
      card.classList.add('updated');
      setTimeout(() => card.classList.remove('updated'), 1000);
    });
  }

  async loadMidiData() {
    try {
      console.log('🎵 Loading MIDI data...');
      const response = await fetch('/api/midi/recent?all=true&limit=10');
      const data = await response.json();

      if (data.success) {
        this.midiData = data.data || [];
        console.log('🎵 MIDI data loaded:', this.midiData.length, 'recordings');
      } else {
        console.error('❌ Error loading MIDI data:', data.error);
        this.midiData = [];
      }
    } catch (error) {
      console.error('❌ Error loading MIDI data:', error);
      this.midiData = [];
    }
  }

  renderMidiSection() {
    if (!this.midiData || this.midiData.length === 0) {
      return `
        <div class="midi-section">
          <h2 class="midi-title">🎵 MIDI RECORDINGS</h2>
          <div class="midi-loading">No hay grabaciones MIDI recientes</div>
        </div>
      `;
    }

    return `
      <div class="midi-section">
        <h2 class="midi-title">🎵 MIDI RECORDINGS</h2>
        <div class="midi-description">
          "Grabaciones procedimentales de sinfonías generadas por SELENE"
        </div>
        <div class="midi-grid">
          ${this.midiData.map(recording => this.renderMidiRecording(recording)).join('')}
        </div>
        <div class="midi-controls">
          <button class="midi-btn" onclick="dashboard.refreshMidiData()">🔄 Refresh MIDI Data</button>
        </div>
      </div>
    `;
  }

  renderMidiRecording(recording) {
    // Calcular calidad correctamente - puede ser un número o un objeto advancedQuality
    let quality = 0;
    if (typeof recording.quality === 'number') {
      quality = recording.quality;
    } else if (recording.beauty !== undefined) {
      quality = recording.beauty;
    } else if (recording.advancedQuality && typeof recording.advancedQuality === 'object') {
      // Calcular promedio de métricas avanzadas si existe
      const metrics = recording.advancedQuality;
      const values = [metrics.coherence, metrics.variety, metrics.rarity, metrics.complexity].filter(v => typeof v === 'number');
      quality = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0.5;
    } else {
      quality = 0.5; // Valor por defecto
    }

    // Normalizar calidad entre 0 y 1
    quality = Math.min(1, Math.max(0, quality));

    const qualityColor = this.getQualityColor(quality);
    const formattedDate = new Date(recording.timestamp).toLocaleString();
    const duration = this.formatDuration(recording.duration);

    return `
      <div class="midi-recording" onclick="dashboard.showMidiDetails('${recording.filename}')">
        <div class="midi-recording-header">
          <div class="midi-filename">${recording.filename}</div>
          <div class="midi-quality" style="color: ${qualityColor}">
            ${(typeof quality === 'number' && !isNaN(quality)) ? quality.toFixed(2) : 'N/A'}
          </div>
        </div>
        <div class="midi-recording-meta">
          <div class="midi-meta-item">
            <span class="midi-meta-label">Notas:</span>
            <span class="midi-meta-value">${recording.notesCount || recording.notes || 0}</span>
          </div>
          <div class="midi-meta-item">
            <span class="midi-meta-label">Duración:</span>
            <span class="midi-meta-value">${duration}</span>
          </div>
          <div class="midi-meta-item">
            <span class="midi-meta-label">Fecha:</span>
            <span class="midi-meta-value">${formattedDate}</span>
          </div>
        </div>
        <div class="midi-quality-bar">
          <div class="midi-quality-fill" style="width: ${quality * 100}%; background-color: ${qualityColor}"></div>
        </div>
      </div>
    `;
  }

  getQualityColor(quality) {
    if (quality >= 0.8) return '#00ff88'; // Verde - Excelente
    if (quality >= 0.6) return '#ffff00'; // Amarillo - Bueno
    if (quality >= 0.4) return '#ff8800'; // Naranja - Regular
    return '#ff4444'; // Rojo - Bajo
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  showMidiDetails(filename) {
    console.log('🎵 showMidiDetails called with filename:', filename);
    console.log('🎵 Current midiData:', this.midiData);

    const recording = this.midiData.find(r => r.filename === filename);
    console.log('🎵 Found recording:', recording);

    if (!recording) {
      console.error('❌ Recording not found for filename:', filename);
      this.showNotification('❌ Grabación MIDI no encontrada');
      return;
    }

    // Calcular calidad correctamente
    let quality = 0;
    try {
      if (typeof recording.quality === 'number') {
        quality = recording.quality;
        console.log('🎵 Using recording.quality:', quality);
      } else if (recording.beauty !== undefined) {
        quality = recording.beauty;
        console.log('🎵 Using recording.beauty:', quality);
      } else if (recording.advancedQuality && typeof recording.advancedQuality === 'object') {
        console.log('🎵 Using advancedQuality object:', recording.advancedQuality);
        const metrics = recording.advancedQuality;
        const values = [metrics.coherence, metrics.variety, metrics.rarity, metrics.complexity].filter(v => typeof v === 'number');
        quality = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0.5;
        console.log('🎵 Calculated quality from advancedQuality:', quality, 'from values:', values);
      } else {
        quality = 0.5;
        console.log('🎵 Using default quality:', quality);
      }
      quality = Math.min(1, Math.max(0, quality));
      console.log('🎵 Final quality after normalization:', quality);
    } catch (error) {
      console.error('❌ Error calculating quality:', error);
      quality = 0.5;
    }

    const modal = document.createElement('div');
    modal.className = 'midi-modal';
    modal.innerHTML = `
      <div class="midi-modal-content">
        <div class="midi-modal-header">
          <h3>🎵 MIDI RECORDING DETAILS</h3>
          <button class="midi-modal-close" onclick="this.closest('.midi-modal').remove()">✕</button>
        </div>
        <div class="midi-modal-body">
          <div class="midi-details-grid">
            <div class="midi-detail-row">
              <span class="midi-detail-label">Filename:</span>
              <span class="midi-detail-value">${recording.filename}</span>
            </div>
            <div class="midi-detail-row">
              <span class="midi-detail-label">Timestamp:</span>
              <span class="midi-detail-value">${new Date(recording.timestamp).toLocaleString()}</span>
            </div>
            <div class="midi-detail-row">
              <span class="midi-detail-label">Notes Count:</span>
              <span class="midi-detail-value">${recording.notesCount || recording.notes || 0}</span>
            </div>
            <div class="midi-detail-row">
              <span class="midi-detail-label">Duration:</span>
              <span class="midi-detail-value">${this.formatDuration(recording.duration)}</span>
            </div>
            <div class="midi-detail-row">
              <span class="midi-detail-label">Quality Score:</span>
              <span class="midi-detail-value" style="color: ${this.getQualityColor(quality)}">${(typeof quality === 'number' && !isNaN(quality)) ? quality.toFixed(3) : 'N/A'}</span>
            </div>
          </div>

          <div class="midi-actions">
            <button class="midi-action-btn" onclick="dashboard.playMidiRecording('${recording.filename}')">🎵 Play</button>
            <button class="midi-action-btn" onclick="dashboard.stopMidiRecording()">⏹️ Stop</button>
            <button class="midi-action-btn" onclick="dashboard.downloadMidiRecording('${recording.filename}')">💾 Download</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async playMidiRecording(filename) {
    try {
      console.log(`🎵 Iniciando reproducción de: ${filename}`);

      // Mostrar notificación de carga
      this.showNotification(`🎵 Cargando: ${filename}...`);

      // Inicializar Tone.js si no está inicializado
      if (!this.toneInitialized) {
        await this.initializeTonePlayer();
      }

      // Descargar el archivo MIDI
      const response = await fetch(`/api/midi/download/${filename}`);
      if (!response.ok) {
        throw new Error(`Error descargando archivo: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log(`📥 Archivo descargado, tamaño: ${arrayBuffer.byteLength} bytes`);

      // Convertir ArrayBuffer a Uint8Array
      const midiData = new Uint8Array(arrayBuffer);

      // Verificar que tenemos datos
      if (midiData.length === 0) {
        throw new Error('Archivo MIDI vacío');
      }

      console.log(`🎵 Datos MIDI preparados, reproduciendo...`);

      // Usar Tone.js para reproducir el MIDI
      // Nota: Tone.js no tiene soporte nativo para MIDI files, pero podemos crear una implementación básica
      // Por ahora, vamos a crear una secuencia simple basada en los datos del archivo
      this.playMidiWithTone(midiData);

      this.showNotification(`🎵 Reproduciendo: ${filename}`);

    } catch (error) {
      console.error('❌ Error reproduciendo MIDI:', error);
      this.showNotification(`❌ Error reproduciendo: ${error.message}`);
    }
  }

  async initializeTonePlayer() {
    return new Promise((resolve, reject) => {
      try {
        console.log('🎵 Inicializando Tone.js...');

        // Verificar que Tone.js está cargado
        if (typeof Tone !== 'undefined') {
          console.log('✅ Tone.js detectado correctamente');

          // Inicializar el contexto de audio
          Tone.start().then(() => {
            console.log('✅ Contexto de audio de Tone.js inicializado');

            // Crear un sintetizador simple
            this.synth = new Tone.Synth().toDestination();

            this.toneInitialized = true;
            resolve();
          }).catch(error => {
            console.error('❌ Error inicializando contexto de audio:', error);
            reject(new Error(`Error inicializando audio: ${error}`));
          });
        } else {
          console.error('❌ Tone.js no está disponible');
          reject(new Error('Tone.js no está disponible. Verifica tu conexión a internet y que la librería se incluyó correctamente.'));
        }

      } catch (error) {
        console.error('❌ Error en initializeTonePlayer:', error);
        reject(error);
      }
    });
  }

  playMidiWithTone(midiData) {
    try {
      console.log('🎵 Reproduciendo MIDI con Tone.js...');

      // Esta es una implementación simplificada
      // En un escenario real, necesitaríamos un parser MIDI completo
      // Por ahora, vamos a crear una secuencia simple de notas

      // Crear una secuencia de notas de ejemplo (esto debería ser parseado del archivo MIDI real)
      const notes = ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4'];

      // Crear una secuencia con Tone.js
      const sequence = new Tone.Sequence((time, note) => {
        this.synth.triggerAttackRelease(note, '8n', time);
      }, notes, '4n');

      // Iniciar el transporte y reproducir
      Tone.Transport.start();
      sequence.start();

      // Detener después de un tiempo
      setTimeout(() => {
        sequence.stop();
        Tone.Transport.stop();
        console.log('🎵 Reproducción MIDI completada');
      }, 5000); // 5 segundos

    } catch (error) {
      console.error('❌ Error reproduciendo con Tone.js:', error);
      this.showNotification('❌ Error en reproducción MIDI');
    }
  }

  async stopMidiRecording() {
    try {
      // Detener el transporte de Tone.js
      if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        console.log('🎵 Reproducción MIDI detenida con Tone.js');
        this.showNotification('⏹️ Reproducción detenida');
      }
    } catch (error) {
      console.error('❌ Error deteniendo MIDI:', error);
    }
  }

  async downloadMidiRecording(filename) {
    try {
      console.log(`💾 Descargando archivo MIDI: ${filename}`);

      // Descargar el archivo
      const response = await fetch(`/api/midi/download/${filename}`);
      if (!response.ok) {
        throw new Error(`Error descargando archivo: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Archivo MIDI descargado: ${filename}`);
      this.showNotification(`💾 Archivo descargado: ${filename}`);

    } catch (error) {
      console.error('❌ Error descargando MIDI:', error);
      this.showNotification(`❌ Error descargando: ${error.message}`);
    }
  }

  async refreshMidiData() {
    console.log('🔄 Refreshing MIDI data...');
    await this.loadMidiData();
    this.renderMidiSection();
    this.showNotification('🎵 MIDI data refreshed');
  }

  updateMidiData(newData) {
    console.log('🎵 Updating MIDI data:', newData);

    if (newData.recordings) {
      // Update MIDI recordings data
      this.midiData = newData.recordings;
      console.log('🎵 MIDI recordings updated:', this.midiData.length, 'recordings');
    }

    // Re-render MIDI section
    this.renderMidiSection();

    // Add visual feedback for new MIDI generation
    this.addMidiUpdateAnimation();

    // Show notification for new music
    if (newData.recordings && newData.recordings.length > 0) {
      const latestRecording = newData.recordings[0];
      this.showNotification(`🎵 Nueva música generada: ${latestRecording.filename}`);
    }
  }

  addMidiUpdateAnimation() {
    // Add animation class to all MIDI recordings
    const midiRecordings = document.querySelectorAll('.midi-recording');
    midiRecordings.forEach(recording => {
      recording.classList.add('updated');
      setTimeout(() => recording.classList.remove('updated'), 1000);
    });
  }

  // ============================================
  // �🎯 FORJA 9.0 INTENTION PANEL METHODS
  // ============================================

  async sendIntentionCommand(profile) {
    try {
      console.log(`🎯 Enviando comando de intención: ${profile}`);

      // Obtener valores actuales de los controles
      const templateBias = document.getElementById('template-bias').value || 'chaotic'; // Default to 'chaotic' if empty
      const elementPreference = document.getElementById('element-preference').value || 'fire'; // Default to 'fire' if empty
      const numerologyWeight = parseFloat(document.getElementById('numerology-weight').value) || 0;

      const requestData = {
        profile: profile,
        template_bias: templateBias,
        element_preference: elementPreference,
        numerology_weight: numerologyWeight,
        count: 1
      };

      console.log('📡 Enviando datos de intención:', requestData);

      const response = await fetch('/api/intention/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        this.currentIntention.profile = profile;
        this.updateCurrentIntentionDisplay();
        this.showNotification(`🎯 Intención ${profile} enviada exitosamente`);
        console.log(`✅ Comando de intención ${profile} enviado`);
      } else {
        console.error('❌ Error enviando comando de intención:', data.error);
        this.showNotification(`❌ Error enviando intención: ${data.error}`);
      }
    } catch (error) {
      console.error('Error enviando comando de intención:', error);
      this.showNotification('❌ Error enviando comando de intención');
    }
  }

  updateIntentionModifiers() {
    const templateBias = document.getElementById('template-bias')?.value || '';
    const elementPreference = document.getElementById('element-preference')?.value || '';
    const numerologyWeight = parseFloat(document.getElementById('numerology-weight')?.value || '0');

    this.currentIntention.modifiers = {
      templateBias: templateBias,
      elementPreference: elementPreference,
      numerologyWeight: numerologyWeight
    };

    // Actualizar display del valor de numerology weight
    const numerologyValueEl = document.getElementById('numerology-value');
    if (numerologyValueEl) {
      numerologyValueEl.textContent = numerologyWeight.toFixed(1);
    }

    console.log('🔧 Modificadores de intención actualizados:', this.currentIntention.modifiers);
    this.updateCurrentIntentionDisplay();
  }

  updateCurrentIntentionDisplay() {
    const displayEl = document.getElementById('current-intention');
    if (displayEl) {
      if (this.currentIntention.profile) {
        let text = `Perfil: ${this.currentIntention.profile.toUpperCase()}`;
        const modifiers = [];

        if (this.currentIntention.modifiers.templateBias) {
          modifiers.push(`Template: ${this.currentIntention.modifiers.templateBias}`);
        }
        if (this.currentIntention.modifiers.elementPreference) {
          modifiers.push(`Elemento: ${this.currentIntention.modifiers.elementPreference}`);
        }
        if (this.currentIntention.modifiers.numerologyWeight > 0) {
          modifiers.push(`Numerología: ${this.currentIntention.modifiers.numerologyWeight.toFixed(1)}`);
        }

        if (modifiers.length > 0) {
          text += ` | ${modifiers.join(', ')}`;
        }

        displayEl.textContent = text;
        displayEl.style.color = '#9d4edd';
      } else {
        displayEl.textContent = 'Sin intención activa';
        displayEl.style.color = '#666';
      }
    }
  }

  async generateWithIntention() {
    // PREVENIR DUPLICADOS: Verificar si ya hay una generación en progreso
    if (this.isGenerating) {
      return;
    }
    this.isGenerating = true;

    // Verificar si el perfil está seleccionado
    const hasProfile = this.currentIntention && this.currentIntention.profile;

    if (!hasProfile) {
      this.showNotification('⚠️ Selecciona un perfil de intención primero');
      this.isGenerating = false; // Reset flag
      return;
    }

    try {
      console.log('🎨 Generando con intención actual...');

      // Obtener valores actuales de los controles
      const templateBiasEl = document.getElementById('template-bias');
      const elementPreferenceEl = document.getElementById('element-preference');
      const numerologyWeightEl = document.getElementById('numerology-weight');

      const templateBias = templateBiasEl ? templateBiasEl.value || 'chaotic' : 'chaotic';
      const elementPreference = elementPreferenceEl ? elementPreferenceEl.value || 'fire' : 'fire';
      const numerologyWeight = numerologyWeightEl ? parseFloat(numerologyWeightEl.value) || 0 : 0;

      const requestData = {
        profile: this.currentIntention.profile,
        template_bias: templateBias,
        element_preference: elementPreference,
        numerology_weight: numerologyWeight,
        count: 1
      };

      const response = await fetch('/api/intention/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        this.showNotification(`🎨 Generación con intención ${this.currentIntention.profile} iniciada`);
        console.log('✅ Generación con intención iniciada:', data.data);
      } else {
        console.error('❌ Error en generación con intención:', data.error);
        this.showNotification(`❌ Error en generación: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ Error generando con intención:', error);
      console.error('❌ Error stack:', error.stack);
      this.showNotification('❌ Error generando con intención: ' + error.message);
    } finally {
      // SIEMPRE resetear el flag, incluso si hay error
      this.isGenerating = false;
    }
  }
}

// ============================================
// ✨ PARTICLE SYSTEM CLASS
// ============================================

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.config = {
      harmony: 0,
      memory: 0,
      consensus: 0,
      vitality: 0
    };
    this.animationId = null;
  }

  init() {
    this.resizeCanvas();
    this.createParticles();
    this.animate();

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
  }

  createParticles() {
    this.particles = [];
    const particleCount = Math.max(100, Math.min(800, Math.floor(this.config.vitality * 800)));

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.8 + 0.2,
        color: this.getParticleColor()
      });
    }
  }

  getParticleColor() {
    // Color basado en harmony y consensus
    const harmony = this.config.harmony;
    const consensus = this.config.consensus;

    if (harmony > 0.8 && consensus > 0.8) {
      return '#00ff88'; // Verde brillante - estado óptimo
    } else if (harmony > 0.6) {
      return '#0088ff'; // Azul - buen estado
    } else if (consensus > 0.5) {
      return '#ffff00'; // Amarillo - estado medio
    } else {
      return '#ff4444'; // Rojo - estado crítico
    }
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.createParticles(); // Recrear partículas con nueva configuración
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Actualizar y dibujar partículas
    this.particles.forEach(particle => {
      this.updateParticle(particle);
      this.drawParticle(particle);
    });

    // Dibujar conexiones entre partículas cercanas
    this.drawConnections();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  updateParticle(particle) {
    // Movimiento basado en harmony
    const harmonyFactor = this.config.harmony;
    particle.x += particle.vx * (0.5 + harmonyFactor);
    particle.y += particle.vy * (0.5 + harmonyFactor);

    // Rebote en bordes
    if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
    if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

    // Variación de alpha basado en vitality
    particle.alpha = 0.2 + (this.config.vitality * 0.8) * Math.sin(Date.now() * 0.001 + particle.x * 0.01);
  }

  drawParticle(particle) {
    this.ctx.save();
    this.ctx.globalAlpha = particle.alpha;
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawConnections() {
    const maxDistance = 100;
    const vitality = this.config.vitality;

    this.ctx.strokeStyle = `rgba(255, 255, 255, ${vitality * 0.3})`;
    this.ctx.lineWidth = 0.5;

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

        if (distance < maxDistance) {
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// Inicializar dashboard al cargar
function initializeDashboard() {
  console.log('🌟 Inicializando dashboard...');
  console.log('🔍 Verificando elementos del DOM...');

  const contentElement = document.getElementById('content');
  const statusElement = document.getElementById('status-indicator');

  console.log('📍 Elemento #content:', contentElement);
  console.log('📍 Elemento #status-indicator:', statusElement);

  if (!contentElement) {
    console.error('❌ ERROR CRÍTICO: Elemento #content no existe en el DOM');
    alert('Error crítico: Elemento #content no encontrado. Revisa el HTML.');
    return;
  }

  if (!statusElement) {
    console.error('❌ ERROR CRÍTICO: Elemento #status-indicator no existe en el DOM');
    alert('Error crítico: Elemento #status-indicator no encontrado. Revisa el HTML.');
    return;
  }

  console.log('✅ Todos los elementos del DOM encontrados, creando dashboard...');

  try {
    const dashboard = new SeleneDashboard();
    // Hacer dashboard global para los onclick handlers
    window.dashboard = dashboard;
    console.log('🎸 Selene Dashboard con Control Panel iniciado');

    // Agregar manejador global de errores
    window.addEventListener('error', (event) => {
      console.error('❌ [GLOBAL ERROR]', event.error);
      console.error('❌ [GLOBAL ERROR] Message:', event.message);
      console.error('❌ [GLOBAL ERROR] Filename:', event.filename);
      console.error('❌ [GLOBAL ERROR] Line:', event.lineno);
    });

    // Agregar manejador global de promesas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      console.error('❌ [UNHANDLED PROMISE REJECTION]', event.reason);
    });

    console.log('✅ Dashboard completamente inicializado con manejadores de error');
  } catch (error) {
    console.error('❌ Error creando dashboard:', error);
    alert('Error creando dashboard: ' + error.message);
  }
}

// Verificar si el DOM ya está cargado
if (document.readyState === 'loading') {
  // DOM aún no está listo, esperar
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  // DOM ya está listo, inicializar inmediatamente
  initializeDashboard();
}