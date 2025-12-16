# Database Sharding

## Introduction

**Database sharding** is a horizontal partitioning technique that splits a large database into smaller, more manageable pieces called **shards**. Each shard is an independent database that contains a subset of the total data.

## What is Sharding?

Sharding distributes data across multiple database servers (shards), where each shard:

- Holds a portion of the total dataset
- Operates independently
- Can be scaled independently
- Has the same schema but different data

```
Single Database (Before Sharding):
┌─────────────────────────────────┐
│   All 100M Users in One DB      │
└─────────────────────────────────┘
         ⚠️ Single point of failure
         ⚠️ Limited by one machine

After Sharding:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Shard 1     │  │  Shard 2     │  │  Shard 3     │
│ Users 1-33M  │  │ Users 34-66M │  │ Users 67-100M│
└──────────────┘  └──────────────┘  └──────────────┘
```

## Why Shard?

### Performance Limitations

**Single database constraints:**

- CPU bottleneck (queries compete for processing)
- Memory limits (can't cache all data)
- Disk I/O saturation
- Network bandwidth limits

### Scaling Beyond One Server

**Vertical scaling limits:**

- Maximum server size (CPU, RAM, disk)
- Expensive hardware costs
- Single point of failure
- Downtime for upgrades

**Sharding enables:**

- ✅ Distribute load across multiple servers
- ✅ Scale linearly (add more shards)
- ✅ Reduce query latency
- ✅ Increase throughput
- ✅ Isolate failures

## Sharding Strategies

### 1. Range-Based Sharding

**Partition by continuous ranges of shard key values.**

```
User IDs:
Shard 1: 1 - 1,000,000
Shard 2: 1,000,001 - 2,000,000
Shard 3: 2,000,001 - 3,000,000
Shard 4: 3,000,001 - 4,000,000
```

**Implementation:**

```python
def get_shard(user_id, num_shards=4, users_per_shard=1000000):
    shard_id = (user_id - 1) // users_per_shard
    return f"shard_{shard_id}"

# Examples
get_shard(500000)     # shard_0
get_shard(1500000)    # shard_1
get_shard(2500000)    # shard_2
```

**Pros:**

- ✅ Simple to implement
- ✅ Easy range queries
- ✅ Simple to add new shards (extend range)

**Cons:**

- ❌ Uneven data distribution (hotspots)
- ❌ New users always hit latest shard
- ❌ Some ranges may be more active

**Best for:**

- Time-series data
- Sequential IDs
- Log data

### 2. Hash-Based Sharding

**Use hash function to distribute data evenly.**

```
hash(user_id) % num_shards = shard_id

Examples:
hash(12345) % 4 = 1  → Shard 1
hash(67890) % 4 = 2  → Shard 2
hash(11111) % 4 = 3  → Shard 3
```

**Implementation:**

```python
import hashlib

def get_shard(user_id, num_shards=4):
    # Convert to string and hash
    hash_value = int(hashlib.md5(str(user_id).encode()).hexdigest(), 16)
    shard_id = hash_value % num_shards
    return f"shard_{shard_id}"

# More uniform distribution
get_shard(1)      # shard_2
get_shard(2)      # shard_0
get_shard(100)    # shard_3
get_shard(1000)   # shard_1
```

**Pros:**

- ✅ Even data distribution
- ✅ No hotspots
- ✅ Uniform load across shards

**Cons:**

- ❌ Range queries require hitting all shards
- ❌ Adding/removing shards requires rehashing
- ❌ Complex rebalancing

**Best for:**

- User data (by user_id)
- Session data
- Cache distribution

### 3. Geographic Sharding

**Partition by geographic location.**

```
Shard US-East:   Users in US East Coast
Shard US-West:   Users in US West Coast
Shard EU:        Users in Europe
Shard ASIA:      Users in Asia
```

**Implementation:**

```python
SHARD_MAP = {
    'US-EAST': ['NY', 'MA', 'VA', 'FL'],
    'US-WEST': ['CA', 'WA', 'OR', 'NV'],
    'EU': ['UK', 'DE', 'FR', 'IT'],
    'ASIA': ['JP', 'CN', 'IN', 'SG']
}

def get_shard(user_region):
    for shard, regions in SHARD_MAP.items():
        if user_region in regions:
            return shard
    return 'DEFAULT'
```

**Pros:**

- ✅ Low latency (data close to users)
- ✅ Compliance with data residency laws
- ✅ Fault isolation by region

**Cons:**

- ❌ Uneven distribution (population differences)
- ❌ Cross-shard queries for global features
- ❌ Complex for migrating users

**Best for:**

- Global applications
- Regulatory compliance (GDPR)
- Multi-region deployments

### 4. Directory-Based Sharding

**Maintain a lookup table mapping keys to shards.**

```
Directory (Lookup Table):
┌─────────┬──────────┐
│ user_id │ shard_id │
├─────────┼──────────┤
│ 1-1000  │ shard_0  │
│ 1001-2000│ shard_1 │
│ 2001-3000│ shard_2 │
└─────────┴──────────┘

Query flow:
1. Check directory for user_id
2. Route to appropriate shard
```

**Implementation:**

```python
class ShardDirectory:
    def __init__(self):
        self.directory = {}  # Can be Redis, ZooKeeper, etc.

    def get_shard(self, user_id):
        # Lookup in directory
        return self.directory.get(user_id, 'default_shard')

    def assign_shard(self, user_id, shard_id):
        self.directory[user_id] = shard_id
```

**Pros:**

- ✅ Flexible shard assignment
- ✅ Easy rebalancing (update directory)
- ✅ Can optimize based on access patterns

**Cons:**

- ❌ Extra lookup overhead
- ❌ Directory becomes bottleneck/SPOF
- ❌ Directory must be highly available

**Best for:**

- Dynamic sharding
- Custom partitioning logic
- Migrating between sharding strategies

## Shard Key Selection

**The shard key determines how data is distributed. Choose wisely!**

### Good Shard Key Characteristics:

1. **High Cardinality**
   - Many unique values
   - Example: `user_id` ✅, `country` ❌ (only ~200 values)

2. **Even Distribution**
   - No hotspots
   - Example: `hash(user_id)` ✅, `signup_date` ❌ (recent dates busier)

3. **Stable**
   - Doesn't change frequently
   - Example: `user_id` ✅, `user_status` ❌ (changes often)

4. **Aligns with Query Patterns**
   - Most queries can target single shard
   - Example: Query by `user_id` ✅, Query by `email` ❌

### Common Shard Keys:

| Data Type        | Good Shard Key            | Why                               |
| ---------------- | ------------------------- | --------------------------------- |
| **Users**        | `user_id`                 | Unique, stable, even distribution |
| **Orders**       | `customer_id`             | Groups user's orders together     |
| **Logs**         | `timestamp` + `server_id` | Time-series with source           |
| **IoT Data**     | `device_id`               | Each device's data together       |
| **Multi-tenant** | `tenant_id`               | Isolate tenant data               |

## Handling Cross-Shard Queries

**Challenge:** What if you need data from multiple shards?

### Scatter-Gather Pattern

```python
def search_users(email):
    results = []

    # Scatter: Query all shards in parallel
    with ThreadPoolExecutor() as executor:
        futures = [
            executor.submit(query_shard, shard, email)
            for shard in all_shards
        ]

        # Gather: Collect results
        for future in futures:
            results.extend(future.result())

    return results
```

### Denormalization

**Store copies of frequently accessed data together:**

```sql
-- Instead of joining across shards
-- Denormalize: Store user info with each order
Orders Table (in each shard):
┌──────────┬─────────────┬──────────────┬─────────────┐
│ order_id │ customer_id │ customer_name│ amount      │
├──────────┼─────────────┼──────────────┼─────────────┤
│ 1001     │ 123         │ Alice        │ 99.99       │
└──────────┴─────────────┴──────────────┴─────────────┘
```

### Secondary Index Service

**Maintain a separate index for non-shard-key queries:**

```
User Search Index (Elasticsearch):
- Index all users
- Query index to find shard locations
- Fetch full data from appropriate shard
```

## Rebalancing Shards

**When to rebalance:**

- Adding new shards
- Removing shards
- Uneven data distribution
- Performance degradation

### Consistent Hashing

**Minimizes data movement when adding/removing shards:**

```python
import hashlib

class ConsistentHashing:
    def __init__(self, nodes, virtual_nodes=150):
        self.ring = {}
        self.nodes = nodes
        self.virtual_nodes = virtual_nodes
        self._build_ring()

    def _hash(self, key):
        return int(hashlib.md5(key.encode()).hexdigest(), 16)

    def _build_ring(self):
        for node in self.nodes:
            for i in range(self.virtual_nodes):
                virtual_key = f"{node}:{i}"
                hash_value = self._hash(virtual_key)
                self.ring[hash_value] = node

    def get_node(self, key):
        hash_value = self._hash(str(key))
        # Find next node clockwise on ring
        sorted_keys = sorted(self.ring.keys())
        for ring_key in sorted_keys:
            if ring_key >= hash_value:
                return self.ring[ring_key]
        return self.ring[sorted_keys[0]]

# Only K/n keys need to move when adding/removing nodes
# (K = total keys, n = number of nodes)
```

### Live Migration

```python
# Step-by-step migration to avoid downtime
def migrate_data(source_shard, target_shard, user_ids):
    for user_id in user_ids:
        # 1. Copy data to new shard
        data = source_shard.get(user_id)
        target_shard.insert(user_id, data)

        # 2. Update routing table
        routing_table.update(user_id, target_shard)

        # 3. Verify and delete from old shard
        if target_shard.exists(user_id):
            source_shard.delete(user_id)
```

## Challenges and Solutions

### Challenge 1: Transactions Across Shards

**Problem:** ACID transactions don't span shards

**Solutions:**

- **2-Phase Commit (2PC):** Coordinate across shards (slow, complex)
- **Saga Pattern:** Break into smaller transactions with compensation
- **Avoid:** Design so transactions stay within one shard

### Challenge 2: Joins Across Shards

**Problem:** Can't join tables on different shards

**Solutions:**

- **Denormalize:** Store related data together
- **Application-level joins:** Fetch and join in application code
- **Co-locate:** Put related data in same shard

### Challenge 3: Shard Hotspots

**Problem:** One shard gets more traffic

**Solutions:**

- **Better shard key:** Choose more evenly distributed key
- **Split hot shard:** Divide busy shard into multiple shards
- **Caching:** Cache hot data to reduce database load

### Challenge 4: Operational Complexity

**Problem:** Managing many databases is hard

**Solutions:**

- **Automation:** Automate provisioning, backup, monitoring
- **Managed services:** Use cloud databases with built-in sharding
- **Tools:** Use sharding middleware (Vitess, ProxySQL)

## Best Practices

1. **Start with a good shard key**
   - High cardinality
   - Even distribution
   - Aligned with queries

2. **Over-provision shards initially**
   - Easier to use existing shards than add new ones
   - Plan for 2-3 years of growth

3. **Monitor shard metrics**
   - Data size per shard
   - Query distribution
   - Slow queries

4. **Automate everything**
   - Shard provisioning
   - Backups
   - Failover

5. **Plan for rebalancing**
   - Have a migration strategy
   - Test rebalancing process
   - Minimize downtime

6. **Document shard mapping**
   - Which data is where
   - How to route queries
   - Migration history

## Real-World Example: Instagram

**Instagram's sharding evolution:**

**Phase 1:** Single PostgreSQL database

**Phase 2:** Logical shards (multiple schemas in one DB)

```sql
CREATE SCHEMA shard_0;
CREATE SCHEMA shard_1;
-- Separate tables per shard
```

**Phase 3:** Physical shards (separate databases)

```
Shard by user_id:
- 1000 shards total
- Each shard: PostgreSQL database
- Shard key: user_id
```

**Key decisions:**

- Shard by `user_id` (most queries are user-specific)
- Over-provisioned (1000 shards for room to grow)
- Use consistent hashing for even distribution

## Key Takeaways

✅ **Sharding** enables horizontal scaling beyond one database  
✅ Choose **shard key** carefully - high cardinality, even distribution  
✅ **Hash-based** for even distribution; **Range-based** for range queries  
✅ **Consistent hashing** minimizes data movement when rebalancing  
✅ **Denormalize** to avoid cross-shard queries  
✅ Plan for **operational complexity** - monitoring, backup, failover  
✅ **Start sharding** before you need it (hard to migrate later)

## Next Steps

You've completed the Database Design module! 🎉

Continue your learning journey:

- **Caching Strategies**: Learn how to speed up your applications
- **Microservices Architecture**: Build distributed systems
- **Practice Problems**: Apply database design concepts

Ready for the next challenge? 🚀
