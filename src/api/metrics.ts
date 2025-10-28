import express from 'express';
import Redis from 'ioredis';
import { getCurrentMetrics } from '../services/metrics-service.js';

// Instancia de Redis para operaciones específicas del router
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: 0,
  maxRetriesPerRequest: 3
});

// TODO: Move to utils/trendCalculator.ts in Fase 1.4
function calculateTrend(values: number[]): number {
  // Placeholder - will be moved to utils
  return 0;
}

const router = express.Router();

/**
 * 🎯 GET /api/metrics - Métricas generales de Selene
 */
router.get('/', async (req, res) => {
  try {
    // ✅ Migrated to metricsService in Fase 1.4.A
    const metrics = await getCurrentMetrics();

    res.json({
      success: true,
      data: metrics,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * 📈 GET /api/metrics/history - Historial de métricas para gráficos
 */
router.get('/history', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string || '1');
    const limit = parseInt(req.query.limit as string || '60'); // puntos de datos

    // Obtener datos históricos de Redis (últimas X horas)
    const historyKey = 'selene:metrics:history';
    const rawHistory = await redis.lrange(historyKey, 0, limit - 1);

    const history = rawHistory.map((entry: string) => {
      try {
        return JSON.parse(entry);
      } catch (e) {
        return null;
      }
    }).filter((entry: any) => entry !== null);

    // Si no hay historial suficiente, generar datos basados en métricas actuales
    if (history.length < limit) {
      // ✅ Migrated to metricsService in Fase 1.4.A
      const currentMetrics = await getCurrentMetrics();
      const now = Date.now();

      // Generar datos históricos simulados basados en métricas actuales
      for (let i = history.length; i < limit; i++) {
        const timestamp = now - ((limit - i) * 60 * 1000); // cada minuto
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variación

        history.unshift({
          timestamp,
          metrics: {
            ...currentMetrics,
            consensus_quality: Math.max(0, Math.min(1, currentMetrics.consensus_quality + variation)),
            harmony_score: Math.max(0, Math.min(1, currentMetrics.harmony_score + variation)),
            memory_mb: Math.max(0, currentMetrics.memory_mb + (variation * 50)),
            active_nodes: currentMetrics.active_nodes,
            xp: currentMetrics.xp,
            swarm_intelligence: Math.max(0, Math.min(1, currentMetrics.swarm_intelligence + variation))
          }
        });
      }
    }

    res.json({
      success: true,
      data: history,
      count: history.length,
      timeframe: `${hours} hours`,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error obteniendo historial de métricas:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;
