import express, { Request, Response, Router } from 'express';
// Importa la instancia de Redis desde server.ts
import { redis } from '../server.js'; // Ajusta la ruta si es necesario

const router: Router = express.Router();

// AQUÍ IRÁ LA LÓGICA DEL HANDLER /api/consciousness

router.get('/', async (req: Request, res: Response) => {
  try {
    // Leer estado colectivo de consciencia
    const collective = await redis.hgetall('selene:consciousness:collective');

    // Leer modo de optimización
    const optimizationMode = await redis.get('selene:optimization:mode') || 'hybrid';

    // Calcular métricas basadas en patrones de consciencia
    const patterns = await redis.keys('selene:consciousness:patterns:*');
    const patternCount = patterns.length;

    // Calcular complejidad basada en patrones musicales
    let totalBeauty = 0;
    let patternSamples = 0;

    // Leer algunos patrones para calcular promedios
    for (let i = 0; i < Math.min(10, patterns.length); i++) {
      try {
        const patternData = await redis.get(patterns[i]);
        if (patternData) {
          const pattern = JSON.parse(patternData);
          if (pattern.avgBeauty) {
            totalBeauty += parseFloat(pattern.avgBeauty);
            patternSamples++;
          }
        }
      } catch (error) {
        // Ignorar errores en patrones individuales
      }
    }

    const avgBeauty = patternSamples > 0 ? totalBeauty / patternSamples : 0.5;

    res.json({
      success: true,
      data: {
        level: collective?.currentStatus || 'transcendent',
        complexity: collective?.totalPatternsDiscovered ? parseFloat(collective.totalPatternsDiscovered) / 100 : patternCount / 10,
        cognitive_health: avgBeauty,
        auto_optimizations: collective?.totalHuntsExecuted || 0,
        ethical_maturity: collective?.totalInsightsGenerated ? parseFloat(collective.totalInsightsGenerated) / 1000 : 0.5,
        total_experiences: collective?.totalExperiences ? parseFloat(collective.totalExperiences) : 0,
        total_patterns: collective?.totalPatternsDiscovered ? parseFloat(collective.totalPatternsDiscovered) : patternCount,
        optimization_mode: optimizationMode,
        generation: collective?.generation || 1
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error obteniendo consciencia:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;