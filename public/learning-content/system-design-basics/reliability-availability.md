# Reliability & Availability

## Introduction

Building systems that **stay up** and **work correctly** is critical for business success. This lesson covers the principles and practices for creating reliable and highly available systems.

## Key Concepts

### Reliability

**Reliability** is the probability that a system will perform its intended function without failure over a specified time period.

> "A reliable system continues to work correctly, even when things go wrong."

### Availability

**Availability** is the percentage of time a system is operational and accessible.

```
Availability = Uptime / (Uptime + Downtime) × 100%

Example:
Uptime: 8,750 hours
Downtime: 10 hours
Availability: 8,750 / 8,760 × 100% = 99.89%
```

## The Nine 9's

Availability is often measured in "nines":

| Availability           | Downtime per Year | Downtime per Month | Use Case                 |
| ---------------------- | ----------------- | ------------------ | ------------------------ |
| **90%** (1 nine)       | 36.5 days         | 3 days             | Development/Testing      |
| **99%** (2 nines)      | 3.65 days         | 7.2 hours          | Internal tools           |
| **99.9%** (3 nines)    | 8.76 hours        | 43.2 minutes       | Standard web apps        |
| **99.99%** (4 nines)   | 52.6 minutes      | 4.32 minutes       | Business-critical apps   |
| **99.999%** (5 nines)  | 5.26 minutes      | 26 seconds         | Financial systems        |
| **99.9999%** (6 nines) | 31.5 seconds      | 2.6 seconds        | Mission-critical systems |

**Reality check:** Each additional nine becomes exponentially more expensive!

## Reliability Principles

### 1. Design for Failure

**Assume everything will fail eventually:**

- Servers crash
- Networks partition
- Disks fill up
- Dependencies become unavailable
- Bugs exist in code

**Netflix's Chaos Engineering:**

```
Randomly kill production servers to ensure:
✓ System stays available
✓ Automatic failover works
✓ No single point of failure
```

### 2. Redundancy

**Eliminate single points of failure by duplicating critical components:**

```
Single Point of Failure:
User → Server → Database
        ↓ (If this fails, everything fails)

With Redundancy:
             ┌─ Server 1 ─┐
User → LB ──┤             ├─ Database Primary
             └─ Server 2 ─┘      ↓
                              Replica
```

**Types of redundancy:**

**Active-Active:** All instances handle traffic

```
   Load Balancer
      ↓     ↓
   Server1 Server2
   (100%)  (100%)

Both serving traffic simultaneously
```

**Active-Passive:** Standby takes over on failure

```
   Primary ────┐
   (Active)    │ Heartbeat
               │
   Standby ────┘
   (Passive)

Standby promotes to active if primary fails
```

### 3. Fault Isolation

**Contain failures to prevent cascading problems:**

```
Availability Zones:
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    Zone A   │  │    Zone B   │  │    Zone C   │
│  ┌────────┐ │  │  ┌────────┐ │  │  ┌────────┐ │
│  │Server 1│ │  │  │Server 2│ │  │  │Server 3│ │
│  └────────┘ │  │  └────────┘ │  │  └────────┘ │
└─────────────┘  └─────────────┘  └─────────────┘

If Zone A fails, Zones B and C continue serving traffic
```

### 4. Circuit Breaker Pattern

**Prevent cascading failures by failing fast:**

```typescript
class CircuitBreaker {
  state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  failureCount = 0;
  threshold = 5;
  timeout = 60000; // 1 minute

  async call(operation: () => Promise<any>) {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = "OPEN";
      this.lastFailure = Date.now();
    }
  }
}
```

**States:**

- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Failures exceeded threshold, fail fast
- **HALF_OPEN**: Test if service recovered

## High Availability Patterns

### 1. Health Checks

**Continuously monitor component health:**

```typescript
// Health check endpoint
app.get("/health", (req, res) => {
  const health = {
    uptime: process.uptime(),
    database: await checkDatabaseConnection(),
    redis: await checkRedisConnection(),
    memory: process.memoryUsage(),
    timestamp: Date.now(),
  };

  const status = health.database && health.redis ? 200 : 503;
  res.status(status).json(health);
});
```

**Load balancer configuration:**

```yaml
healthCheck:
  path: /health
  interval: 10s
  timeout: 5s
  unhealthyThreshold: 3
  healthyThreshold: 2
```

### 2. Graceful Degradation

**Maintain core functionality when components fail:**

```typescript
async function getUserProfile(userId: string) {
  const profile = await database.getUser(userId);

  try {
    // Nice-to-have: Get user's recent activity
    profile.recentActivity = await activityService.get(userId);
  } catch (error) {
    // Degrade gracefully - show profile without activity
    console.warn("Activity service unavailable");
    profile.recentActivity = [];
  }

  try {
    // Nice-to-have: Get user's recommendations
    profile.recommendations = await recommendationService.get(userId);
  } catch (error) {
    console.warn("Recommendation service unavailable");
    profile.recommendations = [];
  }

  return profile; // Return profile even if some features unavailable
}
```

### 3. Retry with Backoff

**Handle transient failures with smart retries:**

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * delay * 0.1;

      await sleep(delay + jitter);
    }
  }
}

// Usage
const data = await retryWithBackoff(() => fetchDataFromAPI(userId));
```

### 4. Bulkhead Pattern

**Isolate resources to contain failures:**

```typescript
// Separate connection pools for different services
const criticalPool = createPool({
  max: 20, // 20 connections for critical operations
  min: 5,
});

const backgroundPool = createPool({
  max: 5, // Only 5 connections for background jobs
  min: 1,
});

// Critical user-facing operations won't be blocked
// by resource-intensive background jobs
```

## Monitoring & Observability

### The Three Pillars

**1. Metrics**

Quantitative measurements over time:

```
CPU usage: 65%
Memory usage: 2.5 GB
Request rate: 1,234 RPS
Error rate: 0.5%
Response time (P95): 250ms
```

**2. Logs**

Timestamped events from your application:

```json
{
  "timestamp": "2025-12-13T10:30:45Z",
  "level": "ERROR",
  "service": "user-service",
  "message": "Database connection timeout",
  "userId": "12345",
  "duration": 5000,
  "traceId": "abc-123-def"
}
```

**3. Traces**

Request flow through distributed system:

```
User Request (trace-id: abc-123)
  ├─ API Gateway (15ms)
  ├─ Auth Service (50ms)
  ├─ User Service (120ms)
  │   ├─ Database Query (80ms)
  │   └─ Cache Check (10ms)
  └─ Response (200ms total)
```

### Key Metrics to Monitor

| Category           | Metrics                                | Alert Threshold         |
| ------------------ | -------------------------------------- | ----------------------- |
| **Application**    | Error rate, Response time, Throughput  | Error > 1%, P95 > 500ms |
| **Infrastructure** | CPU, Memory, Disk, Network             | CPU > 80%               |
| **Database**       | Query time, Connection pool, Deadlocks | Query > 1s              |
| **Business**       | Sign-ups, Revenue, Active users        | Drop > 10%              |

## Disaster Recovery

### Backup Strategies

**3-2-1 Rule:**

- **3** copies of data
- **2** different storage types
- **1** offsite backup

```
Production Database
      ↓
   Snapshot
      ↓
  ┌───┴───┐
  ↓       ↓
Local   Cloud
Backup  Backup
(SSD)   (S3)
```

### Recovery Time Objective (RTO)

**How quickly can you recover?**

```
RTO = Time from failure to recovery

Example:
Failure at 10:00 AM
System restored at 10:15 AM
RTO = 15 minutes
```

### Recovery Point Objective (RPO)

**How much data can you afford to lose?**

```
RPO = Maximum acceptable data loss

Example:
Last backup: 9:00 AM
Failure: 10:00 AM
RPO = 1 hour of data loss acceptable
```

## Real-World Example: AWS S3

**Amazon S3 Reliability Design:**

- **Durability**: 99.999999999% (11 nines)
  - Data replicated across multiple devices
  - Data replicated across multiple facilities
  - Regular integrity checks

- **Availability**: 99.99%
  - Multiple availability zones
  - Automatic failover
  - Self-healing systems

**How they achieve this:**

```
Your File
    ↓
Replicated to 3+ facilities
    ↓
Stored on multiple disks
    ↓
Continuous integrity checks
    ↓
Automatic healing of failures
```

## Best Practices Checklist

**Design:**

- ✅ No single points of failure
- ✅ Redundancy at every layer
- ✅ Fault isolation between components
- ✅ Graceful degradation for non-critical features

**Operations:**

- ✅ Health checks on all services
- ✅ Automated failover mechanisms
- ✅ Regular backup and restore tests
- ✅ Circuit breakers for external dependencies

**Monitoring:**

- ✅ Comprehensive metrics collection
- ✅ Alerting on critical thresholds
- ✅ Distributed tracing for debugging
- ✅ Regular review of logs and metrics

**Testing:**

- ✅ Chaos engineering experiments
- ✅ Disaster recovery drills
- ✅ Load testing under failure scenarios
- ✅ Validate RTO and RPO regularly

## Common Pitfalls

❌ **Assuming components won't fail**  
✅ Design for failure from the start

❌ **No monitoring until production**  
✅ Implement observability early

❌ **Manual failover procedures**  
✅ Automate recovery processes

❌ **Untested disaster recovery**  
✅ Regularly test backups and recovery

❌ **Single data center deployment**  
✅ Use multiple availability zones

## Key Takeaways

✅ **Availability** is about staying operational; **Reliability** is about correctness  
✅ Each "nine" of availability gets exponentially more expensive  
✅ **Design for failure** - assume everything will break  
✅ Use **redundancy**, **health checks**, and **circuit breakers**  
✅ **Monitor everything** with metrics, logs, and traces  
✅ Test your disaster recovery plan regularly

## Next Steps

You've completed the System Design Basics module! 🎉

Continue your journey:

- **Load Balancing**: Learn traffic distribution strategies
- **Database Design**: Master data modeling and optimization
- **Caching Strategies**: Speed up your applications
- **Microservices**: Build distributed systems

Ready for the next challenge? 🚀
