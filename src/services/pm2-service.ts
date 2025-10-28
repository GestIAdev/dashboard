import pm2 from 'pm2';

// Función para obtener la lista de procesos
export const listProcesses = (): Promise<pm2.ProcessDescription[]> => {
  return new Promise((resolve, reject) => {
    pm2.list((err, list) => {
      if (err) {
        console.error('PM2 list error:', err);
        return reject(err);
      }
      resolve(list);
    });
  });
};

// Puedes añadir más wrappers aquí si son necesarios (ej. para 'describe' o logs)
// export const describeProcess = (processId: string | number): Promise<any> => { ... };

// Asegúrate de conectar a PM2 (puede hacerse aquí o en server.ts globalmente)
// pm2.connect((err) => {
//   if (err) {
//     console.error('PM2 connection error:', err);
//     process.exit(2);
//   }
// });
// Considera dónde es mejor manejar la conexión/desconexión de PM2. Por ahora, asumimos que está conectado.