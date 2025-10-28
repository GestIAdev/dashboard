import express from 'express';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

// Placeholder imports - serán reemplazados cuando se creen los servicios
import { listProcesses } from '../services/pm2-service.js';
// import { redis } from '../services/redis-service';

const router = express.Router();

/**
 * 🖥️ GET /api/pm2/status - Estado COMPLETO de procesos PM2
 */
router.get('/status', async (req, res) => {
  try {
    // Llama a la función del servicio
    const processList = await listProcesses();
    res.json(processList);
  } catch (error) {
    console.error('Error fetching PM2 status via service:', error);
    res.status(500).json({ error: 'Failed to fetch PM2 status' });
  }
});

/**
 * 📈 GET /api/pm2/history - Historial de datos PM2 para gráficos
 */
router.get('/history', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string || '2');
    const limit = parseInt(req.query.limit as string || '60'); // puntos de datos

    // PLACEHOLDER: Obtener datos históricos de PM2 desde Redis
    // PLACEHOLDER: const rawHistory = await redis.lrange('selene:pm2:history', 0, limit - 1);

    // PLACEHOLDER: const history = rawHistory.map(entry => {...

    // PLACEHOLDER: Si no hay historial suficiente, generar datos basados en estado actual
    // PLACEHOLDER: if (history.length < limit) {...

    // PLACEHOLDER: Respuesta simulada para testing
    res.json({
      success: true,
      data: [],
      count: 0,
      timeframe: `${hours} hours`,
      timestamp: Date.now(),
      message: "PLACEHOLDER: PM2 history endpoint - logic moved from server.ts"
    });
  } catch (error) {
    console.error('Error obteniendo historial PM2:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;