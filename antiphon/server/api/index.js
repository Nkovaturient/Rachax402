/**
 * Vercel serverless entry — picks app by SERVICE_TYPE env.
 * rachax402-storage:  SERVICE_TYPE=storage  (default)
 * rachax402-analyzer: SERVICE_TYPE=analyzer
 */
const service = process.env.SERVICE_TYPE === 'analyzer' ? 'analyzer' : 'storage';

const mod = service === 'analyzer'
  ? await import('../agentB-server.js')
  : await import('../pinata-server.js');

export default mod.default;
