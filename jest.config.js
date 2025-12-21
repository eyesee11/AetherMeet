// Simple Jest configuration for testing
module.exports = {
  // Run tests in Node.js environment (not browser)
  testEnvironment: 'node',

  // Set NODE_ENV to test mode
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },

  // Generate coverage report when running tests
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Which files to check for coverage
  collectCoverageFrom: [
    'routes/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
    'middleware/**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!tests/**'
  ],

  // Where to find test files
  testMatch: [
    '**/tests/**/*.test.js'
  ],

  // Run setup file before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // How long to wait before timing out (30 seconds)
  testTimeout: 30000,

  // Show detailed test results
  verbose: true,

  // Clean up mocks between each test
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};

