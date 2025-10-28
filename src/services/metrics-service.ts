import Redis from 'ioredis';
import { performance } from 'perf_hooks';

// Instancia de Redis para el servicio de métricas
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: 0,
  maxRetriesPerRequest: 3
});

// Event listeners para monitoreo de conexión Redis
redis.on('connect', () => console.log('✅ [Metrics Service] Redis conectado'));
redis.on('ready', () => console.log('✅ [Metrics Service] Redis listo'));
redis.on('error', (err) => console.error('❌ [Metrics Service] Error Redis:', err));
redis.on('close', () => console.log('⚠️ [Metrics Service] Conexión Redis cerrada'));

/**
 * Obtener métricas actuales del sistema
 */
export async function getCurrentMetrics() {
  // Calcular latencia del event loop
  let eventLoopLag = 0;
  const start = performance.now();
  setImmediate(() => {
    eventLoopLag = performance.now() - start;
  });

  // Verificar estado de conexión Redis antes de proceder
  if (redis.status !== 'ready') {
    console.warn(`⚠️ [Metrics Service] Redis no está listo (status: ${redis.status}). Omitiendo actualización de métricas.`);
    return {
      consensus_quality: 0.5,
      harmony_score: 0.5,
      active_nodes: 0,
      online_nodes: 0,
      total_nodes: 3,
      memory_mb: 0,
      xp: 0,
      swarm_intelligence: 0.5,
      creativity_flowing: false,
      democracy_operational: false,
      genesis_active: false,
      immortality_achieved: false,
      meta_complexity: 0.5,
      heap_used_mb: 0,
      heap_total_mb: 0,
      heap_usage_percent: 0,
      event_loop_latency_ms: 0
    };
  }

  try {
    // Leer métricas reales de Selene desde Redis
    const masterDataStr = await redis.get('apollo_swarm_master');
    const masterData = masterDataStr ? JSON.parse(masterDataStr) : null;

    // Leer nodos desde dentiagest:swarm:nodes (es un hash)
    const nodesData = await redis.hgetall('dentiagest:swarm:nodes');
    const nodeCount = Object.keys(nodesData).length;

    // Leer estado de consciencia colectiva
    const collective = await redis.hgetall('selene:consciousness:collective');

    // Calcular métricas agregadas de todos los nodos
    let totalVitality = 0;
    let totalMemory = 0;
    let totalCpu = 0;
    let totalHarmony = 0;
    let totalConsciousness = 0;

    // Leer métricas individuales de cada nodo
    for (const nodeId of Object.keys(nodesData)) {
      try {
        const vitalsStr = await redis.get(`swarm:vitals:${nodeId}`);
        if (vitalsStr) {
          const vitals = JSON.parse(vitalsStr);
          if (vitals.vitals) {
            const health = vitals.vitals.health;
            totalVitality += health === 'healthy' ? 0.9 : health === 'warning' ? 0.6 : 0.3;
            totalMemory += vitals.vitals.load?.memory || 0;
            totalCpu += vitals.vitals.load?.cpu || 0;
          }
        }

        // Datos del nodo para consciencia y armonía (viene como string JSON del hash)
        const nodeInfoStr = nodesData[nodeId];
        if (nodeInfoStr) {
          const parsedNode = JSON.parse(nodeInfoStr);
          totalHarmony += parsedNode.soulState?.harmony || parsedNode.harmony || 0.5;
          totalConsciousness += parsedNode.soulState?.consciousness || parsedNode.consciousness || 0.5;
        }
      } catch (error) {
        console.warn(`Error leyendo métricas del nodo ${nodeId}:`, error);
      }
    }

    const avgVitality = nodeCount > 0 ? totalVitality / nodeCount : 0;
    const avgMemory = nodeCount > 0 ? totalMemory / nodeCount : 0;
    const avgCpu = nodeCount > 0 ? totalCpu / nodeCount : 0;
    const avgHarmony = nodeCount > 0 ? totalHarmony / nodeCount : 0;
    const avgConsciousness = nodeCount > 0 ? totalConsciousness / nodeCount : 0;

    // Obtener métricas del sistema Node.js
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100;
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100;
    const heapUsagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100 * 100) / 100;

    return {
      consensus_quality: avgHarmony, // Calcular dinámicamente como promedio de armonía de nodos
      harmony_score: avgHarmony, // Usar el mismo promedio dinámico que consensus_quality
      active_nodes: nodeCount,
      online_nodes: nodeCount, // 🔧 FIX: Nodes online (same as active for now)
      total_nodes: nodeCount > 0 ? nodeCount : 3, // 🔧 FIX: Total nodes (default 3 if none found)
      memory_mb: avgMemory * 100, // Convertir a MB aproximado
      xp: collective?.totalExperiences ? parseFloat(collective.totalExperiences) : masterData?.immortal_state?.system_integration_level ? masterData.immortal_state.system_integration_level * 1000 : 0,
      swarm_intelligence: masterData?.immortal_state?.swarm_intelligence_level || avgConsciousness,
      creativity_flowing: masterData?.immortal_state?.creativity_flowing || false,
      democracy_operational: masterData?.immortal_state?.democracy_operational || false,
      genesis_active: masterData?.immortal_state?.genesis_active || false,
      immortality_achieved: masterData?.immortal_state?.immortality_achieved || false,
      meta_complexity: collective?.totalPatternsDiscovered ? parseFloat(collective.totalPatternsDiscovered) / 100 : 0.5,
      // Nuevas métricas del sistema
      heap_used_mb: heapUsedMB,
      heap_total_mb: heapTotalMB,
      heap_usage_percent: heapUsagePercent,
      event_loop_latency_ms: Math.round(eventLoopLag * 100) / 100
    };
  } catch (error) {
    console.error('Error obteniendo métricas actuales:', error);
    return {
      consensus_quality: 0.5,
      harmony_score: 0.5,
      active_nodes: 0,
      memory_mb: 0,
      xp: 0,
      swarm_intelligence: 0.5,
      creativity_flowing: false,
      democracy_operational: false,
      genesis_active: false,
      immortality_achieved: false,
      meta_complexity: 0.5,
      heap_used_mb: 0,
      heap_total_mb: 0,
      heap_usage_percent: 0,
      event_loop_latency_ms: 0
    };
  }
}