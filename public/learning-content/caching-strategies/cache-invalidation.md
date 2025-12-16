# Cache Invalidation Strategies

## Introduction

> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

**Cache invalidation** is the process of removing or updating stale data from cache. Getting it right is crucial for data consistency while maintaining performance benefits.

## The Cache Consistency Problem

**The Challenge:** How do you ensure cached data stays synchronized with the source of truth?

```
Time    Cache        Database      Problem
────────────────────────────────────────────
T0      user.name="Alice"  user.name="Alice"   ✅ Consistent
T1      user.name="Alice"  user.name="Bob"     ❌ Stale cache!
```

## Cache Invalidation Strategies

### 1. Time-to-Live (TTL)

**Set an expiration time for cached data.**

```javascript
// Redis with TTL
await redis.setex("user:123", 300, userData); // Expires in 300 seconds

// Memcached
memcached.set("key", value, 60, callback); // 60 seconds TTL

// In-memory cache
cache.set("key", value, { ttl: 1000 * 60 * 5 }); // 5 minutes
```

**How it works:**

```
T0:  SET user:123, TTL=300s
T1:  GET user:123 → Hit (299s remaining)
T2:  GET user:123 → Hit (150s remaining)
...
T300: GET user:123 → Miss (expired)
      Fetch from DB, cache again
```

**Pros:**

- ✅ Simple to implement
- ✅ Automatic cleanup
- ✅ Predictable memory usage
- ✅ No manual invalidation needed

**Cons:**

- ❌ May serve stale data until expiry
- ❌ Cache stampede on expiration
- ❌ Choosing right TTL is hard

**Choosing TTL:**

```javascript
// High consistency needs (short TTL)
await redis.setex("stock:price", 5, stockData); // 5 seconds

// Balance (medium TTL)
await redis.setex("user:profile", 300, userData); // 5 minutes

// Rarely changes (long TTL)
await redis.setex("product:info", 3600, product); // 1 hour

// Very stable (very long TTL)
await redis.setex("country:list", 86400, countries); // 24 hours
```

**TTL Best Practices:**

```javascript
// Pattern: Shorter TTL + Background refresh
const TTL_SHORT = 60; // 1 minute user-facing
const TTL_LONG = 300; // 5 minutes background

async function getCachedData(key) {
  const data = await cache.get(key);
  const ttl = await cache.ttl(key);

  // If TTL < 25% remaining, refresh in background
  if (ttl < TTL_SHORT * 0.25) {
    refreshInBackground(key);
  }

  return data;
}

async function refreshInBackground(key) {
  const freshData = await fetchFromDatabase(key);
  await cache.setex(key, TTL_LONG, freshData);
}
```

### 2. Cache-Aside (Lazy Loading)

**Application manages cache explicitly.**

```javascript
async function getUserCacheAside(userId) {
  const cacheKey = `user:${userId}`;

  // 1. Try to get from cache
  let user = await cache.get(cacheKey);

  if (user) {
    return JSON.parse(user);
  }

  // 2. Cache miss - fetch from database
  user = await db.users.findOne({ id: userId });

  // 3. Store in cache for next time
  await cache.setex(cacheKey, 300, JSON.stringify(user));

  return user;
}

async function updateUser(userId, updates) {
  // 1. Update database
  await db.users.update({ id: userId }, updates);

  // 2. Invalidate cache
  await cache.del(`user:${userId}`);

  // Next read will fetch fresh data from DB
}
```

**Flow Diagram:**

```
Read:
  GET from cache → Hit? → Return
                    ↓ Miss
              Query database
                    ↓
              Store in cache
                    ↓
                  Return

Update:
  Update database
        ↓
  Delete from cache
```

**Pros:**

- ✅ Only caches requested data
- ✅ Cache misses aren't fatal
- ✅ Flexible control

**Cons:**

- ❌ Cache miss penalty (3 operations: check cache, query DB, populate cache)
- ❌ Potential for stale data if updates don't invalidate
- ❌ Application complexity

### 3. Write-Through Cache

**Update cache and database together on writes.**

```javascript
async function updateUserWriteThrough(userId, updates) {
  const cacheKey = `user:${userId}`;

  // 1. Update database
  const updatedUser = await db.users.update({ id: userId }, updates);

  // 2. Update cache immediately
  await cache.setex(cacheKey, 300, JSON.stringify(updatedUser));

  return updatedUser;
}

async function getUserWriteThrough(userId) {
  const cacheKey = `user:${userId}`;

  let user = await cache.get(cacheKey);
  if (user) return JSON.parse(user);

  // Cache miss - populate cache
  user = await db.users.findOne({ id: userId });
  await cache.setex(cacheKey, 300, JSON.stringify(user));

  return user;
}
```

**Flow:**

```
Write:
  Update database
        ↓
  Update cache (sync)
        ↓
      Return

Read:
  GET from cache → Hit? → Return
                    ↓ Miss
              Query database
                    ↓
              Update cache
                    ↓
                  Return
```

**Pros:**

- ✅ Cache always consistent with DB
- ✅ No stale data
- ✅ Read performance (always cached after write)

**Cons:**

- ❌ Write latency (two operations)
- ❌ Cache might contain unused data
- ❌ More complex error handling

### 4. Write-Behind (Write-Back)

**Update cache immediately, database asynchronously.**

```javascript
const writeQueue = [];

async function updateUserWriteBehind(userId, updates) {
  const cacheKey = `user:${userId}`;

  // 1. Update cache immediately (fast!)
  await cache.setex(cacheKey, 300, JSON.stringify(updates));

  // 2. Queue database update (async)
  writeQueue.push({ userId, updates, timestamp: Date.now() });

  return updates; // Return immediately
}

// Background worker
setInterval(async () => {
  const batch = writeQueue.splice(0, 100); // Process 100 at a time

  for (const { userId, updates } of batch) {
    try {
      await db.users.update({ id: userId }, updates);
    } catch (error) {
      // Handle failure (retry, log, alert)
      console.error("DB update failed:", error);
    }
  }
}, 1000); // Every second
```

**Flow:**

```
Write:
  Update cache
        ↓
  Queue DB write (async)
        ↓
  Return immediately (fast!)
        ↓
  [Background] Process queue → Update DB
```

**Pros:**

- ✅ Very fast writes (cache only)
- ✅ Batch DB writes (efficient)
- ✅ Better performance under load

**Cons:**

- ❌ Data loss risk (if cache fails before DB write)
- ❌ Complex failure handling
- ❌ Eventual consistency

**Use cases:**

- Analytics counters
- View counts
- Activity logs
- Non-critical updates

### 5. Refresh-Ahead

**Proactively refresh cache before expiration.**

```javascript
class RefreshAheadCache {
  constructor(ttl = 300, refreshThreshold = 0.8) {
    this.ttl = ttl;
    this.refreshThreshold = refreshThreshold; // Refresh at 80% of TTL
  }

  async get(key, fetchFunction) {
    const cached = await cache.get(key);
    const ttl = await cache.ttl(key);

    if (cached) {
      // Check if we should refresh proactively
      if (ttl < this.ttl * (1 - this.refreshThreshold)) {
        // Refresh in background (don't wait)
        this.refreshAsync(key, fetchFunction);
      }
      return JSON.parse(cached);
    }

    // Cache miss - fetch and cache
    return this.refresh(key, fetchFunction);
  }

  async refresh(key, fetchFunction) {
    const data = await fetchFunction();
    await cache.setex(key, this.ttl, JSON.stringify(data));
    return data;
  }

  async refreshAsync(key, fetchFunction) {
    // Non-blocking refresh
    this.refresh(key, fetchFunction).catch(console.error);
  }
}

// Usage
const cache = new RefreshAheadCache(300, 0.8);

const user = await cache.get("user:123", async () => {
  return await db.users.findOne({ id: 123 });
});
```

**Pros:**

- ✅ Avoids cache misses
- ✅ Consistent performance
- ✅ Reduces cache stampede

**Cons:**

- ❌ Refreshes data that might not be accessed
- ❌ Extra DB load
- ❌ Complex implementation

### 6. Event-Based Invalidation

**Invalidate cache when data changes (pub/sub).**

```javascript
// Publisher (on data update)
async function updateUser(userId, updates) {
  // 1. Update database
  await db.users.update({ id: userId }, updates);

  // 2. Publish invalidation event
  await redis.publish(
    "cache:invalidate",
    JSON.stringify({
      type: "user",
      id: userId,
    }),
  );
}

// Subscriber (on all app servers)
redis.subscribe("cache:invalidate");

redis.on("message", async (channel, message) => {
  const event = JSON.parse(message);

  if (event.type === "user") {
    // Invalidate cache on this server
    await cache.del(`user:${event.id}`);
    console.log(`Invalidated cache for user:${event.id}`);
  }
});
```

**With message queues:**

```javascript
// Producer
await queue.publish("cache.invalidate.user", {
  userId: 123,
  timestamp: Date.now(),
});

// Consumer
queue.subscribe("cache.invalidate.user", async (message) => {
  await cache.del(`user:${message.userId}`);
});
```

**Pros:**

- ✅ Immediate invalidation across all servers
- ✅ No stale data
- ✅ Event-driven architecture

**Cons:**

- ❌ Requires pub/sub infrastructure
- ❌ Network dependency
- ❌ Message delivery reliability

## Advanced Patterns

### Cache Stampede Prevention

**Problem:** When popular cache expires, many requests hit DB simultaneously.

```
Cache expires → 1000 requests → All query DB → Overwhelm DB
```

**Solution 1: Locking**

```javascript
const locks = new Map();

async function getWithLock(key, fetchFunction) {
  // Check cache first
  const cached = await cache.get(key);
  if (cached) return JSON.parse(cached);

  // Acquire lock
  if (locks.has(key)) {
    // Wait for other request to populate cache
    await locks.get(key);
    return JSON.parse(await cache.get(key));
  }

  // Create lock promise
  const lockPromise = (async () => {
    const data = await fetchFunction();
    await cache.setex(key, 300, JSON.stringify(data));
    return data;
  })();

  locks.set(key, lockPromise);

  try {
    const result = await lockPromise;
    return result;
  } finally {
    locks.delete(key);
  }
}
```

**Solution 2: Probabilistic Early Expiration**

```javascript
async function getWithProbabilisticExpiry(key, ttl = 300) {
  const cached = await cache.get(key);
  const currentTtl = await cache.ttl(key);

  if (cached) {
    // Probability of refresh increases as TTL decreases
    const refreshProbability = 1 - currentTtl / ttl;

    if (Math.random() < refreshProbability) {
      // Random request refreshes cache early
      refreshInBackground(key);
    }

    return JSON.parse(cached);
  }

  // Cache miss
  return await fetchAndCache(key, ttl);
}
```

### Conditional Invalidation

```javascript
// Only invalidate if data actually changed
async function updateUserConditional(userId, updates) {
  const cacheKey = `user:${userId}`;
  const cached = await cache.get(cacheKey);

  // Update database
  const updated = await db.users.update({ id: userId }, updates);

  // Only invalidate if different
  if (cached && JSON.stringify(updated) !== cached) {
    await cache.del(cacheKey);
  } else if (!cached) {
    // No cache, populate it
    await cache.setex(cacheKey, 300, JSON.stringify(updated));
  }

  return updated;
}
```

### Cascading Invalidation

```javascript
// Invalidate related caches
async function updatePost(postId, updates) {
  await db.posts.update({ id: postId }, updates);

  const post = await db.posts.findOne({ id: postId });

  // Invalidate multiple related caches
  await Promise.all([
    cache.del(`post:${postId}`),
    cache.del(`user:${post.userId}:posts`),
    cache.del(`feed:${post.userId}`),
    cache.del(`trending:posts`),
  ]);
}
```

## Choosing the Right Strategy

| Strategy          | Consistency | Performance | Complexity | Use Case             |
| ----------------- | ----------- | ----------- | ---------- | -------------------- |
| **TTL**           | Eventual    | High        | Low        | General purpose      |
| **Cache-Aside**   | Eventual    | High        | Medium     | Read-heavy           |
| **Write-Through** | Strong      | Medium      | Medium     | Consistency critical |
| **Write-Behind**  | Eventual    | Very High   | High       | High write load      |
| **Refresh-Ahead** | Eventual    | Very High   | High       | Hot data             |
| **Event-Based**   | Strong      | High        | High       | Distributed systems  |

## Best Practices

1. **Use appropriate TTL**
   - Short for frequently changing data
   - Long for stable data
   - Consider background refresh

2. **Monitor cache metrics**
   - Hit rate (target: >80%)
   - Miss rate
   - Eviction rate
   - Memory usage

3. **Handle cache failures gracefully**

```javascript
async function getWithFallback(key) {
  try {
    return await cache.get(key);
  } catch (error) {
    console.error("Cache error:", error);
    return await db.query(key); // Fallback to DB
  }
}
```

4. **Version your cache keys**

```javascript
const CACHE_VERSION = "v2";
const key = `${CACHE_VERSION}:user:${userId}`;
// Easy to invalidate all by changing version
```

5. **Batch operations**

```javascript
// Bad: Multiple round trips
for (const id of userIds) {
  await cache.del(`user:${id}`);
}

// Good: Single pipeline
const pipeline = cache.pipeline();
userIds.forEach((id) => pipeline.del(`user:${id}`));
await pipeline.exec();
```

6. **Log invalidations**

```javascript
await cache.del(key);
logger.info("Cache invalidated", { key, reason: "user_update" });
```

## Key Takeaways

✅ **TTL** is simplest but may serve stale data  
✅ **Write-through** ensures consistency but slower writes  
✅ **Write-behind** offers best write performance with risk  
✅ **Event-based** works best for distributed systems  
✅ Prevent **cache stampede** with locking or probabilistic expiry  
✅ Monitor cache **hit rates** and adjust strategies  
✅ **Version cache keys** for easy bulk invalidation

## Next Steps

You've completed the Caching Strategies module! 🎉

Continue to:

- **Microservices Architecture**: Learn about distributed systems
- **Practice Problems**: Apply caching concepts
- **System Design**: Integrate caching into larger systems

Ready for the next challenge? 🚀
