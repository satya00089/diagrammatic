# Service Communication Patterns

## Introduction

In microservices architecture, **services must communicate** to fulfill business requirements. How they communicate significantly impacts performance, reliability, and maintainability.

## Communication Styles

### Synchronous vs Asynchronous

```
Synchronous (Request-Response):
Client → Request → Service
Client ← Response ← Service
Client waits for response

Asynchronous (Fire-and-Forget):
Client → Message → Queue → Service
Client continues immediately
Service processes later
```

### One-to-One vs One-to-Many

```
One-to-One:
Service A → Service B
(Direct communication)

One-to-Many:
Service A → Event → Service B
                  → Service C
                  → Service D
(Broadcast/Publish-Subscribe)
```

## Communication Protocols

### 1. REST (Representational State Transfer)

**HTTP-based synchronous communication.**

```typescript
// User Service API
import express from "express";

const app = express();

// GET user
app.get("/api/users/:id", async (req, res) => {
  const user = await db.users.findById(req.params.id);
  res.json(user);
});

// POST create user
app.post("/api/users", async (req, res) => {
  const user = await db.users.create(req.body);
  res.status(201).json(user);
});

// PUT update user
app.put("/api/users/:id", async (req, res) => {
  const user = await db.users.update(req.params.id, req.body);
  res.json(user);
});

// DELETE user
app.delete("/api/users/:id", async (req, res) => {
  await db.users.delete(req.params.id);
  res.status(204).send();
});

app.listen(3000);
```

**Client-side:**

```typescript
// Order Service calling User Service
class UserServiceClient {
  private baseUrl = "http://user-service:3000/api";

  async getUser(id: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/${id}`);

    if (!response.ok) {
      throw new Error(`User service error: ${response.status}`);
    }

    return response.json();
  }

  async createUser(data: UserCreateData): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return response.json();
  }
}

// Usage in Order Service
const userClient = new UserServiceClient();
const user = await userClient.getUser("123");
```

**Pros:**

- ✅ Simple and familiar
- ✅ Wide tooling support
- ✅ Human-readable
- ✅ Caching-friendly

**Cons:**

- ❌ Verbose (JSON overhead)
- ❌ No streaming
- ❌ Synchronous (blocking)
- ❌ Schema not enforced

### 2. gRPC (Google Remote Procedure Call)

**High-performance RPC framework using Protocol Buffers.**

**Define service contract:**

```protobuf
// user.proto
syntax = "proto3";

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc CreateUser (CreateUserRequest) returns (User);
  rpc StreamUsers (StreamUsersRequest) returns (stream User);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
  int64 created_at = 4;
}

message GetUserRequest {
  string id = 1;
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
}
```

**Server implementation:**

```typescript
import * as grpc from "@grpc/grpc-js";
import { UserServiceService } from "./generated/user_grpc_pb";

class UserServiceImpl implements UserServiceService {
  async getUser(call, callback) {
    const userId = call.request.getId();
    const user = await db.users.findById(userId);

    const response = new User();
    response.setId(user.id);
    response.setName(user.name);
    response.setEmail(user.email);

    callback(null, response);
  }

  async createUser(call, callback) {
    const name = call.request.getName();
    const email = call.request.getEmail();

    const user = await db.users.create({ name, email });

    const response = new User();
    response.setId(user.id);
    response.setName(user.name);
    response.setEmail(user.email);

    callback(null, response);
  }

  // Server streaming
  streamUsers(call) {
    const users = db.users.findAll();

    for (const user of users) {
      const response = new User();
      response.setId(user.id);
      response.setName(user.name);
      call.write(response);
    }

    call.end();
  }
}

const server = new grpc.Server();
server.addService(UserServiceService, new UserServiceImpl());
server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure());
```

**Client implementation:**

```typescript
import * as grpc from "@grpc/grpc-js";
import { UserServiceClient } from "./generated/user_grpc_pb";

const client = new UserServiceClient(
  "user-service:50051",
  grpc.credentials.createInsecure(),
);

// Unary call
const request = new GetUserRequest();
request.setId("123");

client.getUser(request, (error, response) => {
  if (error) {
    console.error(error);
    return;
  }

  console.log("User:", response.getName());
});

// Streaming call
const streamRequest = new StreamUsersRequest();
const stream = client.streamUsers(streamRequest);

stream.on("data", (user) => {
  console.log("Received user:", user.getName());
});

stream.on("end", () => {
  console.log("Stream ended");
});
```

**Pros:**

- ✅ High performance (binary protocol)
- ✅ Strong typing (Protocol Buffers)
- ✅ Streaming support (bi-directional)
- ✅ Code generation
- ✅ Multiple languages

**Cons:**

- ❌ Not human-readable
- ❌ Steeper learning curve
- ❌ Less browser support
- ❌ More complex setup

### 3. Message Queues (Asynchronous)

**Services communicate via message brokers.**

#### RabbitMQ Example

```typescript
import amqp from "amqplib";

// Producer (Order Service)
class OrderEventPublisher {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect() {
    this.connection = await amqp.connect("amqp://localhost");
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange("orders", "topic", { durable: true });
  }

  async publishOrderCreated(order: Order) {
    const message = JSON.stringify({
      eventType: "ORDER_CREATED",
      orderId: order.id,
      userId: order.userId,
      total: order.total,
      timestamp: Date.now(),
    });

    this.channel.publish("orders", "order.created", Buffer.from(message), {
      persistent: true,
    });

    console.log("Published: ORDER_CREATED", order.id);
  }
}

// Usage
async function createOrder(orderData) {
  const order = await db.orders.create(orderData);

  // Publish event asynchronously
  await publisher.publishOrderCreated(order);

  return order; // Don't wait for consumers
}
```

**Consumer (Notification Service):**

```typescript
// Consumer (Notification Service)
class OrderEventConsumer {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect() {
    this.connection = await amqp.connect("amqp://localhost");
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange("orders", "topic", { durable: true });
    await this.channel.assertQueue("notifications", { durable: true });
    await this.channel.bindQueue("notifications", "orders", "order.*");

    this.consume();
  }

  private async consume() {
    this.channel.consume("notifications", async (msg) => {
      if (!msg) return;

      const event = JSON.parse(msg.content.toString());

      try {
        await this.handleEvent(event);
        this.channel.ack(msg); // Acknowledge
      } catch (error) {
        console.error("Processing failed:", error);
        this.channel.nack(msg, false, true); // Requeue
      }
    });
  }

  private async handleEvent(event: any) {
    if (event.eventType === "ORDER_CREATED") {
      await emailService.sendOrderConfirmation(event.userId, event.orderId);
      console.log("Sent order confirmation email");
    }
  }
}
```

**Consumer (Inventory Service):**

```typescript
// Different service, different handler
class InventoryEventConsumer {
  private async handleEvent(event: any) {
    if (event.eventType === "ORDER_CREATED") {
      await inventoryService.reserveItems(event.orderId);
      console.log("Reserved inventory for order");
    }
  }
}
```

**Pros:**

- ✅ Decoupling (producer doesn't know consumers)
- ✅ Asynchronous (non-blocking)
- ✅ Reliable delivery
- ✅ Load leveling (buffer spikes)
- ✅ Multiple consumers

**Cons:**

- ❌ Complexity (message broker needed)
- ❌ Eventual consistency
- ❌ Debugging harder
- ❌ Message ordering challenges

### 4. Event Streaming (Kafka)

**Distributed event log for real-time data streams.**

```typescript
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "order-service",
  brokers: ["kafka:9092"],
});

// Producer
const producer = kafka.producer();

async function publishOrderEvent(order: Order) {
  await producer.connect();

  await producer.send({
    topic: "orders",
    messages: [
      {
        key: order.id,
        value: JSON.stringify({
          eventType: "ORDER_CREATED",
          order: order,
          timestamp: Date.now(),
        }),
      },
    ],
  });
}

// Consumer
const consumer = kafka.consumer({ groupId: "notification-service" });

async function consumeOrderEvents() {
  await consumer.connect();
  await consumer.subscribe({ topic: "orders", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());

      if (event.eventType === "ORDER_CREATED") {
        await sendNotification(event.order);
      }
    },
  });
}
```

**Pros:**

- ✅ High throughput
- ✅ Durability (persistent log)
- ✅ Replay events
- ✅ Event sourcing support
- ✅ Stream processing

**Cons:**

- ❌ Complex setup
- ❌ Operational overhead
- ❌ Not for request-response
- ❌ Eventual consistency

## Communication Patterns

### 1. API Gateway Pattern

**Single entry point for all client requests.**

```
          ┌─────────────┐
Client ── │ API Gateway │ ── Service A
          └─────────────┘ ── Service B
                          ── Service C
                          ── Service D
```

**Implementation:**

```typescript
// API Gateway (Express + http-proxy-middleware)
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

// Route to User Service
app.use(
  "/api/users",
  createProxyMiddleware({
    target: "http://user-service:3000",
    changeOrigin: true,
    pathRewrite: { "^/api/users": "/users" },
  }),
);

// Route to Order Service
app.use(
  "/api/orders",
  createProxyMiddleware({
    target: "http://order-service:4000",
    changeOrigin: true,
    pathRewrite: { "^/api/orders": "/orders" },
  }),
);

// Aggregation endpoint
app.get("/api/user-dashboard/:userId", async (req, res) => {
  const userId = req.params.userId;

  // Call multiple services
  const [user, orders, recommendations] = await Promise.all([
    fetch(`http://user-service:3000/users/${userId}`).then((r) => r.json()),
    fetch(`http://order-service:4000/users/${userId}/orders`).then((r) =>
      r.json(),
    ),
    fetch(`http://recommendation-service:5000/users/${userId}`).then((r) =>
      r.json(),
    ),
  ]);

  res.json({ user, orders, recommendations });
});

app.listen(8080);
```

**Benefits:**

- ✅ Single entry point
- ✅ Request aggregation
- ✅ Authentication/authorization
- ✅ Rate limiting
- ✅ Caching

### 2. Service Mesh

**Infrastructure layer for service-to-service communication.**

```
Service A ←→ Sidecar Proxy ←→ Network ←→ Sidecar Proxy ←→ Service B
```

**Istio Example:**

```yaml
# Virtual Service (routing rules)
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
    - user-service
  http:
    - match:
        - headers:
            version:
              exact: v2
      route:
        - destination:
            host: user-service
            subset: v2
    - route:
        - destination:
            host: user-service
            subset: v1

# Destination Rule (load balancing, circuit breaker)
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: user-service
spec:
  host: user-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
```

**Features:**

- ✅ Traffic management
- ✅ Security (mTLS)
- ✅ Observability
- ✅ Circuit breaking
- ✅ Retry logic

### 3. Backend for Frontend (BFF)

**Separate API for each client type.**

```
Mobile App  →  Mobile BFF  →  Services
Web App     →  Web BFF     →  Services
IoT Device  →  IoT BFF     →  Services
```

**Example:**

```typescript
// Mobile BFF (lightweight responses)
app.get("/api/mobile/user/:id", async (req, res) => {
  const user = await userService.getUser(req.params.id);

  // Minimal data for mobile
  res.json({
    id: user.id,
    name: user.name,
    avatar: user.avatarUrl,
  });
});

// Web BFF (rich responses)
app.get("/api/web/user/:id", async (req, res) => {
  const [user, orders, preferences, recommendations] = await Promise.all([
    userService.getUser(req.params.id),
    orderService.getUserOrders(req.params.id),
    preferenceService.getPreferences(req.params.id),
    recommendationService.getRecommendations(req.params.id),
  ]);

  // Rich data for web
  res.json({ user, orders, preferences, recommendations });
});
```

### 4. Saga Pattern (Distributed Transactions)

**Coordinating multiple service updates.**

#### Choreography Saga (Event-driven)

```typescript
// Order Service
async function createOrder(orderData) {
  const order = await db.orders.create({ ...orderData, status: "PENDING" });

  // Publish event
  await eventBus.publish("ORDER_CREATED", { orderId: order.id });

  return order;
}

// Payment Service (listens to ORDER_CREATED)
eventBus.on("ORDER_CREATED", async (event) => {
  try {
    await processPayment(event.orderId);
    await eventBus.publish("PAYMENT_COMPLETED", { orderId: event.orderId });
  } catch (error) {
    await eventBus.publish("PAYMENT_FAILED", { orderId: event.orderId });
  }
});

// Inventory Service (listens to PAYMENT_COMPLETED)
eventBus.on("PAYMENT_COMPLETED", async (event) => {
  try {
    await reserveInventory(event.orderId);
    await eventBus.publish("INVENTORY_RESERVED", { orderId: event.orderId });
  } catch (error) {
    await eventBus.publish("INVENTORY_FAILED", { orderId: event.orderId });
  }
});

// Order Service (listens to success/failure events)
eventBus.on("INVENTORY_RESERVED", async (event) => {
  await db.orders.update(event.orderId, { status: "CONFIRMED" });
});

eventBus.on("PAYMENT_FAILED", async (event) => {
  await db.orders.update(event.orderId, { status: "CANCELLED" });
});
```

#### Orchestration Saga (Coordinator)

```typescript
// Saga Orchestrator
class OrderSaga {
  async execute(orderData) {
    const saga = {
      orderId: null,
      steps: [],
    };

    try {
      // Step 1: Create order
      const order = await orderService.createOrder(orderData);
      saga.orderId = order.id;
      saga.steps.push("ORDER_CREATED");

      // Step 2: Process payment
      await paymentService.processPayment(order.id);
      saga.steps.push("PAYMENT_PROCESSED");

      // Step 3: Reserve inventory
      await inventoryService.reserveInventory(order.id);
      saga.steps.push("INVENTORY_RESERVED");

      // Step 4: Confirm order
      await orderService.confirmOrder(order.id);

      return { success: true, orderId: order.id };
    } catch (error) {
      // Compensate in reverse order
      await this.compensate(saga);
      throw error;
    }
  }

  async compensate(saga) {
    const steps = saga.steps.reverse();

    for (const step of steps) {
      switch (step) {
        case "INVENTORY_RESERVED":
          await inventoryService.releaseInventory(saga.orderId);
          break;
        case "PAYMENT_PROCESSED":
          await paymentService.refundPayment(saga.orderId);
          break;
        case "ORDER_CREATED":
          await orderService.cancelOrder(saga.orderId);
          break;
      }
    }
  }
}
```

## Resilience Patterns

### Circuit Breaker

```typescript
// Prevents cascading failures
class CircuitBreaker {
  private state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
  private failures = 0;
  private threshold = 5;
  private timeout = 60000; // 1 minute

  async call(fn: () => Promise<any>) {
    if (this.state === "OPEN") {
      throw new Error("Circuit breaker is OPEN");
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
    }
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = "OPEN";
      setTimeout(() => {
        this.state = "HALF_OPEN";
        this.failures = 0;
      }, this.timeout);
    }
  }
}
```

### Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
}
```

## Choosing Communication Style

| Use Case                     | Pattern         | Protocol       |
| ---------------------------- | --------------- | -------------- |
| Real-time user requests      | Synchronous     | REST/gRPC      |
| High throughput              | Asynchronous    | Kafka/RabbitMQ |
| Microservice-to-microservice | gRPC            | gRPC           |
| External API                 | REST            | REST           |
| Event notifications          | Async messaging | RabbitMQ/Kafka |
| Large data transfers         | Streaming       | gRPC/Kafka     |

## Key Takeaways

✅ **REST** for simplicity and external APIs  
✅ **gRPC** for high-performance internal communication  
✅ **Message queues** for async, decoupled communication  
✅ **Event streaming** for real-time data pipelines  
✅ **API Gateway** for single entry point  
✅ **Circuit breakers** to prevent cascading failures  
✅ **Saga pattern** for distributed transactions

## Next Lesson

Continue to **Service Discovery** to learn how services find each other! 🔍
