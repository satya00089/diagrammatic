import { sortComponentsByUsage } from "../config/components";
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

const jobSchedulerArchitecture: GuideArchitecture = {
  title: "Distributed job scheduler reference architecture",
  summary:
    "A durable schedule store feeds a partitioned dispatcher, which claims due work and hands it to queues so execution remains reliable under retries and worker churn.",
  layers: [
    {
      id: "control-plane",
      label: "Control plane",
      description: "Clients create, inspect, pause, and change schedules.",
      componentIds: [
        "scheduler-client",
        "scheduler-gateway",
        "schedule-service",
      ],
    },
    {
      id: "dispatch-plane",
      label: "Dispatch plane",
      description:
        "Due schedules are discovered, claimed, and converted into durable execution messages.",
      componentIds: [
        "schedule-store",
        "time-index",
        "dispatcher",
        "execution-queue",
      ],
    },
    {
      id: "execution-plane",
      label: "Execution plane",
      description:
        "Workers execute jobs with leases, retries, and result recording.",
      componentIds: [
        "worker-pool",
        "execution-store",
        "event-stream",
        "observability",
      ],
    },
  ],
  keyPaths: [
    {
      id: "schedule-path",
      label: "Schedule path",
      description:
        "Create or update a schedule and atomically maintain its next-run index.",
      componentIds: [
        "scheduler-client",
        "scheduler-gateway",
        "schedule-service",
        "schedule-store",
        "time-index",
      ],
    },
    {
      id: "dispatch-path",
      label: "Dispatch path",
      description:
        "Partition owners claim due entries and enqueue execution attempts.",
      componentIds: [
        "time-index",
        "dispatcher",
        "execution-queue",
        "worker-pool",
      ],
    },
    {
      id: "retry-path",
      label: "Retry and recovery path",
      description:
        "Failed attempts are rescheduled with backoff or moved to a dead-letter queue for inspection.",
      componentIds: [
        "worker-pool",
        "execution-store",
        "event-stream",
        "observability",
      ],
    },
  ],
  components: [
    {
      id: "scheduler-client",
      type: "client",
      componentId: "web-app",
      label: "Clients",
      description:
        "Applications and operators that create schedules and inspect execution history.",
      position: { x: 0, y: 260 },
      properties: { operations: "Create, pause, resume, query" },
    },
    {
      id: "scheduler-gateway",
      type: "api-gateway",
      componentId: "api-gateway",
      label: "API Gateway",
      description:
        "Authenticates tenants, validates payloads, and applies quotas and idempotency keys.",
      position: { x: 480, y: 260 },
      properties: { protection: "Auth, rate limits, tenant isolation" },
    },
    {
      id: "schedule-service",
      type: "application-server",
      componentId: "backend-server",
      label: "Schedule Service",
      description:
        "Owns schedule lifecycle, computes next-run timestamps, and enforces optimistic versioning.",
      position: { x: 960, y: 260 },
      properties: { consistency: "Idempotent writes and version checks" },
    },
    {
      id: "schedule-store",
      type: "database",
      componentId: "database",
      label: "Schedule Store",
      description:
        "Durable source of truth for schedules, policies, ownership, and lifecycle state.",
      position: { x: 1440, y: 120 },
      properties: { accessPattern: "Tenant and schedule ID; status updates" },
    },
    {
      id: "time-index",
      type: "database",
      componentId: "database",
      label: "Due-Time Index",
      description:
        "Sharded index ordered by next-run time so dispatchers can scan bounded windows.",
      position: { x: 1440, y: 400 },
      properties: { sharding: "Time bucket plus hash shard" },
    },
    {
      id: "dispatcher",
      type: "microservice",
      componentId: "processing-worker",
      label: "Dispatcher Fleet",
      description:
        "Leases partitions, claims due schedules, and creates one execution message per run.",
      position: { x: 1920, y: 400 },
      properties: { coordination: "Lease renewal and fencing tokens" },
    },
    {
      id: "execution-queue",
      type: "queue",
      componentId: "queue",
      label: "Execution Queue",
      description:
        "Durably buffers runnable attempts and isolates schedule spikes from worker capacity.",
      position: { x: 2400, y: 400 },
      properties: { delivery: "At least once with visibility timeout" },
    },
    {
      id: "worker-pool",
      type: "microservice",
      componentId: "backend-server",
      label: "Worker Pool",
      description:
        "Executes jobs within tenant limits, renews leases, and reports success or failure.",
      position: { x: 2880, y: 400 },
      properties: { isolation: "Per-tenant concurrency and timeout limits" },
    },
    {
      id: "execution-store",
      type: "database",
      componentId: "database",
      label: "Execution Store",
      description:
        "Records attempts, idempotency keys, outcomes, retry state, and dead-letter references.",
      position: { x: 3360, y: 180 },
      properties: { retention: "Hot history plus archived results" },
    },
    {
      id: "event-stream",
      type: "queue",
      componentId: "queue",
      label: "Events and DLQ",
      description:
        "Publishes lifecycle events and retains poison messages for operator replay.",
      position: { x: 3360, y: 620 },
      properties: { events: "Succeeded, failed, retried, skipped" },
    },
    {
      id: "observability",
      type: "monitoring",
      componentId: "monitoring",
      label: "Observability",
      description:
        "Tracks lateness, queue depth, retries, worker saturation, and missed-run alerts.",
      position: { x: 3360, y: 400 },
      properties: { SLOs: "Dispatch lateness, completion rate, recovery time" },
    },
  ],
  connections: [
    {
      id: "client-gateway",
      source: "scheduler-client",
      target: "scheduler-gateway",
      type: "http",
      label: "HTTPS",
      description: "Submit schedule commands and queries.",
    },
    {
      id: "gateway-service",
      source: "scheduler-gateway",
      target: "schedule-service",
      type: "api-call",
      label: "API",
      description: "Authenticate and route tenant operations.",
    },
    {
      id: "service-store",
      source: "schedule-service",
      target: "schedule-store",
      type: "database-connection",
      label: "Persist",
      description: "Store the schedule and lifecycle state.",
    },
    {
      id: "service-index",
      source: "schedule-service",
      target: "time-index",
      type: "database-connection",
      label: "Next run",
      description: "Maintain the due-time index with the schedule version.",
    },
    {
      id: "index-dispatcher",
      source: "time-index",
      target: "dispatcher",
      type: "data-flow",
      label: "Due work",
      description: "Read bounded time buckets for dispatch.",
    },
    {
      id: "dispatcher-queue",
      source: "dispatcher",
      target: "execution-queue",
      type: "message-queue",
      label: "Enqueue",
      description: "Publish an idempotent execution attempt.",
    },
    {
      id: "queue-worker",
      source: "execution-queue",
      target: "worker-pool",
      type: "message-queue",
      label: "Consume",
      description: "Deliver work with a visibility timeout.",
    },
    {
      id: "worker-execution",
      source: "worker-pool",
      target: "execution-store",
      type: "database-connection",
      label: "Record",
      description: "Persist attempt outcome and retry state.",
    },
    {
      id: "worker-events",
      source: "worker-pool",
      target: "event-stream",
      type: "event-stream",
      label: "Events",
      description: "Publish lifecycle events and dead-letter failures.",
    },
    {
      id: "dispatcher-monitoring",
      source: "dispatcher",
      target: "observability",
      type: "event-stream",
      label: "Lateness",
      description: "Report dispatch lag and partition health.",
      properties: {
        sourceHandle: "bottom",
        targetHandle: "bottom",
        labelPosition: "target",
        labelOffset: 0.35,
      },
    },
    {
      id: "worker-monitoring",
      source: "worker-pool",
      target: "observability",
      type: "event-stream",
      label: "Health",
      description: "Report execution latency, failures, and saturation.",
      properties: {
        labelPosition: "target",
        labelOffset: 0.45,
      },
    },
  ],
};

const jobSchedulerGuide: ProblemGuide = {
  prompt: {
    brief:
      "Design a multi-tenant job scheduling service that runs one-time and recurring jobs reliably, even when schedules spike, workers fail, or a dispatcher is restarted.",
    successSignals: [
      "Separate schedule management, due-work detection, dispatch, and execution.",
      "Explain timing semantics, duplicate delivery, retries, time zones, and missed runs.",
      "Use durable state and leases so dispatcher and worker failures recover safely.",
      "Make tenant fairness, backpressure, idempotency, and operational visibility explicit.",
    ],
  },
  requirements: {
    functional: [
      "Create, update, pause, resume, and delete one-time or recurring schedules.",
      "Run HTTP, container, or queue-backed jobs with configurable timeout and retry policy.",
      "Support cron-like expressions, time zones, start/end windows, and misfire policy.",
      "Expose execution history, current state, manual run, cancellation, and dead-letter replay.",
      "Isolate tenants with quotas, concurrency limits, authorization, and audit events.",
    ],
    nonFunctional: [
      "Provide at-least-once execution with a clear idempotency contract; exactly-once side effects are the job owner's responsibility.",
      "Target p99 dispatch lateness below 10 seconds for jobs within the normal capacity envelope.",
      "Survive dispatcher, worker, queue, and storage node failures without silently losing a due job.",
      "Keep schedule writes strongly consistent while allowing dashboards and metrics to be eventually consistent.",
      "Apply backpressure and tenant fairness instead of allowing one customer to exhaust all workers.",
    ],
    scaleAssumptions: [
      "10 million active schedules, with 100 million executions per day.",
      "Average execution rate is about 1.2K jobs/second; peak bursts reach 10K jobs/second.",
      "Most schedules are recurring and produce a small schedule row plus one execution record per run.",
      "Jobs are external work: median runtime is 5 seconds, with a 15-minute maximum lease and timeout.",
    ],
    metrics: [
      {
        label: "Average execution rate",
        value: "~1.2K/s",
        description: "100M daily executions divided across a 24-hour day.",
      },
      {
        label: "Peak dispatch rate",
        value: "~10K/s",
        description:
          "Burst budget for aligned cron boundaries and catch-up work.",
      },
      {
        label: "Active schedules",
        value: "10M",
        description:
          "The due-time index must be sharded; a full-table scan is not viable.",
      },
      {
        label: "Execution history",
        value: "~36.5B/year",
        description:
          "Use retention tiers and archive old records instead of keeping all history hot.",
      },
    ],
  },
  entities: [
    {
      name: "Schedule",
      fields: [
        "schedule_id",
        "tenant_id",
        "kind",
        "expression",
        "time_zone",
        "next_run_at",
        "status",
        "version",
      ],
      notes:
        "The schedule is the source of truth; version changes fence stale dispatchers and update the indexed next-run entry.",
    },
    {
      name: "Execution",
      fields: [
        "execution_id",
        "schedule_id",
        "scheduled_for",
        "attempt",
        "status",
        "lease_until",
        "idempotency_key",
        "started_at",
        "finished_at",
      ],
      notes:
        "One logical run can have multiple attempts. The idempotency key remains stable across retries.",
    },
    {
      name: "RetryPolicy",
      fields: [
        "max_attempts",
        "backoff",
        "jitter",
        "retryable_errors",
        "misfire_policy",
      ],
      notes:
        "Keep policy with the schedule version so a retry is evaluated against the intended configuration.",
    },
    {
      name: "PartitionLease",
      fields: ["partition_id", "owner_id", "fencing_token", "lease_until"],
      notes:
        "Short leases and fencing tokens prevent two dispatcher instances from owning a partition after a pause or network split.",
    },
  ],
  apis: [
    {
      method: "POST",
      path: "/v1/schedules",
      contract:
        "{ job, trigger, retryPolicy, concurrencyPolicy } -> { scheduleId, nextRunAt }",
      notes:
        "Require tenant authorization and an idempotency key; validate time zone and cron expression before the atomic write.",
    },
    {
      method: "PATCH",
      path: "/v1/schedules/{scheduleId}",
      contract: "{ status?, trigger?, retryPolicy? } -> updated schedule",
      notes:
        "Use an expected version to avoid lost updates and atomically move the due-time index.",
    },
    {
      method: "GET",
      path: "/v1/schedules/{scheduleId}/executions",
      contract: "Paginated execution attempts and outcomes",
      notes:
        "Read from an execution index; do not scan the scheduler's hot due-time partitions.",
    },
    {
      method: "POST",
      path: "/v1/schedules/{scheduleId}/runs",
      contract: "{ scheduledFor? } -> { executionId }",
      notes:
        "Manual runs share the normal queue and idempotency path, but are marked as operator-triggered.",
    },
  ],
  dataFlow: [
    {
      title: "Persist the schedule",
      description:
        "Validate the trigger, authorize the tenant, calculate the first next-run timestamp, and write the schedule plus its due-time index entry in one conditional operation.",
    },
    {
      title: "Claim due work",
      description:
        "A dispatcher owns a leased shard, reads a bounded time window, and conditionally claims each due schedule using its version and a run identity.",
    },
    {
      title: "Enqueue an execution",
      description:
        "Create an execution record and publish a durable message. A transactional outbox or idempotent publisher closes the gap between the database write and queue publish.",
    },
    {
      title: "Execute with a lease",
      description:
        "A fair worker consumes the message, acquires or renews the execution lease, invokes the target, and records success or a retryable failure.",
    },
    {
      title: "Advance or recover",
      description:
        "On success, compute the next occurrence. On failure, apply backoff and jitter; after the retry budget, move the execution to a dead-letter state and alert the tenant.",
    },
  ],
  architecture: jobSchedulerArchitecture,
  deepDives: [
    {
      title: "Finding due schedules",
      points: [
        "Index by time buckets and hash shards so dispatchers read only a narrow window.",
        "Use a lease per partition with fencing tokens; a lock alone is unsafe during pauses and network partitions.",
        "Allow a small look-ahead window and recheck schedule version and status before enqueueing.",
      ],
    },
    {
      title: "At-least-once execution",
      points: [
        "A worker can finish a side effect and crash before acknowledging the queue, so duplicates are unavoidable.",
        "Pass a stable execution idempotency key to the job and require downstream writes to deduplicate it.",
        "Record attempt state with conditional transitions so late acknowledgements cannot overwrite a newer retry.",
      ],
    },
    {
      title: "Recurring schedules and misfires",
      points: [
        "Store the schedule's time zone and compute occurrences with a tested library; never treat local time as UTC implicitly.",
        "Define skip, run-once, or catch-up behavior when a schedule is paused or the system is down.",
        "Bound catch-up work to protect the queue and expose skipped occurrences as observable state.",
      ],
    },
    {
      title: "Fairness and backpressure",
      points: [
        "Partition queue capacity by tenant or weighted fair scheduling so a noisy customer cannot starve others.",
        "Enforce per-tenant concurrency and global admission limits before invoking external jobs.",
        "Scale workers from queue age and lateness, not only queue depth, because long jobs hide waiting time.",
      ],
    },
  ],
  tradeoffs: [
    {
      title: "Polling vs timing wheel",
      recommendation:
        "Start with sharded time buckets and bounded polling; introduce a timing wheel when sub-second precision or very high schedule density justifies it.",
      caution:
        "A timing wheel reduces scans but adds complexity around persistence, recovery, and long-duration timers.",
    },
    {
      title: "Queue-first vs database-first dispatch",
      recommendation:
        "Create an execution record before publishing and use an outbox or reconciliation worker to guarantee eventual publication.",
      caution:
        "Queue-first is simpler to scale but can lose the durable record needed for audit and deduplication.",
    },
    {
      title: "Exactly-once vs at-least-once",
      recommendation:
        "Promise at-least-once delivery and make idempotency explicit at the execution boundary.",
      caution:
        "Exactly-once claims usually hide an external side-effect boundary that the scheduler cannot atomically control.",
    },
  ],
  commonMistakes: [
    "Using one global lock or scanning every schedule each second.",
    "Claiming a schedule without fencing stale dispatcher instances.",
    "Assuming queue acknowledgement means the external job side effect happened exactly once.",
    "Ignoring daylight-saving transitions, missed runs, and bounded catch-up.",
    "Letting retries bypass tenant concurrency limits or overwhelm a downstream service.",
  ],
  followUps: [
    {
      question:
        "How do you recover after a dispatcher is down for ten minutes?",
      answer:
        "A new owner acquires the partition lease, scans from the last durable watermark, applies the schedule's misfire policy, and publishes bounded catch-up work while reporting lateness.",
    },
    {
      question: "How would you support millions of jobs at the same timestamp?",
      answer:
        "Hash schedules across many time-bucket shards, spread enqueue work with jitter where semantics allow it, and apply tenant and global admission limits.",
    },
    {
      question: "How do you cancel a running job?",
      answer:
        "Mark the execution cancelled with a conditional update, send a cancellation signal when the worker supports it, and fence late completion updates; forceful termination remains target-specific.",
    },
    {
      question: "What must be monitored?",
      answer:
        "Track dispatch lateness, due-item age, queue age, lease expirations, retry rate, dead letters, per-tenant saturation, and the gap between persisted executions and published messages.",
    },
  ],
  rubric: [
    {
      criterion: "Core scheduling path",
      description:
        "Separates schedule lifecycle, due-time discovery, durable dispatch, and worker execution with a readable critical path.",
    },
    {
      criterion: "Reliability semantics",
      description:
        "Explains leases, fencing, retries, idempotency, duplicate delivery, outbox recovery, and failure transitions.",
    },
    {
      criterion: "Scale and fairness",
      description:
        "Uses explicit capacity assumptions, sharded indexes, bounded scans, backpressure, and tenant-aware concurrency.",
    },
    {
      criterion: "Time and product behavior",
      description:
        "Covers time zones, recurring rules, misfires, catch-up, cancellation, manual runs, and retention.",
    },
    {
      criterion: "Operations",
      description:
        "Defines lateness and completion SLOs plus metrics and operator workflows for dead letters and stuck leases.",
    },
  ],
};

const partsCompatibilityArchitecture: GuideArchitecture = {
  title: "Parts compatibility reference architecture",
  summary:
    "A normalized fitment model is published into a versioned read index, while checkout revalidates the selected part against the buyer's vehicle or product context.",
  layers: [
    {
      id: "experience",
      label: "Shopping experience",
      description:
        "Clients collect compatibility context and explain fitment results.",
      componentIds: ["parts-client", "parts-gateway", "compatibility-service"],
    },
    {
      id: "serving",
      label: "Compatibility serving",
      description:
        "A cache and query index answer high-volume fitment checks without scanning catalog data.",
      componentIds: ["fitment-cache", "fitment-index", "catalog-store"],
    },
    {
      id: "publishing",
      label: "Data publishing",
      description:
        "Catalog changes are validated, versioned, and propagated asynchronously with replayable events.",
      componentIds: [
        "catalog-admin",
        "catalog-events",
        "index-worker",
        "observability",
      ],
    },
  ],
  keyPaths: [
    {
      id: "fitment-path",
      label: "Fitment lookup",
      description:
        "The shopper's normalized context is checked against cache and then a purpose-built fitment index.",
      componentIds: [
        "parts-client",
        "parts-gateway",
        "compatibility-service",
        "fitment-cache",
        "fitment-index",
      ],
    },
    {
      id: "publication-path",
      label: "Catalog publication",
      description:
        "Approved catalog edits become versioned events and are indexed away from the shopper request path.",
      componentIds: [
        "catalog-admin",
        "catalog-store",
        "catalog-events",
        "index-worker",
        "fitment-index",
      ],
    },
  ],
  components: [
    {
      id: "parts-client",
      type: "client",
      componentId: "web-app",
      label: "Shopper UI",
      description:
        "Product pages, fitment selectors, cart, and checkout collect a vehicle or product identity.",
      position: { x: 0, y: 260 },
      properties: {
        context: "Year, make, model, trim, or device/product identifiers",
      },
    },
    {
      id: "parts-gateway",
      type: "api-gateway",
      componentId: "api-gateway",
      label: "API Gateway",
      description:
        "Authenticates users, validates bounded query inputs, and applies rate limits.",
      position: { x: 480, y: 260 },
      properties: { protection: "Validation, auth, quotas" },
    },
    {
      id: "compatibility-service",
      type: "application-server",
      componentId: "backend-server",
      label: "Compatibility Service",
      description:
        "Normalizes context, evaluates fitment rules, and returns an explainable result with a data version.",
      position: { x: 960, y: 260 },
      properties: { consistency: "Read version and checkout revalidation" },
    },
    {
      id: "fitment-cache",
      type: "cache",
      componentId: "cache",
      label: "Fitment Cache",
      description:
        "Caches immutable or version-keyed answers for popular product/context pairs.",
      position: { x: 1920, y: 100 },
      properties: {
        key: "productId:contextId:catalogVersion",
        invalidation: "Versioned keys",
      },
    },
    {
      id: "fitment-index",
      type: "search-engine",
      componentId: "search-engine",
      label: "Fitment Query Index",
      description:
        "Indexes normalized product-to-context relations for fast filtering and faceting.",
      position: { x: 1920, y: 260 },
      properties: { accessPattern: "Context plus product/category filters" },
    },
    {
      id: "catalog-store",
      type: "database",
      componentId: "database",
      label: "Catalog and Fitment Store",
      description:
        "Durable source of truth for products, aliases, normalized contexts, rules, and publication versions.",
      position: { x: 1440, y: 420 },
      properties: { integrity: "Validated rules and effective-dated versions" },
    },
    {
      id: "catalog-admin",
      type: "client",
      componentId: "admin-console",
      label: "Catalog Operations",
      description:
        "Merchants and operators review, correct, approve, and roll back compatibility data.",
      position: { x: 0, y: 700 },
      properties: { workflow: "Draft, validate, approve, publish" },
    },
    {
      id: "catalog-events",
      type: "queue",
      componentId: "queue",
      label: "Catalog Event Queue",
      description:
        "Durably buffers fitment changes and enables retries, replay, and dead-letter handling.",
      position: { x: 960, y: 700 },
      properties: { delivery: "At least once" },
    },
    {
      id: "index-worker",
      type: "microservice",
      componentId: "processing-worker",
      label: "Indexing Workers",
      description:
        "Consumes validated changes, rebuilds affected documents, and publishes an index version.",
      position: { x: 1440, y: 700 },
      properties: { safety: "Idempotent upserts and checkpointed batches" },
    },
    {
      id: "observability",
      type: "monitoring",
      componentId: "monitoring",
      label: "Observability",
      description:
        "Tracks lookup latency, stale index age, mismatch reports, queue lag, and publication failures.",
      position: { x: 1920, y: 700 },
      properties: { signals: "Latency, freshness, correctness, errors" },
    },
  ],
  connections: [
    {
      id: "parts-client-gateway",
      source: "parts-client",
      target: "parts-gateway",
      type: "http",
      label: "HTTPS",
      description: "Submit context and product compatibility checks.",
    },
    {
      id: "gateway-service",
      source: "parts-gateway",
      target: "compatibility-service",
      type: "api-call",
      label: "Query",
      description: "Validate and route the compatibility request.",
    },
    {
      id: "service-cache",
      source: "compatibility-service",
      target: "fitment-cache",
      type: "database-connection",
      label: "Cache-aside",
      description: "Read a version-keyed answer before querying the index.",
      properties: {
        sourceHandle: "right-top",
      }
    },
    {
      id: "service-index",
      source: "compatibility-service",
      target: "fitment-index",
      type: "api-call",
      label: "Fitment query",
      description: "Find matching relations and return reasons or exclusions.",
      properties: {
        labelPosition: "target",
        labelOffset: 0.35,
      },
    },
    {
      id: "service-store",
      source: "compatibility-service",
      target: "catalog-store",
      type: "database-connection",
      label: "Fallback / version",
      description:
        "Read authoritative rules or the current publication version when needed.",
      properties: {
        sourceHandle: "right-bottom",
        targetHandle: "left-top",
      },
    },
    {
      id: "admin-store",
      source: "catalog-admin",
      target: "catalog-store",
      type: "database-connection",
      label: "Draft and approve",
      description: "Persist validated catalog edits and approval state.",
    },
    {
      id: "store-events",
      source: "catalog-store",
      target: "catalog-events",
      type: "event-stream",
      label: "Published change",
      description:
        "Emit an outbox-backed event after a catalog change commits.",
    },
    {
      id: "events-worker",
      source: "catalog-events",
      target: "index-worker",
      type: "message-queue",
      label: "Consume",
      description: "Process changes with retries and idempotent checkpoints.",
    },
    {
      id: "worker-index",
      source: "index-worker",
      target: "fitment-index",
      type: "data-flow",
      label: "Upsert version",
      description:
        "Update affected fitment documents and advance the index version.",
      properties: {
        targetHandle: "bottom",
        labelPosition: "target",
        labelOffset: 0.35,
      },
    },
    {
      id: "worker-cache",
      source: "index-worker",
      target: "fitment-cache",
      type: "data-flow",
      label: "Warm / retire",
      description:
        "Warm important keys or retire old versioned entries after publication.",
      properties: {
        sourceHandle: "right-top",
        targetHandle: "left-bottom",
      },
    },
    {
      id: "service-monitoring",
      source: "compatibility-service",
      target: "observability",
      type: "event-stream",
      label: "SLOs and mismatch",
      description:
        "Record latency, errors, stale reads, and user-reported mismatches.",
      properties: {
        sourceHandle: "bottom",
        targetHandle: "bottom",
        labelPosition: "target",
      },
    },
    {
      id: "worker-monitoring",
      source: "index-worker",
      target: "observability",
      type: "event-stream",
      label: "Freshness",
      description: "Report queue lag, rejected rules, and publication age.",
      properties: {
        labelPosition: "target",
        labelOffset: 0.45,
      },
    },
  ],
};

const partsCompatibilityGuide: ProblemGuide = {
  prompt: {
    brief:
      "Design a parts compatibility feature for an e-commerce site so a shopper can identify their vehicle, device, or existing product and confidently determine which catalog items fit before adding them to a cart.",
    successSignals: [
      "Separate catalog data quality and fitment modeling from the low-latency shopper lookup path.",
      "Model aliases, normalized product contexts, positive fitment, exclusions, and effective-dated rules explicitly.",
      "Use a versioned read index and explainable results while revalidating compatibility at cart or checkout.",
      "Handle catalog publication, corrections, stale indexes, merchant workflows, and mismatch feedback asynchronously.",
    ],
  },
  requirements: {
    functional: [
      "Let shoppers select or search for a vehicle, device, or existing product and save that context.",
      "Show compatible, incompatible, and unknown states for a product, with a short reason where possible.",
      "Filter category/search results by compatibility and carry the selected context into cart and checkout.",
      "Let catalog operators import, validate, approve, publish, correct, and roll back fitment data.",
      "Accept mismatch reports and make their source product, context, and catalog version auditable.",
    ],
    nonFunctional: [
      "Return common fitment checks within 150 ms at p95 and keep the shopper path available during indexing outages.",
      "Prevent false-positive compatibility claims; an unknown result must not be presented as guaranteed fit.",
      "Support replayable, idempotent publication with a visible freshness and index-version signal.",
      "Protect tenant/catalog permissions, validate untrusted identifiers, and avoid leaking private merchant data.",
    ],
    scaleAssumptions: [
      "Assume 50 million products and 200 million normalized product-context relationships across markets.",
      "Assume 10 million daily active shoppers, 40 compatibility checks per shopper, and 4,600 average checks/second with 10x peak headroom.",
      "Assume 2 million fitment changes per day, processed in batches; read traffic is roughly 20:1 over writes.",
      "Assume a context is a bounded identifier set such as vehicle year/make/model/trim, not arbitrary free text.",
    ],
    metrics: [
      {
        label: "Peak lookup rate",
        value: "46K checks/s",
        description: "10x headroom over the estimated 4.6K average checks/s.",
      },
      {
        label: "Lookup target",
        value: "150 ms p95",
        description:
          "Includes normalization, cache/index access, and response formatting.",
      },
      {
        label: "Fitment corpus",
        value: "200M relations",
        description:
          "A purpose-built index avoids scanning the transactional catalog.",
      },
      {
        label: "Publication freshness",
        value: "< 5 min",
        description:
          "Target for approved changes to reach the query index under normal load.",
      },
    ],
  },
  entities: [
    {
      name: "CompatibilityContext",
      fields: [
        "context_id",
        "type",
        "canonical_attributes",
        "aliases",
        "market",
        "user_id",
      ],
      notes:
        "Canonicalize equivalent identifiers; keep user-saved contexts separate from the global taxonomy.",
    },
    {
      name: "Product",
      fields: ["product_id", "seller_id", "category", "brand", "sku", "status"],
      notes:
        "The product is the stable join key; SKU and seller data can change without rewriting every fitment query.",
    },
    {
      name: "FitmentRule",
      fields: [
        "product_id",
        "context_id",
        "result",
        "reason_code",
        "effective_from",
        "effective_to",
        "source",
      ],
      notes:
        "Store explicit include/exclude rules and their provenance; exclusions must override broad positive rules.",
    },
    {
      name: "CatalogVersion",
      fields: [
        "version_id",
        "market",
        "state",
        "created_at",
        "published_at",
        "index_checkpoint",
      ],
      notes:
        "A version makes results reproducible and permits blue/green index publication and rollback.",
    },
    {
      name: "MismatchReport",
      fields: [
        "report_id",
        "product_id",
        "context_id",
        "order_id",
        "version_id",
        "status",
      ],
      notes:
        "Keep reports append-only and access-controlled; aggregate them for data-quality operations.",
    },
  ],
  apis: [
    {
      method: "GET",
      path: "/v1/contexts/search?q=2018%20civic",
      contract: "ContextSearchResult[]",
      notes:
        "Normalize and rank aliases; require bounded query length and market scope.",
    },
    {
      method: "POST",
      path: "/v1/compatibility/check",
      contract:
        "{ product_ids[], context_id } -> { results[], catalog_version }",
      notes:
        "Read cache/index, return compatible/incompatible/unknown plus reason codes; never infer unknown as compatible.",
    },
    {
      method: "GET",
      path: "/v1/products?context_id=ctx_123",
      contract: "ProductPage { items, next_cursor, context_id, version }",
      notes:
        "Use cursor pagination and filter in the index; authorize seller visibility before returning products.",
    },
    {
      method: "POST",
      path: "/v1/cart/items",
      contract: "{ product_id, quantity, context_id, compatibility_version }",
      notes:
        "Persist the context and version; synchronously recheck the item before accepting the cart mutation.",
    },
    {
      method: "POST",
      path: "/v1/catalog/imports",
      contract: "{ source_uri, market } -> { import_id, status }",
      notes:
        "Admin-only, idempotent import; validate schema and quarantine ambiguous rows before publication.",
    },
    {
      method: "POST",
      path: "/v1/mismatch-reports",
      contract: "{ product_id, context_id, order_id?, evidence }",
      notes:
        "Rate-limit and redact evidence; enqueue review without blocking the shopper response.",
    },
  ],
  dataFlow: [
    {
      title: "Capture the compatibility context",
      description:
        "The UI accepts a bounded selector or search result, resolves aliases to a canonical context_id, and stores the user's selected context.",
    },
    {
      title: "Check the cache and query index",
      description:
        "The service validates the product and context, checks a version-keyed cache, then queries the fitment index for explicit rules and exclusions.",
    },
    {
      title: "Return an explainable result",
      description:
        "The response distinguishes compatible, incompatible, and unknown; it includes a reason code, catalog version, and freshness metadata.",
    },
    {
      title: "Carry context into cart",
      description:
        "The cart stores context_id and the observed catalog version so the system can explain what was checked and detect changed data.",
    },
    {
      title: "Revalidate before purchase",
      description:
        "Checkout performs a fresh authoritative or current-index check. A changed or unknown result pauses purchase for confirmation rather than silently allowing a mismatch.",
    },
    {
      title: "Publish catalog changes asynchronously",
      description:
        "Approved changes commit to the catalog and outbox, flow through a durable queue, and are idempotently indexed before a new version is promoted.",
    },
    {
      title: "Measure and correct quality",
      description:
        "Mismatch reports, rejected rules, stale-index alerts, and query metrics feed operator workflows without adding work to the user-facing path.",
    },
  ],
  architecture: partsCompatibilityArchitecture,
  deepDives: [
    {
      title: "Fitment modeling and precedence",
      points: [
        "Normalize context dimensions so equivalent representations map to one key.",
        "Represent positive and negative rules explicitly; define precedence for product, model family, trim, and market overrides.",
        "Keep provenance and effective dates so operators can explain and roll back a decision.",
      ],
    },
    {
      title: "Indexing and publication consistency",
      points: [
        "Use an outbox or change log so a committed catalog change cannot be lost before enqueueing.",
        "Build affected documents idempotently, checkpoint batches, and promote a complete index version atomically.",
        "Expose version and age in responses; stale data can be labeled while the system falls back or blocks high-risk checkout decisions.",
      ],
    },
    {
      title: "Correctness at cart and checkout",
      points: [
        "A cached browse result is advisory; cart and checkout must revalidate against the latest acceptable version.",
        "Persist the context and version used so a changed rule produces an understandable prompt.",
        "Use an unknown state and manual confirmation path instead of guessing from category, brand, or text similarity.",
      ],
    },
    {
      title: "Search, cache, and hot keys",
      points: [
        "Search the taxonomy separately from fitment evaluation; autocomplete should not scan the relationship corpus.",
        "Cache popular product/context answers with versioned keys and bounded TTLs.",
        "Protect against bots and celebrity products with quotas, request coalescing, and pagination limits.",
      ],
    },
    {
      title: "Data quality and operations",
      points: [
        "Quarantine imports with invalid identifiers, overlaps, missing dimensions, or conflicting exclusions.",
        "Monitor false-positive reports, unknown rates, publication lag, index divergence, and top mismatch products.",
        "Support replay, partial rebuilds, blue/green index promotion, and rollback to the prior known-good version.",
      ],
    },
  ],
  tradeoffs: [
    {
      title: "Relational rules vs search index",
      recommendation:
        "Keep the relational or document store authoritative and project a query-optimized index for high-volume reads.",
      caution:
        "A search index alone makes approvals, effective dates, and transactional correctness harder to audit.",
    },
    {
      title: "Precompute all pairs vs evaluate rules",
      recommendation:
        "Precompute common normalized relationships and evaluate narrow exceptions at read time.",
      caution:
        "Materializing every product-context pair can explode storage and makes broad taxonomy edits expensive.",
    },
    {
      title: "Strong vs eventual browse consistency",
      recommendation:
        "Allow eventual consistency for browse, but require a fresh check at cart and checkout.",
      caution:
        "Do not describe an index result as guaranteed fit without stating its version and freshness.",
    },
    {
      title: "Single global taxonomy vs market-specific catalogs",
      recommendation:
        "Share canonical identifiers where possible and layer market/seller overrides with explicit precedence.",
      caution:
        "Global normalization can hide regional differences in model years, regulations, or inventory.",
    },
  ],
  commonMistakes: [
    "Using free-text matching as the source of truth for compatibility.",
    "Returning only a boolean and omitting why a part fits or does not fit.",
    "Treating a stale search index as authoritative during checkout.",
    "Ignoring exclusions, aliases, market scope, effective dates, and catalog provenance.",
    "Updating the index directly without an outbox, idempotency, replay, or rollback strategy.",
  ],
  followUps: [
    {
      question: "What changes if merchants upload millions of rows at once?",
      answer:
        "Quarantine and validate in batches, partition work by catalog/market, apply backpressure, and promote one complete version rather than exposing a partially rebuilt index.",
    },
    {
      question: "How do you support both vehicles and electronics?",
      answer:
        "Use a typed context taxonomy and shared rule/publishing interfaces; keep domain-specific normalization and precedence modules behind the compatibility service.",
    },
    {
      question: "What if the index is unavailable during checkout?",
      answer:
        "Fail closed for high-risk compatibility claims, use the last known-good version only when policy allows, and make the degraded state visible to the user and operators.",
    },
    {
      question: "How would you prove a bad fitment result?",
      answer:
        "Persist the catalog/index version, rule provenance, context normalization, and decision reason, then correlate mismatch reports with orders and publication changes.",
    },
  ],
  rubric: [
    {
      criterion: "Product boundary",
      description:
        "Clarifies context selection, fitment states, cart/checkout behavior, catalog operations, and non-goals.",
    },
    {
      criterion: "Data modeling",
      description:
        "Models canonical contexts, aliases, rules, exclusions, precedence, provenance, effective dates, and versions.",
    },
    {
      criterion: "Serving path",
      description:
        "Uses bounded APIs, caching, an appropriate read index, pagination, explainable results, and a stated latency target.",
    },
    {
      criterion: "Correctness",
      description:
        "Separates browse eventual consistency from checkout revalidation and handles unknown or stale results safely.",
    },
    {
      criterion: "Publication and operations",
      description:
        "Includes validation, outbox/events, idempotent indexing, freshness SLOs, replay, rollback, mismatch feedback, and observability.",
    },
  ],
};

const PROBLEM_GUIDES: Record<string, ProblemGuide> = {
  "url-shortener": urlShortenerGuide,
  "document-management-system": documentManagementGuide,
  "job-scheduler": jobSchedulerGuide,
  "design-a-parts-compatibility-feature-for-an-ecommerce-site":
    partsCompatibilityGuide,
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
  jobSchedulerArchitecture,
  jobSchedulerGuide,
  partsCompatibilityArchitecture,
  partsCompatibilityGuide,
};
