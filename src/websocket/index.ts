import { Server as SocketIOServer } from 'socket.io';
import Redis from 'ioredis';
import { startMetricsStream, stopMetricsStream } from './metrics-stream';
import { startPm2Stream, stopPm2Stream } from './pm2-stream';
import { getCurrentMetrics } from '../services/metrics-service';
import { listProcesses } from '../services/pm2-service';

/**
 * 🎛️ Inicializa y configura Socket.IO para el dashboard
 * Centraliza toda la lógica de WebSocket streaming
 * @param io Instancia de Socket.IO Server ya creada
 * @param redis Instancia de Redis ya creada
 */
export function initWebSocket(io: SocketIOServer, redis: Redis): void {
  console.log('🔌 Inicializando WebSocket handlers...');

  // Event listeners para monitoreo de conexión Redis
  redis.on('connect', () => console.log('✅ [Dashboard] Redis conectado'));
  redis.on('ready', () => console.log('✅ [Dashboard] Redis listo'));
  redis.on('error', (err) => console.error('❌ [Dashboard] Error Redis:', err));
  redis.on('close', () => console.log('⚠️ [Dashboard] Conexión Redis cerrada'));

  // Instancia separada de Redis para pub/sub
  const redisSubscriber = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: 0,
    maxRetriesPerRequest: 3
  });

  redisSubscriber.on('connect', () => console.log('✅ [Dashboard] Redis Subscriber conectado'));
  redisSubscriber.on('ready', () => console.log('✅ [Dashboard] Redis Subscriber listo'));
  redisSubscriber.on('error', (err) => console.error('❌ [Dashboard] Error Redis Subscriber:', err));

  // Suscribirse a canales de optimización Y evolutivos
  redisSubscriber.subscribe(
    'selene:optimization:pending_suggestions',
    'selene:optimization:mode',
    'selene:evolution:suggestions',
    'selene:evolution:quota',
    'selene:evolution:safety',
    'selene:evolution:metrics',
    (err, count) => {
      if (err) {
        console.error('❌ Error suscribiéndose a canales:', err);
      } else {
        console.log(`✅ Suscrito a ${count} canales (optimización + evolución)`);
      }
    }
  );

  // Manejar mensajes de canales de optimización
  redisSubscriber.on('message', async (channel, message) => {
    console.log(`📡 [REDIS SUB] Mensaje recibido en canal: ${channel}, mensaje: ${message}`);
    try {
      let eventData: any = message;

      // Broadcast a todos los clientes Socket.io conectados
      if (channel === 'selene:optimization:pending_suggestions') {
        try {
          eventData = JSON.parse(message);
        } catch (e) {
          console.error('Error parseando JSON de sugerencias:', e);
          return;
        }

        // Verificar si es un trigger de re-evaluación
        if (eventData === 'trigger_re-evaluation') {
          console.log('🔄 Trigger de re-evaluación recibido, procesando lista actual...');
          try {
            const userDecisionsJson = await redis.get('selene:optimization:user_decisions') || '{}';
            const userDecisions = JSON.parse(userDecisionsJson);
            console.log('🔍 Decisiones del usuario:', Object.keys(userDecisions));

            const currentSuggestionsJson = await redis.get('selene:optimization:pending_suggestions') || '[]';
            const currentSuggestions = JSON.parse(currentSuggestionsJson);
            console.log('📋 Sugerencias actuales antes del filtro:', currentSuggestions.length);

            const filteredSuggestions = currentSuggestions.filter((suggestion: any) => {
              const decided = userDecisions[suggestion.optimizationId];
              const isPending = suggestion.status === 'pending_human';
              console.log(`🔍 Sugerencia ${suggestion.optimizationId}: decided=${!!decided}, status=${suggestion.status}, keep=${!decided && isPending}`);
              return !decided && isPending;
            });

            console.log('📋 Sugerencias después del filtro:', filteredSuggestions.length);
            await redis.set('selene:optimization:pending_suggestions', JSON.stringify(filteredSuggestions));

            io.emit('optimization_suggestions_update', {
              data: filteredSuggestions,
              timestamp: Date.now()
            });

            console.log(`✅ Re-evaluación completada: ${filteredSuggestions.length} sugerencias pendientes`);
          } catch (triggerError) {
            console.error('❌ Error en trigger de re-evaluación:', triggerError);
          }
          return;
        }

        let newSuggestions = eventData;
        if (typeof eventData === 'object' && eventData !== null && 'suggestions' in eventData) {
          newSuggestions = eventData.suggestions;
        }

        if (!Array.isArray(newSuggestions)) {
          console.warn('⚠️ Mensaje de sugerencias no es un array válido:', eventData);
          newSuggestions = [];
        }

        try {
          const userDecisionsJson = await redis.get('selene:optimization:user_decisions') || '{}';
          const userDecisions = JSON.parse(userDecisionsJson);

          const currentSuggestionsJson = await redis.get('selene:optimization:pending_suggestions') || '[]';
          const currentSuggestions = JSON.parse(currentSuggestionsJson);

          const currentSuggestionsMap = new Map();
          currentSuggestions.forEach((suggestion: any) => {
            if (suggestion.optimizationId) {
              currentSuggestionsMap.set(suggestion.optimizationId, suggestion);
            }
          });

          const filteredNewSuggestions = newSuggestions.filter((newSuggestion: any) => {
            const suggestionId = newSuggestion.optimizationId;
            if (userDecisions[suggestionId]) {
              return false;
            }
            const existingSuggestion = currentSuggestionsMap.get(suggestionId);
            if (existingSuggestion && (existingSuggestion.status === 'approved' || existingSuggestion.status === 'rejected')) {
              return false;
            }
            if (newSuggestion.status === 'applied' || newSuggestion.status === 'rejected' || newSuggestion.status === 'failed') {
              return false;
            }
            return true;
          });

          const mergedSuggestionsMap = new Map();
          currentSuggestions.forEach((suggestion: any) => {
            if (!userDecisions[suggestion.optimizationId] && suggestion.status === 'pending_human') {
              mergedSuggestionsMap.set(suggestion.optimizationId, suggestion);
            }
          });

          filteredNewSuggestions.forEach((suggestion: any) => {
            if (!mergedSuggestionsMap.has(suggestion.optimizationId)) {
              mergedSuggestionsMap.set(suggestion.optimizationId, suggestion);
            }
          });

          const mergedSuggestions = Array.from(mergedSuggestionsMap.values());
          await redis.set('selene:optimization:pending_suggestions', JSON.stringify(mergedSuggestions));

          io.emit('optimization_suggestions_update', {
            data: mergedSuggestions,
            timestamp: Date.now()
          });

        } catch (mergeError) {
          console.error('❌ Error en merge inteligente mejorado:', mergeError);
          await redis.set('selene:optimization:pending_suggestions', JSON.stringify(newSuggestions));
          io.emit('optimization_suggestions_update', {
            data: newSuggestions,
            timestamp: Date.now()
          });
        }
      } else if (channel === 'selene:optimization:mode') {
        try {
          eventData = JSON.parse(message);
        } catch (e) {
          // Ignorar si no es JSON
        }
        io.emit('optimization_mode_update', {
          data: eventData,
          timestamp: Date.now()
        });
      }

      // Canales evolutivos
      else if (channel === 'selene:evolution:suggestions') {
        try {
          const suggestions = JSON.parse(message);
          console.log('🧬 Sugerencias evolutivas recibidas:', suggestions.length || 0);
          io.emit('evolution:suggestions', suggestions);
          await redis.set('selene:evolution:suggestions', JSON.stringify(suggestions));
        } catch (e) {
          console.error('Error procesando sugerencias evolutivas:', e);
        }
      }
      else if (channel === 'selene:evolution:quota') {
        try {
          const quota = JSON.parse(message);
          console.log('🎯 Quota evolutiva actualizada:', quota);
          io.emit('evolution:quota', quota);
          await redis.set('selene:evolution:quota', JSON.stringify(quota));
        } catch (e) {
          console.error('Error procesando quota evolutiva:', e);
        }
      }
      else if (channel === 'selene:evolution:safety') {
        try {
          const safety = JSON.parse(message);
          console.log('🛡️ Estado de seguridad evolutiva actualizado:', safety);
          io.emit('evolution:safety', safety);
          await redis.set('selene:evolution:safety', JSON.stringify(safety));
        } catch (e) {
          console.error('Error procesando seguridad evolutiva:', e);
        }
      }
      else if (channel === 'selene:evolution:metrics') {
        try {
          const metrics = JSON.parse(message);
          console.log('📈 Métricas evolutivas actualizadas:', metrics);
          io.emit('evolution:metrics', metrics);
          await redis.set('selene:evolution:metrics', JSON.stringify(metrics));
        } catch (e) {
          console.error('Error procesando métricas evolutivas:', e);
        }
      }

    } catch (error) {
      console.error('❌ Error procesando mensaje Redis pub/sub:', error);
    }
  });
  console.log('🔌 Inicializando WebSocket handlers...');

  // Handler de conexión principal
  io.on('connection', (socket) => {
    console.log('✅ Cliente Socket.io conectado:', socket.id);

    // Iniciar streams para este cliente
    startMetricsStream(socket);
    startPm2Stream(socket);

    // Stream adicional de MIDI cada 5 segundos
    const midiIntervalId = setInterval(async () => {
      try {
        // Obtener grabaciones MIDI recientes
        const midiRecordings = await redis.lrange('selene:midi:recordings', 0, 9); // Últimas 10 grabaciones

        const recordings = midiRecordings.map((item: string) => {
          try {
            return JSON.parse(item);
          } catch {
            return null;
          }
        }).filter((item: any) => item !== null);

        if (recordings.length > 0) {
          socket.emit('midi_update', {
            timestamp: Date.now(),
            data: {
              recordings: recordings
            }
          });
        }

      } catch (midiError) {
        console.error('❌ Error obteniendo datos MIDI para Socket.io:', midiError);
      }
    }, 5000);

    // Historial de métricas cada 10 segundos
    const historyIntervalId = setInterval(async () => {
      try {
        const metrics = await getCurrentMetrics();
        const historyEntry = {
          timestamp: Date.now(),
          metrics: metrics
        };

        // Mantener solo últimas 1000 entradas (aprox 3 horas a 10s cada una)
        await redis.lpush('selene:metrics:history', JSON.stringify(historyEntry));
        await redis.ltrim('selene:metrics:history', 0, 999);
      } catch (historyError) {
        console.warn('Error guardando historial de métricas:', historyError);
      }
    }, 10000);

    // Historial de PM2 cada 30 segundos
    const pm2HistoryIntervalId = setInterval(async () => {
      try {
        const pm2List = await listProcesses();
        const pm2Data = {
          timestamp: Date.now(),
          processes: pm2List
            .filter((proc: any) => proc.name.includes('selene'))
            .map((proc: any) => ({
              name: proc.name,
              status: proc.pm2_env?.status,
              memory_mb: Math.round((proc.monit?.memory || 0) / 1024 / 1024 * 100) / 100,
              cpu_percent: proc.monit?.cpu || 0,
              restarts: proc.pm2_env?.restart_time || 0
            }))
        };

        if (pm2Data.processes.length > 0) {
          await redis.lpush('selene:pm2:history', JSON.stringify(pm2Data));
          await redis.ltrim('selene:pm2:history', 0, 119); // Últimas 2 horas (120 puntos * 30s)
        }
      } catch (pm2HistoryError) {
        console.warn('Error guardando historial PM2:', pm2HistoryError);
      }
    }, 30000);

    // Cleanup al desconectar
    socket.on('disconnect', () => {
      console.log('❌ Cliente Socket.io desconectado:', socket.id);

      // Detener todos los streams para este cliente
      stopMetricsStream(socket);
      stopPm2Stream(socket);

      // Limpiar intervalos adicionales
      clearInterval(midiIntervalId);
      clearInterval(historyIntervalId);
      clearInterval(pm2HistoryIntervalId);
    });
  });

  console.log('✅ WebSocket handlers inicializados correctamente');
}