// 🎸 SELENE SYNERGY HUB - UTILIDADES
// "Funciones genéricas reutilizables"

/**
 * Calcula tendencia simple (subiendo/bajando/estable)
 */
export function calculateTrend(values: number[]): { direction: 'up' | 'down' | 'stable'; change: number } {
  if (values.length < 2) return { direction: 'stable', change: 0 };
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const avgFirst = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
  
  const change = avgSecond - avgFirst;
  const direction = Math.abs(change) < 0.05 ? 'stable' : (change > 0 ? 'up' : 'down');
  
  return { direction, change: Math.round(change * 100) / 100 };
}