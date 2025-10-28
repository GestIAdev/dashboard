import express, { Request, Response, Router } from 'express';
import { redis } from '../server.js';
import * as path from 'path';
import { calculateTrend } from '../utils/index.js';
import { io } from '../server.js';

const router: Router = express.Router();

/**
 * 🧬 GET /api/evolution/suggestions - Obtener sugerencias evolutivas pendientes
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const suggestionsData = await redis.get('selene:evolution:suggestions');
    const suggestions = suggestionsData ? JSON.parse(suggestionsData) : [];

    res.json({
      success: true,
      data: suggestions,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error obteniendo sugerencias evolutivas:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * 💬 POST /api/evolution/feedback - Enviar feedback sobre sugerencia evolutiva
 */
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const feedbackEntry = req.body;

    // Validar feedback
    if (!feedbackEntry.suggestionId || !feedbackEntry.action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: suggestionId and action'
      });
    }

    // Publicar feedback a Redis channel
    await redis.publish('selene:evolution:feedback', JSON.stringify(feedbackEntry));

    // Guardar feedback en historial
    const feedbackKey = `selene:evolution:feedback:${feedbackEntry.suggestionId}`;
    await redis.set(feedbackKey, JSON.stringify(feedbackEntry), 'EX', 86400); // 24h

    res.json({
      success: true,
      data: { message: 'Feedback submitted successfully' },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error enviando feedback evolutivo:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * 🔀 POST /api/evolution/mode - THE SWITCH: Cambiar modo evolutivo
 * DETERMINISTIC (🎯) → Pureza | BALANCED (⚖️) → Opción D | PUNK (💀) → Caos
 */
router.post('/mode', async (req: Request, res: Response) => {
  try {
    const { mode } = req.body;

    // Validar modo
    const validModes = ['deterministic', 'balanced', 'punk'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        error: `Invalid mode. Must be one of: ${validModes.join(', ')}`
      });
    }

    // Importar ModeManager dinámicamente (desde dashboard-new/src hacia raíz/selene/dist/src)
    const modulePath = path.resolve(__dirname, '../../selene/dist/src/evolutionary/modes/mode-manager.js');
    const { ModeManager } = await import(modulePath);
    
    // Cambiar modo
    ModeManager.getInstance().setMode(mode);
    
    // Obtener configuración actualizada
    const config = ModeManager.getInstance().getModeConfig();
    
    // Publicar cambio a Redis para otros servicios
    await redis.publish('selene:evolution:mode_change', JSON.stringify({
      mode,
      config,
      timestamp: Date.now()
    }));
    
    // Broadcast a todos los clientes conectados vía Socket.IO
    io.emit('evolution:mode_change', { mode, config });
    
    console.log(`🔀 [THE SWITCH] Mode changed to: ${mode.toUpperCase()}`);
    console.log(`   ├─ Entropy Factor: ${config.entropyFactor}%`);
    console.log(`   ├─ Risk Threshold: ${config.riskThreshold}`);
    console.log(`   └─ Punk Probability: ${config.punkProbability}%`);

    res.json({
      success: true,
      mode,
      config,
      message: `✅ Switched to ${mode.toUpperCase()} mode`,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Error switching evolution mode:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🎯 GET /api/evolution/quota - Obtener estado de quota evolutiva
 */
router.get('/quota', async (req: Request, res: Response) => {
  try {
    const quotaData = await redis.get('selene:evolution:quota');
    const quota = quotaData ? JSON.parse(quotaData) : {
      usedToday: 0,
      quotaLimit: 5,
      canGenerate: true
    };

    res.json({
      success: true,
      data: quota,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error obteniendo quota evolutiva:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * 🛡️ GET /api/evolution/safety - Obtener estado de seguridad evolutiva
 */
router.get('/safety', async (req: Request, res: Response) => {
  try {
    const safetyData = await redis.get('selene:evolution:safety');
    const safety = safetyData ? JSON.parse(safetyData) : {
      containmentLevel: '60%',
      sanityScore: '80%',
      quarantineCount: 0,
      rollbackReady: true
    };

    res.json({
      success: true,
      data: safety,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error obteniendo estado de seguridad evolutiva:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * 📈 GET /api/evolution/metrics - Obtener métricas evolutivas
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metricsData = await redis.get('selene:evolution:metrics');
    const metrics = metricsData ? JSON.parse(metricsData) : {
      patternsGenerated: 0,
      avgHarmony: '0.00',
      avgNovelty: '0.00',
      safePercentage: '100%',
      approvalRate: '0%'
    };

    res.json({
      success: true,
      data: metrics,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error obteniendo métricas evolutivas:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * 🛡️🔒 GET /api/evolution/security/status - Estado de seguridad evolutiva completo
 * FASE 4.3 - Panel de Seguridad
 */
router.get('/security/status', async (req: Request, res: Response) => {
  try {
    // Obtener datos de seguridad desde Redis
    const [sanityData, rollbackData, containmentData, incidentsData, metricsData] = await Promise.all([
      redis.get('selene:evolution:sanity'),
      redis.get('selene:evolution:rollback:stats'),
      redis.get('selene:evolution:containment'),
      redis.get('selene:evolution:security:incidents'),
      redis.get('selene:evolution:metrics')
    ]);

    // Parsear sanity assessment
    const sanity = sanityData ? JSON.parse(sanityData) : {
      sanityLevel: 0.95,
      concerns: [],
      recommendations: [],
      requiresIntervention: false,
      interventionType: 'none'
    };

    // Parsear rollback stats
    const rollbackStats = rollbackData ? JSON.parse(rollbackData) : {
      totalRegistered: 0,
      totalExecuted: 0,
      successRate: 100,
      avgRecoveryTime: 0,
      lastRollback: null
    };

    // Parsear containment status
    const containment = containmentData ? JSON.parse(containmentData) : {
      activeContainments: 0,
      containmentLevels: {
        none: 0,
        low: 0,
        medium: 0,
        high: 0,
        maximum: 0
      },
      quarantinedPatterns: 0
    };

    // Parsear security incidents
    const incidents = incidentsData ? JSON.parse(incidentsData) : [];

    // Parsear métricas para contexto de seguridad
    const metrics = metricsData ? JSON.parse(metricsData) : {
      patternsGenerated: 0,
      safePercentage: '100%'
    };

    // Calcular estado general de seguridad
    const securityScore = (
      sanity.sanityLevel * 0.4 +
      (rollbackStats.successRate / 100) * 0.3 +
      (containment.activeContainments === 0 ? 1 : 0.7) * 0.3
    );

    // Determinar nivel de alerta
    let alertLevel: 'safe' | 'warning' | 'danger' | 'critical' = 'safe';
    if (securityScore < 0.5) alertLevel = 'critical';
    else if (securityScore < 0.7) alertLevel = 'danger';
    else if (securityScore < 0.85) alertLevel = 'warning';

    res.json({
      success: true,
      data: {
        sanity,
        rollbackStats,
        containment,
        incidents: incidents.slice(0, 10), // Últimos 10 incidentes
        securityScore: Math.round(securityScore * 100) / 100,
        alertLevel,
        systemStatus: {
          evolutionActive: true,
          safetySystemsOnline: true,
          lastSecurityCheck: Date.now()
        }
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error obteniendo estado de seguridad evolutiva:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * 📊📈 GET /api/evolution/metrics/history - Historial de métricas evolutivas
 * FASE 4.4 - Métricas Evolutivas con Timeline
 */
router.get('/metrics/history', async (req: Request, res: Response) => {
  try {
    const timeRangeParam = (req.query.range as string) || '1h'; // 1h, 6h, 24h, 7d
    const limit = parseInt(req.query.limit as string) || 100;

    // Obtener historial desde Redis sorted sets
    const historyData = await redis.zrevrange(
      'selene:evolution:metrics:timeline',
      0,
      limit - 1,
      'WITHSCORES'
    );

    // Parsear timeline data
    const timeline = [];
    for (let i = 0; i < historyData.length; i += 2) {
      const entry = JSON.parse(historyData[i]);
      const timestamp = parseInt(historyData[i + 1]);
      timeline.push({ ...entry, timestamp });
    }

    // Filtrar por rango de tiempo si es necesario
    const now = Date.now();
    const rangeMap: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    const rangeMs = rangeMap[timeRangeParam] || 60 * 60 * 1000;

    const filteredTimeline = timeline.filter(entry => 
      (now - entry.timestamp) <= rangeMs
    );

    // Calcular agregados
    const totalPatterns = filteredTimeline.length;
    const avgCreativity = totalPatterns > 0 
      ? filteredTimeline.reduce((sum, e) => sum + (e.creativity || 0), 0) / totalPatterns 
      : 0;
    const avgNovelty = totalPatterns > 0
      ? filteredTimeline.reduce((sum, e) => sum + (e.novelty || 0), 0) / totalPatterns
      : 0;
    const avgHarmony = totalPatterns > 0
      ? filteredTimeline.reduce((sum, e) => sum + (e.harmony || 0), 0) / totalPatterns
      : 0;

    // Distribución zodiacal
    const zodiacDistribution = filteredTimeline.reduce((acc, entry) => {
      const sign = entry.zodiacSign || 'Unknown';
      acc[sign] = (acc[sign] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Tendencias
    const trends = {
      creativity: calculateTrend(filteredTimeline.map(e => e.creativity || 0)),
      novelty: calculateTrend(filteredTimeline.map(e => e.novelty || 0)),
      harmony: calculateTrend(filteredTimeline.map(e => e.harmony || 0)),
      risk: calculateTrend(filteredTimeline.map(e => e.riskLevel || 0))
    };

    res.json({
      success: true,
      data: {
        timeline: filteredTimeline,
        aggregates: {
          totalPatterns,
          avgCreativity: Math.round(avgCreativity * 100) / 100,
          avgNovelty: Math.round(avgNovelty * 100) / 100,
          avgHarmony: Math.round(avgHarmony * 100) / 100
        },
        zodiacDistribution,
        trends,
        timeRange: timeRangeParam,
        from: now - rangeMs,
        to: now
      },
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