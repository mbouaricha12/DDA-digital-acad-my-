'use strict';

class MemoryRateLimiter {
  constructor({ windowMs = 60_000, max = 10, clock = () => Date.now() } = {}) {
    if (!Number.isInteger(windowMs) || windowMs <= 0) throw new Error('windowMs must be a positive integer');
    if (!Number.isInteger(max) || max <= 0) throw new Error('max must be a positive integer');
    this.windowMs = windowMs;
    this.max = max;
    this.clock = clock;
    this.buckets = new Map();
  }

  consume(key) {
    const now = Number(this.clock());
    const current = this.buckets.get(String(key));
    if (!current || now - current.startedAt >= this.windowMs) {
      this.buckets.set(String(key), { startedAt: now, count: 1 });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (current.count >= this.max) {
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((this.windowMs - (now - current.startedAt)) / 1000)) };
    }
    current.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  prune() {
    const now = Number(this.clock());
    for (const [key, bucket] of this.buckets) if (now - bucket.startedAt >= this.windowMs) this.buckets.delete(key);
  }
}

module.exports = { MemoryRateLimiter };
