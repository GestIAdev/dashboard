import { Socket } from 'socket.io';
// Importa el servicio de métricas
import { getCurrentMetrics } from '../services/metrics-service.js';

// Mapa para mantener los intervalos por socket
const socketIntervals = new Map<string, NodeJS.Timeout>();

// Función para iniciar el stream para un socket específico
export const startMetricsStream = (socket: Socket) => {
  // Si ya existe un intervalo para este socket, lo limpiamos
  if (socketIntervals.has(socket.id)) {
    clearInterval(socketIntervals.get(socket.id)!);
  }

  console.log(`🚀 Starting metrics stream for socket ${socket.id}...`);

  // Crear intervalo específico para este socket
  const interval = setInterval(async () => {
    try {
      const metrics = await getCurrentMetrics();
      // Emite solo a este socket específico
      socket.emit('metrics_update', {
        timestamp: Date.now(),
        data: {
          metrics: metrics,
          consensus: {
            quality: metrics.consensus_quality,
            harmony: metrics.harmony_score
          }
        }
      });
    } catch (error) {
      console.error(`Error in metrics stream for socket ${socket.id}:`, error);
    }
  }, 1000); // Intervalo de 1 segundo

  // Guardar el intervalo para este socket
  socketIntervals.set(socket.id, interval);
};

// Función para detener el stream de un socket específico
export const stopMetricsStream = (socket: Socket) => {
  if (socketIntervals.has(socket.id)) {
    clearInterval(socketIntervals.get(socket.id)!);
    socketIntervals.delete(socket.id);
    console.log(`🛑 Stopped metrics stream for socket ${socket.id}.`);
  }
};