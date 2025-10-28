import { Socket } from 'socket.io';
// Importa el servicio PM2
import { listProcesses } from '../services/pm2-service.js';
import pm2 from 'pm2';
import { promisify } from 'util';

// Mapa para mantener los intervalos por socket
const socketIntervals = new Map<string, NodeJS.Timeout>();

export const startPm2Stream = (socket: Socket) => {
  // Si ya existe un intervalo para este socket, lo limpiamos
  if (socketIntervals.has(socket.id)) {
    clearInterval(socketIntervals.get(socket.id)!);
  }

  console.log(`🚀 Starting PM2 stream for socket ${socket.id}...`);

  // Crear intervalo específico para este socket
  const interval = setInterval(async () => {
    try {
      console.log('🔄 Enviando datos PM2 via Socket.io...');
      const pm2Connect = promisify(pm2.connect.bind(pm2));
      const pm2List = promisify(pm2.list.bind(pm2));

      await pm2Connect();
      const pm2ListResult = await pm2List();
      console.log(`📊 PM2 encontró ${pm2ListResult.length} procesos totales`);

      const processes = pm2ListResult
        .filter((proc: any) => proc.name.includes('selene'))
        .map((proc: any) => ({
          name: proc.name,
          pid: proc.pid,
          pm2_env: {
            status: proc.pm2_env?.status,
            pm_uptime: proc.pm2_env?.pm_uptime,
            restart_time: proc.pm2_env?.restart_time || 0
          },
          monit: {
            memory: proc.monit?.memory || 0,
            cpu: proc.monit?.cpu || 0
          },
          logs: [] // Placeholder para logs
        }));

      console.log(`🎯 Enviando ${processes.length} procesos selene al dashboard`);

      const summary = {
        total: processes.length,
        online: processes.filter(p => p.pm2_env.status === 'online').length,
        memory: processes.reduce((sum, p) => sum + (p.monit.memory || 0), 0),
        cpu: processes.reduce((sum, p) => sum + (p.monit.cpu || 0), 0)
      };

      // Emite solo a este socket específico
      socket.emit('pm2', {
        timestamp: Date.now(),
        data: {
          processes: processes,
          summary: summary
        }
      });

      console.log('✅ Datos PM2 enviados exitosamente via Socket.io');
      pm2.disconnect();
    } catch (error) {
      console.error(`❌ Error obteniendo datos PM2 para socket ${socket.id}:`, error);
    }
  }, 5000); // Intervalo de 5 segundos

  // Guardar el intervalo para este socket
  socketIntervals.set(socket.id, interval);
};

export const stopPm2Stream = (socket: Socket) => {
  if (socketIntervals.has(socket.id)) {
    clearInterval(socketIntervals.get(socket.id)!);
    socketIntervals.delete(socket.id);
    console.log(`🛑 Stopped PM2 stream for socket ${socket.id}.`);
  }
};