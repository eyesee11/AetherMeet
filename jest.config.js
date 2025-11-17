module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Set NODE_ENV to test
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },

  // Coverage settings
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'routes/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
    'middleware/**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!tests/**'
  ],

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: false
};
