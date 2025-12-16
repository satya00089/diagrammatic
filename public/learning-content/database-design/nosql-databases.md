# NoSQL Database Patterns

## Introduction

NoSQL databases provide flexible schemas and horizontal scalability for modern applications. Understanding when and how to use them is crucial for building scalable systems.

## What is NoSQL?

**NoSQL** (Not Only SQL) databases are non-relational databases designed for:

- **Flexible schemas** (schemaless or dynamic)
- **Horizontal scalability** (scale out easily)
- **High performance** for specific use cases
- **Handling unstructured data**

## Types of NoSQL Databases

### 1. Document Databases

Store data as JSON-like documents.

**Examples:** MongoDB, CouchDB, Firebase Firestore

**Structure:**

```json
{
  "_id": "user_123",
  "username": "alice",
  "email": "alice@example.com",
  "profile": {
    "firstName": "Alice",
    "lastName": "Smith",
    "age": 28
  },
  "tags": ["developer", "designer"],
  "createdAt": "2025-01-01T00:00:00Z"
}
```

**Best for:**

- Content management systems
- User profiles
- Product catalogs
- Real-time analytics

**MongoDB Example:**

```javascript
// Insert document
db.users.insertOne({
  username: "alice",
  email: "alice@example.com",
  profile: {
    firstName: "Alice",
    age: 28,
  },
});

// Query with nested fields
db.users.find({
  "profile.age": { $gte: 25 },
});

// Update nested field
db.users.updateOne({ username: "alice" }, { $set: { "profile.age": 29 } });
```

### 2. Key-Value Stores

Simplest NoSQL type - store data as key-value pairs.

**Examples:** Redis, Memcached, DynamoDB

**Structure:**

```
Key                    Value
─────────────────────────────────
user:123            → {"name": "Alice", "age": 28}
session:abc123      → {"userId": 123, "loggedIn": true}
cache:homepage      → "<html>...</html>"
counter:page_views  → 1234567
```

**Best for:**

- Caching
- Session management
- Real-time analytics
- Shopping carts
- Leaderboards

**Redis Example:**

```redis
# String operations
SET user:123:name "Alice"
GET user:123:name

# Hash operations
HSET user:123 name "Alice" age 28 email "alice@example.com"
HGETALL user:123

# List operations (queue)
LPUSH queue:emails "email1@test.com"
RPOP queue:emails

# Sorted set (leaderboard)
ZADD leaderboard 100 "player1"
ZADD leaderboard 200 "player2"
ZREVRANGE leaderboard 0 9  # Top 10
```

### 3. Column-Family Stores

Store data in column families rather than rows.

**Examples:** Apache Cassandra, HBase, ScyllaDB

**Structure:**

```
Row Key: user_123
┌─────────────────────────────────────────────────┐
│ Column Family: profile                          │
├──────────────┬──────────────┬──────────────────┤
│ name:Alice   │ age:28       │ email:alice@...  │
└──────────────┴──────────────┴──────────────────┘
│ Column Family: activity                         │
├──────────────┬──────────────┬──────────────────┤
│ 2025-01-01   │ 2025-01-02   │ 2025-01-03       │
│ :login       │ :post        │ :comment         │
└──────────────┴──────────────┴──────────────────┘
```

**Best for:**

- Time-series data
- Event logging
- IoT sensor data
- Analytics workloads
- High write throughput

**Cassandra Example:**

```sql
-- Create table
CREATE TABLE user_events (
    user_id UUID,
    event_time TIMESTAMP,
    event_type TEXT,
    event_data MAP<TEXT, TEXT>,
    PRIMARY KEY (user_id, event_time)
) WITH CLUSTERING ORDER BY (event_time DESC);

-- Insert
INSERT INTO user_events (user_id, event_time, event_type, event_data)
VALUES (uuid(), '2025-01-01 10:00:00', 'login', {'ip': '192.168.1.1'});

-- Query by partition key
SELECT * FROM user_events
WHERE user_id = 123
AND event_time > '2025-01-01';
```

### 4. Graph Databases

Store data as nodes and edges (relationships).

**Examples:** Neo4j, Amazon Neptune, ArangoDB

**Structure:**

```
    (Alice)──[FRIENDS_WITH]──>(Bob)
       │                         │
       │                         │
  [LIKES]                   [LIKES]
       │                         │
       ↓                         ↓
   (Coffee)                  (Tea)
       ↑
       │
  [PRODUCES]
       │
   (Starbucks)
```

**Best for:**

- Social networks
- Recommendation engines
- Fraud detection
- Knowledge graphs
- Network analysis

**Neo4j Example:**

```cypher
// Create nodes
CREATE (alice:User {name: 'Alice', age: 28})
CREATE (bob:User {name: 'Bob', age: 30})
CREATE (coffee:Product {name: 'Coffee'})

// Create relationships
MATCH (a:User {name: 'Alice'}), (b:User {name: 'Bob'})
CREATE (a)-[:FRIENDS_WITH {since: '2020-01-01'}]->(b)

MATCH (a:User {name: 'Alice'}), (c:Product {name: 'Coffee'})
CREATE (a)-[:LIKES]->(c)

// Find friends of friends
MATCH (user:User {name: 'Alice'})-[:FRIENDS_WITH*2]-(fof:User)
RETURN fof.name

// Recommendation: What Alice's friends like
MATCH (alice:User {name: 'Alice'})-[:FRIENDS_WITH]-(friend)-[:LIKES]->(product)
WHERE NOT (alice)-[:LIKES]->(product)
RETURN product.name, COUNT(*) as friend_count
ORDER BY friend_count DESC
```

## Comparison Matrix

| Type          | Example   | Schema     | Scalability | Use Case          | Query Complexity |
| ------------- | --------- | ---------- | ----------- | ----------------- | ---------------- |
| **Document**  | MongoDB   | Flexible   | High        | General purpose   | Medium           |
| **Key-Value** | Redis     | None       | Very High   | Caching, sessions | Low              |
| **Column**    | Cassandra | Semi-rigid | Very High   | Time-series, logs | Medium           |
| **Graph**     | Neo4j     | Flexible   | Medium      | Relationships     | High             |

## SQL vs NoSQL: When to Use Each

### Use SQL (Relational) When:

✅ **Data is structured and relationships are important**

- Banking systems
- E-commerce transactions
- Inventory management

✅ **ACID compliance is critical**

- Financial transactions
- Order processing

✅ **Complex queries and JOINs are common**

- Reporting systems
- Business intelligence

✅ **Data integrity is paramount**

- Medical records
- Legal documents

### Use NoSQL When:

✅ **Schema is flexible or evolving**

- Content management
- User-generated content

✅ **Horizontal scaling is needed**

- High-traffic applications
- Global distribution

✅ **High write throughput required**

- Logging systems
- IoT data collection

✅ **Specific access patterns**

- Caching (Redis)
- Time-series (Cassandra)
- Graphs (Neo4j)

## Data Modeling Patterns

### Pattern 1: Embedded Documents

**Embed related data within a document:**

```json
{
  "_id": "order_123",
  "userId": "user_456",
  "status": "completed",
  "items": [
    {
      "productId": "prod_1",
      "name": "Laptop",
      "price": 1000,
      "quantity": 1
    },
    {
      "productId": "prod_2",
      "name": "Mouse",
      "price": 25,
      "quantity": 2
    }
  ],
  "total": 1050,
  "createdAt": "2025-01-01"
}
```

**Pros:**

- Single read operation
- Data locality
- No JOINs needed

**Cons:**

- Data duplication
- Large documents
- Update complexity

**Best for:** 1-to-few relationships, data read together

### Pattern 2: Reference Pattern

**Store references to other documents:**

```json
// User document
{
  "_id": "user_123",
  "username": "alice",
  "postIds": ["post_1", "post_2", "post_3"]
}

// Post documents
{
  "_id": "post_1",
  "userId": "user_123",
  "title": "Hello World",
  "content": "..."
}
```

**Pros:**

- No duplication
- Smaller documents
- Easy updates

**Cons:**

- Multiple queries
- Application-level JOINs

**Best for:** 1-to-many, many-to-many relationships

### Pattern 3: Hybrid (Extended Reference)

**Store frequently accessed fields, reference for full data:**

```json
{
  "_id": "post_123",
  "title": "Database Design",
  "content": "...",
  "author": {
    "id": "user_456",
    "username": "alice",
    "avatar": "https://..."
  }
}
```

**Pros:**

- Common data available immediately
- Reduced queries
- Balance between approaches

**Best for:** Frequently displayed summary data

### Pattern 4: Bucketing Pattern

**Group time-series data into buckets:**

```json
{
  "_id": "sensor_readings_2025_01_01_00",
  "sensorId": "sensor_123",
  "date": "2025-01-01",
  "hour": 0,
  "readings": [
    { "minute": 0, "temp": 22.5, "humidity": 45 },
    { "minute": 1, "temp": 22.6, "humidity": 45 }
    // ... 58 more readings
  ],
  "summary": {
    "avgTemp": 22.8,
    "minTemp": 22.5,
    "maxTemp": 23.1
  }
}
```

**Best for:** IoT, time-series, event logs

## Consistency Models

### Eventual Consistency

**Data will become consistent eventually, not immediately:**

```
Write to Node 1 → Replicate → Node 2 (delay) → Node 3 (delay)
                    ↓
              Read might get old data temporarily
```

**Trade-off:** High availability + partition tolerance (AP in CAP theorem)

**Examples:** DynamoDB, Cassandra (tunable)

### Strong Consistency

**All reads return the most recent write:**

```
Write to Node 1 → Wait for all replicas → Confirm → Allow reads
```

**Trade-off:** Lower availability during network issues (CP in CAP theorem)

**Examples:** MongoDB (with majority write concern)

### Tunable Consistency

**Configure consistency level per operation:**

```javascript
// MongoDB - Strong consistency
db.users.findOne(
  { _id: userId },
  { readConcern: { level: "majority" } }
);

// Cassandra - Choose consistency level
SELECT * FROM users WHERE id = ?
WITH CONSISTENCY LEVEL QUORUM;
```

## Best Practices

### 1. Design for Your Access Patterns

**Think queries first, then model data:**

```
Access Patterns:
1. Get user profile by ID
2. Get user's 10 most recent posts
3. Get all comments for a post

→ Embed recent posts in user document
→ Reference comments from post
```

### 2. Avoid Deep Nesting

**❌ Bad:**

```json
{
  "user": {
    "profile": {
      "address": {
        "location": {
          "city": "New York"
        }
      }
    }
  }
}
```

**✅ Good:**

```json
{
  "userId": "123",
  "city": "New York",
  "state": "NY"
}
```

### 3. Use Indexes Wisely

```javascript
// MongoDB - Create index for common queries
db.posts.createIndex({ userId: 1, createdAt: -1 });

// Query using index
db.posts.find({ userId: "123" }).sort({ createdAt: -1 });
```

### 4. Denormalize for Read Performance

```json
// Store computed values
{
  "postId": "post_123",
  "title": "NoSQL Guide",
  "commentCount": 42, // Denormalized
  "likeCount": 156, // Denormalized
  "lastCommentAt": "2025-01-10"
}
```

### 5. Handle Data Growth

```javascript
// Archive old data
db.posts.aggregate([
  { $match: { createdAt: { $lt: oneYearAgo } } },
  { $out: "posts_archive" },
]);

// TTL indexes (auto-delete)
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 86400 }, // 24 hours
);
```

## Real-World Example: Social Media Feed

### Requirements:

- Display user's feed (posts from followed users)
- Show post with author info and like/comment counts
- High read volume, moderate writes

### Design:

```json
// Posts collection (document database)
{
  "_id": "post_123",
  "userId": "user_456",
  "content": "Check out my new design!",
  "author": {
    "username": "alice",
    "avatar": "https://..."
  },
  "stats": {
    "likes": 42,
    "comments": 15,
    "shares": 3
  },
  "tags": ["design", "ui/ux"],
  "createdAt": "2025-01-01T10:00:00Z"
}

// Feed cache (Redis)
ZADD user:123:feed 1704106800 "post_123"
ZADD user:123:feed 1704106900 "post_124"
ZREVRANGE user:123:feed 0 19  # Latest 20 posts

// Real-time counters (Redis)
INCR post:123:likes
HINCRBY post:123:stats likes 1
```

## Key Takeaways

✅ Choose **NoSQL type** based on your access patterns  
✅ **Document DBs** for flexible schemas and nested data  
✅ **Key-Value** for caching and high-speed lookups  
✅ **Column stores** for time-series and analytics  
✅ **Graph DBs** for relationship-heavy data  
✅ **Denormalize** for read performance in NoSQL  
✅ Understand **consistency trade-offs** (CAP theorem)

## Next Lesson

Continue to **Database Sharding** to learn how to horizontally partition your data for massive scale! 🚀
