// utils/redisClient.js
const Redis = require("ioredis");
const redis = new Redis({
  retryStrategy: () => null, // Don't retry on connection failure
  lazyConnect: true, // Don't connect immediately
});

let isConnected = false;

redis.on("connect", () => {
  console.log("✓ Redis connected successfully");
  isConnected = true;
});

redis.on("error", (err) => {
  console.warn(
    "⚠ Redis connection failed - Running without cache:",
    err.message
  );
  isConnected = false;
});

// Attempt to connect
redis.connect().catch(() => {
  console.warn("⚠ Redis not available - Running without cache");
});

// Cache statistics
const stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : 0;
    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      deletes: this.deletes,
      total,
      hitRate: `${hitRate}%`,
    };
  },
  reset() {
    this.hits = 0;
    this.misses = 0;
    this.sets = 0;
    this.deletes = 0;
  },
};

// Wrapper functions that handle Redis being unavailable
const safeRedis = {
  async get(key) {
    if (!isConnected) {
      stats.misses++;
      return null;
    }
    try {
      const value = await redis.get(key);
      if (value) {
        stats.hits++;
        console.log(
          `🎯 CACHE HIT: ${key} | Hit Rate: ${stats.getStats().hitRate}`
        );
      } else {
        stats.misses++;
        console.log(
          `❌ CACHE MISS: ${key} | Hit Rate: ${stats.getStats().hitRate}`
        );
      }
      return value;
    } catch (err) {
      console.warn("Redis GET error:", err.message);
      stats.misses++;
      return null;
    }
  },

  async set(key, value, ...args) {
    if (!isConnected) return null;
    try {
      const result = await redis.set(key, value, ...args);
      stats.sets++;
      console.log(`💾 CACHE SET: ${key}`);
      return result;
    } catch (err) {
      console.warn("Redis SET error:", err.message);
      return null;
    }
  },

  async del(key) {
    if (!isConnected) return null;
    try {
      const result = await redis.del(key);
      stats.deletes++;
      console.log(`🗑️  CACHE DELETE: ${key}`);
      return result;
    } catch (err) {
      console.warn("Redis DEL error:", err.message);
      return null;
    }
  },

  getStats() {
    return stats.getStats();
  },

  resetStats() {
    stats.reset();
    console.log("📊 Cache statistics reset");
  },
};

module.exports = safeRedis;
