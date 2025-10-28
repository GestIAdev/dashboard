import Redis from 'ioredis';
import { Server as SocketIOServer } from 'socket.io';
// Importa la instancia principal de Redis y io desde server.ts
// (O considera un mejor manejo de dependencias más adelante)
import { redis, io } from '../server.js'; // Ajusta rutas

let redisSubscriber: Redis | null = null;

export const initRedisSubscriber = () => {
  if (redisSubscriber) return redisSubscriber; // Evita re-inicialización

  console.log('🔄 Initializing Redis Pub/Sub Subscriber...');

  // Pega aquí la creación original de redisSubscriber
  redisSubscriber = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: 0,
    maxRetriesPerRequest: 3
  });

  // Pega aquí los .on('connect'), .on('ready'), .on('error') originales
  redisSubscriber.on('connect', () => console.log('✅ [PubSub] Redis Subscriber conectado'));
  redisSubscriber.on('ready', () => console.log('✅ [PubSub] Redis Subscriber listo'));
  redisSubscriber.on('error', (err) => console.error('❌ [PubSub] Error Redis Subscriber:', err));

  // Pega aquí la llamada original a .subscribe(...)
  redisSubscriber.subscribe(
    'selene:optimization:pending_suggestions',
    'selene:optimization:mode',
    'selene:evolution:suggestions',
    'selene:evolution:quota',
    'selene:evolution:safety',
    'selene:evolution:metrics',
    (err, count) => {
      if (err) {
        console.error('❌ [PubSub] Error suscribiéndose a canales:', err);
      } else {
        console.log(`✅ [PubSub] Suscrito a ${count} canales`);
      }
    }
  );

  // Pega aquí el manejador .on('message', ...) original COMPLETO
  redisSubscriber.on('message', async (channel, message) => {
    console.log(`📡 [REDIS SUB] Mensaje recibido en canal: ${channel}, mensaje: ${message}`);
    try {

      let eventData: any = message; // Asignar el mensaje crudo primero

      // Broadcast a todos los clientes Socket.io conectados
      if (channel === 'selene:optimization:pending_suggestions') {
        try {
          eventData = JSON.parse(message); // Parsear el JSON aquí
        } catch (e) {
          console.error('Error parseando JSON de sugerencias:', e);
          return; // Salir si el JSON está corrupto
        }
        // Verificar si es un trigger de re-evaluación
        if (eventData === 'trigger_re-evaluation') {
          console.log('🔄 Trigger de re-evaluación recibido, procesando lista actual...');
          try {
            // Leer decisiones previas del usuario (aprobadas/rechazadas)
            const userDecisionsJson = await redis.get('selene:optimization:user_decisions') || '{}';
            const userDecisions = JSON.parse(userDecisionsJson);
            console.log('🔍 Decisiones del usuario:', Object.keys(userDecisions));

            // Leer sugerencias actuales de Redis
            const currentSuggestionsJson = await redis.get('selene:optimization:pending_suggestions') || '[]';
            const currentSuggestions = JSON.parse(currentSuggestionsJson);
            console.log('📋 Sugerencias actuales antes del filtro:', currentSuggestions.length);

            // Filtrar sugerencias actuales: mantener solo las que NO han sido decididas por el usuario
            const filteredSuggestions = currentSuggestions.filter((suggestion: any) => {
              const decided = userDecisions[suggestion.optimizationId];
              const isPending = suggestion.status === 'pending_human';
              console.log(`🔍 Sugerencia ${suggestion.optimizationId}: decided=${!!decided}, status=${suggestion.status}, keep=${!decided && isPending}`);
              return !decided && isPending;
            });

            console.log('📋 Sugerencias después del filtro:', filteredSuggestions.length);

            // Guardar las sugerencias filtradas
            await redis.set('selene:optimization:pending_suggestions', JSON.stringify(filteredSuggestions));

            // Broadcast con las sugerencias filtradas
            io.emit('optimization_suggestions_update', {
              data: filteredSuggestions,
              timestamp: Date.now()
            });

            console.log(`✅ Re-evaluación completada: ${filteredSuggestions.length} sugerencias pendientes`);
          } catch (triggerError) {
            console.error('❌ Error en trigger de re-evaluación:', triggerError);
          }
          return; // Salir, no procesar como sugerencias normales
        }

        // Extraer sugerencias del mensaje - puede ser array directo o objeto con sugerencias
        let newSuggestions = eventData;

        // Si es un objeto con propiedad 'suggestions', extraer el array
        if (typeof eventData === 'object' && eventData !== null && 'suggestions' in eventData) {
          newSuggestions = eventData.suggestions;
        }

        // Si no es un array, intentar convertirlo o usar array vacío
        if (!Array.isArray(newSuggestions)) {
          console.warn('⚠️ Mensaje de sugerencias no es un array válido:', eventData);
          newSuggestions = [];
        }

        // ESTRATEGIA MEJORADA: Mantener registro persistente de decisiones del usuario
        try {
          // Leer decisiones previas del usuario (aprobadas/rechazadas)
          const userDecisionsJson = await redis.get('selene:optimization:user_decisions') || '{}';
          const userDecisions = JSON.parse(userDecisionsJson);

          // Leer sugerencias actuales de Redis
          const currentSuggestionsJson = await redis.get('selene:optimization:pending_suggestions') || '[]';
          const currentSuggestions = JSON.parse(currentSuggestionsJson);

          // Crear mapa de sugerencias actuales por ID
          const currentSuggestionsMap = new Map();
          currentSuggestions.forEach((suggestion: any) => {
            if (suggestion.optimizationId) {
              currentSuggestionsMap.set(suggestion.optimizationId, suggestion);
            }
          });

          // Filtrar nuevas sugerencias: excluir las que ya fueron decididas por el usuario
          const filteredNewSuggestions = newSuggestions.filter((newSuggestion: any) => {
            const suggestionId = newSuggestion.optimizationId;

            // Si el usuario ya tomó una decisión sobre esta sugerencia, excluirla
            if (userDecisions[suggestionId]) {
              return false;
            }

            // Si ya existe en las sugerencias actuales y fue decidida, excluirla
            const existingSuggestion = currentSuggestionsMap.get(suggestionId);
            if (existingSuggestion && (existingSuggestion.status === 'approved' || existingSuggestion.status === 'rejected')) {
              return false;
            }

            // Si tiene status final, excluirla
            if (newSuggestion.status === 'applied' || newSuggestion.status === 'rejected' || newSuggestion.status === 'failed') {
              return false;
            }

            return true;
          });

          // Combinar: usar Map para evitar duplicados por ID
          const mergedSuggestionsMap = new Map();

          // Agregar sugerencias actuales que NO han sido decididas por el usuario
          currentSuggestions.forEach((suggestion: any) => {
            if (!userDecisions[suggestion.optimizationId] && suggestion.status === 'pending_human') {
              mergedSuggestionsMap.set(suggestion.optimizationId, suggestion);
            }
          });

          // Agregar nuevas sugerencias filtradas (solo si no existen ya)
          filteredNewSuggestions.forEach((suggestion: any) => {
            if (!mergedSuggestionsMap.has(suggestion.optimizationId)) {
              mergedSuggestionsMap.set(suggestion.optimizationId, suggestion);
            }
          });

          // Convertir Map a array
          const mergedSuggestions = Array.from(mergedSuggestionsMap.values());

          // Guardar las sugerencias mezcladas en Redis para persistencia
          await redis.set('selene:optimization:pending_suggestions', JSON.stringify(mergedSuggestions));

          // Broadcast con las sugerencias filtradas
          io.emit('optimization_suggestions_update', {
            data: mergedSuggestions,
            timestamp: Date.now()
          });

        } catch (mergeError) {
          console.error('❌ Error en merge inteligente mejorado:', mergeError);
          // Fallback: usar las nuevas sugerencias directamente
          await redis.set('selene:optimization:pending_suggestions', JSON.stringify(newSuggestions));
          io.emit('optimization_suggestions_update', {
            data: newSuggestions,
            timestamp: Date.now()
          });
        }
      } else if (channel === 'selene:optimization:mode') {
        try {
          eventData = JSON.parse(message); // Parsear el JSON aquí
        } catch (e) {
          // Ignorar si no es JSON, puede ser un string simple
        }
        // Actualizar modo de optimización
        io.emit('optimization_mode_update', {
          data: eventData,
          timestamp: Date.now()
        });
      }

      // ========================================
      // 🧬 EVOLUTIONARY SYNERGY ENGINE CHANNELS
      // ========================================
      else if (channel === 'selene:evolution:suggestions') {
        try {
          const suggestions = JSON.parse(message);
          console.log('🧬 Sugerencias evolutivas recibidas:', suggestions.length || 0);

          // Broadcast a clientes conectados
          io.emit('evolution:suggestions', suggestions);

          // Guardar en Redis para persistencia
          await redis.set('selene:evolution:suggestions', JSON.stringify(suggestions));
        } catch (e) {
          console.error('Error procesando sugerencias evolutivas:', e);
        }
      }
      else if (channel === 'selene:evolution:quota') {
        try {
          const quota = JSON.parse(message);
          console.log('🎯 Quota evolutiva actualizada:', quota);

          // Broadcast a clientes conectados
          io.emit('evolution:quota', quota);

          // Guardar en Redis
          await redis.set('selene:evolution:quota', JSON.stringify(quota));
        } catch (e) {
          console.error('Error procesando quota evolutiva:', e);
        }
      }
      else if (channel === 'selene:evolution:safety') {
        try {
          const safety = JSON.parse(message);
          console.log('🛡️ Estado de seguridad evolutiva actualizado:', safety);

          // Broadcast a clientes conectados
          io.emit('evolution:safety', safety);

          // Guardar en Redis
          await redis.set('selene:evolution:safety', JSON.stringify(safety));
        } catch (e) {
          console.error('Error procesando seguridad evolutiva:', e);
        }
      }
      else if (channel === 'selene:evolution:metrics') {
        try {
          const metrics = JSON.parse(message);
          console.log('📈 Métricas evolutivas actualizadas:', metrics);

          // Broadcast a clientes conectados
          io.emit('evolution:metrics', metrics);

          // Guardar en Redis
          await redis.set('selene:evolution:metrics', JSON.stringify(metrics));
        } catch (e) {
          console.error('Error procesando métricas evolutivas:', e);
        }
      }

    } catch (error) {
      console.error('❌ Error procesando mensaje Redis pub/sub:', error);
    }
  });

  console.log('✅ Redis Pub/Sub Subscriber Initialized.');
  return redisSubscriber;
};

// (Opcional) Función para cerrar la conexión si es necesario
export const stopRedisSubscriber = () => {
  redisSubscriber?.disconnect();
  redisSubscriber = null;
  console.log('🛑 Redis Pub/Sub Subscriber stopped.');
};