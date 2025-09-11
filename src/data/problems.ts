import type { SystemDesignProblem } from '../types/systemDesign';

export const systemDesignProblems: SystemDesignProblem[] = [
  {
    id: 'url-shortener',
    title: 'URL Shortener (like bit.ly)',
    description: 'Design a URL shortening service that can handle millions of URLs and redirect requests efficiently.',
    difficulty: 'Medium',
    category: 'Web Services',
    estimatedTime: '45-60 minutes',
    requirements: [
      'Shorten long URLs to short URLs',
      'Redirect short URLs to original URLs',
      'Handle 100M URLs per day',
      'Support custom aliases',
      'Provide analytics (click count, location, etc.)',
      '99.9% availability'
    ],
    constraints: [
      'Short URLs should be as short as possible',
      'Read heavy system (100:1 read/write ratio)',
      'Low latency for redirects (<100ms)',
      'URLs should not expire',
      'Analytics data can be eventually consistent'
    ],
    hints: [
      'Consider using base62 encoding for short URLs',
      'Think about database partitioning strategies',
      'Cache frequently accessed URLs',
      'Consider using a NoSQL database for analytics',
      'Load balancers will be needed for high availability'
    ],
    tags: ['web-services', 'scalability', 'caching', 'databases', 'load-balancing']
  },
  {
    id: 'chat-system',
    title: 'Real-time Chat System',
    description: 'Design a real-time messaging system like WhatsApp or Slack that supports group chats and file sharing.',
    difficulty: 'Hard',
    category: 'Real-time Systems',
    estimatedTime: '60-90 minutes',
    requirements: [
      'Real-time messaging between users',
      'Support group chats (up to 100 users)',
      'Message history and persistence',
      'File sharing capabilities',
      'Online/offline status indicators',
      'Message delivery acknowledgments',
      'Support for 50M daily active users'
    ],
    constraints: [
      'Messages should be delivered in real-time (<100ms)',
      'System should handle user offline scenarios',
      'Messages should be encrypted',
      'Support mobile and web clients',
      'Handle network partitions gracefully'
    ],
    hints: [
      'WebSockets or Server-Sent Events for real-time communication',
      'Consider message queues for reliability',
      'Database sharding by user or chat room',
      'CDN for file sharing',
      'Push notifications for offline users'
    ],
    tags: ['real-time', 'websockets', 'messaging', 'scalability', 'mobile']
  },
  {
    id: 'social-media-feed',
    title: 'Social Media News Feed',
    description: 'Design a news feed system like Facebook or Twitter that can handle billions of posts and personalized feeds.',
    difficulty: 'Hard',
    category: 'Social Media',
    estimatedTime: '60-90 minutes',
    requirements: [
      'Users can post updates (text, images, videos)',
      'Users can follow other users',
      'Generate personalized news feed',
      'Support likes, comments, and shares',
      'Handle 1B daily active users',
      'Real-time feed updates',
      'Trending topics and hashtags'
    ],
    constraints: [
      'Feed generation should be fast (<200ms)',
      'Handle celebrity users with millions of followers',
      'Support different media types',
      'Personalization based on user behavior',
      'Content moderation capabilities'
    ],
    hints: [
      'Push vs Pull model for feed generation',
      'Fanout strategies for celebrity posts',
      'Machine learning for personalization',
      'CDN for media content',
      'Cache popular posts and user feeds'
    ],
    tags: ['social-media', 'feeds', 'scalability', 'personalization', 'media']
  },
  {
    id: 'video-streaming',
    title: 'Video Streaming Platform',
    description: 'Design a video streaming service like YouTube or Netflix that can serve millions of concurrent viewers.',
    difficulty: 'Hard',
    category: 'Media Streaming',
    estimatedTime: '60-90 minutes',
    requirements: [
      'Upload and store video content',
      'Stream videos to millions of users',
      'Support different video qualities (480p, 720p, 1080p, 4K)',
      'Adaptive bitrate streaming',
      'Search and recommendation system',
      'User profiles and watch history',
      'Global content delivery'
    ],
    constraints: [
      'Minimize video startup time (<2 seconds)',
      'Handle peak traffic during popular releases',
      'Support multiple devices and browsers',
      'Efficient storage for large video files',
      'Copyright protection and DRM'
    ],
    hints: [
      'Video transcoding pipeline',
      'CDN for global content delivery',
      'Metadata database for search',
      'Machine learning for recommendations',
      'Chunked video storage for adaptive streaming'
    ],
    tags: ['video-streaming', 'cdn', 'transcoding', 'storage', 'recommendations']
  },
  {
    id: 'ride-sharing',
    title: 'Ride Sharing Service',
    description: 'Design a ride-sharing platform like Uber or Lyft that matches drivers with passengers in real-time.',
    difficulty: 'Hard',
    category: 'Location-based Services',
    estimatedTime: '60-90 minutes',
    requirements: [
      'Match drivers with passengers',
      'Real-time location tracking',
      'Route optimization and navigation',
      'Fare calculation and payment processing',
      'Driver and passenger ratings',
      'Trip history and receipts',
      'Support surge pricing',
      'Handle 10M daily rides'
    ],
    constraints: [
      'Matching should happen within seconds',
      'Accurate real-time location updates',
      'Handle high demand during peak hours',
      'Support different vehicle types',
      'Fraud detection and prevention'
    ],
    hints: [
      'Geospatial indexing for location queries',
      'WebSockets for real-time updates',
      'Machine learning for demand prediction',
      'Payment gateway integration',
      'Microservices architecture'
    ],
    tags: ['location-services', 'real-time', 'geospatial', 'payments', 'mobile']
  },
  {
    id: 'search-engine',
    title: 'Web Search Engine',
    description: 'Design a web search engine like Google that can index billions of web pages and return relevant results quickly.',
    difficulty: 'Hard',
    category: 'Search Systems',
    estimatedTime: '90+ minutes',
    requirements: [
      'Crawl and index billions of web pages',
      'Return relevant search results quickly',
      'Handle billions of search queries per day',
      'Support different types of content (text, images, videos)',
      'Provide search suggestions and autocomplete',
      'Ranking algorithm for result relevance',
      'Handle typos and synonyms'
    ],
    constraints: [
      'Search results should load within 200ms',
      'Index should be updated regularly',
      'Handle complex queries with multiple terms',
      'Scale to billions of documents',
      'Support different languages'
    ],
    hints: [
      'Distributed web crawling system',
      'Inverted index for fast text search',
      'Distributed storage and computation',
      'PageRank or similar ranking algorithms',
      'Caching for popular queries'
    ],
    tags: ['search', 'indexing', 'crawling', 'ranking', 'distributed-systems']
  },
  {
    id: 'payment-system',
    title: 'Digital Payment System',
    description: 'Design a payment processing system like PayPal or Stripe that handles financial transactions securely.',
    difficulty: 'Hard',
    category: 'Financial Systems',
    estimatedTime: '60-90 minutes',
    requirements: [
      'Process payments between users and merchants',
      'Support multiple payment methods (cards, bank transfers, wallets)',
      'Handle currency conversions',
      'Fraud detection and prevention',
      'Transaction history and reporting',
      'Refunds and dispute handling',
      'Compliance with financial regulations',
      'Handle millions of transactions per day'
    ],
    constraints: [
      'Transactions must be secure and encrypted',
      'ACID properties for financial transactions',
      'PCI DSS compliance required',
      'Low latency for payment processing',
      'Handle payment failures gracefully'
    ],
    hints: [
      'Database transactions and consistency',
      'Encryption for sensitive data',
      'Event sourcing for audit trails',
      'Integration with banking systems',
      'Machine learning for fraud detection'
    ],
    tags: ['payments', 'security', 'compliance', 'transactions', 'fraud-detection']
  },
  {
    id: 'notification-system',
    title: 'Notification System',
    description: 'Design a notification system that can send millions of notifications across different channels (email, SMS, push).',
    difficulty: 'Medium',
    category: 'Communication Systems',
    estimatedTime: '45-60 minutes',
    requirements: [
      'Send notifications via multiple channels (email, SMS, push, in-app)',
      'Support different notification types (marketing, transactional, alerts)',
      'User preferences and opt-out mechanisms',
      'Template management for notifications',
      'Delivery tracking and analytics',
      'Rate limiting to prevent spam',
      'Handle millions of notifications per day'
    ],
    constraints: [
      'Notifications should be delivered quickly',
      'Handle delivery failures and retries',
      'Respect user preferences and privacy',
      'Support A/B testing for content',
      'Scale to handle traffic spikes'
    ],
    hints: [
      'Message queues for reliable delivery',
      'Template engines for dynamic content',
      'Third-party service integrations',
      'User preference management',
      'Analytics and tracking systems'
    ],
    tags: ['notifications', 'messaging', 'queues', 'templates', 'analytics']
  },
  {
    id: 'file-storage',
    title: 'Distributed File Storage',
    description: 'Design a distributed file storage system like Google Drive or Dropbox for storing and sharing files.',
    difficulty: 'Medium',
    category: 'Storage Systems',
    estimatedTime: '45-60 minutes',
    requirements: [
      'Upload, download, and store files',
      'File sharing with permissions',
      'File versioning and history',
      'Synchronization across devices',
      'Search files by name and content',
      'Handle large files (up to 1GB)',
      'Support billions of files',
      'Offline access capabilities'
    ],
    constraints: [
      'Fast upload and download speeds',
      'Handle concurrent file modifications',
      'Efficient storage utilization',
      'Data durability and backup',
      'Support different file types'
    ],
    hints: [
      'Chunked file storage for large files',
      'Metadata database for file information',
      'CDN for fast file access',
      'Conflict resolution for simultaneous edits',
      'Deduplication to save storage space'
    ],
    tags: ['file-storage', 'synchronization', 'versioning', 'cdn', 'deduplication']
  },
  {
    id: 'cache-system',
    title: 'Distributed Cache System',
    description: 'Design a distributed caching system like Redis or Memcached that provides fast data access.',
    difficulty: 'Medium',
    category: 'Caching Systems',
    estimatedTime: '30-45 minutes',
    requirements: [
      'Store and retrieve key-value pairs',
      'Distribute data across multiple nodes',
      'Handle node failures gracefully',
      'Support different eviction policies (LRU, LFU, TTL)',
      'Provide high availability and consistency',
      'Support different data types',
      'Handle millions of requests per second'
    ],
    constraints: [
      'Sub-millisecond response times',
      'Memory-efficient storage',
      'Handle hot keys and uneven load',
      'Minimize data loss during failures',
      'Support both read and write operations'
    ],
    hints: [
      'Consistent hashing for data distribution',
      'Replication for fault tolerance',
      'Memory management and eviction policies',
      'Client-side load balancing',
      'Monitoring and alerting systems'
    ],
    tags: ['caching', 'distributed-systems', 'performance', 'memory', 'consistency']
  }
];
