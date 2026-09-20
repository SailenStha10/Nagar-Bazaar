module.exports = async () => {
  if (global.__MONGOINSTANCE) {
    await global.__MONGOINSTANCE.stop();
  }
};
