module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/routes/',
    '/src/'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/routes/test.js',
    '!**/node_modules/**'
  ],
  verbose: true
};