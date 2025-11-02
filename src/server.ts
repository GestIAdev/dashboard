// 🎸 SELENE SONG CORE - DASHBOARD LIMPIO
// "Donde la belleza se monitorea sin interferir en la autonomía"
// — PunkClaude, Arquitecto del Verso Libre

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Redis from 'ioredis';
import pm2 from 'pm2';
import { promisify } from 'util';
import { performance, PerformanceObserver } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';
import * as config from './config/index.js';
import { calculateTrend } from './utils/index.js';
import metricsRouter from './api/metrics.js';
import pm2Router from './api/pm2.js';
import nodesRouter from './api/nodes.js';
import consciousnessRouter from './api/consciousness.js';
import evolutionRouter from './api/evolution.js';
import musicRouter from './api/music.js';
import { getCurrentMetrics } from './services/metrics-service.js';
import { initWebSocket } from './websocket/index.js';
import { initRedisSubscriber } from './services/redis-subscriber.js';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

export { io };

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: 0,
  maxRetriesPerRequest: 3
});

// Inicializar WebSocket handlers centralizados
initWebSocket(io, redis);

// Inicializar Redis Subscriber para Pub/Sub
initRedisSubscriber();

// Event listeners para monitoreo de conexión Redis
redis.on('connect', () => console.log('✅ [Dashboard] Redis conectado'));
redis.on('ready', () => console.log('✅ [Dashboard] Redis listo'));
redis.on('error', (err) => console.error('❌ [Dashboard] Error Redis:', err));
redis.on('close', () => console.log('⚠️ [Dashboard] Conexión Redis cerrada'));

// PM2 promisified
const pm2Connect = promisify(pm2.connect.bind(pm2));
const pm2List = promisify(pm2.list.bind(pm2));

// Event Loop Latency tracking
let eventLoopLag = 0;
setInterval(() => {
  const start = performance.now();
  setImmediate(() => {
    eventLoopLag = performance.now() - start;
  });
}, 1000); // Check every second

// 🎨 Servir archivos estáticos (SIN CACHÉ durante desarrollo)
app.use(express.static('public', {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  }
}));
app.use(express.json());

// ============================================
// 📊 API ROUTERS - MODULAR ENDPOINTS
// ============================================

// Montar routers modulares
app.use('/api/metrics', metricsRouter);
app.use('/api/pm2', pm2Router);
app.use('/api/nodes', nodesRouter);
app.use('/api/consciousness', consciousnessRouter);
app.use('/api/evolution', evolutionRouter);
app.use('/api/music', musicRouter); // Monta el router principal de música
app.use('/api', musicRouter); // Monta de nuevo en /api para capturar /api/synergy-mode

// ============================================
// � FUNCIONES AUXILIARES
// ============================================

// ============================================
// �📊 API ENDPOINTS - SOLO LECTURA
// ============================================

// ============================================
// 🎵 LEGACY MIDI APIs - COMENTADO PARA FASE 4
// ============================================

/**
 * 🎵 GET /api/midi/recent - Grabaciones MIDI recientes (LEGENDARY por defecto)
 * LEGACY ENDPOINT - COMENTADO EN FASE 4 DEL REFACTOR
 */
/*
// app.get('/api/midi/recent', async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit as string || '10');
//     const offset = parseInt(req.query.offset as string || '0');
//     const showAll = req.query.all === 'true'; // Parámetro opcional para ver todo

//     let recordings: string[];

//     if (showAll) {
//       // Mostrar todas las grabaciones (modo debug/admin)
//       recordings = await redis.lrange('selene:midi:recordings', offset, offset + limit - 1);
//     } else {
//       // Mostrar solo arte legendario (modo normal)
//       recordings = await redis.lrange('selene:art:legendary', offset, offset + limit - 1);
//       // Filtrar solo grabaciones MIDI
//       recordings = recordings
//         .map(r => JSON.parse(r))
//         .filter((item: any) => item.type === 'midi' || !item.type) // Compatibilidad con datos antiguos
//         .slice(0, limit)
//         .map(item => JSON.stringify(item));
//     }

//     // Formatear datos para el panel de visualización MIDI
//     const formattedData = recordings.map(r => {
//       const parsed = JSON.parse(r);

//       // Extraer métricas de calidad (puede ser objeto o número)
//       let quality = 0;
//       if (typeof parsed.quality === 'number') {
//         quality = parsed.quality;
//       } else if (typeof parsed.advancedQuality === 'number') {
//         quality = parsed.advancedQuality;
//       } else if (parsed.quality && typeof parsed.quality === 'object') {
//         // Si es un objeto, intentar extraer valores numéricos
//         quality = parsed.quality.overall || parsed.quality.score || 0;
//       }

//       return {
//         id: parsed.id || `midi_${Date.now()}_${Math.random()}`,
//         filename: parsed.filename || parsed.fileName || 'unknown.mid',
//         timestamp: parsed.timestamp || Date.now(),
//         notesCount: parsed.notesCount || parsed.noteCount || parsed.notes || 0,
//         duration: parsed.duration || 0,
//         quality: Math.min(1, Math.max(0, quality)), // Normalizar entre 0-1
//         type: 'midi',
//         zodiacSign: parsed.zodiacSign || parsed.proceduralProfile?.zodiacSignature || null,
//         element: parsed.element || null,
//         proceduralProfile: parsed.proceduralProfile || null,
//         // Metadata adicional para debugging
//         rawQuality: parsed.quality,
//         advancedQuality: parsed.advancedQuality
//       };
//     });

//     res.json({
//       success: true,
//       data: formattedData,
//       count: formattedData.length,
//       limit,
//       offset,
//       mode: showAll ? 'all' : 'legendary_only',
//       timestamp: Date.now()
//     });
//   } catch (error) {
//     console.error('Error obteniendo MIDI:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Error desconocido'
//     });
//   }
// });
*/

/**
 * 🎵 GET /api/midi/download/:filename - Descargar archivo MIDI específico
 * LEGACY ENDPOINT - COMENTADO EN FASE 4 DEL REFACTOR
 */
/*
// app.get('/api/midi/download/:filename', async (req, res) => {
//   try {
//     const { filename } = req.params;

//     // Validación de seguridad: solo permitir nombres de archivo válidos
//     if (!filename || typeof filename !== 'string') {
//       return res.status(400).json({
//         success: false,
//         error: 'Nombre de archivo inválido'
//       });
//     }

//     // Validación adicional: solo archivos .mid
//     if (!filename.endsWith('.mid')) {
//       return res.status(400).json({
//         success: false,
//         error: 'Solo se permiten archivos .mid'
//       });
//     }

//     // Sanitizar filename para prevenir path traversal
//     const sanitizedFilename = path.basename(filename);
//     if (sanitizedFilename !== filename) {
//       return res.status(400).json({
//         success: false,
//         error: 'Nombre de archivo malformado'
//       });
//     }

//     // Construir ruta completa al archivo
//     const midiDir = path.join(process.cwd(), '..', 'midi_recordings');
//     const filePath = path.join(midiDir, sanitizedFilename);

//     // Verificar que el archivo existe
//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({
//         success: false,
//         error: 'Archivo MIDI no encontrado'
//       });
//     }

//     // Verificar que es un archivo regular
//     const stats = fs.statSync(filePath);
//     if (!stats.isFile()) {
//       return res.status(400).json({
//         success: false,
//         error: 'La ruta especificada no es un archivo'
//       });
//     }

//     // Leer y enviar el archivo
//     const fileBuffer = fs.readFileSync(filePath);

//     res.setHeader('Content-Type', 'audio/midi');
//     res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
//     res.setHeader('Content-Length', fileBuffer.length);

//     res.send(fileBuffer);

//   } catch (error) {
//     console.error('Error descargando archivo MIDI:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Error interno del servidor'
//     });
//   }
// });
*/

/**
 * 📜 GET /api/poems/recent - Poemas NFT recientes (LEGENDARY por defecto)
 * LEGACY ENDPOINT - COMENTADO EN FASE 4 DEL REFACTOR
 */
/*
// app.get('/api/poems/recent', async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit as string || '10');
//     const offset = parseInt(req.query.offset as string || '0');
//     const showAll = req.query.all === 'true'; // Parámetro opcional para ver todo

//     let poems: string[];

//     if (showAll) {
//       // Mostrar todos los poemas (modo debug/admin)
//       poems = await redis.lrange('selene:poems:nft', offset, offset + limit - 1);
//     } else {
//       // Mostrar solo arte legendario (modo normal)
//       poems = await redis.lrange('selene:art:legendary', offset, offset + limit - 1);
//       // Filtrar solo poemas
//       poems = poems
//         .map(p => JSON.parse(p))
//         .filter((item: any) => item.type === 'poem' || item.verse || item.poetry) // Compatibilidad con datos antiguos
//         .slice(0, limit)
//         .map(item => JSON.stringify(item));
//     }

//     res.json({
//       success: true,
//       data: poems.map(p => JSON.parse(p)),
//       count: poems.length,
//       limit,
//       offset,
//       mode: showAll ? 'all' : 'legendary_only',
//       timestamp: Date.now()
//     });
//   } catch (error) {
//     console.error('Error obteniendo poemas:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Error desconocido'
//     });
//   }
// });
*/

/**
 * 🧹 POST /api/midi/clear - Limpiar todas las grabaciones MIDI
 * LEGACY ENDPOINT - COMENTADO EN FASE 4 DEL REFACTOR
 */
/*
// app.post('/api/midi/clear', async (req, res) => {
//   try {
//     console.log('🧹 Clearing all MIDI recordings from dashboard');

//     // Limpiar todas las grabaciones MIDI
//     await redis.del('selene:midi:recordings');
//     await redis.del('selene:midi:files');

//     // También limpiar de legendary cache si están ahí
//     const legendaryArt = await redis.lrange('selene:art:legendary', 0, -1);
//     const filteredLegendary = legendaryArt
//       .map(item => JSON.parse(item))
//       .filter((item: any) => item.type !== 'midi')
//       .map(item => JSON.stringify(item));

//     await redis.del('selene:art:legendary');
//     if (filteredLegendary.length > 0) {
//       await redis.lpush('selene:art:legendary', ...filteredLegendary);
//     }

//     console.log('✅ All MIDI recordings cleared successfully');

//     res.json({
//       success: true,
//       message: 'All MIDI recordings cleared successfully',
//       timestamp: Date.now()
//     });
//   } catch (error) {
//     console.error('Error clearing MIDI recordings:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Error desconocido'
//     });
//   }
// });
*/

/**
 * 🧹 POST /api/poems/clear - Limpiar todos los poemas
 * LEGACY ENDPOINT - COMENTADO EN FASE 4 DEL REFACTOR
 */
/*
// app.post('/api/poems/clear', async (req, res) => {
//   try {
//     console.log('🧹 Clearing all poems from dashboard');

//     // Limpiar todos los poemas
//     await redis.del('selene:poems:nft');

//     // También limpiar de legendary cache si están ahí
//     const legendaryArt = await redis.lrange('selene:art:legendary', 0, -1);
//     const filteredLegendary = legendaryArt
//       .map(item => JSON.parse(item))
//       .filter((item: any) => item.type !== 'poem')
//       .map(item => JSON.stringify(item));

//     await redis.del('selene:art:legendary');
//     if (filteredLegendary.length > 0) {
//       await redis.lpush('selene:art:legendary', ...filteredLegendary);
//     }

//     console.log('✅ All poems cleared successfully');

//     res.json({
//       success: true,
//       message: 'All poems cleared successfully',
//       timestamp: Date.now()
//     });
//   } catch (error) {
//     console.error('Error clearing poems:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Error desconocido'
//     });
//   }
// });
*/

/**
 * 🎯 GET /api/forja/stats - Estadísticas generales FORJA 6.0
 * LEGACY ENDPOINT - COMENTADO EN FASE 4 DEL REFACTOR
 */
/*
// app.get('/api/forja/stats', async (req, res) => {
//   try {
//     const [legendaryCount, experimentalCount, commonCount] = await Promise.all([
//       redis.llen('selene:art:legendary'),
//       redis.llen('selene:art:experimental'),
//       redis.llen('selene:art:common')
//     ]);

//     const totalArt = legendaryCount + experimentalCount + commonCount;

//     // Calcular distribución porcentual
//     const distribution = {
//       legendary: totalArt > 0 ? (legendaryCount / totalArt) * 100 : 0,
//       experimental: totalArt > 0 ? (experimentalCount / totalArt) * 100 : 0,
//       common: totalArt > 0 ? (commonCount / totalArt) * 100 : 0
//     };

//     // Obtener últimas entradas para calcular promedios
//     const [legendaryItems, experimentalItems, commonItems] = await Promise.all([
//       redis.lrange('selene:art:legendary', 0, 9),
//       redis.lrange('selene:art:experimental', 0, 9),
//       redis.lrange('selene:art:common', 0, 9)
//     ]);

//     const calculateAverage = (items: string[], metric: string) => {
//       const values = items.map(item => {
//         try {
//           const parsed = JSON.parse(item);
//           return parsed.proceduralProfile?.[metric] || 0;
//         } catch {
//           return 0;
//         }
//       }).filter(v => v > 0);
//       return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
//     };

//     const averages = {
//       legendary: {
//         coherence: calculateAverage(legendaryItems, 'coherence'),
//         rarity: calculateAverage(legendaryItems, 'rarity')
//       },
//       experimental: {
//         variety: calculateAverage(experimentalItems, 'variety'),
//         coherence: calculateAverage(experimentalItems, 'coherence')
//       },
//       common: {
//         coherence: calculateAverage(commonItems, 'coherence'),
//         quality: calculateAverage(commonItems, 'quality')
//       }
//     };

//     res.json({
//       success: true,
//       data: {
//         totalArt,
//         distribution,
//         counts: {
//           legendary: legendaryCount,
//           experimental: experimentalCount,
//           common: commonCount
//         },
//         averages,
//         forjaVersion: "6.0",
//         taxonomy: "4D Vector Classification",
//         lastUpdate: Date.now()
//       },
//       timestamp: Date.now()
//     });
//   } catch (error) {
//     console.error('Error obteniendo estadísticas FORJA:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Error desconocido'
//     });
//   }
// });
*/

// ============================================
// 🎛️ PANEL DE CONTROL - OPTIMIZATION APIs
// ============================================

// ============================================
// 🎛️ LEGACY OPTIMIZATION PANEL APIs - COMENTADO PARA FASE 4
// ============================================

/**
 * 🎛️ GET /api/optimization/mode - Obtener modo de optimización actual
 * LEGACY ENDPOINT - COMENTADO EN FASE 4 DEL REFACTOR
 */
/*
// app.get('/api/optimization/mode', async (req, res) => {
//   try {
//     const mode = await redis.get('selene:optimization:mode') || 'hybrid';
//     res.json({
//       success: true,
//       data: { mode },
//       timestamp: Date.now()
//     });
//   } catch (error) {
//     console.error('Error obteniendo modo de optimización:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Error desconocido'
//     });
//   }
// });
*/

/**
 * 🎛️ POST /api/optimization/mode - Cambiar modo de optimización
 * LEGACY ENDPOINT - COMENTADO EN FASE 4 DEL REFACTOR
 */
/*
// app.post('/api/optimization/mode', async (req, res) => {
//   try {
//     const { mode } = req.body;

//     if (!['manual', 'hybrid', 'auto'].includes(mode)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Modo inválido. Debe ser: manual, hybrid, o auto'
//       });
//     }

//     // Guardar nuevo modo
//     await redis.set('selene:optimization:mode', mode);

//     // Publicar comando a Selene
//     await redis.publish('selene:control:commands', JSON.stringify({
//       type: 'change_optimization_mode',
//       mode,
//       timestamp: Date.now()
//     }));

//     res.json({
//       success: true,
//       data: { mode },
//       message: `Modo cambiado a ${mode}`,
//       timestamp: Date.now()
//     });
//   } catch (error) {
//     console.error('Error cambiando modo de optimización:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Error desconocido'
//     });
//   }
// });
*/

/**
 * 🎛️ GET /api/optimization/suggestions - Obtener sugerencias pendientes
 * LEGACY ENDPOINT - COMENTADO EN FASE 4 DEL REFACTOR
 */
/*
// app.get('/api/optimization/suggestions', async (req, res) => {
//   try {
//     const suggestionsJson = await redis.get('selene:optimization:pending_suggestions') || '[]';
//     const suggestions = JSON.parse(suggestionsJson);

//     res.json({
//       success: true,
//       data: suggestions,
//       count: suggestions.length,
//       timestamp: Date.now()
//     });
//   } catch (error) {
//     console.error('Error obteniendo sugerencias:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Error desconocido'
//     });
//   }
// });
*/

/**
 * 🎛️ POST /api/optimization/suggestions/:id/approve - Aprobar sugerencia
 * LEGACY ENDPOINT - COMENTADO EN FASE 4 DEL REFACTOR
 */
/*
// app.post('/api/optimization/suggestions/:id/approve', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { approvedBy = 'dashboard_user' } = req.body;

//     // Leer decisiones previas del usuario
//     const userDecisionsJson = await redis.get('selene:optimization:user_decisions') || '{}';
//     const userDecisions = JSON.parse(userDecisionsJson);

//     // REGISTRAR DECISIÓN DEL USUARIO (persistente)
//     userDecisions[id] = {
//       decision: 'approved',
//       decidedBy: approvedBy,
//       decidedAt: Date.now(),
//       suggestion: { optimizationId: id } // Placeholder, el suscriptor manejará el estado real
//     };

//     // Guardar decisiones del usuario
//     await redis.set('selene:optimization:user_decisions', JSON.stringify(userDecisions));

//     // Publicar comando a Selene para aplicar la sugerencia
//     await redis.publish('selene:control:commands', JSON.stringify({
//       type: 'apply_optimization_suggestion',
//       suggestionId: id,
//       approvedBy,
//       timestamp: Date.now()
//     }));

//     // Forzar al Core a re-enviar su estado actual
//     await redis.publish('selene:control:commands', JSON.stringify({
//       type: 'request_suggestion_update',
//       source: 'dashboard_api_approve',
//       timestamp: Date.now()
//     }));

//     res.json({
//       success: true,
//       data: { optimizationId: id, status: 'approved', approvedBy },
//       message: 'Decisión registrada, esperando actualización del Core',
//       timestamp: Date.now()
//     });
//   } catch (error) {
//     console.error('Error aprobando sugerencia:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Error desconocido'
//     });
//   }
// });
*/

/**
 * 🎛️ POST /api/optimization/suggestions/:id/reject - Rechazar sugerencia
 * LEGACY ENDPOINT - COMENTADO EN FASE 4 DEL REFACTOR
 */
/*
// app.post('/api/optimization/suggestions/:id/reject', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { rejectedBy = 'dashboard_user', reason = '' } = req.body;

//     // Leer decisiones previas del usuario
//     const userDecisionsJson = await redis.get('selene:optimization:user_decisions') || '{}';
//     const userDecisions = JSON.parse(userDecisionsJson);

//     // REGISTRAR DECISIÓN DEL USUARIO (persistente)
//     userDecisions[id] = {
//       decision: 'rejected',
//       decidedBy: rejectedBy,
//       decidedAt: Date.now(),
//       reason: reason,
//       suggestion: { optimizationId: id } // Placeholder, el suscriptor manejará el estado real
//     };

//     // Guardar decisiones del usuario
//     await redis.set('selene:optimization:user_decisions', JSON.stringify(userDecisions));

//     // Publicar comando a Selene para notificar el rechazo
//     await redis.publish('selene:control:commands', JSON.stringify({
//       type: 'reject_optimization_suggestion',
//       suggestionId: id,
//       rejectedBy,
//       reason,
//       timestamp: Date.now()
//     }));

//     // Forzar al Core a re-enviar su estado actual
//     await redis.publish('selene:control:commands', JSON.stringify({
//       type: 'request_suggestion_update',
//       source: 'dashboard_api_reject',
//       timestamp: Date.now()
//     }));

//     res.json({
//       success: true,
//       data: { optimizationId: id, status: 'rejected', rejectedBy, reason },
//       message: 'Decisión registrada, esperando actualización del Core',
//       timestamp: Date.now()
//     });
//   } catch (error) {
//     console.error('Error rechazando sugerencia:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Error desconocido'
//     });
//   }
// });
*/

/**
 * 📊 GET /api/optimization/quota - Obtener estado de quota de sugerencias
 * LEGACY ENDPOINT - COMENTADO EN FASE 4 DEL REFACTOR
 */
/*
// app.get('/api/optimization/quota', async (req, res) => {
//   try {
//     // Leer estado de quota desde Redis (almacenado por AutoOptimizationEngine)
//     const quotaData = await redis.get('selene:optimization:quota_status');
//     const quota = quotaData ? JSON.parse(quotaData) : {
//       usedToday: 0,
//       quotaLimit: 5,
//       cooldownRemaining: 0,
//       canGenerate: true
//     };

//     res.json({
//       success: true,
//       data: quota,
//       timestamp: Date.now()
//     });
//   } catch (error) {
//     console.error('Error obteniendo quota:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Error desconocido'
//     });
//   }
// });
*/

// ============================================
// 🎯 FORJA 9.0 - INTENTION APIs
// ============================================

// Forzar locale inglés para evitar problemas con formato de números decimales
process.env.LANG = 'en_US.UTF-8';
process.env.LC_ALL = 'en_US.UTF-8';

// Configurar locale para números
const locale = 'en-US';
const numberFormatter = new Intl.NumberFormat(locale, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 10
});


server.listen(config.PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   🎸 SELENE SONG CORE - DASHBOARD COMPLETO 🎸  ║
╠════════════════════════════════════════════════╣
║                                                ║
║  HTTP Server:      http://localhost:${config.PORT}     ║
║  Socket.io Server: ws://localhost:${config.PORT}       ║
║                                                ║
║  📊 Métricas:      GET /api/metrics            ║
║  🐝 Nodos:         GET /api/nodes              ║
║  ⚖️ Consenso:      GET /api/consensus          ║
║  🧠 Consciencia:   GET /api/consciousness      ║
║  🎵 MIDI:          GET /api/midi/recent        ║
║  📜 Poemas NFT:    GET /api/poems/recent       ║
║  🖥️ PM2:           GET /api/pm2/status         ║
║  🎨 Partículas:    GET /api/particles/config   ║
║                                                ║
║  🎛️ CONTROL PANEL:                           ║
║  📊 Modo:          GET/POST /api/optimization/mode ║
║  💡 Sugerencias:   GET /api/optimization/suggestions ║
║  ✅ Aprobar:       POST /api/optimization/suggestions/:id/approve ║
║  ❌ Rechazar:      POST /api/optimization/suggestions/:id/reject ║
║                                                ║
║  🔥 MODO: HYBRID - SELENE SUGIERE, HUMANO APRUEBA ║
║  ✨ Panel de control operativo con Socket.io   ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown - solo en SIGINT real
process.on('SIGINT', () => {
  console.log('\n🎸 [DEBUG] SIGINT recibido - iniciando graceful shutdown...');
  console.log('🎸 [DEBUG] Cerrando conexiones...');
  redis.disconnect();
  io.close();
  server.close(() => {
    console.log('🎸 [DEBUG] Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Evitar que se cierre por errores no críticos
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  // No cerrar el proceso por errores no críticos
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  // No cerrar el proceso por rechazos no críticos
});

// Agregar logging para debug
console.log('🚀 Iniciando servidor...');
console.log('📊 Puerto configurado:', config.PORT);
console.log('🔌 Redis host:', process.env.REDIS_HOST || 'localhost');
console.log('🔌 Redis port:', process.env.REDIS_PORT || '6379');

// Verificar que las dependencias críticas estén disponibles
console.log('🔍 Verificando dependencias...');
try {
  console.log('✅ Express disponible');
} catch (e) {
  console.error('❌ Express no disponible');
}
try {
  console.log('✅ Socket.io disponible');
} catch (e) {
  console.error('❌ Socket.io no disponible');
}
try {
  console.log('✅ IORedis disponible');
} catch (e) {
  console.error('❌ IORedis no disponible');
}