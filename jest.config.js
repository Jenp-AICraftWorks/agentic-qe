module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // CRITICAL: Global setup/teardown to prevent process.cwd() errors
  globalSetup: '<rootDir>/jest.global-setup.ts',
  globalTeardown: '<rootDir>/jest.global-teardown.ts',

  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        skipLibCheck: true,
        skipDefaultLibCheck: true
      },
      isolatedModules: true
    }]
  },

  // CRITICAL: Coverage configuration - enabled via --coverage flag
  collectCoverage: false, // Set to true via CLI --coverage flag
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/__mocks__/**',
    '!src/**/types/**',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '<rootDir>/tests/setup.ts'],
  testEnvironmentOptions: {
    // Use explicit path instead of process.cwd() to prevent initialization errors
    cwd: '/workspaces/agentic-qe-cf'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@agents/(.*)$': '<rootDir>/src/agents/$1',
    '^@cli/(.*)$': '<rootDir>/src/cli/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    // Map .js imports to .ts source files for Jest
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  // Memory optimization settings - Enhanced for DevPod
  maxWorkers: 1, // Reduced from 2 to 1 for maximum safety
  workerIdleMemoryLimit: '384MB', // More aggressive: 512MB → 384MB
  testTimeout: 30000, // Increased: 15s → 20s for better cleanup time
  cache: true, // Enable caching to reduce compilation overhead
  cacheDirectory: '/tmp/jest-cache', // Explicit cache location
  maxConcurrency: 2, // Limit concurrent test suites
  bail: false, // Continue on test failures to complete cleanup
  clearMocks: true, // Auto-clear mocks between tests
  resetMocks: true, // Reset mock state between tests
  restoreMocks: true, // Restore original implementations

  // Advanced leak detection - Balanced approach
  detectLeaks: false, // Disabled - too aggressive for integration tests
  detectOpenHandles: true, // Find unclosed resources
  forceExit: false, // Allow graceful exit

  // Transform faker-js/faker and uuid ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(@faker-js|inquirer|cli-cursor|cli-spinners|ora|chalk|strip-ansi|ansi-regex|is-fullwidth-code-point|string-width|wrap-ansi|cliui|uuid)/)'
  ],

  // Module handling - reduce loading overhead
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    '<rootDir>/node_modules/.cache/'
  ],

  // Test path ignoring to reduce discovery overhead
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '\\.skip\\.(test|spec)\\.(ts|js)$'
  ],

  // Custom reporters for memory tracking
  reporters: [
    'default',
    ['<rootDir>/tests/utils/memory-reporter.js', {
      enabled: process.env.TRACK_MEMORY === 'true'
    }]
  ],

  // Force garbage collection between test files
  testSequencer: '<rootDir>/tests/sequencers/MemorySafeSequencer.js',

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};