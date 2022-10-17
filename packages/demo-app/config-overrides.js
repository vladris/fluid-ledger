const path = require("path");

module.exports = function override(config, env) {
    if (!config.resolve) {
      config.resolve = {};
    }
  
    if (!config.resolve.fallback) {
      config.resolve.fallback = {};
    }
  
    config.resolve.fallback.buffer = require.resolve('buffer/');

    config.resolve.modules = [
      path.join(__dirname, ".."),
      path.join(__dirname, "..", ".."),
      path.join(__dirname, "..", "dds"),
      ...config.resolve.modules
    ]

    return config;
};
