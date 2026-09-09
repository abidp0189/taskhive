/**
 * realtime.js — Server-Sent Events (SSE) manager
 *
 * Tracks authenticated SSE clients per userId and role.
 * Provides secure, per-user and per-role event broadcasting.
 * No external dependencies — uses Express Response objects directly.
 */

// Map<userId, Set<res>>
const userConnections = new Map();

// Map<role, Set<res>>
const roleConnections = new Map();

// Keep-alive interval reference
let heartbeatInterval = null;

/**
 * Start the SSE heartbeat (call once on server start)
 */
function startHeartbeat() {
  if (heartbeatInterval) return;
  heartbeatInterval = setInterval(() => {
    broadcast('heartbeat', { ts: Date.now() });
  }, 25000);
}

/**
 * Register a new SSE client connection.
 * @param {string} userId
 * @param {string} role
 * @param {import('express').Response} res
 */
function addClient(userId, role, res) {
  // User bucket
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId).add(res);

  // Role bucket
  if (!roleConnections.has(role)) {
    roleConnections.set(role, new Set());
  }
  roleConnections.get(role).add(res);

  // Cleanup on client disconnect
  res.on('close', () => {
    removeClient(userId, role, res);
  });
}

/**
 * Remove a client from all buckets.
 */
function removeClient(userId, role, res) {
  const userSet = userConnections.get(userId);
  if (userSet) {
    userSet.delete(res);
    if (userSet.size === 0) userConnections.delete(userId);
  }
  const roleSet = roleConnections.get(role);
  if (roleSet) {
    roleSet.delete(res);
    if (roleSet.size === 0) roleConnections.delete(role);
  }
}

/**
 * Send an SSE event to a specific user.
 * @param {string} userId
 * @param {string} event
 * @param {object} data
 */
function sendToUser(userId, event, data) {
  const connections = userConnections.get(userId);
  if (!connections || connections.size === 0) return;
  const payload = formatSSE(event, data);
  connections.forEach((res) => {
    try {
      if (!res.writableEnded) res.write(payload);
    } catch (_) {
      // ignore stale connections
    }
  });
}

/**
 * Send an SSE event to all clients with a given role.
 * @param {string} role  e.g. 'ADMIN', 'EMPLOYER', 'WORKER'
 * @param {string} event
 * @param {object} data
 */
function sendToRole(role, event, data) {
  const connections = roleConnections.get(role);
  if (!connections || connections.size === 0) return;
  const payload = formatSSE(event, data);
  connections.forEach((res) => {
    try {
      if (!res.writableEnded) res.write(payload);
    } catch (_) {
      // ignore stale connections
    }
  });
}

/**
 * Broadcast to ALL connected clients.
 * Only use for truly public events (e.g. heartbeat).
 * @param {string} event
 * @param {object} data
 */
function broadcast(event, data) {
  const payload = formatSSE(event, data);
  userConnections.forEach((connections) => {
    connections.forEach((res) => {
      try {
        if (!res.writableEnded) res.write(payload);
      } catch (_) {
        // ignore
      }
    });
  });
}

/**
 * Format an SSE message string.
 */
function formatSSE(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Get current connection stats (for debugging).
 */
function getStats() {
  let total = 0;
  userConnections.forEach((set) => { total += set.size; });
  return { totalConnections: total, userCount: userConnections.size };
}

module.exports = {
  startHeartbeat,
  addClient,
  removeClient,
  sendToUser,
  sendToRole,
  broadcast,
  getStats,
};
