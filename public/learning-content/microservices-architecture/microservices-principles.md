# Microservices Principles

## Introduction

**Microservices architecture** is an approach where an application is built as a collection of small, independent services that communicate over a network. Each service focuses on a specific business capability.

## Monolith vs Microservices

### Monolithic Architecture

**Single unified application containing all functionality:**

```
┌─────────────────────────────────────┐
│        Monolithic Application        │
├─────────────────────────────────────┤
│  User Management                     │
│  Product Catalog                     │
│  Order Processing                    │
│  Payment Processing                  │
│  Inventory Management                │
│  Notification Service                │
│  Analytics                           │
└─────────────────────────────────────┘
        ↓
  Single Database
```

**Characteristics:**

- Single codebase
- Single deployment unit
- Shared database
- In-process communication

**Pros:**

- ✅ Simple to develop initially
- ✅ Easy to test (everything together)
- ✅ Simple deployment (one artifact)
- ✅ No network latency

**Cons:**

- ❌ Tightly coupled components
- ❌ Difficult to scale independently
- ❌ Long deployment cycles
- ❌ Technology lock-in
- ❌ Single point of failure

### Microservices Architecture

**Application split into independent services:**

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   User      │  │  Product    │  │   Order     │
│  Service    │  │  Service    │  │  Service    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       ↓                ↓                ↓
   ┌────────┐      ┌────────┐      ┌────────┐
   │Users DB│      │Prod DB │      │Order DB│
   └────────┘      └────────┘      └────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Payment    │  │ Inventory   │  │Notification │
│  Service    │  │  Service    │  │  Service    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       ↓                ↓                ↓
   ┌────────┐      ┌────────┐      ┌────────┐
   │Pay DB  │      │Inv DB  │      │Notif DB│
   └────────┘      └────────┘      └────────┘
```

**Characteristics:**

- Multiple codebases
- Independent deployments
- Separate databases (database per service)
- Network communication

## Core Principles

### 1. Single Responsibility

**Each service does ONE thing and does it well.**

**❌ Bad: God Service**

```
User Service:
- Create user
- Authenticate
- Process payments
- Send notifications
- Generate reports
- Manage inventory
```

**✅ Good: Focused Services**

```
User Service:       Manage user accounts
Auth Service:       Handle authentication
Payment Service:    Process payments
Notification:       Send emails/SMS
```

**Example:**

```typescript
// User Service - Only manages users
class UserService {
  createUser(data: UserData): Promise<User>;
  getUser(id: string): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

// Separate Auth Service
class AuthService {
  login(email: string, password: string): Promise<AuthToken>;
  logout(token: string): Promise<void>;
  validateToken(token: string): Promise<boolean>;
  refreshToken(token: string): Promise<AuthToken>;
}
```

### 2. Loose Coupling

**Services should be independent with minimal dependencies.**

**❌ Tightly Coupled:**

```typescript
// Order Service directly accessing User Service database
class OrderService {
  async createOrder(userId: string) {
    // BAD: Direct database access
    const user = await userDatabase.users.findOne({ id: userId });

    if (!user.emailVerified) {
      throw new Error("Email not verified");
    }

    // Create order...
  }
}
```

**✅ Loosely Coupled:**

```typescript
// Order Service calls User Service API
class OrderService {
  constructor(private userServiceClient: UserServiceClient) {}

  async createOrder(userId: string) {
    // GOOD: API call through defined interface
    const user = await this.userServiceClient.getUser(userId);

    if (!user.emailVerified) {
      throw new Error("Email not verified");
    }

    // Create order...
  }
}
```

### 3. High Cohesion

**Related functionality belongs together.**

**❌ Low Cohesion:**

```
Service A:
- Create user
- Generate invoice
- Send SMS

Service B:
- Update user
- Process payment
```

**✅ High Cohesion:**

```
User Service:
- Create user
- Update user
- Delete user
- Get user

Billing Service:
- Generate invoice
- Process payment
- Refund payment

Notification Service:
- Send email
- Send SMS
- Send push notification
```

### 4. Autonomy

**Each service can be developed, deployed, and scaled independently.**

```typescript
// Each service has its own:
// - Repository
// - CI/CD pipeline
// - Database
// - Technology stack
// - Team ownership

// User Service (Node.js + PostgreSQL)
user-service/
  ├── src/
  ├── tests/
  ├── Dockerfile
  ├── package.json
  └── deploy.yaml

// Payment Service (Java + MySQL)
payment-service/
  ├── src/
  ├── pom.xml
  ├── Dockerfile
  └── deploy.yaml

// Analytics Service (Python + MongoDB)
analytics-service/
  ├── src/
  ├── requirements.txt
  ├── Dockerfile
  └── deploy.yaml
```

### 5. Decentralization

**No central orchestrator; services collaborate as peers.**

**❌ Centralized (Orchestration):**

```
          Central Orchestrator
                  ↓
     ┌────────────┼────────────┐
     ↓            ↓            ↓
  Service A   Service B   Service C
```

**✅ Decentralized (Choreography):**

```
Service A → Event Bus → Service B
              ↓
          Service C

Each service reacts to events independently
```

### 6. Failure Isolation

**Failure in one service doesn't bring down others.**

```typescript
// Circuit Breaker Pattern
class OrderService {
  private userServiceBreaker = new CircuitBreaker(userServiceClient, {
    timeout: 3000,
    errorThreshold: 50,
    resetTimeout: 30000,
  });

  async createOrder(userId: string) {
    try {
      // Try to get user info
      const user = await this.userServiceBreaker.call(() =>
        userServiceClient.getUser(userId),
      );

      return await this.createOrderWithUser(user);
    } catch (error) {
      // Fallback: Create order without full user details
      console.warn("User service unavailable, using minimal data");
      return await this.createOrderWithMinimalData(userId);
    }
  }
}
```

## Service Boundaries

### How to Define Service Boundaries?

#### 1. Domain-Driven Design (DDD)

**Identify bounded contexts:**

```
E-commerce Bounded Contexts:
┌─────────────────────────────────────────────┐
│  Shopping Context                            │
│  - Product Catalog                           │
│  - Search                                    │
│  - Recommendations                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Order Management Context                    │
│  - Cart                                      │
│  - Checkout                                  │
│  - Order Processing                          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Fulfillment Context                         │
│  - Inventory                                 │
│  - Shipping                                  │
│  - Tracking                                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Customer Context                            │
│  - User Management                           │
│  - Authentication                            │
│  - Profile                                   │
└─────────────────────────────────────────────┘
```

#### 2. Business Capabilities

**Organize around what the business does:**

```
Banking Business Capabilities:
- Account Management
- Transaction Processing
- Loan Management
- Customer Service
- Fraud Detection
- Reporting & Analytics
```

#### 3. Team Structure (Conway's Law)

> "Organizations design systems that mirror their communication structure."

```
Team A (Frontend) → User Interface Service
Team B (Payments) → Payment Service
Team C (Inventory) → Inventory Service
Team D (Shipping) → Shipping Service
```

## Database Per Service

**Each microservice owns its data - no shared databases.**

### Why?

1. **Loose coupling:** Services don't depend on others' data structures
2. **Independent scaling:** Scale database based on service needs
3. **Technology choice:** Choose best database for each service
4. **Fault isolation:** Database issues don't affect other services

### Patterns:

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   User      │       │  Product    │       │   Order     │
│  Service    │       │  Service    │       │  Service    │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                     │
       ↓                     ↓                     ↓
   PostgreSQL              MongoDB          PostgreSQL
   (Relational)        (Document Store)    (Relational)
```

### Handling Data Joins:

**Problem:** How to get user and their orders (data in different services)?

**Solution 1: API Composition**

```typescript
async function getUserWithOrders(userId: string) {
  // Call multiple services
  const [user, orders] = await Promise.all([
    userService.getUser(userId),
    orderService.getUserOrders(userId),
  ]);

  return { user, orders };
}
```

**Solution 2: CQRS (Command Query Responsibility Segregation)**

```
Write Side (Commands):
- User Service → User DB
- Order Service → Order DB

Read Side (Queries):
- Materialized View → Combined Data
- Updated via events from services
```

**Solution 3: Event Sourcing**

```
User Created Event → Update Read Model
Order Created Event → Update Read Model

Read Model: Pre-joined user + order data
```

## Benefits of Microservices

### 1. Independent Deployment

```
Deploy user-service → No impact on order-service
Roll back payment-service → Other services continue
```

### 2. Technology Diversity

```
User Service:     Node.js + PostgreSQL
Payment Service:  Java + MySQL
Analytics:        Python + MongoDB
Search:           Elasticsearch
```

### 3. Scalability

```
Black Friday Sale:
- Scale Order Service:     10 → 50 instances
- Scale Payment Service:   5 → 20 instances
- User Service: No change (4 instances)
```

### 4. Team Autonomy

```
Team A owns User Service:
- Choose tech stack
- Define release schedule
- Manage database
- Set SLAs
```

### 5. Fault Tolerance

```
Payment Service Down → Order Service degraded but functional
Search Service Slow → Main site unaffected
```

## Challenges

### 1. Distributed System Complexity

- Network latency
- Partial failures
- Eventual consistency
- Distributed transactions

### 2. Operational Overhead

- More services to deploy
- More monitoring needed
- Service discovery
- Load balancing

### 3. Data Consistency

- No ACID transactions across services
- Eventual consistency
- Complex queries across services

### 4. Testing Challenges

- Integration testing harder
- End-to-end testing complex
- Contract testing needed

## When to Use Microservices?

### ✅ Good Fit:

- Large, complex applications
- Multiple teams
- Need for independent scaling
- Different parts evolving at different rates
- Long-term project (>2 years)

### ❌ Not a Good Fit:

- Small applications
- Single team
- Tight deadlines
- Simple domain
- Startup MVP

## Migration Strategy

**Don't go all-in immediately! Start small:**

### 1. Strangler Fig Pattern

```
Monolith
   ↓
Monolith + Service A (new feature)
   ↓
Monolith + Service A + Service B (extracted)
   ↓
Service A + Service B + Service C + ...
   ↓
Microservices
```

### 2. Start with Non-Critical Services

```
Phase 1: Extract Notification Service (low risk)
Phase 2: Extract Reporting Service (read-only)
Phase 3: Extract Inventory Service (medium risk)
Phase 4: Extract Payment Service (high risk)
```

## Best Practices

1. **Start with a monolith**
   - Understand domain first
   - Split when you have clear boundaries

2. **Design for failure**
   - Use circuit breakers
   - Implement retries with backoff
   - Have fallback strategies

3. **Invest in automation**
   - CI/CD pipelines
   - Infrastructure as code
   - Automated testing

4. **Monitor everything**
   - Distributed tracing
   - Centralized logging
   - Metrics and alerting

5. **Define clear contracts**
   - API versioning
   - Backward compatibility
   - Contract testing

6. **Keep services focused**
   - If it gets too big, split it
   - "Two pizza team" rule

## Key Takeaways

✅ **Single Responsibility** - one service, one job  
✅ **Loose Coupling** - services interact through APIs  
✅ **High Cohesion** - related functionality together  
✅ **Autonomy** - independent deployment and scaling  
✅ **Database per service** - no shared databases  
✅ **Design for failure** - services will fail, plan for it  
✅ **Don't start with microservices** - evolve from monolith

## Next Lesson

Continue to **Service Communication Patterns** to learn how microservices talk to each other! 📡
