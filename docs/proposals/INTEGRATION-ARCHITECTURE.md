# Integration Architecture: AICraftworksOrg Agent Team Framework

**Date**: 2025-10-30  
**Version**: 1.0  
**Related**: [Integration Proposal](./AICRAFTWORKS-INTEGRATION-PROPOSAL.md) | [Executive Summary](./EXECUTIVE-SUMMARY.md)

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   AICraftworksOrg Agent Team Framework (ATF)                 │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Unified Orchestration Layer                       │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────┐ │   │
│  │  │   Task      │  │   Topology   │  │   Agent     │  │ Session  │ │   │
│  │  │  Router     │  │   Manager    │  │  Registry   │  │ Manager  │ │   │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  └──────────┘ │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────┐ │   │
│  │  │ Load        │  │   Circuit    │  │   Health    │  │  Event   │ │   │
│  │  │ Balancer    │  │   Breaker    │  │   Monitor   │  │  Bus     │ │   │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  └──────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                 ▲                                             │
│                                 │                                             │
│                     ┌───────────┼───────────┐                               │
│                     │           │           │                               │
│  ┌──────────────────▼──┐  ┌────▼──────┐  ┌▼─────────────────────┐         │
│  │  Claude Flow Agents │  │ Agentic QE│  │  Extension Agents    │         │
│  │  (54 agents)        │  │  Agents   │  │  (Custom domains)    │         │
│  │                     │  │(17 agents)│  │                       │         │
│  │ • Core Dev (5)      │  │           │  │ • Domain-specific    │         │
│  │ • Coordination (5)  │  │ • Core    │  │ • Third-party        │         │
│  │ • Consensus (7)     │  │   Testing │  │ • Plugins            │         │
│  │ • Performance (5)   │  │ • Perf &  │  │ • Custom workflows   │         │
│  │ • GitHub (9)        │  │   Security│  │                       │         │
│  │ • SPARC (6)         │  │ • Planning│  │                       │         │
│  │ • Specialized (17)  │  │ • Advanced│  │                       │         │
│  └─────────────────────┘  └───────────┘  └───────────────────────┘         │
│                     │           │           │                               │
│  ┌──────────────────▼───────────▼───────────▼──────────────────────┐       │
│  │                    Shared Services Layer                          │       │
│  │                                                                    │       │
│  │  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐         │       │
│  │  │    Memory    │  │    Learning   │  │   Routing    │         │       │
│  │  │    Store     │  │    System     │  │   Engine     │         │       │
│  │  │              │  │               │  │              │         │       │
│  │  │ • AgentDB    │  │ • Q-Learning  │  │ • Multi-Model│         │       │
│  │  │ • Partitions │  │ • Pattern Bank│  │ • Cost Track │         │       │
│  │  │ • TTL/Cache  │  │ • A/B Testing │  │ • Budgets    │         │       │
│  │  └──────────────┘  └───────────────┘  └──────────────┘         │       │
│  │                                                                    │       │
│  │  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐         │       │
│  │  │     MCP      │  │  Observability│  │   Security   │         │       │
│  │  │    Server    │  │               │  │              │         │       │
│  │  │              │  │ • Metrics     │  │ • Auth/Authz │         │       │
│  │  │ • 54+ Tools  │  │ • Logging     │  │ • Rate Limit │         │       │
│  │  │ • Protocol   │  │ • Tracing     │  │ • Encryption │         │       │
│  │  └──────────────┘  └───────────────┘  └──────────────┘         │       │
│  └────────────────────────────────────────────────────────────────┘       │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                     Infrastructure Layer                            │    │
│  │                                                                      │    │
│  │  ┌───────────┐  ┌───────────┐  ┌────────────┐  ┌──────────────┐  │    │
│  │  │ AgentDB   │  │ Event Bus │  │ Metrics    │  │  Access      │  │    │
│  │  │ (SQLite)  │  │ (In-Proc) │  │ Collector  │  │  Control     │  │    │
│  │  └───────────┘  └───────────┘  └────────────┘  └──────────────┘  │    │
│  │                                                                      │    │
│  │  ┌───────────┐  ┌───────────┐  ┌────────────┐  ┌──────────────┐  │    │
│  │  │  Logger   │  │  Storage  │  │  Network   │  │   Process    │  │    │
│  │  │ (Winston) │  │  Manager  │  │  Manager   │  │   Manager    │  │    │
│  │  └───────────┘  └───────────┘  └────────────┘  └──────────────┘  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Unified Orchestration Layer

**Purpose**: Central brain for agent coordination

**Components**:

```typescript
// Task Router
interface TaskRouter {
  route(task: Task): Agent;
  selectAgent(criteria: RoutingCriteria): Agent;
  balanceLoad(): void;
}

// Topology Manager
interface TopologyManager {
  current: TopologyType;
  select(context: TaskContext): TopologyType;
  optimize(metrics: Metrics): void;
  // Supports: hierarchical, mesh, ring, adaptive
}

// Agent Registry
interface AgentRegistry {
  register(agent: Agent): void;
  discover(): Agent[];
  query(filter: AgentFilter): Agent[];
  healthCheck(): HealthReport;
}

// Session Manager
interface SessionManager {
  create(config: SessionConfig): Session;
  save(sessionId: string): Promise<void>;
  restore(sessionId: string): Promise<Session>;
  cleanup(): void;
}
```

**Responsibilities**:
- ✅ Route tasks to optimal agents
- ✅ Manage agent lifecycle (spawn, monitor, shutdown)
- ✅ Select and optimize topology
- ✅ Handle failures with circuit breakers
- ✅ Balance load across agents
- ✅ Persist and restore sessions

---

### 2. Agent Pools

#### 2.1 Claude Flow Agents (54 agents)

**Categories**:

| Category | Count | Examples |
|----------|-------|----------|
| Core Development | 5 | coder, reviewer, tester, planner, researcher |
| Swarm Coordination | 5 | hierarchical-coordinator, mesh-coordinator |
| Consensus | 7 | byzantine-coordinator, raft-manager |
| Performance | 5 | perf-analyzer, benchmarker |
| GitHub | 9 | pr-manager, issue-tracker, release-manager |
| SPARC | 6 | sparc-coord, specification, architecture |
| Specialized | 17 | backend-dev, mobile-dev, ml-developer |

**Integration Method**:
```typescript
class ClaudeFlowAgentAdapter implements Agent {
  constructor(private nativeAgent: ClaudeFlowAgent) {}
  
  async execute(task: Task): Promise<Result> {
    // Wrap Claude Flow agent with UAP
    return await this.nativeAgent.run(task);
  }
}
```

#### 2.2 Agentic QE Agents (17 agents)

**Categories**:

| Category | Count | Examples |
|----------|-------|----------|
| Core Testing | 5 | test-generator, test-executor, coverage-analyzer |
| Performance & Security | 2 | performance-tester, security-scanner |
| Strategic Planning | 3 | requirements-validator, production-intelligence |
| Deployment | 1 | deployment-readiness |
| Advanced Testing | 4 | regression-analyzer, flaky-test-hunter |
| Specialized | 2 | visual-tester, chaos-engineer |

**Integration Method**:
```typescript
class AQEAgentAdapter implements Agent {
  constructor(private baseAgent: BaseAgent) {}
  
  async execute(task: Task): Promise<Result> {
    // Already compatible with UAP
    return await this.baseAgent.executeTask(task);
  }
}
```

#### 2.3 Extension Agents (Unlimited)

**Purpose**: Allow custom domain-specific agents

**Plugin Architecture**:
```typescript
interface AgentPlugin {
  name: string;
  version: string;
  category: string;
  capabilities: string[];
  
  initialize(config: PluginConfig): Promise<void>;
  createAgent(config: AgentConfig): Agent;
}

// Example: Database migration agent
class DBMigrationPlugin implements AgentPlugin {
  name = 'db-migration-agent';
  category = 'database';
  capabilities = ['schema-migration', 'data-migration', 'rollback'];
  
  createAgent(config: AgentConfig): Agent {
    return new DBMigrationAgent(config);
  }
}
```

---

### 3. Shared Services Layer

#### 3.1 Memory Store

**Technology**: AgentDB (SQLite-based)

**Features**:
- Partitioned namespaces (isolation)
- TTL-based expiration
- Cross-agent sharing
- Query capabilities

**Schema**:
```typescript
interface MemoryEntry {
  key: string;
  value: any;
  partition: string;
  ttl?: number;
  createdAt: number;
  updatedAt: number;
  metadata: {
    agentId?: string;
    sessionId?: string;
    tags?: string[];
  };
}

// Memory API
interface MemoryStore {
  store(key: string, value: any, options?: StoreOptions): Promise<void>;
  retrieve(key: string, options?: RetrieveOptions): Promise<any>;
  query(pattern: string, filter?: Filter): Promise<MemoryEntry[]>;
  delete(key: string): Promise<void>;
}
```

**Partitions**:
```
/aqe/                    # QE agent namespace
  /test-plan/            # Test planning data
  /coverage/             # Coverage results
  /quality/              # Quality metrics
  /patterns/             # Test patterns

/dev/                    # Development namespace
  /code/                 # Code artifacts
  /reviews/              # Review results
  /builds/               # Build status

/shared/                 # Cross-agent data
  /learning/             # Shared learning
  /costs/                # Cost tracking
  /metrics/              # Performance metrics
```

#### 3.2 Learning System

**Algorithm**: Q-Learning with experience replay

**Components**:
```typescript
interface LearningSystem {
  // Pattern management
  storePattern(pattern: Pattern, metadata: Metadata): Promise<void>;
  queryPatterns(query: PatternQuery): Promise<Pattern[]>;
  
  // Reward feedback
  recordOutcome(taskId: string, outcome: Outcome): Promise<void>;
  updateQValue(state: State, action: Action, reward: number): void;
  
  // Strategy selection
  selectStrategy(context: Context): Promise<Strategy>;
  
  // Cross-agent learning
  shareKnowledge(from: Agent, to: Agent[]): Promise<void>;
  syncLearning(): Promise<void>;
}

// Pattern structure
interface Pattern {
  id: string;
  type: 'test' | 'code' | 'review' | 'deployment';
  framework?: string;
  content: string;
  metadata: {
    usageCount: number;
    successRate: number;
    avgDuration: number;
    tags: string[];
  };
}
```

**Learning Flow**:
```
1. Agent executes task
2. Record outcome (success/failure, duration, cost)
3. Update Q-values for state-action pair
4. Store successful patterns in pattern bank
5. Share learning with similar agents
6. Recommend improved strategies for future tasks
```

#### 3.3 Routing Engine

**Purpose**: Intelligent model selection for cost optimization

**Models Supported**:
- GPT-3.5 Turbo (simple tasks)
- GPT-4 (complex tasks)
- Claude Haiku (fast, cost-effective)
- Claude Sonnet 4.5 (highest quality)

**Routing Logic**:
```typescript
interface RoutingEngine {
  selectModel(task: Task): ModelSelection;
  trackCost(taskId: string, cost: number): void;
  getCostReport(timeframe: TimeFrame): CostReport;
  enforceBudget(limit: number): void;
}

// Model selection
class SmartRouter {
  selectModel(task: Task): ModelSelection {
    const complexity = this.analyzeComplexity(task);
    
    if (complexity < 30) return 'gpt-3.5-turbo';      // $0.0004
    if (complexity < 60) return 'claude-haiku';       // $0.0008
    if (complexity < 85) return 'gpt-4';              // $0.0048
    return 'claude-sonnet-4.5';                       // $0.0065
  }
  
  analyzeComplexity(task: Task): number {
    let score = 0;
    
    // Code size
    score += Math.min(task.codeLines / 100, 20);
    
    // Dependencies
    score += Math.min(task.dependencies.length * 2, 20);
    
    // Task type
    if (task.type === 'security') score += 30;
    if (task.type === 'architecture') score += 20;
    if (task.type === 'unit-test') score += 10;
    
    // Historical difficulty
    score += this.getHistoricalDifficulty(task) * 30;
    
    return Math.min(score, 100);
  }
}
```

**Cost Tracking**:
```typescript
interface CostReport {
  period: TimeFrame;
  totalCost: number;
  taskCount: number;
  avgCostPerTask: number;
  breakdown: {
    model: string;
    cost: number;
    percentage: number;
  }[];
  savings: {
    baseline: number;      // Cost if always using GPT-4
    actual: number;        // Actual cost with routing
    percentage: number;    // Savings percentage
  };
}
```

#### 3.4 MCP Server

**Tools Organization**:
```
/mcp/tools/
  /qe/
    test_generate.ts           # Generate tests
    test_execute.ts            # Execute tests
    coverage_analyze.ts        # Analyze coverage
    quality_gate.ts            # Quality gate check
    flaky_detect.ts            # Detect flaky tests
    pattern_query.ts           # Query patterns
    learning_status.ts         # Learning metrics
    routing_dashboard.ts       # Cost dashboard
    
  /development/
    code_generate.ts           # Generate code
    code_review.ts             # Review code
    pr_manage.ts               # Manage PRs
    issue_track.ts             # Track issues
    sparc_execute.ts           # SPARC workflow
    
  /operations/
    deploy_check.ts            # Deployment readiness
    chaos_inject.ts            # Chaos testing
    monitor_health.ts          # Health monitoring
    
  /shared/
    memory_store.ts            # Memory operations
    metrics_collect.ts         # Metrics collection
    log_query.ts               # Log querying
```

**Tool Interface**:
```typescript
interface MCPTool {
  name: string;
  description: string;
  parameters: JSONSchema;
  category: 'qe' | 'development' | 'operations' | 'shared';
  
  execute(params: any): Promise<ToolResult>;
}

// Example: test_generate tool
const testGenerateTool: MCPTool = {
  name: 'test_generate',
  description: 'Generate comprehensive tests for code module',
  parameters: {
    type: 'object',
    properties: {
      modulePath: { type: 'string' },
      framework: { type: 'string', enum: ['jest', 'mocha', 'vitest'] },
      coverageTarget: { type: 'number', minimum: 0, maximum: 100 }
    },
    required: ['modulePath']
  },
  category: 'qe',
  
  async execute(params) {
    const agent = registry.getAgent('qe-test-generator');
    return await agent.execute({
      type: 'generate-tests',
      ...params
    });
  }
};
```

---

## Data Flow Diagrams

### Task Execution Flow

```
User Request
    │
    ▼
┌───────────────┐
│ CLI/API       │
│ Entry Point   │
└───────┬───────┘
        │
        ▼
┌───────────────────┐
│ Task Router       │
│ - Parse request   │
│ - Analyze context │
└─────────┬─────────┘
          │
          ▼
┌─────────────────────┐
│ Agent Registry      │
│ - Find capable      │
│ - Check health      │
│ - Load balance      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────┐
│ Agent                   │
│ - Execute task          │
│ - Use MCP tools         │
│ - Access memory         │
│ - Query learning system │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ Result Processing       │
│ - Store in memory       │
│ - Record learning       │
│ - Track costs           │
│ - Emit events           │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────┐
│ Return Result   │
│ to User         │
└─────────────────┘
```

### Learning Flow

```
Task Execution
    │
    ▼
┌───────────────────┐
│ Outcome Recorded  │
│ - Success/Failure │
│ - Duration        │
│ - Cost            │
│ - Metrics         │
└─────────┬─────────┘
          │
          ▼
┌─────────────────────────┐
│ Q-Learning Update       │
│ - Update Q-values       │
│ - Adjust strategy       │
│ - Exploration vs exploit│
└─────────┬───────────────┘
          │
          ├────────────────────┐
          │                    │
          ▼                    ▼
┌─────────────────┐  ┌─────────────────────┐
│ Pattern Storage │  │ Knowledge Sharing   │
│ - If successful │  │ - Share with similar│
│ - Store pattern │  │   agents            │
│ - Tag metadata  │  │ - Update global     │
└─────────────────┘  │   learning          │
                      └─────────────────────┘
```

### Cost Optimization Flow

```
Task Received
    │
    ▼
┌───────────────────────┐
│ Complexity Analysis   │
│ - Code size           │
│ - Dependencies        │
│ - Task type           │
│ - Historical data     │
└─────────┬─────────────┘
          │
          ▼
┌───────────────────────┐
│ Model Selection       │
│ - GPT-3.5: simple     │
│ - Haiku: moderate     │
│ - GPT-4: complex      │
│ - Sonnet: critical    │
└─────────┬─────────────┘
          │
          ▼
┌───────────────────────┐
│ Execute with Model    │
│ - Track usage         │
│ - Measure cost        │
│ - Monitor quality     │
└─────────┬─────────────┘
          │
          ▼
┌───────────────────────┐
│ Cost Recording        │
│ - Update totals       │
│ - Calculate savings   │
│ - Check budget        │
│ - Generate reports    │
└───────────────────────┘
```

---

## Integration Patterns

### Pattern 1: Agent Wrapper

**Purpose**: Adapt existing agents to Universal Agent Protocol (UAP)

```typescript
// Wrapper for existing agents
class AgentAdapter implements Agent {
  constructor(
    private legacyAgent: any,
    private type: 'claude-flow' | 'aqe' | 'custom'
  ) {}
  
  async execute(task: Task): Promise<Result> {
    // Pre-execution
    await this.hooks.preTask(task);
    
    // Execution (adapt based on type)
    let result;
    if (this.type === 'aqe') {
      result = await this.legacyAgent.executeTask(task);
    } else if (this.type === 'claude-flow') {
      result = await this.legacyAgent.run(task);
    }
    
    // Post-execution
    await this.hooks.postTask(task, result);
    
    return result;
  }
}
```

### Pattern 2: Memory Sharing

**Purpose**: Enable cross-agent memory access with proper isolation

```typescript
// Memory partitioning
class PartitionedMemory implements MemoryStore {
  async store(key: string, value: any, options: StoreOptions) {
    const partition = options.partition || 'default';
    const fullKey = `${partition}/${key}`;
    
    // Check permissions
    if (!this.hasWriteAccess(fullKey, options.agentId)) {
      throw new Error('Permission denied');
    }
    
    // Store with metadata
    await this.db.store(fullKey, {
      value,
      partition,
      agentId: options.agentId,
      ttl: options.ttl,
      timestamp: Date.now()
    });
  }
  
  async retrieve(key: string, options: RetrieveOptions) {
    const partition = options.partition || 'default';
    const fullKey = `${partition}/${key}`;
    
    // Check permissions
    if (!this.hasReadAccess(fullKey, options.agentId)) {
      throw new Error('Permission denied');
    }
    
    const entry = await this.db.retrieve(fullKey);
    
    // Check TTL
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      await this.delete(fullKey);
      return null;
    }
    
    return entry.value;
  }
}
```

### Pattern 3: Event-Driven Coordination

**Purpose**: Async agent coordination via events

```typescript
// Event bus for agent coordination
class AgentEventBus {
  private handlers = new Map<string, Handler[]>();
  
  on(event: string, handler: Handler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }
  
  async emit(event: string, data: any): Promise<void> {
    const handlers = this.handlers.get(event) || [];
    
    // Execute handlers in parallel
    await Promise.all(
      handlers.map(handler => handler(data))
    );
  }
}

// Example: Test completion triggers coverage analysis
eventBus.on('test:completed', async (data) => {
  const coverageAgent = registry.getAgent('qe-coverage-analyzer');
  await coverageAgent.execute({
    type: 'analyze-coverage',
    testResults: data.results
  });
});
```

---

## Configuration Examples

### Framework Configuration

```json
{
  "framework": {
    "name": "AICraftworksOrg Agent Team Framework",
    "version": "1.0.0",
    "topology": "adaptive",
    "maxAgents": 50
  },
  "agents": {
    "autoDiscovery": true,
    "loadBalancing": "capability-based",
    "healthCheckInterval": 30000
  },
  "learning": {
    "enabled": true,
    "algorithm": "q-learning",
    "explorationRate": 0.1,
    "discountFactor": 0.9
  },
  "routing": {
    "enabled": true,
    "defaultModel": "gpt-3.5-turbo",
    "costTracking": true,
    "budgetLimit": 100.0
  },
  "storage": {
    "type": "sqlite",
    "path": "./.atf/state/memory.db",
    "ttl": 86400
  },
  "observability": {
    "logging": {
      "level": "info",
      "outputs": ["console", "file"]
    },
    "metrics": {
      "enabled": true,
      "interval": 60000
    }
  }
}
```

### Agent Configuration

```json
{
  "agentId": "qe-test-generator-001",
  "type": "qe-test-generator",
  "category": "qe",
  "capabilities": [
    "unit-test-generation",
    "integration-test-generation",
    "jest",
    "mocha",
    "vitest"
  ],
  "config": {
    "defaultFramework": "jest",
    "coverageTarget": 95,
    "parallelism": 4
  },
  "resources": {
    "maxMemory": "2GB",
    "timeout": 300000
  }
}
```

---

## Deployment Architecture

### Development Environment

```
Developer Machine
├── .atf/                    # Framework root
│   ├── config/              # Local configuration
│   ├── state/               # Local state/memory
│   └── logs/                # Local logs
├── node_modules/
│   └── @aicraftworks/atf/   # Framework package
└── project files
```

### CI/CD Environment

```
CI/CD Pipeline
├── GitHub Actions/GitLab CI
│   ├── Install ATF
│   ├── Run tests via atf qe test
│   ├── Check coverage via atf qe coverage
│   ├── Quality gate via atf qe quality-gate
│   └── Deploy on success
└── Shared state in CI cache
```

### Production Environment

```
Production Infrastructure
├── API Server (atf serve)
│   ├── REST API for agent coordination
│   ├── WebSocket for real-time updates
│   └── MCP server for tool access
├── Agent Pool
│   ├── Persistent agents (always running)
│   └── On-demand agents (spawn as needed)
├── Shared Storage
│   ├── PostgreSQL for persistent data
│   ├── Redis for caching
│   └── S3 for artifacts
└── Monitoring
    ├── Prometheus metrics
    ├── Grafana dashboards
    └── AlertManager
```

---

## Next Steps

1. **Review Architecture**: Validate with stakeholders
2. **Prototype Core**: Build orchestration layer prototype
3. **Test Integration**: Validate agent adapters work
4. **Iterate**: Refine based on feedback

---

**Version**: 1.0  
**Last Updated**: 2025-10-30  
**Next Review**: After stakeholder feedback
