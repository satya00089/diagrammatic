# Load Balancing Algorithms

## Introduction

A load balancing algorithm determines **how** traffic is distributed across backend servers. Choosing the right algorithm is crucial for optimal performance, resource utilization, and user experience.

## Static vs Dynamic Algorithms

### Static Algorithms

- Use predefined rules
- Don't consider server state
- Simpler to implement
- Examples: Round Robin, Weighted Round Robin

### Dynamic Algorithms

- Consider real-time server metrics
- Adapt to changing conditions
- More complex but smarter
- Examples: Least Connections, Least Response Time

## Core Algorithms

### 1. Round Robin

**How it works:** Distribute requests sequentially across servers in rotation.

```
Request 1 → Server 1
Request 2 → Server 2
Request 3 → Server 3
Request 4 → Server 1  ← Back to start
Request 5 → Server 2
```

**Implementation:**

```typescript
class RoundRobinLoadBalancer {
  private servers: Server[];
  private currentIndex: number = 0;

  selectServer(): Server {
    const server = this.servers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.servers.length;
    return server;
  }
}

// Usage
const lb = new RoundRobinLoadBalancer(["server1", "server2", "server3"]);
lb.selectServer(); // server1
lb.selectServer(); // server2
lb.selectServer(); // server3
lb.selectServer(); // server1
```

**Pros:**

- ✅ Simple to implement
- ✅ Equal distribution
- ✅ No server state needed
- ✅ Low overhead

**Cons:**

- ❌ Ignores server capacity
- ❌ Ignores current load
- ❌ Treats all requests as equal

**Best for:**

- Homogeneous servers
- Similar request processing times
- Simple deployments

### 2. Weighted Round Robin

**How it works:** Assign weights based on server capacity, route proportionally.

```
Server 1 (weight: 5) → 50% traffic
Server 2 (weight: 3) → 30% traffic
Server 3 (weight: 2) → 20% traffic
```

**Configuration example:**

```nginx
upstream backend {
    server backend1.example.com weight=5;
    server backend2.example.com weight=3;
    server backend3.example.com weight=2;
}
```

**Implementation:**

```typescript
class WeightedRoundRobin {
  private servers: { server: Server; weight: number }[];
  private currentWeights: number[];

  selectServer(): Server {
    // Increase weights
    for (let i = 0; i < this.servers.length; i++) {
      this.currentWeights[i] += this.servers[i].weight;
    }

    // Find server with highest current weight
    let selected = 0;
    let maxWeight = this.currentWeights[0];
    for (let i = 1; i < this.currentWeights.length; i++) {
      if (this.currentWeights[i] > maxWeight) {
        maxWeight = this.currentWeights[i];
        selected = i;
      }
    }

    // Decrease selected server's weight
    const totalWeight = this.servers.reduce((sum, s) => sum + s.weight, 0);
    this.currentWeights[selected] -= totalWeight;

    return this.servers[selected].server;
  }
}
```

**Pros:**

- ✅ Accounts for server capacity differences
- ✅ Predictable distribution
- ✅ Simple configuration

**Cons:**

- ❌ Static weights don't adapt to load
- ❌ Requires manual weight tuning

**Best for:**

- Heterogeneous servers (different specs)
- Known server capacity differences
- Gradual traffic shifts (canary deployments)

### 3. Least Connections

**How it works:** Route to server with fewest active connections.

```
Server 1: 10 connections
Server 2: 5 connections   ← Route here (fewest)
Server 3: 8 connections
```

**Implementation:**

```typescript
class LeastConnectionsLoadBalancer {
  private servers: Map<Server, number> = new Map();

  selectServer(): Server {
    let minConnections = Infinity;
    let selectedServer: Server | null = null;

    for (const [server, connections] of this.servers.entries()) {
      if (connections < minConnections) {
        minConnections = connections;
        selectedServer = server;
      }
    }

    // Increment connection count
    this.servers.set(selectedServer, minConnections + 1);
    return selectedServer;
  }

  releaseConnection(server: Server): void {
    const current = this.servers.get(server) || 0;
    this.servers.set(server, Math.max(0, current - 1));
  }
}
```

**HAProxy configuration:**

```
backend servers
    balance leastconn
    server srv1 192.168.1.10:80 check
    server srv2 192.168.1.11:80 check
    server srv3 192.168.1.12:80 check
```

**Pros:**

- ✅ Dynamic load distribution
- ✅ Handles varying request times well
- ✅ Good for long-lived connections

**Cons:**

- ❌ Requires connection tracking
- ❌ More overhead than round robin
- ❌ Can overload newly added servers

**Best for:**

- Long-running requests
- WebSocket connections
- Database connection pooling
- Varying request processing times

### 4. Weighted Least Connections

**Combination:** Least connections + server weights

```
Server 1: 10 connections, weight: 5 → ratio: 2
Server 2: 5 connections, weight: 3  → ratio: 1.67 ← Route here
Server 3: 8 connections, weight: 2  → ratio: 4
```

**Formula:**

```
Score = Active Connections / Weight
Route to server with lowest score
```

**Best for:**

- Heterogeneous servers with varying load
- Dynamic load with different capacity servers

### 5. Least Response Time

**How it works:** Route to server with lowest average response time.

```
Server 1: Avg 50ms, 10 connections
Server 2: Avg 100ms, 5 connections
Server 3: Avg 30ms, 8 connections  ← Route here (fastest)
```

**Implementation:**

```typescript
class LeastResponseTimeLoadBalancer {
  private metrics: Map<
    Server,
    {
      totalResponseTime: number;
      requestCount: number;
      activeConnections: number;
    }
  > = new Map();

  selectServer(): Server {
    let bestScore = Infinity;
    let selectedServer: Server | null = null;

    for (const [server, metric] of this.metrics.entries()) {
      const avgResponseTime =
        metric.requestCount > 0
          ? metric.totalResponseTime / metric.requestCount
          : 0;

      // Score = avg response time × active connections
      const score = avgResponseTime * (metric.activeConnections + 1);

      if (score < bestScore) {
        bestScore = score;
        selectedServer = server;
      }
    }

    return selectedServer;
  }

  recordResponse(server: Server, responseTime: number): void {
    const metric = this.metrics.get(server);
    metric.totalResponseTime += responseTime;
    metric.requestCount++;
  }
}
```

**Pros:**

- ✅ Optimal user experience (fastest server)
- ✅ Adapts to server performance
- ✅ Considers both load and speed

**Cons:**

- ❌ Complex to implement
- ❌ Requires response time tracking
- ❌ Higher overhead

**Best for:**

- Performance-critical applications
- Servers with varying performance
- When user experience is priority

### 6. IP Hash / Source IP Affinity

**How it works:** Route based on client IP address hash.

```
Client IP: 192.168.1.100
Hash: hash('192.168.1.100') % 3 = 2
Route to: Server 2

Same client always goes to Server 2
```

**Implementation:**

```typescript
class IPHashLoadBalancer {
  private servers: Server[];

  selectServer(clientIP: string): Server {
    const hash = this.hashCode(clientIP);
    const index = Math.abs(hash) % this.servers.length;
    return this.servers[index];
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}
```

**Nginx configuration:**

```nginx
upstream backend {
    ip_hash;
    server backend1.example.com;
    server backend2.example.com;
    server backend3.example.com;
}
```

**Pros:**

- ✅ Session persistence without cookies
- ✅ Stateless (no session store needed)
- ✅ Cache-friendly (same server caches same user data)

**Cons:**

- ❌ Uneven distribution (if IPs are clustered)
- ❌ Problematic with NAT/proxy networks
- ❌ Doesn't adapt to server load

**Best for:**

- Session-based applications
- Caching scenarios
- When cookies aren't available

### 7. URL Hash / Consistent Hashing

**How it works:** Route based on request URL or parameter.

```
Request: /user/12345
Hash: hash('/user/12345') % 3 = 1
Route to: Server 1

All requests for user 12345 go to Server 1
```

**Use case:** Cache optimization

```nginx
upstream backend {
    hash $request_uri consistent;
    server backend1.example.com;
    server backend2.example.com;
    server backend3.example.com;
}
```

**Consistent Hashing:**

```typescript
class ConsistentHashLoadBalancer {
  private ring: Map<number, Server> = new Map();
  private virtualNodes = 150; // Per server

  addServer(server: Server): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this.hashCode(`${server.id}-${i}`);
      this.ring.set(hash, server);
    }
  }

  selectServer(key: string): Server {
    const hash = this.hashCode(key);

    // Find first server on ring clockwise from hash
    const sortedHashes = Array.from(this.ring.keys()).sort((a, b) => a - b);

    for (const ringHash of sortedHashes) {
      if (ringHash >= hash) {
        return this.ring.get(ringHash);
      }
    }

    // Wrap around to first server
    return this.ring.get(sortedHashes[0]);
  }
}
```

**Benefits of consistent hashing:**

- When server added/removed, only K/n keys are remapped (K = total keys, n = servers)
- Minimizes cache invalidation

**Best for:**

- CDN and cache servers
- Distributed caching (Redis, Memcached)
- Sharded databases
- Minimizing cache misses when scaling

### 8. Random Selection

**How it works:** Randomly select a server.

```typescript
class RandomLoadBalancer {
  private servers: Server[];

  selectServer(): Server {
    const index = Math.floor(Math.random() * this.servers.length);
    return this.servers[index];
  }
}
```

**Pros:**

- ✅ Simple implementation
- ✅ Good distribution over time
- ✅ No state maintenance

**Cons:**

- ❌ Short-term distribution can be uneven
- ❌ Ignores server load

**Best for:**

- Homogeneous servers
- Stateless applications
- When simplicity is key

## Advanced Algorithms

### 9. Adaptive Load Balancing

**How it works:** Combine multiple metrics with machine learning.

```typescript
interface ServerMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  avgResponseTime: number;
  errorRate: number;
}

class AdaptiveLoadBalancer {
  selectServer(): Server {
    let bestScore = Infinity;
    let selectedServer: Server | null = null;

    for (const server of this.servers) {
      const metrics = this.getMetrics(server);

      // Weighted score combining multiple factors
      const score =
        metrics.cpuUsage * 0.3 +
        metrics.memoryUsage * 0.2 +
        metrics.activeConnections * 0.2 +
        metrics.avgResponseTime * 0.2 +
        metrics.errorRate * 0.1;

      if (score < bestScore) {
        bestScore = score;
        selectedServer = server;
      }
    }

    return selectedServer;
  }
}
```

### 10. Geographic Load Balancing

**Route based on client location:**

```
Client in US → US Data Center
Client in EU → EU Data Center
Client in Asia → Asia Data Center
```

**Reduces latency by routing to nearest server.**

## Algorithm Comparison

| Algorithm               | Complexity | Adaptiveness | Session Affinity | Best Use Case                     |
| ----------------------- | ---------- | ------------ | ---------------- | --------------------------------- |
| **Round Robin**         | Low        | None         | No               | Homogeneous servers, simple setup |
| **Weighted RR**         | Low        | Static       | No               | Different capacity servers        |
| **Least Connections**   | Medium     | Dynamic      | No               | Long-lived connections            |
| **Least Response Time** | High       | Dynamic      | No               | Performance-critical apps         |
| **IP Hash**             | Low        | None         | Yes              | Session persistence               |
| **URL Hash**            | Medium     | None         | Partial          | Cache optimization                |
| **Random**              | Low        | None         | No               | Simple stateless apps             |
| **Adaptive**            | High       | Very Dynamic | No               | Complex, mission-critical systems |

## Choosing the Right Algorithm

### Decision Tree:

```
Do you need session persistence?
├─ Yes: Use IP Hash or Sticky Sessions
└─ No: Continue ↓

Are all servers identical?
├─ Yes: Round Robin or Random
└─ No: Continue ↓

Do you have long-running connections?
├─ Yes: Least Connections
└─ No: Continue ↓

Is performance critical?
├─ Yes: Least Response Time or Adaptive
└─ No: Weighted Round Robin
```

## Real-World Example: Netflix

Netflix uses multiple algorithms at different layers:

1. **DNS Level:** Geographic load balancing
2. **CDN Level:** Consistent hashing for cache distribution
3. **API Gateway:** Least connections with circuit breakers
4. **Microservices:** Weighted round robin with health checks

```
User Request
    ↓
  GSLB (Route to nearest region)
    ↓
  CDN (Consistent hashing for video chunks)
    ↓
  API Gateway (Least connections)
    ↓
  Microservices (Weighted RR + health checks)
```

## Best Practices

1. **Start simple:** Begin with Round Robin, optimize later
2. **Monitor metrics:** Track distribution, response times, errors
3. **Health checks:** Remove unhealthy servers automatically
4. **Gradual rollout:** Use weighted algorithms for canary deployments
5. **Test under load:** Verify algorithm behavior at scale
6. **Consider session needs:** Choose algorithm that supports your session requirements
7. **Combine strategies:** Use different algorithms at different layers

## Key Takeaways

✅ **Round Robin** is simple and works well for homogeneous servers  
✅ **Least Connections** handles varying request times  
✅ **IP/URL Hash** provides session affinity  
✅ **Weighted algorithms** account for server capacity differences  
✅ **Adaptive algorithms** optimize for multiple metrics  
✅ Choose based on your specific requirements and constraints

## Practice Exercise

**Scenario:** You have:

- 3 servers with specs: 16CPU/32GB, 8CPU/16GB, 4CPU/8GB
- Mix of quick requests (10ms) and slow requests (1s)
- Need session persistence for authenticated users

**Question:** Which algorithm would you choose and why?

**Answer:** Weighted Least Connections

- Weights account for different server capacities
- Least connections handles varying request times
- Add sticky sessions for authenticated users

## Next Steps

You've completed the Load Balancing module! Continue to:

- **Database Design**: Learn about data modeling and scaling
- **Caching Strategies**: Speed up your applications
- **Microservices**: Build distributed systems

Ready to level up? 🚀
