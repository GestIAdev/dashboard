// ============================================
// 🔧 SYNERGY HUB - MONITORING & CONTROL SYSTEM
// ============================================

class SynergyHub {
  constructor() {
    this.metrics = {};
    this.pm2Data = null;
    this.charts = {};
    this.historicalData = {
      consensusHistory: [],
      memoryHistory: [],
      consensus: [], // Datos en tiempo real para consensus
      memory: [],    // Datos en tiempo real para memory
      cpu: [],       // Datos en tiempo real para CPU
      pm2Memory: []  // Datos en tiempo real para PM2 Memory
    };
    this.optimizationMode = 'hybrid';
    this.particleSystem = null;
    this.lastParticleUpdate = 0;
    this.socket = null;

    // Inicializar
    this.initialize();
  }

  async initialize() {
    console.log('🔧 Inicializando Synergy Hub...');

    // Conectar con Socket.IO
    this.connectSocket();

    // Cargar datos iniciales
    await this.loadInitialData();

    // Configurar manejadores de eventos
    this.setupEventHandlers();

    // Inicializar componentes
    this.initializeCharts();
    this.initializeParticleSystem();

    console.log('✅ Synergy Hub inicializado');
  }

  connectSocket() {
    console.log('🔌 Conectando a Socket.IO...');
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('🔗 Conectado a servidor');
      this.updateStatusIndicator(true);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Desconectado del servidor');
      this.updateStatusIndicator(false);
    });

    this.socket.on('metrics_update', (data) => {
      console.log('📊 Métricas recibidas:', data);
      // Extraer las métricas del objeto data.data
      const metricsData = data.data || data;
      // Si los datos tienen estructura {metrics: {...}, consensus: {...}}, combinarlos
      const metrics = metricsData.metrics ? { ...metricsData.metrics, ...metricsData.consensus } : metricsData;
      this.updateMetrics(metrics);
    });

    this.socket.on('pm2', (data) => {
      console.log('🔧 Datos PM2 recibidos:', data);
      this.updatePM2Data(data);
    });

    this.socket.on('poems', (data) => {
      console.log('📜 Datos de poesías recibidos:', data);
      this.updatePoemsData(data);
    });

    this.socket.on('midi', (data) => {
      console.log('🎵 Datos MIDI recibidos:', data);
      this.updateMidiData(data);
    });
  }

  async loadInitialData() {
    try {
      console.log('📥 Cargando datos iniciales...');

      // Cargar métricas
      const metricsResponse = await fetch('/api/metrics');
      const metricsData = await metricsResponse.json();
      console.log('📊 Respuesta métricas:', metricsData);

      if (metricsData.success) {
        this.metrics = metricsData.data;
        console.log('📊 Métricas iniciales cargadas:', this.metrics);
        // Actualizar UI con datos iniciales
        this.updateMetrics(this.metrics);
      }

      // Cargar datos PM2
      const pm2Response = await fetch('/api/pm2/status');
      const pm2Data = await pm2Response.json();
      console.log('🔧 Respuesta PM2:', pm2Data);

      if (pm2Data.success) {
        // Estructurar los datos como espera el código
        this.pm2Data = {
          processes: pm2Data.data,
          summary: pm2Data.summary
        };
        console.log('🔧 Datos PM2 iniciales cargados:', this.pm2Data);
        // Actualizar UI con datos iniciales
        this.updatePM2Data(this.pm2Data);
      }

      // Cargar datos históricos
      await this.refreshHistoricalData();

      // Cargar modo de optimización
      // await this.loadOptimizationMode(); // COMENTADO EN FASE 4

      // Cargar sugerencias pendientes
      // await this.loadPendingSuggestions(); // COMENTADO EN FASE 4

      console.log('✅ Datos iniciales cargados');
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
    }
  }

  setupEventHandlers() {
    // Botones de modo de optimización
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        this.changeOptimizationMode(mode);
      });
    });
  }

  // ============================================
  // 📊 CHARTS MANAGEMENT
  // ============================================

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

  destroyCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    this.charts = {};
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

  // ============================================
  // 🔧 PM2 MONITORING
  // ============================================

  updatePM2Data(newData) {
    console.log('🖥️ updatePM2Data called with:', newData);
    // El servidor envía {timestamp, data: {processes, summary}}
    // Extraer la estructura correcta
    const pm2Data = newData.data || newData;
    this.pm2Data = pm2Data;
    console.log('🔧 PM2 data structure:', this.pm2Data);
    // Re-renderizar sección PM2
    const pm2Section = document.getElementById('pm2-monitor-content');
    if (pm2Section) {
      pm2Section.innerHTML = this.renderPM2Monitor();
    }
    // Actualizar gráficos PM2 con datos en tiempo real
    this.updatePM2Charts(pm2Data);
  }

  renderPM2Monitor() {
    console.log('🔧 Renderizando PM2 monitor con datos:', this.pm2Data);

    if (!this.pm2Data || !this.pm2Data.processes) {
      console.warn('⚠️ No hay datos de procesos PM2 disponibles');
      return `
        <div class="pm2-loading">Cargando datos PM2...</div>
      `;
    }

    const processes = this.pm2Data.processes;
    const summary = this.pm2Data.summary || {};

    console.log('🔧 Procesos PM2:', processes.length, 'procesos encontrados');
    console.log('🔧 Summary PM2:', summary);

    return `
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

  // ============================================
  // 📊 METRICS MANAGEMENT
  // ============================================

  async loadInitialData() {
    console.log('🔄 Cargando datos iniciales...');

    try {
      // Cargar métricas
      const metricsResponse = await fetch('/api/metrics');
      const metricsData = await metricsResponse.json();
      console.log('📊 Respuesta métricas:', metricsData);

      if (metricsData.success) {
        this.metrics = metricsData.data;
        console.log('📊 Métricas iniciales cargadas:', this.metrics);
        // Actualizar UI con datos iniciales
        this.updateMetrics(this.metrics);
      }

      // Cargar datos PM2
      const pm2Response = await fetch('/api/pm2/status');
      const pm2Data = await pm2Response.json();
      console.log('🔧 Respuesta PM2:', pm2Data);

      if (pm2Data.success) {
        // Estructurar los datos como espera el código
        this.pm2Data = {
          processes: pm2Data.data,
          summary: pm2Data.summary
        };
        console.log('🔧 Datos PM2 iniciales cargados:', this.pm2Data);
        // Actualizar UI con datos iniciales
        this.updatePM2Data(this.pm2Data);
      }

      // Cargar datos históricos para gráficos
      await this.loadHistoricalData();

      console.log('✅ Datos iniciales cargados completamente');
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
    }
  }

  async loadHistoricalData() {
    console.log('📈 Cargando datos históricos para gráficos...');

    try {
      const response = await fetch('/api/metrics/history');
      const data = await response.json();
      console.log('📈 Respuesta datos históricos:', data);

      if (data.success && data.data && data.data.length > 0) {
        // Actualizar datos históricos para gráficos de doble línea
        this.historicalData.consensusHistory = data.data.map(d => ({
          timestamp: d.timestamp,
          value: d.metrics.consensus_quality * 100
        }));
        this.historicalData.memoryHistory = data.data.map(d => ({
          timestamp: d.timestamp,
          value: d.metrics.memory_mb
        }));

        console.log('📈 Datos históricos cargados:', data.data.length, 'puntos');

        // Inicializar gráficos con datos históricos
        this.initializeCharts();
      } else {
        console.warn('⚠️ No se pudieron cargar datos históricos o están vacíos');
        // Inicializar con arrays vacíos
        this.historicalData.consensusHistory = [];
        this.historicalData.memoryHistory = [];
      }
    } catch (error) {
      console.error('❌ Error cargando datos históricos:', error);
      // Inicializar con arrays vacíos en caso de error
      this.historicalData.consensusHistory = [];
      this.historicalData.memoryHistory = [];
    }
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

  updateMetrics(newMetrics) {
    console.log('🔄 Actualizando métricas:', newMetrics);
    // Actualizar métricas internas
    this.metrics = { ...this.metrics, ...newMetrics };

    // Actualizar UI con validaciones para evitar NaN
    this.updateMetricValue('Consensus Quality', (newMetrics.consensus_quality && !isNaN(newMetrics.consensus_quality)) ? (newMetrics.consensus_quality * 100).toFixed(1) + '%' : 'N/A');
    this.updateMetricValue('Harmony Score', (newMetrics.harmony_score && !isNaN(newMetrics.harmony_score)) ? (newMetrics.harmony_score * 100).toFixed(1) + '%' : 'N/A');
    this.updateMetricValue('Active Nodes', newMetrics.active_nodes || 'N/A');
    this.updateMetricValue('Memory (MB)', (newMetrics.memory_mb && !isNaN(newMetrics.memory_mb)) ? newMetrics.memory_mb.toFixed(2) : 'N/A');
    this.updateMetricValue('Meta-Complexity', (newMetrics.meta_complexity && !isNaN(newMetrics.meta_complexity)) ? (newMetrics.meta_complexity * 100).toFixed(1) + '%' : 'N/A');
    this.updateMetricValue('XP Level', newMetrics.xp || 'N/A');
    this.updateMetricValue('Heap Usage', (newMetrics.heap_usage_percent && !isNaN(newMetrics.heap_usage_percent)) ? newMetrics.heap_usage_percent.toFixed(1) + '%' : 'N/A');
    this.updateMetricValue('Event Loop Latency', (newMetrics.event_loop_latency_ms && !isNaN(newMetrics.event_loop_latency_ms)) ? newMetrics.event_loop_latency_ms.toFixed(2) + 'ms' : 'N/A');

    // Actualizar info de partículas
    this.updateParticleInfo(newMetrics);

    // Actualizar gráficos
    this.updateCharts(newMetrics);
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

  updateParticleInfo(metrics) {
    const harmonyEl = document.getElementById('harmony-value');
    const vitalityEl = document.getElementById('vitality-value');
    const memoryEl = document.getElementById('memory-value');

    if (harmonyEl) harmonyEl.textContent = `${(metrics.harmony_score && !isNaN(metrics.harmony_score)) ? (metrics.harmony_score * 100).toFixed(1) : 'N/A'}%`;
    if (vitalityEl) vitalityEl.textContent = `${((metrics.harmony_score && metrics.consensus_quality && !isNaN(metrics.harmony_score) && !isNaN(metrics.consensus_quality)) ? ((metrics.harmony_score + metrics.consensus_quality) / 2 * 100).toFixed(1) : 'N/A')}%`;
    if (memoryEl) memoryEl.textContent = `${(metrics.memory_mb && !isNaN(metrics.memory_mb)) ? metrics.memory_mb.toFixed(2) : 'N/A'} MB`;
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
  // 🎛️ LEGACY OPTIMIZATION MODE MANAGEMENT - COMENTADO PARA FASE 4
  // ============================================

  // async loadOptimizationMode() {
  //   try {
  //     const response = await fetch('/api/optimization/mode');
  //     const data = await response.json();

  //     if (data.success) {
  //       this.updateOptimizationMode(data.data.mode);
  //     }
  //   } catch (error) {
  //     console.error('Error cargando modo de optimización:', error);
  //   }
  // }

  // updateOptimizationMode(mode) {
  //   this.optimizationMode = mode;

  //   // Actualizar botones
  //   document.querySelectorAll('.mode-btn').forEach(btn => {
  //     btn.classList.remove('active');
  //   });

  //   const activeBtn = document.getElementById(`mode-${mode}`);
  //   if (activeBtn) {
  //     activeBtn.classList.add('active');
  //   }

  //   // Actualizar texto actual
  //   const currentModeEl = document.getElementById('current-mode');
  //   if (currentModeEl) {
  //     currentModeEl.textContent = mode.toUpperCase();
  //   }
  // }

  // async changeOptimizationMode(mode) {
  //   try {
  //     const response = await fetch('/api/optimization/mode', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ mode })
  //     });

  //     const data = await response.json();

  //     if (data.success) {
  //       console.log(`✅ Modo de optimización cambiado a: ${mode}`);
  //       this.updateOptimizationMode(mode);
  //     } else {
  //       console.error('❌ Error cambiando modo de optimización:', data.error);
  //       alert('Error cambiando modo de optimización: ' + data.error);
  //     }
  //   } catch (error) {
  //     console.error('Error cambiando modo de optimización:', error);
  //     alert('Error cambiando modo de optimización');
  //   }
  // }

  // ============================================
  // 💡 LEGACY SUGGESTIONS MANAGEMENT - COMENTADO PARA FASE 4
  // ============================================

  // async loadPendingSuggestions() {
  //   try {
  //     const response = await fetch('/api/optimization/suggestions');
  //     const data = await response.json();

  //     if (data.success) {
  //       this.updateSuggestionsList(data.data);
  //     }
  //   } catch (error) {
  //     console.error('Error cargando sugerencias:', error);
  //     // Solo intentar mostrar error si el elemento existe
  //     const container = document.getElementById('suggestions-container');
  //     if (container) {
  //       container.innerHTML = '<p>❌ Error cargando sugerencias</p>';
  //     }
  //   }
  // }

  // updateSuggestionsList(suggestions) {
  //   const container = document.getElementById('suggestions-list');

  //   if (!container) {
  //     console.warn('Elemento #suggestions-list no encontrado, omitiendo actualización de sugerencias');
  //     return;
  //   }

  //   // Filtrar solo sugerencias pendientes (no aprobadas ni rechazadas)
  //   const pendingSuggestions = suggestions.filter(s => s.status === 'pending_human');

  //   if (!pendingSuggestions || pendingSuggestions.length === 0) {
  //     container.innerHTML = '<p>No hay sugerencias pendientes</p>';
  //     return;
  //   }

  //   const html = pendingSuggestions.map(suggestion => `
  //     <div class="suggestion-item" data-id="${suggestion.optimizationId}">
  //       <div class="suggestion-header">
  //         <span class="suggestion-type">${suggestion.targetComponent}</span>
  //         <span class="suggestion-risk risk-${suggestion.riskLevel < 0.3 ? 'low' : suggestion.riskLevel < 0.7 ? 'medium' : 'high'}">
  //         Riesgo: ${suggestion.riskLevel < 0.3 ? 'Bajo' : suggestion.riskLevel < 0.7 ? 'Medio' : 'Alto'}
  //       </span>
  //       </div>
  //       <div class="suggestion-text">
  //         <strong>${suggestion.technicalDescription}</strong>
  //       </div>
  //       <div class="suggestion-poetic">
  //         ${suggestion.poeticDescription}
  //       </div>
  //       <div class="suggestion-details">
  //         <span>Cambio: ${suggestion.oldValue} → ${suggestion.newValue}</span>
  //         <span>Mejora esperada: ${(suggestion.expectedImprovement * 100).toFixed(1)}%</span>
  //       </div>
  //       <div class="suggestion-actions">
  //         <button class="suggestion-btn approve" onclick="synergyHub.approveSuggestion('${suggestion.optimizationId}')">✅ Aprobar</button>
  //         <button class="suggestion-btn reject" onclick="synergyHub.rejectSuggestion('${suggestion.optimizationId}')">❌ Rechazar</button>
  //       </div>
  //     </div>
  //   `).join('');

  //   container.innerHTML = html;
  // }

  // async approveSuggestion(suggestionId) {
  //   await this.handleSuggestionAction(suggestionId, 'approve');
  // }

  // async rejectSuggestion(suggestionId) {
  //   const reason = prompt('Razón del rechazo (opcional):');
  //   await this.handleSuggestionAction(suggestionId, 'reject', reason);
  // }

  // async handleSuggestionAction(suggestionId, action, reason = null) {
  //   console.log(`🎯 [FRONTEND] Iniciando acción ${action} para sugerencia:`, suggestionId);

  //   try {
  //     const payload = { suggestionId, approvedBy: 'synergy-hub-user' };
  //     if (action === 'reject' && reason) {
  //       payload.reason = reason;
  //     }

  //     console.log(`📡 [FRONTEND] Enviando request a /api/optimization/suggestions/${suggestionId}/${action}`, payload);

  //     const response = await fetch(`/api/optimization/suggestions/${suggestionId}/${action}`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(payload)
  //     });

  //     console.log(`📡 [FRONTEND] Response status:`, response.status);

  //     const data = await response.json();
  //     console.log(`📡 [FRONTEND] Response data:`, data);

  //     if (data.success) {
  //       console.log(`✅ [FRONTEND] Sugerencia ${action}ada exitosamente:`, suggestionId);

  //       // Mostrar feedback visual
  //       this.showActionFeedback(action, suggestionId, 'success');

  //       // Recargar sugerencias después de un pequeño delay
  //       setTimeout(async () => {
  //         console.log(`🔄 [FRONTEND] Recargando sugerencias después de ${action}...`);
  //         await this.loadPendingSuggestions();
  //         console.log(`✅ [FRONTEND] Sugerencias recargadas`);
  //       }, 500);

  //     } else {
  //       console.error(`❌ [FRONTEND] Error ${action}ando sugerencia:`, data.error);
  //       this.showActionFeedback(action, suggestionId, 'error', data.error);
  //       alert(`Error ${action}ando sugerencia: ` + data.error);
  //     }
  //   } catch (error) {
  //     console.error(`❌ [FRONTEND] Error en handleSuggestionAction:`, error);
  //     this.showActionFeedback(action, suggestionId, 'error', error.message);
  //     alert(`Error ${action}ando sugerencia: ` + error.message);
  //   }
  // }

  // showActionFeedback(action, suggestionId, status, message = '') {
  //   // Crear feedback visual temporal
  //   const suggestionElement = document.querySelector(`[data-id="${suggestionId}"]`);
  //   if (suggestionElement) {
  //     const feedbackDiv = document.createElement('div');
  //     feedbackDiv.className = `action-feedback ${status}`;
  //     feedbackDiv.textContent = status === 'success' ?
  //       `✅ ${action === 'approve' ? 'Aprobada' : 'Rechazada'}` :
  //       `❌ Error: ${message}`;

  //     suggestionElement.appendChild(feedbackDiv);

  //     // Remover feedback después de 5 segundos
  //     setTimeout(() => {
  //       if (feedbackDiv.parentNode) {
  //         feedbackDiv.parentNode.removeChild(feedbackDiv);
  //       }
  //     }, 5000);
  //   }
  // }  // ============================================
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

  // Placeholder methods for poems and MIDI data (will be implemented if needed)
  updatePoemsData(data) {
    console.log('📜 Poems data received in Synergy Hub:', data);
    // Implementation can be added if poems monitoring is needed in Synergy Hub
  }

  updateMidiData(data) {
    console.log('🎵 MIDI data received in Synergy Hub:', data);
    // Implementation can be added if MIDI monitoring is needed in Synergy Hub
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

// Inicializar Synergy Hub al cargar
function initializeSynergyHub() {
  console.log('🔧 Inicializando Synergy Hub...');

  try {
    const synergyHub = new SynergyHub();
    // Hacer instancia global para los onclick handlers
    window.synergyHub = synergyHub;
    console.log('✅ Synergy Hub inicializado exitosamente');

  } catch (error) {
    console.error('❌ Error inicializando Synergy Hub:', error);
  }
}

// Verificar si el DOM ya está cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSynergyHub);
} else {
  initializeSynergyHub();
}