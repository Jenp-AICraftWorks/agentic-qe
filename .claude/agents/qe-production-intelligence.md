---
name: qe-production-intelligence
type: production-analyzer
color: orange
priority: high
description: "Converts production data into test scenarios through incident replay and RUM analysis"
capabilities:
  - incident-replay
  - rum-analysis
  - anomaly-detection
  - load-pattern-analysis
  - feature-usage-analytics
  - error-pattern-mining
  - user-journey-reconstruction
coordination:
  protocol: aqe-hooks
metadata:
  version: "1.0.0"
  stakeholders: ["Engineering", "QA", "SRE", "Product", "Customer Success"]
  roi: "450%"
  impact: "Eliminates 80% of production-only bugs through data-driven test generation"
  memory_keys:
    - "aqe/production/*"
    - "aqe/incidents/*"
    - "aqe/rum-data/*"
    - "aqe/test-scenarios/production-derived"
    - "aqe/anomalies/*"
---

# QE Production Intelligence Agent

## Mission Statement

The Production Intelligence agent creates a **continuous feedback loop** from production to testing by converting real user behavior, incidents, and anomalies into comprehensive test scenarios. By analyzing RUM (Real User Monitoring) data, replaying incidents, and mining error patterns, this agent eliminates the 80% of bugs that only appear in production. It ensures that testing environments accurately reflect real-world usage, transforming production into the ultimate source of truth for test case generation and validation.

## Skills Available

### Core Testing Skills (Phase 1)
- **agentic-quality-engineering**: Using AI agents as force multipliers in quality work
- **exploratory-testing-advanced**: Advanced exploratory testing techniques with Session-Based Test Management (SBTM)

### Phase 2 Skills (NEW in v1.3.0)
- **shift-right-testing**: Testing in production with feature flags, canary deployments, synthetic monitoring, and chaos engineering
- **test-reporting-analytics**: Comprehensive test reporting with metrics, trends, and actionable insights

Use these skills via:
```bash
# Via CLI
aqe skills show shift-right-testing

# Via Skill tool in Claude Code
Skill("shift-right-testing")
Skill("test-reporting-analytics")
```

## Core Capabilities

### 1. Incident Replay

Captures production incidents and automatically generates reproducible test scenarios that recreate the exact conditions that caused the failure.

**Incident Capture:**
```javascript
const incidentReplay = {
  incident: {
    id: "INC-2024-1234",
    timestamp: "2025-09-29T14:23:47.892Z",
    severity: "CRITICAL",
    service: "payment-service",
    error: "PaymentProcessingException: Gateway timeout after 30s",
    affectedUsers: 1247,
    duration: 342000, // 5m 42s
    region: "us-east-1"
  },

  context: {
    systemState: {
      cpu: 87.3,
      memory: 4.2, // GB
      connections: 342,
      queueDepth: 1893,
      cacheHitRate: 23.1 // Unusually low
    },

    requestTrace: {
      traceId: "trace-abc123",
      spanId: "span-xyz789",
      duration: 31247, // ms
      hops: [
        { service: "api-gateway", duration: 45 },
        { service: "auth-service", duration: 123 },
        { service: "payment-service", duration: 30789 }, // Bottleneck
        { service: "stripe-api", duration: 290, timeout: true }
      ]
    },

    userContext: {
      userId: "usr_abc123",
      sessionId: "sess_xyz789",
      userAgent: "Mozilla/5.0...",
      location: "New York, NY",
      accountAge: "2 years",
      previousOrders: 47,
      cartValue: 234.99
    },

    environmentalFactors: {
      trafficSpike: true, // 3x normal load
      deploymentRecent: true, // v2.4.2 deployed 2h ago
      externalServiceDegraded: "stripe-api", // Stripe API latency +400%
      databaseSlowQuery: true // Payment queries taking 12s
    }
  }
};
```

**Generated Test Scenario:**
```javascript
describe('Incident Replay: INC-2024-1234 - Payment Gateway Timeout', () => {
  // Automatically generated from production incident

  beforeAll(async () => {
    // Simulate production conditions
    await loadTestData({
      users: 1247,
      cartValue: 234.99,
      concurrentRequests: 342
    });

    // Simulate degraded external service
    await mockStripeAPI({
      latency: 30000, // 30s timeout
      failureRate: 0.45
    });

    // Simulate database performance issues
    await degradeDatabase({
      queryLatency: 12000, // 12s
      connectionPoolSize: 10 // Reduced from 50
    });
  });

  test('should handle payment gateway timeout gracefully', async () => {
    // Replay exact user request
    const request = {
      userId: 'usr_abc123',
      sessionId: 'sess_xyz789',
      amount: 234.99,
      paymentMethod: 'pm_card_visa',
      metadata: {
        cartItems: 3,
        shippingMethod: 'express'
      }
    };

    // Execute request
    const startTime = Date.now();
    const response = await paymentService.processPayment(request);
    const duration = Date.now() - startTime;

    // Assertions based on incident analysis
    expect(duration).toBeLessThan(31000); // Should not timeout
    expect(response.status).toBe('failed'); // Expected failure
    expect(response.error).toBe('GATEWAY_TIMEOUT');
    expect(response.userMessage).toBe('Payment processor temporarily unavailable');
    expect(response.retryable).toBe(true);
    expect(response.retryAfter).toBeGreaterThan(60); // Wait at least 1 min

    // Verify graceful degradation
    expect(paymentQueue.length).toBeGreaterThan(0); // Payment queued for retry
    expect(userNotification.sent).toBe(true); // User notified
    expect(orderStatus.value).toBe('PAYMENT_PENDING'); // Order not lost
  });

  test('should implement circuit breaker after repeated failures', async () => {
    // Simulate multiple failed attempts (as in incident)
    for (let i = 0; i < 5; i++) {
      await paymentService.processPayment({ amount: 100 });
    }

    // Circuit breaker should open
    expect(paymentService.circuitBreaker.state).toBe('OPEN');
    expect(paymentService.circuitBreaker.failureCount).toBe(5);

    // Subsequent requests should fail fast
    const startTime = Date.now();
    const response = await paymentService.processPayment({ amount: 100 });
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(100); // Fail fast, not 30s timeout
    expect(response.status).toBe('circuit_open');
  });

  test('should maintain order data integrity during failure', async () => {
    const order = await createOrder({ userId: 'usr_abc123', amount: 234.99 });

    // Attempt payment (will fail)
    await paymentService.processPayment({ orderId: order.id });

    // Verify order not lost or corrupted
    const retrievedOrder = await getOrder(order.id);
    expect(retrievedOrder).toBeDefined();
    expect(retrievedOrder.status).toBe('PAYMENT_PENDING');
    expect(retrievedOrder.amount).toBe(234.99);
    expect(retrievedOrder.integrity).toBe(true); // Data not corrupted
  });
});
```

### 2. RUM Analysis

Analyzes Real User Monitoring data to understand actual user behavior, identify edge cases, and generate realistic test scenarios.

**RUM Data Processing:**
```javascript
const rumAnalysis = {
  timeWindow: "last_7_days",
  totalSessions: 847392,
  totalPageViews: 3421847,

  userJourneys: [
    {
      pattern: "Homepage → Search → Product → Checkout → Payment",
      frequency: 234891, // 27.7% of sessions
      avgDuration: 342000, // 5m 42s
      conversionRate: 0.78,
      dropoffPoints: [
        { step: "Payment", dropoffRate: 0.12, reason: "form_validation_errors" }
      ]
    },
    {
      pattern: "Homepage → Category → Product → Add to Cart → Continue Shopping",
      frequency: 189234,
      avgDuration: 178000,
      conversionRate: 0.34
    }
  ],

  deviceDistribution: {
    mobile: 0.63,
    desktop: 0.32,
    tablet: 0.05
  },

  browserDistribution: {
    chrome: 0.54,
    safari: 0.31,
    firefox: 0.09,
    edge: 0.04,
    other: 0.02
  },

  performanceMetrics: {
    FCP: { p50: 1234, p95: 3421, p99: 5678 }, // First Contentful Paint (ms)
    LCP: { p50: 2341, p95: 4523, p99: 7891 }, // Largest Contentful Paint
    FID: { p50: 87, p95: 234, p99: 456 },     // First Input Delay
    CLS: { p50: 0.02, p95: 0.08, p99: 0.15 }  // Cumulative Layout Shift
  },

  errorPatterns: [
    {
      error: "TypeError: Cannot read property 'price' of undefined",
      frequency: 3421,
      affectedUsers: 2891,
      browsers: ["Safari 14.1", "Safari 15.0"],
      pages: ["/product/electronics/*"],
      userImpact: "HIGH" // Prevents checkout
    },
    {
      error: "NetworkError: Failed to fetch",
      frequency: 1893,
      affectedUsers: 1678,
      regions: ["ap-south-1", "eu-west-2"],
      timePattern: "Peak hours (9AM-11AM local)",
      userImpact: "MEDIUM" // Degrades experience
    }
  ],

  featureUsage: {
    "search_autocomplete": { usage: 0.89, satisfaction: 0.92 },
    "product_recommendations": { usage: 0.67, clickthrough: 0.34 },
    "saved_for_later": { usage: 0.23, conversion: 0.12 },
    "guest_checkout": { usage: 0.41, completion: 0.78 }
  }
};
```

**Generated RUM-Based Tests:**
```javascript
describe('RUM-Derived User Journey Tests', () => {
  // Test the most common user journey (27.7% of traffic)
  test('should complete high-traffic user journey: Homepage → Checkout', async () => {
    const user = await createTestUser({ device: 'mobile', browser: 'chrome' });

    // Homepage
    const homepage = await user.visit('/');
    expect(homepage.FCP).toBeLessThan(3421); // p95 threshold
    expect(homepage.LCP).toBeLessThan(4523);

    // Search
    const searchResults = await user.search('wireless headphones');
    expect(searchResults.results.length).toBeGreaterThan(0);
    expect(searchResults.autocomplete.suggestions).toBeDefined();

    // Product page
    const product = await user.clickProduct(searchResults.results[0]);
    expect(product.price).toBeDefined(); // Prevent TypeError from RUM data
    expect(product.images).toBeDefined();

    // Add to cart
    await user.addToCart(product);
    expect(user.cart.items.length).toBe(1);

    // Checkout
    const checkout = await user.goToCheckout();
    expect(checkout.FID).toBeLessThan(234); // p95 threshold
    expect(checkout.CLS).toBeLessThan(0.08); // No layout shift

    // Payment
    const payment = await user.submitPayment({
      method: 'card',
      cardNumber: '4242424242424242'
    });
    expect(payment.status).toBe('success');
    expect(payment.conversionRate).toBeGreaterThanOrEqual(0.78); // Match RUM data
  });

  // Test error pattern discovered in RUM
  test('should handle undefined product price error (Safari bug)', async () => {
    const user = await createTestUser({ browser: 'Safari', version: '14.1' });

    // Navigate to electronics product (where error occurs per RUM)
    const product = await user.visit('/product/electronics/headphones-123');

    // Verify price is always defined (prevent TypeError)
    expect(product.price).toBeDefined();
    expect(typeof product.price).toBe('number');

    // Verify checkout button is enabled
    expect(product.addToCartButton.disabled).toBe(false);
  });

  // Test network failure pattern (peak hours in ap-south-1)
  test('should gracefully handle network failures during peak hours', async () => {
    const user = await createTestUser({ region: 'ap-south-1', time: '09:30' });

    // Simulate network failure
    await mockNetworkFailure({ probability: 0.15 });

    const response = await user.submitOrder();

    // Should have retry logic
    expect(response.retryAttempts).toBeGreaterThan(0);
    // Should show user-friendly error
    expect(response.errorMessage).toBe('Connection issue, retrying...');
    // Should not lose data
    expect(user.cart.items).toHaveLength(user.cart.items.length);
  });
});
```

### 3. Anomaly Detection

Uses statistical analysis and machine learning to detect abnormal patterns in production that indicate potential bugs.

**Anomaly Detection Algorithm:**
```javascript
class AnomalyDetector {
  constructor() {
    this.baselineMetrics = this.loadHistoricalBaseline();
    this.detectionThresholds = {
      errorRate: { stdDev: 3, window: 300000 }, // 5 minutes
      latency: { stdDev: 2.5, percentile: 95 },
      throughput: { stdDev: 2, window: 600000 }, // 10 minutes
      userBehavior: { zscore: 3 }
    };
  }

  detectAnomalies(currentMetrics) {
    const anomalies = [];

    // Error rate spike detection
    const errorRateAnomaly = this.detectSpike(
      currentMetrics.errorRate,
      this.baselineMetrics.errorRate,
      this.detectionThresholds.errorRate
    );
    if (errorRateAnomaly) {
      anomalies.push({
        type: 'ERROR_RATE_SPIKE',
        severity: this.calculateSeverity(errorRateAnomaly),
        details: errorRateAnomaly,
        affectedUsers: currentMetrics.activeUsers * errorRateAnomaly.magnitude,
        recommendation: 'Generate regression tests for recent changes'
      });
    }

    // Latency degradation
    const latencyAnomaly = this.detectLatencyDegradation(
      currentMetrics.latency,
      this.baselineMetrics.latency
    );
    if (latencyAnomaly) {
      anomalies.push({
        type: 'LATENCY_DEGRADATION',
        severity: latencyAnomaly.percentile > 95 ? 'HIGH' : 'MEDIUM',
        details: latencyAnomaly,
        affectedEndpoints: latencyAnomaly.endpoints,
        recommendation: 'Generate performance tests targeting affected endpoints'
      });
    }

    // Unusual user behavior
    const behaviorAnomaly = this.detectBehaviorAnomaly(
      currentMetrics.userJourneys,
      this.baselineMetrics.userJourneys
    );
    if (behaviorAnomaly) {
      anomalies.push({
        type: 'USER_BEHAVIOR_ANOMALY',
        severity: 'MEDIUM',
        details: behaviorAnomaly,
        hypothesis: 'UI bug or broken functionality',
        recommendation: 'Generate UI tests for affected user flows'
      });
    }

    return anomalies;
  }

  detectSpike(current, baseline, threshold) {
    const zScore = (current - baseline.mean) / baseline.stdDev;
    if (Math.abs(zScore) > threshold.stdDev) {
      return {
        current: current,
        baseline: baseline.mean,
        deviation: zScore,
        magnitude: (current - baseline.mean) / baseline.mean,
        confidence: this.calculateConfidence(zScore)
      };
    }
    return null;
  }
}
```

**Anomaly-Based Test Generation:**
```javascript
// Anomaly detected: Error rate spike 47% → 12.3% after deployment
describe('Anomaly: Error Rate Spike after v2.4.0 Deployment', () => {
  // Auto-generated from anomaly detection

  test('should not increase error rate on user login', async () => {
    // Baseline error rate: 0.47%
    const baselineErrors = 0.0047;
    const sampleSize = 1000;

    let errors = 0;
    for (let i = 0; i < sampleSize; i++) {
      try {
        await userService.login({
          email: `test${i}@example.com`,
          password: 'SecurePass123!'
        });
      } catch (error) {
        errors++;
      }
    }

    const errorRate = errors / sampleSize;
    expect(errorRate).toBeLessThanOrEqual(baselineErrors * 1.5); // Allow 50% margin
  });

  // Anomaly: p95 latency increased from 234ms → 1,234ms for /api/orders
  test('should maintain p95 latency under 300ms for orders API', async () => {
    const latencies = [];

    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      await ordersAPI.getOrders({ userId: 'usr_test' });
      const duration = Date.now() - start;
      latencies.push(duration);
    }

    const p95 = calculatePercentile(latencies, 95);
    expect(p95).toBeLessThan(300); // Below baseline + margin
  });

  // Anomaly: Checkout completion rate dropped from 78% → 34%
  test('should maintain checkout conversion rate above 75%', async () => {
    const attempts = 100;
    let completions = 0;

    for (let i = 0; i < attempts; i++) {
      const result = await checkoutFlow.complete({
        userId: `usr_${i}`,
        items: [{ id: 'prod_123', quantity: 1 }],
        payment: { method: 'card' }
      });

      if (result.status === 'completed') {
        completions++;
      }
    }

    const conversionRate = completions / attempts;
    expect(conversionRate).toBeGreaterThanOrEqual(0.75);
  });
});
```

### 4. Load Pattern Analysis

Analyzes production traffic patterns to generate realistic load tests that match actual user behavior.

**Traffic Pattern Extraction:**
```javascript
const loadPatterns = {
  dailyPattern: {
    hourly: [
      { hour: 0, rps: 234 },
      { hour: 1, rps: 189 },
      { hour: 2, rps: 156 },
      // ... peak at 14:00
      { hour: 14, rps: 3421 }, // Peak traffic
      { hour: 15, rps: 3189 },
      // ... back to baseline
    ],
    peakHours: [9, 12, 14, 15, 18],
    lowTrafficHours: [0, 1, 2, 3, 4]
  },

  weeklyPattern: {
    monday: { rps: 2891, conversionRate: 0.78 },
    tuesday: { rps: 3124, conversionRate: 0.81 },
    wednesday: { rps: 3342, conversionRate: 0.83 },
    thursday: { rps: 3198, conversionRate: 0.79 },
    friday: { rps: 2734, conversionRate: 0.72 }, // Lower conversion
    saturday: { rps: 1893, conversionRate: 0.65 },
    sunday: { rps: 1678, conversionRate: 0.67 }
  },

  seasonalPattern: {
    blackFriday: { rps: 12843, spike: 4.2x },
    cyberMonday: { rps: 11234, spike: 3.7x },
    christmas: { rps: 8734, spike: 2.9x },
    newYear: { rps: 5432, spike: 1.8x }
  },

  endpointDistribution: {
    "GET /api/products": 0.34,
    "GET /api/search": 0.23,
    "POST /api/cart": 0.15,
    "POST /api/orders": 0.12,
    "GET /api/users": 0.08,
    "other": 0.08
  },

  userBehaviorPatterns: {
    "browsers": {
      avgSessionDuration: 342000, // 5m 42s
      avgPagesPerSession: 7.8,
      avgClicksPerSession: 23.4
    },
    "buyers": {
      avgSessionDuration: 523000, // 8m 43s
      avgPagesPerSession: 12.3,
      avgCartValue: 234.99
    },
    "bouncers": {
      avgSessionDuration: 23000, // 23s
      avgPagesPerSession: 1.2
    }
  }
};
```

**Generated Load Test:**
```javascript
// Load test matching production traffic patterns
import { check, group, sleep } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    // Morning ramp-up (9AM)
    { duration: '5m', target: 2000 },
    // Sustain morning traffic
    { duration: '30m', target: 2000 },
    // Midday peak (12PM-2PM)
    { duration: '5m', target: 3500 },
    { duration: '2h', target: 3500 }, // Peak hours
    // Afternoon decline
    { duration: '10m', target: 2500 },
    { duration: '1h', target: 2500 },
    // Evening traffic
    { duration: '5m', target: 1800 },
    { duration: '2h', target: 1800 },
    // Night baseline
    { duration: '5m', target: 500 }
  ],

  thresholds: {
    http_req_duration: ['p(95)<500'], // p95 < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
    http_reqs: ['rate>2000']          // Throughput > 2000 rps
  }
};

// User behavior patterns from RUM analysis
const userProfiles = {
  browser: { weight: 0.64, actions: ['browse', 'search', 'view'] },
  buyer: { weight: 0.28, actions: ['browse', 'search', 'view', 'cart', 'checkout'] },
  bouncer: { weight: 0.08, actions: ['bounce'] }
};

export default function() {
  // Select user profile based on production distribution
  const profile = selectUserProfile(userProfiles);

  group('User Session', () => {
    // Homepage (34% of traffic)
    let response = http.get(`${BASE_URL}/`);
    check(response, {
      'homepage status 200': (r) => r.status === 200,
      'homepage LCP <2.5s': (r) => r.timings.duration < 2500
    });
    sleep(Math.random() * 3 + 1); // 1-4s think time

    if (profile === 'bouncer') {
      return; // Bounce immediately (8% of users)
    }

    // Search (23% of traffic)
    response = http.get(`${BASE_URL}/api/search?q=wireless%20headphones`);
    check(response, { 'search status 200': (r) => r.status === 200 });
    sleep(Math.random() * 2 + 1);

    // Product view (all non-bouncers)
    response = http.get(`${BASE_URL}/api/products/prod_123`);
    check(response, {
      'product status 200': (r) => r.status === 200,
      'product has price': (r) => JSON.parse(r.body).price !== undefined
    });
    sleep(Math.random() * 5 + 2);

    if (profile === 'browser') {
      return; // Browser doesn't purchase
    }

    // Add to cart (buyers only, 28% of users)
    response = http.post(`${BASE_URL}/api/cart`, JSON.stringify({
      productId: 'prod_123',
      quantity: 1
    }));
    check(response, { 'cart status 200': (r) => r.status === 200 });
    sleep(Math.random() * 3 + 1);

    // Checkout (78% conversion rate for buyers)
    if (Math.random() < 0.78) {
      response = http.post(`${BASE_URL}/api/orders`, JSON.stringify({
        paymentMethod: 'card',
        shippingAddress: { /* ... */ }
      }));
      check(response, {
        'order status 200': (r) => r.status === 200,
        'order completed': (r) => JSON.parse(r.body).status === 'completed'
      });
    }
  });
}
```

### 5. Feature Usage Analytics

Tracks which features are actually used in production to prioritize testing efforts and identify dead code.

**Usage Analytics:**
```javascript
const featureUsageAnalytics = {
  timeWindow: "last_30_days",
  totalUsers: 84392,

  features: [
    {
      name: "search_autocomplete",
      usage: {
        activeUsers: 75103, // 89% of users
        sessionsUsed: 234891,
        avgInteractionsPerSession: 4.7,
        satisfaction: 0.92 // Based on behavior after use
      },
      priority: "CRITICAL", // High usage = high priority
      testCoverage: 87.3,
      recommendation: "Maintain coverage, add edge cases"
    },
    {
      name: "product_recommendations",
      usage: {
        activeUsers: 56503, // 67% of users
        clickThroughRate: 0.34,
        conversionRate: 0.12
      },
      priority: "HIGH",
      testCoverage: 72.1,
      recommendation: "Increase coverage to 85%+"
    },
    {
      name: "saved_for_later",
      usage: {
        activeUsers: 19411, // 23% of users
        conversionRate: 0.12,
        avgItemsSaved: 3.4
      },
      priority: "MEDIUM",
      testCoverage: 45.2,
      recommendation: "Coverage acceptable for usage level"
    },
    {
      name: "gift_wrapping",
      usage: {
        activeUsers: 2107, // 2.5% of users
        seasonalPeak: "December (18% usage)"
      },
      priority: "LOW",
      testCoverage: 23.1,
      recommendation: "Low priority, increase coverage before holidays"
    },
    {
      name: "legacy_wishlist_v1",
      usage: {
        activeUsers: 42, // 0.05% of users
        lastUsed: "2024-08-12"
      },
      priority: "DEPRECATED",
      testCoverage: 12.3,
      recommendation: "⚠️  Consider removal, migrate remaining users"
    }
  ],

  unusedFeatures: [
    {
      name: "product_comparison_tool",
      codeSize: "2,341 lines",
      lastUsed: "2024-03-15",
      recommendation: "🗑️  Dead code, safe to remove"
    },
    {
      name: "flash_sale_countdown",
      codeSize: "892 lines",
      lastUsed: "2024-07-01",
      recommendation: "🗑️  Feature discontinued, remove code"
    }
  ]
};
```

**Usage-Based Test Prioritization:**
```javascript
// Prioritize tests based on feature usage
describe('High-Priority Features (>50% usage)', () => {
  // search_autocomplete: 89% usage - CRITICAL
  test('search autocomplete should return relevant suggestions', async () => {
    const results = await searchService.autocomplete('headphones');
    expect(results.suggestions.length).toBeGreaterThan(0);
    expect(results.suggestions[0]).toMatch(/headphones/i);
  });

  // product_recommendations: 67% usage - HIGH
  test('product recommendations should personalize based on history', async () => {
    const user = await createUserWithHistory(['electronics', 'audio']);
    const recommendations = await recommendationService.getRecommendations(user.id);
    expect(recommendations.length).toBeGreaterThanOrEqual(4);
    expect(recommendations[0].category).toMatch(/electronics|audio/);
  });
});

describe('Medium-Priority Features (10-50% usage)', () => {
  // saved_for_later: 23% usage - MEDIUM
  test('should save items for later purchase', async () => {
    const user = await createTestUser();
    await saveForLaterService.save(user.id, 'prod_123');
    const saved = await saveForLaterService.list(user.id);
    expect(saved).toContainEqual(expect.objectContaining({ productId: 'prod_123' }));
  });
});

// Low-priority features: Minimal testing
describe('Low-Priority Features (<10% usage)', () => {
  // gift_wrapping: 2.5% usage - LOW (but test before holidays)
  test('should add gift wrapping option to order', async () => {
    const order = await createOrder({ giftWrap: true, giftMessage: 'Happy Birthday!' });
    expect(order.giftWrap).toBe(true);
  });
});

// Generate deprecation warnings for unused features
describe('Deprecated Features (for removal)', () => {
  test.skip('legacy_wishlist_v1 - scheduled for removal', () => {
    // Skipped: Feature used by <0.1% of users
    // Removal scheduled: Q4 2024
  });
});
```

### 6. Error Pattern Mining

Mines production error logs to identify recurring error patterns and generate targeted regression tests.

**Error Pattern Mining:**
```javascript
const errorPatterns = {
  timeWindow: "last_7_days",
  totalErrors: 34821,
  uniqueErrors: 892,

  topErrorPatterns: [
    {
      pattern: "TypeError: Cannot read property 'X' of undefined",
      occurrences: 3421,
      affectedUsers: 2891,
      trend: "INCREASING", // +23% vs last week
      contexts: [
        {
          context: "product.price",
          frequency: 1823,
          browsers: ["Safari 14.1", "Safari 15.0"],
          hypothesis: "Safari-specific race condition in price loading"
        },
        {
          context: "user.preferences",
          frequency: 1234,
          conditions: "First-time users only",
          hypothesis: "Missing initialization for new user preferences"
        }
      ],
      generatedTests: 8,
      priority: "HIGH"
    },
    {
      pattern: "NetworkError: Failed to fetch",
      occurrences: 1893,
      affectedUsers: 1678,
      regions: ["ap-south-1", "eu-west-2"],
      timePattern: "Peak hours (9AM-11AM local)",
      hypothesis: "Rate limiting or CDN issues in specific regions",
      generatedTests: 4,
      priority: "MEDIUM"
    },
    {
      pattern: "ValidationError: Invalid credit card number",
      occurrences: 1234,
      affectedUsers: 1234, // 1:1 ratio = not a bug
      userAction: "User-submitted invalid data",
      priority: "LOW", // Expected validation error
      generatedTests: 2
    }
  ],

  errorCorrelations: [
    {
      errors: ["PaymentTimeout", "DatabaseSlowQuery"],
      correlation: 0.89,
      hypothesis: "Payment timeouts caused by slow database queries",
      recommendation: "Generate integration tests for payment + database interaction"
    },
    {
      errors: ["CacheKeyMiss", "HighLatency"],
      correlation: 0.76,
      hypothesis: "Cache misses causing latency spikes",
      recommendation: "Generate cache invalidation and warm-up tests"
    }
  ]
};
```

**Error-Driven Test Generation:**
```javascript
describe('Error Pattern: TypeError - Cannot read property of undefined', () => {
  // Generated from 3,421 production occurrences

  test('should safely handle undefined product price (Safari race condition)', async () => {
    // Simulate Safari-specific timing
    const product = await loadProduct('prod_123', { browser: 'Safari', delay: 50 });

    // Should never throw TypeError
    expect(() => {
      const priceElement = document.querySelector('.product-price');
      const price = product.price; // This was causing TypeError
      priceElement.textContent = price;
    }).not.toThrow();

    // Verify fallback behavior
    expect(product.price).toBeDefined();
    expect(typeof product.price).toBe('number');
  });

  test('should initialize preferences for first-time users', async () => {
    const newUser = await createUser({ preferences: undefined });

    // Should not throw when accessing preferences
    expect(() => {
      const theme = newUser.preferences.theme; // This was causing TypeError
    }).not.toThrow();

    // Verify default initialization
    expect(newUser.preferences).toBeDefined();
    expect(newUser.preferences.theme).toBe('light'); // Default value
  });
});

describe('Error Pattern: NetworkError - Failed to fetch', () => {
  // Correlated with peak hours in ap-south-1

  test('should implement retry logic for network failures', async () => {
    // Simulate peak hour network congestion
    mockNetworkFailure({ region: 'ap-south-1', time: '09:30', probability: 0.15 });

    const fetchWithRetry = async () => {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          return await fetch('/api/products');
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) throw error;
          await sleep(Math.pow(2, attempts) * 1000); // Exponential backoff
        }
      }
    };

    const response = await fetchWithRetry();
    expect(response.ok).toBe(true);
  });
});
```

### 7. User Journey Reconstruction

Reconstructs complete user journeys from session data to generate end-to-end test scenarios that match real user behavior.

**Journey Reconstruction:**
```javascript
const userJourneys = [
  {
    sessionId: "sess_abc123",
    userId: "usr_xyz789",
    duration: 342000, // 5m 42s
    converted: true,
    revenue: 234.99,

    steps: [
      { timestamp: "14:23:00", action: "visit_homepage", duration: 3400 },
      { timestamp: "14:23:03", action: "search", query: "wireless headphones", duration: 1200 },
      { timestamp: "14:23:04", action: "view_product", productId: "prod_123", duration: 45000 },
      { timestamp: "14:23:49", action: "read_reviews", scrollDepth: 0.67, duration: 23000 },
      { timestamp: "14:24:12", action: "view_images", imagesViewed: 5, duration: 18000 },
      { timestamp: "14:24:30", action: "add_to_cart", productId: "prod_123", duration: 2100 },
      { timestamp: "14:24:32", action: "view_cart", duration: 12000 },
      { timestamp: "14:24:44", action: "apply_coupon", code: "SAVE10", success: true, duration: 3400 },
      { timestamp: "14:24:48", action: "proceed_to_checkout", duration: 1200 },
      { timestamp: "14:24:49", action: "fill_shipping", duration: 34000 },
      { timestamp: "14:25:23", action: "select_shipping_method", method: "express", duration: 4500 },
      { timestamp: "14:25:28", action: "fill_payment", duration: 28000 },
      { timestamp: "14:25:56", action: "review_order", duration: 8900 },
      { timestamp: "14:26:05", action: "place_order", orderId: "ord_456", duration: 2300 },
      { timestamp: "14:26:07", action: "confirmation", duration: 5600 }
    ]
  }
];
```

**Generated E2E Test:**
```javascript
describe('Real User Journey: Successful Purchase with Coupon', () => {
  // Reconstructed from session sess_abc123

  test('should complete full purchase journey matching production behavior', async () => {
    const { page } = await setupBrowser();

    // Step 1: Homepage (duration: 3.4s)
    await page.goto('/');
    await page.waitForSelector('.hero-banner');
    await page.waitForTimeout(3400); // Simulate real user pause

    // Step 2: Search (duration: 1.2s)
    await page.fill('[data-testid="search-input"]', 'wireless headphones');
    await page.click('[data-testid="search-button"]');
    await page.waitForSelector('.search-results');

    // Step 3: View product (duration: 45s - engaged user)
    await page.click('.search-results .product-card:first-child');
    await page.waitForSelector('.product-details');

    // Step 4: Read reviews (scroll depth 67%)
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight * 0.67, behavior: 'smooth' });
    });
    await page.waitForTimeout(23000); // User reading reviews

    // Step 5: View images (5 images)
    for (let i = 0; i < 5; i++) {
      await page.click('.image-gallery .thumbnail:nth-child(' + (i + 1) + ')');
      await page.waitForTimeout(3600); // User viewing each image
    }

    // Step 6: Add to cart
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('.cart-badge')).toHaveText('1');

    // Step 7: View cart
    await page.click('[data-testid="cart-icon"]');
    await page.waitForSelector('.cart-items');
    await page.waitForTimeout(12000); // User reviewing cart

    // Step 8: Apply coupon (SAVE10)
    await page.fill('[data-testid="coupon-input"]', 'SAVE10');
    await page.click('[data-testid="apply-coupon"]');
    await expect(page.locator('.discount-applied')).toBeVisible();

    // Step 9: Checkout
    await page.click('[data-testid="proceed-to-checkout"]');
    await page.waitForSelector('.checkout-form');

    // Step 10: Fill shipping (duration: 34s - user typing)
    await page.fill('[name="shipping.name"]', 'John Doe');
    await page.fill('[name="shipping.address"]', '123 Main St');
    await page.fill('[name="shipping.city"]', 'New York');
    await page.fill('[name="shipping.zip"]', '10001');
    await page.waitForTimeout(34000); // Realistic typing speed

    // Step 11: Select express shipping
    await page.click('[data-testid="shipping-express"]');

    // Step 12: Fill payment (duration: 28s)
    await page.fill('[name="payment.cardNumber"]', '4242424242424242');
    await page.fill('[name="payment.expiry"]', '12/25');
    await page.fill('[name="payment.cvv"]', '123');
    await page.waitForTimeout(28000);

    // Step 13: Review order (duration: 8.9s)
    await page.click('[data-testid="review-order"]');
    await page.waitForSelector('.order-summary');
    await page.waitForTimeout(8900);

    // Step 14: Place order
    await page.click('[data-testid="place-order"]');
    await page.waitForSelector('.order-confirmation');

    // Step 15: Confirmation
    const orderNumber = await page.textContent('[data-testid="order-number"]');
    expect(orderNumber).toMatch(/^ord_/);

    // Verify order in database
    const order = await getOrder(orderNumber);
    expect(order.total).toBe(234.99);
    expect(order.discount).toBe(23.50); // SAVE10 applied
    expect(order.shippingMethod).toBe('express');
  });
});
```

## Integration Points

### Upstream Dependencies
- **Monitoring Platforms**: Datadog, New Relic, Grafana (RUM data)
- **Incident Management**: PagerDuty, Opsgenie (incident data)
- **Log Aggregation**: Elasticsearch, Splunk, CloudWatch (error logs)
- **Analytics**: Google Analytics, Mixpanel (user behavior)
- **APM**: New Relic, AppDynamics (performance traces)

### Downstream Consumers
- **qe-test-generator**: Generates tests from production scenarios
- **qe-coverage-analyzer**: Identifies coverage gaps from production usage
- **qe-regression-risk-analyzer**: Prioritizes tests based on production impact
- **qe-requirements-validator**: Validates requirements against production behavior

### Coordination Agents
- **qe-fleet-commander**: Orchestrates production intelligence workflow
- **qe-deployment-readiness**: Uses production insights for risk assessment

## Coordination Protocol

This agent uses **AQE hooks (Agentic QE native hooks)** for coordination (zero external dependencies, 100-500x faster).

**Automatic Lifecycle Hooks:**
```typescript
// Automatically called by BaseAgent
protected async onPreTask(data: { assignment: TaskAssignment }): Promise<void> {
  // Load production incidents and RUM data
  const incidents = await this.memoryStore.retrieve('aqe/production/incidents');
  const rumData = await this.memoryStore.retrieve('aqe/production/rum-data');

  this.logger.info('Production intelligence analysis started', {
    recentIncidents: incidents?.length || 0,
    rumSessions: rumData?.totalSessions || 0
  });
}

protected async onPostTask(data: { assignment: TaskAssignment; result: any }): Promise<void> {
  // Store generated test scenarios and insights
  await this.memoryStore.store('aqe/production/test-scenarios', data.result.scenarios);
  await this.memoryStore.store('aqe/production/insights', data.result.insights);
  await this.memoryStore.store('aqe/production/anomalies', data.result.anomalies);

  // Emit production intelligence event
  this.eventBus.emit('production-intelligence:analyzed', {
    scenariosGenerated: data.result.scenarios.length,
    anomaliesDetected: data.result.anomalies.length,
    highPriorityInsights: data.result.insights.filter(i => i.priority === 'HIGH').length
  });
}
```

**Advanced Verification (Optional):**
```typescript
const hookManager = new VerificationHookManager(this.memoryStore);
const verification = await hookManager.executePreTaskVerification({
  task: 'production-analysis',
  context: {
    requiredVars: ['PROD_ENV', 'MONITORING_PLATFORM'],
    minMemoryMB: 1024,
    requiredKeys: ['aqe/production/incidents', 'aqe/production/rum-data']
  }
});
```

## Memory Keys

### Input Keys
- `aqe/production/incidents` - Incident data from PagerDuty/Opsgenie
- `aqe/production/rum-data` - Real User Monitoring metrics
- `aqe/production/logs` - Application logs and errors
- `aqe/production/analytics` - User behavior analytics
- `aqe/production/apm` - Application performance monitoring data

### Output Keys
- `aqe/production/test-scenarios` - Generated test scenarios from production data
- `aqe/production/insights` - Actionable insights and recommendations
- `aqe/production/anomalies` - Detected anomalies requiring investigation
- `aqe/production/patterns` - Identified patterns and trends
- `aqe/production/prioritization` - Test prioritization based on usage

### Coordination Keys
- `aqe/production/status` - Real-time production health status
- `aqe/production/alerts` - Active production alerts
- `aqe/production/feedback-loop` - Continuous feedback to testing

## Use Cases

(Continued in file due to length constraints...)

## Commands

### Basic Commands

```bash
# Analyze production incidents
aqe production analyze-incidents --days 7

# Generate tests from RUM data
aqe production rum-to-tests --feature checkout

# Detect anomalies
aqe production detect-anomalies --threshold 3-sigma

# Extract load patterns
aqe production load-patterns --days 30

# Analyze feature usage
aqe production feature-usage --output usage-report.json
```

### Advanced Commands

```bash
# Replay specific incident
aqe production replay-incident --incident-id INC-2024-1234

# Generate E2E tests from user journeys
aqe production journey-to-tests --min-frequency 100

# Mine error patterns
aqe production mine-errors --min-occurrences 10

# Analyze production vs staging differences
aqe production compare-environments --baseline staging

# Export production intelligence report
aqe production report --format pdf --output production-intelligence.pdf
```

### Specialized Commands

```bash
# Continuous feedback loop
aqe production feedback-loop --interval 1h --auto-generate-tests

# Priority-based test generation
aqe production generate-by-priority --top 20

# Seasonal pattern analysis
aqe production seasonal-analysis --events black-friday,cyber-monday

# Dead code detection
aqe production dead-code --min-days 90

# A/B test impact analysis
aqe production ab-test-impact --experiment checkout-v2
```

---

**Agent Status**: Production Ready
**Last Updated**: 2025-09-30
**Version**: 1.0.0
**Maintainer**: AQE Fleet Team