# Service Discovery and Registry

## Introduction

In microservices architecture, services are **dynamically deployed** across multiple hosts. **Service discovery** is the mechanism that allows services to find and communicate with each other without hardcoding network locations.

## The Problem

### Static Configuration (Doesn't Scale)

```typescript
// ❌ Hardcoded service locations
const userServiceUrl = "http://192.168.1.10:3000";
const orderServiceUrl = "http://192.168.1.11:4000";

// What if:
// - Instance crashes and restarts on different IP?
// - Need to scale to multiple instances?
// - Deploy to different environment?
// - Service moves to different host?
```

### Dynamic Microservices

```
Container Orchestration (Kubernetes/Docker Swarm):
- Services scale up/down automatically
- Instances restart on different IPs
- Rolling deployments change endpoints
- Health checks remove unhealthy instances

Need: Dynamic service discovery
```

## Service Discovery Patterns

### 1. Client-Side Discovery

**Client queries registry and chooses instance.**

```
┌────────┐       1. Where is User Service?
│ Client │ ────────────────────────────────→ ┌──────────────┐
└────────┘                                     │   Registry   │
    │          2. Here are 3 instances         │  (Consul/   │
    │      ←────────────────────────────────   │   Eureka)   │
    │                                          └──────────────┘
    │ 3. Call chosen instance
    └─────────────────────→ User Service Instance 2
```

**Implementation with Consul:**

```typescript
import Consul from "consul";

class ServiceDiscoveryClient {
  private consul: Consul;

  constructor() {
    this.consul = new Consul({ host: "consul-server", port: 8500 });
  }

  // Register service on startup
  async registerService(serviceName: string, port: number) {
    await this.consul.agent.service.register({
      name: serviceName,
      id: `${serviceName}-${process.env.HOSTNAME}`,
      address: process.env.HOST_IP,
      port: port,
      check: {
        http: `http://${process.env.HOST_IP}:${port}/health`,
        interval: "10s",
        timeout: "5s",
      },
    });

    console.log(`Registered ${serviceName} at ${process.env.HOST_IP}:${port}`);
  }

  // Discover service instances
  async discoverService(serviceName: string): Promise<ServiceInstance[]> {
    const result = await this.consul.health.service({
      service: serviceName,
      passing: true, // Only healthy instances
    });

    return result.map((entry) => ({
      id: entry.Service.ID,
      address: entry.Service.Address,
      port: entry.Service.Port,
    }));
  }

  // Load balancing (round-robin)
  async getServiceInstance(serviceName: string): Promise<ServiceInstance> {
    const instances = await this.discoverService(serviceName);

    if (instances.length === 0) {
      throw new Error(`No healthy instances for ${serviceName}`);
    }

    // Simple round-robin
    const index = Math.floor(Math.random() * instances.length);
    return instances[index];
  }

  // Deregister on shutdown
  async deregisterService(serviceId: string) {
    await this.consul.agent.service.deregister(serviceId);
  }
}

// Usage in Order Service
const discovery = new ServiceDiscoveryClient();

// Register on startup
await discovery.registerService("order-service", 4000);

// Discover and call User Service
async function getUserData(userId: string) {
  const instance = await discovery.getServiceInstance("user-service");
  const url = `http://${instance.address}:${instance.port}/users/${userId}`;

  const response = await fetch(url);
  return response.json();
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  await discovery.deregisterService(`order-service-${process.env.HOSTNAME}`);
  process.exit(0);
});
```

**Pros:**

- ✅ Client controls load balancing
- ✅ No single point of failure (beyond registry)
- ✅ Flexible routing logic

**Cons:**

- ❌ Client complexity (discovery logic in every service)
- ❌ Language-specific libraries
- ❌ Registry dependency

### 2. Server-Side Discovery

**Load balancer queries registry and routes requests.**

```
┌────────┐       1. Call User Service
│ Client │ ────────────────────────────────→ ┌──────────────┐
└────────┘                                     │Load Balancer │
                                               │  (queries    │
                2. Route to instance           │   registry)  │
                ←──────────────────────────    └──────────────┘
                                                       │
                                    ┌──────────────────┼──────────────────┐
                                    ↓                  ↓                  ↓
                            User Service 1    User Service 2    User Service 3
```

**Kubernetes Example:**

```yaml
# Deployment (multiple replicas)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
        - name: user-service
          image: user-service:1.0
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 3

---
# Service (load balancer + discovery)
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

**Client code (simple!):**

```typescript
// Just call service name - Kubernetes handles discovery
async function getUserData(userId: string) {
  // 'user-service' resolves via Kubernetes DNS
  const response = await fetch(`http://user-service/users/${userId}`);
  return response.json();
}
```

**How it works:**

1. Kubernetes DNS resolves `user-service` to Service IP
2. Service (kube-proxy) load balances to healthy Pods
3. Automatic health checks remove unhealthy Pods
4. Client doesn't know about individual instances

**Pros:**

- ✅ Simple client code
- ✅ Platform handles complexity
- ✅ Built-in load balancing
- ✅ Language-agnostic

**Cons:**

- ❌ Platform dependency (Kubernetes)
- ❌ Less control over routing
- ❌ Another infrastructure component

## Service Registry Technologies

### 1. Consul (HashiCorp)

**Full-featured service mesh with discovery, health checking, and KV store.**

```typescript
// Health check endpoint
app.get("/health", (req, res) => {
  // Check dependencies
  const dbHealthy = await db.ping();
  const cacheHealthy = await cache.ping();

  if (dbHealthy && cacheHealthy) {
    res.status(200).json({ status: "healthy" });
  } else {
    res.status(503).json({ status: "unhealthy" });
  }
});

// Register with Consul
const consul = new Consul();

await consul.agent.service.register({
  name: "user-service",
  id: `user-service-${hostname}`,
  address: hostIp,
  port: 3000,
  tags: ["v1", "production"],
  check: {
    http: `http://${hostIp}:3000/health`,
    interval: "10s",
    timeout: "5s",
    deregisterCriticalServiceAfter: "1m",
  },
});
```

**Features:**

- ✅ Service registration/discovery
- ✅ Health checking (HTTP, TCP, Script, TTL)
- ✅ Key-value store
- ✅ Multi-datacenter support
- ✅ Service mesh capabilities

### 2. Eureka (Netflix OSS)

**REST-based service registry for AWS cloud.**

```java
// Spring Boot application.yml
eureka:
  client:
    serviceUrl:
      defaultZone: http://eureka-server:8761/eureka/
  instance:
    preferIpAddress: true
    leaseRenewalIntervalInSeconds: 10
    healthCheckUrlPath: /actuator/health

spring:
  application:
    name: user-service

// Spring Boot Application
@SpringBootApplication
@EnableEurekaClient
public class UserServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(UserServiceApplication.class, args);
  }
}

// Calling another service
@Service
public class OrderService {
  @Autowired
  private DiscoveryClient discoveryClient;

  @Autowired
  private RestTemplate restTemplate;

  public User getUserData(String userId) {
    // Discover user-service instances
    List<ServiceInstance> instances =
      discoveryClient.getInstances("user-service");

    if (instances.isEmpty()) {
      throw new ServiceUnavailableException("user-service not found");
    }

    ServiceInstance instance = instances.get(0);
    String url = String.format("%s/users/%s", instance.getUri(), userId);

    return restTemplate.getForObject(url, User.class);
  }
}

// Or use Feign (declarative REST client)
@FeignClient(name = "user-service")
public interface UserServiceClient {
  @GetMapping("/users/{id}")
  User getUser(@PathVariable String id);
}
```

**Features:**

- ✅ Self-preservation mode (network partition handling)
- ✅ Peer-to-peer replication
- ✅ AWS-aware
- ✅ Spring Cloud integration

### 3. etcd (CoreOS)

**Distributed key-value store for service discovery and configuration.**

```typescript
import { Etcd3 } from "etcd3";

class EtcdServiceRegistry {
  private client: Etcd3;
  private serviceKey: string;
  private leaseId: string;

  constructor() {
    this.client = new Etcd3({ hosts: "http://etcd:2379" });
  }

  async registerService(serviceName: string, metadata: any) {
    // Create lease (TTL)
    const lease = this.client.lease(10); // 10 seconds
    await lease.grant();
    this.leaseId = lease.ID;

    // Register with lease
    this.serviceKey = `/services/${serviceName}/${process.env.HOSTNAME}`;
    await this.client
      .put(this.serviceKey)
      .value(JSON.stringify(metadata))
      .lease(lease.ID)
      .exec();

    // Keep-alive (heartbeat)
    lease.on("lost", async () => {
      console.warn("Lease lost, re-registering...");
      await this.registerService(serviceName, metadata);
    });

    await lease.keepaliveOne();

    console.log(`Registered ${serviceName}`);
  }

  async discoverServices(serviceName: string) {
    const prefix = `/services/${serviceName}/`;
    const services = await this.client.getAll().prefix(prefix).strings();

    return Object.values(services).map((s) => JSON.parse(s));
  }

  async watchServices(serviceName: string, callback: Function) {
    const prefix = `/services/${serviceName}/`;
    const watcher = await this.client.watch().prefix(prefix).create();

    watcher.on("put", async (event) => {
      console.log("Service added:", event.key.toString());
      callback("added", JSON.parse(event.value.toString()));
    });

    watcher.on("delete", async (event) => {
      console.log("Service removed:", event.key.toString());
      callback("removed", event.key.toString());
    });
  }
}
```

**Features:**

- ✅ Strong consistency (Raft consensus)
- ✅ Watch API (real-time updates)
- ✅ TTL and leases
- ✅ Kubernetes backing store

### 4. Kubernetes DNS

**Built-in service discovery via DNS.**

```typescript
// Automatic DNS resolution
// Service name: user-service
// Namespace: production
// Cluster domain: cluster.local

// Full DNS name:
const url = "http://user-service.production.svc.cluster.local";

// Short names work within same namespace:
const url = "http://user-service";

// Cross-namespace:
const url = "http://user-service.production";

// Headless service (returns Pod IPs directly)
// service.yaml:
// spec:
//   clusterIP: None

// DNS returns all Pod IPs:
// user-service.production.svc.cluster.local
//   → 10.0.1.5, 10.0.1.6, 10.0.1.7
```

## Health Checks

**Ensuring only healthy instances receive traffic.**

### Liveness vs Readiness

```typescript
import express from "express";

const app = express();
let isReady = false;

// Liveness probe - is the app alive?
app.get("/health/live", (req, res) => {
  // Basic check: can respond to requests
  res.status(200).json({ status: "alive" });
});

// Readiness probe - is the app ready to serve traffic?
app.get("/health/ready", async (req, res) => {
  try {
    // Check dependencies
    await db.ping();
    await cache.ping();

    if (!isReady) {
      return res.status(503).json({ status: "not ready" });
    }

    res.status(200).json({ status: "ready" });
  } catch (error) {
    res.status(503).json({ status: "not ready", error: error.message });
  }
});

// Startup - initialize connections
async function startup() {
  await db.connect();
  await cache.connect();
  isReady = true;
  console.log("Application ready");
}

app.listen(3000, startup);
```

**Kubernetes probes:**

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3
  # If fails 3 times, restart container

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
  # If fails 3 times, remove from load balancer
```

## Load Balancing with Service Discovery

### Client-Side Load Balancing

```typescript
class LoadBalancedClient {
  private instances: ServiceInstance[] = [];
  private currentIndex = 0;

  async refreshInstances(serviceName: string) {
    this.instances = await discovery.discoverService(serviceName);
  }

  // Round-robin
  getNextInstance(): ServiceInstance {
    const instance = this.instances[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.instances.length;
    return instance;
  }

  // Random
  getRandomInstance(): ServiceInstance {
    const index = Math.floor(Math.random() * this.instances.length);
    return this.instances[index];
  }

  // Weighted random (based on capacity)
  getWeightedInstance(): ServiceInstance {
    const totalWeight = this.instances.reduce((sum, i) => sum + i.weight, 0);
    let random = Math.random() * totalWeight;

    for (const instance of this.instances) {
      random -= instance.weight;
      if (random <= 0) {
        return instance;
      }
    }

    return this.instances[0];
  }

  async callService(path: string) {
    const instance = this.getNextInstance();
    const url = `http://${instance.address}:${instance.port}${path}`;

    try {
      return await fetch(url);
    } catch (error) {
      // Retry with different instance
      const fallbackInstance = this.getNextInstance();
      const fallbackUrl = `http://${fallbackInstance.address}:${fallbackInstance.port}${path}`;
      return await fetch(fallbackUrl);
    }
  }
}
```

## Best Practices

### 1. Graceful Shutdown

```typescript
// Deregister before shutdown
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, starting graceful shutdown...");

  // 1. Stop accepting new requests
  server.close();

  // 2. Deregister from service registry
  await discovery.deregisterService(serviceId);

  // 3. Finish processing existing requests
  await waitForPendingRequests();

  // 4. Close connections
  await db.close();
  await cache.close();

  console.log("Graceful shutdown complete");
  process.exit(0);
});
```

### 2. Service Metadata

```typescript
// Register with rich metadata
await consul.agent.service.register({
  name: "user-service",
  id: `user-service-${hostname}`,
  address: hostIp,
  port: 3000,
  tags: ["v2", "production", "us-east-1"],
  meta: {
    version: "2.1.0",
    protocol: "http",
    weight: "100",
    datacenter: "us-east-1",
    canary: "false",
  },
});

// Use metadata for routing
const instances = await discovery.discoverService("user-service");
const v2Instances = instances.filter((i) => i.meta.version.startsWith("2"));
const canaryInstances = instances.filter((i) => i.meta.canary === "true");
```

### 3. Circuit Breaker Integration

```typescript
class ResilientServiceClient {
  private breaker: CircuitBreaker;

  async callService(serviceName: string, path: string) {
    return this.breaker.call(async () => {
      const instance = await discovery.getServiceInstance(serviceName);
      const url = `http://${instance.address}:${instance.port}${path}`;
      return await fetch(url);
    });
  }
}
```

### 4. Service Versioning

```yaml
# Blue-Green Deployment
# Blue (current)
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
    version: v1 # Currently pointing to v1

---
# Green (new version)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service-v2
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
      version: v2
# Switch traffic by updating Service selector to version: v2
```

## Key Takeaways

✅ **Client-side discovery** gives clients control but adds complexity  
✅ **Server-side discovery** simplifies clients but requires load balancer  
✅ **Health checks** ensure only healthy instances receive traffic  
✅ **Service registry** is critical - must be highly available  
✅ **Graceful shutdown** prevents dropped requests  
✅ **Metadata** enables intelligent routing  
✅ **Kubernetes** provides built-in service discovery via DNS

## Congratulations! 🎉

You've completed the **Microservices Architecture** module!

### You've learned:

✅ Microservices principles and design  
✅ Service communication patterns  
✅ Service discovery and registry

### Next steps:

- Practice designing microservices systems
- Implement service discovery in a project
- Explore advanced topics (service mesh, observability)

**Keep building!** 🚀
