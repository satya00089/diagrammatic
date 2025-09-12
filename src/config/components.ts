import type { CanvasComponent } from '../types/canvas';

export const COMPONENTS: CanvasComponent[] = [
  { id: 'database', icon: '🗄️', label: 'Database', description: 'Data storage', properties: [
    { key: 'replication', label: 'Replication Factor', type: 'number', default: 3 },
    { key: 'sharding', label: 'Sharding', type: 'boolean', default: true },
  ] },
  { id: 'loadbalancer', icon: '⚖️', label: 'Load Balancer', description: 'Traffic distribution', properties: [
    { key: 'strategy', label: 'Strategy', type: 'select', default: 'round-robin', options: ['round-robin', 'least-connections', 'ip-hash'] },
    { key: 'healthCheck', label: 'Health Check', type: 'boolean', default: true },
  ] },
  { id: 'cache', icon: '⚡', label: 'Cache', description: 'Fast data access', properties: [
    { key: 'ttl', label: 'TTL (seconds)', type: 'number', default: 3600 },
    { key: 'inMemory', label: 'In Memory', type: 'boolean', default: true },
  ] },
  { id: 'webserver', icon: '🌐', label: 'Web Server', description: 'HTTP requests', properties: [
    { key: 'instances', label: 'Instances', type: 'number', default: 2 },
    { key: 'gzip', label: 'Gzip', type: 'boolean', default: true },
  ] },
];
