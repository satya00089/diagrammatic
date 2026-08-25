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
      position: { x: 1920, y: 0 },
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

const PROBLEM_GUIDES: Record<string, ProblemGuide> = {
  "url-shortener": urlShortenerGuide,
};

export const getProblemGuide = (slug: string): ProblemGuide | null =>
  PROBLEM_GUIDES[slug] ?? null;

export const getGuideArchitecture = (slug: string): GuideArchitecture | null =>
  getProblemGuide(slug)?.architecture ?? null;

export { urlShortenerArchitecture, urlShortenerGuide };
