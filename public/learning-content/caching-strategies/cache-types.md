# Types of Caches

## Introduction

**Caching** is storing frequently accessed data in a fast-access layer to reduce latency and database load. Understanding different cache types helps you choose the right caching strategy for your application.

## Why Cache?

### Performance Benefits:

- ⚡ **Reduce latency**: RAM (microseconds) vs Disk (milliseconds)
- 📈 **Increase throughput**: Handle more requests with same resources
- 💰 **Lower costs**: Reduce expensive database queries
- 🎯 **Better UX**: Faster page loads and responses

### The Speed Hierarchy:

```
Speed (Fastest → Slowest):
┌─────────────────┐  ~1 ns
│  CPU Cache      │
├─────────────────┤  ~100 ns
│  RAM            │  ← Most caches live here
├─────────────────┤  ~100 μs
│  SSD            │
├─────────────────┤  ~10 ms
│  Hard Disk      │
├─────────────────┤  ~100+ ms
│  Network DB     │  ← What we're trying to avoid
└─────────────────┘
```

## Cache Layers

### 1. Client-Side Caching

**Data stored on the client device (browser, mobile app).**

#### Browser Cache

**HTTP caching headers control browser behavior:**

```http
HTTP/1.1 200 OK
Cache-Control: public, max-age=31536000, immutable
ETag: "abc123"
Last-Modified: Wed, 01 Jan 2025 00:00:00 GMT
```

**Cache-Control directives:**

```
public:         Can be cached by any cache
private:        Only cached by browser
no-cache:       Revalidate with server before using
no-store:       Don't cache at all
max-age=3600:   Cache for 1 hour
immutable:      File never changes (fingerprinted assets)
```

**Example implementation:**

```javascript
// Express.js
app.get("/static/*", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.sendFile(req.path);
});

app.get("/api/*", (req, res) => {
  res.setHeader("Cache-Control", "private, no-cache");
  res.json(data);
});
```

#### Local Storage / IndexedDB

**Store data in browser storage:**

```javascript
// LocalStorage (synchronous, 5-10MB limit)
localStorage.setItem("user", JSON.stringify(userData));
const user = JSON.parse(localStorage.getItem("user"));

// SessionStorage (clears on tab close)
sessionStorage.setItem("temp", value);

// IndexedDB (asynchronous, larger storage)
const db = await openDB("myDB", 1);
await db.put("users", userData);
const user = await db.get("users", userId);
```

**Best for:**

- User preferences
- Authentication tokens
- Offline functionality
- Recently viewed items

#### Service Workers

**Advanced client-side caching:**

```javascript
// service-worker.js
const CACHE_NAME = "v1";
const urlsToCache = ["/", "/styles.css", "/script.js", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request)),
  );
});
```

**Best for:**

- Progressive Web Apps (PWAs)
- Offline functionality
- Static assets
- API response caching

### 2. CDN (Content Delivery Network)

**Distributed caches close to users geographically.**

```
User in Tokyo → Tokyo CDN Edge → Origin Server (San Francisco)
                  ↓ (cached)
           Return from cache (fast!)
```

**What to cache in CDN:**

- ✅ Images, videos, fonts
- ✅ JavaScript, CSS files
- ✅ Static HTML pages
- ✅ API responses (with proper headers)

**CDN configuration example (Cloudflare):**

```javascript
// Cloudflare Workers
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const cache = caches.default;
  let response = await cache.match(request);

  if (!response) {
    response = await fetch(request);
    // Cache for 1 hour
    response = new Response(response.body, response);
    response.headers.set("Cache-Control", "public, max-age=3600");
    event.waitUntil(cache.put(request, response.clone()));
  }

  return response;
}
```

**Benefits:**

- ⚡ Low latency (geographic proximity)
- 📈 Reduced origin server load
- 🛡️ DDoS protection
- 🌍 Global availability

**Popular CDNs:** Cloudflare, AWS CloudFront, Fastly, Akamai

### 3. Application-Level Cache

**In-memory cache within your application server.**

#### In-Process Cache

**Cache within the application process:**

```javascript
// Simple in-memory cache (Node.js)
const cache = new Map();

function getCachedData(key) {
  if (cache.has(key)) {
    const { value, expiry } = cache.get(key);
    if (expiry > Date.now()) {
      return value;
    }
    cache.delete(key);
  }
  return null;
}

function setCachedData(key, value, ttlMs = 60000) {
  cache.set(key, {
    value,
    expiry: Date.now() + ttlMs,
  });
}

// Usage
async function getUser(userId) {
  const cached = getCachedData(`user:${userId}`);
  if (cached) return cached;

  const user = await db.users.findOne({ id: userId });
  setCachedData(`user:${userId}`, user, 300000); // 5 min TTL
  return user;
}
```

**Pros:**

- ✅ Fastest access (no network)
- ✅ Simple to implement
- ✅ No external dependencies

**Cons:**

- ❌ Limited to process memory
- ❌ Lost on restart
- ❌ Not shared across servers
- ❌ Inconsistent in multi-server setup

**Best for:**

- Single-server applications
- Computed/expensive calculations
- Static configuration data

### 4. Distributed Cache

**Shared cache across multiple application servers.**

#### Redis

**Most popular distributed cache:**

```javascript
const Redis = require("ioredis");
const redis = new Redis();

// String operations
await redis.set("user:123", JSON.stringify(userData), "EX", 3600);
const user = JSON.parse(await redis.get("user:123"));

// Hash operations (better for objects)
await redis.hset("user:123", "name", "Alice", "email", "alice@example.com");
const name = await redis.hget("user:123", "name");
const allFields = await redis.hgetall("user:123");

// Lists (for queues, recent items)
await redis.lpush("recent:items", item1, item2);
const recent = await redis.lrange("recent:items", 0, 9); // Get 10 most recent

// Sets (for unique items)
await redis.sadd("online:users", "user1", "user2");
const isOnline = await redis.sismember("online:users", "user1");

// Sorted sets (for leaderboards, rankings)
await redis.zadd("leaderboard", 100, "player1", 200, "player2");
const top10 = await redis.zrevrange("leaderboard", 0, 9, "WITHSCORES");

// Expire keys automatically
await redis.setex("session:abc", 3600, sessionData); // Expires in 1 hour
```

**Advanced patterns:**

```javascript
// Cache-aside pattern
async function getUserWithCache(userId) {
  // 1. Try cache first
  const cached = await redis.get(`user:${userId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Cache miss - query database
  const user = await db.users.findOne({ id: userId });

  // 3. Store in cache for next time
  await redis.setex(`user:${userId}`, 300, JSON.stringify(user));

  return user;
}

// Batch operations (pipeline)
const pipeline = redis.pipeline();
for (let i = 0; i < 1000; i++) {
  pipeline.set(`key:${i}`, `value:${i}`);
}
await pipeline.exec(); // Execute all at once

// Pub/Sub for cache invalidation
redis.subscribe("user:invalidate");
redis.on("message", (channel, userId) => {
  cache.del(`user:${userId}`);
});

// Invalidate across all servers
redis.publish("user:invalidate", "123");
```

#### Memcached

**Simpler, faster, but less features:**

```javascript
const Memcached = require("memcached");
const memcached = new Memcached("localhost:11211");

// Set with TTL
memcached.set("mykey", "myvalue", 3600, (err) => {
  if (err) console.error(err);
});

// Get
memcached.get("mykey", (err, data) => {
  console.log(data);
});

// Delete
memcached.del("mykey", (err) => {});
```

**Redis vs Memcached:**

| Feature             | Redis                                     | Memcached                            |
| ------------------- | ----------------------------------------- | ------------------------------------ |
| **Data structures** | Strings, Lists, Sets, Hashes, Sorted Sets | Strings only                         |
| **Persistence**     | Optional (RDB, AOF)                       | None                                 |
| **Replication**     | Yes                                       | No                                   |
| **Pub/Sub**         | Yes                                       | No                                   |
| **Lua scripting**   | Yes                                       | No                                   |
| **Performance**     | Very fast                                 | Slightly faster for simple gets/sets |
| **Use case**        | General purpose                           | Simple string caching                |

### 5. Database Query Cache

**Cache at the database level.**

#### MySQL Query Cache (Deprecated)

```sql
-- Query cache (MySQL 5.7 and earlier)
SELECT SQL_CACHE * FROM users WHERE id = 123;
```

#### PostgreSQL Shared Buffers

```
# postgresql.conf
shared_buffers = 256MB      # RAM cache for data/indexes
effective_cache_size = 4GB  # OS + PG cache estimate
```

#### Application-managed query cache

```javascript
const queryCache = new Map();

async function cachedQuery(sql, params) {
  const cacheKey = `${sql}:${JSON.stringify(params)}`;

  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey);
  }

  const result = await db.query(sql, params);
  queryCache.set(cacheKey, result);

  // Invalidate after 1 minute
  setTimeout(() => queryCache.delete(cacheKey), 60000);

  return result;
}
```

### 6. Full-Page Cache

**Cache entire rendered HTML pages.**

```javascript
// Varnish configuration
sub vcl_recv {
  if (req.url ~ "^/blog/") {
    return (hash);  // Cache blog pages
  }
}

sub vcl_backend_response {
  if (bereq.url ~ "^/blog/") {
    set beresp.ttl = 1h;  // Cache for 1 hour
  }
}
```

**Nginx caching:**

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;

server {
    location / {
        proxy_cache my_cache;
        proxy_cache_valid 200 1h;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        proxy_pass http://backend;
    }
}
```

**Best for:**

- Static pages
- Blog posts
- Product pages
- Landing pages

## Choosing the Right Cache

### Decision Matrix:

| Use Case             | Recommended Cache | Why                                |
| -------------------- | ----------------- | ---------------------------------- |
| **Static assets**    | CDN + Browser     | Close to users, long TTL           |
| **User sessions**    | Redis             | Shared across servers, TTL support |
| **API responses**    | Redis/Memcached   | Fast, distributed                  |
| **Database queries** | Redis             | Reduce DB load                     |
| **Computed results** | In-memory         | No network overhead                |
| **HTML pages**       | Varnish/Nginx     | Fastest delivery                   |
| **User preferences** | LocalStorage      | Offline access                     |

## Cache Hierarchy

**Multi-layer caching for optimal performance:**

```
Request Flow:
1. Browser Cache     → Hit? Return (fastest)
2. CDN Edge          → Hit? Return (fast)
3. Redis/Memcached   → Hit? Return (medium)
4. Database          → Query & populate caches (slowest)
```

**Implementation:**

```javascript
async function getData(key) {
  // L1: In-memory cache
  const l1 = memoryCache.get(key);
  if (l1) return l1;

  // L2: Redis cache
  const l2 = await redis.get(key);
  if (l2) {
    memoryCache.set(key, l2);
    return l2;
  }

  // L3: Database
  const data = await db.query(key);

  // Populate caches
  await redis.setex(key, 300, data);
  memoryCache.set(key, data);

  return data;
}
```

## Best Practices

1. **Cache frequently accessed, rarely changed data**
2. **Set appropriate TTLs** (balance freshness vs performance)
3. **Monitor cache hit rates** (aim for >80%)
4. **Handle cache failures gracefully** (fallback to database)
5. **Warm up caches** after deployment
6. **Version cache keys** for easy invalidation

## Key Takeaways

✅ **Client-side** (browser) for static assets and user data  
✅ **CDN** for global content delivery  
✅ **Redis** for shared application cache  
✅ **In-memory** for single-server computed data  
✅ **Multi-layer caching** for optimal performance  
✅ Choose based on **data access patterns** and **consistency requirements**

## Next Lesson

Continue to **Cache Invalidation Strategies** to learn how to keep your caches fresh and consistent! 🔄
