# Relational Database Design

## Introduction

Relational databases have been the backbone of data storage for decades. Understanding how to design efficient schemas, optimize queries, and use indexes effectively is crucial for building high-performance applications.

## What is a Relational Database?

A relational database organizes data into **tables** (relations) with **rows** (records) and **columns** (attributes). Tables can be linked through **relationships** using **foreign keys**.

```
Users Table:
┌────┬──────────┬───────────────────┬─────────────┐
│ id │ username │ email             │ created_at  │
├────┼──────────┼───────────────────┼─────────────┤
│ 1  │ alice    │ alice@example.com │ 2025-01-01  │
│ 2  │ bob      │ bob@example.com   │ 2025-01-02  │
└────┴──────────┴───────────────────┴─────────────┘

Posts Table:
┌────┬─────────┬─────────────────┬─────────────┐
│ id │ user_id │ content         │ created_at  │
├────┼─────────┼─────────────────┼─────────────┤
│ 1  │ 1       │ Hello World!    │ 2025-01-03  │
│ 2  │ 1       │ Learning SQL    │ 2025-01-04  │
│ 3  │ 2       │ Database Design │ 2025-01-05  │
└────┴─────────┴─────────────────┴─────────────┘
         ↑
         └── Foreign Key to Users.id
```

## Database Normalization

**Normalization** is the process of organizing data to reduce redundancy and improve data integrity.

### First Normal Form (1NF)

**Rule:** Each column contains atomic (indivisible) values; no repeating groups.

**❌ Not in 1NF:**

```
Orders:
┌────┬──────────┬──────────────────────────┐
│ id │ customer │ products                 │
├────┼──────────┼──────────────────────────┤
│ 1  │ Alice    │ Laptop, Mouse, Keyboard  │
└────┴──────────┴──────────────────────────┘
```

**✅ In 1NF:**

```
Orders:
┌────┬──────────┬──────────┐
│ id │ customer │ product  │
├────┼──────────┼──────────┤
│ 1  │ Alice    │ Laptop   │
│ 1  │ Alice    │ Mouse    │
│ 1  │ Alice    │ Keyboard │
└────┴──────────┴──────────┘
```

### Second Normal Form (2NF)

**Rule:** Must be in 1NF + all non-key attributes fully depend on the primary key.

**❌ Not in 2NF:**

```
OrderItems:
┌──────────┬────────────┬──────────────┬──────────┐
│ order_id │ product_id │ product_name │ quantity │
├──────────┼────────────┼──────────────┼──────────┤
│ 1        │ 101        │ Laptop       │ 1        │
│ 1        │ 102        │ Mouse        │ 2        │
└──────────┴────────────┴──────────────┴──────────┘
          product_name depends only on product_id
```

**✅ In 2NF:**

```
Products:
┌────────────┬──────────────┐
│ product_id │ product_name │
├────────────┼──────────────┤
│ 101        │ Laptop       │
│ 102        │ Mouse        │
└────────────┴──────────────┘

OrderItems:
┌──────────┬────────────┬──────────┐
│ order_id │ product_id │ quantity │
├──────────┼────────────┼──────────┤
│ 1        │ 101        │ 1        │
│ 1        │ 102        │ 2        │
└──────────┴────────────┴──────────┘
```

### Third Normal Form (3NF)

**Rule:** Must be in 2NF + no transitive dependencies (non-key attributes depend only on primary key).

**❌ Not in 3NF:**

```
Employees:
┌────┬──────┬─────────────┬──────────────┐
│ id │ name │ dept_id     │ dept_name    │
├────┼──────┼─────────────┼──────────────┤
│ 1  │ John │ 10          │ Engineering  │
│ 2  │ Jane │ 10          │ Engineering  │
└────┴──────┴─────────────┴──────────────┘
                dept_name depends on dept_id
```

**✅ In 3NF:**

```
Departments:
┌─────────┬──────────────┐
│ dept_id │ dept_name    │
├─────────┼──────────────┤
│ 10      │ Engineering  │
│ 20      │ Marketing    │
└─────────┴──────────────┘

Employees:
┌────┬──────┬─────────┐
│ id │ name │ dept_id │
├────┼──────┼─────────┤
│ 1  │ John │ 10      │
│ 2  │ Jane │ 10      │
└────┴──────┴─────────┘
```

## When to Denormalize?

While normalization reduces redundancy, **denormalization** can improve read performance:

**Use cases for denormalization:**

- Read-heavy applications
- Avoid expensive JOINs
- Data warehousing and analytics
- Caching aggregated data

**Example:**

```sql
-- Normalized: Requires JOIN
SELECT u.username, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id;

-- Denormalized: Direct read
SELECT username, post_count FROM user_stats;
```

## Indexing Strategies

Indexes speed up data retrieval but slow down writes.

### Types of Indexes

#### 1. Primary Index

Automatically created on primary key:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,  -- Automatically indexed
    username VARCHAR(50),
    email VARCHAR(100)
);
```

#### 2. Unique Index

Ensures uniqueness and speeds up lookups:

```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_username ON users(username);
```

#### 3. Composite Index

Index on multiple columns:

```sql
-- Good for queries filtering by both user_id AND created_at
CREATE INDEX idx_posts_user_created
ON posts(user_id, created_at DESC);

-- Efficient for:
SELECT * FROM posts
WHERE user_id = 123
ORDER BY created_at DESC;
```

#### 4. Partial Index

Index only a subset of rows:

```sql
-- Index only active users
CREATE INDEX idx_active_users
ON users(created_at)
WHERE status = 'active';
```

#### 5. Full-Text Index

For text search:

```sql
-- PostgreSQL
CREATE INDEX idx_posts_content_fts
ON posts USING GIN(to_tsvector('english', content));

-- MySQL
CREATE FULLTEXT INDEX idx_posts_content ON posts(content);
```

### Index Best Practices

1. **Index foreign keys**

```sql
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
```

2. **Index columns used in WHERE clauses**

```sql
-- Query: WHERE status = 'active' AND created_at > '2025-01-01'
CREATE INDEX idx_users_status_created ON users(status, created_at);
```

3. **Consider index order for composite indexes**

```sql
-- Order matters! Put most selective column first
CREATE INDEX idx_orders ON orders(status, user_id, created_at);
```

4. **Monitor index usage**

```sql
-- PostgreSQL: Check unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY tablename;
```

5. **Avoid over-indexing**

```
Each index:
- ✅ Speeds up reads
- ❌ Slows down writes
- ❌ Takes storage space
- ❌ Requires maintenance
```

## Query Optimization

### Use EXPLAIN to Analyze Queries

```sql
EXPLAIN ANALYZE
SELECT u.username, p.title
FROM users u
JOIN posts p ON u.id = p.user_id
WHERE u.status = 'active'
ORDER BY p.created_at DESC
LIMIT 10;
```

**Output shows:**

- Execution plan
- Index usage
- Estimated vs actual rows
- Execution time

### Common Optimization Techniques

#### 1. Avoid SELECT \*

**❌ Bad:**

```sql
SELECT * FROM users WHERE id = 123;
```

**✅ Good:**

```sql
SELECT id, username, email FROM users WHERE id = 123;
```

#### 2. Use LIMIT for Pagination

```sql
-- Efficient pagination
SELECT id, title FROM posts
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- Better: Use keyset pagination
SELECT id, title FROM posts
WHERE created_at < '2025-01-10'
ORDER BY created_at DESC
LIMIT 20;
```

#### 3. Avoid Functions in WHERE Clause

**❌ Bad (prevents index usage):**

```sql
SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';
```

**✅ Good:**

```sql
-- Store email in lowercase OR use functional index
SELECT * FROM users WHERE email = 'alice@example.com';
```

#### 4. Use EXISTS Instead of COUNT

**❌ Bad:**

```sql
SELECT COUNT(*) FROM orders WHERE user_id = 123;
-- Returns count even if only checking existence
```

**✅ Good:**

```sql
SELECT EXISTS(SELECT 1 FROM orders WHERE user_id = 123);
-- Stops after finding first row
```

#### 5. Batch Operations

**❌ Bad:**

```sql
-- 1000 individual queries
for user in users:
    INSERT INTO logs (user_id, action) VALUES (user.id, 'login');
```

**✅ Good:**

```sql
-- Single batch insert
INSERT INTO logs (user_id, action)
VALUES
    (1, 'login'),
    (2, 'login'),
    (3, 'login'),
    ...
    (1000, 'login');
```

## Relationships

### One-to-Many

Most common relationship type:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50)
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content TEXT
);
```

```
One user → Many posts

User 1 ──┬── Post 1
         ├── Post 2
         └── Post 3
```

### Many-to-Many

Requires a junction table:

```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100)
);

CREATE TABLE enrollments (
    student_id INTEGER REFERENCES students(id),
    course_id INTEGER REFERENCES courses(id),
    enrolled_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (student_id, course_id)
);
```

```
Student 1 ──┬── Math
            └── Physics

Student 2 ──┬── Math
            └── Chemistry
```

### One-to-One

Less common, used for splitting large tables:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100)
);

CREATE TABLE user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    bio TEXT,
    avatar_url VARCHAR(255),
    date_of_birth DATE
);
```

## Transactions & ACID Properties

### ACID Principles

**Atomicity:** All or nothing

```sql
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;  -- Both succeed or both fail
```

**Consistency:** Database moves from one valid state to another

```sql
-- Constraint ensures consistency
ALTER TABLE accounts ADD CONSTRAINT positive_balance
CHECK (balance >= 0);
```

**Isolation:** Concurrent transactions don't interfere

```sql
-- Set isolation level
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
    -- Your queries here
COMMIT;
```

**Durability:** Committed data persists

```sql
COMMIT;  -- Data is permanently saved, survives crashes
```

### Transaction Example

```sql
-- Bank transfer
BEGIN;
    -- Debit sender
    UPDATE accounts
    SET balance = balance - 100
    WHERE user_id = 1 AND balance >= 100;

    -- Check if update affected 1 row (sufficient funds)
    IF ROW_COUNT = 0 THEN
        ROLLBACK;
        RAISE EXCEPTION 'Insufficient funds';
    END IF;

    -- Credit receiver
    UPDATE accounts
    SET balance = balance + 100
    WHERE user_id = 2;

    -- Log transaction
    INSERT INTO transactions (from_user, to_user, amount)
    VALUES (1, 2, 100);
COMMIT;
```

## Common Patterns

### Soft Delete

Keep deleted records for audit:

```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;

-- "Delete" user
UPDATE users SET deleted_at = NOW() WHERE id = 123;

-- Query active users
SELECT * FROM users WHERE deleted_at IS NULL;
```

### Timestamping

Track record creation and updates:

```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Audit Logging

Track all changes:

```sql
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50),
    record_id INTEGER,
    action VARCHAR(10),  -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT NOW()
);
```

## Best Practices

1. **Use appropriate data types**
   - `SERIAL` for auto-incrementing IDs
   - `VARCHAR(n)` for variable-length strings
   - `TEXT` for unlimited text
   - `TIMESTAMP` for dates and times
   - `JSONB` for flexible data

2. **Add constraints**
   - `NOT NULL` for required fields
   - `UNIQUE` for unique values
   - `CHECK` for value validation
   - `FOREIGN KEY` for referential integrity

3. **Name things consistently**
   - Tables: plural nouns (`users`, `posts`)
   - Columns: snake_case (`created_at`, `user_id`)
   - Indexes: `idx_table_column`
   - Foreign keys: `fk_table_column`

4. **Plan for scale**
   - Partition large tables
   - Archive old data
   - Use read replicas
   - Consider sharding for horizontal scaling

5. **Monitor performance**
   - Track slow queries
   - Monitor index usage
   - Check table sizes
   - Analyze query patterns

## Key Takeaways

✅ **Normalize** to reduce redundancy, **denormalize** for performance  
✅ **Index wisely** - foreign keys, WHERE clauses, ORDER BY columns  
✅ Use **EXPLAIN** to understand and optimize queries  
✅ **ACID transactions** ensure data consistency  
✅ Follow **naming conventions** and use **constraints**  
✅ **Monitor** and continuously optimize based on usage patterns

## Next Lesson

Continue to **NoSQL Database Patterns** to learn when and how to use non-relational databases! 🗄️
