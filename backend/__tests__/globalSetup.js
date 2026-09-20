const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const instance = await MongoMemoryServer.create();
  global.__MONGOINSTANCE = instance;
  process.env.MONGODB_URI = instance.getUri();
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.NODE_ENV = 'test';
};
