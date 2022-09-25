module.exports = function override(config, env) {
    if (!config.resolve) {
      config.resolve = {};
    }
  
    if (!config.resolve.fallback) {
      config.resolve.fallback = {};
    }
  
    config.resolve.fallback.buffer = require.resolve('buffer/');
  
    //do stuff with the webpack config...
    return config;
};
  
