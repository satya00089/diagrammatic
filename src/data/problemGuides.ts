import type { GuideArchitecture, ProblemGuide } from "../types/problemGuide";

const urlShortenerArchitecture: GuideArchitecture = {
  title: "URL Shortener reference architecture",
  summary:
    "A cache-first redirect path keeps hot links fast while link creation and analytics remain reliable and asynchronous.",
  layers: [
    {
      id: "serving",
      label: "Serving layer",
      description:
        "Clients, edge routing, and synchronous services that handle link creation and redirects.",
      componentIds: [
        "client",
        "edge",
        "gateway",
        "redirect-service",
        "id-generator",
      ],
    },
    {
      id: "state",
      label: "State layer",
      description:
        "Fast redirect lookups and the durable source of truth for link metadata.",
      componentIds: ["link-cache", "link-store"],
    },
    {
      id: "async",
      label: "Async analytics layer",
      description:
        "Click events leave the redirect path and are processed into queryable aggregates.",
      componentIds: [
        "click-queue",
        "analytics-worker",
        "analytics-store",
        "monitoring",
      ],
    },
  ],
  keyPaths: [
    {
      id: "redirect-path",
      label: "Redirect path",
      description:
        "Edge → gateway → redirect service → cache, with a database fallback on a miss.",
      componentIds: [
        "edge",
        "gateway",
        "redirect-service",
        "link-cache",
        "link-store",
      ],
    },
    {
      id: "analytics-path",
      label: "Analytics path",
      description:
        "The redirect service emits a click event without waiting for aggregation.",
      componentIds: [
        "redirect-service",
        "click-queue",
        "analytics-worker",
        "analytics-store",
      ],
    },
  ],
  components: [
    {
      id: "client",
      type: "client",
      componentId: "web-app",
      label: "Clients",
      description:
        "Browsers, mobile apps, and crawlers that create or follow links.",
      position: { x: 0, y: 260 },
      properties: { traffic: "Create and redirect requests" },
    },
    {
      id: "edge",
      type: "cdn",
      componentId: "edge-server",
      label: "Edge / CDN",
      description:
        "Terminates connections and serves hot redirects close to users.",
      position: { x: 480, y: 260 },
      properties: { responsibility: "Routing and edge caching" },
    },
    {
      id: "gateway",
      type: "api-gateway",
      componentId: "api-gateway",
      label: "API Gateway",
      description:
        "Validates requests, applies quotas, and routes create/read traffic.",
      position: { x: 960, y: 260 },
      properties: { protection: "Authentication, validation, rate limits" },
    },
    {
      id: "redirect-service",
      type: "application-server",
      componentId: "backend-server",
      label: "Link Service",
      description: "Creates codes, resolves redirects, and emits click events.",
      position: { x: 1440, y: 260 },
      properties: { criticalPath: "Cache-first redirect lookup" },
    },
    {
      id: "id-generator",
      type: "microservice",
      componentId: "id-generator",
      label: "ID Generator",
      description: "Reserves unique short codes for new links.",
      position: { x: 1920, y: -60 },
      properties: { strategy: "Base62 over unique IDs" },
    },
    {
      id: "link-cache",
      type: "cache",
      componentId: "cache",
      label: "Redirect Cache",
      description:
        "Caches code-to-destination mappings for the read-heavy path.",
      position: { x: 1920, y: 140 },
      properties: { strategy: "Cache-aside with invalidation" },
    },
    {
      id: "link-store",
      type: "database",
      componentId: "database",
      label: "Link Store",
      description:
        "Durable source of truth for links, aliases, ownership, and expiry.",
      position: { x: 2400, y: 340 },
      properties: { accessPattern: "Primary lookup by short code" },
    },
    {
      id: "click-queue",
      type: "queue",
      componentId: "queue",
      label: "Click Event Queue",
      description:
        "Buffers redirect analytics so the user-facing path stays fast.",
      position: { x: 1920, y: 620 },
      properties: { delivery: "Durable, asynchronous" },
    },
    {
      id: "analytics-worker",
      type: "microservice",
      componentId: "processing-worker",
      label: "Analytics Worker",
      description: "Normalizes click events and rolls them into time buckets.",
      position: { x: 2400, y: 620 },
      properties: { output: "Minute and hour aggregates" },
    },
    {
      id: "analytics-store",
      type: "analytics",
      componentId: "analytics",
      label: "Analytics Store",
      description: "Serves dashboards without scanning raw click events.",
      position: { x: 2880, y: 620 },
      properties: { dimensions: "Time, device, referrer, geography" },
    },
    {
      id: "monitoring",
      type: "monitoring",
      componentId: "monitoring",
      label: "Monitoring",
      description:
        "Tracks redirect latency, cache health, abuse signals, and queue lag.",
      position: { x: 2880, y: 40 },
      properties: { signals: "Latency, availability, errors, queue lag" },
    },
  ],
  connections: [
    {
      id: "client-edge",
      source: "client",
      target: "edge",
      type: "http",
      label: "HTTPS",
      description: "Create or follow a short link.",
    },
    {
      id: "edge-gateway",
      source: "edge",
      target: "gateway",
      type: "http",
      label: "Route",
      description: "Forward misses and writes to the API layer.",
    },
    {
      id: "gateway-service",
      source: "gateway",
      target: "redirect-service",
      type: "api-call",
      label: "API",
      description: "Validate and route link operations.",
    },
    {
      id: "service-generator",
      source: "redirect-service",
      target: "id-generator",
      type: "api-call",
      label: "Create",
      description: "Reserve a unique code for a new link.",
    },
    {
      id: "service-cache",
      source: "redirect-service",
      target: "link-cache",
      type: "data-flow",
      label: "Lookup",
      description: "Read the destination from the cache first.",
    },
    {
      id: "cache-store",
      source: "link-cache",
      target: "link-store",
      type: "database-connection",
      label: "Miss",
      description: "Fall back to durable storage and refill the cache.",
    },
    {
      id: "service-store",
      source: "redirect-service",
      target: "link-store",
      type: "database-connection",
      label: "Write",
      description: "Persist link metadata and alias reservations.",
    },
    {
      id: "service-queue",
      source: "redirect-service",
      target: "click-queue",
      type: "message-queue",
      label: "Click event",
      description:
        "Publish analytics asynchronously before returning the redirect.",
    },
    {
      id: "queue-worker",
      source: "click-queue",
      target: "analytics-worker",
      type: "event-stream",
      label: "Consume",
      description: "Process events independently from redirect traffic.",
    },
    {
      id: "worker-store",
      source: "analytics-worker",
      target: "analytics-store",
      type: "data-flow",
      label: "Aggregate",
      description: "Write queryable click aggregates.",
    },
    {
      id: "service-monitoring",
      source: "redirect-service",
      target: "monitoring",
      type: "event-stream",
      label: "Signals",
      description: "Emit latency, error, and abuse telemetry.",
    },
  ],
};

const urlShortenerGuide: ProblemGuide = {
  prompt: {
    brief:
      "Design a service that turns long URLs into compact links and resolves them with consistently low latency, even when traffic spikes.",
    successSignals: [
      "Separate the link-creation path from the read-heavy redirect path.",
      "Choose a short-code strategy and explain collision and capacity behavior.",
      "Keep analytics, abuse checks, and operational work away from redirect latency.",
      "Cover aliases, expiration, deletion, privacy, and cache invalidation.",
    ],
  },
  requirements: {
    functional: [
      "Create a compact URL for a valid destination URL.",
      "Redirect a short code to its current destination.",
      "Support optional custom aliases and expiration dates.",
      "Provide aggregate click analytics by time, referrer, device, and coarse location.",
      "Let an authenticated owner update, disable, or delete a link.",
    ],
    nonFunctional: [
      "Keep p95 redirect latency below 50 ms for cached links.",
      "Remain highly available because every redirect is user-facing.",
      "Make private or unlisted codes difficult to enumerate.",
      "Allow creation to be slower than redirects while remaining reliable and idempotent.",
      "Treat analytics as eventually consistent and never block a redirect on it.",
    ],
    scaleAssumptions: [
      "100 million new links per month.",
      "10 billion redirects per month with sharp viral peaks.",
      "An average destination URL is about 120 bytes before metadata and indexes.",
      "Read traffic is roughly 100 times heavier than write traffic.",
    ],
    metrics: [
      {
        label: "Create traffic",
        value: "~40 req/s",
        description:
          "Average write rate; quota and campaign bursts drive peak sizing.",
      },
      {
        label: "Redirect traffic",
        value: "~3.9K req/s",
        description:
          "Average reads; hot links can concentrate far more traffic on one code.",
      },
      {
        label: "Code capacity",
        value: "62^7 = 3.5T",
        description:
          "A seven-character Base62 namespace leaves ample room for growth.",
      },
      {
        label: "Link storage",
        value: "50-100 GB/mo",
        description:
          "Redirect rows stay small; raw click events usually dominate storage.",
      },
    ],
  },
  entities: [
    {
      name: "Link",
      fields: [
        "code",
        "destination_url",
        "owner_id",
        "created_at",
        "expires_at",
        "status",
      ],
      notes:
        "The critical lookup is by code. Keep this row compact so a redirect needs one indexed read.",
    },
    {
      name: "AliasReservation",
      fields: ["alias", "owner_id", "created_at", "moderation_status"],
      notes:
        "Separating custom aliases makes uniqueness, reserved words, and moderation explicit.",
    },
    {
      name: "ClickEvent",
      fields: [
        "code",
        "occurred_at",
        "referrer",
        "user_agent_hash",
        "ip_prefix",
      ],
      notes:
        "Publish asynchronously and minimize retention of identifying network data.",
    },
    {
      name: "ClickAggregate",
      fields: ["code", "bucket_start", "dimension", "count"],
      notes:
        "Precomputed buckets serve dashboards without scanning the raw event stream.",
    },
  ],
  apis: [
    {
      method: "POST",
      path: "/v1/links",
      contract:
        "{ destinationUrl, customAlias?, expiresAt? } -> { shortUrl, code }",
      notes:
        "Validate the destination, enforce quota, and reserve custom aliases atomically.",
    },
    {
      method: "GET",
      path: "/{code}",
      contract: "302 redirect to the stored destination",
      notes:
        "The hot path should complete with one cache read or one indexed datastore lookup.",
    },
    {
      method: "GET",
      path: "/v1/links/{code}/analytics",
      contract:
        "Click aggregates grouped by time bucket and selected dimensions",
      notes:
        "Serve precomputed results from an analytics store with owner authorization.",
    },
    {
      method: "PATCH",
      path: "/v1/links/{code}",
      contract: "{ destinationUrl?, expiresAt?, status? } -> updated link",
      notes:
        "Authorize the owner and invalidate cached mappings after every accepted change.",
    },
  ],
  dataFlow: [
    {
      title: "Create the link",
      description:
        "Validate the URL and quota, reserve a code, persist the link row, warm the cache, and return the public short URL.",
    },
    {
      title: "Generate a code",
      description:
        "Encode a unique numeric ID with Base62, or generate random Base62 strings and retry safely when an insert collides.",
    },
    {
      title: "Resolve the redirect",
      description:
        "Read code-to-destination from cache, fall back to the link store, verify status and expiry, then return the redirect.",
    },
    {
      title: "Emit click telemetry",
      description:
        "Publish a compact click event to a durable queue without waiting for analytics processing.",
    },
    {
      title: "Build aggregates",
      description:
        "Workers roll events into minute and hour buckets for dashboards, anomaly detection, and operational reporting.",
    },
  ],
  architecture: urlShortenerArchitecture,
  deepDives: [
    {
      title: "Short-code generation",
      points: [
        "A database sequence is easy to explain but becomes a coordination dependency at larger scale.",
        "Snowflake-style IDs remove the central database dependency and remain roughly time sortable.",
        "Random codes improve unguessability when the namespace is large and collision retries are handled transactionally.",
      ],
    },
    {
      title: "Redirect caching",
      points: [
        "Cache code-to-destination mappings aggressively because reads dominate writes.",
        "Use bounded TTLs plus explicit invalidation for edited, disabled, deleted, and expired links.",
        "Protect against hot keys with replicated caches, request coalescing, and edge caching where analytics permits it.",
      ],
    },
    {
      title: "Abuse and safety",
      points: [
        "Check destination reputation and scan suspicious links before broad distribution.",
        "Rate limit creation by account and network signals, with tighter limits for anonymous users.",
        "Provide a rapid takedown path that changes link status and invalidates every cache layer.",
      ],
    },
    {
      title: "Reliability and operations",
      points: [
        "Track redirect latency, cache hit rate, error rate, queue lag, and takedown propagation time.",
        "Degrade by dropping optional analytics before sacrificing redirect availability.",
        "Use multi-region reads and a clearly defined ownership model for writes and alias uniqueness.",
      ],
    },
  ],
  tradeoffs: [
    {
      title: "301 vs 302 redirects",
      recommendation:
        "Prefer 302 while destinations can change or click accounting is important.",
      caution:
        "Browsers and crawlers may cache 301 responses for a long time, making corrections difficult.",
    },
    {
      title: "Random codes vs sequential IDs",
      recommendation:
        "Use random codes for harder enumeration; use Base62-encoded IDs for simpler uniqueness and capacity planning.",
      caution:
        "Sequential IDs reveal growth, while random codes require a collision-safe insert path.",
    },
    {
      title: "Raw click events vs aggregates",
      recommendation:
        "Retain short-lived raw events when fraud analysis or reprocessing is valuable, then keep long-lived aggregates.",
      caution:
        "Raw events increase cost and privacy exposure; aggregate-only storage limits future analysis.",
    },
  ],
  commonMistakes: [
    "Writing analytics synchronously before returning the redirect.",
    "Ignoring custom-alias collisions, reserved words, and moderation.",
    "Choosing a code namespace without estimating its usable lifetime.",
    "Forgetting expiry, deletion, editing, and cache invalidation behavior.",
    "Assuming every link is public and safe to enumerate.",
  ],
  followUps: [
    {
      question: "What happens when one link suddenly goes viral?",
      answer:
        "Keep resolution cache-first, replicate the hot key, coalesce misses, prewarm edge caches when a spike is detected, and absorb click events with a partitioned durable queue.",
    },
    {
      question: "How would you reduce phishing and malware abuse?",
      answer:
        "Combine destination reputation, automated scanning, creation rate limits, user reports, and a fast disable workflow that invalidates cached redirects globally.",
    },
    {
      question: "How would editable destinations work?",
      answer:
        "Keep the short code stable, authorize every update, version the link row, and use explicit cache invalidation with a short TTL as a safety net.",
    },
    {
      question: "How would you support multiple regions?",
      answer:
        "Serve redirects from regional caches and replicas, assign a write owner for each code or alias namespace, and replicate updates with clear conflict rules.",
    },
  ],
  rubric: [
    {
      criterion: "Core flows",
      description:
        "Separates creation from redirect resolution and optimizes the read-heavy critical path.",
    },
    {
      criterion: "Data design",
      description:
        "Uses a compact lookup model, enforces code and alias uniqueness, and defines lifecycle state.",
    },
    {
      criterion: "Scale and reliability",
      description:
        "Includes realistic capacity math, caching, hot-key handling, async analytics, and failure behavior.",
    },
    {
      criterion: "Product judgment",
      description:
        "Covers expiration, edits, deletion, ownership, abuse, privacy, and operational visibility.",
    },
  ],
};

const documentManagementArchitecture: GuideArchitecture = {
  title: "Document management system reference architecture",
  summary:
    "A WebSocket collaboration path orders document operations and fans out updates quickly, while snapshots, search, versions, and notifications are processed asynchronously.",
  layers: [
    {
      id: "collaboration",
      label: "Collaboration layer",
      description:
        "Clients connect through the edge and gateway to a stateless collaboration service that authenticates sessions, orders operations, and broadcasts updates.",
      componentIds: ["client", "edge", "gateway", "collaboration-service"],
    },
    {
      id: "document-state",
      label: "Document state layer",
      description:
        "The operation log is the replayable write history; materialized documents, permissions, presence, and immutable revisions support the main read patterns.",
      componentIds: [
        "presence-store",
        "document-cache",
        "operation-log",
        "document-store",
        "version-store",
      ],
    },
    {
      id: "async-indexing",
      label: "Async indexing and delivery",
      description:
        "Durable change events drive snapshotting, full-text indexing, and share notifications without extending edit acknowledgement latency.",
      componentIds: [
        "change-events",
        "snapshot-worker",
        "search-worker",
        "search-index",
        "notification-service",
        "monitoring",
      ],
    },
  ],
  keyPaths: [
    {
      id: "open-and-edit-path",
      label: "Open and edit path",
      description:
        "Client -> edge -> gateway -> collaboration service -> cache/store, with accepted operations appended to the per-document log.",
      componentIds: [
        "client",
        "edge",
        "gateway",
        "collaboration-service",
        "document-cache",
        "document-store",
        "operation-log",
      ],
    },
    {
      id: "change-processing-path",
      label: "Change processing path",
      description:
        "The collaboration service publishes durable change events; workers materialize versions and update the search index independently.",
      componentIds: [
        "collaboration-service",
        "change-events",
        "snapshot-worker",
        "version-store",
        "search-worker",
        "search-index",
      ],
    },
  ],
  components: [
    {
      id: "client",
      type: "client",
      componentId: "web-app",
      label: "Web and mobile clients",
      description:
        "Render rich documents, keep a local operation buffer, and maintain a WebSocket session for edits, presence, and reconnects.",
      position: { x: 0, y: 280 },
      properties: { responsibilities: "Editing, local buffering, presence" },
    },
    {
      id: "edge",
      type: "cdn",
      componentId: "edge-server",
      label: "Edge / CDN",
      description:
        "Terminates TLS, routes long-lived connections, and serves static editor assets close to users.",
      position: { x: 440, y: 280 },
      properties: { responsibility: "TLS, routing, static assets" },
    },
    {
      id: "gateway",
      type: "api-gateway",
      componentId: "api-gateway",
      label: "API Gateway",
      description:
        "Authenticates users, applies workspace quotas, validates request envelopes, and routes REST and WebSocket traffic.",
      position: { x: 880, y: 280 },
      properties: { protection: "Auth, ACL checks, rate limits" },
    },
    {
      id: "collaboration-service",
      type: "application-server",
      componentId: "backend-server",
      label: "Collaboration Service",
      description:
        "Maintains document sessions, validates and deduplicates operations, assigns canonical sequence numbers, and broadcasts accepted changes.",
      position: { x: 1320, y: 280 },
      properties: { criticalPath: "Operation acknowledgement and fan-out" },
    },
    {
      id: "presence-store",
      type: "cache",
      componentId: "cache",
      label: "Presence Store",
      description:
        "Stores short-lived cursors, active sessions, and heartbeats; presence is disposable and never part of document durability.",
      position: { x: 1760, y: -120 },
      properties: { expiry: "Heartbeat TTL" },
    },
    {
      id: "document-cache",
      type: "cache",
      componentId: "cache",
      label: "Document Cache",
      description:
        "Caches recent materialized snapshots and permission summaries to make document opens cheap and protect the primary store.",
      position: { x: 1760, y: 280 },
      properties: { strategy: "Versioned cache-aside" },
    },
    {
      id: "operation-log",
      type: "database",
      componentId: "database",
      label: "Operation Log",
      description:
        "Durable, append-only history of accepted operations partitioned by document so reconnects and revision replay are deterministic.",
      position: { x: 1760, y: 540 },
      properties: {
        partitionKey: "document_id",
        ordering: "Per-document sequence",
      },
    },
    {
      id: "document-store",
      type: "database",
      componentId: "database",
      label: "Document and ACL Store",
      description:
        "Stores current document metadata, materialized content, folder membership, workspace membership, and permission grants.",
      position: { x: 2200, y: 280 },
      properties: { accessPatterns: "Document ID, parent folder, workspace" },
    },
    {
      id: "version-store",
      type: "file-storage",
      componentId: "object-storage",
      label: "Version and Attachment Store",
      description:
        "Keeps immutable compressed snapshots, exported versions, and large attachments outside the transactional metadata path.",
      position: { x: 2640, y: 540 },
      properties: { durability: "Immutable objects with retention policy" },
    },
    {
      id: "change-events",
      type: "queue",
      componentId: "queue",
      label: "Document Change Queue",
      description:
        "Buffers accepted change events for snapshotting, indexing, notifications, and replay after worker failure.",
      position: { x: 1760, y: 800 },
      properties: { delivery: "Durable, partitioned by document" },
    },
    {
      id: "snapshot-worker",
      type: "microservice",
      componentId: "processing-worker",
      label: "Snapshot Worker",
      description:
        "Compacts operation ranges into materialized snapshots and immutable revision checkpoints.",
      position: { x: 2200, y: 730 },
      properties: { trigger: "Every N operations or time interval" },
    },
    {
      id: "search-worker",
      type: "microservice",
      componentId: "processing-worker",
      label: "Search Indexer",
      description:
        "Extracts searchable text and ACL-filtering fields, then updates the full-text index with the newest document version.",
      position: { x: 2200, y: 980 },
      properties: { consistency: "Eventually consistent" },
    },
    {
      id: "search-index",
      type: "search-engine",
      componentId: "search",
      label: "Full-text Search Index",
      description:
        "Indexes document text, titles, folder breadcrumbs, and tenant-scoped permissions for fast workspace search.",
      position: { x: 2640, y: 980 },
      properties: { query: "Workspace + ACL filters + text relevance" },
    },
    {
      id: "notification-service",
      type: "notification-service",
      componentId: "notification-service",
      label: "Share Notification Service",
      description:
        "Sends email, push, or in-app notifications for shares, mentions, comments, and important document changes.",
      position: { x: 2200, y: -120 },
      properties: { delivery: "At-least-once with user preferences" },
    },
    {
      id: "monitoring",
      type: "monitoring",
      componentId: "monitoring",
      label: "Monitoring",
      description:
        "Tracks edit acknowledgement latency, reconnects, operation conflicts, queue lag, index freshness, and permission failures.",
      position: { x: 2640, y: -120 },
      properties: { signals: "Latency, availability, lag, conflict rate" },
    },
  ],
  connections: [
    {
      id: "client-edge",
      source: "client",
      target: "edge",
      type: "http",
      label: "HTTPS / WebSocket",
      description: "Open documents, edit content, and maintain a live session.",
    },
    {
      id: "edge-gateway",
      source: "edge",
      target: "gateway",
      type: "http",
      label: "Route",
      description:
        "Forward REST requests and upgraded collaboration connections.",
    },
    {
      id: "gateway-collaboration",
      source: "gateway",
      target: "collaboration-service",
      type: "websocket",
      label: "API / WS",
      description:
        "Authenticate the user and route document operations to the session service.",
    },
    {
      id: "collaboration-presence",
      source: "collaboration-service",
      target: "presence-store",
      type: "data-flow",
      label: "Heartbeat",
      description: "Refresh cursors and active-session state with a short TTL.",
      properties: {
        sourceHandle: "top",
        targetHandle: "left",
        labelPosition: "target",
      },
    },
    {
      id: "collaboration-cache",
      source: "collaboration-service",
      target: "document-cache",
      type: "data-flow",
      label: "Read snapshot",
      description:
        "Load the newest cached document snapshot for an open request.",
    },
    {
      id: "cache-document-store",
      source: "document-cache",
      target: "document-store",
      type: "database-connection",
      label: "Cache miss",
      description:
        "Fetch the materialized document and ACLs when the cache is stale or empty.",
    },
    {
      id: "collaboration-log",
      source: "collaboration-service",
      target: "operation-log",
      type: "database-connection",
      label: "Append op",
      description:
        "Persist an accepted, idempotent operation with a per-document sequence.",
      properties: {
        sourceHandle: "bottom",
        targetHandle: "top",
        labelPosition: "target",
      },
    },
    {
      id: "collaboration-document-store",
      source: "collaboration-service",
      target: "document-store",
      type: "database-connection",
      label: "Metadata / ACL",
      description:
        "Read permissions and update document metadata in the transactional store.",
      properties: {
        sourceHandle: "top",
        targetHandle: "top",
        labelPosition: "target",
      },
    },
    {
      id: "collaboration-events",
      source: "collaboration-service",
      target: "change-events",
      type: "message-queue",
      label: "Change event",
      description:
        "Publish accepted operations without delaying the edit acknowledgement.",
      properties: {
        sourceHandle: "bottom",
        targetHandle: "left",
        labelPosition: "target",
      },
    },
    {
      id: "events-snapshot",
      source: "change-events",
      target: "snapshot-worker",
      type: "event-stream",
      label: "Snapshot work",
      description:
        "Consume ordered operations and compact them into revision checkpoints.",
      properties: { labelPosition: "target" },
    },
    {
      id: "snapshot-version-store",
      source: "snapshot-worker",
      target: "version-store",
      type: "data-flow",
      label: "Write revision",
      description:
        "Store compressed immutable snapshots and large document artifacts.",
    },
    {
      id: "events-search",
      source: "change-events",
      target: "search-worker",
      type: "event-stream",
      label: "Index work", 
      description: "Extract searchable text from the newest document state.",
      properties: {
        sourceHandle: "bottom",
        targetHandle: "left",
        labelPosition: "target",
      },
    },
    {
      id: "search-worker-index",
      source: "search-worker",
      target: "search-index",
      type: "data-flow",
      label: "Upsert",
      description:
        "Write a versioned search document with tenant and ACL filters.",
    },
    {
      id: "collaboration-notifications",
      source: "collaboration-service",
      target: "notification-service",
      type: "event-stream",
      label: "Share event",
      description:
        "Notify recipients asynchronously after a share or mention is accepted.",
      properties: {
        sourceHandle: "top",
        targetHandle: "bottom",
        labelPosition: "target",
        labelOffset: 0.9,
      },
    },
    {
      id: "collaboration-monitoring",
      source: "collaboration-service",
      target: "monitoring",
      type: "event-stream",
      label: "Telemetry",
      description:
        "Emit session, latency, conflict, and authorization signals.",
      properties: {
        sourceHandle: "top",
        targetHandle: "bottom",
        labelPosition: "target",
        labelOffset: 0.92,
      },
    },
  ],
};

const documentManagementGuide: ProblemGuide = {
  prompt: {
    brief:
      "Design a collaborative document platform where many users can edit rich documents together, recover from disconnects, search content, and safely restore earlier versions.",
    successSignals: [
      "Separate the low-latency collaboration path from snapshots, search, notifications, and other asynchronous work.",
      "Choose and explain an OT or CRDT conflict strategy, including ordering, deduplication, reconnect, and offline edits.",
      "Model document ownership, folder hierarchy, sharing, and permission revocation as first-class behavior.",
      "Define how the system stores an operation history, materialized snapshots, immutable versions, and large attachments.",
    ],
  },
  requirements: {
    functional: [
      "Create, edit, archive, and delete rich-text or markdown documents.",
      "Support multiple users editing the same document in real time with cursor and presence indicators.",
      "Keep version history and allow an authorized user to restore a previous revision without losing auditability.",
      "Organize documents in workspaces and nested folders with move and rename operations.",
      "Share documents with users, groups, or links and enforce viewer, commenter, and editor permissions.",
      "Search document titles and content while restricting results to documents the requester can access.",
      "Upload and retrieve large attachments without routing their bytes through the collaboration service.",
    ],
    nonFunctional: [
      "Acknowledge an accepted edit within 150 ms at p95 for an active session in the same region.",
      "Deliver an accepted edit to other active collaborators within 250 ms at p95 under normal load.",
      "Never lose an acknowledged operation; reconnecting clients must be able to resume from a known sequence.",
      "Keep document opens below 300 ms at p95 for warm snapshots and make search eventually consistent.",
      "Target 99.9% monthly availability for document reads and collaboration sessions, with graceful reconnect behavior.",
      "Apply authorization on every document read, edit, share, export, and attachment access—not only at connection time.",
    ],
    scaleAssumptions: [
      "10 million registered users, 1 million daily active users, and 100,000 peak concurrent editing sessions.",
      "50 million documents with an average current text state of 30 KB; attachments are stored separately and can be much larger.",
      "About 50 million document opens per day and 20 million edit operations per day, with a 10x peak-over-average factor for hot workspaces.",
      "An active document has three editors on average; a small number of shared documents can attract thousands of viewers.",
      "The service is multi-region for reads and sessions, while each document has a single ordering authority at a time.",
    ],
    metrics: [
      {
        label: "Peak edit rate",
        value: "~2.3K ops/s",
        description:
          "20 million daily operations average to about 230 ops/s; a 10x burst drives the collaboration tier and queue sizing.",
      },
      {
        label: "Peak document opens",
        value: "~5.8K req/s",
        description:
          "50 million opens per day average to about 580 req/s; cache and read replicas absorb workspace bursts.",
      },
      {
        label: "Concurrent connections",
        value: "100K sessions",
        description:
          "Long-lived WebSocket connections are tracked independently from request-per-second capacity.",
      },
      {
        label: "Current text state",
        value: "~1.5 TB",
        description:
          "50 million documents times 30 KB of current content, before indexes, replicas, versions, and attachments.",
      },
    ],
  },
  entities: [
    {
      name: "Document",
      fields: [
        "document_id",
        "workspace_id",
        "parent_id",
        "title",
        "current_snapshot_id",
        "current_sequence",
        "status",
        "created_by",
        "updated_at",
      ],
      notes:
        "Keep the current materialized state and a monotonic sequence for fast opens; use the operation log and immutable versions for history and replay.",
    },
    {
      name: "DocumentOperation",
      fields: [
        "operation_id",
        "document_id",
        "client_id",
        "base_sequence",
        "operation_payload",
        "assigned_sequence",
        "actor_id",
        "created_at",
      ],
      notes:
        "The operation ID makes retries idempotent. Partition by document and retain enough history for reconnect and audit requirements.",
    },
    {
      name: "DocumentVersion",
      fields: [
        "version_id",
        "document_id",
        "sequence_start",
        "sequence_end",
        "snapshot_uri",
        "created_by",
        "created_at",
        "restore_source_version",
      ],
      notes:
        "Immutable checkpoints make history and restore predictable; a restore creates a new head rather than deleting later versions.",
    },
    {
      name: "PermissionGrant",
      fields: [
        "document_id",
        "principal_id",
        "principal_type",
        "role",
        "inherited_from",
        "expires_at",
        "revoked_at",
      ],
      notes:
        "Resolve workspace, folder, direct, group, and link permissions into an authorization decision that can be invalidated on revocation.",
    },
    {
      name: "PresenceSession",
      fields: [
        "document_id",
        "user_id",
        "connection_id",
        "cursor_position",
        "last_heartbeat",
        "client_version",
      ],
      notes:
        "Presence is ephemeral state with TTLs. It should disappear after a disconnect and never be required to reconstruct document content.",
    },
    {
      name: "FolderEntry",
      fields: [
        "workspace_id",
        "parent_id",
        "child_id",
        "display_name",
        "sort_key",
        "created_at",
      ],
      notes:
        "Use a stable parent-child index for listing and moving documents; guard against cycles and enforce workspace boundaries.",
    },
  ],
  apis: [
    {
      method: "POST",
      path: "/v1/workspaces/{workspaceId}/documents",
      contract:
        "{ title, parentId?, format, initialContent? } -> { documentId, currentSequence }",
      notes:
        "Authorize workspace membership, validate content size and parent ownership, and make retries safe with an idempotency key.",
    },
    {
      method: "GET",
      path: "/v1/documents/{documentId}",
      contract:
        "{ cursor? } -> { snapshot, currentSequence, permissions, activeEditors }",
      notes:
        "Check ACLs before serving a versioned snapshot, then return a sequence cursor so the client can request missed operations.",
    },
    {
      method: "GET",
      path: "/v1/documents/{documentId}/collaborate",
      contract:
        "WebSocket upgrade with { clientId, lastSeenSequence } -> ack, operation, presence, and resync messages",
      notes:
        "Authenticate during upgrade, cap message size, deduplicate operation IDs, preserve per-document ordering, and close or downgrade stale clients.",
    },
    {
      method: "GET",
      path: "/v1/documents/{documentId}/versions?cursor=...",
      contract:
        "Paginated immutable versions with author, time, sequence range, and preview metadata",
      notes:
        "Apply the same read permission check as the document itself; version metadata can be indexed separately from snapshot bytes.",
    },
    {
      method: "POST",
      path: "/v1/documents/{documentId}/restore",
      contract:
        "{ versionId, idempotencyKey } -> { newVersionId, currentSequence }",
      notes:
        "Create a new head from the selected version, append an auditable restore operation, and broadcast the new state to active sessions.",
    },
    {
      method: "GET",
      path: "/v1/search?q=...&workspaceId=...",
      contract:
        "Ranked document hits with title, snippet, version, and permission-safe metadata",
      notes:
        "Filter by tenant and effective ACL fields in the index, then recheck authorization before returning sensitive snippets.",
    },
  ],
  dataFlow: [
    {
      title: "Open a document",
      description:
        "The client authenticates, the gateway authorizes the workspace and document, and the collaboration service loads a versioned snapshot plus its current sequence from cache or durable storage.",
    },
    {
      title: "Join the collaboration session",
      description:
        "The client upgrades to a WebSocket, sends its client ID and last acknowledged sequence, then receives missed operations before live presence and broadcasts begin.",
    },
    {
      title: "Accept and fan out an edit",
      description:
        "The service validates the operation against the caller's role, deduplicates retries, assigns the next per-document sequence, appends it durably, acknowledges the sender, and broadcasts the canonical operation.",
    },
    {
      title: "Buffer asynchronous work",
      description:
        "After the durable append, publish a change event for snapshots, search, notifications, and analytics. Queue lag must not block the active editing session.",
    },
    {
      title: "Compact versions",
      description:
        "Snapshot workers fold a bounded operation range into a compressed immutable revision and update the materialized current document so future opens do not replay the entire history.",
    },
    {
      title: "Recover from disconnects",
      description:
        "A reconnecting client presents its last acknowledged sequence; the service replays retained operations or sends a newer snapshot plus a delta, then resumes live delivery without duplicating edits.",
    },
  ],
  architecture: documentManagementArchitecture,
  deepDives: [
    {
      title: "Concurrency control: OT, CRDT, and ordering",
      points: [
        "Choose an operation-based CRDT when offline edits and peer-independent merging matter; choose OT when the editor has a centralized transform pipeline and simpler payloads are more important.",
        "Even with CRDT semantics, assign a canonical per-document sequence so acknowledgements, replay, snapshots, and audit logs have a stable order.",
        "Every operation needs a client-generated ID, base or causal metadata, a bounded payload, and an idempotent append path so retries cannot duplicate text changes.",
        "Presence and cursor updates should be lossy and ephemeral; document operations are durable and must be replayable.",
      ],
    },
    {
      title: "Durability, snapshots, and restore",
      points: [
        "Treat the append-only operation log as the recovery boundary for acknowledged edits and the materialized document as a performance optimization.",
        "Create snapshots every fixed operation count or time interval, cap replay work, and compact old operations only after retention and audit requirements are satisfied.",
        "A restore should append a new head that references the source version. Never delete the intervening history just because the visible content moved backward.",
        "Use immutable compressed objects for large revisions and keep transactional metadata—ownership, sequence pointers, and ACLs—in the document store.",
      ],
    },
    {
      title: "Permissions and revocation",
      points: [
        "Resolve direct, group, inherited folder, workspace, and link permissions before an operation is accepted; read and export paths need the same policy enforcement.",
        "Cache authorization decisions with short TTLs and explicit invalidation on share changes. A permission revocation must close or downgrade active sessions quickly.",
        "Do not rely on search-index filtering alone. Recheck authorization before returning a document, version, attachment, or snippet that may have become stale.",
        "Keep audit events for share, restore, export, and deletion actions separate from user-visible document content.",
      ],
    },
    {
      title: "Search and large documents",
      points: [
        "Index asynchronously from the canonical change stream and store the document version in each index record so stale updates cannot overwrite newer content.",
        "Use tenant and ACL fields in the index to narrow candidates, then perform a final authorization check for sensitive workspaces or rapidly changing permissions.",
        "For very large documents, paginate blocks or sections, load only the visible range, and keep attachments in object storage with short-lived signed URLs.",
        "Expose index freshness and queue lag so product behavior can explain why a just-typed phrase is not searchable immediately.",
      ],
    },
    {
      title: "Connection scale and failure recovery",
      points: [
        "Shard collaboration workers by document ID and keep connection ownership separate from durable storage; a session can move when a worker fails.",
        "Use heartbeats, backpressure, per-session operation limits, and a reconnect token containing the last acknowledged sequence.",
        "If the queue or search tier is degraded, keep acknowledged edits and active fan-out working while reporting stale search or delayed notifications.",
        "Measure acknowledgement latency, broadcast lag, reconnect success, replay depth, conflict rate, snapshot age, permission failures, and queue lag.",
      ],
    },
  ],
  tradeoffs: [
    {
      title: "CRDT vs OT",
      recommendation:
        "Use a well-scoped operation-based CRDT when offline editing and multi-device merges are core requirements; use OT when a centralized editor pipeline and smaller operations simplify the product.",
      caution:
        "CRDT metadata and garbage collection can grow substantially. OT requires careful transform rules and a reliable server ordering path.",
    },
    {
      title: "Every operation vs periodic snapshots",
      recommendation:
        "Durably append every accepted operation, then create periodic compressed snapshots for bounded replay and fast opens.",
      caution:
        "Snapshotting every keystroke increases write amplification; snapshotting too rarely makes reconnects, restores, and audits expensive.",
    },
    {
      title: "Relational metadata vs document database",
      recommendation:
        "Keep workspaces, folders, ACLs, and document pointers in a transactional relational model while storing large snapshots and attachments as immutable objects.",
      caution:
        "A single database may need partitioning as tenants grow. A document database can simplify content reads but does not remove ACL, uniqueness, or transaction concerns.",
    },
    {
      title: "Synchronous vs asynchronous search",
      recommendation:
        "Index after the durable document change and expose freshness metadata; keep the edit path independent from search availability.",
      caution:
        "Users may not find a just-created or just-edited document immediately, so the UI needs a clear eventual-consistency expectation.",
    },
  ],
  commonMistakes: [
    "Broadcasting client edits before the operation is durably accepted or without an idempotency key.",
    "Using a single mutable document blob as the only source of truth, making history, conflict recovery, and auditability fragile.",
    "Treating cursor presence as durable content or allowing stale presence to block a document session.",
    "Checking permissions only when a WebSocket opens and allowing a revoked editor to keep sending operations.",
    "Putting full-text indexing, email notifications, or attachment bytes on the edit acknowledgement path.",
    "Ignoring reconnect cursors, queue replay, large-document limits, tenant isolation, and cycle detection in folder moves.",
  ],
  followUps: [
    {
      question:
        "How would offline editing work for a user who reconnects after a day?",
      answer:
        "Keep a durable local operation queue with client IDs and causal metadata, retain enough server history or a checkpoint to compare against the last known sequence, merge with the chosen CRDT or transform pipeline, and require authorization again before applying the offline batch.",
    },
    {
      question: "What if one public document has thousands of viewers?",
      answer:
        "Separate viewers from editors, fan out a compact snapshot or block delta through a read-optimized channel, coalesce bursts, and cap per-document broadcast work so one hot document cannot starve other sessions.",
    },
    {
      question: "What happens when an editor loses permission while connected?",
      answer:
        "Publish an ACL invalidation, close or downgrade the session, reject any in-flight operation that no longer passes authorization, and invalidate cached permission decisions and signed attachment URLs.",
    },
    {
      question: "How would you support comments and mentions?",
      answer:
        "Model comments as anchored, permission-checked entities referencing a document version or block, emit comment and mention events through the same durable change stream, and deliver notifications asynchronously.",
    },
    {
      question: "How would you support data residency or hard deletion?",
      answer:
        "Assign a region and deletion policy at the workspace level, route sessions and object writes accordingly, record a deletion tombstone, remove searchable and cached copies, and run verified object-store erasure workflows with an audit trail.",
    },
  ],
  rubric: [
    {
      criterion: "Core collaboration path",
      description:
        "Separates WebSocket session handling, operation validation, durable acknowledgement, canonical ordering, and live fan-out from slower background work.",
    },
    {
      criterion: "Consistency and recovery",
      description:
        "Explains OT or CRDT behavior, deduplication, sequence cursors, reconnect replay, snapshots, and the failure boundary for acknowledged edits.",
    },
    {
      criterion: "Data and permissions",
      description:
        "Models documents, operations, versions, folders, presence, and ACLs around real access patterns and handles revocation on active sessions.",
    },
    {
      criterion: "Scale and reliability",
      description:
        "Uses explicit traffic and storage assumptions, shards connections by document, bounds replay, handles hot documents, and monitors queue/index lag.",
    },
    {
      criterion: "Product judgment",
      description:
        "Covers search freshness, restore semantics, attachments, offline edits, deletion, tenant isolation, and graceful degradation when optional services fail.",
    },
  ],
};

const PROBLEM_GUIDES: Record<string, ProblemGuide> = {
  "url-shortener": urlShortenerGuide,
  "document-management-system": documentManagementGuide,
};

export const getProblemGuide = (slug: string): ProblemGuide | null =>
  PROBLEM_GUIDES[slug] ?? null;

export const getGuideArchitecture = (slug: string): GuideArchitecture | null =>
  getProblemGuide(slug)?.architecture ?? null;

export {
  documentManagementArchitecture,
  documentManagementGuide,
  urlShortenerArchitecture,
  urlShortenerGuide,
};
