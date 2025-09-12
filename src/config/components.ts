import type { CanvasComponent } from '../types/canvas';

export const COMPONENTS: CanvasComponent[] = [
  { id: 'database', icon: '🗄️', label: 'Database', description: 'Data storage' },
  { id: 'loadbalancer', icon: '⚖️', label: 'Load Balancer', description: 'Traffic distribution' },
  { id: 'cache', icon: '⚡', label: 'Cache', description: 'Fast data access' },
  { id: 'webserver', icon: '🌐', label: 'Web Server', description: 'HTTP requests' },
];
