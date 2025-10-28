import express, { Request, Response, Router } from 'express';
// Importa la instancia de Redis desde server.ts
import { redis } from '../server.js';

const router: Router = express.Router();

// Ruta para /api/nodes (ahora es la raíz '/' del router)
router.get('/', async (req: Request, res: Response) => {
  try {
    // Leer nodos reales desde dentiagest:swarm:nodes (es un hash)
    const nodesData = await redis.hgetall('dentiagest:swarm:nodes');

    const nodes = await Promise.all(Object.keys(nodesData).map(async (nodeId) => {
      try {
        // Leer métricas vitales específicas del nodo
        const vitalsStr = await redis.get(`swarm:vitals:${nodeId}`);
        const vitals = vitalsStr ? JSON.parse(vitalsStr) : null;

        // Información básica del nodo (viene como string JSON del hash)
        const nodeInfoStr = nodesData[nodeId];
        const nodeInfo: any = nodeInfoStr ? JSON.parse(nodeInfoStr) : {};

        // Construir objeto del nodo con datos reales
        return {
          nodeId,
          vitals: {
            health: vitals?.vitals?.health || 'unknown',
            memory_mb: vitals?.vitals?.load?.memory || 0,
            cpu_percent: vitals?.vitals?.load?.cpu || 0,
            harmony_score: nodeInfo.soulState?.harmony || nodeInfo.harmony || 0.5,
            uptime: vitals?.vitals?.uptime || 0,
            connections: vitals?.vitals?.connections || 0
          },
          soul: {
            emotional_state: nodeInfo.soulState?.emotionalState || nodeInfo.emotional_state || 'calm',
            zodiac_sign: nodeInfo.soulState?.zodiacSign || nodeInfo.zodiac_sign || 'unknown',
            consciousness: nodeInfo.soulState?.consciousness || nodeInfo.consciousness || 0.5,
            creativity: nodeInfo.soulState?.creativity || nodeInfo.creativity || 0.5,
            harmony: nodeInfo.soulState?.harmony || nodeInfo.harmony || 0.5
          },
          status: nodeInfo.status || 'active',
          role: nodeInfo.role || 'worker',
          lastSeen: nodeInfo.timestamp || Date.now()
        };
      } catch (error) {
        console.warn(`Error procesando nodo ${nodeId}:`, error);
        return {
          nodeId,
          vitals: {
            health: 'error',
            memory_mb: 0,
            cpu_percent: 0,
            harmony_score: 0,
            uptime: 0,
            connections: 0
          },
          soul: {
            emotional_state: 'error',
            zodiac_sign: 'unknown',
            consciousness: 0,
            creativity: 0,
            harmony: 0
          },
          status: 'error',
          role: 'unknown',
          lastSeen: Date.now(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }));

    res.json({
      success: true,
      data: nodes,
      count: nodes.length,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error obteniendo nodos:', error);
    res.status(500).json({ error: 'Failed to fetch nodes' });
  }
});

export default router; // Exporta el router al final
