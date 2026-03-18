const HOST_STATUS = {
  Live: 1,
  Online: 2,
  Busy: 3,
  Offline: 4,
};

// In-memory presence snapshot updated by socket events.
// Key: hostId (string). Value: { status, updatedAt, isOnline, isBusy, isLive }
const hostPresence = new Map();

// If we haven't heard about a host recently, don't trust presence.
const DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutes

function normalizeStatus(status) {
  if (!status) return "Offline";
  const s = String(status);
  return HOST_STATUS[s] ? s : "Offline";
}

function setHostPresence(hostId, presence) {
  if (!hostId) return;
  const key = String(hostId);
  const status = normalizeStatus(presence?.status);
  const updatedAt = Number(presence?.updatedAt) || Date.now();
  hostPresence.set(key, {
    status,
    updatedAt,
    isOnline: Boolean(presence?.isOnline ?? (status === "Online")),
    isBusy: Boolean(presence?.isBusy ?? (status === "Busy")),
    isLive: Boolean(presence?.isLive ?? (status === "Live")),
  });
}

function getHostPresence(hostId, { ttlMs = DEFAULT_TTL_MS } = {}) {
  if (!hostId) return null;
  const key = String(hostId);
  const data = hostPresence.get(key);
  if (!data) return null;
  if (ttlMs != null && ttlMs > 0 && Date.now() - data.updatedAt > ttlMs) return null;
  return data;
}

function getStatusRank(status) {
  return HOST_STATUS[normalizeStatus(status)] || 5;
}

function sortByPresence(hosts) {
  return hosts.sort((a, b) => getStatusRank(a.status) - getStatusRank(b.status));
}

module.exports = {
  setHostPresence,
  getHostPresence,
  getStatusRank,
  sortByPresence,
};

