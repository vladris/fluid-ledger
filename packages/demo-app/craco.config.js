module.exports = {
  webpack: {
    alias: {},
    plugins: [],
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        "buffer": require.resolve('safe-buffer/')
      }

      return webpackConfig;
    },
  }
};