import type { ProblemGuide } from "../types/problemGuide";
import type { ProblemSpec } from "../types/problemSpec";
import instagramSystemDesignSpec from "./public/problemGuides/specs/instagram-system-design.json";
import pastebinSystemDesignSpec from "./public/problemGuides/specs/pastebin-system-design.json";
import ciCdPipelineSpec from "./public/problemGuides/specs/ci-cd-pipeline.json";
import notificationSystemSpec from "./public/problemGuides/specs/notification-system.json";
import googleCalendarSystemDesignSpec from "./public/problemGuides/specs/google-calendar-system-design.json";
import hotelBookingSystemSpec from "./public/problemGuides/specs/hotel-booking-system.json";
import distributedFileStorageSpec from "./public/problemGuides/specs/distributed-file-storage.json";
import webCrawlerSpec from "./public/problemGuides/specs/web-crawler.json";
import distributedCacheSpec from "./public/problemGuides/specs/distributed-cache.json";
import serverlessEventDrivenArchitectureSpec from "./public/problemGuides/specs/serverless-event-driven-architecture.json";
import paymentSystemSpec from "./public/problemGuides/specs/payment-system.json";
import rideSharingSystemSpec from "./public/problemGuides/specs/ride-sharing-system.json";
import videoTranscodingPipelineSpec from "./public/problemGuides/specs/video-transcoding-pipeline.json";
import netflixConcurrentStreamLimitsSpec from "./public/problemGuides/specs/netflix-concurrent-stream-limits.json";
import uberRiderMatchingSpec from "./public/problemGuides/specs/uber-rider-matching.json";
import webSearchEngineSpec from "./public/problemGuides/specs/web-search-engine.json";
import videoStreamingPlatformSpec from "./public/problemGuides/specs/video-streaming-platform.json";
import recommendationEngineSpec from "./public/problemGuides/specs/recommendation-engine.json";
import realTimeChatSystemSpec from "./public/problemGuides/specs/real-time-chat-system.json";
import realTimeRecommendationSystemSpec from "./public/problemGuides/specs/real-time-recommendation-system.json";
import rateLimiterSpec from "./public/problemGuides/specs/rate-limiter.json";
import semanticSearchEngineSpec from "./public/problemGuides/specs/semantic-search-engine.json";
import ragConversationalAiSpec from "./public/problemGuides/specs/rag-conversational-ai.json";
import observabilityPlatformSpec from "./public/problemGuides/specs/observability-platform.json";
import etaLocationSharingSpec from "./public/problemGuides/specs/eta-location-sharing.json";
import { attachmentProblemSpecs } from "./public/problemGuides/specs";

const specs: readonly ProblemSpec[] = [
  instagramSystemDesignSpec,
  pastebinSystemDesignSpec,
  ciCdPipelineSpec,
  notificationSystemSpec,
  googleCalendarSystemDesignSpec,
  hotelBookingSystemSpec,
  distributedFileStorageSpec,
  webCrawlerSpec,
  distributedCacheSpec,
  serverlessEventDrivenArchitectureSpec,
  paymentSystemSpec,
  rideSharingSystemSpec,
  videoTranscodingPipelineSpec,
  netflixConcurrentStreamLimitsSpec,
  uberRiderMatchingSpec,
  webSearchEngineSpec,
  videoStreamingPlatformSpec,
  recommendationEngineSpec,
  realTimeChatSystemSpec,
  realTimeRecommendationSystemSpec,
  rateLimiterSpec,
  semanticSearchEngineSpec,
  ragConversationalAiSpec,
  observabilityPlatformSpec,
  etaLocationSharingSpec,
  ...attachmentProblemSpecs,
] as const;

const makeGuide = (spec: ProblemSpec): ProblemGuide => {
  const entityNames = [
    spec.store,
    `${spec.slug.replace(/-system-design|-system|-pipeline|-engine|-platform/g, "")} event`,
    "Policy and configuration",
    "Read model",
  ];
  const components = [
    {
      id: "client",
      type: "client" as const,
      componentId: "web-app",
      label: "Clients",
      description: `Clients use the ${spec.action} workflow and render status, freshness, or progress.`,
      position: { x: 0, y: 260 },
      properties: { protocol: "HTTPS or streaming API" },
    },
    {
      id: "gateway",
      type: "api-gateway" as const,
      componentId: "api-gateway",
      label: "API gateway",
      description:
        "Authenticates requests, validates input, applies quotas, and routes by the primary key.",
      position: { x: 360, y: 260 },
      properties: { protection: "Auth, validation, rate limits" },
    },
    {
      id: "service",
      type: "microservice" as const,
      componentId: "backend-server",
      label: "Core service",
      description: `Owns the ${spec.action} command, authorization, and product contract.`,
      position: { x: 720, y: 260 },
      properties: { consistency: "Idempotent command handling" },
    },
    {
      id: "source",
      type: "database" as const,
      componentId: "database",
      label: "Durable source of truth",
      description: `Stores ${spec.durable} and supports the primary access patterns.`,
      position: { x: 1080, y: 260 },
      properties: { storage: spec.store },
    },
    {
      id: "stream",
      type: "message-broker" as const,
      componentId: "message-broker",
      label: "Event stream",
      description: `Durably publishes events for ${spec.async}.`,
      position: { x: 1440, y: 100 },
      properties: { delivery: "At least once with dedupe" },
    },
    {
      id: "workers",
      type: "microservice" as const,
      componentId: "backend-server",
      label: "Async workers",
      description: `Processes ${spec.async} independently from the user-facing command.`,
      position: { x: 1800, y: 100 },
      properties: { scaling: "Partitioned workers" },
    },
    {
      id: "read-model",
      type: "cache" as const,
      componentId: "cache",
      label: "Read model / cache",
      description: `Serves low-latency ${spec.store} views with explicit freshness and fallback behavior.`,
      position: { x: 2160, y: 260 },
      properties: { latency: spec.latency },
    },
    {
      id: "monitoring",
      type: "monitoring" as const,
      componentId: "monitoring",
      label: "Observability",
      description:
        "Tracks latency, backlog, freshness, correctness, and saturation.",
      position: { x: 1800, y: -180 },
      properties: { alerts: "Errors, lag, drift" },
    },
  ];
  const connections = [
    {
      id: "client-gateway",
      source: "client",
      target: "gateway",
      type: "http" as const,
      label: "Request",
      description: `Client invokes ${spec.action}.`,
    },
    {
      id: "gateway-service",
      source: "gateway",
      target: "service",
      type: "api-call" as const,
      label: "Validated command",
      description:
        "The gateway forwards an authenticated, quota-checked command.",
    },
    {
      id: "service-source",
      source: "service",
      target: "source",
      type: "database-connection" as const,
      label: "Durable commit",
      description: `Commits ${spec.durable} before downstream work.`,
    },
    {
      id: "source-stream",
      source: "source",
      target: "stream",
      type: "event-stream" as const,
      label: "Domain event",
      description:
        "An outbox or change stream preserves committed transitions.",
    },
    {
      id: "stream-workers",
      source: "stream",
      target: "workers",
      type: "message-queue" as const,
      label: "Async work",
      description: `Workers handle ${spec.async}.`,
    },
    {
      id: "workers-read-model",
      source: "workers",
      target: "read-model",
      type: "data-flow" as const,
      label: "Projection",
      description: "Workers update the bounded read model or cache.",
    },
    {
      id: "read-service",
      source: "read-model",
      target: "service",
      type: "database-connection" as const,
      label: "Fast read",
      description: "The core service reads the latest acceptable projection.",
    },
    {
      id: "service-client",
      source: "service",
      target: "client",
      type: "http" as const,
      label: "Response",
      description: `Returns results within ${spec.latency}.`,
    },
    {
      id: "stream-monitoring",
      source: "stream",
      target: "monitoring",
      type: "data-flow" as const,
      label: "Lag and health",
      description: "Monitors consumer lag and processing health.",
    },
  ];
  return {
    prompt: {
      brief: `Design ${spec.focus} so users can ${spec.action} reliably at scale.`,
      successSignals: [
        `Define the source of truth for ${spec.durable} and make retries idempotent.`,
        `Use bounded, partitioned state to meet ${spec.scale} and ${spec.latency}.`,
        `Separate the critical request path from ${spec.async}.`,
        "Explain consistency, failure recovery, authorization, observability, and a degraded mode.",
      ],
    },
    requirements: {
      functional: [
        `Support the core workflow to ${spec.action}.`,
        `Expose status, results, and freshness appropriate to ${spec.focus}.`,
        "Support authorization, validation, updates, deletion, and recovery semantics.",
      ],
      nonFunctional: [
        `Meet ${spec.latency} under normal load.`,
        `Scale to ${spec.scale} without a single hot key or unbounded synchronous work.`,
        `Do not lose committed state; make retries and duplicate events safe.`,
        `Degrade safely when downstream workers, caches, or external dependencies fail.`,
      ],
      scaleAssumptions: [
        spec.scale,
        `Partition by the primary tenant, user, item, or geographic key and isolate hot partitions.`,
        `Keep serving state bounded; retain raw events or durable records for replay and auditing.`,
      ],
      metrics: [
        {
          label: "Peak scale",
          value: spec.scale.split(" and ")[0],
          description:
            "Capacity assumption that drives partitioning and backpressure.",
        },
        {
          label: "Latency target",
          value: spec.latency,
          description:
            "User-facing budget for the primary request or read path.",
        },
        {
          label: "Durable boundary",
          value: "Committed before async",
          description: `The source of truth is ${spec.durable}.`,
        },
        {
          label: "Async boundary",
          value: "At-least-once workers",
          description: `Keep ${spec.async} off the synchronous path.`,
        },
      ],
    },
    entities: entityNames.map((name, index) => ({
      name,
      fields:
        index === 0
          ? ["id", "owner_id", "state", "created_at", "updated_at"]
          : ["id", "source_id", "version", "occurred_at", "status"],
      notes:
        index === 0
          ? `Durable model for ${spec.durable}; design keys around the main reads and writes.`
          : "Versioned, idempotent state supports retries, replay, and consistency checks.",
    })),
    apis: [
      {
        method: "POST",
        path: "/v1/commands",
        contract: `{ requestId, input } -> { id, status }`,
        notes: `Authenticate and validate the ${spec.action} command, then commit it idempotently.`,
      },
      {
        method: "GET",
        path: "/v1/resources/{id}",
        contract: "{ resource, status, version, observedAt }",
        notes:
          "Return the latest acceptable read model with explicit freshness or progress.",
      },
      {
        method: "GET",
        path: "/v1/resources?cursor=&limit=",
        contract: "{ items[], nextCursor }",
        notes:
          "Use bounded cursor pagination and enforce tenant, privacy, and eligibility filters.",
      },
      {
        method: "POST",
        path: "/v1/jobs",
        contract: "{ type, input } -> { jobId, status }",
        notes:
          "Route large, historical, or asynchronous work to a quota-controlled job path.",
      },
    ],
    dataFlow: [
      {
        title: `Accept ${spec.action}`,
        description:
          "The edge authenticates and validates the request; the core service applies authorization and an idempotency key.",
      },
      {
        title: "Commit the durable state",
        description: `The service writes ${spec.durable} transactionally or conditionally before acknowledging the client.`,
      },
      {
        title: "Publish the domain event",
        description:
          "An outbox or change stream emits a replayable event after the commit; consumers use at-least-once delivery safely.",
      },
      {
        title: "Build the read model",
        description: `Partitioned workers process ${spec.async}, update projections, and expose lag or watermark metadata.`,
      },
      {
        title: "Serve and recover asynchronously",
        description: `Reads use the bounded read model; replay, repair, exports, and slow external work stay asynchronous.`,
      },
    ],
    architecture: {
      title: `${spec.focus.charAt(0).toUpperCase() + spec.focus.slice(1)} reference architecture`,
      summary: `A durable core handles ${spec.action}; partitioned events and workers build a bounded read model while ${spec.async} remains off the critical path.`,
      layers: [
        {
          id: "experience",
          label: "Experience",
          description: "Clients and the authenticated request boundary.",
          componentIds: ["client", "gateway", "service"],
        },
        {
          id: "source",
          label: "Source of truth",
          description: `Durable state for ${spec.durable} and replayable events.`,
          componentIds: ["source", "stream"],
        },
        {
          id: "processing",
          label: "Processing and serving",
          description: "Partitioned workers and low-latency projections.",
          componentIds: ["workers", "read-model"],
        },
        {
          id: "operations",
          label: "Operations",
          description: "Lag, failures, repair, and capacity signals.",
          componentIds: ["monitoring"],
        },
      ],
      keyPaths: [
        {
          id: "critical",
          label: "Critical request path",
          description: "Client -> gateway -> service -> durable source.",
          componentIds: ["client", "gateway", "service", "source"],
        },
        {
          id: "async",
          label: "Async projection path",
          description: "Source -> event stream -> workers -> read model.",
          componentIds: ["source", "stream", "workers", "read-model"],
        },
      ],
      components,
      connections,
    },
    deepDives: [
      {
        title: "Consistency and idempotency",
        points: [
          "Define which state is strongly consistent and which projection is eventually consistent.",
          "Use request IDs, conditional writes, event IDs, and versions to make retries safe.",
          "Return version and observedAt so clients can reason about freshness.",
        ],
      },
      {
        title: "Partitioning and hot keys",
        points: [
          `Partition by the access pattern implied by ${spec.focus}, then isolate hot tenants, users, items, or regions.`,
          "Use bounded work, backpressure, and queue isolation instead of allowing one key to dominate the cluster.",
          "Keep a replay or reconciliation path for projection drift and partial failures.",
        ],
      },
      {
        title: "Failure and recovery",
        points: [
          "Serve the last acceptable projection or an explicit degraded response when asynchronous dependencies fail.",
          `Retain durable records for replay; treat ${spec.async} as independently retryable.`,
          "Measure latency, backlog, freshness, error rate, and correctness drift.",
        ],
      },
    ],
    tradeoffs: [
      {
        title: "Strong consistency versus throughput",
        recommendation:
          "Strongly protect the business commit and use versioned eventual projections for high-volume reads.",
        caution:
          "Making every derived read synchronous increases coordination and tail latency.",
      },
      {
        title: "Push versus pull processing",
        recommendation:
          "Push bounded events to workers and pull durable snapshots on reads or recovery.",
        caution:
          "Unbounded fanout or full scans make bursts and hot keys expensive.",
      },
      {
        title: "Managed service versus custom control",
        recommendation:
          "Start with managed primitives where their limits match the access pattern, then isolate replaceable interfaces.",
        caution:
          "Provider defaults do not remove the need for quotas, replay, observability, and data lifecycle design.",
      },
    ],
    commonMistakes: [
      "Putting all work on the synchronous request path.",
      "Choosing a data store before writing the access patterns and consistency contract.",
      "Ignoring retries, duplicate events, late data, deletion, privacy, or authorization.",
      "Leaving hot partitions, backpressure, stale reads, and recovery unspecified.",
      "Allowing unbounded requests or exports to compete with normal traffic.",
    ],
    followUps: [
      {
        question: "What happens when the primary worker is unavailable?",
        answer:
          "Acknowledge only after the durable boundary, serve the last acceptable projection, queue retryable work, and replay or reconcile after recovery.",
      },
      {
        question: "How would you support a tenfold traffic spike?",
        answer:
          "Pre-scale partitions, apply admission control and backpressure, isolate hot keys, cache immutable snapshots, and make freshness degradation visible.",
      },
      {
        question: "How do you verify correctness?",
        answer:
          "Use idempotency metrics, version gaps, sampled source-to-projection comparisons, replay tests, and a shadow rebuild before repair.",
      },
    ],
    rubric: [
      {
        criterion: "Requirements",
        description: `The answer defines the core ${spec.action} workflow, scale, latency, durability, and failure contract.`,
      },
      {
        criterion: "Data model",
        description: `Entities and keys support ${spec.focus}, the primary access patterns, privacy, and lifecycle changes.`,
      },
      {
        criterion: "Scalability",
        description:
          "Partitioning, cache behavior, queues, backpressure, and hot-key handling are explicit.",
      },
      {
        criterion: "Reliability",
        description:
          "Idempotency, replay, recovery, degraded reads, and observability protect committed state.",
      },
      {
        criterion: "Tradeoffs",
        description:
          "The candidate can explain consistency, push/pull, managed services, and what changes at larger scale.",
      },
    ],
  };
};

export const generatedProblemGuides: Record<string, ProblemGuide> =
  Object.fromEntries(specs.map((spec) => [spec.slug, makeGuide(spec)]));
