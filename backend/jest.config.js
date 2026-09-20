module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  globalSetup: './__tests__/globalSetup.js',
  globalTeardown: './__tests__/globalTeardown.js',
  setupFilesAfterEnv: ['./__tests__/setupAfterEnv.js'],
  testTimeout: 20000,
};
